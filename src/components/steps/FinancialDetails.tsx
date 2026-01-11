import React, { useMemo, useEffect } from 'react';
import { usePartner } from '../../partner/PartnerContext';
import { scrollToFormPosition } from '../../utils/scrollUtils';
import { generateButtonIds } from '../../utils/buttonIdGenerator';
import { FormData } from '../../types/FormTypes';
import {
  EmploymentStatusScreen,
  BusinessNameScreen,
  BusinessTypeScreen,
  BusinessRevenueScreen,
  IncomeScreen,
  HousingPaymentScreen,
  BankDetailsScreen
} from '../screens/FinancialDetails';

interface FinancialDetailsProps {
  currentScreen: number;
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const FinancialDetails: React.FC<FinancialDetailsProps> = ({
  currentScreen,
  formData,
  setFormData,
  nextStep,
  prevStep
}) => {
  const { partner, isPartnerRoute } = usePartner();
  
  // Generate button IDs for Google Analytics tracking (FinancialDetails is step 4)
  const buttonIds = useMemo(() => {
    return generateButtonIds(4, currentScreen, formData);
  }, [currentScreen, formData]);

  // Add scroll effect for screen changes
  useEffect(() => {
    // Trigger scroll positioning when screen changes
    scrollToFormPosition(4, currentScreen); // Step 4 for FinancialDetails
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
        styles.optionHoverStyle['--hover-color'] = `${selectButtonBgColor}20`;
        styles.optionHoverStyle['--primary-color'] = selectButtonBgColor;
        styles.optionHoverStyle['--primary-color-light'] = `${selectButtonBgColor}80`;
        styles.optionHoverStyle['--hover-text-color'] = selectButtonBgColor;
      } else if (primaryColor) {
        styles.optionHoverStyle['--hover-color'] = `${primaryColor}20`;
        styles.optionHoverStyle['--primary-color'] = primaryColor;
        styles.optionHoverStyle['--primary-color-light'] = `${primaryColor}80`;
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

  // Simple check if business screens should be shown
  const isBusinessFlow = formData.loanPurpose === 'business' && formData.employmentStatus === 'Self-Employed';

  // Render the appropriate screen based on the current screen number
  const renderScreen = () => {
    // If we're at a screen that doesn't exist for the current flow,
    // move to the next component
    if (!isBusinessFlow && currentScreen > 4) {
      nextStep();
      return null;
    }

    switch (currentScreen) {
      case 1:
        return (
          <EmploymentStatusScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
            buttonIds={buttonIds}
          />
        );
      case 2:
        return isBusinessFlow ? (
          <BusinessNameScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            textColorStyle={textColorStyle}
            inputFocusStyle={inputFocusStyle}
            inputErrorStyle={inputErrorStyle}
            errorMessageStyle={errorMessageStyle}
            buttonIds={buttonIds}
          />
        ) : (
          <IncomeScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            textColorStyle={textColorStyle}
            inputFocusStyle={inputFocusStyle}
            inputErrorStyle={inputErrorStyle}
            errorMessageStyle={errorMessageStyle}
            buttonIds={buttonIds}
          />
        );
      case 3:
        return isBusinessFlow ? (
          <BusinessTypeScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
            buttonIds={buttonIds}
          />
        ) : (
          <HousingPaymentScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            textColorStyle={textColorStyle}
            inputFocusStyle={inputFocusStyle}
            inputErrorStyle={inputErrorStyle}
            errorMessageStyle={errorMessageStyle}
            buttonIds={buttonIds}
          />
        );
      case 4:
        return isBusinessFlow ? (
          <BusinessRevenueScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            textColorStyle={textColorStyle}
            inputFocusStyle={inputFocusStyle}
            inputErrorStyle={inputErrorStyle}
            errorMessageStyle={errorMessageStyle}
            buttonIds={buttonIds}
          />
        ) : (
          <BankDetailsScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            textColorStyle={textColorStyle}
            inputFocusStyle={inputFocusStyle}
            inputErrorStyle={inputErrorStyle}
            errorMessageStyle={errorMessageStyle}
            buttonIds={buttonIds}
          />
        );
      case 5:
        return isBusinessFlow ? (
          <IncomeScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            textColorStyle={textColorStyle}
            inputFocusStyle={inputFocusStyle}
            inputErrorStyle={inputErrorStyle}
            errorMessageStyle={errorMessageStyle}
            buttonIds={buttonIds}
          />
        ) : null;
      case 6:
        return isBusinessFlow ? (
          <HousingPaymentScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            textColorStyle={textColorStyle}
            inputFocusStyle={inputFocusStyle}
            inputErrorStyle={inputErrorStyle}
            errorMessageStyle={errorMessageStyle}
            buttonIds={buttonIds}
          />
        ) : null;
      case 7:
        return isBusinessFlow ? (
          <BankDetailsScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            textColorStyle={textColorStyle}
            inputFocusStyle={inputFocusStyle}
            inputErrorStyle={inputErrorStyle}
            errorMessageStyle={errorMessageStyle}
            buttonIds={buttonIds}
          />
        ) : null;
      default:
        return (
          <EmploymentStatusScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
            buttonIds={buttonIds}
          />
        );
    }
  };

  return renderScreen();
};

export default FinancialDetails; 