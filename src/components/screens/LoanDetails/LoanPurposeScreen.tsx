import React from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface LoanPurposeScreenProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: () => void;
  prevStep?: () => void;
  setCurrentScreen?: (screen: number) => void;
  selectedOptionStyle: React.CSSProperties;
  optionHoverStyle: React.CSSProperties;
  buttonIds: {
    backButtonId: string;
    nextButtonId: string;
  };
}

const LoanPurposeScreen: React.FC<LoanPurposeScreenProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  setCurrentScreen,
  selectedOptionStyle,
  optionHoverStyle,
  buttonIds
}) => {
  const purposeOptions = [
    { value: 'home_improvement', label: 'Home Improvement' },
    { value: 'debt_consolidation', label: 'Debt Consolidation' },
    { value: 'car_purchase', label: 'Car Purchase' },
    { value: 'holiday', label: 'Holiday' },
    { value: 'wedding', label: 'Wedding' },
    { value: 'business', label: 'Business' },
    { value: 'other', label: 'Other Purposes' }
  ];

  const handlePurposeSelect = (purposeValue: string) => {
    // If changing from car purchase to something else, clear the car loan purpose
    if (formData.loanPurpose === 'car_purchase' && purposeValue !== 'car_purchase') {
      setFormData({ 
        ...formData, 
        loanPurpose: purposeValue,
        carLoanPurpose: undefined 
      });
    } else {
      setFormData({ ...formData, loanPurpose: purposeValue });
    }
    
    // If car purchase is selected, go to car loan purpose screen
    if (purposeValue === 'car_purchase') {
      // Move to the car loan purpose screen (screen 4)
      setCurrentScreen && setCurrentScreen(4);
    } else {
      // For all other purposes, proceed to next step (Personal Details)
      nextStep();
    }
  };

  return (
    <div>
      <h2 className="form-title">
        What do you need this loan for?
      </h2>
      
      <div className="purpose-options-container">
        {purposeOptions.map((option) => (
          <div key={option.value} className="purpose-button-container">
            <button
              className={`purpose-option ${formData.loanPurpose === option.value ? 'selected' : ''}`}
              onClick={() => handlePurposeSelect(option.value)}
              style={{
                ...(formData.loanPurpose === option.value ? selectedOptionStyle : {}),
                ...optionHoverStyle
              }}
            >
              {option.label}
            </button>
          </div>
        ))}
      </div>

      <NavigationButtons
        prevStep={prevStep}
        nextStep={nextStep}
        isNextDisabled={!formData.loanPurpose}
        backButtonId={buttonIds.backButtonId}
        nextButtonId={buttonIds.nextButtonId}
      />
    </div>
  );
};

export default LoanPurposeScreen; 