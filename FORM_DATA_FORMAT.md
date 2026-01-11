# Form Data Format Documentation

This document describes the structure and format of the functional form data that is collected and prepared when the form is submitted.

## Important Note

**The actual form data (loan details, personal info, etc.) is NOT sent to the backend API.** Only audit/tracking data is sent to the backend. The form data stays in the frontend React state and is used for:
- Displaying on the offer page
- Passing to lender deeplinks
- Internal application processing

## Form Data Structure

The form data follows this TypeScript interface structure:

```typescript
interface FormData {
  // ===== LOAN DETAILS =====
  loanAmount: string;                    // e.g., "1000", "5000"
  loanTerm: string;                      // e.g., "12", "24" (months as string after formatting)
  loanPurpose: string;                  // e.g., "debt_consolidation", "car_purchase", "home_improvement"
  carLoanPurpose?: string;              // Only if loanPurpose === "car_purchase"
  
  // ===== PERSONAL DETAILS =====
  title?: string;                        // e.g., "Mr", "Mrs", "Ms", "Miss"
  firstName?: string;                    // e.g., "John"
  lastName?: string;                     // e.g., "Smith"
  dateOfBirth?: string;                  // Format: "YYYY-MM-DD" or "DD/MM/YYYY"
  displayDOB?: string;                   // Formatted display version
  email?: string;                        // e.g., "john.smith@example.com"
  emailValidation?: EmailValidation;     // Email validation state object (not sent)
  mobile?: string;                       // e.g., "+447123456789" or "07123456789"
  isPhoneVerified?: boolean;            // true if OTP verified
  verifiedMobile?: string;              // Verified mobile number
  maritalStatus?: string;                // e.g., "single", "married", "divorced"
  dependents?: string;                   // e.g., "0", "1", "2+"
  
  // ===== CURRENT ADDRESS & RESIDENTIAL DETAILS =====
  postcode?: string;                     // e.g., "SW1A 1AA"
  selectedAddress?: {                    // Address object from API (if selected from dropdown)
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
  useManualAddress?: boolean;            // true if user entered address manually
  fullAddress?: string;                  // Full address string (if manual entry)
  houseNumber?: string;                  // e.g., "123"
  houseName?: string;                    // e.g., "Rose Cottage"
  flatNumber?: string;                   // e.g., "Flat 4"
  street?: string;                        // Street name
  street1?: string;                       // Street line 1
  street2?: string;                       // Street line 2
  city?: string;                          // City name
  county?: string;                        // County name
  district?: string;                      // District name
  country?: string;                      // Country name
  residenceDuration?: number;             // Months at current address
  homeownerStatus?: string;              // e.g., "owner", "tenant", "living_with_family"
  propertyValue?: string;                // Property value if homeowner
  comeBackToPropertyScreen?: boolean;    // Internal flag
  
  // ===== PREVIOUS ADDRESS DETAILS =====
  previousCountry?: Country;              // Country object with code and name
  previousPostcode?: string;              // Previous postcode
  previousSelectedAddress?: {            // Previous address from API
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
  previousUseManualAddress?: boolean;    // true if previous address was manual
  previousHouseNumber?: string;
  previousHouseName?: string;
  previousFlatNumber?: string;
  previousStreet?: string;
  previousCity?: string;
  previousCounty?: string;
  
  // ===== INTERNATIONAL PREVIOUS ADDRESS =====
  previousinternationaladdressPostcode?: string;
  previousinternationaladdressAddressLine1?: string;
  previousinternationaladdressHouseNumber?: string;
  previousinternationaladdressHouseName?: string;
  previousinternationaladdressFlatNumber?: string;
  previousinternationaladdressCity?: string;
  previousinternationaladdressState?: string;
  isAddressValid?: boolean;
  
  // ===== FINANCIAL DETAILS =====
  employmentStatus?: string;             // e.g., "employed", "self_employed", "unemployed", "retired"
  income?: string;                       // Monthly income, e.g., "2000", "3000"
  housingPayment?: string;               // Monthly rent/mortgage payment
  bankAccountNumber?: string;           // Bank account number
  sortCode?: string;                     // Sort code (format: "12-34-56" or "123456")
  
  // ===== BUSINESS DETAILS (for self-employed) =====
  businessName?: string;                 // Business name
  businessType?: string;                 // Type of business
  businessRevenue?: string;              // Business revenue
  
  // ===== APPLICATION & SYSTEM FIELDS =====
  applicationId?: string;                // UUID v4 generated on submission
  is_new_immigrant?: boolean;             // true/false (converted to boolean)
  
  // ===== CONSENT FIELDS =====
  // Legal Terms Consent (always true upon submission)
  allLegalTermsConsent?: boolean;        // Always set to true
  
  // Application Consent Fields (set to true when terms accepted)
  applicationSmsConsent?: boolean;       // Set to true on submission
  applicationEmailConsent?: boolean;    // Set to true on submission
  applicationPhoneConsent?: boolean;     // Set to true on submission
  applicationPostConsent?: boolean;      // Set to true on submission
  
  // Marketing Consent Fields (based on marketing checkbox)
  marketingSmsConsent?: boolean;         // Based on user checkbox
  marketingEmailConsent?: boolean;       // Based on user checkbox
  marketingPhoneConsent?: boolean;       // Based on user checkbox
  marketingPostConsent?: boolean;        // Based on user checkbox
  
  // Custom consent fields (partner-specific)
  customConsent1?: boolean;
  customConsent2?: boolean;
  customConsent3?: boolean;
}
```

## Data Cleaning Process

Before submission, the form data goes through a cleaning process (`cleanFormData` function):

### Cleaning Rules:

1. **Empty Values Removed**: 
   - `null`, `undefined`, empty strings are excluded
   - Empty arrays and objects are excluded

2. **Address Handling**:
   - If `useManualAddress === false`: `selectedAddress` object is included, `fullAddress` is excluded
   - If `useManualAddress === true`: Individual address fields are included, `selectedAddress` is excluded
   - Empty address fields (`houseName`, `houseNumber`, `street`, `street2`) are removed

3. **Loan Term Formatting**:
   - Converted to months as a string (e.g., "12 months" → "12")

4. **Boolean Conversion**:
   - `is_new_immigrant` is converted to boolean (`!!value`)

5. **Consent Fields**:
   - `allLegalTermsConsent` → always `true`
   - `applicationSmsConsent` → always `true`
   - `applicationEmailConsent` → always `true`
   - `applicationPhoneConsent` → always `true`
   - `applicationPostConsent` → always `true`

## Example Cleaned Form Data

```json
{
  "loanAmount": "5000",
  "loanTerm": "24",
  "loanPurpose": "debt_consolidation",
  "title": "Mr",
  "firstName": "John",
  "lastName": "Smith",
  "dateOfBirth": "1990-05-15",
  "email": "john.smith@example.com",
  "mobile": "+447123456789",
  "isPhoneVerified": true,
  "verifiedMobile": "+447123456789",
  "maritalStatus": "married",
  "dependents": "2",
  "postcode": "SW1A 1AA",
  "selectedAddress": {
    "AddressID": "12345",
    "EquifaxAddressID": "EQ12345",
    "FullAddress": "123 Main Street, London",
    "PostTown": "London",
    "PostCode": "SW1A 1AA",
    "HouseNumber": "123",
    "Street1": "Main Street",
    "City": "London",
    "County": "Greater London",
    "Country": "United Kingdom"
  },
  "useManualAddress": false,
  "residenceDuration": 24,
  "homeownerStatus": "owner",
  "propertyValue": "300000",
  "employmentStatus": "employed",
  "income": "3000",
  "housingPayment": "800",
  "bankAccountNumber": "12345678",
  "sortCode": "12-34-56",
  "applicationId": "550e8400-e29b-41d4-a716-446655440000",
  "is_new_immigrant": false,
  "allLegalTermsConsent": true,
  "applicationSmsConsent": true,
  "applicationEmailConsent": true,
  "applicationPhoneConsent": true,
  "applicationPostConsent": true,
  "marketingSmsConsent": false,
  "marketingEmailConsent": true,
  "marketingPhoneConsent": false,
  "marketingPostConsent": false
}
```

## Data Flow

1. **Collection**: Data collected through multi-step form screens
2. **Storage**: Stored in React state (`formData`)
3. **Cleaning**: `cleanFormData()` removes empty values and formats data
4. **Formatting**: Loan term converted, booleans normalized
5. **Consent Setting**: Application consent fields set to `true`
6. **Application ID**: UUID v4 generated and added
7. **State Update**: Cleaned data stored back in state
8. **Navigation**: Data passed to offer page via React Router state
9. **Usage**: Used for displaying offers and passing to lender deeplinks

## Code Locations

- **Form Data Type**: `src/types/FormTypes.ts`
- **Data Cleaning**: `src/components/steps/ApplicationSubmission.tsx` (line 312)
- **Submission Handler**: `src/components/steps/ApplicationSubmission.tsx` (line 260)
- **Loan Term Formatting**: `src/components/steps/ApplicationSubmission.tsx` (formatLoanTerm function)

## Notes

- Form data is **NOT sent to the backend** - only audit/tracking data is sent
- Form data is stored in React state and passed between components
- The cleaned form data is what gets logged to console: `console.log('Application submitted!', updatedFormData)`
- This data structure is what would be used if you need to send it to a different API endpoint

