import React, { useRef } from 'react';
import { NavigationButtons } from '../../ui';
import IOSKeyboardManager, { useIosFocus } from '../../keyboard/IOSKeyboardManager';
import { FormData } from '../../types/FormTypes';

interface MobileScreenProps {
  currentScreen: number;
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: () => void;
  prevStep: () => void;
  textColorStyle: React.CSSProperties;
  inputErrorStyle: React.CSSProperties;
  inputFocusStyle: React.CSSProperties;
  errorMessageStyle: React.CSSProperties;
  buttonIds: {
    backButtonId: string;
    nextButtonId: string;
  };
}

const MobileScreen: React.FC<MobileScreenProps> = ({
  currentScreen,
  formData,
  setFormData,
  nextStep,
  prevStep,
  textColorStyle,
  inputErrorStyle,
  inputFocusStyle,
  errorMessageStyle,
  buttonIds
}) => {
  const mobileInputRef = useRef<HTMLInputElement>(null);
  
  // iOS focus handling
  useIosFocus(mobileInputRef, currentScreen === 5 && (!formData.mobile || formData.mobile === ''), 'tel');

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers
    const value = e.target.value.replace(/[^\d]/g, '');
    
    // Skip update if unchanged
    if (value === formData.mobile) return;
    
    // Single state update with conditional - check if this is a verified number
    setFormData({ 
      ...formData, 
      mobile: value,
      isPhoneVerified: value === formData.verifiedMobile 
    });
  };

  // For mobile validation - simpler checks
  const isValidMobile = (mobile: string) => {
    return mobile?.length === 11 && mobile.startsWith('07');
  };

  const hasInteracted = formData.mobile !== undefined;
  const mobile = formData.mobile || '';
  const isValid = isValidMobile(mobile);
  const isVerified = formData.isPhoneVerified;
  
  // Show error after 3 characters if first two digits are not 07
  const showError = hasInteracted && mobile.length >= 3 && !mobile.startsWith('07');
  
  // Determine specific error message
  const getErrorMessage = () => {
    if (!mobile.startsWith('07')) {
      return 'Please provide a valid mobile number starting with 07';
    }
    if (mobile.length !== 11) {
      return 'Mobile number must be exactly 11 digits';
    }
    return 'Please enter a valid mobile number';
  };

  // Verified icon component
  const VerifiedIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="verified-icon"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );

  return (
    <div>
      <h2 className="form-title">
        What is your mobile number?
      </h2>
      <p className="form-subtitle">
        We'll only use this number to update you about your application.
      </p>
      
      <div className="input-container">
        <label className="input-label" style={textColorStyle}>
          Mobile Number
        </label>
        <div className="relative">
          <IOSKeyboardManager
            inputRef={mobileInputRef}
            shouldFocus={!mobile || mobile === ''}
            inputType="tel"
          >
            <input
              ref={mobileInputRef}
              type="tel"
              inputMode="numeric"
              value={mobile}
              onChange={handleMobileChange}
              placeholder="07*********"
              maxLength={11}
              className={`input-field mobile-input ${showError ? 'error' : ''} ${isVerified ? 'verified' : ''}`}
              style={showError ? inputErrorStyle : {}}
              onFocus={(e) => showError && Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, showError ? inputErrorStyle : {})}
              autoFocus={!mobile || mobile === ''}
              key={`mobile-input-${currentScreen}`}
            />
          </IOSKeyboardManager>
          {isVerified && (
            <div className="verified-indicator">
              <VerifiedIcon />
            </div>
          )}
        </div>
        {showError && (
          <p className="error-message" style={errorMessageStyle}>{getErrorMessage()}</p>
        )}
        {isVerified && (
          <p className="success-message">Your mobile number has been verified</p>
        )}
      </div>

      <NavigationButtons
        prevStep={prevStep}
        nextStep={nextStep}
        isNextDisabled={!isValid}
        backButtonId={buttonIds.backButtonId}
        nextButtonId={buttonIds.nextButtonId}
      />
    </div>
  );
};

export default MobileScreen; 