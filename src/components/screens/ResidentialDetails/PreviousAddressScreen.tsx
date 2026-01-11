import React, { useState, useEffect } from 'react';
import { NavigationButtons } from '../../ui';
import { Country } from '../../ui';
import OtherCountryManualAddress from './OtherCountryManualAddress';
import PreviousAddressCountrySelector from './PreviousAddress/PreviousAddressCountrySelector';
import PreviousUKAddressInput from './PreviousAddress/PreviousUKAddressInput';
import { FormData } from '../../../types/FormTypes';
import { Partner } from '../../../partner/partnerService';

interface PreviousAddressScreenProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextScreen: () => void;
  prevStep: () => void;
  goToManualAddress?: () => void;
  textColorStyle?: React.CSSProperties;
  isPartnerRoute?: boolean;
  partner?: Partner;
  selectedOptionStyle?: React.CSSProperties;
  optionHoverStyle?: React.CSSProperties;
  backButtonId?: string;
  nextButtonId?: string;
}

const PreviousAddressScreen: React.FC<PreviousAddressScreenProps> = ({
  formData,
  setFormData,
  nextScreen,
  prevStep,
  goToManualAddress,
  textColorStyle,
  isPartnerRoute,
  partner,
  selectedOptionStyle,
  optionHoverStyle,
  backButtonId,
  nextButtonId
}) => {
  const [showCountrySelector, setShowCountrySelector] = useState<boolean>(false);

  // Default country - UK
  const defaultCountry: Country = {
    name: "United Kingdom",
    code: "GB",
    flag: "gb"
  };

  // Check if the selected country is UK
  const isUK = formData.previousCountry?.code === "GB";

  // Component mount effect
  useEffect(() => {
    // Initialize default country if not set
    if (!formData.previousCountry) {
      setFormData({
        ...formData,
        previousCountry: {
          ...defaultCountry,
          id: defaultCountry.code // Add the id field that FormTypes.Country expects
        }
      });
    }
  }, []);





  const handleNextStep = () => {
    if (isUK) {
      // For UK addresses, validate that an address is selected or manual entry is used
      if (formData.previousSelectedAddress || formData.previousUseManualAddress) {
        // Create a new form data object to update
        const newFormData: FormData = { ...formData };

        // Clear any international address fields
        const keysToDelete: (keyof FormData)[] = [];
        (Object.keys(newFormData) as (keyof FormData)[]).forEach(key => {
          if (typeof key === 'string' && key.startsWith('previousinternationaladdress')) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach(key => delete newFormData[key]);

        // Ensure is_new_immigrant is false for UK addresses
        newFormData.is_new_immigrant = false;
        
        // Update form data
        setFormData(newFormData);
        nextScreen();
      }
    } else {
      // For non-UK addresses, validate required fields for manual entry
      if (isOtherCountryAddressValid()) {
        // Create a new form data object to update
        const newFormData: FormData = { ...formData };
        
        // Clear any UK address fields
        const keysToDelete: (keyof FormData)[] = [];
        (Object.keys(newFormData) as (keyof FormData)[]).forEach(key => {
          if (typeof key === 'string' && 
              key.startsWith('previous') && 
              !key.includes('international') &&
              key !== 'previousCountry' && 
              key !== 'previousUseManualAddress') {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach(key => delete newFormData[key]);

        // Save international address data
        newFormData.previousUseManualAddress = true;
        newFormData.previousSelectedAddress = undefined;

        // Ensure is_new_immigrant is true for international addresses
        newFormData.is_new_immigrant = true;
        
        // Update form data
        setFormData(newFormData);
        nextScreen();
      }
    }
  };

  const isOtherCountryAddressValid = () => {
    const postcode = formData.previousinternationaladdressPostcode || '';
    const addressLine1 = formData.previousinternationaladdressAddressLine1 || '';
    const city = formData.previousinternationaladdressCity || '';
    const state = formData.previousinternationaladdressState || '';

    const isPostcodeValid = postcode.trim().length > 0;
    const isAddressLine1Valid = addressLine1.trim().length > 0;
    const isCityValid = city.trim().length > 0;
    const isStateValid = state.trim().length > 0;

    // Either city OR state must be filled (or both)
    const isCityOrStateValid = isCityValid || isStateValid;

    return isPostcodeValid && isAddressLine1Valid && isCityOrStateValid;
  };

  const handleCountryChange = (country: Country) => {
    // Clear previous data based on country change
    const isNowUK = country.code === "GB";
    const wasUK = formData.previousCountry?.code === "GB";
    
    // Create a new form data object to replace the existing one
    const newFormData: FormData = { ...formData };

    // Clear previous-related fields that will be handled specifically
    const keysToDelete: (keyof FormData)[] = [];
    (Object.keys(newFormData) as (keyof FormData)[]).forEach(key => {
      if (typeof key === 'string' && key.startsWith('previous')) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => delete newFormData[key]);

    // Set the new country information - ensure it has the required 'id' field
    newFormData.previousCountry = {
      ...country,
      id: country.code // Ensure id is set
    };
    newFormData.previousUseManualAddress = !isNowUK; // Set to true for non-UK
    newFormData.is_new_immigrant = !isNowUK; // Set to true for non-UK
    
    // If switching to UK, set up the UK fields and clear international fields
    if (isNowUK) {
      // If there were previously entered UK values, restore them
      if (wasUK) {
        if (formData.previousPostcode) newFormData.previousPostcode = formData.previousPostcode;
        if (formData.previousHouseNumber) newFormData.previousHouseNumber = formData.previousHouseNumber;
        if (formData.previousFlatNumber) newFormData.previousFlatNumber = formData.previousFlatNumber;
        if (formData.previousHouseName) newFormData.previousHouseName = formData.previousHouseName;
        if (formData.previousStreet) newFormData.previousStreet = formData.previousStreet;
        if (formData.previousCity) newFormData.previousCity = formData.previousCity;
        if (formData.previousCounty) newFormData.previousCounty = formData.previousCounty;
        if (formData.previousSelectedAddress) newFormData.previousSelectedAddress = formData.previousSelectedAddress;
      }
      // Otherwise, initialize with empty values
      else {
        newFormData.previousPostcode = '';
        newFormData.previousHouseNumber = '';
        newFormData.previousFlatNumber = '';
        newFormData.previousHouseName = '';
        newFormData.previousStreet = '';
        newFormData.previousCity = '';
        newFormData.previousCounty = '';
        newFormData.previousSelectedAddress = undefined;
      }
    }
    // If switching to international, set up international fields and clear UK fields
    else {
      // If there were previously entered international values, restore them
      if (!wasUK) {
        if (formData.previousinternationaladdressPostcode) newFormData.previousinternationaladdressPostcode = formData.previousinternationaladdressPostcode;
        if (formData.previousinternationaladdressAddressLine1) newFormData.previousinternationaladdressAddressLine1 = formData.previousinternationaladdressAddressLine1;
        if (formData.previousinternationaladdressHouseNumber) newFormData.previousinternationaladdressHouseNumber = formData.previousinternationaladdressHouseNumber;
        if (formData.previousinternationaladdressHouseName) newFormData.previousinternationaladdressHouseName = formData.previousinternationaladdressHouseName;
        if (formData.previousinternationaladdressFlatNumber) newFormData.previousinternationaladdressFlatNumber = formData.previousinternationaladdressFlatNumber;
        if (formData.previousinternationaladdressCity) newFormData.previousinternationaladdressCity = formData.previousinternationaladdressCity;
        if (formData.previousinternationaladdressState) newFormData.previousinternationaladdressState = formData.previousinternationaladdressState;
      }
      // Otherwise, initialize with empty values
      else {
        newFormData.previousinternationaladdressPostcode = '';
        newFormData.previousinternationaladdressAddressLine1 = '';
        newFormData.previousinternationaladdressHouseNumber = '';
        newFormData.previousinternationaladdressHouseName = '';
        newFormData.previousinternationaladdressFlatNumber = '';
        newFormData.previousinternationaladdressCity = '';
        newFormData.previousinternationaladdressState = '';
      }
    }
    
    // Update the form data with the new values
    setFormData(newFormData);
  };

  return (
    <div>
      <h2 className="form-title">
        {isUK ? "What was your previous residential address?" : "What was your previous international address?"}
      </h2>

      <PreviousAddressCountrySelector
        selectedCountry={{
          ...(formData.previousCountry ? formData.previousCountry : defaultCountry),
          flag: (formData.previousCountry ? formData.previousCountry : defaultCountry).flag || '🏳️'
        }}
        onCountryChange={handleCountryChange}
        textColorStyle={textColorStyle}
        showCountrySelector={showCountrySelector}
        setShowCountrySelector={setShowCountrySelector}
      />

      {isUK ? (
        <PreviousUKAddressInput
          formData={formData}
          setFormData={setFormData}
          goToManualAddress={goToManualAddress}
          textColorStyle={textColorStyle}
          isPartnerRoute={isPartnerRoute}
          partner={partner}
          selectedOptionStyle={selectedOptionStyle}
          optionHoverStyle={optionHoverStyle}
        />
      ) : (
        <OtherCountryManualAddress
          formData={formData}
          setFormData={setFormData}
          country={{
            ...(formData.previousCountry || defaultCountry),
            flag: (formData.previousCountry || defaultCountry).flag || '🏳️'
          }}
          isPartnerRoute={isPartnerRoute}
          partner={partner}
        />
      )}

      <NavigationButtons
        prevStep={() => {
          // Ensure data is saved before navigating back
          if (formData.previousSelectedAddress) {
            setFormData({
              ...formData,
              previousSelectedAddress: formData.previousSelectedAddress,
              is_new_immigrant: false // Ensure flag is set correctly when going back
            });
          } else if (formData.previousUseManualAddress) {
            setFormData({
              ...formData,
              previousUseManualAddress: true,
              is_new_immigrant: formData.previousCountry?.code !== "GB" // Ensure flag is set correctly based on country
            });
          }
          prevStep();
        }}
        nextStep={handleNextStep}
        isNextDisabled={isUK ? 
          !(formData.previousSelectedAddress || formData.previousUseManualAddress) :
          !isOtherCountryAddressValid()
        }
        backButtonId={backButtonId}
        nextButtonId={nextButtonId}
      />
    </div>
  );
};

export default PreviousAddressScreen;