import React, { useState, useEffect, useRef, useMemo } from 'react';
import { allowManualScroll } from '../keyboard/IOSKeyboardManager';
import { usePartner } from '../../partner/PartnerContext';
import { useRecaptcha } from '../RecaptchaProvider';
import { scrollToFormPosition } from '../../utils/scrollUtils';
import { useFormEmailValidation } from '../../utils/emailValidation';
import { generateButtonIds } from '../../utils/buttonIdGenerator';
import { FormData } from '../../types/FormTypes';

// Import all screen components
import {
  TitleScreen,
  NameScreen,
  DateOfBirthScreen,
  EmailScreen,
  MobileScreen,
  VerificationScreen,
  MaritalStatusScreen,
  DependentsScreen
} from '../screens/PersonalDetails';

interface PersonalDetailsProps {
  currentScreen: number;
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({
  currentScreen,
  formData,
  setFormData,
  nextStep,
  prevStep
}) => {
  const { partner, isPartnerRoute } = usePartner();
  
  // Generate button IDs for Google Analytics tracking (PersonalDetails is step 2)
  const buttonIds = useMemo(() => {
    return generateButtonIds(2, currentScreen, formData);
  }, [currentScreen, formData]);
  
  // Access reCAPTCHA context
  const { 
    executeRecaptchaV3
  } = useRecaptcha();
  
  // Consolidate all partner-related styles into a single useMemo
  const partnerStyles = useMemo(() => {
    if (!isPartnerRoute || !partner) {
      return {
        selectedOptionStyle: {},
        optionHoverStyle: {},
        textColorStyle: {},
        inputFocusStyle: {},
        inputErrorStyle: {},
        errorMessageStyle: {}
      };
    }

    const styles: { [key: string]: React.CSSProperties } = {
      selectedOptionStyle: {},
      optionHoverStyle: {},
      textColorStyle: {},
      inputFocusStyle: {},
      inputErrorStyle: {},
      errorMessageStyle: {}
    };

    // Selected Option and Option Hover Styles
    const selectButtonBgColor = partner.select_button_background_color;
    const selectButtonTextColor = partner.select_button_text_color;
    const primaryColor = partner.primary_color;

    if (selectButtonBgColor) {
      styles.selectedOptionStyle.backgroundColor = selectButtonBgColor;
      styles.selectedOptionStyle.borderColor = selectButtonBgColor;
      styles.optionHoverStyle['--hover-text-color'] = selectButtonBgColor;
    } else if (primaryColor) {
      styles.selectedOptionStyle.backgroundColor = primaryColor;
      styles.selectedOptionStyle.borderColor = primaryColor;
      styles.optionHoverStyle['--hover-text-color'] = primaryColor;
    }

    if (selectButtonTextColor) {
      styles.selectedOptionStyle.color = selectButtonTextColor;
    }

    // Text Color for Labels and Headings
    if (primaryColor) {
      styles.textColorStyle.color = primaryColor;
    }

    // Input Focus and Error Styles
    const errorInputFocusColor = partner.error_input_focus_color;
    if (errorInputFocusColor) {
      styles.inputFocusStyle.borderColor = errorInputFocusColor;
      styles.inputErrorStyle.borderColor = errorInputFocusColor;
      styles.errorMessageStyle.color = errorInputFocusColor;
    }

    return styles;
  }, [isPartnerRoute, partner]);
  
  // Destructure styles for easier access
  const { 
    selectedOptionStyle, 
    optionHoverStyle, 
    textColorStyle, 
    inputFocusStyle, 
    inputErrorStyle, 
    errorMessageStyle 
  } = partnerStyles;
  
  // Track previous screen to determine navigation direction
  const prevScreenRef = useRef<number>(currentScreen);
  
  // Use consolidated email validation hook
  const {
    emailValidation,
    handleEmailChange: handleEmailValidationChange,
    isValid: isEmailValid,
    isChecking: isEmailChecking,
    showError: showEmailError,
    errorMessage: emailErrorMessage
  } = useFormEmailValidation(
    formData.email || '',
    currentScreen,
    4, // target screen for email
    prevScreenRef,
    formData.emailValidation
  );
  
  // State to track if phone score evaluation is complete
  const [phoneScoreEvaluated, setPhoneScoreEvaluated] = useState(false);
  
  // Add scroll effect for screen changes
  useEffect(() => {
    // Trigger scroll positioning when screen changes
    scrollToFormPosition(2, currentScreen); // Step 2 for PersonalDetails
  }, [currentScreen]);
  
  // Effect to persist email validation result in formData
  useEffect(() => {
    setFormData((prev: FormData) => ({
      ...prev,
      emailValidation
    }));
  }, [emailValidation, setFormData]);

  // Effect to handle skipping OTP screen when the phone is verified
  useEffect(() => {
    // Skip OTP verification if the phone is verified
    if (currentScreen === 6 && formData.isPhoneVerified) {
      // If previous screen was 5 (coming from mobile screen), go forward
      if (prevScreenRef.current === 5) {
        nextStep();
      } 
      // If previous screen was 7 (coming from marital status), go back
      else if (prevScreenRef.current === 7) {
        prevStep();
      }
    }
    
    // Update the previous screen reference for next time
    // Need to delay updating this to prevent it from interfering with navigation logic
    if (currentScreen !== prevScreenRef.current) {
      setTimeout(() => {
        prevScreenRef.current = currentScreen;
      }, 50);
    }
  }, [currentScreen, formData.isPhoneVerified, nextStep, prevStep]);

  // Effect to trigger phone score evaluation when phone number is complete
  useEffect(() => {
    const mobile = formData.mobile || '';
    const isValidMobile = mobile.length === 11 && mobile.startsWith('07');
    
    // Trigger reCAPTCHA scoring as soon as valid phone number is entered
    if (currentScreen === 5 && isValidMobile && !phoneScoreEvaluated) {
      executeRecaptchaV3('mobile_number_screen')
        .then(() => {
          setPhoneScoreEvaluated(true);
        })
        .catch(() => {
          setPhoneScoreEvaluated(true); // Continue anyway
        });
    }
    
    // Reset flag when leaving mobile screen or phone number changes
    if (currentScreen !== 5 || !isValidMobile) {
      setPhoneScoreEvaluated(false);
    }
  }, [currentScreen, formData.mobile, executeRecaptchaV3, phoneScoreEvaluated]);

  // Render the appropriate screen based on the current screen number
  const renderScreen = () => {
    switch (currentScreen) {
      case 1:
        return (
          <TitleScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
            buttonIds={buttonIds}
          />
        );
      case 2:
        return (
          <NameScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            textColorStyle={textColorStyle}
            inputErrorStyle={inputErrorStyle}
            inputFocusStyle={inputFocusStyle}
            errorMessageStyle={errorMessageStyle}
            buttonIds={buttonIds}
          />
        );
      case 3:
        return (
          <DateOfBirthScreen
            currentScreen={currentScreen}
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            textColorStyle={textColorStyle}
            inputErrorStyle={inputErrorStyle}
            inputFocusStyle={inputFocusStyle}
            errorMessageStyle={errorMessageStyle}
            buttonIds={buttonIds}
          />
        );
      case 4:
        return (
          <EmailScreen
            currentScreen={currentScreen}
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            textColorStyle={textColorStyle}
            inputErrorStyle={inputErrorStyle}
            inputFocusStyle={inputFocusStyle}
            errorMessageStyle={errorMessageStyle}
            emailValidation={emailValidation}
            handleEmailValidationChange={handleEmailValidationChange}
            isEmailValid={!!isEmailValid}
            isEmailChecking={isEmailChecking || false}
            showEmailError={showEmailError}
            emailErrorMessage={emailErrorMessage}
            buttonIds={buttonIds}
          />
        );
      case 5:
        return (
          <MobileScreen
            currentScreen={currentScreen}
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            textColorStyle={textColorStyle}
            inputErrorStyle={inputErrorStyle}
            inputFocusStyle={inputFocusStyle}
            errorMessageStyle={errorMessageStyle}
            buttonIds={buttonIds}
          />
        );
      case 6:
        return (
          <VerificationScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 7:
        return (
          <MaritalStatusScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
            buttonIds={buttonIds}
          />
        );
      case 8:
        return (
          <DependentsScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
            buttonIds={buttonIds}
          />
        );
      default:
        return (
          <TitleScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
            buttonIds={buttonIds}
          />
        );
    }
  };

  // iOS-specific focus handling for input fields
  useEffect(() => {
    // Only use this fallback on iOS to avoid double-focusing on PC
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS) {
      // Signal that we're manually handling scroll
      allowManualScroll();
      
      const focusHandler = requestAnimationFrame(() => {
        // Skip special handling for name screen - let the native autoFocus work
        if (currentScreen === 2) {
          return;
        }
        
        // Default behavior for other screens
        const activeInput = document.querySelector('.input-field');
        // Only focus if the active input doesn't already have a value
        if (activeInput && !(activeInput as HTMLInputElement).value) {
          (activeInput as HTMLElement).focus();
          
          // Add click for iOS
          setTimeout(() => {
            (activeInput as HTMLElement).click();
            (activeInput as HTMLElement).focus();
          }, 100);
        }
      });
      
      return () => cancelAnimationFrame(focusHandler);
    }
  }, [currentScreen]); // Depend only on currentScreen

  return renderScreen();
};

export default PersonalDetails; 