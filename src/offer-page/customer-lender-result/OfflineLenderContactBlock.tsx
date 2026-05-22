import React from 'react';
import { Phone } from 'lucide-react';
import type { LenderResultView } from './types';

export type OfflineLenderVariant = 'evlo' | 'selfy';

export interface OfflineLenderContactBlockProps {
  view: LenderResultView;
  variant: OfflineLenderVariant;
}

/** Next steps when Open Banking (Evlo Connect) is not available — aligned with Evolution offline flow. */
const OfflineLenderContactBlock: React.FC<OfflineLenderContactBlockProps> = ({ view, variant }) => {
  const lenderName = variant === 'evlo' ? 'Evlo' : view.lenderName || 'Selfy Loans';

  return (
    <div className="customer-lender-result-branch-block">
      <p className="customer-lender-result-cta-copy">
        <strong>
          As a next step {lenderName} will contact you to complete the rest of your application with them.
        </strong>
      </p>
      <p className="customer-lender-result-cta-copy">
        <strong>Prefer to contact them directly?</strong>
      </p>
      {view.branchPhone ? (
        <p className="customer-lender-result-cta-copy">
          You can reach {lenderName} on <strong>{view.branchPhone}</strong>.
        </p>
      ) : null}
      {view.branchPhone ? (
        <div className="customer-lender-result-submit-wrap">
          <a href={`tel:${view.branchPhone.replace(/\s/g, '')}`} className="customer-lender-result-cta-btn">
            <Phone size={20} aria-hidden />
            <strong>Call {view.branchPhone}</strong>
          </a>
          <label className="customer-lender-result-cta-hint">(click the button to call)</label>
        </div>
      ) : null}
      <p className="customer-lender-result-note-text">
        <strong>Note:</strong> You will only receive the loan amount in your bank account once you have completed the
        rest of the application process with {lenderName}
        {view.branchPhone ? ' (including by calling them at the number above if they have not reached you yet)' : ''}.
      </p>
      <p className="customer-lender-result-note-text">
        *Approval is subject to further checks by the lender, such as confirming your identity.
      </p>
    </div>
  );
};

export default OfflineLenderContactBlock;
