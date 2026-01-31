import React from 'react';
import OfferPageHeader from './OfferPageHeader';
import OfferPageFooter from './OfferPageFooter';
import { ArrowLeft, Phone } from 'lucide-react';
import '../styles/OfferPage.css';
import '../styles/LenderDeeplinkResult.css';

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

  const phoneDigits = phoneNumber.replace(/\s/g, '');

  return (
    <div className="offer-page-container lender-page-wrap">
      <OfferPageHeader />

      <main className="offer-main-content lender-page-main">
        <div className="lender-card">
          <div className="lender-result-content">
            <span className="lender-result-badge">Approved in principle</span>
            <h1 className="lender-result-title">
              Your next step with {lenderName}
            </h1>
            <p className="lender-result-lender-name">
              {lenderName} has approved your application in principle. Complete the steps below to receive your loan.
            </p>

            <div className="lender-result-logo-wrap">
              <img src={lenderLogo} alt={lenderName} className="lender-result-logo" />
            </div>

            <section className="lender-result-details-card" aria-label="Loan details">
              <h2 className="lender-result-details-title">Your loan details</h2>
              <div className="lender-result-details-grid">
                <div className="lender-result-detail-row">
                  <span className="lender-result-detail-label">Agreement number</span>
                  <span className="lender-result-detail-value">{loanDetails.loanAgreementNumber}</span>
                </div>
                <div className="lender-result-detail-row">
                  <span className="lender-result-detail-label">Loan amount</span>
                  <span className="lender-result-detail-value">{loanDetails.loanAmount}</span>
                </div>
                <div className="lender-result-detail-row">
                  <span className="lender-result-detail-label">Monthly payment</span>
                  <span className="lender-result-detail-value">{loanDetails.monthlyInstalment}</span>
                </div>
                <div className="lender-result-detail-row">
                  <span className="lender-result-detail-label">APR</span>
                  <span className="lender-result-detail-value">{loanDetails.apr}</span>
                </div>
                <div className="lender-result-detail-row">
                  <span className="lender-result-detail-label">Total repayable</span>
                  <span className="lender-result-detail-value">{loanDetails.totalRepayable}</span>
                </div>
              </div>
            </section>

            <section className="lender-result-next-step">
              <h2 className="lender-result-next-step-title">What you need to do now</h2>
              <p className="lender-result-next-step-desc">
                Call {lenderName} on the number below to finish your application. They’ll confirm your details and arrange payout.
              </p>
              <div className="lender-result-phone-wrap">
                <a
                  href={`tel:${phoneDigits}`}
                  className="lender-result-phone-btn"
                  aria-label={`Call ${lenderName} on ${phoneNumber}`}
                >
                  <Phone size={20} aria-hidden />
                  <span className="lender-result-phone-num">{phoneNumber}</span>
                </a>
              </div>
            </section>

            <div className="lender-result-note">
              <strong>Important:</strong> You’ll only receive the loan in your bank account after you’ve completed the final steps with {lenderName} by calling the number above.
            </div>

            <div className="lender-result-back-wrap">
              <button
                type="button"
                onClick={handleGoBack}
                className="lender-result-back-btn"
                aria-label="Go back to previous page"
              >
                <ArrowLeft size={18} aria-hidden />
                Back to previous page
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
