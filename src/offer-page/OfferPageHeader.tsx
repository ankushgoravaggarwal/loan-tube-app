import React from 'react';

const OfferPageHeader: React.FC = () => {

  const logoMobileLeftUrl = "/assets/loantube-n-logo.svg";
  
  const logoAlt = "LoanTube";

  return (
    <header className="offer-page-header">
      <div className="header-container">
        <div className="header-logo">
          <img src={logoMobileLeftUrl} alt={logoAlt} />
        </div>
      </div>
    </header>
  );
};

export default OfferPageHeader; 