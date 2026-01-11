import React, { useState } from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface IncomeScreenProps {
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

const IncomeScreen: React.FC<IncomeScreenProps> = ({
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
  // Income screen state
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [incomeHasInteracted, setIncomeHasInteracted] = useState(false);

  // Handler functions for income screen
  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Set interaction flag on first change
    if (!incomeHasInteracted) {
      setIncomeHasInteracted(true);
    }
    
    // Allow only numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    
    // Limit to 5 characters
    const limitedValue = value.slice(0, 5);
    
    // Validate input
    if (limitedValue && (parseInt(limitedValue) < 0 || parseInt(limitedValue) > 20000)) {
      setIncomeError('Please enter a value between 0 and 20,000');
    } else {
      setIncomeError(null);
    }
    
    setFormData({ ...formData, income: limitedValue });
  };

  // Formatting functions
  const formatNumber = (value: string) => {
    if (!value) return '';
    const numValue = parseInt(value);
    return numValue.toLocaleString('en-GB');
  };

  // Only show field as valid if user has interacted with it
  const isValidInput = formData.income && formData.income.length > 0 && !incomeError;
  
  // Only show error if user has interacted with the field
  const showError = incomeHasInteracted && (incomeError || (!formData.income && formData.income !== undefined));

  return (
    <div>
      <h2 className="form-title">
        What is your net monthly income?
      </h2>
      <p className="form-subtitle">
        The amount you take home after taxes
      </p>
      
      <div className="input-container">
        <label className="input-label" style={textColorStyle}>
          Monthly Income
        </label>
        <div className="relative">
          <span className="input-prefix">£</span>
          <input
            type="text"
            value={formData.income ? formatNumber(formData.income) : ''}
            onChange={handleIncomeChange}
            onBlur={(e) => {
              setIncomeHasInteracted(true);
              Object.assign(e.target.style, showError ? inputErrorStyle : {});
            }}
            className={`input-field formatted-currency ${showError ? 'error' : ''}`}
            style={showError ? inputErrorStyle : {}}
            onFocus={(e) => showError && Object.assign(e.target.style, inputFocusStyle)}
            inputMode="numeric"
            autoFocus={!formData.income || formData.income === ''}
          />
        </div>
        {incomeHasInteracted && incomeError && (
          <p className="error-message" style={errorMessageStyle}>{incomeError}</p>
        )}
        {incomeHasInteracted && !formData.income && formData.income !== undefined && (
          <p className="error-message" style={errorMessageStyle}>Type your correct monthly income</p>
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

export default IncomeScreen; 