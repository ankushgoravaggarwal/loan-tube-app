import { FormData } from '../types/FormTypes';

// Navigation function parameters interface
export interface NavigationParams {
  currentStep: number;
  currentScreen: number;
  formData: FormData;
  setCurrentStep: (step: number) => void;
  setCurrentScreen: (screen: number) => void;
  setFormData: (data: FormData) => void;
  executeRecaptchaWithScreenName: (step: number, screen: number, action: "next" | "back", formData?: FormData) => Promise<{ score: number; token: string; }>;
  getScreenCount: (step: number) => number;
}

// Next step navigation logic
export const handleNextStep = async (
  params: NavigationParams,
  overrideData?: Partial<FormData>
): Promise<void> => {
  const {
    currentStep,
    currentScreen,
    formData,
    setCurrentStep,
    setCurrentScreen,
    setFormData,
    executeRecaptchaWithScreenName,
    getScreenCount
  } = params;

  const currentStepScreens = getScreenCount(currentStep);
  
  // Track navigation with reCAPTCHA
  try {
    const isOTPScreen = (currentStep === 2 && currentScreen === 6);
    
    if (isOTPScreen) {
      executeRecaptchaWithScreenName(currentStep, currentScreen, 'next', formData).catch(err => 
        console.error("Background reCAPTCHA check failed:", err)
      );
    } else {
      executeRecaptchaWithScreenName(currentStep, currentScreen, 'next', formData).catch(err => 
        console.error("Background reCAPTCHA check failed:", err)
      );
    }
  } catch (error) {
    console.error("Error executing enhanced reCAPTCHA:", error);
  }
  
  // Step 3: Residential Details - routing based on user choices
  if (currentStep === 3) {
    switch (currentScreen) {
      case 1: // Postcode lookup screen
        const useManualAddress = overrideData?.useManualAddress ?? formData.useManualAddress;
        const hasCompletedManualAddress = formData.useManualAddress && (formData.street1 || formData.houseName || formData.houseNumber);
        
        if (useManualAddress && !hasCompletedManualAddress) {
          setCurrentScreen(3); // Go to manual address screen
        } else {
          setCurrentScreen(2); // Go to residence duration
        }
        return;
        
      case 2: // Residence duration screen
        setCurrentScreen(4); // Go to homeowner screen
        return;
        
      case 3: // Manual address screen
        setCurrentScreen(2); // Go to residence duration
        return;
        
      case 4: // Homeowner status screen
        if (formData.homeownerStatus === "Furnished Tenant") {
          setFormData({
            ...formData,
            propertyValue: ''
          });
          
          const shouldShowPreviousAddress = formData.residenceDuration && formData.residenceDuration < 48;
          
          if (shouldShowPreviousAddress) {
            setCurrentScreen(6); // Show previous address screen
          } else {
            setCurrentStep(4);
            setCurrentScreen(1);
          }
        } else if (formData.homeownerStatus === "Home Owner (Mortgaged)" || formData.homeownerStatus === "Home Owner (Mortgage Free)") {
          setCurrentScreen(5); // Go to property value screen
        }
        return;
        
      case 5: // Property value screen
        setFormData({
          ...formData,
          comeBackToPropertyScreen: true
        });
        
        const shouldShowPreviousAddress = formData.residenceDuration && formData.residenceDuration < 48;
        
        if (shouldShowPreviousAddress) {
          setCurrentScreen(6); // Show previous address screen
        } else {
          setCurrentStep(4);
          setCurrentScreen(1);
        }
        return;
        
      case 6: // Previous address lookup screen
        const usePreviousManualAddress = overrideData?.previousUseManualAddress ?? formData.previousUseManualAddress;
        const isInternationalAddress = formData.previousCountry?.code !== "GB";
        
        if (usePreviousManualAddress && !isInternationalAddress) {
          setCurrentScreen(7); // Go to previous manual address screen (UK only)
        } else {
          setCurrentStep(4);
          setCurrentScreen(1);
        }
        return;
        
      case 7: // Previous manual address screen
        setCurrentStep(4);
        setCurrentScreen(1);
        return;
    }
  }
  
  // Step 4: Financial Details - Business vs Personal flow
  if (currentStep === 4) {
    const isBusinessFlow = formData.loanPurpose === 'business' && formData.employmentStatus === 'Self-Employed';
    
    switch (currentScreen) {
      case 1: // Employment status screen
        setCurrentScreen(2);
        return;
        
      case 2: // Business name OR Income screen
        setCurrentScreen(3);
        return;
        
      case 3: // Business type OR Housing payment screen
        setCurrentScreen(4);
        return;
        
      case 4: // Business revenue OR Bank details screen
        if (isBusinessFlow) {
          setCurrentScreen(5); // Continue with business flow
        } else {
          setCurrentStep(5);
          setCurrentScreen(1);
        }
        return;
        
      case 5: // Income screen (business flow only)
        setCurrentScreen(6);
        return;
        
      case 6: // Housing payment screen (business flow only)
        setCurrentScreen(7);
        return;
        
      case 7: // Bank details screen (business flow only)
        setCurrentStep(5);
        setCurrentScreen(1);
        return;
    }
  }
  
  // Default navigation logic for other steps
  if (currentScreen < currentStepScreens) {
    setCurrentScreen(currentScreen + 1);
  } else {
    setCurrentStep(currentStep + 1);
    setCurrentScreen(1);
  }
};

// Previous step navigation logic
export const handlePrevStep = async (params: NavigationParams): Promise<void> => {
  const {
    currentStep,
    currentScreen,
    formData,
    setCurrentStep,
    setCurrentScreen,
    executeRecaptchaWithScreenName,
    getScreenCount
  } = params;

  // Track back navigation with reCAPTCHA
  try {
    executeRecaptchaWithScreenName(currentStep, currentScreen, 'back', formData).catch(err => 
      console.error("Background reCAPTCHA check failed:", err)
    );
  } catch (error) {
    console.error("Error executing enhanced reCAPTCHA:", error);
  }
  
  // Step 3: Residential Details back navigation
  if (currentStep === 3) {
    switch (currentScreen) {
      case 1: // Go back to Personal Details
        setCurrentStep(2);
        setCurrentScreen(8);
        return;
        
      case 2: // Residence duration screen
        setCurrentScreen(formData.useManualAddress ? 3 : 1);
        return;
        
      case 3: // Manual address screen
        setCurrentScreen(1);
        return;
        
      case 4: // Homeowner status screen
        setCurrentScreen(2);
        return;
        
      case 5: // Property value screen
        setCurrentScreen(4);
        return;
        
      case 6: // Previous address lookup screen
        const isHomeowner = formData.homeownerStatus === "Home Owner (Mortgaged)" ||
                          formData.homeownerStatus === "Home Owner (Mortgage Free)";
        
        if (isHomeowner) {
          setCurrentScreen(5);
        } else {
          setCurrentScreen(4);
        }
        return;
        
      case 7: // Previous manual address screen
        setCurrentScreen(6);
        return;
    }
  }
  
  // Step 4: Financial Details back navigation
  if (currentStep === 4) {
    switch (currentScreen) {
      case 1: // Go back to Residential Details
        const hasLivedLessThanThreeYears = formData.residenceDuration && formData.residenceDuration < 48;
        
        setCurrentStep(3);
        
        if (hasLivedLessThanThreeYears) {
          setCurrentScreen(6);
        } else if ((formData.homeownerStatus === 'Home Owner (Mortgaged)' || formData.homeownerStatus === 'Home Owner (Mortgage Free)') && formData.propertyValue) {
          setCurrentScreen(5);
        } else if (formData.homeownerStatus) {
          setCurrentScreen(4);
        } else {
          setCurrentScreen(2);
        }
        return;
        
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        setCurrentScreen(currentScreen - 1);
        return;
    }
  }
  
  // Default back navigation for other steps
  if (currentScreen > 1) {
    setCurrentScreen(currentScreen - 1);
  } else {
    const prevStepScreens = getScreenCount(currentStep - 1);
    setCurrentStep(currentStep - 1);
    setCurrentScreen(prevStepScreens);
  }
}; 
