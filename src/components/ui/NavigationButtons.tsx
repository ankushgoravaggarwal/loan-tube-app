import React, { useMemo } from 'react';
import { usePartner } from '../../partner/PartnerContext';

interface NavigationButtonsProps {
  prevStep?: () => void;
  nextStep: () => void;
  isNextDisabled: boolean;
  backButtonText?: string;
  nextButtonText?: string;
  backButtonId?: string;
  nextButtonId?: string;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  prevStep,
  nextStep,
  isNextDisabled,
  backButtonText = 'Back',
  nextButtonText = 'Next',
  backButtonId,
  nextButtonId
}) => {
  const { partner, isPartnerRoute } = usePartner();
  
  // Generate next button styles with partner's navbar colors if available
  const nextButtonStyle = useMemo(() => {
    if (isPartnerRoute && !isNextDisabled) {
      const styles: React.CSSProperties = {};
      
      // Use navbar button colors if available, otherwise fall back to primary color
      if (partner?.navbar_button_background_color) {
        styles.backgroundColor = partner.navbar_button_background_color;
      } else if (partner?.primary_color) {
        styles.backgroundColor = partner.primary_color;
      }
      
      if (partner?.navbar_button_text_color) {
        styles.color = partner.navbar_button_text_color;
      }
      
      // Add shadow if enabled and color is provided
      if (partner?.shadow_enabled && partner?.shadow_color) {
        styles.boxShadow = `0 4px 8px ${partner.shadow_color}`;
      } else if (partner?.shadow_enabled === false) {
        // Explicitly remove shadow when disabled for partner
        styles.boxShadow = 'none';
      }
      
      return styles;
    }
    return {}; // Use default styles from CSS
  }, [isPartnerRoute, partner, isNextDisabled]);



  return (
    <div className="navigation-buttons">
      {prevStep && (
        <button 
          className="back-button"
          onClick={prevStep}
          id={backButtonId}
        >
          <span>
            <svg className='back-button-icon' viewBox="64 64 896 896" focusable="false" data-icon="left" fill="currentColor" aria-hidden="true">
              <path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"></path>
            </svg>
          </span> {backButtonText}
        </button>
      )}
      <button
        disabled={isNextDisabled}
        className={`next-button ${!isNextDisabled ? 'enabled' : 'disabled'}`}
        onClick={nextStep}
        style={nextButtonStyle}
        id={nextButtonId}
      >
        {nextButtonText} 
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd" fill="currentColor" className='next-button-icon'>
          <path d="M21.883 12l-7.527 6.235.644.765 9-7.521-9-7.479-.645.764 7.529 6.236h-21.884v1h21.883z"/>
        </svg>
      </button>
    </div>
  );
};

export default NavigationButtons; 