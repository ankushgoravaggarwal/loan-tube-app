# Sentry: "Load failed" and API errors

When affiliates redirect users to the app (e.g. `https://offers.loantube.com/customer/application-result?webtoken=...`), the app runs in the **browser** and calls the **API** (e.g. `https://sample.loantube.com/api/leads/application-result`). If that request fails, Sentry reports:

- **Error:** `TypeError: Load failed (sample.loantube.com)`
- **Meaning:** The browser could not complete the request to the API host. This is **not** a bug in the frontend; it is almost always one of:

## 1. CORS (most common)

The **API server** (e.g. `sample.loantube.com`) must allow the **page origin** (e.g. `https://offers.loantube.com`).

- **Page:** `https://offers.loantube.com` (where the app is loaded from)
- **API:** `https://sample.loantube.com` (different origin → cross-origin request)
- **Fix:** On the API server (or its gateway/Lambda), send:
  - `Access-Control-Allow-Origin: https://offers.loantube.com` (or `*` for testing only)
  - Handle `OPTIONS` preflight for the relevant paths (e.g. `/api/leads/application-result`, `/api/leads/accept-offer`, `/api/leads/update`)

Without this, the browser blocks the response and the frontend sees "Load failed".

## 2. Network / reachability

- User’s network (e.g. mobile carrier) blocking the API domain
- API host down or not reachable from the user’s region
- DNS or SSL issues for the API host

## What we do in the app

- **Sentry:** When the application-result request fails, we send tags and context so the issue is visible:
  - `api_host` (e.g. `sample.loantube.com`)
  - `endpoint`: `application-result`
  - Context: `api_failure` with `page_origin`, `referrer`, and `likely_cause` (CORS hint)
- **Retries:** We retry the request up to 3 times with a short delay before showing an error.

## Backend checklist

1. Allow CORS for `https://offers.loantube.com` (and any other app origins) on:
   - `/api/leads/application-result`
   - `/api/leads/accept-offer`
   - `/api/leads/update`
2. Respond to `OPTIONS` with the same CORS headers.
3. Ensure the API host is reachable and returns valid responses for GET/POST from the browser.
