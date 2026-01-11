# Backend Submission Data Documentation

This document describes what data is sent from the frontend to the backend when the form is submitted.

## Submission Endpoint

**URL:** `https://www.emailvalidation.xyz/audit/submitapplication.php`  
**Method:** `POST`  
**Content-Type:** `application/json`

## Request Payload Structure

The request body contains an `auditDetails` object with the following structure:

```json
{
  "auditDetails": {
    "applicationId": "uuid-v4-string",
    // Non-sensitive data
    "userAgent": "string",
    "clientTimestamp": "ISO-8601-timestamp",
    "deviceType": "Mobile|Tablet|Desktop",
    "screenResolution": "widthxheight",
    "viewportSize": "widthxheight",
    "browserName": "Chrome|Firefox|Safari|Edge|Unknown",
    "platform": "string",
    "language": "string",
    "timezone": "string",
    "cookieEnabled": boolean,
    "onlineStatus": boolean,
    "referrer": "string",
    "pageUrl": "string",
    "networkInfo": {
      "effectiveType": "string"
    },
    "performanceMetrics": {
      "pageLoadTime": number,
      "domReadyTime": number
    },
    "screenResolutionDetails": {
      "physicalScreenWidth": number,
      "physicalScreenHeight": number,
      "logicalScreenWidth": number,
      "logicalScreenHeight": number,
      "availableScreenWidth": number,
      "availableScreenHeight": number,
      "windowInnerWidth": number,
      "windowInnerHeight": number,
      "windowOuterWidth": number,
      "windowOuterHeight": number,
      "devicePixelRatio": number,
      "orientation": "string",
      "colorDepth": number,
      "pixelDepth": number
    },
    "basicBehavioralData": {
      "sessionStartTime": number
    },
    "timezoneInfo": {
      "timezone": "string",
      "offset": number,
      "locale": "string"
    },
    "recaptchaLogs": [
      {
        "timestamp": "ISO-8601-timestamp",
        "action": "string",
        "score": number,
        "token": "string",
        "step": number,
        "screen": number,
        "triggeredV2": boolean,
        "v2Response": "string (optional)",
        "processingTime": number,
        "errorDetails": "string (optional)"
      }
    ],
    // Sensitive data
    "screenshot": "base64-encoded-image-string | null",
    "hardwareInfo": {
      "cpuCores": number,
      "deviceMemory": number (optional)
    },
    "securityInfo": {
      "webdriver": boolean,
      "devToolsOpen": boolean,
      "isLikelyAutomated": boolean,
      "automationScore": number,
      "headless": boolean,
      "phantomjs": boolean,
      "selenium": boolean
    },
    "deviceFingerprint": {
      "canvas": "base64-encoded-canvas-string",
      "webgl": {
        "vendor": "string",
        "renderer": "string"
      } | null,
      "audio": "string",
      "fonts": ["string"]
    },
    "detailedBehavioralData": {
      "sessionStartTime": number,
      "mouseMovements": number,
      "keystrokes": number,
      "clickEvents": number
    },
    "localIPs": ["string"],
    "batteryInfo": {
      "level": number
    } | null,
    "mediaDeviceInfo": {
      "hasCamera": boolean,
      "hasMicrophone": boolean,
      "hasSpeakers": boolean
    } | null,
    "consentClickMetadata": {
      "timestamp": "ISO-8601-timestamp",
      "buttonText": "string",
      "clickCoordinates": {
        "x": number,
        "y": number
      },
      "elementPath": "string",
      "surroundingText": "string",
      "pageState": "string",
      "userInteractionTime": number,
      "clickSequence": number
    } | undefined,
    "auditHashChain": {
      "sessionId": "string",
      "chainSequence": number,
      "previousHash": "string",
      "currentHash": "string",
      "dataFingerprint": "string",
      "timestamp": "ISO-8601-timestamp"
    },
    "userDataHashes": {
      "dobPostCodeHash": "sha256-hash",
      "dobLastNameHash": "sha256-hash",
      "phoneHash": "sha256-hash",
      "emailHash": "sha256-hash"
    }
  }
}
```

## Data Categories

### 1. Application Identification
- **applicationId**: Unique UUID v4 generated in the frontend

### 2. Non-Sensitive Data (Public Information)
- Browser and device information
- Screen and viewport dimensions
- Network information
- Performance metrics
- Timezone and locale
- reCAPTCHA interaction logs

### 3. Sensitive Data (Privacy-Related)
- **Screenshot**: Full page screenshot as base64-encoded PNG
- **Device Fingerprint**: Canvas, WebGL, audio, and font fingerprints
- **Hardware Info**: CPU cores, device memory
- **Security Info**: Automation detection (webdriver, headless, etc.)
- **Behavioral Data**: Mouse movements, keystrokes, clicks
- **Local IPs**: Detected via WebRTC
- **Battery Info**: Device battery level
- **Media Devices**: Camera, microphone, speakers availability
- **Consent Click Metadata**: Detailed information about consent button click
- **Audit Hash Chain**: Cryptographic hash chain for audit trail
- **User Data Hashes**: SHA-256 hashes of:
  - DOB + Postcode
  - DOB + Last Name
  - Phone number
  - Email address

## Submission Flow

1. User completes the form and clicks "Find your loan"
2. Form data is cleaned and formatted
3. Screenshot is captured before submission
4. Non-sensitive data is collected
5. User data hashes are generated
6. Sensitive data is collected (including screenshot)
7. All data is combined into `auditDetails` object
8. POST request is sent to backend API
9. On success, user is redirected to `/offerpage`

## Code Locations

- **Submission Handler**: `src/components/steps/ApplicationSubmission.tsx` (line 260)
- **Capture & Submit Function**: `src/utils/captureScreen.ts` (line 24)
- **API Service**: `src/services/apiService.ts` (line 332)
- **Non-Sensitive Data Collection**: `src/utils/tracking/NonSensitiveData.ts`
- **Sensitive Data Collection**: `src/utils/tracking/SensitiveData.ts`

## Notes

- The screenshot is captured at maximum quality before submission
- All hashes use SHA-256 algorithm
- User data (DOB, postcode, name, phone, email) is only sent as hashes, not plain text
- The audit hash chain creates a cryptographic trail linking all submissions
- Behavioral data tracks user interactions throughout the session

