// API layer 
import { FormData } from '../types/FormTypes';

// Backend base URL - centralized configuration
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8081';

// Environment variables configuration
const API_CONFIG = {
  EMAIL_TOKEN_API_URL: import.meta.env.VITE_EMAIL_TOKEN_API_URL as string,
  EMAIL_VALIDATION_API_URL: import.meta.env.VITE_EMAIL_VALIDATION_API_URL as string,
  OTP_API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
  RECAPTCHA_BACKEND_URL: import.meta.env.VITE_API_BACKEND_URL as string,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  POSTCODE_API_URL: 'https://www.loantube.com/postcode/validate.php',
  AUDIT_API_URL: 'https://www.emailvalidation.xyz/audit/submitapplication.php',
  // Leads API URL - constructed from centralized backend base URL
  LEADS_API_URL: import.meta.env.VITE_LEADS_API_URL || `${BACKEND_BASE_URL}/api/leads`
};

// Types and interfaces
export interface APIResponse {
  success?: boolean;
  token?: string;
  message?: string;
  result?: boolean;
  error?: string;
  valid?: boolean | string;
  isValid?: boolean;
  response?: Response;
  text?: string;
  data?: APIResponse;
}

export interface Address {
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
}

export interface PostcodeResponse {
  AddressList: Address[];
}

export interface RecaptchaRequest {
  token: string;
  action: string;
  version: string;
}

export interface RecaptchaResponse {
  score: number;
  success?: boolean;
}

// Lead Request Interface (matching backend schema)
export interface LeadRequest {
  // Affiliate Credentials (Required)
  apiId: string;
  apiPassword: string;
  
  // Update Request Fields (Optional)
  leadId?: number;
  version?: number;
  
  // Lead Type & Source (Optional)
  isDirectLead?: boolean;
  sourceId?: string;
  subSourceId?: string;
  landingUrl?: string;
  isMobileApp?: boolean;
  marketingEmail?: boolean;
  marketingPhone?: boolean;
  marketingSMS?: boolean;
  
  // Loan Details (Required)
  loanAmount: number;
  loanDurationMonths: number;
  loanPurpose?: string;
  
  // Personal Details (Required)
  title?: string;
  gender?: string;
  firstName: string;
  lastName: string;
  dob: string; // Format: "YYYY-MM-DD"
  email: string;
  homePhone?: string;
  cellPhone: string;
  workPhone?: string;
  maritalStatus?: string;
  numberOfDependents?: number;
  
  // Address Details (Required)
  postCode: string;
  houseNumber?: string;
  flatNumber?: string;
  houseName?: string;
  street?: string;
  city?: string;
  county?: string;
  monthsAtAddress?: number;
  residentialStatus?: string;
  
  // Income Details (Required)
  netMonthlyIncome?: number;
  grossMonthlyIncome?: number;
  otherMonthlyIncome?: number;
  expenseHousing?: number;
  expenseAllLoans?: number;
  expenseFood?: number;
  expenseUtilities?: number;
  expenseTransport?: number;
  expenseOther?: number;
  
  // Employment Details (Required)
  workCompanyName?: string;
  workIndustry?: string;
  workTimeAtEmployer?: number;
  employmentType?: string;
  occupation?: string;
  
  // Bank Details (Required)
  bankName?: string;
  bankDebitCardType?: string;
  bankAccountNumber: string;
  bankSortCode: string;
  
  // Payment Details (Optional)
  incomePaymentFrequency?: string;
  incomeNextDate1?: string;
  
  // Business Details (Optional)
  businessType?: string;
  annualRevenueOfBusiness?: number;
  monthsInBusiness?: number;
  
  // Marketing Consents (Optional)
  consentDataProcessing?: boolean;
  consentCreditSearch?: boolean;
  consentFinancial?: boolean;
  consentTerms?: boolean;
  consentContact?: boolean;
  thirdPartyEmail?: boolean;
  thirdPartyPhone?: boolean;
  thirdPartyTextMessage?: boolean;
  
  // Technical Details (Optional)
  price?: number;
  userAgent?: string;
  userIp?: string;
  
  // Property Details (Optional)
  propertyValue?: number;
  mortgageBalance?: number;
  propertyMortgageAmount?: number;
  
  // Additional fields from React app (will be included as extra keys)
  [key: string]: unknown;
}

// Lead Response Interface
export interface LeadResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: {
    lead_id?: string;
    status?: string;
    status_text?: string;
    redirect_url?: string;
    price?: number;
    timestamp?: string;
    processing_time?: number;
    error?: string;
  };
  isBase64Encoded?: boolean;
}

// Base fetch wrapper with error handling
const baseFetch = async (
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Email Validation API Service
export class EmailValidationAPI {
  // Get authentication token for email validation
  static async getToken(email: string): Promise<{ token: string }> {
    if (!API_CONFIG.EMAIL_TOKEN_API_URL) {
      throw new Error('Email token API URL not configured');
    }

    const response = await baseFetch(API_CONFIG.EMAIL_TOKEN_API_URL, {
      method: 'POST',
      headers: { 
        'Accept': 'application/json', 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ email }),
      keepalive: true
    }, 6000);

    if (!response.ok) {
      const errorMsg = response.status === 429 
        ? 'Too many token requests. Please wait before trying again.' 
        : `Token request failed: ${response.status}`;
      throw new Error(errorMsg);
    }

    return await response.json();
  }

  // Validate email with API
  static async validateEmail(email: string, authToken: string): Promise<boolean> {
    if (!API_CONFIG.EMAIL_VALIDATION_API_URL) {
      throw new Error('Email validation API URL not configured');
    }

    const url = new URL(API_CONFIG.EMAIL_VALIDATION_API_URL);
    url.searchParams.append('email', email);
    url.searchParams.append('token', authToken);

    const response = await baseFetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Validation-Token': authToken
      },
      keepalive: true,
    }, 5000);

    if (!response.ok) {
      if (response.status === 401) throw new Error('Authentication failed');
      
      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({ error: 'Rate limited' }));
        // Check if it's a blacklist error
        if (errorData.error?.includes('blacklisted') || 
            errorData.error?.includes('Rate limit exceeded') ||
            errorData.error?.includes('excessive requests') ||
            errorData.error?.includes('Email validation limit exceeded') ||
            errorData.error?.includes('temporarily blacklisted')) {
          throw new Error('BLACKLISTED_EMAIL');
        }
        throw new Error(errorData.error || 'Rate limited');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: APIResponse = await response.json();
    
    // Also check if the response data indicates blacklisting
    if (data.error && (
        data.error.includes('blacklisted') || 
        data.error.includes('Email validation limit exceeded') ||
        data.error.includes('temporarily blacklisted') ||
        data.error.includes('excessive requests')
    )) {
      throw new Error('BLACKLISTED_EMAIL');
    }

    return data.valid === true || data.valid === "true" || data.isValid === true;
  }
}

// OTP API Service
export class OTPAPI {
  // Send OTP
  static async sendOTP(phoneNumber: string): Promise<APIResponse> {
    if (!API_CONFIG.OTP_API_BASE_URL) {
      throw new Error('OTP API base URL not configured');
    }

    const response = await baseFetch(`${API_CONFIG.OTP_API_BASE_URL}/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone_number: phoneNumber }),
    });

    const responseText = await response.text();
    let data: APIResponse = {};

    if (responseText && responseText.trim() !== '') {
      try {
        data = JSON.parse(responseText) as APIResponse;
      } catch (_parseError) {
        throw new Error('Invalid response from server. Please try again.');
      }
    }

    if (!response.ok) {
      throw new Error('Network error. Please try again.');
    }

    return data;
  }

  // Resend OTP
  static async resendOTP(token: string): Promise<APIResponse> {
    if (!API_CONFIG.OTP_API_BASE_URL) {
      throw new Error('OTP API base URL not configured');
    }

    const response = await baseFetch(`${API_CONFIG.OTP_API_BASE_URL}/otp/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const responseText = await response.text();
    let data: APIResponse = {};

    if (responseText && responseText.trim() !== '') {
      try {
        data = JSON.parse(responseText) as APIResponse;
      } catch (_parseError) {
        throw new Error('Invalid response from server. Please try again.');
      }
    }

    return { success: response.ok, response, data, text: responseText };
  }

  // Verify OTP
  static async verifyOTP(token: string, otp: string): Promise<APIResponse> {
    if (!API_CONFIG.OTP_API_BASE_URL) {
      throw new Error('OTP API base URL not configured');
    }

    const response = await baseFetch(`${API_CONFIG.OTP_API_BASE_URL}/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, otp }),
    });

    const responseText = await response.text();
    let data: APIResponse = {};

    if (responseText && responseText.trim() !== '') {
      try {
        data = JSON.parse(responseText) as APIResponse;
      } catch (_parseError) {
        throw new Error('Invalid response from server. Please try again.');
      }
    }

    return { success: response.ok, response, data, text: responseText };
  }

  // Send WhatsApp code
  static async sendWhatsAppCode(token: string): Promise<APIResponse> {
    if (!API_CONFIG.OTP_API_BASE_URL) {
      throw new Error('OTP API base URL not configured');
    }

    const response = await baseFetch(`${API_CONFIG.OTP_API_BASE_URL}/otp/resend/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const responseText = await response.text();
    let data: APIResponse = {};

    if (responseText && responseText.trim() !== '') {
      try {
        data = JSON.parse(responseText) as APIResponse;
      } catch (_parseError) {
        throw new Error('Invalid response from server. Please try again.');
      }
    }

    return { success: response.ok, response, data, text: responseText };
  }
}

// reCAPTCHA API Service
export class RecaptchaAPI {
  // Verify reCAPTCHA token
  static async verifyRecaptcha(token: string, action: string): Promise<RecaptchaResponse> {
    if (!API_CONFIG.RECAPTCHA_BACKEND_URL) {
      throw new Error('reCAPTCHA backend URL not configured');
    }

    const response = await baseFetch(API_CONFIG.RECAPTCHA_BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, action, version: 'v3' } as RecaptchaRequest),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Postcode API Service
export class PostcodeAPI {
  // Validate postcode and get addresses
  static async validatePostcode(postcode: string): Promise<PostcodeResponse> {
    const normalizedPostcode = postcode.replace(/\s/g, '');

    const response = await baseFetch(`${API_CONFIG.POSTCODE_API_URL}?postcode=${normalizedPostcode}`);

    if (!response.ok) {
      throw new Error('Error fetching addresses. Please try again.');
    }

    const data = await response.json();

    if (!data || !data.AddressList || data.AddressList.length === 0) {
      throw new Error('No addresses found for this postcode');
    }

    return data;
  }
}

// Audit API Service
export class AuditAPI {
  // Submit audit details
  static async submitAudit(auditDetails: Record<string, unknown>): Promise<{ success: boolean; message?: string }> {
    const requestBody = {
      auditDetails: auditDetails,
    };
    
    // Log the data being sent to backend (for debugging)
    console.log('📤 Sending data to backend:', {
      url: API_CONFIG.AUDIT_API_URL,
      applicationId: auditDetails.applicationId,
      dataSize: JSON.stringify(requestBody).length,
      hasScreenshot: !!auditDetails.screenshot,
      screenshotSize: auditDetails.screenshot ? (auditDetails.screenshot as string).length : 0,
      userDataHashes: auditDetails.userDataHashes,
      auditHashChain: auditDetails.auditHashChain,
      fullPayload: requestBody
    });
    
    const response = await baseFetch(API_CONFIG.AUDIT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Backend submission failed: ${response.status}`);
    }

    return await response.json();
  }
}

// Utility function to check API configuration
export const checkAPIConfig = () => {
  const missingConfigs = [];
  
  if (!API_CONFIG.EMAIL_TOKEN_API_URL) missingConfigs.push('VITE_EMAIL_TOKEN_API_URL');
  if (!API_CONFIG.EMAIL_VALIDATION_API_URL) missingConfigs.push('VITE_EMAIL_VALIDATION_API_URL');
  if (!API_CONFIG.OTP_API_BASE_URL) missingConfigs.push('VITE_API_BASE_URL');
  if (!API_CONFIG.SUPABASE_URL) missingConfigs.push('VITE_SUPABASE_URL');
  if (!API_CONFIG.SUPABASE_ANON_KEY) missingConfigs.push('VITE_SUPABASE_ANON_KEY');

  return {
    isValid: missingConfigs.length === 0,
    missingConfigs
  };
};

// Leads API Service
export class LeadsAPI {
  // Map FormData to LeadRequest format
  static mapFormDataToLeadRequest(formData: FormData, extraFields?: Record<string, unknown>): LeadRequest {
    // Helper to convert string to number
    const toNumber = (value: string | undefined): number | undefined => {
      if (!value) return undefined;
      const num = parseFloat(value);
      return isNaN(num) ? undefined : num;
    };

    // Helper to convert string to integer
    const toInt = (value: string | undefined): number | undefined => {
      if (!value) return undefined;
      const num = parseInt(value, 10);
      return isNaN(num) ? undefined : num;
    };

    // Helper to format date to YYYY-MM-DD
    const formatDate = (dateStr: string | undefined): string | undefined => {
      if (!dateStr) return undefined;
      // Handle different date formats
      if (dateStr.includes('-')) {
        // Already in YYYY-MM-DD or similar format
        const parts = dateStr.split(/[-/]/);
        if (parts.length === 3) {
          // Try to determine format
          if (parts[0].length === 4) {
            // YYYY-MM-DD
            return dateStr;
          } else {
            // DD/MM/YYYY or DD-MM-YYYY
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
      } else if (dateStr.includes('/')) {
        // DD/MM/YYYY format
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      return dateStr;
    };

    // Helper to get gender from title
    const getGenderFromTitle = (title: string | undefined): string | undefined => {
      if (!title) return undefined;
      const titleLower = title.toLowerCase();
      if (['mr'].includes(titleLower)) return 'Male';
      if (['mrs', 'ms', 'miss'].includes(titleLower)) return 'Female';
      return undefined;
    };

    // Helper to map marital status
    const mapMaritalStatus = (status: string | undefined): string | undefined => {
      if (!status) return undefined;
      const statusLower = status.toLowerCase();
      const mapping: Record<string, string> = {
        'single': 'Single',
        'married': 'Married',
        'divorced': 'Divorced',
        'separated': 'Separated',
        'widowed': 'Widowed',
        'civil_partnership': 'Civil Partnership',
        'living_with_partner': 'Living with Partner'
      };
      return mapping[statusLower] || status;
    };

    // Helper to map employment status
    const mapEmploymentType = (status: string | undefined): string | undefined => {
      if (!status) return undefined;
      const statusLower = status.toLowerCase();
      const mapping: Record<string, string> = {
        'employed': 'Employed-Full Time',
        'self_employed': 'Self-Employed',
        'unemployed': 'Unemployed',
        'retired': 'Retired',
        'student': 'Student',
        'homemaker': 'Homemaker'
      };
      return mapping[statusLower] || status;
    };

    // Helper to map residential status
    const mapResidentialStatus = (status: string | undefined): string | undefined => {
      if (!status) return undefined;
      const statusLower = status.toLowerCase();
      const mapping: Record<string, string> = {
        'owner': 'Home Owner (Mortgage Free)',
        'owner_with_mortgage': 'Home Owner (With Mortgage)',
        'tenant': 'Private Tenant',
        'living_with_family': 'Living with Family',
        'council_tenant': 'Council Tenant'
      };
      return mapping[statusLower] || status;
    };

    // Get address fields (prefer selectedAddress if available)
    const address: Partial<Address> = formData.selectedAddress || {};
    const street = address.Street1 || formData.street || formData.street1 || '';
    const city = address.City || formData.city || address.PostTown || '';
    const county = address.County || formData.county || '';
    const houseNumber = address.HouseNumber || formData.houseNumber || '';
    const flatNumber = address.FlatNumber || formData.flatNumber || '';
    const houseName = address.HouseName || formData.houseName || '';

    // Build the lead request
    const leadRequest: LeadRequest = {
      // Affiliate Credentials (Hardcoded as per requirements)
      apiId: 'loantubedirect',
      apiPassword: 'LoanTubeDirect2024!@#$',
      
      // Loan Details
      loanAmount: toNumber(formData.loanAmount) || 0,
      loanDurationMonths: toInt(formData.loanTerm) || 0,
      loanPurpose: formData.loanPurpose,
      
      // Personal Details
      title: formData.title,
      gender: getGenderFromTitle(formData.title),
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      dob: formatDate(formData.dateOfBirth) || '',
      email: formData.email?.toLowerCase() || '',
      cellPhone: formData.verifiedMobile || formData.mobile || '',
      homePhone: undefined, // Not collected in form
      workPhone: undefined, // Not collected in form
      maritalStatus: mapMaritalStatus(formData.maritalStatus),
      numberOfDependents: toInt(formData.dependents),
      
      // Address Details
      postCode: formData.postcode || address.PostCode || '',
      houseNumber: houseNumber || undefined,
      flatNumber: flatNumber || undefined,
      houseName: houseName || undefined,
      street: street || undefined,
      city: city || undefined,
      county: county || undefined,
      monthsAtAddress: formData.residenceDuration,
      residentialStatus: mapResidentialStatus(formData.homeownerStatus),
      
      // Income Details
      netMonthlyIncome: toNumber(formData.income),
      grossMonthlyIncome: undefined, // Not collected separately
      otherMonthlyIncome: 0,
      expenseHousing: toNumber(formData.housingPayment),
      expenseAllLoans: undefined,
      expenseFood: undefined,
      expenseUtilities: undefined,
      expenseTransport: undefined,
      expenseOther: undefined,
      
      // Employment Details
      employmentType: mapEmploymentType(formData.employmentStatus),
      workCompanyName: undefined, // Not collected in form
      workIndustry: undefined, // Not collected in form
      workTimeAtEmployer: undefined, // Not collected in form
      occupation: undefined, // Not collected in form
      
      // Bank Details
      bankAccountNumber: formData.bankAccountNumber || '',
      bankSortCode: formData.sortCode?.replace(/-/g, '') || '',
      bankName: undefined, // Will be auto-looked up by backend
      bankDebitCardType: undefined, // Not collected in form
      
      // Business Details (for self-employed)
      businessType: formData.employmentStatus?.toLowerCase() === 'self_employed' 
        ? (formData.businessType || 'Sole Trader')
        : undefined,
      annualRevenueOfBusiness: toNumber(formData.businessRevenue),
      monthsInBusiness: undefined, // Will be auto-set by backend if self-employed
      
      // Marketing Consents
      marketingEmail: formData.marketingEmailConsent || false,
      marketingPhone: formData.marketingPhoneConsent || false,
      marketingSMS: formData.marketingSmsConsent || false,
      consentDataProcessing: formData.allLegalTermsConsent || false,
      consentCreditSearch: formData.allLegalTermsConsent || false,
      consentFinancial: formData.allLegalTermsConsent || false,
      consentTerms: formData.allLegalTermsConsent || false,
      consentContact: formData.allLegalTermsConsent || false,
      thirdPartyEmail: formData.marketingEmailConsent || false,
      thirdPartyPhone: formData.marketingPhoneConsent || false,
      thirdPartyTextMessage: formData.marketingSmsConsent || false,
      
      // Property Details
      propertyValue: toNumber(formData.propertyValue),
      mortgageBalance: undefined,
      propertyMortgageAmount: undefined,
      
      // Technical Details
      userAgent: navigator.userAgent,
      userIp: undefined, // Would need to be collected from backend
      
      // Lead Type & Source
      isDirectLead: false,
      isMobileApp: /Mobi|Android/i.test(navigator.userAgent),
      landingUrl: window.location.href,
      
      // Include all extra fields from formData that aren't mapped
      ...extraFields
    };

    // Include any unmapped fields from formData as extra keys
    const mappedKeys = new Set([
      'loanAmount', 'loanTerm', 'loanPurpose', 'carLoanPurpose',
      'title', 'firstName', 'lastName', 'dateOfBirth', 'displayDOB', 'email', 'mobile', 'verifiedMobile', 'maritalStatus', 'dependents',
      'postcode', 'selectedAddress', 'useManualAddress', 'fullAddress', 'houseNumber', 'houseName', 'flatNumber', 'street', 'street1', 'street2', 'city', 'county', 'district', 'country', 'residenceDuration', 'homeownerStatus', 'propertyValue',
      'employmentStatus', 'income', 'housingPayment', 'bankAccountNumber', 'sortCode',
      'businessName', 'businessType', 'businessRevenue',
      'applicationId', 'is_new_immigrant',
      'allLegalTermsConsent', 'applicationSmsConsent', 'applicationEmailConsent', 'applicationPhoneConsent', 'applicationPostConsent',
      'marketingSmsConsent', 'marketingEmailConsent', 'marketingPhoneConsent', 'marketingPostConsent',
      'customConsent1', 'customConsent2', 'customConsent3',
      'emailValidation', 'isPhoneVerified', 'comeBackToPropertyScreen', 'isAddressValid'
    ]);

    // Add unmapped formData fields as extra keys
    Object.keys(formData).forEach(key => {
      if (!mappedKeys.has(key) && formData[key as keyof FormData] !== undefined && formData[key as keyof FormData] !== null) {
        const value = formData[key as keyof FormData];
        // Only add if it's a simple type (not complex objects that are already handled)
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          leadRequest[key] = value;
        } else if (Array.isArray(value) || (typeof value === 'object' && value !== null && !(value instanceof Date))) {
          // Include complex objects/arrays as JSON
          leadRequest[key] = value;
        }
      }
    });

    // Remove undefined values to keep payload clean
    Object.keys(leadRequest).forEach(key => {
      if (leadRequest[key] === undefined) {
        delete leadRequest[key];
      }
    });

    return leadRequest;
  }

  // Submit lead to backend
  static async submitLead(formData: FormData, extraFields?: Record<string, unknown>): Promise<LeadResponse> {
    if (!API_CONFIG.LEADS_API_URL) {
      throw new Error('Leads API URL not configured');
    }

    // Map form data to lead request format
    const leadRequest = this.mapFormDataToLeadRequest(formData, extraFields);
    
    // Log the request being sent
    console.log('📤 Submitting lead to backend:', {
      url: API_CONFIG.LEADS_API_URL,
      loanAmount: leadRequest.loanAmount,
      firstName: leadRequest.firstName,
      lastName: leadRequest.lastName,
      email: leadRequest.email,
      cellPhone: leadRequest.cellPhone,
      fullRequest: leadRequest
    });

    const response = await baseFetch(API_CONFIG.LEADS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(leadRequest),
    });

    let responseData: LeadResponse;

    try {
      // Try to parse as JSON first
      const responseText = await response.text();
      responseData = JSON.parse(responseText) as LeadResponse;
      
      // If body is a string, parse it
      if (typeof responseData.body === 'string') {
        try {
          responseData.body = JSON.parse(responseData.body);
        } catch {
          // If parsing fails, keep as string
        }
      }
    } catch (parseError) {
      throw new Error(`Invalid response from server: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    if (!response.ok) {
      const errorMsg = typeof responseData.body === 'object' && responseData.body?.error 
        ? responseData.body.error 
        : `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    console.log('✅ Lead submitted successfully:', responseData);
    return responseData;
  }
}

// Application Result Response Interfaces
export interface Offer {
  OfferID: number;
  LoanApplicationID: number;
  CompanyName: string;
  CompanyCode: string;
  CompanyLogoUrl: string;
  APR: number;
  LenderProductType: string;
  LenderReferenceID: string;
  LoanAmount: number;
  LoanDuration: number;
  EMIAmount: number;
  IsRealRate: boolean;
  EMIAmounts: number[];
  TotalPayableAmount: number;
  CampaignStatus: string;
  ApprovalChanceText: string;
  ExpiryTimeStamp: string;
  ExpiryTimeSeconds: number;
  PayOutDay: string;
  Fee: number;
  FeeType: string | null;
  IsAlternate: boolean;
  AcceptUrl: string;
  NominalRate: number;
}

export interface MatchedLenderGroup {
  LenderProductType: string;
  offers: Offer[];
}

export interface UnMatchedLender {
  CompanyName: string;
  LogoUrl: string;
  Failed_Validations: string;
}

export interface DeclinedLender {
  CompanyName: string;
  LogoUrl: string;
}

export interface ApplicationResultResponse {
  status: string;
  message: string;
  tag: string;
  timestamp: string;
  MatchedLenderList: MatchedLenderGroup[];
  ProductLine: string;
  LoanAmount: number;
  LoanDuration: number;
  QuickRedirectUrl: string;
  IsUpdatable: boolean;
  AwaitingOffers: number;
  IsBaseAffiliate: boolean;
  UnMatchedLenders: UnMatchedLender[];
  DeclinedLenders: DeclinedLender[];
  TotalOfferCount: number;
}

// Application Result API Service
export class ApplicationResultAPI {
  // Fetch application result using webtoken/tag
  static async getApplicationResult(webtoken: string): Promise<ApplicationResultResponse> {
    // Construct API URL - use the base URL from config
    const baseUrl = API_CONFIG.LEADS_API_URL || `${BACKEND_BASE_URL}/api/leads`;
    // Replace /api/leads with /api/leads/application-result
    const apiUrl = baseUrl.replace('/api/leads', '/api/leads/application-result');
    
    const url = `${apiUrl}?tag=${encodeURIComponent(webtoken)}`;
    
    console.log('📥 Fetching application result:', { 
      baseUrl, 
      apiUrl, 
      url, 
      webtoken,
      fullUrl: url
    });

    const response = await baseFetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': navigator.userAgent,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      throw new Error(`Failed to fetch application result: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Application result received:', result);
    return result as ApplicationResultResponse;
  }

  // Update loan details - returns same format as getApplicationResult
  static async updateLoanDetails(webtoken: string, loanAmount: number, loanDurationMonths: number): Promise<ApplicationResultResponse> {
    const apiUrl = API_CONFIG.LEADS_API_URL?.replace('/api/leads', '/api/leads/update') || 
                   `${BACKEND_BASE_URL}/api/leads/update`;
    
    // Use query parameters as per the API format: /api/leads/update?tag=abc123xyz&loanAmount=5000&loanDurationMonths=24
    const url = `${apiUrl}?tag=${encodeURIComponent(webtoken)}&loanAmount=${loanAmount}&loanDurationMonths=${loanDurationMonths}`;
    
    console.log('🔄 Updating loan details:', { url, webtoken, loanAmount, loanDurationMonths });

    const response = await baseFetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      // No body needed since data is in query parameters
    });

    let responseData: ApplicationResultResponse;

    try {
      const responseText = await response.text();
      responseData = JSON.parse(responseText) as ApplicationResultResponse;
    } catch (parseError) {
      throw new Error(`Invalid response from server: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    if (!response.ok) {
      const errorMsg = (responseData as any)?.error || (responseData as any)?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    console.log('✅ Loan details updated successfully:', responseData);
    return responseData;
  }
}

// Export the configuration for use in other parts of the application
export { API_CONFIG }; 