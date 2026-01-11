import React, { useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { NavigationButtons } from '../ui';
import { usePartner } from '../../partner/PartnerContext';

interface RecaptchaV2ScreenProps {
  onVerificationComplete: (token: string) => void;
  onBack: () => void;
  title?: string;
  subtitle?: string;
  errorMessage?: string;
  backButtonId?: string;
  nextButtonId?: string;
}

const RecaptchaV2Screen: React.FC<RecaptchaV2ScreenProps> = ({
  onVerificationComplete,
  onBack,
  title = "Security Verification",
  subtitle = "Please complete the security check below to continue",
  errorMessage,
  backButtonId,
  nextButtonId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(errorMessage || '');
  const [isVerified, setIsVerified] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Get partner context for styling
  const { partner, isPartnerRoute } = usePartner();

  // reCAPTCHA v2 site key from environment variables
  const RECAPTCHA_V2_SITE_KEY = import.meta.env.VITE_RECAPTCHA_V2_SITE_KEY as string;

  // Partner-specific styles
  const errorMessageStyle = isPartnerRoute && partner ? 
    { color: partner.error_input_focus_color || '' } : 
    {};

  const handleRecaptchaChange = async (token: string | null) => {
    if (!token) {
      setError('Security verification failed. Please try again.');
      setIsVerified(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setIsVerified(true);
      
      // Call the parent callback with the token
      onVerificationComplete(token);
    } catch (error) {
      setError('Verification failed. Please try again.');
      setIsVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecaptchaError = () => {
    setError('Security check failed. Please try again from a different browser.');
    setIsVerified(false);
  };

  const handleRecaptchaExpired = () => {
    setError('Security check expired. Please complete it again.');
    setIsVerified(false);
  };

  return (
    <div className="recaptcha-v2-screen">
      <h2 className="form-title">{title}</h2>
      
      <p className="form-subtitle">{subtitle}</p>

      <div className="recaptcha-container">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={RECAPTCHA_V2_SITE_KEY}
          onChange={handleRecaptchaChange}
          onError={handleRecaptchaError}
          onExpired={handleRecaptchaExpired}
        />
      </div>

      {error && (
        <p className="error-message-otp" style={errorMessageStyle}>
          {error}
        </p>
      )}

      {isLoading && (
        <div className="loading-container">
          <div className="loader">
            <svg className="circular-loader" viewBox="25 25 50 50">
              <circle 
                className="loader-path" 
                cx="50" 
                cy="50" 
                r="20" 
                fill="none" 
                stroke={isPartnerRoute && partner ? partner.primary_color || '#ff2048' : '#ff2048'}
                strokeWidth="3" 
              />
            </svg>
          </div>
        </div>
      )}

      <NavigationButtons
        prevStep={onBack}
        nextStep={() => {
          if (!isVerified) {
            setError('Please complete the security check first.');
            return;
          }
        }}
        isNextDisabled={!isVerified || isLoading}
        backButtonId={backButtonId}
        nextButtonId={nextButtonId}
      />
    </div>
  );
};

export default RecaptchaV2Screen; 