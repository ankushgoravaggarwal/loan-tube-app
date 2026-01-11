import React from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface LoanTermScreenProps {
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

const LoanTermScreen: React.FC<LoanTermScreenProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  selectedOptionStyle,
  optionHoverStyle,
  buttonIds
}) => {
  // Short-term options (months)
  const shortTermOptions = [
    { value: '3_months', label: '3 months' },
    { value: '6_months', label: '6 months' },
    { value: '9_months', label: '9 months' },
    { value: '12_months', label: '12 months' },
    { value: '18_months', label: '18 months' }
  ];

  // Medium-term options (2-7 years)
  const mediumTermOptions = [
    { value: '2_years', label: '2 years' },
    { value: '3_years', label: '3 years' },
    { value: '4_years', label: '4 years' },
    { value: '5_years', label: '5 years' },
    { value: '6_years', label: '6 years' },
    { value: '7_years', label: '7 years' }
  ];
  
  // Long-term options (8+ years)
  const longTermOptions = [
    { value: '8_years', label: '8 years' },
    { value: '10_years', label: '10 years' },
    { value: '12_years', label: '12 years' },
    { value: '15_years', label: '15 years' },
    { value: '20_years', label: '20 years' }
  ];

  // Combine all options for display
  const allTermOptions = [...shortTermOptions, ...mediumTermOptions, ...longTermOptions];

  const handleTermSelect = (termValue: string) => {
    setFormData({ ...formData, loanTerm: termValue });
    nextStep();
  };

  return (
    <div>
      <h2 className="form-title">
        How long do you want to borrow this loan for?
      </h2>
      
      <div className="term-options-grid">
        {allTermOptions.map((option) => (
          <button
            key={option.value}
            className={`term-option ${formData.loanTerm === option.value ? 'selected' : ''}`}
            onClick={() => handleTermSelect(option.value)}
            style={{
              ...(formData.loanTerm === option.value ? selectedOptionStyle : {}),
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
        isNextDisabled={!formData.loanTerm}
        backButtonId={buttonIds.backButtonId}
        nextButtonId={buttonIds.nextButtonId}
      />
    </div>
  );
};

export default LoanTermScreen; 