import React, { useState, useMemo, useEffect } from 'react';
import { usePartner } from '../partner/PartnerContext';
import { scrollToFormPosition } from '../utils/scrollUtils';
import Sidebar from './Sidebar';
import Footer from './Footer';
import '../styles/LoanForm.css';
import { Partner } from '../partner/partnerService';

interface RatingDisplayProps {
  isPartnerRoute: boolean;
  partner: Partner | null; 
  logoEnabled: boolean | null | undefined;
  logoUrl: string | null | undefined;
}

const RatingDisplay = ({ isPartnerRoute, partner, logoEnabled, logoUrl }: RatingDisplayProps) => {
  if (isPartnerRoute && logoEnabled && logoUrl) {
    return (
      <div className="partner-rating-logo-only">
        <img 
          src={logoUrl} 
          alt={partner?.name} 
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }
  return (
    <>
      <img 
        src="/assets/google-icon-logo.svg" 
        alt="Google" 
        className="google-icon"
        loading="lazy"
        decoding="async"
      />
      <div className="rating-text">
        Google Rating
        <div className="rating-score">
          4.7 <img 
            src="/assets/stars.svg" 
            alt="4.7 stars" 
            className="stars-img"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </>
  );
};

const TestApp: React.FC = () => {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const { partner, isPartnerRoute } = usePartner();

  // Add scroll effect only on initial mount
  useEffect(() => {
    // Use a ref or flag to ensure this only runs once on initial load
    const hasScrolled = sessionStorage.getItem('testAppScrolled');
    if (!hasScrolled) {
      scrollToFormPosition(5, 1);
      sessionStorage.setItem('testAppScrolled', 'true');
    }
  }, []);

  // Memoize all logo URLs and data to prevent unnecessary image reloads
  const logoData = useMemo(() => {
    const logoLeftUrl = isPartnerRoute && partner?.logo_left_enabled && partner?.logo_left_url
      ? partner.logo_left_url
      : "/assets/loantube-n-logo.svg";
    
    const logoMobileLeftUrl = isPartnerRoute && partner?.logo_mobile_left_enabled && partner?.logo_mobile_left_url
      ? partner.logo_mobile_left_url
      : "/assets/loantube-n-logo.svg";
    
    const logoAlt = isPartnerRoute && partner ? partner.name : "LoanTube";
    
    return { logoLeftUrl, logoMobileLeftUrl, logoAlt };
  }, [
    isPartnerRoute, 
    partner?.logo_left_enabled, 
    partner?.logo_left_url,
    partner?.logo_mobile_left_enabled,
    partner?.logo_mobile_left_url,
    partner?.name
  ]);

  // Consolidate partner-specific styles into a single memoized object
  const partnerStyles = useMemo(() => {
    if (isPartnerRoute && partner) {
      const primaryColor = partner.primary_color;
      const navbarButtonBgColor = partner.navbar_button_background_color;
      const navbarButtonTextColor = partner.navbar_button_text_color;
      const shadowEnabled = partner.shadow_enabled;
      const shadowColor = partner.shadow_color;

      const styles: {
        buttonStyle: React.CSSProperties;
        linkStyle: React.CSSProperties;
      } = {
        buttonStyle: {},
        linkStyle: {},
      };

      // buttonStyle
      if (navbarButtonBgColor) {
        styles.buttonStyle.backgroundColor = navbarButtonBgColor;
      } else if (primaryColor) {
        styles.buttonStyle.backgroundColor = primaryColor;
      }
      if (navbarButtonTextColor) {
        styles.buttonStyle.color = navbarButtonTextColor;
      }
      if (shadowEnabled && shadowColor) {
        styles.buttonStyle.boxShadow = `0 4px 8px ${shadowColor}`;
      } else if (shadowEnabled === false) {
        styles.buttonStyle.boxShadow = 'none';
      }

      // linkStyle
      if (primaryColor) {
        styles.linkStyle.color = primaryColor;
      }

      return styles;
    }
    return {
      buttonStyle: {},
      linkStyle: { color: '#ff2048' },
    };
  }, [isPartnerRoute, partner]);

  const { buttonStyle, linkStyle } = partnerStyles;

  const testimonials = [
    {
      name: 'Jon Grainger',
      text: 'Very fast, very nice. Will make sure that you get money. Perfect thanks',
    },
    {
      name: 'Zoe Mardel',
      text: 'Was made so easy ... kind and caring staff',
    },
    {
      name: 'Math Littlefair',
      text: 'Easy to apply for a loan, the staff are polite and friendly. Highly recommended',
    },
  ];

  // Handle checkbox changes to prevent any scroll issues
  const handleAcceptTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAcceptTerms(e.target.checked);
  };

  const handleMarketingConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMarketingConsent(e.target.checked);
  };

  // Handle label clicks to prevent any unwanted behavior
  const handleLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle form submission (placeholder for now)
  const handleFindLoan = () => {
    console.log('Finding loan...');
    console.log('Accept Terms:', acceptTerms);
    console.log('Marketing Consent:', marketingConsent);
  };

  // Handle back button (placeholder for now)
  const handleBack = () => {
    console.log('Going back...');
  };

  // Handle link clicks to prevent scroll issues
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Let the link work normally, just prevent any propagation that might cause issues
    e.stopPropagation();
  };

  return (
    <>
      <div className="loan-container">
        {/* Mobile Header - Visible only on mobile */}
        <div className="mobile-header">
          <div className="mobile-logo">
            <img 
              src={logoData.logoMobileLeftUrl} 
              alt={logoData.logoAlt}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="mobile-rating">
            <RatingDisplay 
              isPartnerRoute={isPartnerRoute}
              partner={partner}
              logoEnabled={partner?.logo_right_enabled}
              logoUrl={partner?.logo_mobile_right_url}
            />
          </div>
        </div>

        {/* Left Sidebar - Hidden on Mobile */}
        <Sidebar testimonials={testimonials} />

        {/* Right Form Section */}
        <div className="form-section">
          {/* Desktop Rating - Hidden on mobile */}
          <div className="desktop-only-rating">
            <div className="google-rating-desktop">
              <RatingDisplay
                isPartnerRoute={isPartnerRoute}
                partner={partner}
                logoEnabled={partner?.logo_right_enabled}
                logoUrl={partner?.logo_right_url}
              />
            </div>
          </div>

          {/* Form Container */}
          <div className="form-container">
            {/* Progress Indicator */}
            <div className="progress-container">
              <div className="progress-label">Application Submission</div>
              <div className="progress-bar">
                <div 
                  className="progress-indicator" 
                  style={{ width: '100%', backgroundColor: isPartnerRoute && partner?.primary_color ? partner.primary_color : '#ff2048' }}
                />
              </div>
            </div>
            
            {/* Test App Content */}
            <div>
              <h2 className="form-title">By clicking 'Find your loan' you agree that:</h2>
              
              <div className="terms-container">
                <ol className="terms-list">
                  <li className="term-item">
                    <span className="term-number">1.</span>
                    <div className="term-content">
                      You accept our{' '}
                      <a 
                        href="https://www.loantube.com/terms-and-conditions/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={linkStyle}
                        onClick={handleLinkClick}
                      >
                        Terms & Conditions
                      </a>
                      ,{' '}
                      <a 
                        href="https://www.loantube.com/privacy-policy/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={linkStyle}
                        onClick={handleLinkClick}
                      >
                        Privacy Policy
                      </a>
                      , and{' '}
                      <a 
                        href="https://www.loantube.com/cookies-policy/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={linkStyle}
                        onClick={handleLinkClick}
                      >
                        Cookies Policy
                      </a>
                      .
                    </div>
                  </li>
                  
                  <li className="term-item">
                    <span className="term-number">2.</span>
                    <div className="term-content">
                      LoanTube may share your information with its panel of{' '}
                      <a 
                        href="https://www.loantube.com/our-partners/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={linkStyle}
                        onClick={handleLinkClick}
                      >
                        partners
                      </a>
                      , who will process it to assess your application, including eligibility and affordability checks.
                    </div>
                  </li>
                  
                  <li className="term-item">
                    <span className="term-number">3.</span>
                    <div className="term-content">
                      LoanTube and its partners may contact you about your application, the checks required, and your experience by email, SMS, phone, or post.
                    </div>
                  </li>
                  
                  <li className="term-item">
                    <span className="term-number">4.</span>
                    <div className="term-content">
                      LoanTube and its partners may use credit reference and fraud prevention agencies to run soft credit, ID, KYC, AML, and fraud checks. Soft credit checks do not affect your credit score.
                    </div>
                  </li>
                  
                  <li className="term-item">
                    <span className="term-number">5.</span>
                    <div className="term-content">
                      LoanTube works with selected partners, not the whole market, and may receive commission from them. In some cases, this commission may affect the cost of products offered.
                    </div>
                  </li>
                </ol>
              </div>

              <div className="test-checkbox-container">
                <div className="test-checkbox-item required">
                  <label className="test-checkbox-label" onClick={handleLabelClick}>
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={handleAcceptTermsChange}
                      className="test-checkbox-input"
                    />
                    <span className="test-checkbox-custom"></span>
                    <span className="test-checkbox-text">
                      I accept the above terms <span className="test-required">(required)</span>
                    </span>
                  </label>
                </div>
                
                <div className="test-checkbox-item optional">
                  <label className="test-checkbox-label" onClick={handleLabelClick}>
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={handleMarketingConsentChange}
                      className="test-checkbox-input"
                    />
                    <span className="test-checkbox-custom"></span>
                    <span className="test-checkbox-text">
                    Yes, I'd like to stay updated <span className="test-optional">(optional)</span>
                    </span>
                  </label>
                  <div className="test-checkbox-description">
                    We may contact you about loans, credit, and other financial products or services by email, SMS, phone, or post. You can withdraw consent at any time by emailing{' '}
                    <a 
                      href="mailto:info@loantube.com" 
                      style={linkStyle}
                      onClick={handleLinkClick}
                    >
                      info@loantube.com
                    </a>
                    {' '}or by using the unsubscribe link in our emails. This will not affect your current application.
                  </div>
                </div>
              </div>

              <div className="navigation-buttons-app">
                <button
                  className="back-button"
                  onClick={handleBack}
                >
                  <svg className='back-button-icon' viewBox="64 64 896 896" focusable="false" data-icon="left" fill="currentColor" aria-hidden="true">
                      <path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"></path>
                    </svg> Back
                </button>
                <button
                  className={`submit-button ${acceptTerms ? 'enabled' : 'disabled'}`}
                  onClick={handleFindLoan}
                  disabled={!acceptTerms}
                  style={acceptTerms ? buttonStyle : {}}
                >
                  Find your loan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </>
  );
};

export default TestApp;
