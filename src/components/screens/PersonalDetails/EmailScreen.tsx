import React, { useRef } from 'react';
import { NavigationButtons } from '../../ui';
import IOSKeyboardManager, { useIosFocus } from '../../keyboard/IOSKeyboardManager';
import { useRecaptcha } from '../../RecaptchaProvider';
import RecaptchaV2Screen from '../RecaptchaV2Screen';
import { FormData, EmailValidation } from '../../../types/FormTypes';

interface EmailScreenProps {
  currentScreen: number;
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: () => void;
  prevStep: () => void;
  textColorStyle: React.CSSProperties;
  inputErrorStyle: React.CSSProperties;
  inputFocusStyle: React.CSSProperties;
  errorMessageStyle: React.CSSProperties;
  emailValidation: EmailValidation;
  handleEmailValidationChange: (email: string) => void;
  isEmailValid: boolean;
  isEmailChecking: boolean;
  showEmailError: boolean;
  emailErrorMessage: string;
  buttonIds: {
    backButtonId: string;
    nextButtonId: string;
  };
}

const EmailScreen: React.FC<EmailScreenProps> = ({
  currentScreen,
  formData,
  setFormData,
  nextStep,
  prevStep,
  textColorStyle,
  inputErrorStyle,
  inputFocusStyle,
  errorMessageStyle,
  emailValidation,
  handleEmailValidationChange,
  isEmailValid,
  isEmailChecking,
  showEmailError,
  emailErrorMessage,
  buttonIds
}) => {
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  // iOS focus handling
  useIosFocus(emailInputRef, currentScreen === 4 && (!formData.email || formData.email === ''), 'email');
  
  // Access reCAPTCHA context
  const { 
    shouldShowRecaptchaV2, 
    markScreenPassed, 
    setRecaptchaV2Passed, 
    setShowRecaptchaV2
  } = useRecaptcha();

  // Check if we should show reCAPTCHA v2 screen instead of email form
  if (shouldShowRecaptchaV2('email')) {
    return (
      <RecaptchaV2Screen
        title="Verify your email address"
        subtitle="Please complete the security check below to continue with email verification"
        onVerificationComplete={() => {
          setRecaptchaV2Passed(true);
          setShowRecaptchaV2(false);
          markScreenPassed('email');
        }}
        onBack={prevStep}
      />
    );
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    // Only update if changed
    if (newEmail !== formData.email) {
      // Update form data with new email
      setFormData({ 
        ...formData, 
        email: newEmail
      });
      
      // Handle validation through the consolidated hook
      handleEmailValidationChange(newEmail);
    }
  };

  // Force iOS Safari to use the email keyboard
  const EMAIL_KEYBOARD_CSS = `
    @supports (-webkit-touch-callout: none) {
      input[type="email"] {
        font-size: 16px !important; /* Prevent zoom */
      }
    }
  `;
  
  return (
    <div>
      <style>{EMAIL_KEYBOARD_CSS}</style>
      
      <h2 className="form-title">
        Your email address
      </h2>
      <p className="form-subtitle">
        We'll notify you about changes and updates to your application, as well as new products and features
      </p>
      
      <div className="input-container">
        <label className="input-label" style={textColorStyle}>
          Email Address
        </label>
        <div className="relative">
          <IOSKeyboardManager
            inputRef={emailInputRef}
            shouldFocus={!formData.email || formData.email === ''}
            inputType="email"
          >
            <input
              ref={emailInputRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={formData.email || ''}
              onChange={handleEmailChange}
              placeholder="Type your email address"
              className={`input-field email-input ${showEmailError ? 'error' : ''} ${isEmailValid ? 'valid' : ''}`}
              style={showEmailError ? inputErrorStyle : {}}
              onFocus={(e) => showEmailError && Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, showEmailError ? inputErrorStyle : {})}
              autoFocus={!formData.email || formData.email === ''}
              key={`email-input-${currentScreen}`}
            />
          </IOSKeyboardManager>
          {isEmailChecking && (
            <div className="validation-spinner">
              <div className="valid-spinner"></div>
            </div>
          )}
          {isEmailValid && !isEmailChecking && (
            <div className="validation-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          )}
        </div>
        {showEmailError && (
          <p className="error-message" style={errorMessageStyle}>{emailErrorMessage}</p>
        )}
        {isEmailChecking && (
          <p className="info-message">Validating email address...</p>
        )}
      </div>

      <NavigationButtons
        prevStep={prevStep}
        nextStep={nextStep}
        isNextDisabled={!isEmailValid}
        backButtonId={buttonIds.backButtonId}
        nextButtonId={buttonIds.nextButtonId}
      />
    </div>
  );
};

export default EmailScreen; 