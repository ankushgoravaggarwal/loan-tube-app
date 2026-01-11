// Functionality for generating dynamic button ids for Google Analytics tracking
import { FormData } from '../types/FormTypes';

export const getScreenName = (step: number, screen: number, formData?: FormData): string => {
  switch (step) {
    case 1: // LoanDetails
      switch (screen) {
        case 1: return "step1_loan_amount_screen";
        case 2: return "step1_loan_term_screen";
        case 3: return "step1_loan_purpose_screen";
        case 4: return "step1_car_loan_purpose_screen";
        default: return `step1_screen_${screen}`;
      }

    case 2: // PersonalDetails
      switch (screen) {
        case 1: return "step2_title_selection_screen";
        case 2: return "step2_name_input_screen";
        case 3: return "step2_date_of_birth_screen";
        case 4: return "step2_email_address_screen";
        case 5: return "step2_mobile_number_screen";
        case 6: return "step2_otp_verification_screen";
        case 7: return "step2_marital_status_screen";
        case 8: return "step2_dependents_screen";
        default: return `step2_screen_${screen}`;
      }

    case 3: // ResidentialDetails
      switch (screen) {
        case 1: return "step3_postcode_lookup_screen";
        case 2: return "step3_residence_duration_screen";
        case 3: return "step3_manual_address_screen";
        case 4: return "step3_homeowner_status_screen";
        case 5: return "step3_property_value_screen";
        case 6: return "step3_previous_address_lookup_screen";
        case 7: return "step3_previous_manual_address_screen";
        default: return `step3_screen_${screen}`;
      }

    case 4: // FinancialDetails
      const isBusinessFlow = formData?.loanPurpose === 'business' && formData?.employmentStatus === 'Self-Employed';
      
      switch (screen) {
        case 1: return "step4_employment_status_screen";
        case 2: 
          return isBusinessFlow 
            ? "step4_business_name_screen" 
            : "step4_monthly_income_screen";
        case 3: 
          return isBusinessFlow 
            ? "step4_business_type_screen" 
            : "step4_housing_payment_screen";
        case 4: 
          return isBusinessFlow 
            ? "step4_business_revenue_screen" 
            : "step4_bank_details_screen";
        case 5: return "step4_monthly_income_business_flow_screen";
        case 6: return "step4_housing_payment_business_flow_screen";
        case 7: return "step4_bank_details_business_flow_screen";
        default: return `step4_screen_${screen}`;
      }

    case 5: // ApplicationSubmission
      switch (screen) {
        case 1: return "step5_application_summary_screen";
        default: return `step5_screen_${screen}`;
      }

    default:
      return `step${step}_screen_${screen}`;
  }
};

// Generate button IDs for Google Analytics tracking
export const generateButtonIds = (step: number, screen: number, formData?: FormData) => {
  const screenName = getScreenName(step, screen, formData);
  
  return {
    nextButtonId: `${screenName}_next_button`,
    backButtonId: `${screenName}_back_button`,
    submitButtonId: `${screenName}_submit_button`,
    ctaButtonId: `${screenName}_cta_button`
  };
}; 