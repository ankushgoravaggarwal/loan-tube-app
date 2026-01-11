import React, { useState, useEffect, useRef, useCallback, useMemo, CSSProperties } from 'react';
import { NavigationButtons } from '../../ui';
import { useRecaptcha } from '../../RecaptchaProvider';
import { usePartner } from '../../../partner/PartnerContext';
import { OTPAPI } from '../../../services/apiService';
import { FormData } from '../../../types/FormTypes';

interface OTPVerificationProps {
  phoneNumber: string;
  onVerificationComplete: () => void;
  onBack: () => void;
  existingToken?: string;
  backButtonId?: string;
  nextButtonId?: string;
  formData?: FormData; // Optional formData for styling
}

//cache to remember OTP tokens that have already been issued for a given phone number
const otpTokenCache: Record<string, string> = {};

// Master OTP code for testing - works for any phone number
// Set VITE_MASTER_OTP in .env file to customize, defaults to '0000'
const MASTER_OTP = import.meta.env.VITE_MASTER_OTP || '0000';

const OTPVerification: React.FC<OTPVerificationProps> = ({
  phoneNumber,
  onVerificationComplete,
  onBack,
  existingToken,
  backButtonId,
  nextButtonId
}) => {
  // OTP states
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Figure out if we already have a token for this phone number at mount time
  const initialToken: string | null = existingToken || otpTokenCache[phoneNumber] || null;

  // API related states
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(initialToken);

  // Resend related states
  // If we already possess a token (cached or via prop) we allow the user to resend immediately, otherwise we start a 15-second cooldown.
  const [showResendOptions, setShowResendOptions] = useState<boolean>(!!initialToken);
  const [timeLeft, setTimeLeft] = useState<number>(initialToken ? 0 : 15);

  // Get partner context
  const { partner, isPartnerRoute } = usePartner();

  // Flag to prevent multiple API calls
  const hasInitializedRef = useRef(false);
  const phoneNumberRef = useRef(phoneNumber);



  // Access reCAPTCHA context
  const { recaptchaV2Passed, executeRecaptchaV3 } = useRecaptcha();

  // Utility to detect mobile devices
  const isMobile = useMemo(
    () => typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent),
    []
  );

  // Add cursor style for mobile OTP inputs
  const otpCursorStyle = useMemo((): CSSProperties => ({
    position: 'absolute',
    display: isMobile ? 'block' : 'none',
    width: '1.5px',
    height: '25px',
    backgroundColor: '#333',
    animation: 'blink 1s infinite',
    top: '50%',
    transform: 'translateY(-50%)',
    right: '50%'
  }), [isMobile]);

  // Consolidate partner-specific styles
  const partnerColorStyles = useMemo(() => {
    if (isPartnerRoute && partner) {
      const primaryColor = partner.primary_color;
      const errorInputFocusColor = partner.error_input_focus_color;

      return {
        textColor: { color: primaryColor || '#ff2048' },
        successMessageStyle: { color: primaryColor || '' },
        loaderStyle: { stroke: primaryColor || '#ff2048' },
        whatsAppTextStyle: { color: primaryColor || '#ff2048' },
        inputErrorStyle: { borderColor: errorInputFocusColor || '' },
        errorMessageStyle: { color: errorInputFocusColor || '' },
      };
    }
    return {
      textColor: { color: '#ff2048' },
      successMessageStyle: {},
      loaderStyle: { stroke: '#ff2048' },
      whatsAppTextStyle: { color: '#ff2048' },
      inputErrorStyle: {},
      errorMessageStyle: {},
    };
  }, [isPartnerRoute, partner]);

  const {
    textColor,
    successMessageStyle,
    loaderStyle,
    whatsAppTextStyle,
    inputErrorStyle,
    errorMessageStyle,
  } = partnerColorStyles;

  // Apply primary color to input focus dynamically
  useEffect(() => {
    const styleId = 'otp-input-focus-style';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    const defaultColor = '#ff2048';
    const primaryColorForFocus = (isPartnerRoute && partner && partner.primary_color) ? partner.primary_color : defaultColor;
    const errorColorForFocus = (isPartnerRoute && partner && partner.error_input_focus_color) ? partner.error_input_focus_color : defaultColor;

    if (isPartnerRoute) {
      styleEl.textContent = `
        .otp-input.error:focus {
          border-color: ${errorColorForFocus} !important;
          box-shadow: 0 0 0 1px ${errorColorForFocus} !important;
        }
        .otp-input:focus {
          border-color: ${primaryColorForFocus} !important;
          box-shadow: 0 0 0 1px ${primaryColorForFocus} !important;
        }
      `;
    } else {
      styleEl.textContent = '';
    }

    return () => {
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, [isPartnerRoute, partner]);

  // Consolidated timer effect
  useEffect(() => {
    // Start / maintain the countdown timer whenever there is time left
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowResendOptions(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      // Ensure resend options are visible once cooldown finishes
      setShowResendOptions(true);
    }
  }, [timeLeft]);

  // WhatsApp icon SVG - memoized
  const WhatsAppIcon = useMemo(() => React.memo(() => (
    <svg stroke="#32d951" fill="#32d951" strokeWidth="0" viewBox="0 0 448 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <path d="M224 122.8c-72.7 0-131.8 59.1-131.9 131.8 0 24.9 7 49.2 20.2 70.1l3.1 5-13.3 48.6 49.9-13.1 4.8 2.9c20.2 12 43.4 18.4 67.1 18.4h.1c72.6 0 133.3-59.1 133.3-131.8 0-35.2-15.2-68.3-40.1-93.2-25-25-58-38.7-93.2-38.7zm77.5 188.4c-3.3 9.3-19.1 17.7-26.7 18.8-12.6 1.9-22.4.9-47.5-9.9-39.7-17.2-65.7-57.2-67.7-59.8-2-2.6-16.2-21.5-16.2-41s10.2-29.1 13.9-33.1c3.6-4 7.9-5 10.6-5 2.6 0 5.3 0 7.6.1 2.4.1 5.7-.9 8.9 6.8 3.3 7.9 11.2 27.4 12.2 29.4s1.7 4.3.3 6.9c-7.6 15.2-15.7 14.6-11.6 21.6 15.3 26.3 30.6 35.4 53.9 47.1 4 2 6.3 1.7 8.6-1 2.3-2.6 9.9-11.6 12.5-15.5 2.6-4 5.3-3.3 8.9-2 3.6 1.3 23.1 10.9 27.1 12.9s6.6 3 7.6 4.6c.9 1.9.9 9.9-2.4 19.1zM400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zM223.9 413.2c-26.6 0-52.7-6.7-75.8-19.3L64 416l22.5-82.2c-13.9-24-21.2-51.3-21.2-79.3C65.4 167.1 136.5 96 223.9 96c42.4 0 82.2 16.5 112.2 46.5 29.9 30 47.9 69.8 47.9 112.2 0 87.4-72.7 158.5-160.1 158.5z"></path>
    </svg>
  )), []);

  // Validation check function
  const checkRecaptchaAndToken = useCallback((requireToken = true) => {
    if (requireToken && !token) {
      setOtpError('This OTP is expired. Please request a new code.');
      return false;
    }

    return true;
  }, [token]);

  // Common success message show/hide
  const showTemporarySuccessMessage = useCallback(() => {
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 5000);
  }, []);

  // Common reset timer logic
  const resetTimer = useCallback(() => {
    setTimeLeft(15);
    setShowResendOptions(false);
  }, []);

  // Send OTP API call
  const sendOTP = useCallback(async (showMessage = true) => {
    if (isLoading) return;

    setIsLoading(true);
    setOtpError('');

    try {
      const data = await OTPAPI.sendOTP(phoneNumber);
      
      if (data && data.token) {
        setToken(data.token);
        if (showMessage) {
          showTemporarySuccessMessage();
        }
        resetTimer();
        setIsLoading(false);
      } else {
        setOtpError((data && (data.error || data.message)) || 'Failed to retrieve verification token. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : 'Failed to send OTP. Please try again.');
      setIsLoading(false);
    }
  }, [phoneNumber, showTemporarySuccessMessage, resetTimer]);

  // Handle sending OTP with reCAPTCHA verification
  const handleSendOTP = useCallback(async (showMessage = true) => {
    if (isLoading || token) return;

    try {
      setIsLoading(true);
      setOtpError('');

      if (recaptchaV2Passed) {
        await sendOTP(showMessage);
        return;
      }

      const { score } = await executeRecaptchaV3('send_otp');

      if (score < 0.5 && !recaptchaV2Passed) {
        console.log(`Low reCAPTCHA score detected (${score}), V2 will be handled by MultiStepForm`);
        setIsLoading(false);
        return;
      }

      await sendOTP(showMessage);
    } catch (error) {
      setOtpError('Error verifying security check. Please try again.');
      setIsLoading(false);
    }
  }, [recaptchaV2Passed, executeRecaptchaV3, sendOTP, token]);

  // Initialize once when component mounts
  useEffect(() => {
    // If phone number changed, reset state and attempt to reuse cached token for
    // the new number (if any).
    if (phoneNumberRef.current !== phoneNumber) {
      hasInitializedRef.current = false;
      phoneNumberRef.current = phoneNumber;

      const cachedTokenForNewNumber = otpTokenCache[phoneNumber] || null;
      setToken(cachedTokenForNewNumber);
      setTimeLeft(cachedTokenForNewNumber ? 0 : 15);
      setShowResendOptions(!!cachedTokenForNewNumber);
    }

    // Skip sending a new OTP if we already have a token (from prop or cache).
    if (hasInitializedRef.current || existingToken || token) {
      return;
    }

    const init = async () => {
      hasInitializedRef.current = true;

      try {
        setIsLoading(true);
        setOtpError('');

        const data = await OTPAPI.sendOTP(phoneNumber);

        if (data && data.token) {
          setToken(data.token);
          setTimeLeft(15);
          setShowResendOptions(false);
          setIsLoading(false);
        } else {
          setOtpError((data && (data.error || data.message)) || 'Failed to retrieve verification token. Please try again.');
          setIsLoading(false);
        }
      } catch (error) {
        setOtpError(error instanceof Error ? error.message : 'Network error. Please try again.');
        setIsLoading(false);
      }
    };

    init();
  }, [existingToken, phoneNumber, token]); // Include token so guard reevaluates

  // Resend OTP API call
  const resendOTP = useCallback(async () => {
    if (isLoading) return; // Prevent multiple calls
    
    if (!token) {
      handleSendOTP(true);
      return;
    }

    if (!checkRecaptchaAndToken(true)) return;

    setIsLoading(true);
    setOtpError('');

    try {
      const result = await OTPAPI.resendOTP(token);

      if (!result.success) {
        if (result.response?.status === 404 || result.response?.status === 401) {
          setOtpError('This OTP is expired. Requesting a new verification code.');
          handleSendOTP(true);
          return;
        }

        setOtpError(`Resend failed (${result.response?.status}). Please try again.`);
        setIsLoading(false);
        return;
      }

      showTemporarySuccessMessage();

      if (result.data && result.data.token) {
        setToken(result.data.token);
      }

      resetTimer();
      setIsLoading(false);
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : 'Failed to resend OTP. Please try again.');
      setIsLoading(false);
    }
  }, [isLoading, token, handleSendOTP, checkRecaptchaAndToken, showTemporarySuccessMessage, resetTimer]);

  // Verify OTP API call - OPTIMIZED: Removed setTimeout delay
  const verifyOTP = useCallback(async (otpCode: string) => {
    // Check if entered code matches master OTP for testing
    if (otpCode === MASTER_OTP) {
      console.log('🧪 Master OTP used - bypassing verification');
      setIsLoading(true);
      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      onVerificationComplete();
      return;
    }

    if (!checkRecaptchaAndToken(true)) return;

    setIsLoading(true);
    setOtpError('');

    try {
      const result = await OTPAPI.verifyOTP(token!, otpCode);

      if (!result.success) {
        let errorMsg = result.data && (result.data.error || result.data.message) || 'Please try again.';
        if (errorMsg.includes('expired')) {
          setOtpError('This OTP is expired. Please request a new code.');
        } else {
          setOtpError(`Verification failed (${result.response?.status}): ${errorMsg}`);
        }
        setIsLoading(false);
        return;
      }

      if (result.response?.status === 200 && (!result.data?.success && !result.data?.result)) {
        if (!result.text || result.text.trim() === '' || result.text === '{}') {
          onVerificationComplete();
          return;
        }
      }

      if (result.data && (result.data.success || result.data.result)) {
        onVerificationComplete();
      } else {
        let errorMessage = result.data && (result.data.error || result.data.message) || 'The code you entered is invalid. Please enter the correct code.';
        if (errorMessage.includes('expired')) {
          errorMessage = 'This OTP is expired. Please request a new code.';
        }
        setOtpError(errorMessage);
        setIsLoading(false);
      }
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : 'Failed to verify OTP. Please try again.');
      setIsLoading(false);
    }
  }, [checkRecaptchaAndToken, token, onVerificationComplete]);

  // Handle OTP digit change - OPTIMIZED: Removed setTimeout delay for input focus
  const handleCodeChange = useCallback((value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value.substring(0, 1);
    setOtpDigits(newOtpDigits);

    if (otpError) {
      setOtpError('');
    }

    // Move to next input if this one is filled - OPTIMIZED: Removed setTimeout
    if (value && index < 3) {
      const inputs = document.getElementsByClassName(`otp-input-${index + 1}`);
      if (inputs.length > 0) {
        const nextInput = inputs[0] as HTMLInputElement;
        nextInput.focus();
      }
    }

    // Verify OTP automatically when 4 digits are entered - OPTIMIZED: No delay
    const completeOTP = newOtpDigits.join('');
    if (completeOTP.length === 4) {
      verifyOTP(completeOTP);
    }
  }, [otpDigits, otpError, verifyOTP]);

  // Handle backspace key press - OPTIMIZED: Removed setTimeout delay
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtpDigits = [...otpDigits];

      if (otpError) {
        setOtpError('');
      }

      if (otpDigits[index]) {
        newOtpDigits[index] = '';
        setOtpDigits(newOtpDigits);
        return;
      }

      if (index > 0 && !otpDigits[index]) {
        const inputs = document.getElementsByClassName(`otp-input-${index - 1}`);
        if (inputs.length > 0) {
          const prevInput = inputs[0] as HTMLInputElement;
          prevInput.focus();
          newOtpDigits[index - 1] = '';
          setOtpDigits(newOtpDigits);
        }
      }
    }
  }, [otpDigits, otpError]);

  // Handle paste event - OPTIMIZED: Removed setTimeout delay
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digits = pastedText.replace(/[^\d]/g, '').substring(0, 4);

    if (digits.length > 0) {
      if (otpError) {
        setOtpError('');
      }

      const newOtpDigits = Array(4).fill('');
      for (let i = 0; i < digits.length; i++) {
        if (i < 4) newOtpDigits[i] = digits[i];
      }

      setOtpDigits(newOtpDigits);

      if (digits.length === 4) {
        verifyOTP(digits);
      }
    }
  }, [otpError, verifyOTP]);

  // Handle direct OTP input (for auto-fill) - OPTIMIZED: Removed setTimeout delay
  const handleDirectOTPInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (/^\d*$/.test(value)) {
      const digits = value.substring(0, 4);
      const newOtpDigits = Array(4).fill('');

      for (let i = 0; i < digits.length; i++) {
        newOtpDigits[i] = digits[i];
      }

      setOtpDigits(newOtpDigits);

      if (otpError) {
        setOtpError('');
      }

      if (digits.length === 4) {
        verifyOTP(digits);
      }
    }
  }, [otpError, verifyOTP]);

  // Set up auto-detection for SMS OTP - OPTIMIZED: Removed setTimeout delay
  useEffect(() => {
    if ('OTPCredential' in window) {
      const ac = new AbortController();

      navigator.credentials.get({
        // @ts-ignore
        otp: {
          transport: ['sms'],
          signal: ac.signal
        },
      }).then((credential: Credential | null) => {
        if (credential && 'code' in credential && typeof credential.code === 'string' && credential.code) {
          const code = credential.code;
          const digits = code.replace(/[^\d]/g, '').substring(0, 4);
          if (digits.length === 4) {
            const newOtpDigits = digits.split('');
            setOtpDigits(newOtpDigits);
            verifyOTP(digits);
          }
        }
      }).catch(() => {
        // Silently handle errors
      });

      return () => {
        ac.abort();
      };
    }
  }, [verifyOTP]);

  // WhatsApp button handler
  const handleWhatsAppCode = useCallback(async () => {
    if (!token) {
      handleSendOTP(true);
      return;
    }

    if (!checkRecaptchaAndToken(true)) return;

    setIsLoading(true);
    setOtpError('');

    try {
      const result = await OTPAPI.sendWhatsAppCode(token);

      if (!result.success) {
        if (result.response?.status === 404 || result.response?.status === 401) {
          setOtpError('This OTP is expired. Requesting a new verification code.');
          handleSendOTP(true);
          return;
        }

        setOtpError(`WhatsApp code sending failed (${result.response?.status}). Please try again.`);
        setIsLoading(false);
        return;
      }

      showTemporarySuccessMessage();

      if (result.data && result.data.token) {
        setToken(result.data.token);
      }

      resetTimer();
      setIsLoading(false);
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : 'Failed to send WhatsApp code. Please try again.');
      setIsLoading(false);
    }
  }, [token, handleSendOTP, checkRecaptchaAndToken, showTemporarySuccessMessage, resetTimer]);

  const isComplete = otpDigits.join('').length === 4;

  // Keep the cache in sync whenever the token or phone number changes.
  useEffect(() => {
    if (token) {
      otpTokenCache[phoneNumber] = token;
    }
  }, [token, phoneNumber]);

  return (
    <div className="otp-verification-container">
      <h2 className="form-title">
        Verify your mobile number
      </h2>

      <p className="form-subtitle">
        Please enter the 4-digit code sent to <span style={{ ...textColor, fontWeight: '600' }}>{phoneNumber}</span>
      </p>

      {token && (
        <>
          <div className="otp-wrapper">
            {isMobile && (
              <input
                type="text"
                name="otp"
                id="otp-direct-input"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="\d*"
                maxLength={4}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '60px',
                  opacity: 0,
                  zIndex: 2,
                  top: '20px',
                  left: 0
                }}
                value={otpDigits.join('')}
                onChange={handleDirectOTPInput}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace') {
                    const current = otpDigits.join('');
                    if (current.length > 0) {
                      const newDigits = current.slice(0, -1).split('');
                      while (newDigits.length < 4) newDigits.push('');
                      setOtpDigits(newDigits);
                    }
                    e.preventDefault();
                  }
                }}
                onPaste={handlePaste}
              />
            )}

            <div className="otp-container">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={otpDigits[index]}
                    onChange={(e) => handleCodeChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    maxLength={1}
                    className={`otp-input otp-input-${index} ${otpError ? 'error' : ''}`}
                    style={{
                      ...(otpError ? inputErrorStyle : {})
                    }}
                    inputMode="numeric"
                    pattern="\d*"
                    autoComplete="off"
                    autoFocus={index === 0}
                    disabled={isLoading}
                  />
                  {otpDigits[index] === '' && isMobile && !isLoading && index === otpDigits.findIndex(digit => digit === '') && (
                    <span style={otpCursorStyle}></span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {otpError && (
            <p className="error-message-otp" style={errorMessageStyle}>{otpError}</p>
          )}

          {showSuccessMessage && (
            <p className="success-message" style={successMessageStyle}>Code has been sent successfully!</p>
          )}

          {showResendOptions && (
            <div className="verification-options">
              <div className="resend-option">
                <button
                  onClick={resendOTP}
                  className="resend-button"
                  disabled={isLoading || timeLeft > 0}
                >
                  Didn't receive the code? <span className="resend-text" style={textColor}>Resend</span>
                  {timeLeft > 0 && (
                    <span className="timer-text"> ({timeLeft}s)</span>
                  )}
                </button>
              </div>

              <button
                onClick={handleWhatsAppCode}
                className="whatsapp-link"
                disabled={isLoading}
              >
                <span style={whatsAppTextStyle}>Get the code on Whatsapp</span> <span className="whatsapp-icon"><WhatsAppIcon /></span>
              </button>
            </div>
          )}
        </>
      )}

      {isLoading && !token && (
        <div className="otp-loading-container">
          <div className="otp-loader">
            <svg className="otp-circular-loader" viewBox="25 25 50 50">
              <circle className="otp-loader-path" cx="50" cy="50" r="20" fill="none" stroke="#ff2048" strokeWidth="4" />
            </svg>
          </div>
        </div>
      )}

      <NavigationButtons
        prevStep={onBack}
        nextStep={() => {
          const code = otpDigits.join('');
          if (code.length === 4) {
            verifyOTP(code);
          }
        }}
        isNextDisabled={!isComplete || isLoading}
        backButtonId={backButtonId}
        nextButtonId={nextButtonId}
      />
    </div>
  );
};

// Add animation for cursor blinking
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`;
document.head.appendChild(styleSheet);

export default OTPVerification;