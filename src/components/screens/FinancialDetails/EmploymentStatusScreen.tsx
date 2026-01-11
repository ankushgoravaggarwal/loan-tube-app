import React from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface EmploymentStatusScreenProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: () => void;
  prevStep: () => void;
  selectedOptionStyle: React.CSSProperties;
  optionHoverStyle: React.CSSProperties;
  buttonIds: {
    backButtonId: string;
    nextButtonId: string;
  };
}

// Define employment status options
interface EmploymentOption {
  label: string;
  value: string;
}

const EmploymentStatusScreen: React.FC<EmploymentStatusScreenProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  selectedOptionStyle,
  optionHoverStyle,
  buttonIds
}) => {
  // Employment status options
  const employmentOptions: EmploymentOption[] = [
    { label: "Full time employed", value: "Employed-Full Time" },
    { label: "Part time employed", value: "Employed-Part Time" },
    { label: "Self employed", value: "Self-Employed" },
    { label: "Retired", value: "Retired" },
    { label: "Not employed", value: "Unemployed" }
  ];

  const handleEmploymentSelect = (option: EmploymentOption) => {
    setFormData({
      ...formData,
      employmentStatus: option.value
    });
    
    // Move to the next screen immediately after selection
    nextStep();
  };

  return (
    <div>
      <h2 className="form-title">
        What is your employment status?
      </h2>
      
      <div className="options-container">
        {employmentOptions.map((option, index) => (
          <button
            key={index}
            className={`option-button ${formData.employmentStatus === option.value ? 'selected' : ''}`}
            onClick={() => handleEmploymentSelect(option)}
            style={{
              ...(formData.employmentStatus === option.value ? selectedOptionStyle : {}),
              ...optionHoverStyle
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <NavigationButtons
        prevStep={prevStep}
        nextStep={nextStep}
        isNextDisabled={formData.employmentStatus === undefined}
        backButtonId={buttonIds.backButtonId}
        nextButtonId={buttonIds.nextButtonId}
      />
    </div>
  );
};

export default EmploymentStatusScreen; 