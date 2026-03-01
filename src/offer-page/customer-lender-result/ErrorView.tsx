import React from 'react';
import { ArrowLeft } from 'lucide-react';
import OfferPageHeader from '../OfferPageHeader';
import OfferPageFooter from '../OfferPageFooter';
import '../../styles/OfferPage.css';
import '../../styles/CustomerLenderResult.css';

export interface ErrorViewProps {
  message: string;
  onGoBack: () => void;
}

const ErrorView: React.FC<ErrorViewProps> = ({ message, onGoBack }) => (
  <div className="offer-page-container customer-lender-result-wrap">
    <OfferPageHeader />
    <main className="offer-main-content customer-lender-result-main">
      <div className="customer-lender-result-card">
        <p className="customer-lender-result-error">{message}</p>
        <button type="button" onClick={onGoBack} className="customer-lender-result-back-btn">
          <ArrowLeft size={18} aria-hidden />
          Go back
        </button>
      </div>
    </main>
    <OfferPageFooter />
  </div>
);

export default ErrorView;
