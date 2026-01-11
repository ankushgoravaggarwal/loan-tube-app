import React, { useState } from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface BankDetailsScreenProps {
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

const BankDetailsScreen: React.FC<BankDetailsScreenProps> = ({
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
  // Bank details screen state
  const [bankHasInteracted, setBankHasInteracted] = useState({
    accountNumber: false,
    sortCode: false
  });

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Set interaction flag on first change
    if (!bankHasInteracted.accountNumber) {
      setBankHasInteracted({...bankHasInteracted, accountNumber: true});
    }
    
    // Allow only numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    
    setFormData({ 
      ...formData, 
      bankAccountNumber: value 
    });
  };

  const handleSortCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Set interaction flag on first change
    if (!bankHasInteracted.sortCode) {
      setBankHasInteracted({...bankHasInteracted, sortCode: true});
    }
    
    // Allow only numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    
    setFormData({ 
      ...formData, 
      sortCode: value 
    });
  };

  // Formatting functions
  const formatSortCode = (value: string) => {
    if (!value) return '';
    // Format as XX-XX-XX
    return value.replace(/(\d{2})(?=\d)/g, '$1-');
  };

  // Check if both fields are valid
  const isAccountNumberValid = formData.bankAccountNumber && formData.bankAccountNumber.length === 8;
  const isSortCodeValid = formData.sortCode && formData.sortCode.length === 6;
  const isValidInput = isAccountNumberValid && isSortCodeValid;
  
  // Show error if either field has an error and has been interacted with
  const showAccountNumberError = bankHasInteracted.accountNumber && !isAccountNumberValid;
  const showSortCodeError = bankHasInteracted.sortCode && !isSortCodeValid;
  const showAnyError = showAccountNumberError || showSortCodeError;

  return (
    <div>
      <h2 className="form-title">
        Please provide your bank details
      </h2>
      
      <div className="input-container">
        <label className="input-label" style={textColorStyle}>
          Account Number
        </label>
        <input
          type="text"
          value={formData.bankAccountNumber || ''}
          onChange={handleAccountNumberChange}
          onBlur={(e) => {
            setBankHasInteracted({...bankHasInteracted, accountNumber: true});
            Object.assign(e.target.style, showAccountNumberError ? inputErrorStyle : {});
          }}
          placeholder="Type your bank account number"
          className={`input-field bank-account-input ${showAccountNumberError ? 'error' : ''}`}
          style={showAccountNumberError ? inputErrorStyle : {}}
          onFocus={(e) => showAccountNumberError && Object.assign(e.target.style, inputFocusStyle)}
          maxLength={8}
          inputMode="numeric"
          autoFocus={!formData.bankAccountNumber || formData.bankAccountNumber === ''}
        />
      </div>

      <div className="input-container-sort-code">
        <label className="input-label" style={textColorStyle}>
          Sort Code
        </label>
        <input
          type="text"
          value={formData.sortCode ? formatSortCode(formData.sortCode) : ''}
          onChange={handleSortCodeChange}
          onBlur={(e) => {
            setBankHasInteracted({...bankHasInteracted, sortCode: true});
            Object.assign(e.target.style, showSortCodeError ? inputErrorStyle : {});
          }}
          placeholder="Type your sort code"
          className={`input-field sort-code-input ${showSortCodeError ? 'error' : ''}`}
          style={showSortCodeError ? inputErrorStyle : {}}
          onFocus={(e) => showSortCodeError && Object.assign(e.target.style, inputFocusStyle)}
          maxLength={8} // Account for hyphens
          inputMode="numeric"
        />
      </div>

      {showAnyError && (
        <p className="error-message-sort-code" style={errorMessageStyle}>Please provide correct bank details</p>
      )}

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

export default BankDetailsScreen; 