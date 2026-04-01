import React, { useLayoutEffect, type Dispatch, type SetStateAction } from 'react';
import { FormData } from '../../../types/FormTypes';

interface VerificationScreenProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  nextStep: () => void;
  prevStep: () => void;
}

/**
 * SMS OTP and reCAPTCHA v2 before verification are temporarily disabled.
 * Marks mobile as verified; PersonalDetails effect then calls nextStep from screen 6 when appropriate.
 */
const VerificationScreen: React.FC<VerificationScreenProps> = ({
  formData,
  setFormData,
  nextStep: _nextStep,
  prevStep: _prevStep,
}) => {
  void _nextStep;
  void _prevStep;

  useLayoutEffect(() => {
    if (formData.isPhoneVerified) return;
    (setFormData as Dispatch<SetStateAction<FormData>>)((prev) => ({
      ...prev,
      isPhoneVerified: true,
      verifiedMobile: prev.mobile || prev.verifiedMobile || '',
    }));
  }, [formData.isPhoneVerified, setFormData, formData.mobile]);

  return (
    <div className="otp-loading" aria-busy="true">
      <p>Continuing…</p>
    </div>
  );
};

export default VerificationScreen;
