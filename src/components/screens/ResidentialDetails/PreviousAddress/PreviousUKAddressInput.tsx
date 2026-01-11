import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PostcodeAPI, Address } from '../../../../services/apiService';
import { FormData } from '../../../../types/FormTypes';
import { Partner } from '../../../../partner/partnerService';

interface PreviousUKAddressInputProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  goToManualAddress?: () => void;
  textColorStyle?: React.CSSProperties;
  isPartnerRoute?: boolean;
  partner?: Partner;
  selectedOptionStyle?: React.CSSProperties;
  optionHoverStyle?: React.CSSProperties;
}

const PreviousUKAddressInput: React.FC<PreviousUKAddressInputProps> = ({
  formData,
  setFormData,
  goToManualAddress,
  textColorStyle,
  isPartnerRoute,
  partner,
  selectedOptionStyle,
  optionHoverStyle
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
    const hasPostcode = formData.previousPostcode && formData.previousPostcode.trim().length > 0;
    const hasSelectedAddress = formData.previousSelectedAddress || formData.previousUseManualAddress;
    return !hasPostcode && !hasSelectedAddress;
  };
  
  const [shouldAutoFocus, setShouldAutoFocus] = useState<boolean>(getInitialAutoFocus());

  // Add ref for the postcode input field
  const postcodeInputRef = useRef<HTMLInputElement>(null);

  // Determine if postcode field should be read-only
  const isPostcodeReadOnly = showSelectedAddressOnly && (formData.previousSelectedAddress || formData.previousUseManualAddress);

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
      if (isRestore && formData.previousSelectedAddress) {
        const index = formattedAddresses.findIndex((addr: Address) =>
          addr.AddressID === formData.previousSelectedAddress.AddressID
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
    const hasPostcode = formData.previousPostcode && formData.previousPostcode.trim().length > 0;
    const hasSelectedAddress = formData.previousSelectedAddress || formData.previousUseManualAddress;
    
    // Only enable autofocus if field is empty AND no address is selected
    if (!hasPostcode && !hasSelectedAddress) {
      setShouldAutoFocus(true);
    } else {
      setShouldAutoFocus(false);
    }
  }, [formData.previousPostcode, formData.previousSelectedAddress, formData.previousUseManualAddress]);

  // Focus the input when it becomes editable - FIXED VERSION
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

  // Component mount effect - FIXED VERSION
  useEffect(() => {
    // Always ensure loading is false initially when navigating to this screen
    setLoading(false);

    // Check for existing data - Important for returning to the page
    // If we have a selected address already, show that only
    if (formData.previousSelectedAddress) {
      setSelectedAddressIndex(0);
      setShowSelectedAddressOnly(true);
      return;
    }
    // If user has manually entered an address, show it as selected
    else if (formData.previousUseManualAddress) {
      setShowSelectedAddressOnly(true);
      return;
    }
    // Otherwise, if we have a postcode but no addresses, try to restore them
    else if (formData.previousPostcode && addresses.length === 0 && !showSelectedAddressOnly) {
      fetchAddresses(formData.previousPostcode, true);
    }
  }, []);

  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only alphanumeric characters and spaces for UK postcode
    // Limit to 8 characters (including spaces)
    const value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase();

    // Enforce 8 character limit (including spaces)
    const limitedValue = value.slice(0, 8);

    // Don't update if it's already at max length and trying to add more
    if (formData.previousPostcode && formData.previousPostcode.length >= 8 && value.length > formData.previousPostcode.length) {
      return;
    }

    // Only update the postcode field without affecting other form data
    setFormData({ ...formData, previousPostcode: limitedValue });

    // Reset the selection display state when typing a new postcode
    setShowSelectedAddressOnly(false);

    // Don't reset if we already have a selected address and we're just editing the field slightly
    if (showAddressList && selectedAddressIndex !== null) {
      // Only reset if the postcode has changed substantially (more than just spaces)
      const normalizedCurrent = formData.previousPostcode?.replace(/\s/g, '') || '';
      const normalizedNew = limitedValue.replace(/\s/g, '');

      if (normalizedCurrent !== normalizedNew) {
        setShowAddressList(false);
        setSelectedAddressIndex(null);
        setLastSearchedPostcode('');
        
        // Clear only the selected address, but keep other form data
        setFormData({
          ...formData,
          previousPostcode: limitedValue,
          previousSelectedAddress: null
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
    if (formData.previousSelectedAddress || formData.previousUseManualAddress) return;

    if (formData.previousPostcode && !loading) {
      const timer = setTimeout(() => {
        // Check if the postcode is valid
        if (isValidPostcode(formData.previousPostcode)) {
          // Remove focus from the input field to hide the keyboard on mobile
          if (postcodeInputRef.current) {
            postcodeInputRef.current.blur();
          }

          // Only search if we don't already have a selected address or if we're not showing just the selected address
          if (selectedAddressIndex === null && !showSelectedAddressOnly && !formData.previousSelectedAddress && !formData.previousUseManualAddress) {
            fetchAddresses(formData.previousPostcode);
          }
          setShowValidationError(false);
        } else if (formData.previousPostcode.length > 0) {
          // Show validation error if postcode is not valid and not empty
          setShowValidationError(true);
          // Hide address list when postcode becomes invalid
          if (showAddressList) {
            setShowAddressList(false);
            setAddresses([]);
            setLastSearchedPostcode('');
          }
        }
      }, 800); // Longer debounce to ensure user has stopped typing

      return () => clearTimeout(timer);
    }
  }, [formData.previousPostcode]);

  const handleAddressSelect = (address: Address, index: number) => {
    // Format the address to add spaces after commas
    const formattedAddress = formatAddress(address);

    setSelectedAddressIndex(index);
    setShowSelectedAddressOnly(true);

    // Save to formData when an address is selected
    setFormData({
      ...formData,
      previousSelectedAddress: formattedAddress,
      previousFullAddress: formattedAddress.FullAddress,
      previousPostcode: formattedAddress.PostCode,
      previousHouseNumber: formattedAddress.HouseNumber,
      previousFlatNumber: formattedAddress.FlatNumber,
      previousHouseName: formattedAddress.HouseName,
      previousStreet1: formattedAddress.Street1,
      previousStreet2: formattedAddress.Street2,
      previousDistrict: formattedAddress.District,
      previousCounty: formattedAddress.County,
      previousCity: formattedAddress.City,
      previousCountryName: formattedAddress.Country,
      previousUseManualAddress: false,
      is_new_immigrant: false // Not a new immigrant if previous address is in UK
    });
  };

  // Function to edit the selected address (go back to address list)
  const handleEditAddress = () => {
    // Store current postcode before clearing everything
    const currentPostcode = formData.previousPostcode;

    // Reset everything related to address selection
    setShowSelectedAddressOnly(false);
    setSelectedAddressIndex(null);
    
    // Re-enable autofocus when user clicks change
    setShouldAutoFocus(true);

    // Reset formData with just the postcode but no selected address
    setFormData({
      ...formData,
      previousSelectedAddress: null,
      previousUseManualAddress: false
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
    // Clear any selected address
    setFormData({
      ...formData,
      previousSelectedAddress: null
    });
    setSelectedAddressIndex(null);
    
    // Use the special navigation function if provided
    if (goToManualAddress) {
      goToManualAddress();
    }
  };

  const validPostcode = isValidPostcode(formData.previousPostcode || '');

  // Update the SVG with the primary color
  const searchIcon = (
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
  );

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
    <>
      <div className="input-container">
        <label className="input-label" style={isPostcodeReadOnly ? { color: 'grey' } : textColorStyle}>
          Postcode
        </label>
        <div className="postcode-search-container">
          <input
            ref={postcodeInputRef}
            type="text"
            value={formData.previousPostcode || ''}
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
            searchIcon
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
            {formData.previousSelectedAddress ? (
              <p className="selected-address-text">{formData.previousSelectedAddress.FullAddress}</p>
            ) : formData.previousUseManualAddress ? (
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
    </>
  );
};

export default PreviousUKAddressInput; 