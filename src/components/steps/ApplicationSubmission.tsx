import React, { useState, useMemo, useEffect } from 'react';
import { usePartner } from '../../partner/PartnerContext';
import { scrollToFormPosition } from '../../utils/scrollUtils';
import { trackConsentClick } from '../../utils/captureScreen';
import { useNavigate } from 'react-router-dom';
import { generateButtonIds } from '../../utils/buttonIdGenerator';
import { FormData } from '../../types/FormTypes';
import { LeadsAPI } from '../../services/apiService';

interface ApplicationSubmissionProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  prevStep: () => void;
  previousComponent?: string;
  setPreviousScreen: (screen: number) => void;
}

const ApplicationSubmission: React.FC<ApplicationSubmissionProps> = ({
  formData,
  setFormData,
  prevStep,
  setPreviousScreen
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { partner, isPartnerRoute } = usePartner();
  const navigate = useNavigate();

  // Generate button IDs for tracking
  const buttonIds = useMemo(() => {
    return generateButtonIds(5, 1, formData);
  }, [formData]);

  // Handle scroll positioning on mount
  useEffect(() => {
    scrollToFormPosition(5, 1);
  }, []);

  // Get partner-specific styles
  const partnerStyles = useMemo(() => {
    if (isPartnerRoute && partner) {
      const primaryColor = partner.primary_color;
      const navbarButtonBgColor = partner.navbar_button_background_color;
      const navbarButtonTextColor = partner.navbar_button_text_color;
      const shadowEnabled = partner.shadow_enabled;
      const shadowColor = partner.shadow_color;

      const styles: {
        buttonStyle: React.CSSProperties;
        checkboxSectionStyle: React.CSSProperties;
        checkboxTextStyle: React.CSSProperties;
        checkboxSupportingTextStyle: React.CSSProperties;
        checkboxSupportingLinkStyle: React.CSSProperties;
        checkboxBackgroundSelectedStyle: React.CSSProperties;
        checkboxBorderUnselectedStyle: React.CSSProperties;
        checkboxBorderSelectedStyle: React.CSSProperties;
        checkboxTickIconStyle: React.CSSProperties;
      } = {
        buttonStyle: {},
        checkboxSectionStyle: {},
        checkboxTextStyle: {},
        checkboxSupportingTextStyle: {},
        checkboxSupportingLinkStyle: {},
        checkboxBackgroundSelectedStyle: {},
        checkboxBorderUnselectedStyle: {},
        checkboxBorderSelectedStyle: {},
        checkboxTickIconStyle: {},
      };

      // buttonStyle
      if (navbarButtonBgColor) {
        styles.buttonStyle.backgroundColor = navbarButtonBgColor;
      } else if (primaryColor) {
        styles.buttonStyle.backgroundColor = primaryColor;
      }
      if (navbarButtonTextColor) {
        styles.buttonStyle.color = navbarButtonTextColor;
      }
      if (shadowEnabled && shadowColor) {
        styles.buttonStyle.boxShadow = `0 4px 8px ${shadowColor}`;
      } else if (shadowEnabled === false) {
        styles.buttonStyle.boxShadow = 'none';
      }

      // Checkbox section styles
      if (partner.checkbox_section_background_color) {
        styles.checkboxSectionStyle.backgroundColor = partner.checkbox_section_background_color;
      }

      // Universal checkbox text style (applies to all checkbox labels)
      if (partner.checkbox_text_color) {
        styles.checkboxTextStyle.color = partner.checkbox_text_color;
      }

      // Universal supporting text style (applies to all checkbox supporting text)
      if (partner.checkbox_supporting_text_color) {
        styles.checkboxSupportingTextStyle.color = partner.checkbox_supporting_text_color;
      }

      // Universal link style (applies to all links in supporting text)
      if (partner.checkbox_supporting_link_color) {
        styles.checkboxSupportingLinkStyle.color = partner.checkbox_supporting_link_color;
      }

      // Checkbox background when selected
      if (partner.checkbox_background_selected_color) {
        styles.checkboxBackgroundSelectedStyle.backgroundColor = partner.checkbox_background_selected_color;
      }

      // Checkbox border when unselected
      if (partner.checkbox_border_unselected_color) {
        styles.checkboxBorderUnselectedStyle.borderColor = partner.checkbox_border_unselected_color;
      }

      // Checkbox border when selected
      if (partner.checkbox_border_selected_color) {
        styles.checkboxBorderSelectedStyle.borderColor = partner.checkbox_border_selected_color;
      }

      // Checkbox tick icon color
      if (partner.checkbox_tick_color) {
        styles.checkboxTickIconStyle.color = partner.checkbox_tick_color;
      }

      return styles;
    }
    return {
      buttonStyle: {},
      checkboxSectionStyle: {},
      checkboxTextStyle: {},
      checkboxSupportingTextStyle: {},
      checkboxSupportingLinkStyle: {},
      checkboxBackgroundSelectedStyle: {},
      checkboxBorderUnselectedStyle: {},
      checkboxBorderSelectedStyle: {},
      checkboxTickIconStyle: {},
    };
  }, [isPartnerRoute, partner]);

  const { 
    buttonStyle,
    checkboxSectionStyle,
    checkboxTextStyle,
    checkboxSupportingTextStyle,
    checkboxSupportingLinkStyle,
    checkboxBackgroundSelectedStyle,
    checkboxBorderUnselectedStyle,
    checkboxBorderSelectedStyle,
    checkboxTickIconStyle,
  } = partnerStyles;

  // Get terms info from partner data or use defaults
  const termsInfo = useMemo(() => {
    const terms = [
      partner?.terms_info_1 || 'You accept our <a href="https://www.loantube.com/terms-and-conditions/" target="_blank" rel="noopener noreferrer">Terms & Conditions</a>, <a href="https://www.loantube.com/privacy-policy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>, and <a href="https://www.loantube.com/cookies-policy/" target="_blank" rel="noopener noreferrer">Cookies Policy</a>.',
      partner?.terms_info_2 || 'LoanTube may share your information with its panel of <a href="https://www.loantube.com/our-partners/" target="_blank" rel="noopener noreferrer">partners</a>, who will process it to assess your application, including eligibility and affordability checks.',
      partner?.terms_info_3 || 'LoanTube and its partners may contact you about your application, the checks required, and your experience by email, SMS, phone, or post.',
      partner?.terms_info_4 || 'LoanTube and its partners may use credit reference and fraud prevention agencies to run soft credit, ID, KYC, AML, and fraud checks. Soft credit checks do not affect your credit score.',
      partner?.terms_info_5 || 'LoanTube works with selected partners, not the whole market, and may receive commission from them. In some cases, this commission may affect the cost of products offered.'
    ];

    // Add additional terms if they exist
    if (partner?.terms_info_6 && partner.terms_info_6.trim().length > 0) {
      terms.push(partner.terms_info_6);
    }

    if (partner?.terms_info_7 && partner.terms_info_7.trim().length > 0) {
      terms.push(partner.terms_info_7);
    }

    return terms;
  }, [partner]);

  // Process terms content with partner styling
  const processTermsContent = (html: string) => {
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Find all links in the content
    const links = tempDiv.querySelectorAll('a');
    
    // Apply primary color to each link and ensure they open in new tab
    links.forEach(link => {
      // Ensure all links open in new tab
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      
      // Apply primary color - partner color if available, otherwise default color
      if (isPartnerRoute && partner?.primary_color) {
        link.style.color = partner.primary_color;
      } else {
        // Use default primary color for main app
        link.style.color = '#ff2048';
      }
    });
    
    // Return the modified HTML
    return tempDiv.innerHTML;
  };

  // Function to process checkbox supporting text content (similar to terms content)
  const processCheckboxContent = (html: string) => {
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Find all links in the content
    const links = tempDiv.querySelectorAll('a');
    
    // Apply link color to each link and ensure they open in new tab
    links.forEach(link => {
      // Ensure all links open in new tab
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      
      // Apply link color from partner settings or fallback to primary color
      if (isPartnerRoute && partner?.checkbox_supporting_link_color) {
        link.style.color = partner.checkbox_supporting_link_color;
      } else if (isPartnerRoute && partner?.primary_color) {
        link.style.color = partner.primary_color;
      } else {
        // Use default primary color for main app
        link.style.color = '#ff2048';
      }
    });
    
    // Return the modified HTML
    return tempDiv.innerHTML;
  };

  // Handle terms acceptance checkbox
  const handleAcceptTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      // Update application consent fields based on terms acceptance
      applicationSmsConsent: e.target.checked,
      applicationEmailConsent: e.target.checked,
      applicationPhoneConsent: e.target.checked,
      applicationPostConsent: e.target.checked,
      // All legal terms consent is always true when terms are accepted
      allLegalTermsConsent: e.target.checked
    });
  };

  const handleMarketingConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      marketingSmsConsent: e.target.checked,
      marketingEmailConsent: e.target.checked,
      marketingPhoneConsent: e.target.checked,
      marketingPostConsent: e.target.checked
    });
  };

  // Handle label clicks
  const handleLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle form submission
  const handleFindLoan = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    // Track consent click for audit purposes
    if (event && event.currentTarget) {
      trackConsentClick(event.nativeEvent, event.currentTarget);
    }

    // Process form data
    let formattedData = { ...formData };

    // Set detailed consent fields when user clicks "Find your loan"
    formattedData.allLegalTermsConsent = true; // Always true as requested
    formattedData.applicationSmsConsent = true; // Application SMS consent
    formattedData.applicationEmailConsent = true; // Application email consent
    formattedData.applicationPhoneConsent = true; // Application phone consent
    formattedData.applicationPostConsent = true; // Application post consent

    if (formattedData.loanTerm) {
      // Convert loan term to just months as a string
      formattedData.loanTerm = formatLoanTerm(formattedData.loanTerm);
    }
    
    formattedData.is_new_immigrant = !!formattedData.is_new_immigrant;
    
    const cleanedData = cleanFormData(formattedData);

    setFormData({ ...formattedData, ...cleanedData });

    setIsLoading(true);

    try {
      // Generate applicationId for form data
      const applicationId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
      const updatedFormData = {
        ...formattedData,
        applicationId
      };
      
      // Submit lead to backend API (main submission)
      const leadResponse = await LeadsAPI.submitLead(updatedFormData);
      console.log('✅ Lead API Response:', leadResponse);
      
      // Update form data with the applicationId
      setFormData(updatedFormData);
      
      // Check if lead was approved (status === "1")
      const responseBody = typeof leadResponse.body === 'object' ? leadResponse.body : {};
      const status = responseBody.status;
      const redirectUrl = responseBody.redirect_url;
      
      if (status === '1' && redirectUrl) {
        // The redirect_url from backend points to frontend URL (e.g., http://localhost:8081/customer/application-result?webtoken=...)
        // Extract the path and query params, then navigate to it
        try {
          const urlObj = new URL(redirectUrl);
          const path = urlObj.pathname; // e.g., "/customer/application-result"
          const search = urlObj.search; // e.g., "?webtoken=..."
          
          console.log('🔄 Redirecting to offer page:', { redirectUrl, path, search });
          
          // Navigate to the path from redirect_url (which includes webtoken in query params)
          // This matches the backend's redirect_url format
          navigate(path + search);
        } catch (urlError) {
          console.error('❌ Error parsing redirect URL:', urlError);
          // Fallback: try to extract webtoken and use default path
          const webtokenMatch = redirectUrl.match(/[?&]webtoken=([^&]+)/);
          if (webtokenMatch && webtokenMatch[1]) {
            navigate(`/customer/application-result?webtoken=${encodeURIComponent(webtokenMatch[1])}`);
          } else {
            navigate('/customer/application-result');
          }
        }
      } else if (status === '2') {
        // Lead was rejected
        console.error('❌ Lead was rejected:', responseBody);
        alert('Your application was not approved at this time. Please try again later.');
        setIsLoading(false);
      } else {
        // Fallback: redirect to offer page without webtoken (will show error or loading)
        console.warn('⚠️ No redirect URL in response, redirecting to default offer page');
      navigate('/offerpage');
      }
    } catch (error) {
      console.error('Error during application submission:', error);
      // Optionally handle error state, e.g., show an error message
    } finally {
      // Hide loading screen regardless of success or failure
      setIsLoading(false);
    }
  };

  // Clean form data before submission
  const cleanFormData = (data: FormData): Partial<FormData> => {
    const cleanedData: Record<string, unknown> = {};
    

    // Always include loanPurpose
    if (data.loanPurpose) {
      cleanedData.loanPurpose = data.loanPurpose;
    }
    
    // Include carLoanPurpose if it exists (for car purchase loans)
    if (data.loanPurpose === 'car_purchase' && data.carLoanPurpose) {
      cleanedData.carLoanPurpose = data.carLoanPurpose;
    }
    
    // Iterate through all properties in the data object
    (Object.keys(data) as (keyof FormData)[]).forEach(key => {
      // Skip loanPurpose since we've already handled it above
      if (key === 'loanPurpose' || key === 'carLoanPurpose') {
        return;
      }
      
      const value = data[key];
      
      // Skip null, undefined, empty strings, and empty arrays/objects
      if (value === null || value === undefined) return;
      
      // Skip selectedAddress object if not using manual address
      // We already have the individual fields extracted from it
      if (key === 'selectedAddress' && !data.useManualAddress) {
        return;
      }
      
      // Keep fullAddress when it's from a selected address (not manual entry)
      if (key === 'fullAddress' && data.useManualAddress === true) {
        return;
      }
      
      // Skip empty address fields
      if (['houseName', 'houseNumber', 'street', 'street2'].includes(key) && 
          (typeof value === 'string' && (!value || value.trim() === ''))) {
        return;
      }
      
      // Handle string values - only include non-empty strings
      if (typeof value === 'string') {
        if (value.trim() !== '') {
          cleanedData[key] = value;
        }
        return;
      }
      
      // Handle arrays - only include non-empty arrays
      if (Array.isArray(value)) {
        if (value.length > 0) {
          cleanedData[key] = value;
        }
        return;
      }
      
      // Handle objects - recursively clean and only include if not empty
      if (typeof value === 'object' && value !== null) {
        const cleanedObj = cleanFormData(value as unknown as FormData);
        if (Object.keys(cleanedObj).length > 0) {
          cleanedData[key] = cleanedObj;
        }
        return;
      }

      // For all other types (numbers, booleans), include as is
      cleanedData[key] = value;
    });
    
    return cleanedData as Partial<FormData>;
  };

  // Navigate back to previous screen
  const handleBack = () => {
    prevStep();
    
    // Check if business loan AND self-employed to determine which screen number to go back to
    if (formData.loanPurpose === 'business' && formData.employmentStatus === 'Self-Employed') {
      setPreviousScreen(7); // Bank details for business loans with self-employed
    } else {
      setPreviousScreen(4); // Bank details for non-business loans or business loans without self-employed
    }
  };

  // Format loan term for submission
  const formatLoanTerm = (term: string) => {
    if (!term) return '';
    
    // Remove underscores
    const cleanTerm = term.replace(/_/g, ' ');
    
    // Handle specific month formats
    if (cleanTerm.includes('months')) {
      // Extract the numeric part
      const numericPart = cleanTerm.replace('months', '').trim();
      return numericPart;
    }
    
    // Handle year formats (convert to months)
    if (cleanTerm.includes('year') || cleanTerm.includes('years')) {
      // Extract the numeric part
      let numericPart = cleanTerm
        .replace('years', '')
        .replace('year', '')
        .trim();
      
      // Convert to number, multiply by 12, and return as string
      const months = parseInt(numericPart) * 12;
      return months.toString();
    }
    
    // If it's just a number without unit, return as is
    return cleanTerm;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="appsub-loading-container">
        <div className="appsub-spinner">
          <div className="appsub-bounce1"></div>
          <div className="appsub-bounce2"></div>
          <div className="appsub-bounce3"></div>
        </div>
        <p className="appsub-loading-text">Processing Your Application..</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="form-title">By clicking ‘Find your loan’ you agree that:</h2>
      
      <div className="terms-container">
        <ol className="terms-list">
          {termsInfo.map((term, index) => (
            <li key={index} className="term-item">
              <span className="term-number">{index + 1}.</span>
              <div className="term-content">
                <span 
                  dangerouslySetInnerHTML={{ __html: processTermsContent(term) }}
                />
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="test-checkbox-container" style={checkboxSectionStyle}>
        <div className="test-checkbox-item required">
          <label className="test-checkbox-label" onClick={handleLabelClick}>
            <input
              type="checkbox"
              checked={formData.allLegalTermsConsent || false}
              onChange={handleAcceptTermsChange}
              className="test-checkbox-input"
            />
            <span 
              className="test-checkbox-custom"
              style={{
                ...(formData.allLegalTermsConsent ? checkboxBackgroundSelectedStyle : {}),
                ...(formData.allLegalTermsConsent ? checkboxBorderSelectedStyle : checkboxBorderUnselectedStyle),
                ...(formData.allLegalTermsConsent && checkboxTickIconStyle.color ? { '--tick-color': checkboxTickIconStyle.color } as React.CSSProperties : {})
              }}
            ></span>
            <span className="test-checkbox-text" style={checkboxTextStyle}>
              {partner?.checkbox_1_text ? (
                partner.checkbox_1_text
              ) : (
                <>
                  I accept the above terms <span className="test-required">(required)</span>
                </>
              )}
            </span>
          </label>
          {partner?.checkbox_1_supporting_text && (
            <div className="test-checkbox-description" style={checkboxSupportingTextStyle}>
              <span 
                dangerouslySetInnerHTML={{ __html: processCheckboxContent(partner.checkbox_1_supporting_text) }}
              />
            </div>
          )}
        </div>

        <div className="test-checkbox-item optional">
          <label className="test-checkbox-label" onClick={handleLabelClick}>
            <input
              type="checkbox"
              checked={formData.marketingEmailConsent || false}
              onChange={handleMarketingConsentChange}
              className="test-checkbox-input"
            />
            <span 
              className="test-checkbox-custom"
              style={{
                ...(formData.marketingEmailConsent ? checkboxBackgroundSelectedStyle : {}),
                ...(formData.marketingEmailConsent ? checkboxBorderSelectedStyle : checkboxBorderUnselectedStyle),
                ...(formData.marketingEmailConsent && checkboxTickIconStyle.color ? { '--tick-color': checkboxTickIconStyle.color } as React.CSSProperties : {})
              }}
            ></span>
            <span className="test-checkbox-text" style={checkboxTextStyle}>
              {partner?.checkbox_2_text ? (
                partner.checkbox_2_text
              ) : (
                <>
                  Yes, I'd like to stay updated <span className="test-optional">(optional)</span>
                </>
              )}
            </span>
          </label>
          <div className="test-checkbox-description" style={checkboxSupportingTextStyle}>
            {partner?.checkbox_2_supporting_text ? (
              <span 
                dangerouslySetInnerHTML={{ __html: processCheckboxContent(partner.checkbox_2_supporting_text) }}
              />
            ) : (
              <>
                We may contact you about loans, credit, and other financial products or services by email, SMS, phone, or post. You can withdraw consent at any time by emailing{' '}
                <a
                  href="mailto:info@loantube.com"
                  style={{ 
                    color: checkboxSupportingLinkStyle.color || (isPartnerRoute && partner?.primary_color ? partner.primary_color : '#ff2048')
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  info@loantube.com
                </a>
                {' '}or by using the unsubscribe link in our emails. This will not affect your current application.
              </>
            )}
          </div>
        </div>

        {/* Optional third checkbox - only shown if enabled by partner */}
        {isPartnerRoute && partner?.checkbox_3_enabled && (
          <div className="test-checkbox-item optional">
            <label className="test-checkbox-label" onClick={handleLabelClick}>
              <input
                type="checkbox"
                checked={formData.customConsent3 || false}
                onChange={(e) => setFormData({ ...formData, customConsent3: e.target.checked })}
                className="test-checkbox-input"
              />
              <span 
                className="test-checkbox-custom"
                style={{
                  ...(formData.customConsent3 ? checkboxBackgroundSelectedStyle : {}),
                  ...(formData.customConsent3 ? checkboxBorderSelectedStyle : checkboxBorderUnselectedStyle),
                  ...(formData.customConsent3 && checkboxTickIconStyle.color ? { '--tick-color': checkboxTickIconStyle.color } as React.CSSProperties : {})
                }}
              ></span>
              <span className="test-checkbox-text" style={checkboxTextStyle}>
                {partner.checkbox_3_text}
              </span>
            </label>
            {partner?.checkbox_3_supporting_text && (
              <div className="test-checkbox-description" style={checkboxSupportingTextStyle}>
                <span 
                  dangerouslySetInnerHTML={{ __html: processCheckboxContent(partner.checkbox_3_supporting_text) }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="navigation-buttons-app">
        <button
          className="back-button"
          onClick={handleBack}
          id={buttonIds.backButtonId}
        >
          <svg className='back-button-icon' viewBox="64 64 896 896" focusable="false" data-icon="left" fill="currentColor" aria-hidden="true">
              <path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"></path>
            </svg> Back
        </button>
        <button
          className={`submit-button ${formData.allLegalTermsConsent ? 'enabled' : 'disabled'}`}
          onClick={(e) => {
            // Track consent click for audit purposes
            trackConsentClick(e.nativeEvent, e.currentTarget);
            handleFindLoan();
          }}
          disabled={!formData.allLegalTermsConsent}
          style={formData.allLegalTermsConsent ? buttonStyle : {}}
          id={buttonIds.submitButtonId}
        >
          Find your loan
        </button>
      </div>
    </div>
  );
};

export default ApplicationSubmission;
