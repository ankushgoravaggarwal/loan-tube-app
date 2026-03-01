import React, { useState } from 'react';
import { Phone, ExternalLink } from 'lucide-react';
import OfferPageHeader from '../OfferPageHeader';
import OfferPageFooter from '../OfferPageFooter';
import { LoanDetailsList } from './LoanDetailsList';
import { BackLink } from './BackLink';
import type { LenderResultView } from './types';
import '../../styles/OfferPage.css';
import '../../styles/CustomerLenderResult.css';

export interface EvloResultProps {
  view: LenderResultView;
  onGoBack: () => void;
}

const EvloResult: React.FC<EvloResultProps> = ({ view, onGoBack }) => {
  const [showEvloConnect, setShowEvloConnect] = useState(false);

  if (showEvloConnect && view.evloConnectUrl) {
    return (
      <div className="offer-page-container customer-lender-result-wrap">
        <OfferPageHeader />
        <main className="offer-main-content customer-lender-result-main">
          <div className="customer-lender-result-card customer-lender-result-card--evlo-connect">
            <h2 className="customer-lender-result-title customer-lender-result-title--modal">You're almost there</h2>
            <p className="customer-lender-result-subtitle">
              To complete your loan application, please connect your bank account using{' '}
              <span className="customer-lender-result-open-banking">Evlo Connect</span>.
            </p>
            <ol className="customer-lender-result-steps-list">
              <h3 className="customer-lender-result-how-it-works">How it works:</h3>
              <li>You connect your bank account.</li>
              <li>Your bank securely shares your data with Evlo.</li>
              <li>Evlo checks your affordability using the data, and completes your application process with you.</li>
            </ol>
            <div className="customer-lender-result-note-section">
              <p className="customer-lender-result-note-text">
                <span className="customer-lender-result-note-title">Note:</span> Please connect the{' '}
                <span className="customer-lender-result-main-bank">main bank account</span> where your salary is paid
                and regular spending is visible.
              </p>
            </div>
            <a
              href={view.evloConnectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="customer-lender-result-connect-btn"
            >
              <ExternalLink size={18} aria-hidden />
              Continue to Evlo Connect
            </a>
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
          <LoanDetailsList view={view} variant="evlo" />
          {!view.isEvloConnect ? (
            <div className="customer-lender-result-branch-block">
              <p className="customer-lender-result-cta-copy">
                <strong>Please call Evlo at the number below to complete the rest of your application with them.</strong>
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
                <strong>Note:</strong> You will only receive the loan amount in your bank account once you have
                completed the rest of the application process with Evlo by calling them at the number above.
              </p>
            </div>
          ) : (
            <div className="customer-lender-result-branch-block">
              <p className="customer-lender-result-cta-copy">Continue to complete rest of the application process.</p>
              <div className="customer-lender-result-submit-wrap">
                <button
                  type="button"
                  onClick={() => setShowEvloConnect(true)}
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

export default EvloResult;
