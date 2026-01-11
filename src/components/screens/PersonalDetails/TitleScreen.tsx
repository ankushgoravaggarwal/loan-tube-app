import React from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface TitleScreenProps {
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

const TitleScreen: React.FC<TitleScreenProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  selectedOptionStyle,
  optionHoverStyle,
  buttonIds
}) => {
  const titles = ["Mr", "Mrs", "Miss", "Ms", "Dr", "Prof", "Mx", "Other"];
  
  const handleTitleSelect = (title: string) => {
    setFormData({ ...formData, title });
    nextStep();
  };

  return (
    <div>
      <h2 className="form-title">
        What is your title?
      </h2>
      
      <div className="title-options-container">
        {titles.map((title) => (
          <button
            key={title}
            className={`title-option ${formData.title === title ? 'selected' : ''}`}
            onClick={() => handleTitleSelect(title)}
            style={{
              ...(formData.title === title ? selectedOptionStyle : {}),
              ...optionHoverStyle
            }}
          >
            {title}
          </button>
        ))}
      </div>

      <NavigationButtons
        prevStep={prevStep}
        nextStep={nextStep}
        isNextDisabled={!formData.title}
        backButtonId={buttonIds.backButtonId}
        nextButtonId={buttonIds.nextButtonId}
      />
    </div>
  );
};

export default TitleScreen; 