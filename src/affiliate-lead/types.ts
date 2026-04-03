/** Single-page stepper state for POST /affiliates/lead (exact API field names on submit). */

export const LOAN_DURATION_MONTHS = [3, 6, 9, 12, 18, 24, 36, 48, 60] as const;
export type LoanDurationMonth = (typeof LOAN_DURATION_MONTHS)[number];

export const DURATION_OPTIONS = LOAN_DURATION_MONTHS.map((m) =>
  String(m)
) as readonly string[];

export const LOAN_PURPOSES = [
  'Car',
  'Home Improvement',
  'Debt Consolidation',
  'Wedding',
  'Holiday',
  'Other',
] as const;
export type LoanPurpose = (typeof LOAN_PURPOSES)[number];

export const GENDERS = ['Male', 'Female', 'Other'] as const;
export type Gender = (typeof GENDERS)[number];

/** Submitted as `maritalStatus` — use these exact strings for the affiliates API. */
export const MARITAL_STATUSES = [
  'Single',
  'Married',
  'Living with Partner',
  'Separated',
  'Divorced',
  'Widowed',
  'Other',
] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

/** Submitted as `residentialStatus` — use these exact strings for the affiliates API. */
export const RESIDENTIAL_STATUSES = [
  'Home owner (mortgaged)',
  'Home owner (mortgage free)',
  'Unfurnished tenant',
  'Furnished tenant',
  'Living with parent(s)',
  'Council tenant',
  'Other',
] as const;
export type ResidentialStatus = (typeof RESIDENTIAL_STATUSES)[number];

export const INCOME_FREQUENCIES = [
  'Weekly',
  'Fortnightly',
  'Monthly',
  'Four Weekly',
] as const;
export type IncomePaymentFrequency = (typeof INCOME_FREQUENCIES)[number];

/** Submitted as `employmentType` — use these exact strings for the affiliates API. */
export const EMPLOYMENT_TYPES = [
  'Employed-Full Time',
  'Employed-Part Time',
  'Self-Employed',
  'On Benefits',
  'Unemployed',
  'Retired',
  'Student',
  'Home-maker',
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const DOB_MONTH_OPTIONS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
] as const;

export interface AffiliateLeadFormState {
  loanAmount: string;
  loanDurationMonths: LoanDurationMonth | '';
  loanPurpose: LoanPurpose | '';

  firstName: string;
  lastName: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  gender: Gender | '';
  email: string;
  cellPhone: string;
  maritalStatus: MaritalStatus | '';
  numberOfDependents: string;

  postCode: string;
  houseNumber: string;
  flatNumber: string;
  houseName: string;
  street: string;
  city: string;
  county: string;
  monthsAtAddress: string;
  residentialStatus: ResidentialStatus | '';

  netMonthlyIncome: string;
  incomePaymentFrequency: IncomePaymentFrequency | '';
  incomeNextDate1: string;
  expenseHousing: string;

  employmentType: EmploymentType | '';
  occupation: string;

  bankAccountNumber: string;
  bankSortCode: string;

  consentTerms: boolean;
  consentCreditSearch: boolean;
  consentDataProcessing: boolean;
  /** Financial processing / disclosures (compliance). */
  consentFinancial: boolean;
  /** Service contact about this application (separate from marketing opt-in). */
  consentContact: boolean;

  marketingEmail: boolean;
  marketingPhone: boolean;
  marketingSMS: boolean;
}

export function getInitialAffiliateLeadState(): AffiliateLeadFormState {
  return {
    loanAmount: '',
    loanDurationMonths: '',
    loanPurpose: '',
    firstName: '',
    lastName: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    gender: '',
    email: '',
    cellPhone: '',
    maritalStatus: '',
    numberOfDependents: '0',
    postCode: '',
    houseNumber: '',
    flatNumber: '',
    houseName: '',
    street: '',
    city: '',
    county: '',
    monthsAtAddress: '',
    residentialStatus: '',
    netMonthlyIncome: '',
    incomePaymentFrequency: '',
    incomeNextDate1: '',
    expenseHousing: '',
    employmentType: '',
    occupation: '',
    bankAccountNumber: '',
    bankSortCode: '',
    consentTerms: false,
    consentCreditSearch: false,
    consentDataProcessing: false,
    consentFinancial: false,
    consentContact: false,
    marketingEmail: false,
    marketingPhone: false,
    marketingSMS: false,
  };
}
