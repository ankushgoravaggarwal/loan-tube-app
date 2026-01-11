import React, { useMemo } from 'react';
import { usePartner } from '../../partner/PartnerContext';
import { generateButtonIds } from '../../utils/buttonIdGenerator';
import { FormData } from '../../types/FormTypes';
import {
  LoanAmountScreen,
  LoanTermScreen,
  LoanPurposeScreen,
  CarLoanPurposeScreen
} from '../screens/LoanDetails';

interface LoanDetailsProps {
  currentScreen: number;
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: () => void;
  prevStep?: () => void;
  setCurrentScreen?: (screen: number) => void;
}

const LoanDetails: React.FC<LoanDetailsProps> = ({ 
  currentScreen, 
  formData, 
  setFormData, 
  nextStep,
  prevStep,
  setCurrentScreen
}) => {
  const { partner, isPartnerRoute } = usePartner();
  
  // Generate button IDs for Google Analytics tracking
  const buttonIds = useMemo(() => {
    return generateButtonIds(1, currentScreen, formData);
  }, [currentScreen, formData]);
  
  // Consolidate all style calculations into a single useMemo
  const memoizedStyles = useMemo(() => {
    if (!isPartnerRoute || !partner) {
      return {
        buttonStyle: {},
        selectedOptionStyle: {},
        optionHoverStyle: {},
        textColorStyle: {},
        inputFocusStyle: {},
        inputErrorStyle: {},
        errorMessageStyle: {}
      };
    }

    const buttonStyle: React.CSSProperties = {};
    if (partner?.navbar_button_background_color) {
      buttonStyle.backgroundColor = partner.navbar_button_background_color;
    } else {
      buttonStyle.backgroundColor = partner.primary_color ?? undefined;
    }
    if (partner?.navbar_button_text_color) {
      buttonStyle.color = partner.navbar_button_text_color;
    } else {
      buttonStyle.color = undefined;
    }
    if (partner?.shadow_enabled && partner?.shadow_color) {
      buttonStyle.boxShadow = `0 4px 8px ${partner.shadow_color}`;
    } else if (partner?.shadow_enabled === false) {
      buttonStyle.boxShadow = 'none';
    } else {
      buttonStyle.boxShadow = undefined;
    }

    const selectedOptionStyle: React.CSSProperties = {};
    if (partner?.select_button_background_color) {
      selectedOptionStyle.backgroundColor = partner.select_button_background_color;
      selectedOptionStyle.borderColor = partner.select_button_background_color;
    } else if (partner?.primary_color) {
      selectedOptionStyle.backgroundColor = partner.primary_color;
      selectedOptionStyle.borderColor = partner.primary_color;
    } else {
      selectedOptionStyle.backgroundColor = undefined;
      selectedOptionStyle.borderColor = undefined;
    }
    if (partner?.select_button_text_color) {
      selectedOptionStyle.color = partner.select_button_text_color;
    } else {
      selectedOptionStyle.color = undefined;
    }

    const optionHoverStyle: React.CSSProperties = {};
    if (partner?.select_button_background_color) {
      optionHoverStyle['--hover-color'] = `${partner.select_button_background_color}20`;
      optionHoverStyle['--primary-color'] = partner.select_button_background_color;
      optionHoverStyle['--primary-color-light'] = `${partner.select_button_background_color}80`;
      optionHoverStyle['--hover-text-color'] = partner.select_button_background_color;
    } else if (partner?.primary_color) {
      optionHoverStyle['--hover-color'] = `${partner.primary_color}20`;
      optionHoverStyle['--primary-color'] = partner.primary_color;
      optionHoverStyle['--primary-color-light'] = `${partner.primary_color}80`;
      optionHoverStyle['--hover-text-color'] = partner.primary_color;
    } else {
      optionHoverStyle['--hover-color'] = undefined;
      optionHoverStyle['--primary-color'] = undefined;
      optionHoverStyle['--primary-color-light'] = undefined;
      optionHoverStyle['--hover-text-color'] = undefined;
    }

    const textColorStyle: React.CSSProperties = {};
    if (partner?.primary_color) {
      textColorStyle.color = partner.primary_color;
    } else {
      textColorStyle.color = undefined;
    }

    const inputFocusStyle: React.CSSProperties = {};
    if (partner?.error_input_focus_color) {
      inputFocusStyle.borderColor = partner.error_input_focus_color;
    } else {
      inputFocusStyle.borderColor = undefined;
    }

    const inputErrorStyle: React.CSSProperties = {};
    if (partner?.error_input_focus_color) {
      inputErrorStyle.borderColor = partner.error_input_focus_color;
    } else {
      inputErrorStyle.borderColor = undefined;
    }

    const errorMessageStyle: React.CSSProperties = {};
    if (partner?.error_input_focus_color) {
      errorMessageStyle.color = partner.error_input_focus_color;
    } else {
      errorMessageStyle.color = undefined;
    }

    return {
      buttonStyle,
      selectedOptionStyle,
      optionHoverStyle,
      textColorStyle,
      inputFocusStyle,
      inputErrorStyle,
      errorMessageStyle
    };
  }, [isPartnerRoute, partner]);

  const {
    buttonStyle,
    selectedOptionStyle,
    optionHoverStyle,
    textColorStyle,
    inputFocusStyle,
    inputErrorStyle,
    errorMessageStyle
  } = memoizedStyles;

  // Render the appropriate screen based on the current screen number
  const renderScreen = () => {
    switch (currentScreen) {
      case 1:
        return (
          <LoanAmountScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            buttonStyle={buttonStyle}
            textColorStyle={textColorStyle}
            inputFocusStyle={inputFocusStyle}
            inputErrorStyle={inputErrorStyle}
            errorMessageStyle={errorMessageStyle}
            buttonIds={{
              ctaButtonId: buttonIds.ctaButtonId
            }}
          />
        );
      case 2:
        return (
          <LoanTermScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
            buttonIds={{
              backButtonId: buttonIds.backButtonId,
              nextButtonId: buttonIds.nextButtonId
            }}
          />
        );
      case 3:
        return (
          <LoanPurposeScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            setCurrentScreen={setCurrentScreen}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
            buttonIds={{
              backButtonId: buttonIds.backButtonId,
              nextButtonId: buttonIds.nextButtonId
            }}
          />
        );
      case 4:
        return (
          <CarLoanPurposeScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
            buttonIds={{
              backButtonId: buttonIds.backButtonId,
              nextButtonId: buttonIds.nextButtonId
            }}
          />
        );
      default:
        return (
          <LoanAmountScreen
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            buttonStyle={buttonStyle}
            textColorStyle={textColorStyle}
            inputFocusStyle={inputFocusStyle}
            inputErrorStyle={inputErrorStyle}
            errorMessageStyle={errorMessageStyle}
            buttonIds={{
              ctaButtonId: buttonIds.ctaButtonId
            }}
          />
        );
    }
  };

  return renderScreen();
};

export default LoanDetails; 