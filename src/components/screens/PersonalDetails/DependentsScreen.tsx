import React from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface DependentsScreenProps {
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

const DependentsScreen: React.FC<DependentsScreenProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  selectedOptionStyle,
  optionHoverStyle,
  buttonIds
}) => {
  const dependentOptions = [
    { display: "None", value: "0" },
    { display: "1", value: "1" },
    { display: "2", value: "2" },
    { display: "3 or more", value: "3" }
  ];
  
  const handleDependentSelect = (value: string) => {
    setFormData({ ...formData, dependents: value });
    nextStep();
  };

  return (
    <div>
      <h2 className="form-title">
        How many people depend on you financially?
      </h2>
      
      <div className="dependent-options-container">
        {dependentOptions.map((option) => (
          <button
            key={option.value}
            className={`dependent-option ${formData.dependents === option.value ? 'selected' : ''}`}
            onClick={() => handleDependentSelect(option.value)}
            style={{
              ...(formData.dependents === option.value ? selectedOptionStyle : {}),
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
        isNextDisabled={!formData.dependents}
        backButtonId={buttonIds.backButtonId}
        nextButtonId={buttonIds.nextButtonId}
      />
    </div>
  );
};

export default DependentsScreen; 