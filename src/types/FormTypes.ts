// Type definitions for better type safety
export interface EmailValidation {
  isValid: boolean;
  score?: number;
  errors?: string[];
  token?: string;
  validationStatus?: 'pending' | 'valid' | 'invalid' | 'blacklisted';
}

export interface Country {
  id: string;
  name: string;
  code: string;
  flag?: string;
}

export interface FormData {
  // Loan Details
  loanAmount: string;
  loanTerm: string;
  loanPurpose: string;
  carLoanPurpose?: string;
  
  // Personal Details
  title?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  displayDOB?: string; // Formatted display version
  email?: string;
  emailValidation?: EmailValidation; // Email validation state object
  mobile?: string;
  isPhoneVerified?: boolean;
  verifiedMobile?: string;
  maritalStatus?: string;
  dependents?: string;
  
  // Current Address & Residential Details
  postcode?: string;
  selectedAddress?: {
    AddressID: string;
    EquifaxAddressID: string;
    FullAddress: string;
    PostTown: string;
    PostCode: string;
    HouseNumber: string;
    FlatNumber: string;
    HouseName: string;
    Street1: string;
    Street2: string;
    District: string;
    County: string;
    City: string;
    Country: string;
  }; // API selected address object
  useManualAddress?: boolean;
  fullAddress?: string;
  houseNumber?: string;
  houseName?: string;
  flatNumber?: string;
  street?: string;
  street1?: string;
  street2?: string;
  city?: string;
  county?: string;
  district?: string;
  country?: string;
  residenceDuration?: number;
  homeownerStatus?: string;
  propertyValue?: string;
  comeBackToPropertyScreen?: boolean;
  
  // Previous Address Details
  previousCountry?: Country; // Country object
  previousPostcode?: string;
  previousSelectedAddress?: {
    AddressID: string;
    EquifaxAddressID: string;
    FullAddress: string;
    PostTown: string;
    PostCode: string;
    HouseNumber: string;
    FlatNumber: string;
    HouseName: string;
    Street1: string;
    Street2: string;
    District: string;
    County: string;
    City: string;
    Country: string;
  };
  previousUseManualAddress?: boolean;
  previousHouseNumber?: string;
  previousHouseName?: string;
  previousFlatNumber?: string;
  previousStreet?: string;
  previousCity?: string;
  previousCounty?: string;
  
  // International Previous Address
  previousinternationaladdressPostcode?: string;
  previousinternationaladdressAddressLine1?: string;
  previousinternationaladdressHouseNumber?: string;
  previousinternationaladdressHouseName?: string;
  previousinternationaladdressFlatNumber?: string;
  previousinternationaladdressCity?: string;
  previousinternationaladdressState?: string;
  isAddressValid?: boolean;
  
  // Financial Details
  employmentStatus?: string;
  income?: string;
  housingPayment?: string; // Monthly rent/mortgage payment
  bankAccountNumber?: string;
  sortCode?: string;
  
  // Business Details (for self-employed users)
  businessName?: string;
  businessType?: string;
  businessRevenue?: string;
  
  // Application & System Fields
  applicationId?: string;
  is_new_immigrant?: boolean;

  // Detailed Consent Fields
  // Legal Terms Consent (always true upon submission)
  allLegalTermsConsent?: boolean;

  // Application Consent Fields (true when terms are accepted)
  applicationSmsConsent?: boolean;
  applicationEmailConsent?: boolean;
  applicationPhoneConsent?: boolean;
  applicationPostConsent?: boolean;

  // Marketing Consent Fields (based on marketing checkbox)
  marketingSmsConsent?: boolean;
  marketingEmailConsent?: boolean;
  marketingPhoneConsent?: boolean;
  marketingPostConsent?: boolean;

  // Custom consent fields (partner-specific)
  customConsent1?: boolean;
  customConsent2?: boolean;
  customConsent3?: boolean;
} 