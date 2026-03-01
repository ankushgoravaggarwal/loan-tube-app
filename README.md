# loan-tube-b2c

B2C loan application and offer flow for LoanTube.

---

## Branches

| Branch | Purpose |
|--------|--------|
| **`main`** | **Current production.** Deployed and live. Use for hotfixes only. |
| **`release/customer-lender-result`** | **New release branch.** Contains Customer Lender Result page (`/customer/lenderresult?d=...`), modular lender result components, and related changes. To be deployed as next production release. |

**Workflow:**

- Keep **`main`** as the current production branch until the new release is validated and deployed.
- Merge **`release/customer-lender-result`** into **`main`** when ready to release; then **`main`** becomes the new production.
- After release, update this table so **`main`** is again the only production branch and the release branch is archived or removed.

---

## Testing – Evlo flow (E2E)

To run through the **full Evlo flow** with dummy data (no backend):

1. Start the app: `npm run dev`
2. Open: **http://localhost:5173/customer/lenderresult?test=evlo**

You should see:

1. **First screen:** "Congratulations! Your loan is approved in-principle by" + loan details (Agreement 0042956962, £5,000, 24 months, £230.50, 9.9%, £5,532.00) + "Continue to complete rest of the application process" + **Continue** button.
2. Click **Continue** → **Second screen:** "You're almost there" + Evlo Connect copy + "How it works" + **Continue to Evlo Connect** (opens https://evlo.co.uk).

All values are dummy; no `d` payload or backend required.

**Selfy flow (same two-step flow as Evlo):**  
Open **http://localhost:5173/customer/lenderresult?test=selfy** to run through the Selfy result with dummy data (Selfy Loans logo, £3,000 / 18 months, then Continue → Evlo Connect screen).

**Evolution Money flow:**  
Open **http://localhost:5173/customer/lenderresult?test=evolution** to see the Evolution result with dummy data (Evolution Money copy, Loan Confirmation ID, APRC, call 0161 768 9410, warning).

**Loans.co.uk flow:**  
Open **http://localhost:5173/customer/lenderresult?test=loanscouk** to see the Loans.co.uk result with dummy data (loan offer from partner, Loan Amount / Term / EMI / APR / Total, call 0820 131 0080, warning).
