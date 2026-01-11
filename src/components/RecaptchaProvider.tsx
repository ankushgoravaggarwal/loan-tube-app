import React, { createContext, useState, useContext, ReactNode, useCallback, useRef, useEffect } from 'react';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { RecaptchaAPI } from '../services/apiService';

interface RecaptchaContextType {
  recaptchaScore: number | null;
  setRecaptchaScore: (score: number | null) => void;
  showRecaptchaV2: boolean;
  setShowRecaptchaV2: (show: boolean) => void;
  recaptchaV2Passed: boolean;
  setRecaptchaV2Passed: (passed: boolean) => void;
  recaptchaV2Failed: boolean;
  setRecaptchaV2Failed: (failed: boolean) => void;
  resetRecaptchaState: () => void;
  executeRecaptchaV3: (action: string) => Promise<{score: number, token: string}>;
  recaptchaLog: RecaptchaLogEntry[];
  clearRecaptchaLog: () => void;
  shouldShowRecaptchaV2: (currentScreen: 'email' | 'otp') => boolean;
  markScreenPassed: (screen: 'email' | 'otp') => void;
  isRecaptchaLoaded: boolean;
}

// Interface for reCAPTCHA log entries
interface RecaptchaLogEntry {
  timestamp: string;
  action: string;
  score: number;
  step: number;
  screen: number;
  triggeredV2: boolean;
}

// Cache interface to store recent action results
interface RecaptchaCache {
  [action: string]: {
    timestamp: number;
    result: {score: number, token: string};
  }
}

// Extended Window interface for reCAPTCHA audit logs
interface WindowWithRecaptchaLogs extends Window {
  recaptchaAuditLogs?: RecaptchaLogEntry[];
}

const RecaptchaContext = createContext<RecaptchaContextType | undefined>(undefined);

// Inner provider component that uses the hook
const RecaptchaInnerProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [recaptchaScore, setRecaptchaScore] = useState<number | null>(null);
  const [showRecaptchaV2, setShowRecaptchaV2] = useState(false);
  const [recaptchaV2Passed, setRecaptchaV2Passed] = useState(false);
  const [recaptchaV2Failed, setRecaptchaV2Failed] = useState(false);
  const [recaptchaLog, setRecaptchaLog] = useState<RecaptchaLogEntry[]>([]);
  
  // Controller state to track scores and screen status
  const [dobScore, setDobScore] = useState<number | null>(null);
  const [phoneScore, setPhoneScore] = useState<number | null>(null);
  const [emailScreenPassed, setEmailScreenPassed] = useState(false);
  const [otpScreenPassed, setOtpScreenPassed] = useState(false);

  // Use ref for caching to prevent re-renders
  const recaptchaCacheRef = useRef<RecaptchaCache>({});
  // Debounce timer reference
  const debounceTimerRef = useRef<number | null>(null);
  // Pending actions queue
  const pendingActionsRef = useRef<Set<string>>(new Set());

  const { executeRecaptcha } = useGoogleReCaptcha();

  const resetRecaptchaState = () => {
    setRecaptchaScore(null);
    setShowRecaptchaV2(false);
    setRecaptchaV2Passed(false);
    setRecaptchaV2Failed(false);
  };

  const clearRecaptchaLog = () => {
    setRecaptchaLog([]);
  };

  // reCAPTCHA Controller Functions
  const shouldShowRecaptchaV2 = useCallback((currentScreen: 'email' | 'otp'): boolean => {
    // If V2 already passed, never show again
    if (recaptchaV2Passed) {
      return false;
    }
    
    // If screens already passed, don't show V2
    if ((currentScreen === 'email' && emailScreenPassed) || (currentScreen === 'otp' && otpScreenPassed)) {
      return false;
    }

    if (currentScreen === 'email') {
      // Show V2 on email screen if DOB score was < 0.5
      return dobScore !== null && dobScore < 0.5;
    }
    
    if (currentScreen === 'otp') {
      // Show V2 on OTP screen if:
      // 1. DOB score was >= 0.5 (so V2 wasn't shown on email), AND
      // 2. Phone score is < 0.5
      const condition1 = dobScore !== null && dobScore >= 0.5;
      const condition2 = phoneScore !== null && phoneScore < 0.5;
      return condition1 && condition2;
    }
    
    return false;
  }, [recaptchaV2Passed, emailScreenPassed, otpScreenPassed, dobScore, phoneScore]);

  const markScreenPassed = useCallback((screen: 'email' | 'otp') => {
    if (screen === 'email') {
      setEmailScreenPassed(true);
    } else if (screen === 'otp') {
      setOtpScreenPassed(true);
    }
  }, []);

  // Helper function to extract step and screen from action
  const extractStepAndScreen = (action: string): { step: number; screen: number } => {
    const stepMatch = action.match(/step_(\d+)/);
    const screenMatch = action.match(/screen_(\d+)/);
    
    return {
      step: stepMatch ? parseInt(stepMatch[1]) : 0,
      screen: screenMatch ? parseInt(screenMatch[1]) : 0
    };
  };

  // Helper function to add entry to reCAPTCHA log
  const addToRecaptchaLog = (action: string, score: number, triggeredV2: boolean) => {
    const { step, screen } = extractStepAndScreen(action);
    
    const logEntry: RecaptchaLogEntry = {
      timestamp: new Date().toISOString(),
      action,
      score: Math.round(score * 1000) / 1000, // Round to 3 decimal places
      step,
      screen,
      triggeredV2
    };

    setRecaptchaLog(prev => {
      const updated = [...prev, logEntry];
      
      // Store logs in window context for audit system access
      if (typeof window !== 'undefined') {
        (window as WindowWithRecaptchaLogs).recaptchaAuditLogs = updated;
      }
      
      return updated;
    });
    
    // Log to console for debugging
    console.log('reCAPTCHA Log Entry:', logEntry);
  };

  const executeRecaptchaV3 = useCallback(async (action: string) => {
    if (!executeRecaptcha) {
      throw new Error("reCAPTCHA not initialized");
    }

    console.log('executeRecaptchaV3 called with action:', action);

    // Check if action is already pending to avoid duplicate requests
    if (pendingActionsRef.current.has(action)) {
      // If this is OTP verification, wait for the result
      if (action.includes("otp") || action.includes("OTP")) {
        // We'll wait for the first request to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        // Recursively try again (will use cache if available)
        return executeRecaptchaV3(action);
      } else {
        // For other actions, return a cached value if available or a default
        const cache = recaptchaCacheRef.current[action];
        if (cache && Date.now() - cache.timestamp < 60000) { // 1 minute cache validity
          return cache.result;
        }

        // Default fallback with logging
        const fallbackScore = 0.5;
        addToRecaptchaLog(action, fallbackScore, false);
        return { score: fallbackScore, token: "" };
      }
    }

    // Check cache first (for non-critical actions)
    const isCriticalAction = action.includes("otp") || action.includes("OTP");
    if (!isCriticalAction) {
      const cache = recaptchaCacheRef.current[action];
      if (cache && Date.now() - cache.timestamp < 60000) { // 1 minute cache validity
        console.log('Using cached reCAPTCHA result for action:', action);
        return cache.result;
      }
    }

    // Mark action as pending
    pendingActionsRef.current.add(action);

    try {
      // Clear any existing debounce timer
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // Execute reCAPTCHA with the action
      const token = await executeRecaptcha(action);

      let result: {score: number, token: string};

      try {
        const data = await RecaptchaAPI.verifyRecaptcha(token, action);
        const score = data.score || 0.5; // Default to 0.5 if no score
        setRecaptchaScore(score);

        // Track specific screen scores for controller
        if (action.includes('date_of_birth_screen') || action.includes('dob')) {
          setDobScore(score);
        } else if (action.includes('mobile_number_screen') || action.includes('phone')) {
          setPhoneScore(score);
        }

        // Check if score is below threshold and trigger V2 if needed
        const shouldTriggerV2 = score < 0.5;
        
        // Add to log
        addToRecaptchaLog(action, score, shouldTriggerV2);

        // Trigger V2 reCAPTCHA if score is low (legacy behavior - will be controlled by new functions)
        if (shouldTriggerV2 && !recaptchaV2Passed) {
          console.log(`Low reCAPTCHA score detected (${score}), triggering V2 verification`);
          setShowRecaptchaV2(true);
        }

        result = { score, token };
      } catch (error) {
        console.error("API error during reCAPTCHA verification:", error);
        
        // Determine if this is a 400 error specifically
        const is400Error = error instanceof Error && error.message.includes('400');
        
        if (is400Error) {
          console.warn('Backend returning 400 - likely missing secret keys or endpoint not configured properly');
          console.warn('Consider checking: 1) Backend endpoint exists, 2) RECAPTCHA_V3_SECRET_KEY is set, 3) CORS configuration');
        }
        
        // Fallback if API call fails - use moderate score for development
        const fallbackScore = 0.6; // Good score for development when backend is not available
        console.log('API verification failed, using fallback score:', fallbackScore);
        setRecaptchaScore(fallbackScore);
        
        // Track specific screen scores for controller
        if (action.includes('date_of_birth_screen') || action.includes('dob')) {
          setDobScore(fallbackScore);
        } else if (action.includes('mobile_number_screen') || action.includes('phone')) {
          setPhoneScore(fallbackScore);
        }
        
        // Add to log with API error indication
        addToRecaptchaLog(`${action}_api_error`, fallbackScore, false);
        
        result = { score: fallbackScore, token };
      }

      // Update cache
      recaptchaCacheRef.current[action] = {
        timestamp: Date.now(),
        result
      };

      // Remove from pending actions
      pendingActionsRef.current.delete(action);

      return result;
    } catch (error) {
      console.error("reCAPTCHA execution failed:", error);
      // Remove from pending actions
      pendingActionsRef.current.delete(action);
      
      // Return a very low score and log the error
      const errorScore = 0.1;
      addToRecaptchaLog(`${action}_execution_error`, errorScore, true);
      
      // Show V2 due to execution error
      if (!recaptchaV2Passed) {
        setShowRecaptchaV2(true);
      }
      
      return { score: errorScore, token: "" };
    }
  }, [executeRecaptcha, recaptchaV2Passed]);

  return (
    <RecaptchaContext.Provider
      value={{
        recaptchaScore,
        setRecaptchaScore,
        showRecaptchaV2,
        setShowRecaptchaV2,
        recaptchaV2Passed,
        setRecaptchaV2Passed,
        recaptchaV2Failed,
        setRecaptchaV2Failed,
        resetRecaptchaState,
        executeRecaptchaV3,
        recaptchaLog,
        clearRecaptchaLog,
        shouldShowRecaptchaV2,
        markScreenPassed,
        isRecaptchaLoaded: true
      }}
    >
      {children}
    </RecaptchaContext.Provider>
  );
};

// Lazy loading wrapper for GoogleReCaptchaProvider
const LazyRecaptchaProvider: React.FC<{children: ReactNode, reCaptchaKey: string}> = ({ children, reCaptchaKey }) => {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={reCaptchaKey}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head'
      }}
      container={{
        parameters: {
          badge: 'bottomright',
          theme: 'light'
        }
      }}
      language={navigator.language.split('-')[0] || 'en'}
    >
      <RecaptchaInnerProvider>
        {children}
      </RecaptchaInnerProvider>
    </GoogleReCaptchaProvider>
  );
};

// Fallback provider for when reCAPTCHA is not loaded
const FallbackRecaptchaProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const executeRecaptchaV3 = useCallback(async (action: string) => {
    throw new Error("reCAPTCHA not loaded yet - user interaction required");
  }, []);

  return (
    <RecaptchaContext.Provider
      value={{
        recaptchaScore: null,
        setRecaptchaScore: () => {},
        showRecaptchaV2: false,
        setShowRecaptchaV2: () => {},
        recaptchaV2Passed: false,
        setRecaptchaV2Passed: () => {},
        recaptchaV2Failed: false,
        setRecaptchaV2Failed: () => {},
        resetRecaptchaState: () => {},
        executeRecaptchaV3,
        recaptchaLog: [],
        clearRecaptchaLog: () => {},
        shouldShowRecaptchaV2: () => false,
        markScreenPassed: () => {},
        isRecaptchaLoaded: false
      }}
    >
      {children}
    </RecaptchaContext.Provider>
  );
};

// Main provider - simple user interaction detection
interface RecaptchaProviderProps {
  children: ReactNode;
  reCaptchaKey: string;
}

export const RecaptchaProvider: React.FC<RecaptchaProviderProps> = ({
  children,
  reCaptchaKey
}) => {
  const [isRecaptchaLoaded, setIsRecaptchaLoaded] = useState(false);
  const loadedRef = useRef(false);

  const loadRecaptcha = useCallback(() => {
    if (loadedRef.current) return;
    
    loadedRef.current = true;
    console.log('Loading reCAPTCHA on user interaction...');
    setIsRecaptchaLoaded(true);
  }, []);

  useEffect(() => {
    // For offer page, load immediately to avoid any JavaScript delays
    const isOfferPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/offerpage');
    if (isOfferPage) {
      loadRecaptcha();
      return;
    }

    // For other pages: load on first user interaction
    const handleInteraction = () => {
      loadRecaptcha();
    };

    document.addEventListener('click', handleInteraction, { once: true, passive: true });
    document.addEventListener('keydown', handleInteraction, { once: true, passive: true });
    document.addEventListener('touchstart', handleInteraction, { once: true, passive: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [loadRecaptcha]);

  if (!isRecaptchaLoaded) {
    return (
      <FallbackRecaptchaProvider>
        <div className="recaptcha-terms" style={{
          visibility: 'hidden',
          display: 'none',
          fontSize: '0',
          height: '0',
          width: '0'
        }}>
          This site is protected by reCAPTCHA and the Google
          <a href="https://policies.google.com/privacy">Privacy Policy</a> and
          <a href="https://policies.google.com/terms">Terms of Service</a> apply.
        </div>
        {children}
      </FallbackRecaptchaProvider>
    );
  }

  return (
    <LazyRecaptchaProvider reCaptchaKey={reCaptchaKey}>
      <div className="recaptcha-terms" style={{
        visibility: 'hidden',
        display: 'none',
        fontSize: '0',
        height: '0',
        width: '0'
      }}>
        This site is protected by reCAPTCHA and the Google
        <a href="https://policies.google.com/privacy">Privacy Policy</a> and
        <a href="https://policies.google.com/terms">Terms of Service</a> apply.
      </div>
      {children}
    </LazyRecaptchaProvider>
  );
};

export const useRecaptcha = (): RecaptchaContextType => {
  const context = useContext(RecaptchaContext);
  if (context === undefined) {
    throw new Error('useRecaptcha must be used within a RecaptchaProvider');
  }
  return context;
};
