import React, { useCallback } from 'react';
import { useRecaptcha } from '../../RecaptchaProvider';
import RecaptchaV2Screen from '../RecaptchaV2Screen';
import OTPVerification from './OTPVerification';
import { FormData } from '../../../types/FormTypes';

interface VerificationScreenProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const VerificationScreen: React.FC<VerificationScreenProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep
}) => {
  // Access reCAPTCHA context
  const { 
    shouldShowRecaptchaV2, 
    markScreenPassed, 
    setRecaptchaV2Passed, 
    setShowRecaptchaV2
  } = useRecaptcha();

  // Separate OTP wrapper to prevent instantiation when v2 is showing
  const OTPWrapper = useCallback(({ phoneNumber, formData, setFormData, nextStep, prevStep }: {
    phoneNumber: string;
    formData: FormData;
    setFormData: (data: FormData) => void;
    nextStep: () => void;
    prevStep: () => void;
  }) => {
    // When verification is completed successfully
    const handleVerificationComplete = () => {
      // Store success in formData if needed
      setFormData({ 
        ...formData, 
        isPhoneVerified: true,
        verifiedMobile: phoneNumber // Store the verified mobile number
      });
      
      // Move to next step
      nextStep();
    };

    return (
      <OTPVerification
        phoneNumber={phoneNumber}
        onVerificationComplete={handleVerificationComplete}
        onBack={prevStep}
      />
    );
  }, []);

  // If the phone is verified, we should skip this screen
  // But we need to do it in the next render cycle to avoid issues
  if (formData.isPhoneVerified) {
    return (
      <div className="otp-loading">
        <p>Redirecting...</p>
      </div>
    );
  }
  
  // Check if we should show reCAPTCHA v2 screen before OTP verification
  // Phone score should already be evaluated from screen 5
  if (shouldShowRecaptchaV2('otp')) {
    return (
      <RecaptchaV2Screen
        title="Additional security verification"
        subtitle="Please complete the security check below to continue with phone verification"
        onVerificationComplete={() => {
          setRecaptchaV2Passed(true);
          setShowRecaptchaV2(false);
          markScreenPassed('otp');
          // After v2 completion, the OTP screen will render normally
        }}
        onBack={prevStep}
      />
    );
  }
  
  // Render OTP component when v2 is not required
  return (
    <OTPWrapper 
      phoneNumber={formData.mobile || ''} 
      formData={formData}
      setFormData={setFormData}
      nextStep={nextStep}
      prevStep={prevStep}
    />
  );
};

export default VerificationScreen; 