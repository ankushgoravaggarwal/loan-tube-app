import React from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface NameScreenProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: () => void;
  prevStep: () => void;
  textColorStyle: React.CSSProperties;
  inputErrorStyle: React.CSSProperties;
  inputFocusStyle: React.CSSProperties;
  errorMessageStyle: React.CSSProperties;
  buttonIds: {
    backButtonId: string;
    nextButtonId: string;
  };
}

const NameScreen: React.FC<NameScreenProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  textColorStyle,
  inputErrorStyle,
  inputFocusStyle,
  errorMessageStyle,
  buttonIds
}) => {
  // Validation regex for name fields (allows alphabets, space, hyphen, apostrophe, comma, dot)
  const nameRegex = /^[a-zA-Z\s\-',\.]*$/;

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || nameRegex.test(value)) {
      setFormData({ ...formData, firstName: value });
    }
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || nameRegex.test(value)) {
      setFormData({ ...formData, lastName: value });
    }
  };

  const isFirstNameValid = formData.firstName && formData.firstName.trim().length > 0;
  const isLastNameValid = formData.lastName && formData.lastName.trim().length > 0;
  const isFormValid = isFirstNameValid && isLastNameValid;

  const hasFirstNameInteracted = formData.firstName !== undefined;
  const hasLastNameInteracted = formData.lastName !== undefined;

  return (
    <div>
      <h2 className="form-title">
        What is your name?
      </h2>
      <p className="form-subtitle">
        As stated on your official ID. We need your name to verify your identity.
      </p>
      
      <div className="input-container">
        <label className="input-label" style={textColorStyle}>
          First Name
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.firstName || ''}
            onChange={handleFirstNameChange}
            placeholder="Enter your first name"
            className={`input-field first-name-input ${!isFirstNameValid && hasFirstNameInteracted ? 'error' : ''}`}
            style={!isFirstNameValid && hasFirstNameInteracted ? inputErrorStyle : {}}
            onFocus={(e) => (!isFirstNameValid && hasFirstNameInteracted) && Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, !isFirstNameValid && hasFirstNameInteracted ? inputErrorStyle : {})}
            autoFocus={!formData.firstName || formData.firstName === ''}
          />
        </div>
      </div>

      <div className="input-container-last-name">
        <label className="input-label" style={textColorStyle}>
          Last Name
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.lastName || ''}
            onChange={handleLastNameChange}
            placeholder="Enter your last name"
            className={`input-field last-name-input ${!isLastNameValid && hasLastNameInteracted ? 'error' : ''}`}
            style={!isLastNameValid && hasLastNameInteracted ? inputErrorStyle : {}}
            onFocus={(e) => (!isLastNameValid && hasLastNameInteracted) && Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, !isLastNameValid && hasLastNameInteracted ? inputErrorStyle : {})}
          />
        </div>
        {(!isFirstNameValid || !isLastNameValid) && (hasFirstNameInteracted || hasLastNameInteracted) && (
          <p className="error-message" style={errorMessageStyle}>Please type your full name</p>
        )}
      </div>

      <NavigationButtons
        prevStep={prevStep}
        nextStep={nextStep}
        isNextDisabled={!isFormValid}
        backButtonId={buttonIds.backButtonId}
        nextButtonId={buttonIds.nextButtonId}
      />
    </div>
  );
};

export default NameScreen; 