import React from 'react';
import { Phone } from 'lucide-react';
import OfferPageHeader from '../OfferPageHeader';
import OfferPageFooter from '../OfferPageFooter';
import { LoanDetailsList } from './LoanDetailsList';
import { BackLink } from './BackLink';
import type { LenderResultView } from './types';
import '../../styles/OfferPage.css';
import '../../styles/CustomerLenderResult.css';

export interface EvolutionResultProps {
  view: LenderResultView;
  onGoBack: () => void;
}

const EvolutionResult: React.FC<EvolutionResultProps> = ({ view, onGoBack }) => (
  <div className="offer-page-container customer-lender-result-wrap">
    <OfferPageHeader />
    <main className="offer-main-content customer-lender-result-main">
      <div className="customer-lender-result-card">
        <h2 className="customer-lender-result-title">
          Congratulations!<br />Your loan is approved-in-principle* by
        </h2>
        {view.logoUrl && (
          <p className="customer-lender-result-logo-wrap">
            <img src={view.logoUrl} alt="" className="customer-lender-result-logo" />
          </p>
        )}
        <p className="customer-lender-result-section-label">Here are your loan details:</p>
        <LoanDetailsList view={view} variant="evolution" agreementLabel="Loan Confirmation ID" />
        <div className="customer-lender-result-branch-block">
          <p className="customer-lender-result-cta-copy">
            <strong>
              As a next step Evolution Money will contact you to run through your mortgage, income and expenditure
              information, so it would be helpful to have all that information ready.
            </strong>
          </p>
          <p className="customer-lender-result-cta-copy">
            <strong>Prefer to contact them directly?</strong>
          </p>
          <p className="customer-lender-result-cta-copy">
            You can reach Evolution Money on 0161 768 9410. They are open from 9am to 7pm Monday to Thursday and 10am
            to 5pm on Friday.
          </p>
          {view.branchPhone && (
            <div className="customer-lender-result-submit-wrap">
              <a href={`tel:${view.branchPhone.replace(/\s/g, '')}`} className="customer-lender-result-cta-btn">
                <Phone size={20} aria-hidden />
                <strong>Call {view.branchPhone}</strong>
              </a>
              <label className="customer-lender-result-cta-hint">(click the button to call)</label>
            </div>
          )}
          <p className="customer-lender-result-note-text">
            *Approval is subject to further checks by the lender, such as confirming your identity.
          </p>
          <p className="customer-lender-result-warning">
            <strong>Warning:</strong> Please think very carefully before securing debts against your home. Your home may
            be repossessed if you do not keep up repayments on any debt secured against it.
          </p>
        </div>
        <BackLink onGoBack={onGoBack} />
      </div>
    </main>
    <OfferPageFooter />
  </div>
);

export default EvolutionResult;
