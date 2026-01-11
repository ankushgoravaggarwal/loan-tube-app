import React, { useEffect, useRef } from 'react';

interface IOSKeyboardManagerProps {
  inputRef: React.RefObject<HTMLInputElement>;
  shouldFocus: boolean;
  inputType: string; // 'tel', 'email', 'text', etc.
  children: React.ReactNode;
}

// Global flag to temporarily disable scroll preservation
let manualScrollInProgress = false;

// Helper to allow manual scrolling without interference
export const allowManualScroll = () => {
  manualScrollInProgress = true;
  setTimeout(() => {
    manualScrollInProgress = false;
  }, 300); // Reset after a reasonable time
};

/**
 * Component that handles iOS keyboard focus issues
 * Ensures that the correct keyboard type appears and resolves iOS-specific focus problems
 * Prevents screen jumping and flickering when fields are manipulated
 */
const IOSKeyboardManager: React.FC<IOSKeyboardManagerProps> = ({
  inputRef,
  shouldFocus,
  inputType,
  children
}) => {
  // Track if we've already focused and current position
  const hasFocusedRef = useRef(false);
  const scrollPositionRef = useRef(0);
  
  // Main focus effect
  useEffect(() => {
    // Reset focus tracking when shouldFocus changes to false
    if (!shouldFocus) {
      hasFocusedRef.current = false;
      return;
    }
    
    // Skip if already focused or if input doesn't exist
    if (hasFocusedRef.current || !inputRef.current) return;
    
    // Check if we're on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Save scroll position
    scrollPositionRef.current = window.scrollY;
    
    if (isIOS) {
      const input = inputRef.current;
      if (!input) return;
      
      // Disable transitions to prevent flickering
      document.body.style.transition = 'none';
      
      // Blur any active element
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      
      // Create temporary hidden input
      const tempInput = document.createElement('input');
      tempInput.type = inputType;
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      tempInput.style.height = '0';
      tempInput.style.fontSize = '16px';
      tempInput.style.pointerEvents = 'none';
      tempInput.setAttribute('autocomplete', 'off');
      tempInput.setAttribute('spellcheck', 'false');
      
      // Add to DOM near the real input if possible
      (input.parentNode || document.body).appendChild(tempInput);
      
      // Focus temp input
      tempInput.focus();
      window.scrollTo(0, scrollPositionRef.current);
      
      // After a short delay, focus the real input
      requestAnimationFrame(() => {
        setTimeout(() => {
          tempInput.blur();
          if (tempInput.parentNode) tempInput.parentNode.removeChild(tempInput);
          
          // Focus real input
          input.focus();
          hasFocusedRef.current = true;
          window.scrollTo(0, scrollPositionRef.current);
          
          // Re-enable transitions
          setTimeout(() => {
            document.body.style.transition = '';
          }, 50);
        }, 50);
      });
    } else {
      // Non-iOS platforms
      const input = inputRef.current;
      if (input) {
        requestAnimationFrame(() => {
          input.focus();
          hasFocusedRef.current = true;
        });
      }
    }
  }, [inputRef, shouldFocus, inputType]);

  // Prevent input-related flickering
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    
    // Check if we're on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!isIOS) return;
    
    // Save initial scroll position
    scrollPositionRef.current = window.scrollY;
    
    // Create event handlers
    const handleEvents = {
      // Save position on focus or before input
      focus: () => { 
        if (!manualScrollInProgress) {
          scrollPositionRef.current = window.scrollY; 
        }
      },
      beforeinput: () => { 
        if (!manualScrollInProgress) {
          scrollPositionRef.current = window.scrollY; 
        }
      },
      
      // Restore position on blur
      blur: () => { 
        if (!manualScrollInProgress) {
          window.scrollTo(0, scrollPositionRef.current); 
        }
      },
      
      // Handle input events, especially empty field case
      input: (e: Event) => {
        if (!manualScrollInProgress) {
          window.scrollTo(0, scrollPositionRef.current);
          if (!e.target || !(e.target as HTMLInputElement).value) {
            requestAnimationFrame(() => {
              if (!manualScrollInProgress) {
                window.scrollTo(0, scrollPositionRef.current);
              }
            });
          }
        }
      }
    };
    
    // Add all event listeners
    Object.entries(handleEvents).forEach(([event, handler]) => {
      input.addEventListener(event, handler);
    });
    
    // Clean up
    return () => {
      Object.entries(handleEvents).forEach(([event, handler]) => {
        input.removeEventListener(event, handler);
      });
    };
  }, [inputRef]);

  // Render children
  return <>{children}</>;
};

// Hook version for more flexible usage
export const useIosFocus = (
  inputRef: React.RefObject<HTMLInputElement>, 
  shouldFocus: boolean, 
  inputType: string
) => {
  // Track if we've already focused and current position
  const hasFocusedRef = useRef(false);
  const scrollPositionRef = useRef(0);
  
  // Main focus effect
  useEffect(() => {
    // Reset focus tracking when shouldFocus changes to false
    if (!shouldFocus) {
      hasFocusedRef.current = false;
      return;
    }
    
    // Skip if already focused or if input doesn't exist
    if (hasFocusedRef.current || !inputRef.current) return;
    
    // Check if we're on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Save scroll position
    scrollPositionRef.current = window.scrollY;
    
    if (isIOS) {
      const input = inputRef.current;
      if (!input) return;
      
      // Disable transitions to prevent flickering
      document.body.style.transition = 'none';
      
      // Blur any active element
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      
      // Create temporary hidden input
      const tempInput = document.createElement('input');
      tempInput.type = inputType;
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      tempInput.style.height = '0';
      tempInput.style.fontSize = '16px';
      tempInput.style.pointerEvents = 'none';
      tempInput.setAttribute('autocomplete', 'off');
      tempInput.setAttribute('spellcheck', 'false');
      
      // Add to DOM near the real input if possible
      (input.parentNode || document.body).appendChild(tempInput);
      
      // Focus temp input
      tempInput.focus();
      window.scrollTo(0, scrollPositionRef.current);
      
      // After a short delay, focus the real input
      requestAnimationFrame(() => {
        setTimeout(() => {
          tempInput.blur();
          if (tempInput.parentNode) tempInput.parentNode.removeChild(tempInput);
          
          // Focus real input
          input.focus();
          hasFocusedRef.current = true;
          window.scrollTo(0, scrollPositionRef.current);
          
          // Re-enable transitions
          setTimeout(() => {
            document.body.style.transition = '';
          }, 50);
        }, 50);
      });
    } else {
      // Non-iOS platforms
      const input = inputRef.current;
      if (input) {
        requestAnimationFrame(() => {
          input.focus();
          hasFocusedRef.current = true;
        });
      }
    }
  }, [inputRef, shouldFocus, inputType]);

  // Prevent input-related flickering
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    
    // Check if we're on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!isIOS) return;
    
    // Save initial scroll position
    scrollPositionRef.current = window.scrollY;
    
    // Create event handlers
    const handleEvents = {
      // Save position on focus or before input
      focus: () => { 
        if (!manualScrollInProgress) {
          scrollPositionRef.current = window.scrollY; 
        }
      },
      beforeinput: () => { 
        if (!manualScrollInProgress) {
          scrollPositionRef.current = window.scrollY; 
        }
      },
      
      // Restore position on blur
      blur: () => { 
        if (!manualScrollInProgress) {
          window.scrollTo(0, scrollPositionRef.current); 
        }
      },
      
      // Handle input events, especially empty field case
      input: (e: Event) => {
        if (!manualScrollInProgress) {
          window.scrollTo(0, scrollPositionRef.current);
          if (!e.target || !(e.target as HTMLInputElement).value) {
            requestAnimationFrame(() => {
              if (!manualScrollInProgress) {
                window.scrollTo(0, scrollPositionRef.current);
              }
            });
          }
        }
      }
    };
    
    // Add all event listeners
    Object.entries(handleEvents).forEach(([event, handler]) => {
      input.addEventListener(event, handler);
    });
    
    // Clean up
    return () => {
      Object.entries(handleEvents).forEach(([event, handler]) => {
        input.removeEventListener(event, handler);
      });
    };
  }, [inputRef]);
};

export default IOSKeyboardManager; 