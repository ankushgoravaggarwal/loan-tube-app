import React from 'react';
import { NavigationButtons } from '../../ui';
import { FormData } from '../../../types/FormTypes';

interface ManualAddressScreenProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: (overrideData?: Partial<FormData>) => void;
  prevStep: () => void;
  textColorStyle?: React.CSSProperties;
  backButtonId?: string;
  nextButtonId?: string;
}

const ManualAddressScreen: React.FC<ManualAddressScreenProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  textColorStyle = {},
  backButtonId,
  nextButtonId
}) => {
  const handleManualAddressChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
      useManualAddress: true
    });
  };

  // Check if at least one identifier is filled
  const hasIdentifier = () => {
    return (formData.houseNumber?.trim()?.length > 0) ||
           (formData.houseName?.trim()?.length > 0) ||
           (formData.flatNumber?.trim()?.length > 0);
  };

  // Check if all required fields are filled
  const isValidForm = () => {
    // At least one of the identifiers must be filled
    const hasValidIdentifier = hasIdentifier();

    // Street and City are mandatory
    const hasRequiredFields =
      formData.street?.trim()?.length > 0 &&
      formData.city?.trim()?.length > 0;

    return hasValidIdentifier && hasRequiredFields;
  };

  // Check if we should show error
  const shouldShowError = () => {
    // Show error if user has interacted with the form but not met all requirements
    const interacted = formData.houseNumber !== undefined ||
                       formData.houseName !== undefined ||
                       formData.flatNumber !== undefined ||
                       formData.street !== undefined ||
                       formData.city !== undefined ||
                       formData.county !== undefined;

    // Missing required fields
    const missingFields = !hasIdentifier() ||
                        !(formData.street?.trim()?.length > 0) ||
                        !(formData.city?.trim()?.length > 0);

    return interacted && missingFields;
  };

  // Handle back navigation - clear manual address flag if no valid data
  const handleBackFromManual = () => {
    if (!isValidForm()) {
      // Clear manual address data and flag if form is not valid
      setFormData({
        ...formData,
        useManualAddress: false,
        houseNumber: '',
        houseName: '',
        flatNumber: '',
        street: '',
        city: '',
        county: ''
      });
    }
    prevStep();
  };

  return (
    <div>
      <h2 className="form-title">
        What is your residential address?
      </h2>

      <div className="postcode-field-container">
        <label className="postcode-label" style={textColorStyle}>Postcode</label>
        <input
          type="text"
          value={formData.postcode || ''}
          readOnly
          className="postcode-input-field"
        />
      </div>

      <div className="manual-address-grid">
        <div>
          <input
            type="text"
            value={formData.houseNumber || ''}
            onChange={(e) => handleManualAddressChange('houseNumber', e.target.value)}
            className="manual-address-input"
            placeholder="House Number"
            autoFocus={!formData.houseNumber || formData.houseNumber === ''}
          />
        </div>

        <div>
          <input
            type="text"
            value={formData.houseName || ''}
            onChange={(e) => handleManualAddressChange('houseName', e.target.value)}
            className="manual-address-input"
            placeholder="House Name"
          />
        </div>

        <div>
          <input
            type="text"
            value={formData.flatNumber || ''}
            onChange={(e) => handleManualAddressChange('flatNumber', e.target.value)}
            className="manual-address-input"
            placeholder="Flat Number"
          />
        </div>
      </div>

      <div className="manual-address-grid">
        <div className="manual-address-full">
          <input
            type="text"
            value={formData.street || ''}
            onChange={(e) => handleManualAddressChange('street', e.target.value)}
            className="manual-address-input"
            placeholder="Street"
          />
        </div>

        <div className="manual-address-full">
          <input
            type="text"
            value={formData.city || ''}
            onChange={(e) => handleManualAddressChange('city', e.target.value)}
            className="manual-address-input"
            placeholder="City"
          />
        </div>

        <div className="manual-address-full">
          <input
            type="text"
            value={formData.county || ''}
            onChange={(e) => handleManualAddressChange('county', e.target.value)}
            className="manual-address-input"
            placeholder="County"
          />
        </div>
      </div>

      {/* Error message at bottom to prevent screen shift */}
      <div className="error-container-bottom">
        {shouldShowError() && (
          <div className="address-error-bottom">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            Please supply full address
          </div>
        )}
      </div>

      <NavigationButtons
        prevStep={handleBackFromManual}
        nextStep={nextStep}
        isNextDisabled={!isValidForm()}
        backButtonId={backButtonId}
        nextButtonId={nextButtonId}
      />
    </div>
  );
};

export default ManualAddressScreen; 