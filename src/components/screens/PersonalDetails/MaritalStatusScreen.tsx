import React from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface MaritalStatusScreenProps {
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

const MaritalStatusScreen: React.FC<MaritalStatusScreenProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  selectedOptionStyle,
  optionHoverStyle,
  buttonIds
}) => {
  const maritalOptions = [
    { display: "Single", value: "Single" },
    { display: "Married / Civil partnership", value: "Married" },
    { display: "Living with partner", value: "Living With Partner" },
    { display: "Divorced / Separated", value: "Divorced" },
    { display: "Widowed", value: "Widowed" }
  ];
  
  const handleMaritalSelect = (value: string) => {
    setFormData({ ...formData, maritalStatus: value });
    nextStep();
  };

  return (
    <div>
      <h2 className="form-title">
        What is your marital status?
      </h2>
      
      <div className="marital-options-container">
        {maritalOptions.map((option) => (
          <button
            key={option.value}
            className={`marital-option ${formData.maritalStatus === option.value ? 'selected' : ''}`}
            onClick={() => handleMaritalSelect(option.value)}
            style={{
              ...(formData.maritalStatus === option.value ? selectedOptionStyle : {}),
              ...optionHoverStyle
            }}
          >
            {option.display}
          </button>
        ))}
      </div>

      <NavigationButtons
        prevStep={prevStep}
        nextStep={nextStep}
        isNextDisabled={!formData.maritalStatus}
        backButtonId={buttonIds.backButtonId}
        nextButtonId={buttonIds.nextButtonId}
      />
    </div>
  );
};

export default MaritalStatusScreen; 