import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Info, Star, ChevronDown, X } from 'lucide-react';
import OfferPageSidebar from './OfferPageSidebar';
import OfferPageFooter from './OfferPageFooter';
import { ModifySearchModal, ContinueModal, getInfoTooltip } from './OfferpageModals';
import { ApplicationResultAPI, type Offer, type MatchedLenderGroup, type ApplicationResultResponse } from '../services/apiService';
import type { LenderResultLoanDetails } from './LenderResult';
import * as Sentry from '@sentry/react';

import '../styles/OfferPage.css';

/** Show Acceptance Certainty only when 100; otherwise "Not applicable". */
function formatAcceptanceCertainty(text: string | undefined): string {
  const v = String(text ?? '').trim();
  return v === '100' ? '100' : 'Not applicable';
}

/**
 * Pre-approved badges and copy were hard-coded for all offers. Gate until we have a real rule
 * (e.g. per-offer flag from application-result API). Set to false until wired; then replace with
 * a real condition from product/API.
 */
const SHOW_PRE_APPROVED_MESSAGING = false;

/** Shown in dev or when VITE_SHOW_OFFER_SUPPORT_REFERENCE=true (e.g. staging). Not for public prod. */
const SHOW_OFFER_SUPPORT_REFERENCE =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_OFFER_SUPPORT_REFERENCE === 'true';

function OfferSupportReferencePanel(props: {
  webtoken: string | null;
  urlWebtoken: string | null;
  applicationIdFromUrl: string | null;
  responseTag: string | null | undefined;
}) {
  const urlTag = props.urlWebtoken?.trim() || '';
  const stateTag = props.webtoken?.trim() || '';
  const tagForRequests = stateTag || urlTag;
  const appId = props.applicationIdFromUrl?.trim() || '';
  const apiTag = props.responseTag?.trim() || '';

  if (!tagForRequests && !appId && !apiTag) {
    return null;
  }

  const tagsMatch = urlTag !== '' && stateTag !== '' && urlTag === stateTag;

  return (
    <details className="offer-support-reference">
      <summary className="offer-support-reference-summary">
        Support reference — expand and copy if LoanTube asks for your tag / IDs
      </summary>
      <div className="offer-support-reference-body">
        {tagsMatch ? (
          <p className="offer-support-reference-row">
            <span className="offer-support-reference-label">Tag (URL and in use)</span>
            <code className="offer-support-reference-code">{urlTag}</code>
          </p>
        ) : (
          <>
            {urlTag ? (
              <p className="offer-support-reference-row">
                <span className="offer-support-reference-label">Tag (from page URL)</span>
                <code className="offer-support-reference-code">{urlTag}</code>
              </p>
            ) : null}
            {stateTag && stateTag !== urlTag ? (
              <p className="offer-support-reference-row">
                <span className="offer-support-reference-label">Tag (in use after load)</span>
                <code className="offer-support-reference-code">{stateTag}</code>
              </p>
            ) : null}
          </>
        )}
        {appId ? (
          <p className="offer-support-reference-row">
            <span className="offer-support-reference-label">Application ID (URL)</span>
            <code className="offer-support-reference-code">{appId}</code>
          </p>
        ) : null}
        {apiTag ? (
          <p className="offer-support-reference-row">
            <span className="offer-support-reference-label">Tag (application-result response)</span>
            <code className="offer-support-reference-code">{apiTag}</code>
          </p>
        ) : (
          <p className="offer-support-reference-note">No successful application-result yet — response tag appears after offers load.</p>
        )}
      </div>
    </details>
  );
}

function buildLoanDetailsFromOffer(offer: Offer): LenderResultLoanDetails {
  const fmt = (n: number, style: 'currency' | 'percent' = 'currency') =>
    style === 'currency' ? `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${n.toFixed(2)}%`;
  return {
    loanAgreementNumber: offer.LenderReferenceID?.trim() ? offer.LenderReferenceID : undefined,
    loanAmount: offer.LoanAmount != null ? fmt(offer.LoanAmount) : undefined,
    loanTerm: offer.LoanDuration != null ? `${offer.LoanDuration} month${offer.LoanDuration !== 1 ? 's' : ''}` : undefined,
    monthlyInstalment: offer.EMIAmount != null ? fmt(offer.EMIAmount) : undefined,
    apr: offer.APR != null ? fmt(offer.APR, 'percent') : undefined,
    fee: offer.Fee != null ? fmt(offer.Fee) : undefined,
    totalRepayable: offer.TotalPayableAmount != null ? fmt(offer.TotalPayableAmount) : undefined,
  };
}

interface CreditProduct {
  id: string;
  lenderName: string;
  lenderLogo: string;
  creditLimit: string;
  aprRate: string;
  rateGuaranteed: boolean;
  status: 'available' | 'processing';
  preApproved: boolean;
  quoteValidFor: string;
  loanPayout: string;
  fees: string;
  earlyRepaymentAllowed: boolean;
  earlyRepaymentCharges: string;
  representativeExample: string;
}

const OfferPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State Management
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [isContinueModalOpen, setIsContinueModalOpen] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [expandedOffers, setExpandedOffers] = useState<Record<string, boolean>>({});
  const [acceptOfferError, setAcceptOfferError] = useState<string | null>(null);

  // API Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationResult, setApplicationResult] = useState<ApplicationResultResponse | null>(null);
  const [webtoken, setWebtoken] = useState<string | null>(null);
  
  // Layout stabilization refs
  const layoutStabilizedRef = useRef(false);
  const savedScrollPositionRef = useRef(0);

  // Fetch application result from API (with automatic retry on failure)
  const MAX_OFFER_FETCH_ATTEMPTS = 5;
  const OFFER_FETCH_RETRY_DELAY_MS = 2000;

  const fetchApplicationResult = useCallback(async (token: string, options?: { applicationId?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string }) => {
    setLoading(true);
    setError(null);
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_OFFER_FETCH_ATTEMPTS; attempt++) {
      try {
        console.log(`🚀 Fetching application result (attempt ${attempt}/${MAX_OFFER_FETCH_ATTEMPTS}) with token:`, token, options ? { applicationId: options.applicationId, utm: options } : '');
        const result = await ApplicationResultAPI.getApplicationResult(token, options);
        console.log('✅ Application result fetched successfully:', result);
        setApplicationResult(result);
        if (result?.tag) {
          setWebtoken(result.tag);
        }
        setLoading(false);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`❌ Attempt ${attempt}/${MAX_OFFER_FETCH_ATTEMPTS} failed:`, lastError.message);
        if (attempt < MAX_OFFER_FETCH_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, OFFER_FETCH_RETRY_DELAY_MS));
        } else {
          Sentry.captureException(lastError);
          setError(lastError.message || 'Failed to load offers');
        }
      }
    }

    setLoading(false);
  }, []);

  // Handle loan details update
  const handleUpdateLoanDetails = useCallback(async (loanAmount: number, loanDurationMonths: number) => {
    if (!webtoken) {
      throw new Error('Webtoken is missing. Please refresh the page.');
    }

    try {
      console.log('🔄 Updating loan details:', { webtoken, loanAmount, loanDurationMonths });
      setLoading(true);
      setError(null);
      
      const result = await ApplicationResultAPI.updateLoanDetails(webtoken, loanAmount, loanDurationMonths);
      console.log('✅ Loan details updated successfully:', result);
      
      // Update the application result with new data
      setApplicationResult(result.applicationResult);
      // If API returned a new webtoken (lead_id), use it for future requests
      if (result.newWebtoken) {
        setWebtoken(result.newWebtoken);
      }
      
      // Reset expanded offers since we have new data
      setExpandedOffers({});
    } catch (err) {
      console.error('❌ Error updating loan details:', err);
      Sentry.captureException(err);
      throw err; // Re-throw to let the modal handle the error display
    } finally {
      setLoading(false);
    }
  }, [webtoken]);

  // Prevent scroll restoration and stabilize layout
  useEffect(() => {
    // Prevent browser scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Prevent initial scroll jump
    window.scrollTo(0, 0);
  }, []);

  // Stabilize layout after offers load to prevent layout shifts
  useEffect(() => {
    if (!loading && applicationResult && !layoutStabilizedRef.current) {
      // Save current scroll position
      savedScrollPositionRef.current = window.scrollY;
      
      // Multiple stabilization passes to ensure layout is stable
      const stabilizeLayout = () => {
        // Force multiple reflows to ensure all images are loaded/rendered
        document.body.offsetHeight;
        document.documentElement.offsetHeight;
        
        // Wait for images to load
        const images = document.querySelectorAll('img');
        const imagePromises = Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
            // Timeout after 300ms to not block too long
            setTimeout(resolve, 300);
          });
        });
        
        Promise.all(imagePromises).then(() => {
          // Additional delay to ensure everything is settled
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Force final reflow
              document.body.offsetHeight;
              
              // Mark as stabilized
              layoutStabilizedRef.current = true;
              
              // Restore scroll position if it changed
              const currentScroll = window.scrollY;
              if (Math.abs(currentScroll - savedScrollPositionRef.current) > 5) {
                window.scrollTo({
                  top: savedScrollPositionRef.current,
                  behavior: 'auto'
                });
              }
            });
          });
        });
      };
      
      // Start stabilization after a small delay to let React finish rendering
      setTimeout(stabilizeLayout, 100);
    }
  }, [loading, applicationResult]);

  // Extract webtoken or applicationId + utm from URL on mount - only run once
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    // Prevent re-fetching if we already have data
    if (hasFetchedRef.current && applicationResult) {
      return;
    }

    const token = searchParams.get('webtoken');
    const applicationId = searchParams.get('applicationId');
    const utm_source = searchParams.get('utm_source');
    const utm_medium = searchParams.get('utm_medium');
    const utm_campaign = searchParams.get('utm_campaign');

    console.log('🔍 Checking for webtoken or applicationId in URL:', {
      searchParams: searchParams.toString(),
      token,
      applicationId,
      utm_source,
      utm_medium,
      utm_campaign,
      currentUrl: window.location.href,
    });

    const hasWebtoken = token != null && String(token).trim() !== '';
    const hasApplicationId = applicationId != null && String(applicationId).trim() !== '';

    if (hasWebtoken && !hasFetchedRef.current) {
      console.log('✅ Webtoken found, fetching application result:', token);
      hasFetchedRef.current = true;
      setWebtoken(token!.trim());
      fetchApplicationResult(token!.trim());
      return;
    }

    if (hasApplicationId && !hasFetchedRef.current) {
      console.log('✅ ApplicationId found (email/SMS), fetching application result:', applicationId);
      hasFetchedRef.current = true;
      fetchApplicationResult('', {
        applicationId: applicationId!.trim(),
        utm_source: utm_source ?? undefined,
        utm_medium: utm_medium ?? undefined,
        utm_campaign: utm_campaign ?? undefined,
      });
      return;
    }

    if (!hasWebtoken && !hasApplicationId) {
      console.warn('⚠️ No webtoken or applicationId found in URL');
      setError('No webtoken or applicationId found in URL. Please use the link from your email/SMS or submit the form first.');
      setLoading(false);
    }
  }, [searchParams, fetchApplicationResult, applicationResult]);

  // Helper Functions

  const handleContinueClick = (e: React.MouseEvent<HTMLButtonElement>, offerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If layout not stabilized yet, wait a bit and retry
    if (!layoutStabilizedRef.current) {
      // Queue the action to execute after layout stabilizes
      setTimeout(() => {
        if (layoutStabilizedRef.current) {
          setSelectedOfferId(offerId);
          setIsContinueModalOpen(true);
        }
      }, 100);
      return;
    }
    
    setSelectedOfferId(offerId);
    setAcceptOfferError(null);
    setIsContinueModalOpen(true);
  };

  const handleProceed = () => {
    const applicationIdFromUrl = searchParams.get('applicationId');
    const hasTag = webtoken != null && String(webtoken).trim() !== '';
    const hasApplicationId = applicationIdFromUrl != null && String(applicationIdFromUrl).trim() !== '';
    if (!hasTag && !hasApplicationId) {
      setAcceptOfferError('Tag or application ID is required. Please refresh the page and try again.');
      return;
    }
    if (!selectedOfferId || !applicationResult) return;

    let selectedOffer: Offer | null = null;
    for (const group of applicationResult.MatchedLenderList) {
      const offer = group.offers.find(o => o.OfferID.toString() === selectedOfferId);
      if (offer) {
        selectedOffer = offer;
        break;
      }
    }
    if (!selectedOffer) return;

    setAcceptOfferError(null);
    setIsContinueModalOpen(false);
    setSelectedOfferId(null);

    const listingLogoPath = getLenderLogoPath(selectedOffer.CompanyCode, selectedOffer.CompanyLogoUrl);
    const loanDetails = buildLoanDetailsFromOffer(selectedOffer);
    navigate('/lender-deeplink', {
      state: {
        webtoken: webtoken ?? undefined,
        applicationId: hasApplicationId ? applicationIdFromUrl!.trim() : undefined,
        offerId: parseInt(selectedOfferId, 10),
        lenderName: selectedOffer.CompanyName,
        lenderLogo: listingLogoPath || undefined,
        loanDetails,
      },
    });
  };



  const toggleOfferDetails = (e: React.MouseEvent<HTMLButtonElement>, offerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If layout not stabilized yet, wait a bit and retry
    if (!layoutStabilizedRef.current) {
      setTimeout(() => {
        if (layoutStabilizedRef.current) {
          setExpandedOffers(prev => ({
            ...prev,
            [offerId]: !prev[offerId]
          }));
        }
      }, 100);
      return;
    }
    
    setExpandedOffers(prev => ({
      ...prev,
      [offerId]: !prev[offerId]
    }));
  };

  // Process and sort offers from API
  const processOffers = (): MatchedLenderGroup[] => {
    if (!applicationResult) return [];
    
    // Product type priority order
    const productTypeOrder = ['unsecured', 'carfin', 'secured', 'guarantor', 'creditline'];
    
    // Sort groups by priority
    const sortedGroups = [...applicationResult.MatchedLenderList].sort((a, b) => {
      const indexA = productTypeOrder.indexOf(a.LenderProductType);
      const indexB = productTypeOrder.indexOf(b.LenderProductType);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    
    // Sort offers within each group
    return sortedGroups.map(group => ({
      ...group,
      offers: [...group.offers].sort((a, b) => {
        // Sort by APR (lowest first)
        if (a.APR !== b.APR) return a.APR - b.APR;
        // If APR same, sort by TotalPayableAmount (lowest first)
        if (a.TotalPayableAmount !== b.TotalPayableAmount) return a.TotalPayableAmount - b.TotalPayableAmount;
        // If both same, sort by LoanAmount (highest first)
        return b.LoanAmount - a.LoanAmount;
      })
    }));
  };

  // Get product type display name
  const getProductTypeName = (type: string): string => {
    const names: Record<string, string> = {
      'unsecured': 'Personal Loans',
      'carfin': 'Car Finance',
      'secured': 'Secured Loans',
      'guarantor': 'Guarantor Loans',
      'creditline': 'Credit Line Products'
    };
    return names[type] || type;
  };

  // Map lender CompanyCode to logo path
  // Format: {lenderCode}_logo.{extension}
  const getLenderLogoPath = (companyCode: string, companyLogoUrl?: string): string => {
    // For now display only from local assets (comment out to use API logo when present)
    // if (companyLogoUrl) {
    //   return companyLogoUrl;
    // }

    // Local mapping based on CompanyCode
    const lenderLogoMap: Record<string, string> = {
      '118118Money': '/assets/lenders/118118Money_logo.png',
      '1plus1': '/assets/lenders/1plus1_logo.png',
      'Abound': '/assets/lenders/Abound_logo.svg',
      'DraftyLoans': '/assets/lenders/DraftyLoans_logo.png',
      'EveryDayLoans': '/assets/lenders/EveryDayLoans_logo.png',
      'Evolutionmoney': '/assets/lenders/Evolutionmoney_logo.png',
      'loanscouk': '/assets/lenders/loanscouk_logo.svg',
      'Loans2Go': '/assets/lenders/Loans2Go_logo.png',
      'LoansbyMAL': '/assets/lenders/LoansbyMAL_logo.png',
      'MunzeeLoans': '/assets/lenders/MunzeeLoans_logo.png', // see MISSING_LENDER_LOGOS.md
      'SaladMoney': '/assets/lenders/SaladMoney_logo.png',
      'Carki': '/assets/lenders/Carki_logo.png',
      'SavvyLoans': '/assets/lenders/SavvyLoans_logo.png',
      'SelfyLoans': '/assets/lenders/everyday-selfy-loans-logo.png',
      'TheMoneyPlatformPersonal': '/assets/lenders/TheMoneyPlatformShortTerm_logo.png',
      'TheMoneyPlatformShortTerm': '/assets/lenders/TheMoneyPlatformShortTerm_logo.png',
      'TMAdvances': '/assets/lenders/TMAdvances_logo.png',
      'TootLoans': '/assets/lenders/TootLoans_logo.png',
      'UKCredit': '/assets/lenders/UKCredit_logo.png',
      'Zuto': '/assets/lenders/Zuto_logo.svg',
      '118118MoneyCreditCard': '/assets/lenders/118118Money_logo.png' // Use 118118Money logo
    };

    // 3) If we don't have a mapping, return empty string so no wrong logo is shown
    return lenderLogoMap[companyCode] ?? '';
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(amount);
  };

  // Format number with commas (kept for potential future use)
  // const formatNumber = (num: number): string => {
  //   return new Intl.NumberFormat('en-GB').format(num);
  // };

  // Render API Offer
  const renderAPIOffer = (offer: Offer) => {
    const offerId = offer.OfferID.toString();
    const isExpanded = expandedOffers[offerId] || false;
    const logoPath = getLenderLogoPath(offer.CompanyCode, offer.CompanyLogoUrl);
    const showLogo = logoPath.length > 0;

    return (
      <div key={offerId} className="loan-offer-card">
        <div className="loan-card-header">
          <h3 className="loan-card-title">
            {formatCurrency(offer.LoanAmount)} for {offer.LoanDuration} {offer.LoanDuration === 1 ? 'month' : 'months'}
          </h3>
          {SHOW_PRE_APPROVED_MESSAGING ? (
            <div className="loan-card-badge">
              <span className="pre-approved-text">Pre-approved</span>
              <div className="star-icon">
                <Star fill="currentColor"/>
              </div>
            </div>
          ) : null}
        </div>
        
        {/* Mobile Layout */}
        <div className="loan-card-main-mobile">
          <div className="loan-main-row-1">
            <div className="loan-logo-section">
              {showLogo ? (
                <img 
                  src={logoPath} 
                  alt={offer.CompanyName} 
                  className="loan-lender-logo"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                    if (placeholder) (placeholder as HTMLElement).style.display = 'block';
                  }}
                />
              ) : null}
              <span className="loan-logo-missing" style={{ display: showLogo ? 'none' : 'block' }} title={`Add /assets/lenders/${offer.CompanyCode}_logo.png or .svg`}>
                Logo missing
              </span>
            </div>
            <div className="loan-price-section">
              <div className="loan-monthly-payment">
                <span className="loan-amount">{formatCurrency(offer.EMIAmount)}</span>
                <span className="loan-period">per month</span>
              </div>
            </div>
          </div>

          <div className="loan-main-row-4">
            <span className="loan-type-label">{getProductTypeName(offer.LenderProductType)}</span>
            <button 
              className={`mobile-more-info ${isExpanded ? 'expanded' : ''}`}
              onClick={(e) => toggleOfferDetails(e, offerId)}
            >
              More Info
              {isExpanded ? (
                <X size={16} className="more-info-icon" />
              ) : (
                <ChevronDown size={16} className="more-info-icon" />
              )}
            </button>
          </div>

          {isExpanded && (
            <div className="loan-mobile-details-section expanded">
              <div className="loan-mobile-details-content">
                <div className="loan-detail-item">
                  <span className="loan-detail-label">Loan Term</span>
                  <span className="loan-detail-value">{offer.LoanDuration} months</span>
                </div>
                <div className="loan-detail-item">
                  <span className="loan-detail-label">Acceptance Certainty</span>
                  <span className="loan-detail-value">
                    <span className="detail-info-icon-wrap" data-tooltip={getInfoTooltip('acceptance-certainty')} aria-label={getInfoTooltip('acceptance-certainty')}>
                      <Info size={16} className="detail-info-icon" aria-hidden />
                    </span>
                    {formatAcceptanceCertainty(offer.ApprovalChanceText)}
                  </span>
                </div>
                <div className="loan-detail-item">
                  <span className="loan-detail-label">Loan payout to your bank</span>
                  <span className="loan-detail-value">
                    <span className="detail-info-icon-wrap" data-tooltip={getInfoTooltip('loan-payout')} aria-label={getInfoTooltip('loan-payout')}>
                      <Info size={16} className="detail-info-icon" aria-hidden />
                    </span>
                    {offer.PayOutDay || 'within 24 hours'}
                  </span>
                </div>
                <div className="loan-detail-item">
                  <span className="loan-detail-label">Fees</span>
                  <span className="loan-detail-value">
                    <span className="detail-info-icon-wrap" data-tooltip={getInfoTooltip('fees')} aria-label={getInfoTooltip('fees')}>
                      <Info size={16} className="detail-info-icon" aria-hidden />
                    </span>
                    {offer.Fee > 0 ? formatCurrency(offer.Fee) : 'No fees'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="loan-info-rows">
            <div className="loan-single-row">
              <div className="loan-left-info">
                <span className="loan-apr-label">APR</span>
                <span className="loan-apr-rate">{offer.APR.toFixed(1)}%</span>
              </div>
              <div className="loan-right-info">
                <span className="loan-total-label">Total repayable amount</span>
                <span className="loan-total-amount">{formatCurrency(offer.TotalPayableAmount)}</span>
              </div>
            </div>
          </div>

          <div className="loan-mobile-representative">
            <h5>Representative Example</h5>
            <p>
              If you borrow {formatCurrency(offer.LoanAmount)} over {offer.LoanDuration} months, 
              your representative APR will be {offer.APR.toFixed(2)}%. 
              Your monthly repayments will be {formatCurrency(offer.EMIAmount)} and 
              the total amount repayable will be {formatCurrency(offer.TotalPayableAmount)}.
            </p>
          </div>

          <div className="loan-mobile-continue-section">
            <button 
              className="loan-continue-btn available"
              onClick={(e) => handleContinueClick(e, offerId)}
            >
              Continue
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd" fill="currentColor" className='loan-continue-btn-icon'>
                <path d="M21.883 12l-7.527 6.235.644.765 9-7.521-9-7.479-.645.764 7.529 6.236h-21.884v1h21.883z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="loan-card-main-desktop">
          <div className="loan-logo-section">
            {showLogo ? (
              <img 
                src={logoPath} 
                alt={offer.CompanyName} 
                className="loan-lender-logo"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                  if (placeholder) (placeholder as HTMLElement).style.display = 'block';
                }}
              />
            ) : null}
            <span className="loan-logo-missing" style={{ display: showLogo ? 'none' : 'block' }} title={`Add /assets/lenders/${offer.CompanyCode}_logo.png or .svg`}>
              Logo missing
            </span>
          </div>
          
          <div className="loan-price-section">
            <div className="loan-monthly-payment">
              <div className="loan-amount">{formatCurrency(offer.EMIAmount)}</div>
              <div className="loan-period">per month</div>
            </div>
          </div>
          
          <div className="loan-action-section">
            <button 
              className="loan-continue-btn available"
              onClick={(e) => handleContinueClick(e, offerId)}
            >
              Continue
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd" fill="currentColor" className='loan-continue-btn-icon'>
                <path d="M21.883 12l-7.527 6.235.644.765 9-7.521-9-7.479-.645.764 7.529 6.236h-21.884v1h21.883z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="loan-info-row">
          <div className="loan-info-left">
            <span className="loan-type-label">{getProductTypeName(offer.LenderProductType)}</span>
            <button 
              className={`desktop-more-info ${isExpanded ? 'expanded' : ''}`}
              onClick={(e) => toggleOfferDetails(e, offerId)}
            >
              More Info
              {isExpanded ? (
                <X size={16} className="more-info-icon" />
              ) : (
                <ChevronDown size={16} className="more-info-icon" />
              )}
            </button>
          </div>
          <span className="loan-apr-rate">{offer.APR.toFixed(1)}% APR</span>
          <span className="loan-total-section">
            <span className="loan-total-label">Total repayable amount : </span>
            <span className="loan-total-amount">{formatCurrency(offer.TotalPayableAmount)}</span>
          </span>
        </div>

        {isExpanded && (
          <div className="loan-desktop-details-section expanded">
            <div className="loan-desktop-details-content">
              <div className="loan-detail-item">
                <span className="loan-detail-label">Loan Term</span>
                <span className="loan-detail-value">{offer.LoanDuration} months</span>
              </div>
              <div className="loan-detail-item">
                <span className="loan-detail-label">Acceptance Certainty</span>
                <span className="loan-detail-value">
                  <span className="detail-info-icon-wrap" data-tooltip={getInfoTooltip('acceptance-certainty')} aria-label={getInfoTooltip('acceptance-certainty')}>
                    <Info size={16} className="detail-info-icon" aria-hidden />
                  </span>
                  {formatAcceptanceCertainty(offer.ApprovalChanceText)}
                </span>
              </div>
              <div className="loan-detail-item">
                <span className="loan-detail-label">Loan payout to your bank</span>
                <span className="loan-detail-value">
                  <span className="detail-info-icon-wrap" data-tooltip={getInfoTooltip('loan-payout')} aria-label={getInfoTooltip('loan-payout')}>
                    <Info size={16} className="detail-info-icon" aria-hidden />
                  </span>
                  {offer.PayOutDay || 'within 24 hours'}
                </span>
              </div>
              <div className="loan-detail-item">
                <span className="loan-detail-label">Fees</span>
                <span className="loan-detail-value">
                  <span className="detail-info-icon-wrap" data-tooltip={getInfoTooltip('fees')} aria-label={getInfoTooltip('fees')}>
                    <Info size={16} className="detail-info-icon" aria-hidden />
                  </span>
                  {offer.Fee > 0 ? formatCurrency(offer.Fee) : 'No fees'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className={`loan-details-section ${isExpanded ? 'expanded' : ''}`}>
          <div className="loan-representative-example desktop-full-width">
            <h5>Representative Example</h5>
            <p>
              If you borrow {formatCurrency(offer.LoanAmount)} over {offer.LoanDuration} months, 
              your representative APR will be {offer.APR.toFixed(2)}%. 
              Your monthly repayments will be {formatCurrency(offer.EMIAmount)} and 
              the total amount repayable will be {formatCurrency(offer.TotalPayableAmount)}.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderCreditProductCard = (product: CreditProduct) => {
    return (
      <div key={product.id} className="credit-product-card">
        <div className="credit-product-header">
          <h3 className="credit-product-title">
            {SHOW_PRE_APPROVED_MESSAGING ? 'Pre-Approved Loan' : 'Loan'} {product.creditLimit} Credit Limit
          </h3>
        </div>
        
        <div className="credit-product-main">
          <div className="credit-product-logo-section">
            <img 
              src={product.lenderLogo} 
              alt={product.lenderName} 
              className="credit-product-lender-logo"
              loading="lazy"
              decoding="async"
            />
          </div>
          
          <div className="credit-product-credit-section">
            <div className="credit-product-credit-amount">
              <span className="credit-product-amount">{product.creditLimit}</span>
              <span className="credit-product-label">Credit Limit</span>
            </div>
          </div>
          
          <div className="credit-product-action-section">
            <button 
              className={`credit-product-continue-btn ${product.status === 'available' ? 'available' : 'processing'}`}
              onClick={(e) => product.status === 'available' && handleContinueClick(e, product.id)}
              disabled={product.status === 'processing'}
            >
              {product.status === 'available' ? 'Continue' : 'Processing'}
            </button>
          </div>
        </div>

        <div className="credit-product-message-section">
          <p className="credit-product-message-text">
            {SHOW_PRE_APPROVED_MESSAGING
              ? 'This flexible credit limit is pre-approved for you, which means you can withdraw it to your bank account straight away. This credit limit is subject to final checks by the lender.'
              : 'This flexible credit limit is subject to final checks by the lender.'}
          </p>
        </div>

        <div className="credit-product-details-main">
          <div className="credit-product-line-of-credit-card">
            <h4 className="credit-product-type-title">Line of Credit</h4>
            <div className="credit-product-apr-row">
              <span className="credit-product-apr-rate">{product.aprRate} APR</span>
              {product.rateGuaranteed && (
                <div className="credit-product-rate-guaranteed">
                  <img 
                    src="/assets/rate-guaranteed.png" 
                    alt="Rate Guaranteed" 
                    className="rate-guaranteed-image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
            </div>
            
            <div className="credit-product-representative-example">
              <h5>Representative Example</h5>
              <p>{product.representativeExample}</p>
            </div>
          </div>
          
          <div className="credit-product-details-column">
            {SHOW_PRE_APPROVED_MESSAGING ? (
              <div className="credit-product-detail-item">
                <span className="credit-product-detail-label">Pre-Approved</span>
                <span className="credit-product-detail-value">
                  {product.preApproved ? 'Yes, subject to final checks' : 'No'}
                </span>
              </div>
            ) : null}
            <div className="credit-product-detail-item">
              <span className="credit-product-detail-label">APR Rate</span>
              <span className="credit-product-detail-value">
                <span className="detail-info-icon-wrap" data-tooltip={getInfoTooltip('apr-rate')} aria-label={getInfoTooltip('apr-rate')}>
                  <Info size={16} className="detail-info-icon" aria-hidden />
                </span>
                {product.rateGuaranteed ? 'Guaranteed' : 'Variable'}
              </span>
            </div>
            <div className="credit-product-detail-item">
              <span className="credit-product-detail-label">Quote Valid for</span>
              <span className="credit-product-detail-value">
                <span className="detail-info-icon-wrap" data-tooltip={getInfoTooltip('quote-valid')} aria-label={getInfoTooltip('quote-valid')}>
                  <Info size={16} className="detail-info-icon" aria-hidden />
                </span>
                {product.quoteValidFor}
              </span>
            </div>
            <div className="credit-product-detail-item">
              <span className="credit-product-detail-label">Loan Payout to your bank</span>
              <span className="credit-product-detail-value">
<span className="detail-info-icon-wrap" data-tooltip={getInfoTooltip('loan-payout')} aria-label={getInfoTooltip('loan-payout')}>
                <Info size={16} className="detail-info-icon" aria-hidden />
                </span>
                {product.loanPayout}
              </span>
            </div>
            <div className="credit-product-detail-item">
              <span className="credit-product-detail-label">Fees</span>
              <span className="credit-product-detail-value">
<span className="detail-info-icon-wrap" data-tooltip={getInfoTooltip('fees')} aria-label={getInfoTooltip('fees')}>
                <Info size={16} className="detail-info-icon" aria-hidden />
                </span>
                {product.fees}
              </span>
            </div>
            <div className="credit-product-detail-item">
              <span className="credit-product-detail-label">Early Repayment Allowed</span>
              <span className="credit-product-detail-value">
                {product.earlyRepaymentAllowed ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="credit-product-detail-item">
              <span className="credit-product-detail-label">Early Repayment Charges</span>
              <span className="credit-product-detail-value">
                {product.earlyRepaymentCharges}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTestProductCard = (product: CreditProduct) => {
    return (
      <div key={product.id} className="test-product-card">
        <div className="loan-card-header">
          <h3 className="loan-card-title">
            {SHOW_PRE_APPROVED_MESSAGING ? 'Pre-Approved Loan' : 'Loan'} {product.creditLimit} Credit Limit
          </h3>
          {SHOW_PRE_APPROVED_MESSAGING ? (
            <div className="loan-card-badge">
              <span className="pre-approved-text">Pre-approved</span>
              <div className="test-star-icon">
                <img 
                  src="/assets/star-loan-card.svg" 
                  alt="Star" 
                  className="star-loan-card-icon"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          ) : null}
        </div>
        
        <div className="test-product-main">
          <div className="test-product-logo-section">
            <img 
              src={product.lenderLogo} 
              alt={product.lenderName} 
              className="test-product-lender-logo"
              loading="lazy"
              decoding="async"
            />
          </div>
          
          <div className="test-product-credit-section">
            <div className="test-product-credit-amount">
              <span className="test-product-amount">{product.creditLimit}</span>
              <span className="test-product-label">Credit Limit</span>
            </div>
          </div>
          
          <div className="test-product-action-section">
            <button 
              className={`loan-continue-btn ${product.status === 'available' ? 'available' : 'processing'}`}
              onClick={(e) => product.status === 'available' && handleContinueClick(e, product.id)}
              disabled={product.status === 'processing'}
            >
              {product.status === 'available' ? (
                <>
                  Continue
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd" fill="currentColor" className='loan-continue-btn-icon'>
                    <path d="M21.883 12l-7.527 6.235.644.765 9-7.521-9-7.479-.645.764 7.529 6.236h-21.884v1h21.883z"/>
                  </svg>
                </>
              ) : 'Processing'}
            </button>
          </div>
        </div>

        <div className="test-info-row">
          <div className="test-info-left">
            <span className="test-type-label">Line of Credit</span>
          </div>
          <span className="test-apr-rate">{product.aprRate} APR</span>
          <span className="test-total-section">
            <span className="test-total-label">Total repayable amount : </span>
            <span className="test-total-amount">£1,414.32</span>
          </span>
          
        </div>

        <div className="test-product-representative-example desktop-full-width">
          <p>
            {SHOW_PRE_APPROVED_MESSAGING
              ? 'This flexible credit limit is pre-approved for you, which means you can withdraw it to your bank account straight away. This credit limit is subject to final checks by the lender.'
              : 'This flexible credit limit is subject to final checks by the lender.'}
          </p>
        </div>

        <div className="test-product-details-main">
          <div className="test-product-line-of-credit-card">
            <div className="test-product-representative-example">
              <h5>Representative Example</h5>
              <p>{product.representativeExample}</p>
            </div>
          </div>
          
          <div className="test-product-details-column">
            {SHOW_PRE_APPROVED_MESSAGING ? (
              <div className="test-product-detail-item">
                <span className="test-product-detail-label">Pre-Approved</span>
                <span className="test-product-detail-value">
                  {product.preApproved ? 'Yes, subject to final checks' : 'No'}
                </span>
              </div>
            ) : null}
            <div className="test-product-detail-item">
              <span className="test-product-detail-label">APR Rate</span>
              <span className="test-product-detail-value">
                <span className="detail-info-icon-wrap" data-tooltip={getInfoTooltip('apr-rate')} aria-label={getInfoTooltip('apr-rate')}>
                  <Info size={16} className="detail-info-icon" aria-hidden />
                </span>
                {product.rateGuaranteed ? 'Guaranteed' : 'Variable'}
              </span>
            </div>
            <div className="test-product-detail-item">
              <span className="test-product-detail-label">Quote Valid for</span>
              <span className="test-product-detail-value">
                <span className="detail-info-icon-wrap" data-tooltip={getInfoTooltip('quote-valid')} aria-label={getInfoTooltip('quote-valid')}>
                  <Info size={16} className="detail-info-icon" aria-hidden />
                </span>
                {product.quoteValidFor}
              </span>
            </div>
            <div className="test-product-detail-item">
              <span className="test-product-detail-label">Loan Payout to your bank</span>
              <span className="test-product-detail-value">
<span className="detail-info-icon-wrap" data-tooltip={getInfoTooltip('loan-payout')} aria-label={getInfoTooltip('loan-payout')}>
                <Info size={16} className="detail-info-icon" aria-hidden />
                </span>
                {product.loanPayout}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="offer-page-wrapper">
      <div className="offer-page-layout">
        <OfferPageSidebar />
        
        <div className="offer-main-container">
          <ModifySearchModal 
            isModifyModalOpen={isModifyModalOpen}
            setIsModifyModalOpen={setIsModifyModalOpen}
            webtoken={webtoken}
            currentLoanAmount={applicationResult?.LoanAmount || 0}
            currentLoanDuration={applicationResult?.LoanDuration || 0}
            onUpdate={handleUpdateLoanDetails}
          />
          <ContinueModal 
            isContinueModalOpen={isContinueModalOpen}
            setIsContinueModalOpen={setIsContinueModalOpen}
            handleProceed={handleProceed}
            errorMessage={acceptOfferError}
          />

          
          <main className="offer-content-area">
            {loading && (
              <div className="offer-loading">
                <div className="spinner-container">
                  <div className="spinner"></div>
                </div>
                <p>Loading loan offers...</p>
                {applicationResult && applicationResult.AwaitingOffers > 0 && (
                  <p className="awaiting-offers">Awaiting {applicationResult.AwaitingOffers} more offer(s)...</p>
                )}
              </div>
            )}

            {error && (
              <div className="offer-error">
                <h2>Error Loading Offers</h2>
                <p>{error}</p>
                {(webtoken || searchParams.get('applicationId')) && (
                  <button 
                    onClick={() => {
                      const t = searchParams.get('webtoken');
                      const aid = searchParams.get('applicationId');
                      if (t?.trim()) {
                        fetchApplicationResult(t.trim());
                      } else if (aid?.trim()) {
                        fetchApplicationResult('', {
                          applicationId: aid.trim(),
                          utm_source: searchParams.get('utm_source') ?? undefined,
                          utm_medium: searchParams.get('utm_medium') ?? undefined,
                          utm_campaign: searchParams.get('utm_campaign') ?? undefined,
                        });
                      }
                    }}
                    className="retry-button"
                  >
                    Retry
                  </button>
                )}
                {SHOW_OFFER_SUPPORT_REFERENCE ? (
                  <OfferSupportReferencePanel
                    webtoken={webtoken}
                    urlWebtoken={searchParams.get('webtoken')}
                    applicationIdFromUrl={searchParams.get('applicationId')}
                    responseTag={applicationResult?.tag}
                  />
                ) : null}
              </div>
            )}

            {!loading && !error && applicationResult && (
              <>
            <div className="offer-results-header">
                  <h1 className="offer-results-title">
                    Total {applicationResult.TotalOfferCount} loan offer{applicationResult.TotalOfferCount !== 1 ? 's' : ''} found
                  </h1>
              <div className="offer-header-loan-info">
                    <span className="offer-header-amount-term">
                      {formatCurrency(applicationResult.LoanAmount)} for {applicationResult.LoanDuration} {applicationResult.LoanDuration === 1 ? 'month' : 'months'}
                    </span>
                    {applicationResult.IsUpdatable && (
                <button 
                  className="offer-modify-search-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // If layout not stabilized yet, wait a bit and retry
                    if (!layoutStabilizedRef.current) {
                      setTimeout(() => {
                        if (layoutStabilizedRef.current) {
                          setIsModifyModalOpen(true);
                        }
                      }, 100);
                      return;
                    }
                    
                    setIsModifyModalOpen(true);
                  }}
                >
                  Modify
                </button>
                    )}
              </div>
            </div>

                {applicationResult.AwaitingOffers > 0 && (
                  <div className="awaiting-offers-banner">
                    <Info size={16} />
                    <span>Awaiting {applicationResult.AwaitingOffers} more offer(s). Offers will appear as they become available.</span>
                  </div>
                )}

                {processOffers().map((group) => (
                  <section key={group.LenderProductType} className="offer-loans-section">
              <div className="offer-section-header">
                <div className="offer-section-icon">
                  <img 
                    src="/assets/right-arrow-offer-page.png" 
                          alt={getProductTypeName(group.LenderProductType)} 
                    className="offer-personal-icon-image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                      <h2 className="offer-section-title">{getProductTypeName(group.LenderProductType)}</h2>
              </div>
              
              <div className="offer-cards-container">
                      {group.offers.map(offer => renderAPIOffer(offer))}
              </div>
            </section>
                ))}

                {applicationResult.UnMatchedLenders && applicationResult.UnMatchedLenders.length > 0 && (
            <section className="offer-loans-section">
              <div className="offer-section-header">
                      <h2 className="offer-section-title">Unmatched Lenders</h2>
                </div>
                    <div className="unmatched-lenders">
                      {applicationResult.UnMatchedLenders.map((lender, index) => (
                        <div key={index} className="unmatched-lender-item">
                          <img src={lender.LogoUrl} alt={lender.CompanyName} />
                          <div>
                            <p><strong>{lender.CompanyName}</strong></p>
                            <p className="failed-validation">{lender.Failed_Validations}</p>
              </div>
                        </div>
                      ))}
              </div>
            </section>
                )}

                {applicationResult.DeclinedLenders && applicationResult.DeclinedLenders.length > 0 && (
            <section className="offer-loans-section">
              <div className="offer-section-header">
                      <h2 className="offer-section-title">Declined Lenders</h2>
                </div>
                    <div className="declined-lenders">
                      {applicationResult.DeclinedLenders.map((lender, index) => (
                        <div key={index} className="declined-lender-item">
                          <img src={lender.LogoUrl} alt={lender.CompanyName} />
                          <p>{lender.CompanyName}</p>
              </div>
                      ))}
              </div>
            </section>
                )}
              </>
            )}

            <section className="offer-additional-info">
              <h2 className="offer-info-title">Additional Information</h2>
              <div className="offer-info-content">
                <h3 className="offer-info-subtitle">Rate Guaranteed by LoanTube</h3>
                <p>
                  Rate Guaranteed by LoanTube is a badge that we give to loan offers where we have arrangements with the lender to lock the APR rate for you. However a lender may change this rate for one of the following reasons:
                </p>
                <p className="info-list-item">
                  <Check size={16} className="info-check-icon" /> You change the loan amount or duration
                </p>
                <p className="info-list-item">
                  <Check size={16} className="info-check-icon" /> You provided inaccurate or incomplete information
                </p>
                <p className="info-list-item">
                  <Check size={16} className="info-check-icon" /> During the final checks the lender finds some information which makes your profile look riskier than before
                </p>
                <p>
                  During your customer journey on LoanTube or within the lender's platform, you are never under any obligation to continue your customer journey. You can refuse the loan offer at any point before signing the loan agreement with the lender or within a period of 14 days following the signing of the loan agreement.
                </p>

                <h3 className="offer-info-subtitle">Acceptance Certainty score</h3>
                <p>
                  Acceptance certainty is a score which our lenders provide us for your loan application. It shows the likelihood of you being accepted by a lender based on a soft credit search on you and processing of visible information you provided us in your loan application. However, the displayed loan offers are still subject to affordability, fraud, anti-money laundering and other final verification checks.
                </p>

                {SHOW_PRE_APPROVED_MESSAGING ? (
                  <>
                    <h3 className="offer-info-subtitle">Pre-Approved Loan</h3>
                    <p>
                      This loan is pre-approved for you, which means you&apos;ll get this loan if all the details you&apos;ve given us are correct and you pass additional checks of the lenders.
                    </p>
                  </>
                ) : null}
              </div>
            </section>

            {SHOW_OFFER_SUPPORT_REFERENCE && !error ? (
              <OfferSupportReferencePanel
                webtoken={webtoken}
                urlWebtoken={searchParams.get('webtoken')}
                applicationIdFromUrl={searchParams.get('applicationId')}
                responseTag={applicationResult?.tag}
              />
            ) : null}
          </main>
        </div>
      </div>

      <OfferPageFooter />
    </div>
  );
};

export default OfferPage; 