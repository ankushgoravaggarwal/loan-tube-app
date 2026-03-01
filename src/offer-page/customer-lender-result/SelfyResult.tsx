import React from 'react';
import { Phone, ExternalLink } from 'lucide-react';
import OfferPageHeader from '../OfferPageHeader';
import OfferPageFooter from '../OfferPageFooter';
import { LoanDetailsList } from './LoanDetailsList';
import { BackLink } from './BackLink';
import type { LenderResultView } from './types';
import '../../styles/OfferPage.css';
import '../../styles/CustomerLenderResult.css';

export interface SelfyResultProps {
  view: LenderResultView;
  onGoBack: () => void;
}

const SelfyResult: React.FC<SelfyResultProps> = ({ view, onGoBack }) => (
  <div className="offer-page-container customer-lender-result-wrap">
    <OfferPageHeader />
    <main className="offer-main-content customer-lender-result-main">
      <div className="customer-lender-result-card">
        <h2 className="customer-lender-result-title">
          Congratulations!<br />Your loan is approved in-principle by
        </h2>
        {view.logoUrl && (
          <p className="customer-lender-result-logo-wrap">
            <img src={view.logoUrl} alt="" className="customer-lender-result-logo" />
          </p>
        )}
        <p className="customer-lender-result-section-label">Here are your loan details:</p>
        <LoanDetailsList view={view} variant="selfy" />
        <div className="customer-lender-result-branch-block">
          {view.isEvloConnect && view.evloConnectUrl ? (
            <>
              <p className="customer-lender-result-cta-copy">Continue to complete rest of the application process.</p>
              <div className="customer-lender-result-submit-wrap">
                <a
                  href={view.evloConnectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="customer-lender-result-cta-btn"
                >
                  <ExternalLink size={18} aria-hidden />
                  Continue to Evlo Connect
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="customer-lender-result-cta-copy">
                <strong>
                  Please call {view.lenderName} at the number below to complete the rest of your application with them.
                </strong>
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
                <strong>Note:</strong> You will only receive the loan amount once you have completed the rest of the
                application process with {view.lenderName}.
              </p>
            </>
          )}
        </div>
        <BackLink onGoBack={onGoBack} />
      </div>
    </main>
    <OfferPageFooter />
  </div>
);

export default SelfyResult;
