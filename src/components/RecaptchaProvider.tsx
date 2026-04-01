import React, { createContext, useContext, useCallback, useState, ReactNode } from 'react';

interface RecaptchaLogEntry {
  timestamp: string;
  action: string;
  score: number;
  step: number;
  screen: number;
  triggeredV2: boolean;
}

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
  executeRecaptchaV3: (action: string) => Promise<{ score: number; token: string }>;
  recaptchaLog: RecaptchaLogEntry[];
  clearRecaptchaLog: () => void;
  shouldShowRecaptchaV2: (currentScreen: 'email' | 'otp') => boolean;
  markScreenPassed: (screen: 'email' | 'otp') => void;
  isRecaptchaLoaded: boolean;
}

const RecaptchaContext = createContext<RecaptchaContextType | undefined>(undefined);

/**
 * reCAPTCHA v2/v3 is disabled so the loan form is not blocked while flows are stabilised.
 * No Google scripts load. Replace this stub with the real provider when enabling again.
 */
export const RecaptchaProvider: React.FC<{ children: ReactNode; reCaptchaKey?: string }> = ({
  children,
}) => {
  const [recaptchaScore, setRecaptchaScore] = useState<number | null>(null);
  const [showRecaptchaV2, setShowRecaptchaV2] = useState(false);
  const [recaptchaV2Passed, setRecaptchaV2Passed] = useState(false);
  const [recaptchaV2Failed, setRecaptchaV2Failed] = useState(false);
  const [recaptchaLog, setRecaptchaLog] = useState<RecaptchaLogEntry[]>([]);

  const resetRecaptchaState = useCallback(() => {
    setRecaptchaScore(null);
    setShowRecaptchaV2(false);
    setRecaptchaV2Passed(false);
    setRecaptchaV2Failed(false);
  }, []);

  const clearRecaptchaLog = useCallback(() => setRecaptchaLog([]), []);

  const executeRecaptchaV3 = useCallback(async (_action: string) => {
    return { score: 1, token: 'noop' };
  }, []);

  const shouldShowRecaptchaV2 = useCallback(() => false, []);

  const markScreenPassed = useCallback((_screen: 'email' | 'otp') => {}, []);

  const value: RecaptchaContextType = {
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
    isRecaptchaLoaded: true,
  };

  return <RecaptchaContext.Provider value={value}>{children}</RecaptchaContext.Provider>;
};

export const useRecaptcha = (): RecaptchaContextType => {
  const context = useContext(RecaptchaContext);
  if (context === undefined) {
    throw new Error('useRecaptcha must be used within a RecaptchaProvider');
  }
  return context;
};
