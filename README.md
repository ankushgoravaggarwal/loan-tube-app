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
