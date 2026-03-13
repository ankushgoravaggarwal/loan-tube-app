import React, { useState } from 'react';
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
  showConnect?: boolean;
  onContinueToConnect?: () => void;
}

const SelfyResult: React.FC<SelfyResultProps> = ({ view, onGoBack, showConnect = false, onContinueToConnect }) => {
  const [showEvloConnectLocal, setShowEvloConnectLocal] = useState(false);
  const showConnectScreen = showConnect || showEvloConnectLocal;

  const handleContinue = () => {
    setShowEvloConnectLocal(true);
    onContinueToConnect?.();
  };

  if (showConnectScreen && view.evloConnectUrl) {
    return (
      <div className="offer-page-container customer-lender-result-wrap">
        <OfferPageHeader />
        <main className="offer-main-content customer-lender-result-main">
          <div className="customer-lender-result-card customer-lender-result-card--evlo-connect">
            <div className="evlo-connect-hero">
              {view.logoUrl && (
                <p className="customer-lender-result-logo-wrap evlo-connect-logo-wrap">
                  <img src={view.logoUrl} alt="" className="customer-lender-result-logo evlo-connect-logo" />
                </p>
              )}
              <h2 className="evlo-connect-title">You're almost there</h2>
              <p className="evlo-connect-subtitle">
                To complete your loan application, please connect your bank account using{' '}
                <span className="customer-lender-result-open-banking">Evlo Connect</span>.
              </p>
            </div>

            <div className="evlo-connect-how-section">
              <h3 className="evlo-connect-how-title">How it works</h3>
              <ol className="evlo-connect-steps">
                <li className="evlo-connect-step">
                  <span className="evlo-connect-step-num">1</span>
                  <span>You connect your bank account.</span>
                </li>
                <li className="evlo-connect-step">
                  <span className="evlo-connect-step-num">2</span>
                  <span>Your bank securely shares your data with Evlo.</span>
                </li>
                <li className="evlo-connect-step">
                  <span className="evlo-connect-step-num">3</span>
                  <span>Evlo checks your affordability and completes your application with you.</span>
                </li>
              </ol>
            </div>

            <div className="evlo-connect-note-box">
              <p className="evlo-connect-note-label">Note</p>
              <p className="evlo-connect-note-body">
                Please connect the <strong>main bank account</strong> where your salary is paid and regular spending is visible.
              </p>
            </div>

            <div className="evlo-connect-cta-wrap">
              <a
                href={view.evloConnectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="evlo-connect-cta-btn"
              >
                <ExternalLink size={20} aria-hidden />
                Continue to Evlo Connect
              </a>
            </div>
          </div>
        </main>
        <OfferPageFooter />
      </div>
    );
  }

  return (
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
          {!view.isEvloConnect || !view.evloConnectUrl ? (
            <div className="customer-lender-result-branch-block">
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
            </div>
          ) : (
            <div className="customer-lender-result-branch-block">
              <p className="customer-lender-result-cta-copy">Continue to complete rest of the application process.</p>
              <div className="customer-lender-result-submit-wrap">
                <button
                  type="button"
                  onClick={handleContinue}
                  className="customer-lender-result-cta-btn"
                >
                  <strong>Continue</strong>
                </button>
              </div>
            </div>
          )}
          <BackLink onGoBack={onGoBack} />
        </div>
      </main>
      <OfferPageFooter />
    </div>
  );
};

export default SelfyResult;
