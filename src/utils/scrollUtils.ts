import { allowManualScroll } from '../components/keyboard/IOSKeyboardManager';

/**
 * Smart scrolling utility for multi-step forms based on screen context
 * 
 * @param currentStep - Current main step number
 * @param currentScreen - Current screen number within the step
 * @param specialScreens - Array of screen numbers that should have special scrolling behavior
 */
export const scrollToFormPosition = (
  currentStep: number,
  currentScreen: number,
  specialScreens: number[] = [2, 3, 4, 5] // Special screens (Name, DOB, Email, Phone)
): void => {
  // Notify IOSKeyboardManager that we're doing a manual scroll
  allowManualScroll();
  
  // Check if we're on screens that should have autofocus
  const shouldHaveAutofocus = 
    // PersonalDetails step (step 2) - Name, DOB, Email, Phone screens
    (currentStep === 2 && specialScreens.includes(currentScreen)) ||
    // ResidentialDetails step (step 3) - Postcode, Manual Address, Property Value, Previous Address screens
    (currentStep === 3 && [1, 3, 5, 6].includes(currentScreen)) ||
    // FinancialDetails step (step 4) - All input screens including bank details
    (currentStep === 4 && [2, 3, 4, 5, 6, 7].includes(currentScreen));
  
  // Check if current screen is one of the special screens that need custom positioning
  const isSpecialScreen = 
    // PersonalDetails step (step 2) - Name, DOB, Email, Phone screens
    (currentStep === 2 && specialScreens.includes(currentScreen)) ||
    // ResidentialDetails step (step 3) - Only screens with input fields
    (currentStep === 3 && [1, 3, 5, 6, 7].includes(currentScreen)) ||
    // FinancialDetails step (step 4) - Input screens excluding bank details (screens 4 and 7)
    (currentStep === 4 && [2, 3, 5, 6].includes(currentScreen));
    // ApplicationSubmission step (step 5) - Excluded entirely to scroll to top
    
  // Check if we're on a mobile device
  const isMobile = window.innerWidth <= 768 || 
                  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Use a short timeout to ensure DOM is updated before scrolling
  setTimeout(() => {
    // Only blur active elements if we're NOT on a screen that should have autofocus
    // This prevents interfering with autofocus functionality
    if (!shouldHaveAutofocus && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // Only apply special scrolling if on mobile AND this is one of the special screens
    if (isMobile && isSpecialScreen) {
      // Find the progress container element
      const progressContainer = document.querySelector('.progress-container');
      
      if (progressContainer) {
        // Calculate the position of the progress container relative to the viewport
        const rect = progressContainer.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Scroll to the progress container (with a small offset to position it nicely)
        const targetPosition = rect.top + scrollTop - 20; // 20px offset from the top
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // Additional scroll attempt with increasing delay for reliability
        setTimeout(() => {
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }, 50);
        
        // For iOS specifically
        const isMobileDevice = window.innerWidth <= 768 || 
                  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobileDevice) {
          // Force layout recalculation before scrolling on iOS
          document.body.getBoundingClientRect();
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          // Extra attempt for persistent scrolling on iOS
          setTimeout(() => {
            document.documentElement.scrollTop = targetPosition;
            document.body.scrollTop = targetPosition;
          }, 100);
        }
      } else {
        // Fallback to scrolling to top if progress container not found
        window.scrollTo(0, 0);
        setTimeout(() => window.scrollTo(0, 0), 50);
        
        // For iOS specifically
        const isMobileDevice = window.innerWidth <= 768 || 
                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobileDevice) {
          // Force layout recalculation before scrolling on iOS
          document.body.getBoundingClientRect();
          window.scrollTo(0, 0);
          
          // Extra attempt for persistent scrolling
          setTimeout(() => {
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
          }, 100);
        }
      }
    } else {
      // For desktop OR non-special screens, always scroll to top
      window.scrollTo(0, 0);
      
      // Additional scroll attempts with increasing delays
      setTimeout(() => window.scrollTo(0, 0), 50);
      
      // For iOS specifically
      const isMobileDevice = window.innerWidth <= 768 || 
                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobileDevice) {
        // Force layout recalculation before scrolling on iOS
        document.body.getBoundingClientRect();
        window.scrollTo(0, 0);
        
        // Extra attempt for persistent scrolling
        setTimeout(() => {
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }, 100);
      }
    }
  }, shouldHaveAutofocus ? 50 : 10); // Longer delay for autofocus screens to let them focus first
} 