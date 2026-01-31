import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import OfferPageHeader from './OfferPageHeader';
import OfferPageFooter from './OfferPageFooter';
import { ApplicationResultAPI, type AcceptOfferResponse } from '../services/apiService';
import '../styles/OfferPage.css';
import '../styles/LenderDeeplinkResult.css';

export interface LenderDeeplinkState {
  /** From Proceed: call accept-offer API then redirect/navigate */
  webtoken?: string;
  offerId?: number;
  lenderName?: string;
  lenderLogo?: string;
  /** Legacy: countdown then redirect to this URL */
  acceptUrl?: string;
}

const DEFAULT_LENDER_LOGO = "https://dvl9cyxa05rs.cloudfront.net/wp-content/uploads/2025/04/salad-money_logo.svg";
const TOTAL_SECONDS = 10;

function getAcceptOfferErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    TAG_REQUIRED: 'Tag is required.',
    OFFER_ID_REQUIRED: 'Offer id is required.',
    INVALID_OR_EXPIRED_TAG: 'Invalid or expired link. Please start again or submit a new application.',
    LEAD_NOT_FOUND: 'Application not found.',
    OFFER_NOT_FOUND: 'Offer not found.',
    OFFER_NOT_FOR_APPLICATION: 'Offer does not belong to this application.',
    OFFER_ALREADY_ACCEPTED: 'This offer has already been accepted.',
    OFFER_ALREADY_REJECTED: 'This offer was rejected.',
    OFFER_ALREADY_FUNDED: 'This offer has already been funded.',
    OFFER_EXPIRED: 'This offer has expired. Please refresh your offers.',
    OFFER_NOT_OFFERED: 'This offer is not available.',
  };
  return messages[errorCode] ?? 'Something went wrong. Please try again.';
}

const LenderDeeplink: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? null) as LenderDeeplinkState | null;

  const webtoken = state?.webtoken;
  const offerId = state?.offerId;
  const acceptUrl = state?.acceptUrl;
  const lenderName = state?.lenderName ?? (acceptUrl ? 'the lender' : 'the lender');
  const lenderLogo = state?.lenderLogo ?? DEFAULT_LENDER_LOGO;

  const isApiMode = typeof webtoken === 'string' && typeof offerId === 'number';

  const [apiLoading, setApiLoading] = useState(isApiMode);
  const [apiError, setApiError] = useState<string | null>(null);
  const [redirectUrlFromApi, setRedirectUrlFromApi] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(TOTAL_SECONDS);

  const redirectTarget = redirectUrlFromApi ?? acceptUrl ?? '/lender-result';
  const logoUrl = "/assets/loantube-n-logo.svg";

  // API mode: call accept-offer on mount
  useEffect(() => {
    if (!isApiMode) return;

    let cancelled = false;
    (async () => {
      try {
        const res: AcceptOfferResponse = await ApplicationResultAPI.acceptOffer(webtoken!, offerId!);
        if (cancelled) return;

        if (res.status === 'error') {
          const msg = res.message || getAcceptOfferErrorMessage(res.errorCode);
          setApiError(msg);
          setApiLoading(false);
          return;
        }

        if (res.lenderAcceptanceUrl) {
          setRedirectUrlFromApi(res.lenderAcceptanceUrl);
          setApiLoading(false);
          return;
        }
        if (res.lenderInfo) {
          navigate('/lender-result', {
            state: {
              lenderInfo: res.lenderInfo,
              evloConnectUrl: res.evloConnectUrl ?? undefined,
            },
            replace: true,
          });
          setApiLoading(false);
          return;
        }
        setApiError('Unexpected response. Please try again.');
        setApiLoading(false);
      } catch (err) {
        if (!cancelled) {
          setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
          setApiLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isApiMode, webtoken, offerId, navigate]);

  // Countdown: run when showing countdown UI (legacy acceptUrl/direct visit, or after API returned lenderAcceptanceUrl)
  const showCountdown = !isApiMode || redirectUrlFromApi != null;
  useEffect(() => {
    if (!showCountdown) return;

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
  }, [showCountdown, redirectTarget]);

  const progressPercent = (countdown / TOTAL_SECONDS) * 100;

  const handleManualContinue = () => {
    window.location.href = redirectTarget;
  };

  const handleGoBack = () => {
    window.history.back();
  };

  if (isApiMode && apiError) {
    return (
      <div className="offer-page-container lender-page-wrap">
        <OfferPageHeader />
        <main className="offer-main-content lender-page-main">
          <div className="lender-card">
            <div className="lender-deeplink-content">
              <span className="lender-deeplink-badge">Something went wrong</span>
              <h1 className="lender-deeplink-title">We couldn’t accept your offer</h1>
              <p className="lender-deeplink-subtitle lender-deeplink-error-text">{apiError}</p>
              <button type="button" onClick={handleGoBack} className="lender-deeplink-manual-link lender-deeplink-back-btn">
                <ArrowLeft size={18} aria-hidden />
                Go back to offers
              </button>
            </div>
          </div>
        </main>
        <OfferPageFooter />
      </div>
    );
  }

  if (isApiMode && apiLoading) {
    return (
      <div className="offer-page-container lender-page-wrap">
        <OfferPageHeader />
        <main className="offer-main-content lender-page-main">
          <div className="lender-card">
            <div className="lender-deeplink-content">
              <span className="lender-deeplink-badge">Next step</span>
              <h1 className="lender-deeplink-title">Accepting your offer</h1>
              <p className="lender-deeplink-subtitle">
                Taking you to {lenderName}. Please wait…
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
                <div className="offer-loading">
                  <div className="spinner-container">
                    <div className="spinner"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <OfferPageFooter />
      </div>
    );
  }

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
