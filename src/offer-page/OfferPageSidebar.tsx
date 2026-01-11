import React from 'react';
import '../styles/OfferPageSidebar.css';
import { usePartner } from '../partner/PartnerContext';
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
      <div className="offer-page-partner-rating-logo-only">
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
        className="offer-page-google-icon"
        loading="lazy"
        decoding="async"
      />
      <div className="offer-page-rating-text">
        Google Rating
        <div className="offer-page-rating-score">
          4.7 <img 
            src="/assets/stars.svg" 
            alt="4.7 stars" 
            className="offer-page-stars-img"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </>
  );
};

const OfferPageSidebar: React.FC = () => {
  const { partner, isPartnerRoute } = usePartner();

  // Get partner colors for styling
  const sidebarStyle = isPartnerRoute && partner?.secondary_color 
    ? { backgroundColor: partner.secondary_color } 
    : {};

  const logoUrl = isPartnerRoute && partner?.logo_left_enabled && partner?.logo_left_url
    ? partner.logo_left_url
    : "/assets/loantube-n-logo.svg";
    
  const logoAlt = isPartnerRoute && partner ? partner.name : "LoanTube";

  const logoMobileUrl = isPartnerRoute && partner?.logo_mobile_left_enabled && partner?.logo_mobile_left_url
    ? partner.logo_mobile_left_url
    : "/assets/loantube-n-logo.svg";

  return (
    <>
      {/* Mobile Header - Visible only on mobile */}
      <div className="offer-page-mobile-header">
        <div className="offer-page-mobile-logo">
          <img 
            src={logoMobileUrl} 
            alt={logoAlt}
            loading="eager"
            decoding="async"
          />
        </div>
        <div className="offer-page-mobile-rating">
          <RatingDisplay 
            isPartnerRoute={isPartnerRoute}
            partner={partner}
            logoEnabled={partner?.logo_mobile_right_enabled}
            logoUrl={partner?.logo_mobile_right_url}
          />
        </div>
      </div>

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="offer-sidebar" style={sidebarStyle}>
        <div className="offer-sidebar-content">
          {/* Logo Section */}
          <div className="offer-logo-container">
            <div className="offer-logo-wrapper">
              <img 
                src={logoUrl} 
                alt={logoAlt} 
                className="offer-logo"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>

          {/* Pledge of Integrity Section */}
          <div className="offer-pledge-box">
            <div className="offer-pledge-content">
              {isPartnerRoute && partner?.logo_pledge_box_enabled && partner?.logo_pledge_box_url ? (
                <div className="offer-partner-pledge-logo-only">
                  <img 
                    src={partner.logo_pledge_box_url} 
                    alt={partner.name}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ) : (
                <>
                  <div className="offer-pledge-icon-wrapper">
                    <img 
                      src="/assets/pledge-svg-updated.svg" 
                      alt="Pledge" 
                      className="offer-pledge-icon"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div>
                    <h3 className="offer-pledge-title">Pledge of Integrity</h3>
                    <p className="offer-pledge-text">
                      We do not sell your data, unsolicited, to any third party firms.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Warning Section */}
          <div className="offer-warning-box">
            <div className="offer-warning-content">
              <p className="offer-warning-title">
                Warning: Late repayment can cause you serious money problems. For help, go to{' '}
                <a href="https://moneyhelper.org.uk" target="_blank" rel="noopener noreferrer">
                  moneyhelper.org.uk
                </a>
              </p>
              <p className="offer-warning-subtitle">
                Think carefully before securing debts against your home. Your home may be repossessed if you do not keep up repayments on any debt secured against it.
              </p>
            </div>
          </div>
          
          <div className="comission-disclosure-box">
            <div className="offer-warning-content">
              <p className="offer-warning-title">
              LoanTube connects applicants with various providers of financial products.
              </p>
              <p className="offer-warning-title">
              <span className="offer-warning-title-bold">We receive a commission from lenders and providers </span>for facilitating these connections.
              </p>
              <p className="offer-warning-subtitle">
              LoanTube does not cover the entire market, meaning other products may be available to you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OfferPageSidebar; 