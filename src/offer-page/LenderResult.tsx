import React from 'react';
import OfferPageHeader from './OfferPageHeader';
import OfferPageFooter from './OfferPageFooter';
import '../styles/OfferPage.css';
import { ArrowLeft } from 'lucide-react';

interface LoanDetails {
  loanAgreementNumber: string;
  loanAmount: string;
  loanTerm: string;
  monthlyInstalment: string;
  apr: string;
  totalRepayable: string;
}

interface LenderResultProps {
  lenderName?: string;
  lenderLogo?: string;
  phoneNumber?: string;
  loanDetails?: LoanDetails;
}

const LenderResult: React.FC<LenderResultProps> = ({
  lenderName = "Evlo",
  lenderLogo = "https://dvl9cyxa05rs.cloudfront.net/wp-content/uploads/2025/03/evlo-loans-logo.png",
  phoneNumber = "0117 4508292",
  loanDetails = {
    loanAgreementNumber: "52789125",
    loanAmount: "£3,000 for 12 months",
    monthlyInstalment: "£261.09",
    apr: "58.42%",
    totalRepayable: "£3,000.00"
  }
}) => {

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="offer-page-container">
      <OfferPageHeader />
      
      <main className="offer-main-content">
        <div className="result-container">
          <div className="result-content">
            <div className="result-header">
              <h1 className="result-title">
                Congratulations! Your loan is approved in-principle by
              </h1>
              
              <div className="lender-display">
                <img src={lenderLogo} alt={lenderName} className="result-lender-logo" />
              </div>
            </div>
            
            <div className="loan-details-section">
              <h2 className="details-heading">Here are your loan details:</h2>
              
              <div className="details-grid">
                <div className="detail-card">
                  <div className="detail-label">Loan Agreement Number</div>
                  <div className="detail-value">{loanDetails.loanAgreementNumber}</div>
                </div>
                
                <div className="detail-card">
                  <div className="detail-label">Loan Approved</div>
                  <div className="detail-value">{loanDetails.loanAmount}</div>
                </div>
                
                <div className="detail-card">
                  <div className="detail-label">Monthly Instalment</div>
                  <div className="detail-value">{loanDetails.monthlyInstalment}</div>
                </div>
                
                <div className="detail-card">
                  <div className="detail-label">APR</div>
                  <div className="detail-value">{loanDetails.apr}</div>
                </div>
                
                <div className="detail-card">
                  <div className="detail-label">Total Repayable Amount</div>
                  <div className="detail-value">{loanDetails.totalRepayable}</div>
                </div>
              </div>
            </div>
            
            <div className="completion-section">
              <p className="completion-text">
                Please call {lenderName} at the number below to complete the rest of your application with them.
              </p>
              
              <div className="phone-section">
                <a href={`tel:${phoneNumber}`} className="phone-button">
                  Call {phoneNumber}
                </a>
              </div>
              
              <div className="note-section">
                <p className="note-text">
                  <strong>Note:</strong> You will only receive the loan amount in your bank account once you have completed the rest of the application process with {lenderName} by calling them at the number above.
                </p>
              </div>
            </div>
            
            <div className="back-section">
              <button onClick={handleGoBack} className="back-button-offer-page">
                <ArrowLeft size={16} />
                go back to previous page
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <OfferPageFooter />
    </div>
  );
};

export default LenderResult; 