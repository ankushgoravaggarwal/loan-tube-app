import React, { useState, useEffect, useMemo } from 'react';
import { NavigationButtons, CountrySelector, Country } from '../../ui';
import OtherCountryManualAddress from './OtherCountryManualAddress';
import { FormData } from '../../../types/FormTypes';
import { Partner } from '../../../partner/partnerService';

interface PreviousManualAddressScreenProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextScreen: () => void;
  prevStep: () => void;
  textColorStyle?: React.CSSProperties;
  isPartnerRoute?: boolean;
  partner?: Partner;
  selectedOptionStyle?: React.CSSProperties;
  optionHoverStyle?: React.CSSProperties;
  backButtonId?: string;
  nextButtonId?: string;
}

const PreviousManualAddressScreen: React.FC<PreviousManualAddressScreenProps> = ({
  formData,
  setFormData,
  nextScreen,
  prevStep,
  textColorStyle,
  isPartnerRoute,
  partner,
  optionHoverStyle,
  backButtonId,
  nextButtonId
}) => {
  const [showCountrySelector, setShowCountrySelector] = useState<boolean>(false);
  const [shouldAutoFocus, setShouldAutoFocus] = useState<boolean>(false);

  // Default country - UK
  const defaultCountry: Country = {
    name: "United Kingdom",
    code: "GB",
    flag: "gb"
  };

  // Check if the selected country is UK
  const isUK = formData.previousCountry?.code === "GB";

  // Effect to manage autofocus based on field state
  useEffect(() => {
    const hasHouseNumber = isUK ? 
      (formData.previousHouseNumber && formData.previousHouseNumber.trim().length > 0) :
      (formData.previousinternationaladdressHouseNumber && formData.previousinternationaladdressHouseNumber.trim().length > 0);
    
    const hasHouseName = isUK ?
      (formData.previousHouseName && formData.previousHouseName.trim().length > 0) :
      (formData.previousinternationaladdressHouseName && formData.previousinternationaladdressHouseName.trim().length > 0);
    
    const hasFlatNumber = isUK ?
      (formData.previousFlatNumber && formData.previousFlatNumber.trim().length > 0) :
      (formData.previousinternationaladdressFlatNumber && formData.previousinternationaladdressFlatNumber.trim().length > 0);
    
    const hasAnyIdentifier = hasHouseNumber || hasHouseName || hasFlatNumber;
    
    // Only enable autofocus if NO identifier fields are filled
    if (!hasAnyIdentifier) {
      setShouldAutoFocus(true);
    } else {
      setShouldAutoFocus(false);
    }
  }, [
    formData.previousHouseNumber, 
    formData.previousHouseName, 
    formData.previousFlatNumber,
    formData.previousinternationaladdressHouseNumber,
    formData.previousinternationaladdressHouseName,
    formData.previousinternationaladdressFlatNumber,
    isUK
  ]);

  const handleManualAddressChange = (field: string, value: string) => {
    if (isUK) {
      setFormData({
        ...formData,
        [`previous${field.charAt(0).toUpperCase() + field.slice(1)}`]: value,
        previousUseManualAddress: true
      });
    } else {
      // For international addresses, use the international prefix
      setFormData({
        ...formData,
        [`previousinternationaladdress${field.charAt(0).toUpperCase() + field.slice(1)}`]: value,
        previousUseManualAddress: true
      });
    }
  };

  // Check if at least one identifier is filled
  const hasIdentifier = () => {
    if (isUK) {
      return (formData.previousHouseNumber?.trim()?.length > 0) ||
            (formData.previousHouseName?.trim()?.length > 0) ||
            (formData.previousFlatNumber?.trim()?.length > 0);
    } else {
      return (formData.previousinternationaladdressHouseNumber?.trim()?.length > 0) ||
            (formData.previousinternationaladdressHouseName?.trim()?.length > 0) ||
            (formData.previousinternationaladdressFlatNumber?.trim()?.length > 0);
    }
  };

  // Check if all required fields are filled
  const isValidForm = () => {
    if (isUK) {
      // At least one of the identifiers must be filled
      const hasValidIdentifier = hasIdentifier();

      // Street and City are mandatory for UK
      const hasRequiredFields = 
        formData.previousStreet?.trim()?.length > 0 &&
        formData.previousCity?.trim()?.length > 0;

      return hasValidIdentifier && hasRequiredFields;
    } else {
      // For international addresses, use the validation from OtherCountryManualAddress
      const isPostcodeValid = formData.previousinternationaladdressPostcode?.trim()?.length > 0;
      const isAddressLine1Valid = formData.previousinternationaladdressAddressLine1?.trim()?.length > 0;
      const isCityValid = formData.previousinternationaladdressCity?.trim()?.length > 0;
      const isStateValid = formData.previousinternationaladdressState?.trim()?.length > 0;
      const isCityOrStateValid = isCityValid || isStateValid;
      
      // Check if form has the isAddressValid flag set by the child component
      if (formData.isAddressValid !== undefined) {
        return formData.isAddressValid;
      }
      
      // Otherwise perform our own validation
      return isPostcodeValid && isAddressLine1Valid && isCityOrStateValid;
    }
  };

  // Check if we should show error
  const shouldShowError = () => {
    if (isUK) {
      let interacted = false;
      let missingFields = false;
      
      // Show error if user has interacted with the form but not met all requirements
      interacted = formData.previousHouseNumber !== undefined ||
                  formData.previousHouseName !== undefined ||
                  formData.previousFlatNumber !== undefined ||
                  formData.previousStreet !== undefined ||
                  formData.previousCity !== undefined ||
                  formData.previousCounty !== undefined;

      // Missing required fields
      missingFields = !hasIdentifier() ||
                    !(formData.previousStreet?.trim()?.length > 0) ||
                    !(formData.previousCity?.trim()?.length > 0);

      return interacted && missingFields;
    } else {
      // For international addresses, let the OtherCountryManualAddress component handle error display
      return false;
    }
  };

  // Handle back navigation - clear manual address flag if no valid data
  const handleBackFromManual = () => {
    // Always clear the manual address flag when going back if form is not valid
    // This prevents the previous screen from immediately redirecting back here
    if (!isValidForm()) {
      if (isUK) {
        // Clear UK manual address data and flag if form is not valid
        setFormData({
          ...formData,
          previousUseManualAddress: false,
          previousHouseNumber: '',
          previousHouseName: '',
          previousFlatNumber: '',
          previousStreet: '',
          previousCity: '',
          previousCounty: ''
        });
      } else {
        // Clear international manual address data and flag if form is not valid
        setFormData({
          ...formData,
          previousUseManualAddress: false,
          previousinternationaladdressPostcode: '',
          previousinternationaladdressAddressLine1: '',
          previousinternationaladdressAddressLine2: '',
          previousinternationaladdressStreet: '',
          previousinternationaladdressCity: '',
          previousinternationaladdressState: '',
          previousinternationaladdressHouseNumber: '',
          previousinternationaladdressHouseName: '',
          previousinternationaladdressFlatNumber: '',
          // Also reset the country back to UK to ensure clean state
          previousCountry: { name: "United Kingdom", code: "GB", flag: "gb" },
          previousCountryName: "United Kingdom",
          is_new_immigrant: false
        });
      }
    }
    prevStep();
  };

  const handleChangeCountry = () => {
    setShowCountrySelector(true);
  };

  const handleCountryChange = (country: Country) => {
    // Clear previous data based on country change
    const isNowUK = country.code === "GB";

    // Create a new form data object to replace the existing one
    const newFormData: FormData = {} as FormData;
    
    // Copy over all the existing properties first (non-address related)
    for (const key in formData) {
      // Skip all address-related fields - we'll handle them specifically
      if (!key.startsWith('previous')) {
        newFormData[key] = formData[key];
      }
    }
    
    // Set the new country information
    newFormData.previousCountry = country;
    newFormData.previousCountryName = country.name;
    newFormData.previousUseManualAddress = true;
    newFormData.is_new_immigrant = !isNowUK; // Set to true for non-UK
    
    // If switching to UK, initialize with empty UK fields
    if (isNowUK) {
      newFormData.previousPostcode = '';
      newFormData.previousHouseNumber = '';
      newFormData.previousHouseName = '';
      newFormData.previousFlatNumber = '';
      newFormData.previousStreet = '';
      newFormData.previousCity = '';
      newFormData.previousCounty = '';
      newFormData.previousSelectedAddress = null;
    }
    // If switching to international, initialize with empty international fields
    else {
      newFormData.previousinternationaladdressPostcode = '';
      newFormData.previousinternationaladdressAddressLine1 = '';
      newFormData.previousinternationaladdressAddressLine2 = '';
      newFormData.previousinternationaladdressStreet = '';
      newFormData.previousinternationaladdressCity = '';
      newFormData.previousinternationaladdressState = '';
      newFormData.previousinternationaladdressCountryName = country.name;
      newFormData.previousSelectedAddress = null;
    }
    
    setFormData(newFormData);
    setShowCountrySelector(false);
  };

  // Get the appropriate values based on whether it's UK or international
  const getFieldValue = (field: string) => {
    if (isUK) {
      return formData[`previous${field}`] || '';
    } else {
      return formData[`previousinternationaladdress${field}`] || '';
    }
  };

  // Add partner color styles
  const inputFocusStyle = useMemo(() => {
    if (isPartnerRoute && partner?.error_input_focus_color) {
      return { borderColor: partner.error_input_focus_color };
    }
    return {};
  }, [isPartnerRoute, partner]);

  const inputErrorStyle = useMemo(() => {
    if (isPartnerRoute && partner?.error_input_focus_color) {
      return { borderColor: partner.error_input_focus_color };
    }
    return {};
  }, [isPartnerRoute, partner]);

  const errorMessageStyle = useMemo(() => {
    if (isPartnerRoute && partner?.error_input_focus_color) {
      return { color: partner.error_input_focus_color };
    }
    return {};
  }, [isPartnerRoute, partner]);

  return (
    <div>
      <h2 className="form-title">
        {isUK ? "What was your previous residential address?" : "What was your previous international address?"}
      </h2>

      <div className="country-selection">
        <div className="country-display" style={optionHoverStyle}>
          <div className="flag-icon" style={isPartnerRoute && partner?.primary_color ? {borderColor: partner.primary_color} : {}}>
            <img
              className="flag-image"
              src={`/assets/flags/${formData.previousCountry?.flag.toLowerCase()}.svg`}
              alt={`${formData.previousCountry?.name} flag`}
              loading="lazy"
            />
          </div>
          <div className="country-info">
            <div className="country-name" style={textColorStyle}>{formData.previousCountry?.name}</div>
            <div className="country-code" style={textColorStyle}>{formData.previousCountry?.code}</div>
          </div>
          <button 
            className="change-button"
            onClick={handleChangeCountry}
            style={textColorStyle}
          >
            Change
          </button>
        </div>
      </div>

      {/* Only show postcode field for UK addresses */}
      {isUK && (
        <div className="postcode-field-container">
          <label className="postcode-label" style={textColorStyle}>Postcode</label>
          <input
            type="text"
            value={formData.previousPostcode || ''}
            readOnly
            className="postcode-input-field"
          />
        </div>
      )}

      {isUK ? (
        // UK Address Manual Entry
        <div className="manual-address-grid">
          <div>
            <input
              type="text"
              value={getFieldValue('HouseNumber')}
              onChange={(e) => handleManualAddressChange('HouseNumber', e.target.value)}
              className={`manual-address-input ${shouldShowError() ? 'error' : ''}`}
              placeholder="House Number"
              autoFocus={shouldAutoFocus}
              style={shouldShowError() ? inputErrorStyle : {}}
              onFocus={(e) => shouldShowError() && Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, shouldShowError() ? inputErrorStyle : {})}
            />
          </div>

          <div>
            <input
              type="text"
              value={getFieldValue('HouseName')}
              onChange={(e) => handleManualAddressChange('HouseName', e.target.value)}
              className={`manual-address-input ${shouldShowError() ? 'error' : ''}`}
              placeholder="House Name"
              style={shouldShowError() ? inputErrorStyle : {}}
              onFocus={(e) => shouldShowError() && Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, shouldShowError() ? inputErrorStyle : {})}
            />
          </div>

          <div>
            <input
              type="text"
              value={getFieldValue('FlatNumber')}
              onChange={(e) => handleManualAddressChange('FlatNumber', e.target.value)}
              className={`manual-address-input ${shouldShowError() ? 'error' : ''}`}
              placeholder="Flat Number"
              style={shouldShowError() ? inputErrorStyle : {}}
              onFocus={(e) => shouldShowError() && Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, shouldShowError() ? inputErrorStyle : {})}
            />
          </div>
        </div>
      ) : null}

      {isUK ? (
        <div className="manual-address-grid">
          <div className="manual-address-full">
            <input
              type="text"
              value={getFieldValue('Street')}
              onChange={(e) => handleManualAddressChange('Street', e.target.value)}
              className={`manual-address-input ${shouldShowError() ? 'error' : ''}`}
              placeholder="Street"
              style={shouldShowError() ? inputErrorStyle : {}}
              onFocus={(e) => shouldShowError() && Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, shouldShowError() ? inputErrorStyle : {})}
            />
          </div>

          <div className="manual-address-full">
            <input
              type="text"
              value={getFieldValue('City')}
              onChange={(e) => handleManualAddressChange('City', e.target.value)}
              className={`manual-address-input ${shouldShowError() ? 'error' : ''}`}
              placeholder="City"
              style={shouldShowError() ? inputErrorStyle : {}}
              onFocus={(e) => shouldShowError() && Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, shouldShowError() ? inputErrorStyle : {})}
            />
          </div>

          <div className="manual-address-full">
            <input
              type="text"
              value={isUK ? (formData.previousCounty || '') : (formData.previousinternationaladdressState || '')}
              onChange={(e) => handleManualAddressChange(isUK ? 'County' : 'State', e.target.value)}
              className={`manual-address-input ${shouldShowError() ? 'error' : ''}`}
              placeholder={isUK ? "County" : "State"}
              style={shouldShowError() ? inputErrorStyle : {}}
              onFocus={(e) => shouldShowError() && Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, shouldShowError() ? inputErrorStyle : {})}
            />
          </div>
        </div>
      ) : (
        // Non-UK Address - Use OtherCountryManualAddress Component
        <OtherCountryManualAddress 
          formData={formData}
          setFormData={setFormData}
          country={formData.previousCountry}
          isPartnerRoute={isPartnerRoute}
          partner={partner}
        />
      )}

      {/* Country Selector Modal */}
      <CountrySelector
        selectedCountry={formData.previousCountry || defaultCountry}
        onChange={handleCountryChange}
        onClose={() => setShowCountrySelector(false)}
        isOpen={showCountrySelector}
      />

      {/* Error message at bottom to prevent screen shift */}
      {isUK && (
        <div className="error-container-bottom">
          {shouldShowError() && (
            <div className="address-error-bottom" style={errorMessageStyle}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              Please supply full address
            </div>
          )}
        </div>
      )}

      <NavigationButtons
        prevStep={handleBackFromManual}
        nextStep={() => {
          if (isValidForm()) {
            // Explicitly set is_new_immigrant based on country before navigating
            setFormData({
              ...formData,
              is_new_immigrant: !isUK
            });
            nextScreen();
          }
        }}
        isNextDisabled={!isValidForm()}
        backButtonId={backButtonId}
        nextButtonId={nextButtonId}
      />
    </div>
  );
};

export default PreviousManualAddressScreen; 