import React, { useEffect, useState } from 'react';
import OfferPageHeader from './OfferPageHeader';
import OfferPageFooter from './OfferPageFooter';
import '../styles/OfferPage.css';

interface LenderDeeplinkProps {
  lenderName?: string;
  lenderLogo?: string;
}

const LenderDeeplink: React.FC<LenderDeeplinkProps> = ({
  lenderName = "Salad",
  lenderLogo = "https://dvl9cyxa05rs.cloudfront.net/wp-content/uploads/2025/04/salad-money_logo.svg"
}) => {
  const [dots, setDots] = useState('');
  const [countdown, setCountdown] = useState(10); // New state for countdown

  // Animated dots effect and redirect timer
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 0) {
          clearInterval(countdownInterval);
          window.location.href = '/lender-result'; // Redirect after 10 seconds
          return 0;
        }
        return prev - 1;
      });
    }, 1000); // Update countdown every second

    return () => {
      clearInterval(dotInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  const logoUrl = "/assets/loantube-n-logo.svg";

  return (
    <div className="offer-page-container">
      <OfferPageHeader />
      
      <main className="offer-main-content">
        <div className="deeplink-container">
          <div className="deeplink-content">
            <h1 className="deeplink-title">
              We are connecting you to your lender - {lenderName}
            </h1>
            
            <div className="connection-animation">
              <div className="logo-container">
                <div className="logo-item">
                  <img src={logoUrl} alt="LoanTube" className="company-logo" />
                </div>
                
                <div className="connection-flow">
                  <div className="arrow-container">
                    <div className="arrow-line"></div>
                    <div className="arrow-head"></div>
                    <div className="arrow-head arrow-head-2"></div>
                    <div className="arrow-head arrow-head-3"></div>
                  </div>
                </div>
                
                <div className="logo-item">
                  <img src={lenderLogo} alt={lenderName} className="lender-logo-deeplink" />
                </div>
              </div>
            </div>
            
            <div className="loading-section">
              <p className="loading-text">
                If the page doesn't open in {countdown} seconds, please{' '}
                <a href="#" className="manual-link">click here</a>
              </p>
              <div className="loading-dots">
                <span>Loading{dots}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <OfferPageFooter />
    </div>
  );
};

export default LenderDeeplink; 