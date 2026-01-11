import React from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface BusinessNameScreenProps {
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

const BusinessNameScreen: React.FC<BusinessNameScreenProps> = ({
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
  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, businessName: e.target.value });
  };

  const isValidInput = formData.businessName && formData.businessName.trim().length > 0;
  const hasInteracted = formData.businessName !== undefined;
  const showError = hasInteracted && !isValidInput && formData.businessName !== '';

  return (
    <div>
      <h2 className="form-title">
        What is your business name?
      </h2>
      
      <div className="input-container">
        <label className="input-label" style={textColorStyle}>
          Business Name
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.businessName || ''}
            onChange={handleBusinessNameChange}
            placeholder="Enter Your Business Name"
            className={`input-field ${showError ? 'error' : ''}`}
            style={showError ? inputErrorStyle : {}}
            onFocus={(e) => showError && Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, showError ? inputErrorStyle : {})}
            autoFocus={!formData.businessName || formData.businessName === ''}
          />
        </div>
        {showError && (
          <p className="error-message" style={errorMessageStyle}>Please enter your business name</p>
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

export default BusinessNameScreen; 