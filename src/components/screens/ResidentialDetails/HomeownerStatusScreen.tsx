import React from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface HomeownerOption {
  label: string;
  value: string;
}

interface HomeownerStatusScreenProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: (overrideData?: Partial<FormData>) => void;
  prevStep: () => void;
  selectedOptionStyle?: React.CSSProperties;
  optionHoverStyle?: React.CSSProperties;
  backButtonId?: string;
  nextButtonId?: string;
}

const HomeownerStatusScreen: React.FC<HomeownerStatusScreenProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  selectedOptionStyle = {},
  optionHoverStyle = {},
  backButtonId,
  nextButtonId
}) => {
  // Homeowner status options
  const homeownerOptions: HomeownerOption[] = [
    { label: "Yes, with a mortgage", value: "Home Owner (Mortgaged)" },
    { label: "Yes, without a mortgage", value: "Home Owner (Mortgage Free)" },
    { label: "No", value: "Furnished Tenant" }
  ];

  const handleHomeownerSelect = (option: HomeownerOption) => {
    // Map the selected value to the value expected by FinancialDetails component
    const homeownerType = option.value === "Home Owner (Mortgaged)" ? 'mortgage' : 
                          option.value === "Home Owner (Mortgage Free)" ? 'outright' : null;

    setFormData({
      ...formData,
      homeownerStatus: option.value,
      ...(homeownerType && { homeownerType }) // Add this for backward compatibility
    } as FormData);

    // All navigation logic is now handled in MultiStepForm
  };

  return (
    <div>
      <h2 className="form-title">
        Are you a homeowner?
      </h2>

      <div className="options-container">
        {homeownerOptions.map((option, index) => (
          <button
            key={index}
            className={`option-button ${formData.homeownerStatus === option.value ? 'selected' : ''}`}
            onClick={() => handleHomeownerSelect(option)}
            style={{
              ...(formData.homeownerStatus === option.value ? selectedOptionStyle : {}),
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
        isNextDisabled={formData.homeownerStatus === undefined}
        backButtonId={backButtonId}
        nextButtonId={nextButtonId}
      />
    </div>
  );
};

export default HomeownerStatusScreen; 