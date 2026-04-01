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

/** UK mobile numbers in this flow are always 07 + 9 further digits (11 total). */
const UK_MOBILE_PREFIX = '07';

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
  const mobile = formData.mobile || '';
  const digitsOnly = mobile.replace(/\D/g, '');
  const suffix = (() => {
    if (digitsOnly.startsWith(UK_MOBILE_PREFIX)) {
      return digitsOnly.slice(UK_MOBILE_PREFIX.length).slice(0, 9);
    }
    if (digitsOnly.length === 10 && digitsOnly.startsWith('7')) {
      return digitsOnly.slice(1).slice(0, 9);
    }
    return digitsOnly.slice(0, 9);
  })();

  useIosFocus(mobileInputRef, currentScreen === 5 && suffix.length === 0, 'tel');

  const handleSuffixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, '');
    if (digits.startsWith(UK_MOBILE_PREFIX)) {
      digits = digits.slice(UK_MOBILE_PREFIX.length).slice(0, 9);
    } else if (digits.length >= 10 && digits.startsWith('7') && digits[1] !== '0') {
      digits = digits.slice(1).slice(0, 9);
    } else {
      digits = digits.slice(0, 9);
    }
    const full = digits.length === 0 ? '' : `${UK_MOBILE_PREFIX}${digits}`;
    if (full === mobile) return;
    setFormData({
      ...formData,
      mobile: full,
      isPhoneVerified: full === formData.verifiedMobile,
    });
  };

  // For mobile validation - simpler checks
  const isValidMobile = (mobile: string) => {
    return mobile?.length === 11 && mobile.startsWith('07');
  };

  const hasInteracted = formData.mobile !== undefined;
  const isValid = isValidMobile(mobile);
  const isVerified = formData.isPhoneVerified;

  const showError =
    hasInteracted &&
    suffix.length > 0 &&
    suffix.length < 9;
  
  const getErrorMessage = () => {
    if (suffix.length > 0 && suffix.length < 9) {
      return `Enter all 9 digits after ${UK_MOBILE_PREFIX} (${suffix.length} of 9)`;
    }
    if (mobile.length !== 11) {
      return 'Mobile number must be 11 digits (07 plus 9 digits)';
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
        We&apos;ll only use this number to update you about your application. UK mobile numbers
        start with 07 — that prefix is fixed; enter the other 9 digits.
      </p>
      
      <div className="input-container">
        <label className="input-label" style={textColorStyle}>
          Mobile Number
        </label>
        <div className="relative">
          <IOSKeyboardManager
            inputRef={mobileInputRef}
            shouldFocus={suffix.length === 0}
            inputType="tel"
          >
            <div className={`mobile-input-row ${showError ? 'mobile-input-row--error' : ''} ${isVerified ? 'mobile-input-row--verified' : ''}`}>
              <span className="mobile-input-prefix-chip" aria-hidden="true">
                {UK_MOBILE_PREFIX}
              </span>
              <input
                ref={mobileInputRef}
                type="tel"
                inputMode="numeric"
                value={suffix}
                onChange={handleSuffixChange}
                placeholder="123 456 789"
                maxLength={9}
                autoComplete="tel-national"
                className={`input-field mobile-input mobile-input-suffix ${showError ? 'error' : ''} ${isVerified ? 'verified' : ''}`}
                style={showError ? inputErrorStyle : {}}
                onFocus={(e) => showError && Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, showError ? inputErrorStyle : {})}
                autoFocus={suffix.length === 0}
                key={`mobile-input-${currentScreen}`}
                aria-label="UK mobile number: 9 digits after 07"
              />
            </div>
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