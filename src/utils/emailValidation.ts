import React from 'react';
import { EmailValidationAPI } from '../services/apiService';

// Email validation utility with format checking and API validation
export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  isChecking?: boolean;
}

// Email regex for format validation - compiled once for better performance
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Cache configurations
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes
const MAX_FORMAT_CACHE_SIZE = 1000;
const TOKEN_CACHE_EXPIRY = 4 * 60 * 1000; // 4 minutes (tokens expire in 5)

// Cache stores
const validationCache = new Map<string, { isValid: boolean; timestamp: number; errorType?: 'blacklisted' | 'invalid' }>();
const formatCache = new Map<string, boolean>();
const tokenCache = new Map<string, { token: string; timestamp: number }>();

// Optimized format validation function with memory cache
export const isValidEmailFormat = (email: string): boolean => {
  if (!email) return false;
  
  // Check format cache first for instant results
  if (formatCache.has(email)) {
    return formatCache.get(email)!;
  }
  
  const atIndex = email.indexOf('@');
  if (atIndex === -1 || atIndex === 0 || atIndex === email.length - 1) {
    formatCache.set(email, false);
    return false;
  }
  
  if (email.includes('..') || email[atIndex - 1] === '.' || email[atIndex + 1] === '.') {
    formatCache.set(email, false);
    return false;
  }
  
  const parts = email.split('@');
  if (parts.length !== 2) {
    formatCache.set(email, false);
    return false;
  }
  
  const [local, domain] = parts;
  const isValid = !!(local && domain && domain.indexOf('.') !== -1 && EMAIL_REGEX.test(email));
  
  // Cache the result and manage cache size
  if (formatCache.size >= MAX_FORMAT_CACHE_SIZE) {
    const firstKey = formatCache.keys().next().value;
    if (firstKey) formatCache.delete(firstKey);
  }
  formatCache.set(email, isValid);
  
  return isValid;
};

// Get random token for email validation with caching
const getRandomToken = async (email: string): Promise<{ token: string }> => {
  // Check token cache first
  const cachedToken = tokenCache.get(email);
  if (cachedToken && Date.now() - cachedToken.timestamp < TOKEN_CACHE_EXPIRY) {
    return { token: cachedToken.token };
  }

  try {
    const result = await EmailValidationAPI.getToken(email);
    tokenCache.set(email, { token: result.token, timestamp: Date.now() });
    return result;
  } catch (error) {
    throw new Error(`Failed to get authentication token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Optimized API validation function with random token authentication
export const validateEmailWithAPI = async (email: string): Promise<boolean> => {
  // Check cache with expiration - but handle blacklisted emails specially
  const cached = validationCache.get(email);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    // For blacklisted emails (invalid results), always return cached result
    // Don't clear cache for blacklisted emails as they should stay blacklisted
    return cached.isValid;
  }

  try {
    const authToken = await getRandomToken(email);
    const isValid = await EmailValidationAPI.validateEmail(email, authToken.token);
    
    // Cache with timestamp
    validationCache.set(email, { isValid, timestamp: Date.now() });
    
    return isValid;
  } catch (error) {
    console.warn('Email validation error:', error);
    
    // Re-throw blacklist errors to be handled by calling functions
    if (error instanceof Error && error.message === 'BLACKLISTED_EMAIL') {
      // Cache blacklisted email with error type
      validationCache.set(email, { isValid: false, timestamp: Date.now(), errorType: 'blacklisted' });
      throw error;
    }
    
    return true; // Don't block the user if API fails (except for blacklisted emails)
  }
};

// Helper function for error handling
const handleValidationError = (error: unknown): { isValid: boolean; errorMessage?: string } => {
  let errorMessage: string | undefined;
  let isValid = true; // Don't block user on API errors by default
  
  if (error instanceof Error) {
    if (error.message === 'BLACKLISTED_EMAIL') {
      errorMessage = 'Please provide a different email address';
      isValid = false;
    } else if (error.message.includes('Rate limited') || error.message.includes('blacklisted')) {
      errorMessage = 'Too many validation attempts. Please try again later.';
      isValid = false;
    } else if (error.message.includes('Authentication failed')) {
      errorMessage = 'Validation service temporarily unavailable.';
    } else if (error.message.includes('Too many token requests')) {
      errorMessage = 'Please wait before validating another email.';
    }
  }
  
  return { isValid, errorMessage };
};

// Optimized hook for email validation with better memoization
export const useEmailValidation = () => {
  const [validationState, setValidationState] = React.useState<{
    [email: string]: EmailValidationResult;
  }>({});

  const validateEmail = React.useCallback(async (email: string): Promise<EmailValidationResult> => {
    // Clear validation state for all other emails when validating a new one
    setValidationState(prev => {
      const newState: { [email: string]: EmailValidationResult } = {};
      if (prev[email]) {
        newState[email] = prev[email];
      }
      return newState;
    });

    // Format check first
    if (!isValidEmailFormat(email)) {
      const result: EmailValidationResult = {
        isValid: false,
        error: 'Please provide a valid email address'
      };
      setValidationState(prev => ({ ...prev, [email]: result }));
      return result;
    }

    // Check if already validating this exact email
    if (validationState[email]?.isChecking) return validationState[email];

    // Check cached results first - always respect blacklisted emails
    const cachedResult = validationCache.get(email);
    const shouldUseCachedResult = cachedResult && Date.now() - cachedResult.timestamp < CACHE_EXPIRY;
    
    if (shouldUseCachedResult) {
      const errorMessage = cachedResult.isValid ? undefined : 
        cachedResult.errorType === 'blacklisted' ? 'Please provide a different email address' : 'This email address is not valid';
      
      const result: EmailValidationResult = {
        isValid: cachedResult.isValid,
        error: errorMessage
      };
      setValidationState(prev => ({ ...prev, [email]: result }));
      return result;
    }

    // Set loading state
    setValidationState(prev => ({ ...prev, [email]: { isValid: false, isChecking: true } }));

    try {
      const isAPIValid = await validateEmailWithAPI(email);
      const result: EmailValidationResult = {
        isValid: isAPIValid,
        error: isAPIValid ? undefined : 'This email address is not valid'
      };
      
      setValidationState(prev => ({ ...prev, [email]: result }));
      return result;
    } catch (error) {
      const { isValid, errorMessage } = handleValidationError(error);
      
      // Cache blacklisted and rate-limited results
      if (!isValid && error instanceof Error && 
          (error.message === 'BLACKLISTED_EMAIL' || error.message.includes('Rate limited'))) {
        const errorType = error.message === 'BLACKLISTED_EMAIL' ? 'blacklisted' : 'invalid';
        validationCache.set(email, { isValid: false, timestamp: Date.now(), errorType });
      }
      
      const result: EmailValidationResult = { 
        isValid,
        error: errorMessage
      };
      setValidationState(prev => ({ ...prev, [email]: result }));
      return result;
    }
  }, [validationState]);

  const getValidationResult = React.useMemo(() => 
    (email: string): EmailValidationResult => validationState[email] || { isValid: false }
  , [validationState]);

  const clearValidation = React.useCallback((email: string) => {
    setValidationState(prev => {
      const { [email]: removed, ...rest } = prev;
      return rest;
    });
    validationCache.delete(email);
  }, []);

  return { validateEmail, getValidationResult, clearValidation };
};

// Simple validation function for immediate use (without hooks)
export const validateEmailSync = (email: string): EmailValidationResult => {
  return isValidEmailFormat(email) 
    ? { isValid: true }
    : { isValid: false, error: 'Please provide a valid email address' };
};

// Optimized debounced validation function
export const createDebouncedEmailValidator = (delay: number = 300) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let validationTimeoutId: NodeJS.Timeout | null = null;
  let currentEmail: string | null = null;
  let lastValidatedEmail: string | null = null;
  
  return (email: string, callback: (result: EmailValidationResult) => void) => {
    currentEmail = email;
    
    // Clear previous timeouts
    if (timeoutId) clearTimeout(timeoutId);
    if (validationTimeoutId) clearTimeout(validationTimeoutId);
    
    // Format check first
    if (!isValidEmailFormat(email)) {
      lastValidatedEmail = email;
      callback({
        isValid: false,
        error: 'Please provide a valid email address',
        isChecking: false
      });
      return;
    }
    
    // Check if we have a recent cached result first
    const cachedResult = validationCache.get(email);
    const shouldUseCachedResult = cachedResult && Date.now() - cachedResult.timestamp < CACHE_EXPIRY;
    
    if (shouldUseCachedResult) {
      lastValidatedEmail = email;
      const errorMessage = cachedResult.isValid ? undefined : 
        cachedResult.errorType === 'blacklisted' ? 'Please provide a different email address' : 'This email address is not valid';
      
      callback({
        isValid: cachedResult.isValid,
        error: errorMessage,
        isChecking: false
      });
      return;
    }
    
    // IMPORTANT: Do NOT clear cache for blacklisted emails
    // Only clear cache for completely new emails that haven't been validated
    // This prevents blacklisted emails from being revalidated
    if (lastValidatedEmail !== email) {
      const cachedForEmail = validationCache.get(email);
      // Only clear cache if email doesn't exist in cache OR if it was valid (not blacklisted)
      if (!cachedForEmail || cachedForEmail.isValid) {
        validationCache.delete(email);
        tokenCache.delete(email);
      }
    }
    
    lastValidatedEmail = email;
    
    // Set loading state
    callback({ isValid: false, isChecking: true });
    
    // Fallback timeout
    validationTimeoutId = setTimeout(() => {
      if (currentEmail === email) {
        callback({ isValid: true, isChecking: false });
      }
    }, 12000);
    
    // Debounced API call
    timeoutId = setTimeout(async () => {
      if (currentEmail !== email) return;
      
      try {
        const isAPIValid = await validateEmailWithAPI(email);
        
        if (currentEmail === email) {
          if (validationTimeoutId) {
            clearTimeout(validationTimeoutId);
            validationTimeoutId = null;
          }
          
          callback({
            isValid: isAPIValid,
            error: isAPIValid ? undefined : 'This email address is not valid',
            isChecking: false
          });
        }
      } catch (error) {
        if (currentEmail === email) {
          if (validationTimeoutId) {
            clearTimeout(validationTimeoutId);
            validationTimeoutId = null;
          }
          
          const { isValid, errorMessage } = handleValidationError(error);
          
          // Cache blacklisted and rate-limited results
          if (!isValid && error instanceof Error && 
              (error.message === 'BLACKLISTED_EMAIL' || error.message.includes('Rate limited'))) {
            const errorType = error.message === 'BLACKLISTED_EMAIL' ? 'blacklisted' : 'invalid';
            validationCache.set(email, { isValid: false, timestamp: Date.now(), errorType });
          }
          
          callback({ 
            isValid,
            isChecking: false,
            error: errorMessage
          });
        }
      }
    }, delay);
  };
};

// Comprehensive hook for form-based email validation
// This consolidates all the email validation logic from PersonalDetails.tsx
export const useFormEmailValidation = (
  currentEmail: string, 
  currentScreen: number, 
  targetScreen: number, 
  previousScreen: React.MutableRefObject<number>,
  initialValidation?: EmailValidationResult
) => {
  const [emailValidation, setEmailValidation] = React.useState<EmailValidationResult>(() => {
    // Initialize with existing validation result if available
    if (initialValidation) {
      return initialValidation;
    }
    return { isValid: false };
  });
  
  // Create debounced email validator with faster response
  const debouncedEmailValidator = React.useMemo(() => createDebouncedEmailValidator(300), []);
  
  // Effect to handle email validation on screen entry - only once when entering the screen
  React.useEffect(() => {
    // Only validate when first entering the email screen with an existing valid format email that hasn't been validated
    if (currentScreen === targetScreen && previousScreen.current !== targetScreen && currentEmail && 
        isValidEmailFormat(currentEmail) && !emailValidation.isValid) {
      debouncedEmailValidator(currentEmail, (result) => {
        setEmailValidation(result);
      });
    }
  }, [currentScreen, targetScreen, previousScreen, currentEmail, emailValidation.isValid, debouncedEmailValidator]);

  // Effect to handle stuck validation (fallback)
  React.useEffect(() => {
    if (currentScreen === targetScreen && emailValidation.isChecking) {
      const fallbackTimeout = setTimeout(() => {
        const fallbackResult = {
          isValid: true,
          isChecking: false,
          error: undefined
        };
        setEmailValidation(fallbackResult);
      }, 12000); // 12 second fallback

      return () => clearTimeout(fallbackTimeout);
    }
  }, [currentScreen, targetScreen, emailValidation.isChecking]);

  // Email change handler
  const handleEmailChange = React.useCallback((newEmail: string) => {
    // Only process if email actually changed
    if (newEmail !== currentEmail) {
      // Clear previous validation result when email changes
      const newEmailValidation = { isValid: false };
      setEmailValidation(newEmailValidation);
      
      // Trigger email validation when email changes
      if (newEmail && isValidEmailFormat(newEmail)) {
        debouncedEmailValidator(newEmail, (result) => {
          setEmailValidation(result);
        });
      } else {
        // If format is invalid, set immediate error
        const errorResult = {
          isValid: false,
          error: newEmail ? 'Please provide a valid email address' : undefined
        };
        setEmailValidation(errorResult);
      }
      
      return newEmailValidation;
    }
    return emailValidation;
  }, [currentEmail, emailValidation, debouncedEmailValidator]);

  // Validation state getters
  const hasInteracted = currentEmail !== undefined;
  const isValid = currentEmail && emailValidation.isValid && isValidEmailFormat(currentEmail);
  const isChecking = emailValidation.isChecking;
  const showError = hasInteracted && currentEmail !== '' && !isValid && !isChecking;
  const errorMessage = emailValidation.error || 'Please provide a valid email address';

  return {
    emailValidation,
    handleEmailChange,
    isValid,
    isChecking,
    showError,
    errorMessage,
    hasInteracted
  };
}; 