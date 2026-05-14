// API layer
import * as Sentry from '@sentry/react';

// Backend base URL - used for leads and offer (application result) fetching. Production: sample.loantube.com
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'https://sample.loantube.com';

/** Public marketing site when application-result returns INVALID_TAG (override with VITE_MAIN_SITE_URL). */
const DEFAULT_MAIN_SITE_URL = 'https://www.loantube.com/';

function getMainSiteRedirectUrl(): string {
  const raw = import.meta.env.VITE_MAIN_SITE_URL?.trim();
  if (raw) {
    try {
      const u = new URL(raw.includes('://') ? raw : `https://${raw}`);
      return u.pathname === '/' || u.pathname === '' ? `${u.origin}/` : u.href;
    } catch {
      // ignore invalid env
    }
  }
  return DEFAULT_MAIN_SITE_URL;
}

function isInvalidTagApplicationResultPayload(data: unknown): boolean {
  if (data == null || typeof data !== 'object') return false;
  const issue = (data as { applicationResultIssue?: unknown }).applicationResultIssue;
  return issue === 'INVALID_TAG';
}

function redirectToMainSiteForInvalidTag(): void {
  if (typeof window === 'undefined') return;
  window.location.replace(getMainSiteRedirectUrl());
}

/**
 * Application-result can return HTTP 200 with status "success" but applicationResultIssue INVALID_TAG.
 * Redirect to main site and throw so callers skip success UI / retries.
 */
export class ApplicationResultInvalidTagError extends Error {
  override readonly name = 'ApplicationResultInvalidTagError';
  constructor() {
    super('Application result: invalid or expired tag (redirecting to main site)');
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function throwIfInvalidTagApplicationResult(data: unknown): void {
  if (!isInvalidTagApplicationResultPayload(data)) return;
  redirectToMainSiteForInvalidTag();
  throw new ApplicationResultInvalidTagError();
}
//const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://18.170.21.73:8081';
// Environment variables configuration
const API_CONFIG = {
  EMAIL_TOKEN_API_URL: import.meta.env.VITE_EMAIL_TOKEN_API_URL as string,
  EMAIL_VALIDATION_API_URL: import.meta.env.VITE_EMAIL_VALIDATION_API_URL as string,
  OTP_API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
  RECAPTCHA_BACKEND_URL: import.meta.env.VITE_API_BACKEND_URL as string,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  POSTCODE_API_URL: 'https://www.loantube.com/postcode/validate.php',
  // Leads / offer fetching
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

// Base fetch wrapper with error handling. Pass timeout: 0 to disable (no abort).
const baseFetch = async (
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> => {
  const useTimeout = timeout > 0;
  const controller = useTimeout ? new AbortController() : null;
  const timeoutId = useTimeout && controller
    ? setTimeout(() => controller.abort(), timeout)
    : null;

  try {
    const response = await fetch(url, {
      ...options,
      ...(controller && { signal: controller.signal }),
    });
    if (timeoutId) clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
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
  /** Present on some responses, e.g. INVALID_TAG while HTTP status remains success */
  applicationResultIssue?: string;
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

/** Result of update loan details: application result and optional new webtoken (lead_id) to use for future requests */
export interface UpdateLoanDetailsResult {
  applicationResult: ApplicationResultResponse;
  newWebtoken?: string;
}

// Accept Offer API – response types
export interface AcceptOfferLenderInfo {
  branchName: string;
  branchTelephone: string;
  lenderCompanyName: string;
  lenderLogoUrl: string;
  applicationToken?: string;
  lenderRefId?: string;
  applicationException?: string;
}

export interface AcceptOfferSuccess {
  status: 'success';
  message: string;
  tag: string;
  timestamp: string;
  leadId: number;
  offerId: number;
  acceptedLenderCode: string;
  acceptedOfferAt: string;
  lenderAcceptanceUrl: string | null;
  lenderInfo: AcceptOfferLenderInfo | null;
  evloConnectUrl: string | null;
}

export interface AcceptOfferError {
  status: 'error';
  errorCode: string;
  message: string;
  timestamp: string;
}

export type AcceptOfferResponse = AcceptOfferSuccess | AcceptOfferError;

// Application Result API Service
export class ApplicationResultAPI {
  // Fetch application result using webtoken/tag and/or applicationId + utm params (email/SMS)
  static async getApplicationResult(
    webtoken: string,
    options?: { applicationId?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string }
  ): Promise<ApplicationResultResponse> {
    const baseUrl = API_CONFIG.LEADS_API_URL || `${BACKEND_BASE_URL}/api/leads`;
    const apiUrl = baseUrl.replace('/api/leads', '/api/leads/application-result');

    const params = new URLSearchParams();
    if (webtoken != null && String(webtoken).trim() !== '') {
      params.set('tag', webtoken.trim());
    }
    if (options?.applicationId != null && String(options.applicationId).trim() !== '') {
      params.set('applicationId', options.applicationId.trim());
    }
    if (options?.utm_source != null && String(options.utm_source).trim() !== '') {
      params.set('utm_source', options.utm_source.trim());
    }
    if (options?.utm_medium != null && String(options.utm_medium).trim() !== '') {
      params.set('utm_medium', options.utm_medium.trim());
    }
    if (options?.utm_campaign != null && String(options.utm_campaign).trim() !== '') {
      params.set('utm_campaign', options.utm_campaign.trim());
    }

    const queryString = params.toString();
    if (!queryString) {
      throw new Error('Either tag (webtoken) or applicationId must be provided');
    }
    const url = `${apiUrl}?${queryString}`;

    const effectiveTag = webtoken?.trim() || options?.applicationId || '(applicationId)';
    console.log('📥 Fetching application result:', {
      baseUrl,
      apiUrl,
      url,
      webtoken: webtoken || '(empty)',
      applicationId: options?.applicationId,
      utm: options ? { source: options.utm_source, medium: options.utm_medium, campaign: options.utm_campaign } : undefined,
    });

    let httpStatus: number | null = null;
    try {
      const response = await baseFetch(url, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'User-Agent': navigator.userAgent,
        },
      }, 0);

      if (!response.ok) {
        httpStatus = response.status;
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
      throwIfInvalidTagApplicationResult(result);
      console.log('✅ Application result received:', result);
      return result as ApplicationResultResponse;
    } catch (err) {
      if (err instanceof ApplicationResultInvalidTagError) {
        throw err;
      }
      const apiHost = typeof window !== 'undefined' && apiUrl ? new URL(apiUrl).host : 'unknown';
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorName = err instanceof Error ? err.name : 'Error';
      Sentry.setTag('api_host', apiHost);
      Sentry.setTag('endpoint', 'application-result');
      Sentry.setTag('error_type', errorName);
      Sentry.setTag('webtoken', effectiveTag);
      if (httpStatus != null) {
        Sentry.setTag('http_status', String(httpStatus));
      }
      Sentry.setContext('api_failure', {
        api_host: apiHost,
        endpoint: 'application-result',
        webtoken: effectiveTag,
        error_name: errorName,
        error_message: errorMessage,
        http_status: httpStatus ?? '(no response - e.g. CORS/network)',
        page_origin: typeof window !== 'undefined' ? window.location.origin : '',
        referrer: typeof document !== 'undefined' ? document.referrer || '(none)' : '(none)',
        likely_cause: '"Load failed" = CORS not allowed from page origin, or network blocked. Fix: allow Origin (e.g. https://offers.loantube.com) on the API server.',
      });
      console.warn('[api_failure] application-result', {
        api_host: apiHost,
        webtoken: effectiveTag,
        error_message: errorMessage,
        http_status: httpStatus ?? '(no response - e.g. CORS/network)',
      });
      throw err;
    }
  }

  // Update loan details - response body is the payload directly (no Lambda wrapper).
  // Body may be { lead_id } or the full ApplicationResultResponse.
  static async updateLoanDetails(webtoken: string, loanAmount: number, loanDurationMonths: number): Promise<UpdateLoanDetailsResult> {
    const apiUrl = API_CONFIG.LEADS_API_URL?.replace('/api/leads', '/api/leads/update') ||
                   `${BACKEND_BASE_URL}/api/leads/update`;

    const url = `${apiUrl}?tag=${encodeURIComponent(webtoken)}&loanAmount=${loanAmount}&loanDurationMonths=${loanDurationMonths}`;

    console.log('🔄 Updating loan details:', { url, webtoken, loanAmount, loanDurationMonths });

    const response = await baseFetch(url, {
      method: 'POST',
      credentials: 'omit',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    }, 0);

    const responseText = await response.text();
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(responseText) as Record<string, unknown>;
    } catch (parseError) {
      throw new Error(`Invalid response from server: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    if (!response.ok) {
      const errorMsg = (payload as { error?: string; message?: string })?.error ?? (payload as { message?: string })?.message ?? `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    // If payload contains lead_id (new webtoken) and not full result, fetch application result
    const leadId = payload.lead_id as string | undefined;
    if (leadId && !payload.MatchedLenderList) {
      console.log('✅ Update returned lead_id, fetching offers with webtoken:', leadId);
      const applicationResult = await this.getApplicationResult(leadId);
      return { applicationResult, newWebtoken: leadId };
    }

    // Payload is already the full application result
    const applicationResult = payload as unknown as ApplicationResultResponse;
    throwIfInvalidTagApplicationResult(applicationResult);
    console.log('✅ Loan details updated successfully:', applicationResult);
    return { applicationResult };
  }

  /** Accept an offer: POST /api/leads/accept-offer?tag=...&offerId=... or with applicationId when tag is empty (email/SMS) */
  static async acceptOffer(webtoken: string, offerId: number, applicationId?: string): Promise<AcceptOfferResponse> {
    const baseUrl = API_CONFIG.LEADS_API_URL || `${BACKEND_BASE_URL}/api/leads`;
    const apiUrl = baseUrl.replace(/\/api\/leads\/?$/, '/api/leads/accept-offer');

    const params = new URLSearchParams();
    if (webtoken != null && String(webtoken).trim() !== '') {
      params.set('tag', webtoken.trim());
    }
    params.set('offerId', String(offerId));
    if (applicationId != null && String(applicationId).trim() !== '') {
      params.set('applicationId', applicationId.trim());
    }
    const url = `${apiUrl}?${params.toString()}`;

    console.log('📤 Accepting offer:', { webtoken: webtoken || '(empty)', applicationId, offerId, url });

    const response = await baseFetch(url, {
      method: 'POST',
      credentials: 'omit',
      cache: 'no-store',
      headers: { 'Accept': 'application/json', 'User-Agent': navigator.userAgent },
    }, 0);

    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid response from server: ${text || response.statusText}`);
    }

    const result = data as AcceptOfferResponse;
    if (result.status === 'success') {
      console.log('✅ Offer accepted:', result);
    } else {
      console.warn('❌ Accept offer error:', result.errorCode, result.message);
    }
    return result;
  }
}

// Export the configuration for use in other parts of the application
export { API_CONFIG }; 