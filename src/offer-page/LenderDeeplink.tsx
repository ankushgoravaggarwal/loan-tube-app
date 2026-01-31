import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import OfferPageHeader from './OfferPageHeader';
import OfferPageFooter from './OfferPageFooter';
import '../styles/OfferPage.css';
import '../styles/LenderDeeplinkResult.css';

export interface LenderDeeplinkState {
  acceptUrl?: string;
  lenderName?: string;
  lenderLogo?: string;
}

const DEFAULT_LENDER_LOGO = "https://dvl9cyxa05rs.cloudfront.net/wp-content/uploads/2025/04/salad-money_logo.svg";
const TOTAL_SECONDS = 10;

const LenderDeeplink: React.FC = () => {
  const location = useLocation();
  const state = (location.state ?? null) as LenderDeeplinkState | null;
  const acceptUrl = state?.acceptUrl;
  const lenderName = state?.lenderName ?? "the lender";
  const lenderLogo = state?.lenderLogo ?? DEFAULT_LENDER_LOGO;

  const [countdown, setCountdown] = useState(TOTAL_SECONDS);

  const redirectTarget = acceptUrl ?? '/lender-result';

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          window.location.href = redirectTarget;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [redirectTarget]);

  const progressPercent = (countdown / TOTAL_SECONDS) * 100;
  const logoUrl = "/assets/loantube-n-logo.svg";

  const handleManualContinue = () => {
    window.location.href = redirectTarget;
  };

  return (
    <div className="offer-page-container lender-page-wrap">
      <OfferPageHeader />

      <main className="offer-main-content lender-page-main">
        <div className="lender-card">
          <div className="lender-deeplink-content">
            <span className="lender-deeplink-badge">Next step</span>
            <h1 className="lender-deeplink-title">
              Taking you to {lenderName}
            </h1>
            <p className="lender-deeplink-subtitle">
              You’ll complete your application on {lenderName}’s secure site. Don’t close this window.
            </p>

            <div className="lender-deeplink-visual">
              <div className="lender-deeplink-logo-wrap">
                <img src={logoUrl} alt="LoanTube" className="lender-deeplink-logo-loantube" />
              </div>
              <div className="lender-deeplink-arrow" aria-hidden="true" />
              <div className="lender-deeplink-logo-wrap">
                <img src={lenderLogo} alt={lenderName} className="lender-deeplink-logo-lender" />
              </div>
            </div>

            <div className="lender-deeplink-progress-wrap">
              <p className="lender-deeplink-progress-label">
                Redirecting in
              </p>
              <div className="lender-deeplink-progress-bar">
                <div
                  className="lender-deeplink-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                  role="progressbar"
                  aria-valuenow={countdown}
                  aria-valuemin={0}
                  aria-valuemax={TOTAL_SECONDS}
                />
              </div>
              <p className="lender-deeplink-countdown">
                <span className="lender-deeplink-countdown-num">{countdown}</span> second{countdown !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="lender-deeplink-manual">
              <p className="lender-deeplink-manual-text">
                If nothing happens, use the link below.
              </p>
              <button
                type="button"
                className="lender-deeplink-manual-link"
                onClick={handleManualContinue}
              >
                Continue to next step →
              </button>
            </div>
          </div>
        </div>
      </main>

      <OfferPageFooter />
    </div>
  );
};

export default LenderDeeplink;
