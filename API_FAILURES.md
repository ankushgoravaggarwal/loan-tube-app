# API "Load failed" and CORS

When affiliates redirect users to the app (e.g. `https://offers.loantube.com/customer/application-result?webtoken=...`), the app runs in the **browser** and calls the **API** (e.g. `https://sample.loantube.com/api/leads/application-result`). If that request fails, the browser may show "Load failed".

## 1. CORS (most common)

The **API server** (e.g. `sample.loantube.com`) must allow the **page origin** (e.g. `https://offers.loantube.com`).

- **Page:** `https://offers.loantube.com` (where the app is loaded from)
- **API:** `https://sample.loantube.com` (different origin → cross-origin request)
- **Fix:** On the API server (or its gateway/Lambda), send:
  - `Access-Control-Allow-Origin: https://offers.loantube.com` (or `*` for testing only)
  - Handle `OPTIONS` preflight for the relevant paths (e.g. `/api/leads/application-result`, `/api/leads/accept-offer`, `/api/leads/update`)

Without this, the browser blocks the response and the frontend sees "Load failed".

## 2. Network / reachability

- User's network (e.g. mobile carrier) blocking the API domain
- API host down or not reachable from the user's region
- DNS or SSL issues for the API host

## What we do in the app

- **Clarity:** Session replay and heatmaps (Microsoft Clarity) so you can see what the user did before/during failures.
- **Console:** On application-result failure we log `[api_failure]` with `api_host`, `webtoken`, `error_message`, `http_status` (dev tools).
- **Retries:** We retry the request up to 5 times with 2s delay before showing an error.

## Backend checklist

1. Allow CORS for `https://offers.loantube.com` (and any other app origins) on:
   - `/api/leads/application-result`
   - `/api/leads/accept-offer`
   - `/api/leads/update`
2. Respond to `OPTIONS` with the same CORS headers.
3. Ensure the API host is reachable and returns valid responses for GET/POST from the browser.
