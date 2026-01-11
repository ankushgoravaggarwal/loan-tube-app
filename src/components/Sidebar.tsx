import React, { useMemo } from 'react';
import '../styles/Sidebar.css';
import { usePartner } from '../partner/PartnerContext';

interface SidebarProps {
  testimonials: {
    name: string;
    text: string;
  }[];
}

// Star SVG component extracted for reusability
const StarIcon: React.FC<{ index: number; i: number }> = ({ index, i }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    xmlnsXlink="http://www.w3.org/1999/xlink" 
    width="30px" 
    zoomAndPan="magnify" 
    viewBox="0 0 48.75 44.999999" 
    height="30px" 
    preserveAspectRatio="xMidYMid meet" 
    version="1.0"
    className="star"
  >
    <defs>
      <clipPath id={`star-clip-1-${index}-${i}`}>
        <path d="M 0.00390625 0.410156 L 48.5 0.410156 L 48.5 44.457031 L 0.00390625 44.457031 Z M 0.00390625 0.410156 " clipRule="nonzero"/>
      </clipPath>
      <clipPath id={`star-clip-2-${index}-${i}`}>
        <path d="M 0.00390625 0.410156 L 35 0.410156 L 35 39 L 0.00390625 39 Z M 0.00390625 0.410156 " clipRule="nonzero"/>
      </clipPath>
    </defs>
    <g clipPath={`url(#star-clip-1-${index}-${i})`}>
      <path fill="#ffa902" d="M 36.382812 29.007812 L 39.058594 44.5 L 25.046875 36.070312 C 24.785156 35.941406 24.496094 35.882812 24.21875 35.882812 L 24.175781 35.882812 L 24.058594 35.894531 C 24.03125 35.894531 23.941406 35.910156 23.839844 35.941406 C 23.796875 35.953125 23.726562 35.96875 23.636719 36.011719 L 23.519531 36.054688 L 9.480469 44.5 L 10.453125 38.859375 L 12.15625 29.007812 C 12.242188 28.46875 12.066406 27.917969 11.675781 27.539062 L 0.339844 16.570312 L 16.007812 15.421875 L 16.019531 15.421875 C 16.558594 15.332031 17.023438 15 17.257812 14.519531 L 24.261719 0.421875 L 31.28125 14.519531 C 31.515625 15 31.980469 15.332031 32.519531 15.421875 L 34.945312 15.59375 L 48.203125 16.570312 L 36.863281 27.539062 C 36.472656 27.917969 36.28125 28.46875 36.382812 29.007812 " fillOpacity="1" fillRule="nonzero"/>
    </g>
    <g clipPath={`url(#star-clip-2-${index}-${i})`}>
      <path fill="#ffb628" d="M 10.453125 38.859375 L 12.15625 29.007812 C 12.167969 28.90625 12.183594 28.820312 12.183594 28.71875 C 12.183594 28.28125 12.007812 27.859375 11.675781 27.539062 L 0.339844 16.570312 L 16.007812 15.421875 L 16.019531 15.421875 C 16.558594 15.332031 17.023438 15 17.257812 14.519531 L 24.261719 0.421875 L 31.28125 14.519531 C 31.515625 15 31.980469 15.332031 32.519531 15.421875 L 34.945312 15.59375 C 31.675781 27.117188 22.269531 36.097656 10.453125 38.859375 " fillOpacity="1" fillRule="nonzero"/>
    </g>
  </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ testimonials }) => {
  const { partner, isPartnerRoute } = usePartner();
  
  // Consolidate all partner color styles into a single memoized object
  const partnerStyles = useMemo(() => {
    const styles: { [key: string]: React.CSSProperties } = {};
    if (isPartnerRoute && partner) {
      if (partner.secondary_color) {
        styles.sidebar = { backgroundColor: partner.secondary_color };
      }
      if (partner.sidebar_loan_text_color) {
        styles.sidebarLoanText = { color: partner.sidebar_loan_text_color };
      }
      if (partner.sidebar_words_text_color) {
        styles.sidebarWordsText = { color: partner.sidebar_words_text_color };
      }
      if (partner.customer_name_color) {
        styles.customerName = { color: partner.customer_name_color };
      }
    }
    return styles;
  }, [isPartnerRoute, partner]);

  // Memoize logo URL and alt text to prevent unnecessary image reloads
  const logoData = useMemo(() => {
    const logoUrl = isPartnerRoute && partner?.logo_left_enabled && partner?.logo_left_url
      ? partner.logo_left_url
      : "/assets/loantube-n-logo.svg";
      
    const logoAlt = isPartnerRoute && partner ? partner.name : "LoanTube";
    
    return { logoUrl, logoAlt };
  }, [isPartnerRoute, partner?.logo_left_enabled, partner?.logo_left_url, partner?.name]);

  return (
    <div className="sidebar" style={partnerStyles.sidebar}>
      <div className="sidebar-content">
        <div className="logo-container">
          <div className="logo-wrapper">
            <img 
              src={logoData.logoUrl} 
              alt={logoData.logoAlt} 
              className="logo"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>

        <div className="pledge-box">
          <div className="pledge-content">
            {isPartnerRoute && partner?.logo_pledge_box_enabled && partner?.logo_pledge_box_url ? (
              <div className="partner-pledge-logo-only">
                <img 
                  src={partner.logo_pledge_box_url} 
                  alt={partner.name}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : (
              <>
                <div className="pledge-icon-wrapper">
                  <img 
                    src="/assets/pledge-svg-updated.svg" 
                    alt="Pledge" 
                    className="pledge-icon"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div>
                  <h3 className="pledge-title">Pledge of Integrity</h3>
                  <p className="pledge-text">
                    We do not sell your data, unsolicited, to any third party firms.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="tagline-container">
          <p className="tagline" style={partnerStyles.sidebarLoanText}>
            Find your loan with <span className="highlight" style={partnerStyles.sidebarWordsText}>confidence</span>
          </p>
          <p className="tagline-1" style={partnerStyles.sidebarLoanText}>
            Here's what our <span className="highlight" style={partnerStyles.sidebarWordsText}>customers</span> have to{' '}
            <span className="highlight" style={partnerStyles.sidebarWordsText}>say</span>
          </p>
          <p className="tagline-2" style={partnerStyles.sidebarLoanText}>
            (showing our selected 5 star reviews)
          </p>
        </div>

        <div className="testimonials-container">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <h4 className="testimonial-name" style={partnerStyles.customerName}>{testimonial.name}</h4>
              <div className="stars-container">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} index={index} i={i} />
                ))}
              </div>
              <p className="testimonial-text">"{testimonial.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 