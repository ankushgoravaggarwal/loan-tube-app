import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import OfferPageHeader from '../OfferPageHeader';
import OfferPageFooter from '../OfferPageFooter';
import { LoanDetailsList } from './LoanDetailsList';
import { BackLink } from './BackLink';
import OfflineLenderContactBlock from './OfflineLenderContactBlock';
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

  if (showConnectScreen && view.isEvloConnect && view.evloConnectUrl) {
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
          {!view.isEvloConnect ? (
            <OfflineLenderContactBlock view={view} variant="selfy" />
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
