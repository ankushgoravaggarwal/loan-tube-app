import React from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface CarLoanPurposeScreenProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: () => void;
  prevStep?: () => void;
  selectedOptionStyle: React.CSSProperties;
  optionHoverStyle: React.CSSProperties;
  buttonIds: {
    backButtonId: string;
    nextButtonId: string;
  };
}

const CarLoanPurposeScreen: React.FC<CarLoanPurposeScreenProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  selectedOptionStyle,
  optionHoverStyle,
  buttonIds
}) => {
  // Check if we should be on this screen
  if (formData.loanPurpose !== 'car_purchase') {
    // If not car purchase, move to the next step
    setTimeout(() => {
      nextStep();
    }, 0);
    return null;
  }

  const carPurposeOptions = [
    { value: 'new_car', label: 'To buy a new car' },
    { value: 'used_car', label: 'To buy an old/second-hand car' },
    { value: 'repair_car', label: 'To repair/modify my existing car' },
    { value: 'other_car_purpose', label: 'For some other purpose' }
  ];

  const handleCarPurposeSelect = (carPurposeValue: string) => {
    setFormData({ ...formData, carLoanPurpose: carPurposeValue });
    nextStep();
  };

  return (
    <div>
      <h2 className="form-title">
        What do you need this car loan for?
      </h2>
      
      <p className="car-purpose-subtitle">
        Please select the specific purpose for your car loan
      </p>
      
      <div className="car-purpose-options-container">
        {carPurposeOptions.map((option) => (
          <div key={option.value} className="car-purpose-button-container">
            <button
              className={`car-purpose-option ${formData.carLoanPurpose === option.value ? 'selected' : ''}`}
              onClick={() => handleCarPurposeSelect(option.value)}
              style={{
                ...(formData.carLoanPurpose === option.value ? selectedOptionStyle : {}),
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
        isNextDisabled={!formData.carLoanPurpose}
        backButtonText="Back"
        nextButtonText="Next"
        backButtonId={buttonIds.backButtonId}
        nextButtonId={buttonIds.nextButtonId}
      />
    </div>
  );
};

export default CarLoanPurposeScreen; 