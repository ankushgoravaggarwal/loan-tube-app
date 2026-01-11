import React, { useState } from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface BusinessRevenueScreenProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: () => void;
  prevStep: () => void;
  textColorStyle: React.CSSProperties;
  inputFocusStyle: React.CSSProperties;
  inputErrorStyle: React.CSSProperties;
  errorMessageStyle: React.CSSProperties;
  buttonIds: {
    backButtonId: string;
    nextButtonId: string;
  };
}

const BusinessRevenueScreen: React.FC<BusinessRevenueScreenProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  textColorStyle,
  inputFocusStyle,
  inputErrorStyle,
  errorMessageStyle,
  buttonIds
}) => {
  // Business revenue screen state
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [revenueHasInteracted, setRevenueHasInteracted] = useState(false);

  const handleRevenueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Set interaction flag on first change
    if (!revenueHasInteracted) {
      setRevenueHasInteracted(true);
    }
    
    // Allow only numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    
    // Limit to 8 characters
    const limitedValue = value.slice(0, 8);
    
    // Validate input
    if (limitedValue && (parseInt(limitedValue) < 0 || parseInt(limitedValue) > 10000000)) {
      setRevenueError('Please enter a value between 0 and 10,000,000');
    } else {
      setRevenueError(null);
    }
    
    setFormData({
      ...formData,
      businessRevenue: limitedValue
    });
  };

  // Formatting functions
  const formatNumber = (value: string) => {
    if (!value) return '';
    const numValue = parseInt(value);
    return numValue.toLocaleString('en-GB');
  };

  // Only show field as valid if user has interacted with it
  const isValidValue = formData.businessRevenue && !revenueError;
  
  // Only show error if user has interacted with the field
  const showError = revenueHasInteracted && revenueError;

  return (
    <div>
      <h2 className="form-title">
        How much is total annual revenue/receipts of your business?
      </h2>
      <p className="form-subtitle">
        Don't worry if you don't know the exact turnover - just an estimate is fine.
      </p>
      
      <div className="input-container">
        <label className="input-label" style={textColorStyle}>
          Annual Revenue
        </label>
        <div className="relative">
          <span className="input-prefix">£</span>
          <input
            type="text"
            value={formData.businessRevenue ? formatNumber(formData.businessRevenue) : ''}
            onChange={handleRevenueChange}
            onBlur={(e) => {
              setRevenueHasInteracted(true);
              Object.assign(e.target.style, showError ? inputErrorStyle : {});
            }}
            placeholder=""
            className={`input-field business-revenue-input formatted-currency ${showError ? 'error' : ''}`}
            style={showError ? inputErrorStyle : {}}
            onFocus={(e) => showError && Object.assign(e.target.style, inputFocusStyle)}
            inputMode="numeric"
            autoFocus={!formData.businessRevenue || formData.businessRevenue === ''}
          />
        </div>
        {revenueHasInteracted && revenueError && (
          <p className="error-message" style={errorMessageStyle}>{revenueError}</p>
        )}
      </div>

      <NavigationButtons
        prevStep={prevStep}
        nextStep={nextStep}
        isNextDisabled={!isValidValue}
        backButtonId={buttonIds.backButtonId}
        nextButtonId={buttonIds.nextButtonId}
      />
    </div>
  );
};

export default BusinessRevenueScreen; 