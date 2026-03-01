import React from 'react';
import { ArrowLeft } from 'lucide-react';

export interface BackLinkProps {
  onGoBack: () => void;
}

export const BackLink: React.FC<BackLinkProps> = ({ onGoBack }) => (
  <p className="customer-lender-result-prev">
    <button type="button" onClick={onGoBack} className="customer-lender-result-back-btn">
      <ArrowLeft size={16} aria-hidden />
      go back to previous page
    </button>
  </p>
);
