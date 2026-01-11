import React, { useState, useEffect, useMemo } from 'react';
import { Country } from '../../ui';
import { FormData } from '../../../types/FormTypes';
import { Partner } from '../../../partner/partnerService';

interface OtherCountryManualAddressProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  country: Country;
  isPartnerRoute?: boolean;
  partner?: Partner;
}

const OtherCountryManualAddress: React.FC<OtherCountryManualAddressProps> = ({
  formData,
  setFormData,
  isPartnerRoute,
  partner,
}) => {
  const [shouldAutoFocus, setShouldAutoFocus] = useState<boolean>(false);

  // Check if necessary fields are filled
  const isPostcodeValid = formData.previousinternationaladdressPostcode?.trim()?.length > 0;
  const isAddressLine1Valid = formData.previousinternationaladdressAddressLine1?.trim()?.length > 0;
  const isCityValid = formData.previousinternationaladdressCity?.trim()?.length > 0;
  const isStateValid = formData.previousinternationaladdressState?.trim()?.length > 0;
  const isCityOrStateValid = isCityValid || isStateValid;
  
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
  
  // Check if we should show error - same logic as PreviousManualAddressScreen
  const shouldShowError = () => {
    let interacted = false;
    let missingFields = false;
    
    // Show error if user has interacted with the form but not met all requirements
    interacted = formData.previousinternationaladdressPostcode !== undefined ||
                formData.previousinternationaladdressAddressLine1 !== undefined ||
                formData.previousinternationaladdressAddressLine2 !== undefined ||
                formData.previousinternationaladdressStreet !== undefined ||
                formData.previousinternationaladdressCity !== undefined ||
                formData.previousinternationaladdressState !== undefined;

    // Missing required fields
    missingFields = !isPostcodeValid || !isAddressLine1Valid || !isCityOrStateValid;

    return interacted && missingFields;
  };
  
  // Effect to manage autofocus based on field state
  useEffect(() => {
    // Only enable autofocus if postcode field is truly empty
    const hasPostcode = formData.previousinternationaladdressPostcode && formData.previousinternationaladdressPostcode.trim().length > 0;
    
    if (!hasPostcode) {
      setShouldAutoFocus(true);
    } else {
      setShouldAutoFocus(false);
    }
  }, [formData.previousinternationaladdressPostcode]);

  // Note: Validation is handled by the parent component (PreviousAddressScreen)

  const handleInputChange = (field: string, value: string) => {
    const updatedData = {
      ...formData,
      // Only save to the international address fields
      [`previousinternationaladdress${field.charAt(0).toUpperCase() + field.slice(1)}`]: value,
      previousUseManualAddress: true,
      previousSelectedAddress: null,
    };
    
    // Also save the country info if it exists
    if (formData.previousCountry) {
      updatedData.previousCountryName = formData.previousCountry.name;
      updatedData.previousinternationaladdressCountryName = formData.previousCountry.name;
    }
    
    setFormData(updatedData);
  };

  return (
    <div className="other-country-address">
      <div className="oc-manual-address-grid">

      <div className="manual-address-full">
          <input
            type="text"
            value={formData.previousinternationaladdressPostcode || ''}
            onChange={(e) => handleInputChange('postcode', e.target.value)}
            className={`manual-address-input ${shouldShowError() ? 'error' : ''}`}
            placeholder="Postcode / Zip code"
            autoFocus={shouldAutoFocus}
            style={shouldShowError() ? inputErrorStyle : {}}
            onFocus={(e) => shouldShowError() && Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, shouldShowError() ? inputErrorStyle : {})}
          />
        </div>

        <div className="manual-address-full">
          <input
            type="text"
            value={formData.previousinternationaladdressAddressLine1 || ''}
            onChange={(e) => handleInputChange('addressLine1', e.target.value)}
            className={`manual-address-input ${shouldShowError() ? 'error' : ''}`}
            placeholder="Address Line 1"
            style={shouldShowError() ? inputErrorStyle : {}}
            onFocus={(e) => shouldShowError() && Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, shouldShowError() ? inputErrorStyle : {})}
          />
        </div>

        <div className="manual-address-full">
          <input
            type="text"
            value={formData.previousinternationaladdressAddressLine2 || ''}
            onChange={(e) => handleInputChange('addressLine2', e.target.value)}
            className={`manual-address-input ${shouldShowError() ? 'error' : ''}`}
            placeholder="Address Line 2"
            style={shouldShowError() ? inputErrorStyle : {}}
            onFocus={(e) => shouldShowError() && Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, shouldShowError() ? inputErrorStyle : {})}
          />
        </div>

        <div className="manual-address-full">
          <input
            type="text"
            value={formData.previousinternationaladdressStreet || ''}
            onChange={(e) => handleInputChange('street', e.target.value)}
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
            value={formData.previousinternationaladdressCity || ''}
            onChange={(e) => handleInputChange('city', e.target.value)}
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
            value={formData.previousinternationaladdressState || ''}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className={`manual-address-input ${shouldShowError() ? 'error' : ''}`}
            placeholder="State"
            style={shouldShowError() ? inputErrorStyle : {}}
            onFocus={(e) => shouldShowError() && Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, shouldShowError() ? inputErrorStyle : {})}
          />
        </div>
      </div>

      {/* Error message at bottom to prevent screen shift - same as PreviousManualAddressScreen */}
      <div className="error-container-international-bottom">
        {shouldShowError() && (
          <div className="address-error-bottom" style={errorMessageStyle}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            Please supply full address
          </div>
        )}
      </div>
    </div>
  );
};

export default OtherCountryManualAddress; 