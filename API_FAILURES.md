# API "Load failed" – ~30% of users not seeing offers

When affiliates redirect users to the app (e.g. `https://offers.loantube.com/customer/application-result?webtoken=...`), the app runs in the **browser** and calls the **API** (e.g. `https://sample.loantube.com/api/leads/application-result`). If that request fails, the browser shows **"Load failed (sample.loantube.com)"** and users see no offers.

## Root cause (not an app bug)

The **frontend is correct** — it calls the API as designed. The failure happens because the **browser blocks the cross-origin request** before any response is received. Sentry shows `http_status: (no response - e.g. CORS/network)` because the browser never gets an HTTP response.

So the problem is **backend / infrastructure**, not the React app:

1. **CORS** — The API at `sample.loantube.com` does not allow the origin `https://offers.loantube.com`. The browser blocks the response.
2. **Network** — Some users’ networks (mobile carrier, firewall) block or fail requests to `sample.loantube.com`.

~30% of users may be on networks or devices (e.g. Safari/iOS) where this cross-origin or network block happens more often.

---

## Fix 1: CORS on the API server (recommended)

The **API server** (e.g. `sample.loantube.com`) must allow the **page origin** (`https://offers.loantube.com`).

- **Page:** `https://offers.loantube.com` (where the app is loaded from)
- **API:** `https://sample.loantube.com` (different origin → cross-origin request)
- **Fix:** On the API server (or its gateway/Lambda), send:
  - `Access-Control-Allow-Origin: https://offers.loantube.com` (or list all app origins; avoid `*` in production if you need credentials)
  - Handle **OPTIONS** preflight for: `/api/leads/application-result`, `/api/leads/accept-offer`, `/api/leads/update`

Without this, the browser blocks the response and the frontend sees "Load failed".

## Fix 2: Proxy API through the same origin (no CORS needed)

If you cannot change the API server, proxy the API behind the same origin so the browser never does a cross-origin request:

- **Browser requests:** `https://offers.loantube.com/api/leads/application-result?tag=...`
- **Your server (e.g. CloudFront + Lambda, or nginx):** forwards to `https://sample.loantube.com/api/leads/application-result?tag=...` and returns the response.

Then in the app, set the base URL to the same origin (e.g. `VITE_LEADS_API_URL=https://offers.loantube.com/api/leads`). No CORS is needed because the browser only talks to `offers.loantube.com`.

---

## Other possible causes

- User's network (mobile carrier, corporate) blocking the API domain
- API host down or unreachable from some regions
- DNS or SSL issues for the API host

## What we do in the app

- **Sentry:** Error monitoring and session replay; on application-result failure we send tags and context (`api_host`, `webtoken`, `error_message`, `http_status`, etc.) so you can see the issue in Sentry.
- **Clarity:** Session replay and heatmaps (Microsoft Clarity).
- **Console:** On application-result failure we log `[api_failure]` with the same info (dev tools).
- **Retries:** We retry the request up to 5 times with 2s delay before showing an error.

## Backend checklist

1. Allow CORS for `https://offers.loantube.com` (and any other app origins) on:
   - `/api/leads/application-result`
   - `/api/leads/accept-offer`
   - `/api/leads/update`
2. Respond to **OPTIONS** with the same CORS headers.
3. Ensure the API host is reachable and returns valid responses for GET/POST from the browser.
