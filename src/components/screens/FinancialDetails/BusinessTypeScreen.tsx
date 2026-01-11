import React from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface BusinessTypeScreenProps {
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

// Define business type options
interface BusinessTypeOption {
  label: string;
  value: string;
}

const BusinessTypeScreen: React.FC<BusinessTypeScreenProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  selectedOptionStyle,
  optionHoverStyle,
  buttonIds
}) => {
  // Business type options
  const businessTypeOptions: BusinessTypeOption[] = [
    { label: "Sole Trader", value: "sole_trader" },
    { label: "Limited Company", value: "limited_company" },
    { label: "Partnership", value: "partnership" }
  ];

  // Handle business type selection
  const handleBusinessTypeSelect = (option: BusinessTypeOption) => {
    setFormData({
      ...formData,
      businessType: option.value
    });
    
    // Move to the next screen immediately after selection
    nextStep();
  };

  return (
    <div>
      <h2 className="form-title">
        What is your business/trade type?
      </h2>
      
      <div className="options-container">
        {businessTypeOptions.map((option, index) => (
          <button
            key={index}
            className={`business-type-option ${formData.businessType === option.value ? 'selected' : ''}`}
            onClick={() => handleBusinessTypeSelect(option)}
            style={{
              ...(formData.businessType === option.value ? selectedOptionStyle : {}),
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
        isNextDisabled={formData.businessType === undefined}
        backButtonId={buttonIds.backButtonId}
        nextButtonId={buttonIds.nextButtonId}
      />
    </div>
  );
};

export default BusinessTypeScreen; 