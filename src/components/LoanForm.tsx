import { useMemo } from 'react';
import Sidebar from './Sidebar';
import MultiStepForm from './MultiStepForm';
import Footer from './Footer';
import '../styles/LoanForm.css';
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

const LoanForm = () => {
  const { partner, isPartnerRoute } = usePartner();
  
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

  return (
    <>
    <div className="loan-container">
      {/* Mobile Header - Visible only on mobile */}
      <div className="mobile-header">
        <div className="mobile-logo">
          <img 
            src={logoData.logoMobileLeftUrl} 
            alt={logoData.logoAlt}
            loading="eager"
            decoding="async"
          />
        </div>
        <div className="mobile-rating">
          <RatingDisplay 
            isPartnerRoute={isPartnerRoute}
            partner={partner}
            logoEnabled={partner?.logo_mobile_right_enabled}
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

        <MultiStepForm />
      </div>
    </div>
    {/* Footer Section */}
    <Footer />
    </>
  );
};

export default LoanForm;