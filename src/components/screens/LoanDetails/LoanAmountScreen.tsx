import React from 'react';
import { FormData } from '../../types/FormTypes';

interface LoanAmountScreenProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: () => void;
  buttonStyle: React.CSSProperties;
  textColorStyle: React.CSSProperties;
  inputFocusStyle: React.CSSProperties;
  inputErrorStyle: React.CSSProperties;
  errorMessageStyle: React.CSSProperties;
  buttonIds: {
    ctaButtonId: string;
  };
}

const LoanAmountScreen: React.FC<LoanAmountScreenProps> = ({
  formData,
  setFormData,
  nextStep,
  buttonStyle,
  textColorStyle,
  inputFocusStyle,
  inputErrorStyle,
  errorMessageStyle,
  buttonIds
}) => {
  const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    // Limit to 6 characters
    const limitedValue = value.slice(0, 6);
    setFormData({ ...formData, loanAmount: limitedValue });
  };

  // Check if value is within the allowed range (after user has entered something)
  const isInValidRange = (value: string) => {
    const numValue = parseInt(value, 10);
    return numValue >= 250 && numValue <= 250000;
  };

  // Valid if input exists and is in range
  const isValidInput = formData.loanAmount && formData.loanAmount.length > 0 && 
                        isInValidRange(formData.loanAmount);

  // True if user has interacted with the field
  const hasInteracted = formData.loanAmount !== undefined;

  // Show error only if user has interacted and value is invalid
  const showError = hasInteracted && formData.loanAmount !== '' && !isValidInput;

  return (
    <div>
      <h2 className="form-title">
        How much would you like to borrow?
      </h2>
      
      <div className="input-container">
        <label className="input-label" style={textColorStyle}>
          Loan Amount
        </label>
        <div className="relative">
          <span className="input-prefix">£</span>
          <input
            type="text"
            value={formData.loanAmount ? parseInt(formData.loanAmount).toLocaleString('en-GB') : ''}
            onChange={handleLoanAmountChange}
            className={`input-field formatted-currency ${showError ? 'error' : ''}`}
            style={showError ? inputErrorStyle : {}}
            onFocus={(e) => showError && Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, showError ? inputErrorStyle : {})}
            inputMode="numeric"
            autoFocus={!formData.loanAmount || formData.loanAmount === ''}
          />
        </div>
        {showError && (
          <p className="error-message" style={errorMessageStyle}>Loan amount between £250 to £250,000</p>
        )}
      </div>

      <div className="cta-button-container">
        <button
          disabled={!isValidInput}
          className={`cta-button ${isValidInput ? 'enabled' : 'disabled'}`}
          onClick={nextStep}
          style={isValidInput ? buttonStyle : {}}
          id={buttonIds.ctaButtonId}
        >
          Find your loan
        </button>
      </div>
    </div>
  );
};

export default LoanAmountScreen; 