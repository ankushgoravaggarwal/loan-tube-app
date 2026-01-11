import React, { useMemo, useEffect } from 'react';
import {
  PostcodeScreen,
  PreviousAddressScreen,
  PreviousManualAddressScreen,
  ResidenceDurationScreen,
  HomeownerStatusScreen,
  PropertyValueScreen,
  ManualAddressScreen
} from '../screens/ResidentialDetails';
import { usePartner } from '../../partner/PartnerContext';
import { scrollToFormPosition } from '../../utils/scrollUtils';
import { generateButtonIds } from '../../utils/buttonIdGenerator';
import { FormData } from '../../types/FormTypes';

interface ResidentialDetailsProps {
  currentScreen: number;
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: (overrideData?: Partial<FormData>) => void;
  prevStep: () => void;
}

const ResidentialDetails: React.FC<ResidentialDetailsProps> = ({
  currentScreen,
  formData,
  setFormData,
  nextStep,
  prevStep
}) => {
  const { partner, isPartnerRoute } = usePartner();
  
  // Generate button IDs for Google Analytics tracking (ResidentialDetails is step 3)
  const buttonIds = useMemo(() => {
    return generateButtonIds(3, currentScreen, formData);
  }, [currentScreen, formData]);
  
  // Add scroll effect for screen changes
  useEffect(() => {
    // Trigger scroll positioning when screen changes
    scrollToFormPosition(3, currentScreen); // Step 3 for ResidentialDetails
  }, [currentScreen]);
  
  // Consolidate partner-specific styles into a single memoized object
  const partnerStyles = useMemo(() => {
    if (isPartnerRoute && partner) {
      const primaryColor = partner.primary_color;
      const selectButtonBgColor = partner.select_button_background_color;
      const selectButtonTextColor = partner.select_button_text_color;
      const errorInputFocusColor = partner.error_input_focus_color;

      const styles: {
        selectedOptionStyle: React.CSSProperties;
        optionHoverStyle: React.CSSProperties;
        textColorStyle: React.CSSProperties;
        inputFocusStyle: React.CSSProperties;
        inputErrorStyle: React.CSSProperties;
        errorMessageStyle: React.CSSProperties;
      } = {
        selectedOptionStyle: {},
        optionHoverStyle: {},
        textColorStyle: {},
        inputFocusStyle: {},
        inputErrorStyle: {},
        errorMessageStyle: {},
      };

      // selectedOptionStyle
      if (selectButtonBgColor) {
        styles.selectedOptionStyle.backgroundColor = selectButtonBgColor;
        styles.selectedOptionStyle.borderColor = selectButtonBgColor;
      } else if (primaryColor) {
        styles.selectedOptionStyle.backgroundColor = primaryColor;
        styles.selectedOptionStyle.borderColor = primaryColor;
      }
      if (selectButtonTextColor) {
        styles.selectedOptionStyle.color = selectButtonTextColor;
      }

      // optionHoverStyle
      if (selectButtonBgColor) {
        styles.optionHoverStyle['--hover-text-color'] = selectButtonBgColor;
      } else if (primaryColor) {
        styles.optionHoverStyle['--hover-text-color'] = primaryColor;
      }

      // textColorStyle
      if (primaryColor) {
        styles.textColorStyle.color = primaryColor;
      }

      // inputFocusStyle
      if (errorInputFocusColor) {
        styles.inputFocusStyle.borderColor = errorInputFocusColor;
      }

      // inputErrorStyle
      if (errorInputFocusColor) {
        styles.inputErrorStyle.borderColor = errorInputFocusColor;
      }

      // errorMessageStyle
      if (errorInputFocusColor) {
        styles.errorMessageStyle.color = errorInputFocusColor;
      }

      return styles;
    }
    return {
      selectedOptionStyle: {},
      optionHoverStyle: {},
      textColorStyle: {},
      inputFocusStyle: {},
      inputErrorStyle: {},
      errorMessageStyle: {},
    };
  }, [isPartnerRoute, partner]);

  const {
    selectedOptionStyle,
    optionHoverStyle,
    textColorStyle,
    inputFocusStyle,
    inputErrorStyle,
    errorMessageStyle
  } = partnerStyles;

  // Function to handle manual address navigation
  const handleManualAddressNavigation = () => {
    nextStep({ useManualAddress: true });
  };

  // Function to handle previous manual address navigation
  const handlePreviousManualAddressNavigation = () => {
    nextStep({ previousUseManualAddress: true });
  };

  // Render the appropriate screen based on the current screen number
  const renderScreen = () => {
    switch (currentScreen) {
      case 1:
        return (
          <PostcodeScreen 
            formData={formData}
            setFormData={setFormData}
            nextScreen={nextStep}
            prevStep={prevStep}
            goToManualAddress={handleManualAddressNavigation} // Will navigate to manual address screen
            textColorStyle={textColorStyle}
            isPartnerRoute={isPartnerRoute}
            partner={partner}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
            backButtonId={buttonIds.backButtonId}
            nextButtonId={buttonIds.nextButtonId}
          />
        );
      case 2:
        return (
          <ResidenceDurationScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
            backButtonId={buttonIds.backButtonId}
            nextButtonId={buttonIds.nextButtonId}
          />
        );
      case 3:
        return (
          <ManualAddressScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            textColorStyle={textColorStyle}
            backButtonId={buttonIds.backButtonId}
            nextButtonId={buttonIds.nextButtonId}
          />
        );
      case 4:
        return (
          <HomeownerStatusScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
            backButtonId={buttonIds.backButtonId}
            nextButtonId={buttonIds.nextButtonId}
          />
        );
      case 5:
        return (
          <PropertyValueScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            textColorStyle={textColorStyle}
            inputFocusStyle={inputFocusStyle}
            inputErrorStyle={inputErrorStyle}
            errorMessageStyle={errorMessageStyle}
            backButtonId={buttonIds.backButtonId}
            nextButtonId={buttonIds.nextButtonId}
          />
        );
      case 6:
        return (
          <PreviousAddressScreen 
            formData={formData}
            setFormData={setFormData}
            nextScreen={nextStep}
            prevStep={prevStep}
            goToManualAddress={handlePreviousManualAddressNavigation} // Will navigate to previous manual address screen
            textColorStyle={textColorStyle}
            isPartnerRoute={isPartnerRoute}
            partner={partner}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
            backButtonId={buttonIds.backButtonId}
            nextButtonId={buttonIds.nextButtonId}
          />
        );
      case 7:
        return (
          <PreviousManualAddressScreen 
            formData={formData}
            setFormData={setFormData}
            nextScreen={nextStep}
            prevStep={prevStep}
            textColorStyle={textColorStyle}
            isPartnerRoute={isPartnerRoute}
            partner={partner}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
            backButtonId={buttonIds.backButtonId}
            nextButtonId={buttonIds.nextButtonId}
          />
        );
      default:
        return (
          <PostcodeScreen 
            formData={formData}
            setFormData={setFormData}
            nextScreen={nextStep}
            prevStep={prevStep}
            goToManualAddress={handleManualAddressNavigation}
            textColorStyle={textColorStyle}
            isPartnerRoute={isPartnerRoute}
            partner={partner}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
            backButtonId={buttonIds.backButtonId}
            nextButtonId={buttonIds.nextButtonId}
          />
        );
    }
  };

  return renderScreen();
};

export default ResidentialDetails;