import React, { useState, useRef } from 'react';
import { NavigationButtons } from '../../ui';
import IOSKeyboardManager, { useIosFocus } from '../../keyboard/IOSKeyboardManager';
import { validateAndFormatDOB, handleDOBBackspace } from '../../../utils/DobValidation';
import { FormData } from '../../../types/FormTypes';

interface DateOfBirthScreenProps {
  currentScreen: number;
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

const DateOfBirthScreen: React.FC<DateOfBirthScreenProps> = ({
  currentScreen,
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
  const [displayDOB, setDisplayDOB] = useState(formData.displayDOB || '');
  const [validationError, setValidationError] = useState('');
  const dobInputRef = useRef<HTMLInputElement>(null);
  
  // iOS focus handling
  useIosFocus(dobInputRef, currentScreen === 3 && (!displayDOB || displayDOB === ''), 'tel');

  // Handle DOB input change
  const handleDOBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    let cursorPosition = e.target.selectionStart || 0;

    const { formattedDob, dateOfBirth, validationError: newValidationError, newCursorPosition } = validateAndFormatDOB(
      input,
      cursorPosition
    );
    
    setDisplayDOB(formattedDob);
    setValidationError(newValidationError);
    setFormData({ ...formData, dateOfBirth, displayDOB: formattedDob });

    // Automatically move cursor position after auto-formatting
    setTimeout(() => {
      const inputElement = dobInputRef.current;
      if (!inputElement) return; 
      
      inputElement.setSelectionRange(newCursorPosition || 0, newCursorPosition || 0);
    }, 0);
  };

  // Handle backspace key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleDOBBackspace(e, displayDOB, handleDOBChange);
  };

  const isValid = formData.dateOfBirth && !validationError;
  const hasInteracted = formData.displayDOB !== undefined;

  return (
    <div>
      <h2 className="form-title">
        Your date of birth
      </h2>
      <p className="form-subtitle">
        Please enter your date of birth. You must be at least 18 years old to apply.
      </p>
      
      <div className="input-container">
        <label className="input-label" style={textColorStyle}>
          Date of Birth
        </label>
        <div className="relative">
          <IOSKeyboardManager
            inputRef={dobInputRef}
            shouldFocus={!displayDOB || displayDOB === ''}
            inputType="tel"
          >
            <input
              ref={dobInputRef}
              type="tel"
              inputMode="numeric"
              value={displayDOB}
              onChange={handleDOBChange}
              onKeyDown={handleKeyDown}
              placeholder="DD / MM / YYYY"
              className={`input-field dob-input ${validationError && hasInteracted ? 'error' : ''}`}
              style={validationError && hasInteracted ? inputErrorStyle : {}}
              onFocus={(e) => (validationError && hasInteracted) && Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, validationError && hasInteracted ? inputErrorStyle : {})}
              maxLength={14}
              autoFocus={!displayDOB || displayDOB === ''}
              key={`dob-input-${currentScreen}`}
            />
          </IOSKeyboardManager>
        </div>
        {validationError && hasInteracted && (
          <p className="error-message" style={errorMessageStyle}>{validationError}</p>
        )}
      </div>

      <NavigationButtons
        prevStep={prevStep}
        nextStep={nextStep}
        isNextDisabled={!isValid}
        backButtonId={buttonIds.backButtonId}
        nextButtonId={buttonIds.nextButtonId}
      />
    </div>
  );
};

export default DateOfBirthScreen; 