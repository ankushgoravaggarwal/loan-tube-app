import { useState, useEffect, useMemo, useRef } from 'react';
import {
  LoanDetails,
  PersonalDetails,
  ResidentialDetails,
  FinancialDetails,
  ApplicationSubmission
} from './steps';
import { usePartner } from '../partner/PartnerContext';
import { useRecaptchaScreenLogger } from './RecaptchaScreenLogger';
import { FormData } from '../types/FormTypes';
import { handleNextStep, handlePrevStep } from '../utils/NavigationFunctions';

// Utility Hooks

function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// Main Component

const MultiStepForm = () => {
  
  // State Management
  
  const [currentStep, setCurrentStep] = useState(1);
  const [currentScreen, setCurrentScreen] = useState(1);
  
  // All form data with proper initial state
  const [formData, setFormData] = useState<FormData>({
    // Loan Details - Required fields
    loanAmount: '',
    loanTerm: '',
    loanPurpose: '',

    // Application fields
    is_new_immigrant: false
  });
  
  const prevFormData = usePrevious(formData);
  
  // External Hooks
  
  const { executeRecaptchaWithScreenName } = useRecaptchaScreenLogger();
  const { partner, isPartnerRoute } = usePartner();
  
  // URL Parameter Handling
  
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    
    const paramMapping: {[key: string]: string} = {
      'amount': 'loanAmount',
      'term': 'loanTerm',
      'purpose': 'loanPurpose',
      'first_name': 'firstName', 
      'last_name': 'lastName', 
      'email': 'email',
      'phone': 'mobile'
    };
    
    const updatedFormData = { ...formData };
    let hasUpdates = false;
    
    Object.entries(paramMapping).forEach(([paramName, fieldName]) => {
      const value = queryParams.get(paramName);
      if (value) {
        updatedFormData[fieldName] = value;
        hasUpdates = true;
      }
    });
    
    if (hasUpdates) {
      setFormData(updatedFormData);
    }
  }, []);
  
  // Navigation Functions
  
  const nextStep = async (overrideData?: Partial<FormData>) => {
    await handleNextStep({
      currentStep,
      currentScreen,
      formData,
      setCurrentStep,
      setCurrentScreen,
      setFormData,
      executeRecaptchaWithScreenName,
      getScreenCount
    }, overrideData);
  };

  const prevStep = async () => {
    await handlePrevStep({
      currentStep,
      currentScreen,
      formData,
      setCurrentStep,
      setCurrentScreen,
      setFormData,
      executeRecaptchaWithScreenName,
      getScreenCount
    });
  };
  
  // Auto-Navigation Effects
  
  useEffect(() => {
    // Auto-navigate when homeowner status changes
    if (
      currentStep === 3 &&
      currentScreen === 4 &&
      formData.homeownerStatus &&
      formData.homeownerStatus !== prevFormData?.homeownerStatus
    ) {
      nextStep();
    }
  }, [formData, prevFormData, currentStep, currentScreen]);
  
  // Helper Functions
  
  const getScreenCount = (step: number): number => {
    switch (step) {
      case 1: // Loan Details
        return formData.loanPurpose === 'car_purchase' ? 4 : 3;
      case 2: // Personal Details
        return 8;
      case 3: // Residential Details
        return 4;
      case 4: // Financial Details
        return formData.loanPurpose === 'business' ? 6 : 3;
      case 5: // Application Submission
        return 1;
      default:
        return 1;
    }
  };

  const calculateProgress = () => {
    const stepPercentages = {
      1: { start: 0, end: 20 },
      2: { start: 20, end: 40 },
      3: { start: 40, end: 60 },
      4: { start: 60, end: 80 },
      5: { start: 80, end: 100 }
    };
    
    if (currentStep === 5) {
      return 100;
    }
    
    const { start, end } = stepPercentages[currentStep as keyof typeof stepPercentages];
    const range = end - start;
    
    if (currentStep === 3) {
      // Special progress calculation for Residential Details
      const screenProgressMap: {[key: number]: number} = {
        1: 0,
        2: 0.33,
        3: 0.33,
        4: 0.67,
        5: 1.0
      };
      
      const screenProgress = screenProgressMap[currentScreen] || 0;
      return start + (range * screenProgress);
    } else {
      const totalScreens = getScreenCount(currentStep);
      const stepProgress = totalScreens > 1 
        ? (currentScreen - 1) / (totalScreens - 1) 
        : 1;
      
      return start + (range * stepProgress);
    }
  };

  const getCurrentStepName = () => {
    switch (currentStep) {
      case 1:
        return 'Loan Details';
      case 2:
        return 'Personal Details';
      case 3:
        return 'Residential Details';
      case 4:
        return 'Financial Details';
      case 5:
        return 'Application Submission';
      default:
        return 'Loan Details';
    }
  };
  
  // Styling
  
  const progressIndicatorStyle = useMemo(() => {
    const baseStyle = { width: `${calculateProgress()}%` };
    
    if (isPartnerRoute && partner?.primary_color) {
      return { 
        ...baseStyle,
        backgroundColor: partner.primary_color 
      };
    }
    
    return baseStyle;
  }, [isPartnerRoute, partner, calculateProgress, currentStep, currentScreen]);
  
  // Step Rendering
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <LoanDetails
            currentScreen={currentScreen}
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={currentScreen > 1 ? prevStep : undefined}
            setCurrentScreen={setCurrentScreen}
          />
        );
      case 2:
        return (
          <PersonalDetails
            currentScreen={currentScreen}
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <ResidentialDetails
            currentScreen={currentScreen}
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <FinancialDetails
            currentScreen={currentScreen}
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 5:
        return (
          <ApplicationSubmission
            formData={formData}
            setFormData={setFormData}
            prevStep={prevStep}
            previousComponent="FinancialDetails"
            setPreviousScreen={setCurrentScreen}
          />
        );
      default:
        return (
          <LoanDetails
            currentScreen={currentScreen}
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
          />
        );
    }
  };

  // Render

  return (
    <div className={`form-container ${currentStep === 2 && currentScreen === 6 ? 'otp-verification' : ''}`}>
      {/* Progress Indicator */}
      <div className="progress-container">
        <div className="progress-label">{getCurrentStepName()}</div>
        <div className="progress-bar">
          <div 
            className="progress-indicator" 
            style={progressIndicatorStyle}
          />
        </div>
      </div>
      
      {/* Current Step Content */}
      {renderStep()}
    </div>
  );
};

export default MultiStepForm; 