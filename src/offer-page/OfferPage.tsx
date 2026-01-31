import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Info, Star, ChevronDown, X } from 'lucide-react';
import OfferPageSidebar from './OfferPageSidebar';
import OfferPageFooter from './OfferPageFooter';
import { ModifySearchModal, ContinueModal } from './OfferpageModals';
import { ApplicationResultAPI, type Offer, type MatchedLenderGroup, type ApplicationResultResponse } from '../services/apiService';

import '../styles/OfferPage.css';

interface LoanOffer {
  id: string;
  loanTerm: string;
  status: 'available' | 'processing';
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

  // Fetch application result from API
  const fetchApplicationResult = useCallback(async (token: string) => {
    try {
      console.log('🚀 Starting to fetch application result with token:', token);
      setLoading(true);
      setError(null);
      const result = await ApplicationResultAPI.getApplicationResult(token);
      console.log('✅ Application result fetched successfully:', result);
      setApplicationResult(result);
    } catch (err) {
      console.error('❌ Error fetching application result:', err);
      setError(err instanceof Error ? err.message : 'Failed to load offers');
    } finally {
      setLoading(false);
    }
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

  // Extract webtoken from URL on mount - only run once
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    // Prevent re-fetching if we already have data
    if (hasFetchedRef.current && applicationResult) {
      return;
    }
    
    const token = searchParams.get('webtoken');
    console.log('🔍 Checking for webtoken in URL:', { 
      searchParams: searchParams.toString(), 
      token,
      currentUrl: window.location.href 
    });
    
    if (token && !hasFetchedRef.current) {
      console.log('✅ Webtoken found, fetching application result:', token);
      hasFetchedRef.current = true;
      setWebtoken(token);
      fetchApplicationResult(token);
    } else if (!token) {
      console.warn('⚠️ No webtoken found in URL');
      setError('No webtoken found in URL. Please submit the form first.');
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
    if (!webtoken) {
      setAcceptOfferError('Tag is required. Please refresh the page and try again.');
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

    navigate('/lender-deeplink', {
      state: {
        webtoken,
        offerId: parseInt(selectedOfferId, 10),
        lenderName: selectedOffer.CompanyName,
        lenderLogo: selectedOffer.CompanyLogoUrl,
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
    // TODO: Hardcoded for demo - will be corrected later
    return "https://dvl9cyxa05rs.cloudfront.net/wp-content/uploads/2025/04/salad-money_logo.svg";
    
    // Original implementation (commented out for demo):
    // If API provides logo URL, use it first
    // if (companyLogoUrl) {
    //   return companyLogoUrl;
    // }

    // Map CompanyCode to logo filename
    // const lenderLogoMap: Record<string, string> = {
    //   '118118Money': '/assets/lenders/118118Money_logo.png',
    //   '1plus1': '/assets/lenders/1plus1_logo.png',
    //   'Abound': '/assets/lenders/Abound_logo.svg',
    //   'DraftyLoans': '/assets/lenders/DraftyLoans_logo.png',
    //   'EveryDayLoans': '/assets/lenders/EveryDayLoans_logo.png',
    //   'Evolutionmoney': '/assets/lenders/Evolutionmoney_logo.png',
    //   'loanscouk': '/assets/lenders/loanscouk_logo.svg',
    //   'Loans2Go': '/assets/lenders/Loans2Go_logo.png',
    //   'LoansbyMAL': '/assets/lenders/LoansbyMAL_logo.png',
    //   'MunzeeLoans': '/assets/lenders/MunzeeLoans_logo.png',
    //   'SaladMoney': '/assets/lenders/SaladMoney_logo.png',
    //   'Carki': '/assets/lenders/Carki_logo.png',
    //   'SavvyLoans': '/assets/lenders/SavvyLoans_logo.png',
    //   'SelfyLoans': '/assets/lenders/EveryDayLoans_logo.png', // Use EveryDayLoans logo
    //   'TheMoneyPlatformPersonal': '/assets/lenders/TheMoneyPlatformPersonal_logo.png',
    //   'TheMoneyPlatformShortTerm': '/assets/lenders/TheMoneyPlatformShortTerm_logo.png',
    //   'TMAdvances': '/assets/lenders/TMAdvances_logo.png',
    //   'TootLoans': '/assets/lenders/TootLoans_logo.png',
    //   'UKCredit': '/assets/lenders/UKCredit_logo.png',
    //   'Zuto': '/assets/lenders/Zuto_logo.svg',
    //   '118118MoneyCreditCard': '/assets/lenders/118118Money_logo.png' // Use 118118Money logo
    // };

    // Return mapped logo or default fallback (use a generic/neutral logo)
    // return lenderLogoMap[companyCode] || '/assets/loantube-n-logo.svg';
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
    
    return (
      <div key={offerId} className="loan-offer-card">
        <div className="loan-card-header">
          <h3 className="loan-card-title">
            {formatCurrency(offer.LoanAmount)} for {offer.LoanDuration} {offer.LoanDuration === 1 ? 'month' : 'months'}
          </h3>
          <div className="loan-card-badge">
            <span className="pre-approved-text">Pre-approved</span>
            <div className="star-icon">
              <Star fill="currentColor"/>
            </div>
          </div>
        </div>
        
        {/* Mobile Layout */}
        <div className="loan-card-main-mobile">
          <div className="loan-main-row-1">
            <div className="loan-logo-section">
              <img 
                src={getLenderLogoPath(offer.CompanyCode, offer.CompanyLogoUrl)} 
                alt={offer.CompanyName} 
                className="loan-lender-logo"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/loantube-n-logo.svg';
                }}
              />
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
                    <Info size={16} className="detail-info-icon" />
                    {offer.ApprovalChanceText || 'NA'}
                  </span>
                </div>
                <div className="loan-detail-item">
                  <span className="loan-detail-label">Loan payout to your bank</span>
                  <span className="loan-detail-value">
                    <Info size={16} className="detail-info-icon" />
                    {offer.PayOutDay || 'within 24 hours'}
                  </span>
                </div>
                <div className="loan-detail-item">
                  <span className="loan-detail-label">Fees</span>
                  <span className="loan-detail-value">
                    <Info size={16} className="detail-info-icon" />
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
            <img 
              src={getLenderLogoPath(offer.CompanyCode, offer.CompanyLogoUrl)} 
              alt={offer.CompanyName} 
              className="loan-lender-logo"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/lenders/118118Money_logo.png';
              }}
            />
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
                  <Info size={16} className="detail-info-icon" />
                  {offer.ApprovalChanceText || 'NA'}
                </span>
              </div>
              <div className="loan-detail-item">
                <span className="loan-detail-label">Loan payout to your bank</span>
                <span className="loan-detail-value">
                  <Info size={16} className="detail-info-icon" />
                  {offer.PayOutDay || 'within 24 hours'}
                </span>
              </div>
              <div className="loan-detail-item">
                <span className="loan-detail-label">Fees</span>
                <span className="loan-detail-value">
                  <Info size={16} className="detail-info-icon" />
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

  // Old render functions (kept for fallback, will be removed)
  const renderLoanOffer = (offer: LoanOffer) => {
    // Note: This function uses hardcoded data and is not currently used
    // The actual offers are rendered via renderAPIOffer which uses getLenderLogoPath
    return (
      <div key={offer.id} className="loan-offer-card">
        <div className="loan-card-header">
          <h3 className="loan-card-title">£1000 for 12 months</h3>
          <div className="loan-card-badge">
            <span className="pre-approved-text">Pre-approved</span>
            <div className="star-icon">
              <Star fill="currentColor"/>
            </div>
          </div>
        </div>
        
        {/* Mobile Layout */}
        <div className="loan-card-main-mobile">
          {/* First Row: Logo Left, Amount Right */}
          <div className="loan-main-row-1">
            <div className="loan-logo-section">
              <img 
                src="/assets/lenders/118118Money_logo.png" 
                alt="SALAD" 
                className="loan-lender-logo"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="loan-price-section">
              <div className="loan-monthly-payment">
                <span className="loan-amount">£117.86</span>
                <span className="loan-period">per month</span>
              </div>
            </div>
          </div>

          {/* Second Row: Personal Loan Left, More Info Right */}
          <div className="loan-main-row-4">
            <span className="loan-type-label">Personal Loan</span>
            <button 
              className={`mobile-more-info ${expandedOffers[offer.id] ? 'expanded' : ''}`}
              onClick={(e) => toggleOfferDetails(e, offer.id)}
            >
              More Info
              {expandedOffers[offer.id] ? (
                <X size={16} className="more-info-icon" />
              ) : (
                <ChevronDown size={16} className="more-info-icon" />
              )}
            </button>
          </div>

          {/* Mobile Details Section - Shows loan details on mobile when expanded */}
          <div 
            className={`loan-mobile-details-section ${expandedOffers[offer.id] ? 'expanded' : ''}`}
          >
            <div className="loan-mobile-details-content">
              <div className="loan-detail-item">
                <span className="loan-detail-label">Loan Term</span>
                <span className="loan-detail-value">{offer.loanTerm}</span>
              </div>
              <div className="loan-detail-item">
                <span className="loan-detail-label">Acceptance Certainty</span>
                <span className="loan-detail-value">
                  <Info size={16} className="detail-info-icon" />
                  NA
                </span>
              </div>
              <div className="loan-detail-item">
                <span className="loan-detail-label">Loan payout to your bank</span>
                <span className="loan-detail-value">
                  <Info size={16} className="detail-info-icon" />
                  within 24 hours
                </span>
              </div>
              <div className="loan-detail-item">
                <span className="loan-detail-label">Fees</span>
                <span className="loan-detail-value">
                  <Info size={16} className="detail-info-icon" />
                  No fees
                </span>
              </div>
            </div>
          </div>

          {/* Third Row: APR Left and Total Amount Right */}
          <div className="loan-info-rows">
            <div className="loan-single-row">
              <div className="loan-left-info">
                <span className="loan-apr-label">APR</span>
                <span className="loan-apr-rate">79.5%</span>
              </div>
              <div className="loan-right-info">
                <span className="loan-total-label">Total repayable amount</span>
                <span className="loan-total-amount">£1,414.32</span>
              </div>
            </div>
          </div>

          {/* Mobile Representative Example Section */}
          <div className="loan-mobile-representative">
            <h5>Representative Example</h5>
            <p>If you borrow £1,000 over 12 months, your representative APR will be 79.50%. Your monthly repayments will be £117.86 and the total amount repayable will be £1,414.32.</p>
          </div>

          {/* Mobile Continue Button - Centered */}
          <div className="loan-mobile-continue-section">
            <button 
              className={`loan-continue-btn ${offer.status === 'available' ? 'available' : 'processing'}`}
              onClick={(e) => offer.status === 'available' && handleContinueClick(e, offer.id)}
              disabled={offer.status === 'processing'}
            >
              {offer.status === 'available' ? (
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

        {/* Desktop Layout - Modified structure */}
        <div className="loan-card-main-desktop">
          <div className="loan-logo-section">
            <img 
              src="/assets/lenders/118118Money_logo.png" 
              alt="SALAD" 
              className="loan-lender-logo"
              loading="lazy"
              decoding="async"
            />
          </div>
          
          <div className="loan-price-section">
            <div className="loan-monthly-payment">
              <div className="loan-amount">£117.86</div>
              <div className="loan-period">per month</div>
            </div>
          </div>
          
          <div className="loan-action-section">
            <button 
              className={`loan-continue-btn ${offer.status === 'available' ? 'available' : 'processing'}`}
              onClick={(e) => offer.status === 'available' && handleContinueClick(e, offer.id)}
              disabled={offer.status === 'processing'}
            >
              {offer.status === 'available' ? (
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

        {/* Desktop Info Row - Modified structure for desktop */}
        <div className="loan-info-row">
          <div className="loan-info-left">
            <span className="loan-type-label">Personal Loan</span>
            <button 
              className={`desktop-more-info ${expandedOffers[offer.id] ? 'expanded' : ''}`}
              onClick={(e) => toggleOfferDetails(e, offer.id)}
            >
              More Info
              {expandedOffers[offer.id] ? (
                <X size={16} className="more-info-icon" />
              ) : (
                <ChevronDown size={16} className="more-info-icon" />
              )}
            </button>
          </div>
          <span className="loan-apr-rate">79.5% APR</span>
          <span className="loan-total-section">
            <span className="loan-total-label">Total repayable amount : </span>
            <span className="loan-total-amount">£1,414.32</span>
          </span>
        </div>

        {/* Desktop Details Section - Shows loan details on desktop when expanded */}
        <div 
          className={`loan-desktop-details-section ${expandedOffers[offer.id] ? 'expanded' : ''}`}
        >
          <div className="loan-desktop-details-content">
            <div className="loan-detail-item">
              <span className="loan-detail-label">Loan Term</span>
              <span className="loan-detail-value">{offer.loanTerm}</span>
            </div>
            <div className="loan-detail-item">
              <span className="loan-detail-label">Acceptance Certainty</span>
              <span className="loan-detail-value">
                <Info size={16} className="detail-info-icon" />
                NA
              </span>
            </div>
            <div className="loan-detail-item">
              <span className="loan-detail-label">Loan payout to your bank</span>
              <span className="loan-detail-value">
                <Info size={16} className="detail-info-icon" />
                within 24 hours
              </span>
            </div>
            <div className="loan-detail-item">
              <span className="loan-detail-label">Fees</span>
              <span className="loan-detail-value">
                <Info size={16} className="detail-info-icon" />
                No fees
              </span>
            </div>
          </div>
        </div>

        {/* Details Section - Modified for desktop */}
        <div 
          className={`loan-details-section ${expandedOffers[offer.id] ? 'expanded' : ''}`}
        >
          {/* Loan Details - Hidden on desktop, visible on mobile */}
          <div className="loan-details-column mobile-only">
            <div className="loan-detail-item">
              <span className="loan-detail-label">Loan Term</span>
              <span className="loan-detail-value">{offer.loanTerm}</span>
            </div>
            <div className="loan-detail-item">
              <span className="loan-detail-label">Acceptance Certainty</span>
              <span className="loan-detail-value">
                <Info size={16} className="detail-info-icon" />
                NA
              </span>
            </div>
            <div className="loan-detail-item">
              <span className="loan-detail-label">Loan payout to your bank</span>
              <span className="loan-detail-value">
                <Info size={16} className="detail-info-icon" />
                within 24 hours
              </span>
            </div>
            <div className="loan-detail-item">
              <span className="loan-detail-label">Fees</span>
              <span className="loan-detail-value">
                <Info size={16} className="detail-info-icon" />
                No fees
              </span>
            </div>
          </div>

          {/*New Box-For Test*/}
          <div className="loan-representative-example desktop-full-width">
            <p>This Flexible Credit Limit is pre-approved for you, which means you can withdraw it to your bank account straight away. This credit limit is subject to final checks by the lender.</p>
          </div>

          {/* Representative Example - Full width on desktop */}
          <div className="loan-representative-example desktop-full-width">
            <h5>Representative Example</h5>
            <p>If you borrow £1,000 over 12 months, your representative APR will be 79.50%. Your monthly repayments will be £117.86 and the total amount repayable will be £1,414.32.</p>
          </div>
        </div>


      </div>
    );
  };

  const renderCreditProductCard = (product: CreditProduct) => {
    return (
      <div key={product.id} className="credit-product-card">
        <div className="credit-product-header">
          <h3 className="credit-product-title">Pre-Approved Loan {product.creditLimit} Credit Limit</h3>
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
            This flexible credit limit is pre-approved for you, which means you can withdraw it to your bank account straight away. This credit limit is subject to final checks by the lender.
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
            <div className="credit-product-detail-item">
              <span className="credit-product-detail-label">Pre-Approved</span>
              <span className="credit-product-detail-value">
                {product.preApproved ? 'Yes, subject to final checks' : 'No'}
              </span>
            </div>
            <div className="credit-product-detail-item">
              <span className="credit-product-detail-label">APR Rate</span>
              <span className="credit-product-detail-value">
                <Info size={16} className="detail-info-icon" />
                {product.rateGuaranteed ? 'Guaranteed' : 'Variable'}
              </span>
            </div>
            <div className="credit-product-detail-item">
              <span className="credit-product-detail-label">Quote Valid for</span>
              <span className="credit-product-detail-value">
                <Info size={16} className="detail-info-icon" />
                {product.quoteValidFor}
              </span>
            </div>
            <div className="credit-product-detail-item">
              <span className="credit-product-detail-label">Loan Payout to your bank</span>
              <span className="credit-product-detail-value">
                <Info size={16} className="detail-info-icon" />
                {product.loanPayout}
              </span>
            </div>
            <div className="credit-product-detail-item">
              <span className="credit-product-detail-label">Fees</span>
              <span className="credit-product-detail-value">
                <Info size={16} className="detail-info-icon" />
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
          <h3 className="loan-card-title">Pre-Approved Loan {product.creditLimit} Credit Limit</h3>
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
            This flexible credit limit is pre-approved for you, which means you can withdraw it to your bank account straight away. This credit limit is subject to final checks by the lender.
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
            <div className="test-product-detail-item">
              <span className="test-product-detail-label">Pre-Approved</span>
              <span className="test-product-detail-value">
                {product.preApproved ? 'Yes, subject to final checks' : 'No'}
              </span>
            </div>
            <div className="test-product-detail-item">
              <span className="test-product-detail-label">APR Rate</span>
              <span className="test-product-detail-value">
                <Info size={16} className="detail-info-icon" />
                {product.rateGuaranteed ? 'Guaranteed' : 'Variable'}
              </span>
            </div>
            <div className="test-product-detail-item">
              <span className="test-product-detail-label">Quote Valid for</span>
              <span className="test-product-detail-value">
                <Info size={16} className="detail-info-icon" />
                {product.quoteValidFor}
              </span>
            </div>
            <div className="test-product-detail-item">
              <span className="test-product-detail-label">Loan Payout to your bank</span>
              <span className="test-product-detail-value">
                <Info size={16} className="detail-info-icon" />
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
                {webtoken && (
                  <button 
                    onClick={() => fetchApplicationResult(webtoken)}
                    className="retry-button"
                  >
                    Retry
                  </button>
                )}
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

                <h3 className="offer-info-subtitle">Pre-Approved Loan</h3>
                <p>
                  This loan is pre-approved for you, which means you'll get this loan if all the details you've given us are correct and you pass additional checks of the lenders.
                </p>
              </div>
            </section>
          </main>
        </div>
      </div>

      <OfferPageFooter />
    </div>
  );
};

export default OfferPage; 