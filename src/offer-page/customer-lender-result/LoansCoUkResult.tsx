import React from 'react';
import { Phone } from 'lucide-react';
import OfferPageHeader from '../OfferPageHeader';
import OfferPageFooter from '../OfferPageFooter';
import { LoanDetailsListLoansCoUk } from './LoanDetailsList';
import { BackLink } from './BackLink';
import type { LenderResultView } from './types';
import '../../styles/OfferPage.css';
import '../../styles/CustomerLenderResult.css';

const LOANS_CO_UK_PHONE = '0820 131 0080';

export interface LoansCoUkResultProps {
  view: LenderResultView;
  onGoBack: () => void;
}

const LoansCoUkResult: React.FC<LoansCoUkResultProps> = ({ view, onGoBack }) => {
  const companyName = view.lenderName !== 'Your lender' ? view.lenderName : 'our partner';
  return (
    <div className="offer-page-container customer-lender-result-wrap">
      <OfferPageHeader />
      <main className="offer-main-content customer-lender-result-main">
        <div className="customer-lender-result-card">
          <h2 className="customer-lender-result-title">
            Congratulations! Your application has qualified for a loan offer from
          </h2>
          {view.logoUrl && (
            <p className="customer-lender-result-logo-wrap">
              <img src={view.logoUrl} alt="" className="customer-lender-result-logo" />
            </p>
          )}
          <p className="customer-lender-result-section-label">Here are your loan offer details:</p>
          <LoanDetailsListLoansCoUk view={view} />
          <div className="customer-lender-result-branch-block">
            <p className="customer-lender-result-cta-copy">
              <strong>
                You'll receive a call from our partner broker Loan.co.uk to complete your application process with{' '}
                {companyName}.
              </strong>
            </p>
            <div className="customer-lender-result-submit-wrap">
              <a href="tel:08201310080" className="customer-lender-result-cta-btn">
                <Phone size={20} aria-hidden />
                <strong>Call {LOANS_CO_UK_PHONE}</strong>
              </a>
              <label className="customer-lender-result-cta-hint">(click the button to call)</label>
            </div>
            <p className="customer-lender-result-warning">
              <strong>Warning:</strong> Please think very carefully before securing debts against your home. Your home
              may be repossessed if you do not keep up repayments on any debt secured against it.
            </p>
          </div>
          <BackLink onGoBack={onGoBack} />
        </div>
      </main>
      <OfferPageFooter />
    </div>
  );
};

export default LoansCoUkResult;
