interface NetworkInfo {
  effectiveType?: string;
}

interface PerformanceMetrics {
  pageLoadTime: number;
  domReadyTime: number;
}

interface ScreenResolutionDetails {
  physicalScreenWidth: number;
  physicalScreenHeight: number;
  logicalScreenWidth: number;
  logicalScreenHeight: number;
  availableScreenWidth: number;
  availableScreenHeight: number;
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowOuterWidth: number;
  windowOuterHeight: number;
  devicePixelRatio: number;
  orientation: string;
  colorDepth: number;
  pixelDepth: number;
}

interface BasicBehavioralData {
  sessionStartTime: number;
}

interface TimezoneInfo {
  timezone: string;
  offset: number;
  locale: string;
}

interface RecaptchaLogEntry {
  timestamp: string;
  action: string;
  score: number;
  token: string;
  step: number;
  screen: number;
  triggeredV2: boolean;
  v2Response?: string;
  processingTime: number;
  errorDetails?: string;
}

export interface NonSensitiveAuditData {
  userAgent: string;
  clientTimestamp: string;
  deviceType: string;
  screenResolution: string;
  viewportSize: string;
  browserName: string;
  platform: string;
  language: string;
  timezone: string;
  cookieEnabled: boolean;
  onlineStatus: boolean;
  referrer: string;
  pageUrl: string;
  networkInfo: NetworkInfo;
  performanceMetrics: PerformanceMetrics;
  screenResolutionDetails: ScreenResolutionDetails;
  basicBehavioralData: BasicBehavioralData;
  timezoneInfo: TimezoneInfo;
  recaptchaLogs: RecaptchaLogEntry[];
}

// Cached values for performance
let cachedPerformanceMetrics: PerformanceMetrics | null = null;
let cachedNetworkInfo: NetworkInfo | null = null;
let cachedTimezoneInfo: TimezoneInfo | null = null;

// Basic behavioral tracking
const basicBehavioralData: BasicBehavioralData = {
  sessionStartTime: Date.now(),
};

/**
 * Format reCAPTCHA logs from window context
 */
const formatRecaptchaLogs = (): RecaptchaLogEntry[] => {
  try {
    const logs = (window as Window & { recaptchaAuditLogs?: unknown[] }).recaptchaAuditLogs || [];
    return logs.map((log: Record<string, unknown>) => ({
      timestamp: (log.timestamp as string) || new Date().toISOString(),
      action: (log.action as string) || 'unknown',
      score: typeof (log.score as number) === 'number' ? (log.score as number) : 0,
      token: (log.token as string) || '',
      step: (log.step as number) || 0,
      screen: (log.screen as number) || 0,
      triggeredV2: Boolean(log.triggeredV2),
      v2Response: (log.v2Response as string) || undefined,
      processingTime: (log.processingTime as number) || 0,
      errorDetails: (log.errorDetails as string) || undefined
    }));
  } catch (error) {
    return [];
  }
};

/**
 * Get device type based on screen width
 */
const getDeviceType = (): string => {
  const width = window.innerWidth;
  return width <= 768 ? 'Mobile' : width <= 1024 ? 'Tablet' : 'Desktop';
};

/**
 * Get browser name from user agent
 */
const getBrowserName = (): string => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
};

/**
 * Get enhanced screen resolution details
 */
const getScreenResolutionDetails = (): ScreenResolutionDetails => {
  return {
    physicalScreenWidth: screen.width || 0,
    physicalScreenHeight: screen.height || 0,
    logicalScreenWidth: screen.availWidth || 0,
    logicalScreenHeight: screen.availHeight || 0,
    availableScreenWidth: screen.availWidth || 0,
    availableScreenHeight: screen.availHeight || 0,
    windowInnerWidth: window.innerWidth || 0,
    windowInnerHeight: window.innerHeight || 0,
    windowOuterWidth: window.outerWidth || 0,
    windowOuterHeight: window.outerHeight || 0,
    devicePixelRatio: window.devicePixelRatio || 1,
    orientation: screen.orientation?.type || 'unknown',
    colorDepth: screen.colorDepth || 0,
    pixelDepth: screen.pixelDepth || 0
  };
};

/**
 * Get performance metrics (cached)
 */
const getPerformanceMetrics = (): PerformanceMetrics => {
  if (cachedPerformanceMetrics !== null) return cachedPerformanceMetrics;
  
  const timing = performance.timing;
  return cachedPerformanceMetrics = {
    pageLoadTime: timing.loadEventEnd - timing.navigationStart,
    domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
  };
};

/**
 * Get network information (cached)
 */
const getNetworkInfo = (): NetworkInfo => {
  if (cachedNetworkInfo !== null) return cachedNetworkInfo;

  const connection = (navigator as Navigator & { connection?: { effectiveType?: string }, mozConnection?: { effectiveType?: string }, webkitConnection?: { effectiveType?: string } }).connection ||
                    (navigator as Navigator & { mozConnection?: { effectiveType?: string } }).mozConnection ||
                    (navigator as Navigator & { webkitConnection?: { effectiveType?: string } }).webkitConnection;
  
  if (!connection) return cachedNetworkInfo = {};
  
  return cachedNetworkInfo = {
    effectiveType: connection.effectiveType,
  };
};

/**
 * Advanced timezone analysis (cached)
 */
const getTimezoneInfo = (): TimezoneInfo => {
  if (cachedTimezoneInfo !== null) return cachedTimezoneInfo;
  
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = now.getTimezoneOffset();
  
  return cachedTimezoneInfo = {
    timezone,
    offset,
    locale: Intl.DateTimeFormat().resolvedOptions().locale,
  };
};

/**
 * Collect all non-sensitive data that can be gathered without user consent
 */
export const collectNonSensitiveData = (): NonSensitiveAuditData => {
  const enhancedRecaptchaLogs = formatRecaptchaLogs();

  return {
    userAgent: navigator.userAgent,
    clientTimestamp: new Date().toISOString(),
    deviceType: getDeviceType(),
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    browserName: getBrowserName(),
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cookieEnabled: navigator.cookieEnabled,
    onlineStatus: navigator.onLine,
    referrer: document.referrer || 'Direct',
    pageUrl: window.location.href,
    networkInfo: getNetworkInfo(),
    performanceMetrics: getPerformanceMetrics(),
    screenResolutionDetails: getScreenResolutionDetails(),
    basicBehavioralData: { ...basicBehavioralData },
    timezoneInfo: getTimezoneInfo(),
    recaptchaLogs: enhancedRecaptchaLogs,
  };
}; 