import React, { useState } from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface PropertyValueScreenProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: (overrideData?: Partial<FormData>) => void;
  prevStep: () => void;
  textColorStyle?: React.CSSProperties;
  inputFocusStyle?: React.CSSProperties;
  inputErrorStyle?: React.CSSProperties;
  errorMessageStyle?: React.CSSProperties;
  backButtonId?: string;
  nextButtonId?: string;
}

const PropertyValueScreen: React.FC<PropertyValueScreenProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  textColorStyle = {},
  inputFocusStyle = {},
  inputErrorStyle = {},
  errorMessageStyle = {},
  backButtonId,
  nextButtonId
}) => {
  const [propertyValueError, setPropertyValueError] = useState<string | null>(null);

  const handlePropertyValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers
    const value = e.target.value.replace(/[^0-9]/g, '');

    // Limit to 7 characters
    const limitedValue = value.slice(0, 7);

    // Validate input
    if (limitedValue && (parseInt(limitedValue) < 0 || parseInt(limitedValue) > 10000000)) {
      setPropertyValueError('Please enter a value between 0 and 10,000,000');
    } else {
      setPropertyValueError(null);
    }

    setFormData({
      ...formData,
      propertyValue: limitedValue
    });
  };

  const formatPropertyValue = (value: string) => {
    // Convert numeric string to formatted currency
    if (!value) return '';
    const numValue = parseInt(value);
    return numValue.toLocaleString('en-GB');
  };

  const isValidValue = formData.propertyValue && !propertyValueError;

  return (
    <div>
      <h2 className="form-title">
        What is the current value of your property?
      </h2>
      <p className="form-subtitle">
        Don't worry if you don't know the exact amount - just an estimate is fine.
      </p>

      <div className="input-container">
        <label className="input-label" style={textColorStyle}>
          Property Value
        </label>
        <div className="relative">
          <span className="input-prefix">£</span>
          <input
            type="text"
            value={formData.propertyValue ? formatPropertyValue(formData.propertyValue) : ''}
            onChange={handlePropertyValueChange}
            className={`input-field formatted-currency ${propertyValueError ? 'error' : ''}`}
            style={propertyValueError ? inputErrorStyle : {}}
            onFocus={(e) => propertyValueError && Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, propertyValueError ? inputErrorStyle : {})}
            inputMode="numeric"
            autoFocus={!formData.propertyValue || formData.propertyValue === ''}
          />
        </div>
        {propertyValueError && (
          <p className="error-message" style={errorMessageStyle}>{propertyValueError}</p>
        )}
      </div>

      <NavigationButtons
        prevStep={prevStep}
        nextStep={nextStep}
        isNextDisabled={!isValidValue}
        backButtonId={backButtonId}
        nextButtonId={nextButtonId}
      />
    </div>
  );
};

export default PropertyValueScreen; 