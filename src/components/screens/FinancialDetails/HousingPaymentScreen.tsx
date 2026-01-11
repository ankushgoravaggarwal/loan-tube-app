import React, { useState } from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface HousingPaymentScreenProps {
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

const HousingPaymentScreen: React.FC<HousingPaymentScreenProps> = ({
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
  // Housing payment screen state
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentHasInteracted, setPaymentHasInteracted] = useState(false);

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Set interaction flag on first change
    if (!paymentHasInteracted) {
      setPaymentHasInteracted(true);
    }
    
    // Allow only numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    
    // Limit to 5 characters
    const limitedValue = value.slice(0, 5);
    
    // Validate input
    if (limitedValue && (parseInt(limitedValue) < 0 || parseInt(limitedValue) > 35000)) {
      setPaymentError('Type a valid rent/mortgage payment amount');
    } else {
      setPaymentError(null);
    }
    
    setFormData({ 
      ...formData, 
      housingPayment: limitedValue 
    });
  };

  // Formatting functions
  const formatNumber = (value: string) => {
    if (!value) return '';
    const numValue = parseInt(value);
    return numValue.toLocaleString('en-GB');
  };

  // Only show field as valid if user has interacted with it
  const isValidInput = formData.housingPayment && formData.housingPayment.length > 0 && !paymentError;
  
  // Only show error if user has interacted with the field
  const showError = paymentHasInteracted && (paymentError || (!formData.housingPayment && formData.housingPayment !== undefined));

  return (
    <div>
      <h2 className="form-title">
        How much do you pay for rent or mortgage each month?
      </h2>
      
      <div className="input-container">
        <label className="input-label" style={textColorStyle}>
          Monthly rent/mortgage payment
        </label>
        <div className="relative">
          <span className="input-prefix">£</span>
          <input
            type="text"
            value={formData.housingPayment ? formatNumber(formData.housingPayment) : ''}
            onChange={handlePaymentChange}
            onBlur={(e) => {
              setPaymentHasInteracted(true);
              Object.assign(e.target.style, showError ? inputErrorStyle : {});
            }}
            className={`input-field formatted-currency ${showError ? 'error' : ''}`}
            style={showError ? inputErrorStyle : {}}
            onFocus={(e) => showError && Object.assign(e.target.style, inputFocusStyle)}
            inputMode="numeric"
            autoFocus={!formData.housingPayment || formData.housingPayment === ''}
          />
        </div>
        {paymentHasInteracted && paymentError && (
          <p className="error-message" style={errorMessageStyle}>{paymentError}</p>
        )}
        {paymentHasInteracted && !formData.housingPayment && formData.housingPayment !== undefined && (
          <p className="error-message" style={errorMessageStyle}>Type a valid rent/mortgage payment amount</p>
        )}
      </div>

      <NavigationButtons
        prevStep={prevStep}
        nextStep={nextStep}
        isNextDisabled={!isValidInput}
        backButtonId={buttonIds.backButtonId}
        nextButtonId={buttonIds.nextButtonId}
      />
    </div>
  );
};

export default HousingPaymentScreen; 