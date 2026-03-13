# Offer Page – Entry Flows (Direct, Email, SMS)

The offer page (`/customer/application-result`) can be reached in three ways. All end on the **same** offer page and use the **same** offers API; only the first-time parameters differ. After offers load, Modify / Accept work the same in every case.

---

## 1. Direct (affiliate redirect)

**Typical URL:**  
`https://offers.loantube.com/customer/application-result?webtoken=xyz123...`

**Who uses it:** Affiliates redirect users with a link that includes the lead’s webtoken (tag).

**Flow:**
- User lands on `/customer/application-result?webtoken=...`
- App reads `webtoken` from the query.
- App calls:  
  `GET /api/leads/application-result?tag={webtoken}`
- Response includes offers and a `tag`; app keeps that for Modify / Accept.

**Required:** `webtoken` in the URL.

---

## 2. Email campaign

**Typical URL (from email template):**  
`{{APPURL}}/customer/viewloandetails?token1={{params.key1}}&token2={{params.key2}}&utm_source=brevo&utm_campaign=Affiliate Lead Email&utm_medium=email`

**Who uses it:** Email campaigns (e.g. Brevo) with a “Check loan offers” button.

**Flow:**
1. User clicks the link and lands on **`/customer/viewloandetails`** with `token1`, `token2`, and UTM params.
2. **ViewLoandetailsRedirect** runs:
   - Reads **token2** as `applicationId`, plus `utm_source`, `utm_medium`, `utm_campaign`.
   - Redirects to:  
     `/customer/application-result?applicationId={token2}&utm_source=...&utm_medium=...&utm_campaign=...`
3. Offer page runs:
   - Reads `applicationId` and UTM from the query (no `webtoken`).
   - Calls:  
     `GET /api/leads/application-result?applicationId={token2}&utm_source=...&utm_medium=...&utm_campaign=...`
   - Sends **webtoken as empty**; backend uses `applicationId` + UTM.
4. Response includes offers and `tag`; app stores `tag` as webtoken for Modify / Accept.

**Required:** `token2` in the viewloandetails URL (used as `applicationId`). UTM params are passed through as-is (e.g. brevo, email).

**Code:**  
- Route: `App.tsx` → `/customer/viewloandetails` → `ViewLoandetailsRedirect`.  
- Redirect component: `src/offer-page/ViewLoandetailsRedirect.tsx`.

---

## 3. SMS (Telesign)

**Typical URL:**  
`https://offers.loantube.com/12345:447123456789`  
or `https://offers.loantube.com/0XdakVHbo:2`  
or `https://offers.loantube.com/abc123:xyz789`  
(i.e. **base URL** + **`{applicationId}:{smsnumber}`** as a single path segment; both parts can be alphanumeric)

**Who uses it:** SMS from LoanTube (e.g. Telesign) with a link in the message.

**Flow:**
1. User clicks the link and lands on **`/{applicationId}:{smsnumber}`** (e.g. `/12345:447123456789`).
2. **SmsOfferRedirect** runs (only when the path is a single segment matching `{applicationId}:{smsnumber}`, both alphanumeric, e.g. `0XdakVHbo:2`, `12345:447123456789`, `abc123:xyz789`):
   - Splits into `applicationId` and `smsnumber`.
   - Redirects to:  
     `/customer/application-result?applicationId=12345&utm_source=Telesign&utm_medium=sms&utm_campaign=447123456789`  
   - So: **utm_source=Telesign**, **utm_medium=sms**, **utm_campaign=smsnumber**.
3. Offer page runs:
   - Reads `applicationId` and UTM from the query (no `webtoken`).
   - Calls:  
     `GET /api/leads/application-result?applicationId=12345&utm_source=Telesign&utm_medium=sms&utm_campaign=447123456789`
   - Sends **webtoken as empty**; backend uses `applicationId` + UTM.
4. Response includes offers and `tag`; app stores `tag` as webtoken for Modify / Accept.

**Required:** Path must be exactly one segment of the form **`{applicationId}:{smsnumber}`** where both parts are one or more non-colon characters (alphanumeric), e.g. `0XdakVHbo:2`, `12345:447123456789`, `abc123:xyz789`. Any other single-segment path (e.g. `/customer`) redirects to `/`.

**Code:**  
- Route: `App.tsx` → `/:applicationIdSms` → `SmsOfferRedirect`.  
- Redirect component: `src/offer-page/SmsOfferRedirect.tsx`.

---

## Backend API (reference)

The offers API supports optional query params:

- **tag** – webtoken (affiliate/direct).
- **applicationId** – used for email/SMS when no tag.
- **utm_source**, **utm_medium**, **utm_campaign** – passed through for attribution.

**Accept offer** (`POST /api/leads/accept-offer`):

- **offerId** – required.
- **tag** – sent when webtoken is present (direct flow).
- **applicationId** – sent when tag is null/empty (email/SMS flow) so the backend can identify the application; always sent alongside offerId on accept.

Examples:

- Direct: `GET /api/leads/application-result?tag=xyz123`
- Email: `GET /api/leads/application-result?applicationId=token2&utm_source=brevo&utm_medium=email&utm_campaign=...`
- SMS: `GET /api/leads/application-result?applicationId=12345&utm_source=Telesign&utm_medium=sms&utm_campaign=447123456789`

---

## After the first load

- **Modify loan amount/term** uses the **webtoken** (tag) when present; email/SMS may get it from **`result.tag`** after the first successful application-result call.
- **Accept offer**: when the user came via email/SMS, **tag** may be null or empty. In that case the app sends **applicationId** (from the URL) along with **offerId** so the backend can identify the application. When tag is present (direct flow), it sends tag + offerId as before.
- No other behavioural difference between the three entry types after offers are loaded.

---

## Files to touch when changing behaviour

| What | Where |
|------|--------|
| Direct (webtoken) | `OfferPage.tsx` – read `webtoken`, call API with `tag` |
| Email redirect | `ViewLoandetailsRedirect.tsx` – token2 → applicationId + UTM |
| SMS redirect | `SmsOfferRedirect.tsx` – applicationId:smsnumber → applicationId + Telesign/sms UTM |
| Offer page URL params | `OfferPage.tsx` – read webtoken, applicationId, utm_* |
| API query shape | `apiService.ts` – `ApplicationResultAPI.getApplicationResult(webtoken, options?)` |
| Routes | `App.tsx` – `/customer/application-result`, `/customer/viewloandetails`, `/:applicationIdSms` |

---

## Quick reference

| Entry   | Land on                    | Then                          | API params                          |
|---------|----------------------------|-------------------------------|-------------------------------------|
| Direct  | `/customer/application-result?webtoken=...` | —                             | `tag=webtoken`                      |
| Email   | `/customer/viewloandetails?token2=...&utm_*` | Redirect to application-result | `applicationId=token2` + utm_*      |
| SMS     | `/{applicationId}:{smsnumber}` (e.g. `0XdakVHbo:2`) | Redirect to application-result | `applicationId`, utm_source=Telesign, utm_medium=sms, utm_campaign=smsnumber |
