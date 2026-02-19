import React from 'react';
import { useLocation } from 'react-router-dom';
import OfferPageHeader from './OfferPageHeader';
import OfferPageFooter from './OfferPageFooter';
import { ArrowLeft, Phone, ExternalLink, CheckCircle2, Building2, Calendar } from 'lucide-react';
import type { AcceptOfferLenderInfo } from '../services/apiService';
import '../styles/OfferPage.css';
import '../styles/LenderDeeplinkResult.css';

/** Loan details passed from accept page (OfferPage → LenderDeeplink → here) */
export interface LenderResultLoanDetails {
  loanAgreementNumber?: string;
  loanAmount?: string;
  loanTerm?: string;
  monthlyInstalment?: string;
  apr?: string;
  totalRepayable?: string;
  fee?: string;
}

/** State passed from LenderDeeplink after accept-offer (Evlo, Evolution, Selfy, Loans.co.uk) */
interface LenderResultState {
  lenderInfo?: AcceptOfferLenderInfo;
  evloConnectUrl?: string;
  acceptedOfferAt?: string;
  message?: string;
  loanDetails?: LenderResultLoanDetails;
}

const LENDER_RESULT_STATE_KEY = 'loantube_lender_result_state';

function formatAcceptedDate(isoString: string | undefined): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} at ${time}`;
  } catch {
    return isoString;
  }
}

/** Returns true if value is non-empty string (backend may send empty string or test placeholder) */
function hasValue(s: string | undefined): boolean {
  return typeof s === 'string' && s.trim().length > 0;
}

const LenderResult: React.FC = () => {
  const location = useLocation();
  const navState = (location.state ?? null) as LenderResultState | null;

  const [restoredState] = React.useState<LenderResultState | null>(() => {
    if (navState?.lenderInfo) return null;
    try {
      const raw = sessionStorage.getItem(LENDER_RESULT_STATE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as LenderResultState;
      return parsed?.lenderInfo ? parsed : null;
    } catch {
      return null;
    }
  });

  const state = navState?.lenderInfo ? navState : restoredState;

  React.useEffect(() => {
    if (!state?.lenderInfo) return;
    try {
      sessionStorage.setItem(LENDER_RESULT_STATE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const lenderInfo = state?.lenderInfo;
  const evloConnectUrl = state?.evloConnectUrl;
  const acceptedOfferAt = state?.acceptedOfferAt;
  const successMessage = state?.message;
  const loanDetails = state?.loanDetails;

  const lenderName = lenderInfo?.lenderCompanyName ?? '';
  const lenderLogo = hasValue(lenderInfo?.lenderLogoUrl) ? (lenderInfo?.lenderLogoUrl ?? '') : null;
  const phoneNumber = hasValue(lenderInfo?.branchTelephone) ? (lenderInfo?.branchTelephone ?? '') : '';
  const branchName = hasValue(lenderInfo?.branchName) ? (lenderInfo?.branchName ?? '') : null;
  const applicationToken = hasValue(lenderInfo?.applicationToken) ? (lenderInfo?.applicationToken ?? '') : null;
  const lenderRefId = hasValue(lenderInfo?.lenderRefId) ? (lenderInfo?.lenderRefId ?? '') : null;
  const applicationException = hasValue(lenderInfo?.applicationException) ? (lenderInfo?.applicationException ?? '') : null;

  const handleGoBack = () => window.history.back();
  const phoneDigits = phoneNumber.replace(/\s/g, '');
  const formattedAcceptedAt = formatAcceptedDate(acceptedOfferAt);

  const hasNoData = !lenderInfo || !hasValue(lenderInfo.lenderCompanyName);

  if (hasNoData) {
    return (
      <div className="offer-page-container lender-page-wrap">
        <OfferPageHeader />
        <main className="offer-main-content lender-page-main">
          <div className="lender-card lender-result-card">
            <div className="lender-result-content lender-result-empty-state">
              <div className="lender-result-success-badge">
                <CheckCircle2 size={20} aria-hidden />
                <span>Next steps</span>
              </div>
              <h1 className="lender-result-title">Your lender result</h1>
              <p className="lender-result-empty-message">
                This page shows your next steps after you accept an offer. If you just accepted an offer, you should have been redirected here with your details.
              </p>
              <p className="lender-result-empty-message">
                If you opened this link directly or refreshed the page, please go back to your offer page and click <strong>Proceed</strong> again to see your lender details.
              </p>
              <a href="/offerpage" className="lender-result-cta-btn lender-result-empty-link">
                Go to offer page
              </a>
              <div className="lender-result-back-wrap">
                <button type="button" onClick={handleGoBack} className="lender-result-back-btn" aria-label="Go back">
                  <ArrowLeft size={18} aria-hidden />
                  Back to previous page
                </button>
              </div>
            </div>
          </div>
        </main>
        <OfferPageFooter />
      </div>
    );
  }

  const hasLoanDetails = loanDetails && (loanDetails.loanAmount || loanDetails.monthlyInstalment || loanDetails.apr || loanDetails.totalRepayable || loanDetails.loanAgreementNumber || loanDetails.loanTerm || loanDetails.fee);
  const hasApplicationGlance = applicationToken || lenderRefId || branchName || formattedAcceptedAt;

  return (
    <div className="offer-page-container lender-page-wrap">
      <OfferPageHeader />
      <main className="offer-main-content lender-page-main">
        <div className="lender-card lender-result-card lender-result-card--wide">
          <div className="lender-result-content">
            {/* Hero: one compact block */}
            <div className="lender-result-hero">
              <div className="lender-result-success-badge">
                <CheckCircle2 size={20} aria-hidden />
                <span>Approved in principle</span>
              </div>
              <h1 className="lender-result-title">Your next step with {lenderName}</h1>
              <div className="lender-result-hero-meta">
                {hasValue(successMessage) && <span className="lender-result-hero-message">{successMessage}</span>}
                {formattedAcceptedAt && (
                  <span className="lender-result-hero-date">
                    {hasValue(successMessage) && ' · '}
                    <Calendar size={14} aria-hidden />
                    {formattedAcceptedAt}
                  </span>
                )}
              </div>
            </div>

            {/* Lender: logo + name (no duplicate), branch + exception inline */}
            <div className="lender-result-identity-row">
              {lenderLogo && (
                <div className="lender-result-logo-wrap">
                  <img src={lenderLogo} alt="" className="lender-result-logo" />
                </div>
              )}
              <div className="lender-result-identity-meta">
                <h2 className="lender-result-lender-name-single">{lenderName}</h2>
                <div className="lender-result-identity-tags">
                  {branchName && <span className="lender-result-tag lender-result-tag--branch"><Building2 size={14} aria-hidden />{branchName}</span>}
                  {applicationException && <span className="lender-result-tag lender-result-tag--exception">{applicationException}</span>}
                </div>
              </div>
            </div>

            {/* Primary CTA: Call – visible without scrolling */}
            {phoneNumber && (
              <div className="lender-result-cta-block">
                <p className="lender-result-cta-copy">Call to complete your application</p>
                <a
                  href={`tel:${phoneDigits}`}
                  className="lender-result-cta-btn lender-result-phone-btn"
                  aria-label={`Call ${lenderName} on ${phoneNumber}`}
                >
                  <Phone size={22} aria-hidden />
                  <span className="lender-result-phone-num">{phoneNumber}</span>
                </a>
              </div>
            )}

            {/* Evlo: Open Banking (secondary CTA) */}
            {hasValue(evloConnectUrl) && (
              <a
                href={evloConnectUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="lender-result-cta-btn lender-result-connect-btn lender-result-connect-btn--secondary"
                aria-label="Continue to open banking with lender"
              >
                <ExternalLink size={20} aria-hidden />
                Continue with Open Banking
              </a>
            )}

            {/* Two-column: Loan details | Application at a glance – compact, side by side on desktop */}
            <div className="lender-result-two-col">
              {hasLoanDetails && loanDetails && (
                <section className="lender-result-block lender-result-loan-block" aria-label="Loan details">
                  <h3 className="lender-result-block-title">Your loan details</h3>
                  <div className="lender-result-compact-grid">
                    {hasValue(loanDetails.loanAgreementNumber) && (
                      <div className="lender-result-compact-row">
                        <span className="lender-result-compact-label">Agreement no.</span>
                        <span className="lender-result-compact-value">{loanDetails.loanAgreementNumber}</span>
                      </div>
                    )}
                    {hasValue(loanDetails.loanAmount) && (
                      <div className="lender-result-compact-row">
                        <span className="lender-result-compact-label">Loan amount</span>
                        <span className="lender-result-compact-value lender-result-compact-value--em">{loanDetails.loanAmount}</span>
                      </div>
                    )}
                    {hasValue(loanDetails.loanTerm) && (
                      <div className="lender-result-compact-row">
                        <span className="lender-result-compact-label">Term</span>
                        <span className="lender-result-compact-value">{loanDetails.loanTerm}</span>
                      </div>
                    )}
                    {hasValue(loanDetails.monthlyInstalment) && (
                      <div className="lender-result-compact-row">
                        <span className="lender-result-compact-label">Monthly</span>
                        <span className="lender-result-compact-value">{loanDetails.monthlyInstalment}</span>
                      </div>
                    )}
                    {hasValue(loanDetails.apr) && (
                      <div className="lender-result-compact-row">
                        <span className="lender-result-compact-label">APR</span>
                        <span className="lender-result-compact-value">{loanDetails.apr}</span>
                      </div>
                    )}
                    {hasValue(loanDetails.fee) && (
                      <div className="lender-result-compact-row">
                        <span className="lender-result-compact-label">Fee</span>
                        <span className="lender-result-compact-value">{loanDetails.fee}</span>
                      </div>
                    )}
                    {hasValue(loanDetails.totalRepayable) && (
                      <div className="lender-result-compact-row">
                        <span className="lender-result-compact-label">Total repayable</span>
                        <span className="lender-result-compact-value lender-result-compact-value--em">{loanDetails.totalRepayable}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}
              {hasApplicationGlance && (
                <section className="lender-result-block lender-result-refs-block" aria-label="Application references">
                  <h3 className="lender-result-block-title">References</h3>
                  <div className="lender-result-compact-grid">
                    {applicationToken && (
                      <div className="lender-result-compact-row">
                        <span className="lender-result-compact-label">Application ref</span>
                        <span className="lender-result-compact-value lender-result-compact-value--mono">{applicationToken}</span>
                      </div>
                    )}
                    {lenderRefId && (
                      <div className="lender-result-compact-row">
                        <span className="lender-result-compact-label">Lender ref</span>
                        <span className="lender-result-compact-value lender-result-compact-value--mono">{lenderRefId}</span>
                      </div>
                    )}
                    {branchName && (
                      <div className="lender-result-compact-row">
                        <span className="lender-result-compact-label">Branch</span>
                        <span className="lender-result-compact-value">{branchName}</span>
                      </div>
                    )}
                    {formattedAcceptedAt && (
                      <div className="lender-result-compact-row">
                        <span className="lender-result-compact-label">Accepted</span>
                        <span className="lender-result-compact-value">{formattedAcceptedAt}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>

            <p className="lender-result-note lender-result-note--compact">
              <strong>Important:</strong> You’ll receive the loan in your account only after completing the final steps with {lenderName}
              {phoneNumber ? ' by calling the number above' : ''}
              {hasValue(evloConnectUrl) ? ' or using Open Banking' : ''}.
            </p>

            <div className="lender-result-back-wrap">
              <button type="button" onClick={handleGoBack} className="lender-result-back-btn" aria-label="Go back to previous page">
                <ArrowLeft size={18} aria-hidden />
                Back to previous page
              </button>
            </div>
          </div>
        </div>
      </main>
      <OfferPageFooter />
    </div>
  );
};

export default LenderResult;
