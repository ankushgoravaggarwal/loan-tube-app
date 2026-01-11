import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavigationButtons } from '../../ui';
import { PostcodeAPI, Address } from '../../../services/apiService';
import { FormData } from '../../../types/FormTypes';
import { Partner } from '../../../partner/partnerService';

interface PostcodeScreenProps {
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

const PostcodeScreen: React.FC<PostcodeScreenProps> = ({
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
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAddressList, setShowAddressList] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);
  const [showValidationError, setShowValidationError] = useState<boolean>(false);
  const [showSelectedAddressOnly, setShowSelectedAddressOnly] = useState<boolean>(false);
  const [lastSearchedPostcode, setLastSearchedPostcode] = useState<string>('');
  
  // Calculate initial autofocus state based on current form data
  const getInitialAutoFocus = () => {
    const hasPostcode = formData.postcode && formData.postcode.trim().length > 0;
    const hasSelectedAddress = formData.selectedAddress || formData.useManualAddress;
    return !hasPostcode && !hasSelectedAddress;
  };
  
  const [shouldAutoFocus, setShouldAutoFocus] = useState<boolean>(getInitialAutoFocus());

  // Add ref for the postcode input field
  const postcodeInputRef = useRef<HTMLInputElement>(null);

  // Determine if postcode field should be read-only
  const isPostcodeReadOnly = showSelectedAddressOnly && !!(formData.selectedAddress || formData.useManualAddress);

  // Helper function to check if postcode is valid
  const isValidPostcode = (postcode: string) => {
    // UK postcode regex pattern - more strict validation
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
    return postcode && postcodeRegex.test(postcode.trim());
  };

  // Helper function to format addresses
  const formatAddress = (address: Address): Address => {
    return {
      ...address,
      FullAddress: address.FullAddress.replace(/,/g, ', '),
      Street1: address.Street1?.replace(/,/g, ', ') || '',
      Street2: address.Street2?.replace(/,/g, ', ') || ''
    };
  };

  // Consolidated function to fetch addresses - prevents duplicate API calls
  const fetchAddresses = async (postcode: string, isRestore: boolean = false) => {
    if (!postcode || !isValidPostcode(postcode)) {
      if (!isRestore) {
        setError('Please enter a valid postcode');
      }
      return;
    }

    // Prevent duplicate API calls for the same postcode
    if (postcode === lastSearchedPostcode && addresses.length > 0) {
      setShowAddressList(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await PostcodeAPI.validatePostcode(postcode);
      
      // Format addresses with spaces after commas
      const formattedAddresses = response.AddressList.map(formatAddress);

      setAddresses(formattedAddresses);
      setShowAddressList(true);
      setLastSearchedPostcode(postcode);

      // Find and select the previously selected address if restoring
      if (isRestore && formData.selectedAddress && typeof formData.selectedAddress === 'object') {
        const index = formattedAddresses.findIndex((addr: Address) =>
          addr.AddressID === formData.selectedAddress!.AddressID
        );

        if (index >= 0) {
          setSelectedAddressIndex(index);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching addresses. Please try again.';
      if (!isRestore) {
        setError(errorMessage);
      } else {
        console.error('Error restoring addresses:', err);
      }
      setAddresses([]);
      setShowAddressList(false);
      setLastSearchedPostcode('');
    } finally {
      setLoading(false);
    }
  };

  // Effect to manage autofocus based on field state
  useEffect(() => {
    const hasPostcode = formData.postcode && formData.postcode.trim().length > 0;
    const hasSelectedAddress = formData.selectedAddress || formData.useManualAddress;
    
    // Only enable autofocus if field is empty AND no address is selected
    if (!hasPostcode && !hasSelectedAddress) {
      setShouldAutoFocus(true);
    } else {
      setShouldAutoFocus(false);
    }
  }, [formData.postcode, formData.selectedAddress, formData.useManualAddress]);

  // Component mount effect
  useEffect(() => {
    // Always ensure loading is false initially when navigating to this screen
    setLoading(false);

    // If we have a selected address already, show that only
    if (formData.selectedAddress) {
      setShowSelectedAddressOnly(true);
      return; // Exit early to prevent API call
    }
    // If user has manually entered an address, show it as selected
    else if (formData.useManualAddress && formData.postcode) {
      setShowSelectedAddressOnly(true);
      return; // Exit early to prevent API call
    }
    // Otherwise, if we have a postcode but no addresses, try to restore them
    else if (formData.postcode && addresses.length === 0 && !showSelectedAddressOnly) {
      fetchAddresses(formData.postcode, true);
    }
  }, []);

  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only alphanumeric characters and spaces for UK postcode
    // Limit to 8 characters (including spaces)
    const value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase();

    // Enforce 8 character limit (including spaces)
    const limitedValue = value.slice(0, 8);

    // Don't update if it's already at max length and trying to add more
    if (formData.postcode && formData.postcode.length >= 8 && value.length > formData.postcode.length) {
      return;
    }

    setFormData({ ...formData, postcode: limitedValue });

    // Reset the selection display state when typing a new postcode
    setShowSelectedAddressOnly(false);

    // Don't reset if we already have a selected address and we're just editing the field slightly
    if (showAddressList && selectedAddressIndex !== null) {
      // Only reset if the postcode has changed substantially (more than just spaces)
      const normalizedCurrent = formData.postcode?.replace(/\s/g, '') || '';
      const normalizedNew = limitedValue.replace(/\s/g, '');

      if (normalizedCurrent !== normalizedNew) {
        setShowAddressList(false);
        setSelectedAddressIndex(null);
        setLastSearchedPostcode('');
        setFormData({
          ...formData,
          selectedAddress: undefined
        });
      }
    } else if (showAddressList) {
      setShowAddressList(false);
      setLastSearchedPostcode('');
    }

    // Clear error when user is typing
    setError(null);
    setShowValidationError(false);
  };

  // Auto-fetch addresses when postcode is valid with proper debounce
  useEffect(() => {
    // Don't run if we're showing a selected address (either from API or manual)
    if (showSelectedAddressOnly) return;

    // Don't run if we already have a selected address or manual address
    if (formData.selectedAddress || formData.useManualAddress) return;

    if (formData.postcode && !loading) {
      const timer = setTimeout(() => {
        // Check if the postcode is valid
        if (isValidPostcode(formData.postcode!)) {
          // Remove focus from the input field to hide the keyboard on mobile
          if (postcodeInputRef.current) {
            postcodeInputRef.current.blur();
          }

          // Only search if we don't already have a selected address or if we're not showing just the selected address
          if (selectedAddressIndex === null && !showSelectedAddressOnly && !formData.selectedAddress && !formData.useManualAddress) {
            fetchAddresses(formData.postcode!);
          }
          setShowValidationError(false);
        } else if (formData.postcode && formData.postcode.length > 0) {
          // Show validation error if postcode is not valid and not empty
          setShowValidationError(true);
        }
      }, 800); // Longer debounce to ensure user has stopped typing

      return () => clearTimeout(timer);
    }
  }, [formData.postcode]);

  const handleAddressSelect = (address: Address, index: number) => {
    // Format the address to add spaces after commas
    const formattedAddress = formatAddress(address);

    setSelectedAddressIndex(index);
    setShowSelectedAddressOnly(true);

    setFormData({
      ...formData,
      selectedAddress: formattedAddress,
      fullAddress: formattedAddress.FullAddress,
      postcode: formattedAddress.PostCode,
      houseNumber: formattedAddress.HouseNumber,
      flatNumber: formattedAddress.FlatNumber,
      houseName: formattedAddress.HouseName,
      street1: formattedAddress.Street1,
      street2: formattedAddress.Street2,
      district: formattedAddress.District,
      county: formattedAddress.County,
      city: formattedAddress.City,
      country: formattedAddress.Country,
      useManualAddress: false
    });
  };

  // Focus the input when it becomes editable or when shouldAutoFocus is enabled
  useEffect(() => {
    if (!isPostcodeReadOnly && postcodeInputRef.current && shouldAutoFocus) {
      // Add a delay to ensure scroll utility completes first
      setTimeout(() => {
        if (postcodeInputRef.current && shouldAutoFocus) {
          postcodeInputRef.current.focus();
        }
      }, 100);
    }
  }, [isPostcodeReadOnly, shouldAutoFocus]);

  // Function to edit the selected address (go back to address list)
  const handleEditAddress = () => {
    // Store current postcode before clearing everything
    const currentPostcode = formData.postcode;

    // Reset everything related to address selection
    setShowSelectedAddressOnly(false);
    setSelectedAddressIndex(null);
    
    // Re-enable autofocus when user clicks change
    setShouldAutoFocus(true);

    // Reset formData with just the postcode but no selected address
    setFormData({
      ...formData,
      selectedAddress: undefined,
      useManualAddress: false
    });

    // Immediately focus the input and fetch addresses
    setTimeout(() => {
      if (postcodeInputRef.current) {
        postcodeInputRef.current.focus();
      }
      
      // Always fetch addresses if we have a valid postcode (will show cached results if available)
      if (currentPostcode && isValidPostcode(currentPostcode)) {
        fetchAddresses(currentPostcode);
      }
    }, 50);
  };

  const handleManualAddress = () => {
    // Set the manual address flag and clear any selected address
    const newFormData = {
      ...formData,
      useManualAddress: true,
      selectedAddress: undefined
    };
    setFormData(newFormData);
    setSelectedAddressIndex(null);
    
    // Use the special navigation function if provided, otherwise use default
    if (goToManualAddress) {
      goToManualAddress();
    } else {
      nextScreen();
    }
  };

  const handleNextStep = () => {
    if (selectedAddressIndex !== null ||
        (showSelectedAddressOnly && formData.selectedAddress) ||
        (showSelectedAddressOnly && formData.useManualAddress)) {
      nextScreen();
    }
  };

  const validPostcode = isValidPostcode(formData.postcode || '');

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
        What is your residential address?
      </h2>

      <div className="input-container">
        <label className="input-label" style={isPostcodeReadOnly ? { color: 'grey' } : textColorStyle}>
          Postcode
        </label>
        <div className="postcode-search-container">
          <input
            ref={postcodeInputRef}
            type="text"
            value={formData.postcode || ''}
            onChange={handlePostcodeChange}
            placeholder="Enter Postcode"
            className={`input-field postcode-input ${error || showValidationError ? 'error' : ''} ${isPostcodeReadOnly ? 'readonly-field' : ''}`}
            autoFocus={shouldAutoFocus}
            readOnly={isPostcodeReadOnly}
            style={isPostcodeReadOnly ? { color: 'grey', cursor: 'not-allowed', borderColor:'#80808099' } : (error || showValidationError ? inputErrorStyle : {})}
            onFocus={(e) => (error || showValidationError) && Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, (error || showValidationError) ? inputErrorStyle : {})}
          />
          {!loading && validPostcode && !isPostcodeReadOnly && (
            <div className="search-icon">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="error-icon" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke={isPartnerRoute && partner?.primary_color ? partner.primary_color : "currentColor"}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}
        </div>
        {error && (
          <p className="error-message" style={errorMessageStyle}>{error}</p>
        )}
        {showValidationError && !error && (
          <p className="error-message" style={errorMessageStyle}>Postcode not valid. Enter a valid postcode</p>
        )}
      </div>

      {loading && (
        <div className="address-loader">
          <div className="loader-spinner" style={isPartnerRoute && partner?.primary_color ? {borderTopColor: partner.primary_color} : {}}></div>
        </div>
      )}

      {/* Show just the selected address if we have one and are in "selected address only" mode */}
      {showSelectedAddressOnly && (
        <div className="selected-address-container">
          <h3 className="selected-address-title">Selected Address:</h3>
          <div className="selected-address-box">
            {formData.selectedAddress ? (
              <p className="selected-address-text">{formData.selectedAddress.FullAddress}</p>
            ) : formData.useManualAddress ? (
              <p className="selected-address-text">Address entered manually</p>
            ) : null}
            <button
              onClick={handleEditAddress}
              className="edit-address-button"
              style={textColorStyle}
            >
              Change
            </button>
          </div>
        </div>
      )}

      {/* Show the address list if we're not in "selected address only" mode */}
      {!showSelectedAddressOnly && showAddressList && addresses.length > 0 && (
        <div className="address-list-wrapper">
          <div className="address-list-container">
            {addresses.map((address, index) => (
              <button
                key={index}
                className={`address-option ${selectedAddressIndex === index ? 'selected' : ''}`}
                onClick={() => handleAddressSelect(address, index)}
                style={{
                  ...(selectedAddressIndex === index ? selectedOptionStyle : {}),
                  ...optionHoverStyle
                }}
              >
                {address.FullAddress}
              </button>
            ))}
          </div>
          <div className="manual-address-option">
            <button
              className={`manual-address-link ${selectedAddressIndex !== null ? 'selected-address' : ''}`}
              onClick={handleManualAddress}
              style={textColorStyle}
            >
              My address is not listed here
            </button>
          </div>
        </div>
      )}

      <NavigationButtons
        prevStep={prevStep}
        nextStep={handleNextStep}
        isNextDisabled={!(selectedAddressIndex !== null ||
                      (showSelectedAddressOnly && formData.selectedAddress) ||
                      (showSelectedAddressOnly && formData.useManualAddress))}
        backButtonId={backButtonId}
        nextButtonId={nextButtonId}
      />
    </div>
  );
};

export default PostcodeScreen; 