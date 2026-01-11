interface ScreenCaptureOptions {
  maxQuality?: boolean;
}

interface DeviceFingerprint {
  canvas: string;
  webgl: {
    vendor: string;
    renderer: string;
  } | null;
  audio: string;
  fonts: string[];
}

interface DetailedBehavioralData {
  sessionStartTime: number;
  mouseMovements: number;
  keystrokes: number;
  clickEvents: number;
}

interface ConsentClickMetadata {
  timestamp: string;
  buttonText: string;
  clickCoordinates: { x: number; y: number };
  elementPath: string;
  surroundingText: string;
  pageState: string;
  userInteractionTime: number;
  clickSequence: number;
}

interface AuditHashChain {
  sessionId: string;
  chainSequence: number;
  previousHash: string;
  currentHash: string;
  dataFingerprint: string;
  timestamp: string;
}

interface UserDataHashes {
  dobPostCodeHash: string;
  dobLastNameHash: string;
  phoneHash: string;
  emailHash: string;
}

interface BatteryInfo {
  level: number;
}

interface MediaDeviceInfo {
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasSpeakers?: boolean;
}

interface WindowExtensions {
  auditSessionStart?: number;
  clickSequence?: number;
  consentClickMetadata?: ConsentClickMetadata;
  Buffer?: { isBuffer: (obj: unknown) => boolean; } | Buffer | BufferConstructor;
  _Buffer?: { isBuffer: (obj: unknown) => boolean; } | Buffer | BufferConstructor;
  phantom?: { exit: (code?: number) => void; } | null;
  callPhantom?: ((data: unknown) => void) | null;
}

interface NavigatorExtensions {
  webdriver?: boolean;
  deviceMemory?: number;
}

export interface SensitiveAuditData {
  screenshot: string | null;
  hardwareInfo: {
    cpuCores: number;
    deviceMemory?: number;
  };
  securityInfo: {
    webdriver: boolean;
    devToolsOpen: boolean;
    isLikelyAutomated: boolean;
    automationScore: number;
    headless: boolean;
    phantomjs: boolean;
    selenium: boolean;
  };
  deviceFingerprint: DeviceFingerprint;
  detailedBehavioralData: DetailedBehavioralData;
  localIPs?: string[];
  batteryInfo?: {
    level: number;
  } | null;
  mediaDeviceInfo?: {
    hasCamera: boolean;
    hasMicrophone: boolean;
  } | null;
  consentClickMetadata?: ConsentClickMetadata;
  auditHashChain: AuditHashChain;
  userDataHashes?: UserDataHashes;
}

// Cached values for performance
let cachedCanvasFingerprint: string | null = null;
let cachedWebGLFingerprint: { vendor: string; renderer: string; } | null = null;
let cachedFonts: string[] | null = null;

// Global behavioral tracking variables
let detailedBehavioralData: DetailedBehavioralData = {
  sessionStartTime: Date.now(),
  mouseMovements: 0,
  keystrokes: 0,
  clickEvents: 0,
};

// Global audit chain variables
let auditSessionId: string | null = null;
let auditChainSequence = 0;
let lastAuditHash = '';

// Global consent click tracking
let consentClickData: ConsentClickMetadata | null = null;

// Initialize audit session
const initializeAuditSession = () => {
  if (!auditSessionId) {
    auditSessionId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    auditChainSequence = 0;
    lastAuditHash = '';
  }
};

// Generate SHA-256 hash
const generateHash = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Generate user data hashes for audit purposes
 */
export const generateUserDataHashes = async (userData: {
  dateOfBirth?: string;
  postcode?: string;
  lastName?: string;
  mobile?: string;
  email?: string;
}): Promise<UserDataHashes> => {
  const {
    dateOfBirth,
    postcode,
    lastName,
    mobile,
    email
  } = userData;

  // Helper function to normalize DOB to ddmmyyyy format
  const normalizeDOB = (dob: string): string => {
    // Remove all non-numeric characters 
    const digitsOnly = dob.replace(/[^0-9]/g, '');
    
    if (digitsOnly.length === 8) {
      const year = digitsOnly.substring(0, 4);
      const month = digitsOnly.substring(4, 6);
      const day = digitsOnly.substring(6, 8);
      return day + month + year; 
    }
    
    // For other lengths
    return digitsOnly;
  };

  // Helper function to normalize postcode (lowercase, remove spaces/special characters)
  const normalizePostcode = (pc: string): string => {
    return pc.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Helper function to normalize last name (lowercase, remove spaces/special characters)
  const normalizeLastName = (ln: string): string => {
    return ln.toLowerCase().replace(/[^a-z]/g, '');
  };

  // Generate DOBPostCode Hash
  let dobPostCodeData = '';
  if (dateOfBirth && postcode) {
    const normalizedDOB = normalizeDOB(dateOfBirth);
    const normalizedPostcode = normalizePostcode(postcode);
    dobPostCodeData = normalizedDOB + normalizedPostcode;
  }

  // Generate DOBLastName Hash
  let dobLastNameData = '';
  if (dateOfBirth && lastName) {
    const normalizedDOB = normalizeDOB(dateOfBirth);
    const normalizedLastName = normalizeLastName(lastName);
    dobLastNameData = normalizedDOB + normalizedLastName;
  }

  // Generate hashes
  const [dobPostCodeHash, dobLastNameHash, phoneHash, emailHash] = await Promise.all([
    dobPostCodeData ? generateHash(dobPostCodeData) : generateHash(''),
    dobLastNameData ? generateHash(dobLastNameData) : generateHash(''),
    mobile ? generateHash(mobile) : generateHash(''),
    email ? generateHash(email) : generateHash('')
  ]);

  return {
    dobPostCodeHash,
    dobLastNameHash,
    phoneHash,
    emailHash
  };
};

// Create audit hash chain
const createAuditHashChain = async (dataFingerprint: string): Promise<AuditHashChain> => {
  initializeAuditSession();
  
  const timestamp = new Date().toISOString();
  const chainData = `${auditSessionId}_${auditChainSequence}_${timestamp}_${dataFingerprint}_${lastAuditHash}`;
  const currentHash = await generateHash(chainData);
  
  const hashChain: AuditHashChain = {
    sessionId: auditSessionId!,
    chainSequence: auditChainSequence++,
    previousHash: lastAuditHash,
    currentHash,
    dataFingerprint,
    timestamp
  };
  
  lastAuditHash = currentHash;
  return hashChain;
};

// Track consent click metadata - exported function
export const trackConsentClick = (event: MouseEvent, buttonElement: HTMLElement): void => {
  try {
    const getElementPath = (element: HTMLElement): string => {
      const path = [];
      let current = element;
      while (current && current.parentElement) {
        let selector = current.tagName.toLowerCase();
        if (current.id) {
          selector += `#${current.id}`;
        }
        if (current.className) {
          selector += `.${current.className.split(' ').join('.')}`;
        }
        path.unshift(selector);
        current = current.parentElement;
      }
      return path.join(' > ');
    };

    const getSurroundingText = (element: HTMLElement): string => {
      const parent = element.parentElement;
      return parent ? parent.textContent?.slice(0, 200) || '' : '';
    };

    const getPageState = (): string => {
      const state = {
        url: window.location.href,
        title: document.title,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        timestamp: Date.now()
      };
      return JSON.stringify(state);
    };

    const now = Date.now();
    const sessionStart = (window as Window & WindowExtensions).auditSessionStart || now;

    const consentMetadata: ConsentClickMetadata = {
      timestamp: new Date().toISOString(),
      buttonText: buttonElement.textContent?.trim() || '',
      clickCoordinates: { x: event.clientX, y: event.clientY },
      elementPath: getElementPath(buttonElement),
      surroundingText: getSurroundingText(buttonElement),
      pageState: getPageState(),
      userInteractionTime: now - sessionStart,
      clickSequence: ((window as Window & WindowExtensions).clickSequence || 0) + 1
    };

    // Store for later audit capture
    (window as Window & WindowExtensions).consentClickMetadata = consentMetadata;
    (window as Window & WindowExtensions).clickSequence = consentMetadata.clickSequence;
    consentClickData = consentMetadata;
  } catch (error) {
    // Silent fail
  }
};

// Initialize behavioral tracking
const initializeBehavioralTracking = (): void => {
  const events = [
    ['mousemove', () => detailedBehavioralData.mouseMovements++],
    ['keydown', () => detailedBehavioralData.keystrokes++],
    ['click', () => detailedBehavioralData.clickEvents++]
  ] as const;

  events.forEach(([event, handler]) => {
    document.addEventListener(event, handler, { passive: true });
  });
};

  // Generate canvas fingerprint (cached)
const generateCanvasFingerprint = (): string => {
  if (cachedCanvasFingerprint !== null) return cachedCanvasFingerprint;
  
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return cachedCanvasFingerprint = '';
    
    canvas.width = 200;
    canvas.height = 50;
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Device fingerprint 🔒 2025', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('LoanTube Security', 4, 35);
    
    return cachedCanvasFingerprint = canvas.toDataURL();
  } catch (error) {
    return cachedCanvasFingerprint = '';
  }
};

// Generate WebGL fingerprint (cached)
const generateWebGLFingerprint = (): { vendor: string; renderer: string; } | null => {
  if (cachedWebGLFingerprint !== null) return cachedWebGLFingerprint;
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) return cachedWebGLFingerprint = null;
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return cachedWebGLFingerprint = null;
    
    return cachedWebGLFingerprint = {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown',
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown'
    };
  } catch (error) {
    return cachedWebGLFingerprint = null;
  }
};

// Generate audio fingerprint
const generateAudioFingerprint = (): string => {
  try {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return '';
    
    const audioContext = new AudioContextClass();
    const signature = `${audioContext.sampleRate}-${audioContext.destination.maxChannelCount}`;
    audioContext.close();
    
    return signature;
  } catch (error) {
    return '';
  }
};

// Detect available fonts (cached and optimized)
const detectFonts = (): string[] => {
  if (cachedFonts !== null) return cachedFonts;
  
  const testFonts = [
    'Arial', 'Calibri', 'Comic Sans MS', 'Consolas', 'Courier New', 
    'Georgia', 'Helvetica', 'Impact', 'Lucida Console', 'Tahoma', 
    'Times New Roman', 'Trebuchet MS', 'Verdana'
  ];
  
  const availableFonts: string[] = [];
  const testString = 'abcdefghijklmnopqrstuvwxyz';
  const testSize = '72px';
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return cachedFonts = [];
  
  // Get baseline measurement
  context.font = `${testSize} monospace`;
  const baseWidth = context.measureText(testString).width;
  
  // Test each font
  for (const font of testFonts) {
    context.font = `${testSize} ${font}, monospace`;
    if (context.measureText(testString).width !== baseWidth) {
      availableFonts.push(font);
    }
  }
  
  return cachedFonts = availableFonts;
};

// Detect if developer tools are open
const detectDevTools = (): boolean => {
  try {
    const threshold = 160;
    return window.outerHeight - window.innerHeight > threshold ||
           window.outerWidth - window.innerWidth > threshold;
  } catch {
    return false;
  }
};

// Get local IP addresses using WebRTC
const getLocalIPs = (): Promise<string[]> => {
  return new Promise((resolve) => {
    const ips: string[] = [];
    let resolved = false;
    
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      pc.createDataChannel('');
      pc.createOffer().then(offer => pc.setLocalDescription(offer));

      pc.onicecandidate = (ice) => {
        if (ice.candidate && !resolved) {
          const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
          const ipMatch = ice.candidate.candidate.match(ipRegex);
          if (ipMatch && !ips.includes(ipMatch[1])) {
            ips.push(ipMatch[1]);
          }
        }
      };

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          pc.close();
          resolve(ips);
        }
      }, 2000);
    } catch (error) {
      resolve([]);
    }
  });
};

// Browser Battery API interface
interface BatteryManager {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

// Extended Navigator interface with Battery API
interface NavigatorWithBattery extends Navigator {
  getBattery(): Promise<BatteryManager>;
}

// Get battery information
const getBatteryInfo = (): Promise<BatteryInfo | null> => {
  return new Promise((resolve) => {
    if ('getBattery' in navigator) {
      const timeout = setTimeout(() => resolve(null), 1000);
      
      (navigator as NavigatorWithBattery).getBattery().then((battery: BatteryManager) => {
        clearTimeout(timeout);
        resolve({
          level: battery.level
        });
      }).catch(() => {
        clearTimeout(timeout);
        resolve(null);
      });
    } else {
      resolve(null);
    }
  });
};

// Enhanced automation detection
const getEnhancedAutomationDetection = () => {
  const nav = navigator as Navigator & NavigatorExtensions;
  const win = window as Window & WindowExtensions;

  const checks = {
    webdriver: !!nav.webdriver,
    phantomjs: !!(win.phantom || win.callPhantom),
    selenium: !!(win.Buffer || win._Buffer),
    headless: navigator.userAgent.includes('HeadlessChrome'),
    devToolsOpen: detectDevTools()
  };

  const automationScore = Object.values(checks).filter(val => 
    typeof val === 'boolean' ? val : false
  ).length;

  return {
    webdriver: checks.webdriver,
    devToolsOpen: checks.devToolsOpen,
    phantomjs: checks.phantomjs,
    selenium: checks.selenium,
    headless: checks.headless,
    automationScore,
    isLikelyAutomated: checks.webdriver || checks.phantomjs || checks.selenium || checks.headless
  };
};

// Get media device information
const getMediaDeviceInfo = (): Promise<MediaDeviceInfo | null> => {
  return new Promise((resolve) => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      resolve(null);
      return;
    }

    const timeout = setTimeout(() => resolve(null), 1500);

    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        clearTimeout(timeout);
        resolve({
          hasCamera: devices.some(d => d.kind === 'videoinput'),
          hasMicrophone: devices.some(d => d.kind === 'audioinput'),
          hasSpeakers: devices.some(d => d.kind === 'audiooutput'),
        });
      })
      .catch(() => {
        clearTimeout(timeout);
        resolve(null);
      });
  });
};

// Initialize tracking when module loads - DEFERRED for performance
if (typeof window !== 'undefined') {
  // Defer heavy tracking initialization until after page load
  window.addEventListener('load', () => {
    // Use requestIdleCallback to run during idle time
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        initializeBehavioralTracking();
        initializeAuditSession();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        initializeBehavioralTracking();
        initializeAuditSession();
      }, 100);
    }
  });
}


// Optimized screenshot capture with lazy loading
 
export const captureCurrentScreen = async (options: ScreenCaptureOptions): Promise<string | null> => {
  const { maxQuality = true } = options;
  
  // Lazy load html-to-image only when needed
  try {
    const htmlToImage = await import('html-to-image');
    
    const baseConfig = {
      cacheBust: true,
      backgroundColor: '#ffffff',
      width: window.innerWidth,
      height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight),
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left'
      },
      useCORS: true, // Enable CORS for images
      allowTaint: false, // Prevent tainted canvas
      filter: (element: HTMLElement) => {
        if (!element || !element.tagName) return true;

        const tagName = element.tagName.toLowerCase();

        // Always exclude <script> tags
        if (tagName === 'script') {
          return false;
        }

        if (tagName === 'iframe') {
          return false;
        }

        if (tagName === 'img') {
          const src = element.getAttribute('src') || '';
          if (!src) {
            return true;
          }

          const isExternal = src.startsWith('http') && !src.includes(window.location.hostname);
          if (!isExternal) {
            return true; // Same-origin images are always safe
          }

          try {
            const { hostname } = new URL(src);
            if (hostname.endsWith('.supabase.co')) {
              return true;
            }
          } catch (_) {
            // If URL parsing fails, fall through to CORS check
          }

          const hasCORS = (element as HTMLImageElement).crossOrigin === 'anonymous';
          if (!hasCORS) {
            return false; 
          }
        }

        return true;
      }
    };

    // Use balanced quality settings - good quality with performance
    const config = maxQuality 
      ? { ...baseConfig, quality: 0.85, pixelRatio: 1.2 }  // High quality when explicitly requested
      : { ...baseConfig, quality: 0.75, pixelRatio: 1 };   // Balanced quality for regular use

    // Capture with better error handling
    const targetElement = document.getElementById('root') || document.body;
    const dataUrl = await htmlToImage.toPng(targetElement, config);
    return dataUrl;
  } catch (error) {
    console.warn('Screenshot capture failed:', error);
    return null;
  }
};


// Collect all sensitive data with deferred heavy operations
 
export const collectSensitiveData = async (preCapturedScreenshot: string | null = null): Promise<SensitiveAuditData> => {
  // Execute all async operations in parallel for performance
  const [screenshotDataUrl, localIPs, batteryInfo, mediaDeviceInfo] = await Promise.allSettled([
    preCapturedScreenshot ? Promise.resolve(preCapturedScreenshot) : captureCurrentScreen({ maxQuality: true }),
    getLocalIPs(),
    getBatteryInfo(),
    getMediaDeviceInfo()
  ]);
  
  // Generate device fingerprint with caching
  const deviceFingerprint: DeviceFingerprint = {
    canvas: cachedCanvasFingerprint || (cachedCanvasFingerprint = generateCanvasFingerprint()),
    webgl: cachedWebGLFingerprint || (cachedWebGLFingerprint = generateWebGLFingerprint()),
    audio: generateAudioFingerprint(),
    fonts: cachedFonts || (cachedFonts = detectFonts()),
  };
  
  const hardwareInfo = {
    cpuCores: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as Navigator & NavigatorExtensions).deviceMemory,
  };
  
  const securityInfo = getEnhancedAutomationDetection();

  // Create data fingerprint for hash chain
  const dataFingerprint = await generateHash(JSON.stringify({
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
    deviceFingerprint,
    securityInfo
  }));

  // Create audit hash chain
  const auditHashChain = await createAuditHashChain(dataFingerprint);
  
  const enhancedConsentMetadata = (window as Window & WindowExtensions).consentClickMetadata || consentClickData || null;

  return {
    screenshot: screenshotDataUrl.status === 'fulfilled' ? screenshotDataUrl.value : null,
    deviceFingerprint,
    hardwareInfo,
    securityInfo,
    localIPs: localIPs.status === 'fulfilled' ? localIPs.value : [],
    batteryInfo: batteryInfo.status === 'fulfilled' ? batteryInfo.value : null,
    mediaDeviceInfo: mediaDeviceInfo.status === 'fulfilled' ? mediaDeviceInfo.value : { hasCamera: false, hasMicrophone: false, hasSpeakers: false },
    detailedBehavioralData: { ...detailedBehavioralData },
    auditHashChain,
    consentClickMetadata: enhancedConsentMetadata || undefined
  };
}; 
