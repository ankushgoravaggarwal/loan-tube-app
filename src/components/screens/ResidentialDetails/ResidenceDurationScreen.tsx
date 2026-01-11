import React from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface ResidenceDurationOption {
  label: string;
  value: number; // duration in months
}

interface ResidenceDurationScreenProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: (overrideData?: Partial<FormData>) => void;
  prevStep: () => void;
  selectedOptionStyle?: React.CSSProperties;
  optionHoverStyle?: React.CSSProperties;
  backButtonId?: string;
  nextButtonId?: string;
}

const ResidenceDurationScreen: React.FC<ResidenceDurationScreenProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  selectedOptionStyle = {},
  optionHoverStyle = {},
  backButtonId,
  nextButtonId
}) => {
  // Residence duration options
  const residenceDurationOptions: ResidenceDurationOption[] = [
    { label: "Less than 1 year", value: 12 },
    { label: "1 - 2 years", value: 24 },
    { label: "2 - 3 years", value: 36 },
    { label: "More than 3 years", value: 48 }
  ];

  const handleResidenceDurationSelect = (option: ResidenceDurationOption) => {
    setFormData({
      ...formData,
      residenceDuration: option.value
    });

    // Move to the next screen immediately after selection
    nextStep();
  };

  return (
    <div>
      <h2 className="form-title">
        How long have you lived at this address?
      </h2>

      <div className="options-container">
        {residenceDurationOptions.map((option, index) => (
          <button
            key={index}
            className={`option-button ${formData.residenceDuration === option.value ? 'selected' : ''}`}
            onClick={() => handleResidenceDurationSelect(option)}
            style={{
              ...(formData.residenceDuration === option.value ? selectedOptionStyle : {}),
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
        isNextDisabled={formData.residenceDuration === undefined}
        backButtonId={backButtonId}
        nextButtonId={nextButtonId}
      />
    </div>
  );
};

export default ResidenceDurationScreen; 