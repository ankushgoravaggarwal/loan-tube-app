import { collectNonSensitiveData, type NonSensitiveAuditData } from './tracking/NonSensitiveData';
import { collectSensitiveData, trackConsentClick as originalTrackConsentClick, captureCurrentScreen as originalCaptureCurrentScreen, generateUserDataHashes, type SensitiveAuditData } from './tracking/SensitiveData';
import { AuditAPI } from '../services/apiService';
import { FormData } from '../types/FormTypes';

interface AuditDetails extends NonSensitiveAuditData, SensitiveAuditData {
  applicationId: string;
}

// Re-export functions to maintain existing API
export const trackConsentClick = originalTrackConsentClick;
export const captureCurrentScreen = originalCaptureCurrentScreen;

// Generate a UUID v4 application ID
const generateApplicationId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

 //Capture and submit application
export const captureAndSubmitApplication = async (
  formData: FormData,
  preCapturedScreenshot: string | null = null
): Promise<FormData> => {
  // Generate unique application ID in frontend
  const applicationId = generateApplicationId();
  
  // Add applicationId to form data
  const updatedFormData = {
    ...formData,
    applicationId
  };
  
  // Collect non-sensitive data 
  const nonSensitiveData = collectNonSensitiveData();
  
  // Generate user data hashes from form data 
  let userDataHashes = undefined;
  if (formData) {
    console.log('Form data for hash generation:', {
      dateOfBirth: formData.dateOfBirth,
      postcode: formData.postcode,
      lastName: formData.lastName,
      mobile: formData.mobile,
      email: formData.email
    });
    
    userDataHashes = await generateUserDataHashes({
      dateOfBirth: formData.dateOfBirth,
      postcode: formData.postcode,
      lastName: formData.lastName,
      mobile: formData.mobile,
      email: formData.email
    });
    
    console.log('Generated user data hashes:', userDataHashes);
  }
  
  // Collect sensitive data 
  const sensitiveData = await collectSensitiveData(preCapturedScreenshot);
  
  // Add user data hashes to sensitive data
  if (userDataHashes) {
    sensitiveData.userDataHashes = userDataHashes;
  }
  
  // Combine all audit data with application ID
  const auditDetails: AuditDetails = {
    applicationId,
    ...nonSensitiveData,
    ...sensitiveData
  };

  // Submit audit details to backend 
  try {
    const result = await AuditAPI.submitAudit(auditDetails);
    console.log('Audit data submitted successfully:', result);
    console.log('Application ID:', applicationId);
    
    // Return the updated form data with applicationId
    return updatedFormData;
  } catch (error) {
    throw new Error(`Backend submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 