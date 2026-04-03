import type { AffiliateLeadFormState } from './types';
import {
  EMPLOYMENT_TYPES,
  GENDERS,
  LOAN_DURATION_MONTHS,
  LOAN_PURPOSES,
  MARITAL_STATUSES,
  RESIDENTIAL_STATUSES,
} from './types';

type DobParts = Pick<AffiliateLeadFormState, 'dobDay' | 'dobMonth' | 'dobYear'>;

/** Inclusive year range for DOB dropdowns (final age still validated in step 2). */
export function affiliateDobYearRange(): { min: number; max: number } {
  const y = new Date().getFullYear();
  return { min: y - 120, max: y - 18 };
}

/** Max valid day for month/year. If year incomplete, uses longest month length for that month (Feb 29). */
export function maxAffiliateDobDay(monthStr: string, yearStr: string): number {
  const m = parseInt(String(monthStr).replace(/\D/g, ''), 10);
  if (!Number.isFinite(m) || m < 1 || m > 12) return 31;
  const yDigits = yearStr.replace(/\D/g, '');
  if (yDigits.length !== 4) {
    const dim = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return dim[m - 1];
  }
  const y = parseInt(yDigits, 10);
  if (!Number.isFinite(y)) return 31;
  return new Date(y, m, 0).getDate();
}

/** Valid calendar date from separate DOB fields, or null. */
export function getAffiliateDobDate(s: DobParts): Date | null {
  const day = parseInt(s.dobDay.replace(/\D/g, ''), 10);
  const month = parseInt(String(s.dobMonth).replace(/\D/g, ''), 10);
  const yStr = s.dobYear.replace(/\D/g, '');
  if (yStr.length !== 4) return null;
  const year = parseInt(yStr, 10);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year))
    return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const nowY = new Date().getFullYear();
  if (year < 1900 || year > nowY) return null;
  const dt = new Date(year, month - 1, day);
  if (
    dt.getFullYear() !== year ||
    dt.getMonth() !== month - 1 ||
    dt.getDate() !== day
  )
    return null;
  return dt;
}

export function formatAffiliateDobIso(s: AffiliateLeadFormState): string {
  const d = getAffiliateDobDate(s);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Spec phone pattern */
const PHONE_RE =
  /^\s*((0|44|\+44|\+44\s*\(0\)|\+44\s*0)\s*)?07(\s*[0-9]){9}\s*$/;

const NAME_RE = /^[a-zA-Z]+(?:[ '-][a-zA-Z]+)*$/;

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** Digits only, max 6, no leading zeros (empty if all zeros). */
export function normalizeLoanAmountDigits(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 6);
  const noLeading = d.replace(/^0+/, '');
  return noLeading;
}

/** Digits after leading 07 — max 9. Used when UI shows sticky `07`. */
export function normalizeUkMobileSuffix(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('07')) {
    d = d.slice(2);
  } else if (d.startsWith('7') && d.length >= 10) {
    d = d.slice(1);
  } else if (d.startsWith('447') && d.length >= 12) {
    d = d.slice(3);
  } else if (d.startsWith('4407') && d.length >= 13) {
    d = d.slice(4);
  }
  return d.slice(0, 9);
}

export function fullUkMobileFromAffiliateSuffix(suffix: string): string {
  const s = suffix.replace(/\D/g, '').slice(0, 9);
  return s ? `07${s}` : '';
}

export function normalizeUkMobileDisplay(input: string): string {
  const raw = input.replace(/\s/g, '').trim();
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('07')) return digits;
  if (digits.length === 10 && digits.startsWith('7')) return `0${digits}`;
  if (digits.length === 12 && digits.startsWith('447')) return `0${digits.slice(3)}`;
  if (digits.length === 13 && digits.startsWith('4407')) return digits.slice(2);
  return raw.replace(/\s/g, '');
}

export function isValidUkCellPhone(input: string): boolean {
  const normalized = normalizeUkMobileDisplay(input);
  return PHONE_RE.test(normalized) || /^07[0-9]{9}$/.test(normalized);
}

export function validateStep1(s: AffiliateLeadFormState): boolean {
  const amt = parseFloat(s.loanAmount.replace(/,/g, ''));
  if (!Number.isFinite(amt) || amt <= 0) return false;
  if (amt < 250 || amt > 250000) return false;
  if (
    !s.loanDurationMonths ||
    !LOAN_DURATION_MONTHS.includes(Number(s.loanDurationMonths) as never)
  )
    return false;
  if (!s.loanPurpose || !LOAN_PURPOSES.includes(s.loanPurpose as never))
    return false;
  return true;
}

export function validateStep2(s: AffiliateLeadFormState): boolean {
  if (!NAME_RE.test(s.firstName.trim()) || s.firstName.trim().length < 2)
    return false;
  if (!NAME_RE.test(s.lastName.trim()) || s.lastName.trim().length < 2)
    return false;
  const d = getAffiliateDobDate(s);
  if (!d) return false;
  const now = new Date();
  if (d > now) return false;
  const age =
    now.getFullYear() -
    d.getFullYear() -
    (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
  if (age < 18 || age > 120) return false;
  const email = s.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return false;
  const mobileFull = fullUkMobileFromAffiliateSuffix(s.cellPhone);
  if (mobileFull.length !== 11 || !isValidUkCellPhone(mobileFull)) return false;
  if (!s.gender || !GENDERS.includes(s.gender as (typeof GENDERS)[number]))
    return false;
  if (
    !s.maritalStatus ||
    !MARITAL_STATUSES.includes(s.maritalStatus as (typeof MARITAL_STATUSES)[number])
  )
    return false;
  if (!/^[0-9]$/.test(s.numberOfDependents)) return false;
  return true;
}

export function validateStep3(s: AffiliateLeadFormState): boolean {
  const pc = s.postCode.replace(/\s/g, '').toUpperCase();
  if (pc.length < 5 || pc.length > 10) return false;
  if (!s.houseNumber.trim()) return false;
  if (!s.street.trim() || !s.city.trim()) return false;
  const months = parseInt(s.monthsAtAddress, 10);
  if (Number.isNaN(months) || months < 0 || months > 1200) return false;
  if (
    !s.residentialStatus ||
    !RESIDENTIAL_STATUSES.includes(
      s.residentialStatus as (typeof RESIDENTIAL_STATUSES)[number]
    )
  )
    return false;
  return true;
}

export function validateStep4(s: AffiliateLeadFormState): boolean {
  const income = parseFloat(s.netMonthlyIncome.replace(/,/g, ''));
  if (!Number.isFinite(income) || income <= 0) return false;
  if (!s.incomePaymentFrequency) return false;
  const housing = parseFloat(s.expenseHousing.replace(/,/g, ''));
  if (!Number.isFinite(housing) || housing < 0) return false;
  if (
    !s.employmentType ||
    !EMPLOYMENT_TYPES.includes(
      s.employmentType as (typeof EMPLOYMENT_TYPES)[number]
    )
  )
    return false;
  if (!s.occupation.trim() || s.occupation.trim().length < 2) return false;
  const acct = s.bankAccountNumber.replace(/\D/g, '');
  if (acct.length !== 8) return false;
  const sort = s.bankSortCode.replace(/\D/g, '');
  if (sort.length !== 6) return false;
  return true;
}

export function validateStep5(s: AffiliateLeadFormState): boolean {
  return (
    s.consentTerms === true &&
    s.consentCreditSearch === true &&
    s.consentDataProcessing === true &&
    s.consentFinancial === true &&
    s.consentContact === true
  );
}

export function validateAllForSubmit(s: AffiliateLeadFormState): boolean {
  return (
    validateStep1(s) &&
    validateStep2(s) &&
    validateStep3(s) &&
    validateStep4(s) &&
    validateStep5(s)
  );
}

export type Step1FieldErrors = Partial<
  Record<'loanAmount' | 'loanDurationMonths' | 'loanPurpose', string>
>;

export function getStep1FieldErrors(s: AffiliateLeadFormState): Step1FieldErrors {
  const out: Step1FieldErrors = {};
  const raw = s.loanAmount.trim();
  if (!raw) {
    out.loanAmount = 'Enter a loan amount.';
  } else {
    const amt = parseFloat(raw.replace(/,/g, ''));
    if (!Number.isFinite(amt) || amt <= 0) {
      out.loanAmount = 'Enter a valid loan amount.';
    } else if (amt < 250 || amt > 250000) {
      out.loanAmount = 'Enter an amount between £250 and £250,000.';
    }
  }
  if (
    !s.loanDurationMonths ||
    !LOAN_DURATION_MONTHS.includes(Number(s.loanDurationMonths) as never)
  ) {
    out.loanDurationMonths = 'Select a repayment period.';
  }
  if (!s.loanPurpose || !LOAN_PURPOSES.includes(s.loanPurpose as never)) {
    out.loanPurpose = 'Select a loan purpose.';
  }
  return out;
}

export type Step2FieldErrors = Partial<
  Record<
    | 'firstName'
    | 'lastName'
    | 'dob'
    | 'email'
    | 'cellPhone'
    | 'gender'
    | 'maritalStatus'
    | 'numberOfDependents',
    string
  >
>;

export function getStep2FieldErrors(s: AffiliateLeadFormState): Step2FieldErrors {
  const out: Step2FieldErrors = {};
  const fn = s.firstName.trim();
  if (!fn) out.firstName = 'Enter your first name.';
  else if (!NAME_RE.test(fn) || fn.length < 2)
    out.firstName =
      'Use letters only (apostrophe or hyphen allowed), at least 2 characters.';

  const ln = s.lastName.trim();
  if (!ln) out.lastName = 'Enter your last name.';
  else if (!NAME_RE.test(ln) || ln.length < 2)
    out.lastName =
      'Use letters only (apostrophe or hyphen allowed), at least 2 characters.';

  const d = getAffiliateDobDate(s);
  const anyDob = Boolean(s.dobDay || s.dobMonth || s.dobYear);
  if (!s.dobDay || !s.dobMonth || !s.dobYear) {
    if (anyDob) out.dob = 'Complete your date of birth.';
  } else if (!d) {
    out.dob = 'Enter a valid date of birth.';
  } else {
    const now = new Date();
    if (d > now) out.dob = 'Date of birth cannot be in the future.';
    else {
      const age =
        now.getFullYear() -
        d.getFullYear() -
        (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
      if (age < 18) out.dob = 'You must be at least 18 years old.';
      else if (age > 120) out.dob = 'Please check your date of birth.';
    }
  }

  const email = s.email.trim().toLowerCase();
  if (!email) out.email = 'Enter your email address.';
  else if (!EMAIL_RE.test(email)) out.email = 'Enter a valid email address.';

  const mobileFull = fullUkMobileFromAffiliateSuffix(s.cellPhone);
  if (mobileFull.length !== 11 || !isValidUkCellPhone(mobileFull)) {
    out.cellPhone = 'Enter a valid UK mobile (9 digits after 07).';
  }

  if (!s.gender || !GENDERS.includes(s.gender as (typeof GENDERS)[number])) {
    out.gender = 'Select your gender.';
  }
  if (
    !s.maritalStatus ||
    !MARITAL_STATUSES.includes(
      s.maritalStatus as (typeof MARITAL_STATUSES)[number]
    )
  ) {
    out.maritalStatus = 'Select your marital status.';
  }
  if (!/^[0-9]$/.test(s.numberOfDependents)) {
    out.numberOfDependents = 'Enter the number of dependents (0–9).';
  }
  return out;
}

export type Step3FieldErrors = Partial<
  Record<
    | 'postCode'
    | 'houseNumber'
    | 'street'
    | 'city'
    | 'monthsAtAddress'
    | 'residentialStatus',
    string
  >
>;

export function getStep3FieldErrors(s: AffiliateLeadFormState): Step3FieldErrors {
  const out: Step3FieldErrors = {};
  const pc = s.postCode.replace(/\s/g, '').toUpperCase();
  if (pc.length < 5 || pc.length > 10) {
    out.postCode = 'Enter a valid UK postcode.';
  }
  if (!s.houseNumber.trim()) {
    out.houseNumber = 'Enter your house or building number.';
  }
  if (!s.street.trim()) out.street = 'Enter your street.';
  if (!s.city.trim()) out.city = 'Enter your town or city.';
  const months = parseInt(s.monthsAtAddress, 10);
  if (
    Number.isNaN(months) ||
    months < 0 ||
    months > 1200 ||
    s.monthsAtAddress.trim() === ''
  ) {
    out.monthsAtAddress = 'Enter months at this address (0–1200).';
  }
  if (
    !s.residentialStatus ||
    !RESIDENTIAL_STATUSES.includes(
      s.residentialStatus as (typeof RESIDENTIAL_STATUSES)[number]
    )
  ) {
    out.residentialStatus = 'Select your residential status.';
  }
  return out;
}

export type Step4FieldErrors = Partial<
  Record<
    | 'netMonthlyIncome'
    | 'incomePaymentFrequency'
    | 'expenseHousing'
    | 'employmentType'
    | 'occupation'
    | 'bankAccountNumber'
    | 'bankSortCode',
    string
  >
>;

export function getStep4FieldErrors(s: AffiliateLeadFormState): Step4FieldErrors {
  const out: Step4FieldErrors = {};
  const income = parseFloat(s.netMonthlyIncome.replace(/,/g, ''));
  if (!Number.isFinite(income) || income <= 0) {
    out.netMonthlyIncome = 'Enter your net monthly income.';
  }
  if (!s.incomePaymentFrequency) {
    out.incomePaymentFrequency = 'Select how often you are paid.';
  }
  const housing = parseFloat(s.expenseHousing.replace(/,/g, ''));
  if (!Number.isFinite(housing) || housing < 0) {
    out.expenseHousing = 'Enter your monthly housing cost (0 or more).';
  }
  if (
    !s.employmentType ||
    !EMPLOYMENT_TYPES.includes(
      s.employmentType as (typeof EMPLOYMENT_TYPES)[number]
    )
  ) {
    out.employmentType = 'Select your employment type.';
  }
  const occ = s.occupation.trim();
  if (!occ) out.occupation = 'Enter your occupation.';
  else if (occ.length < 2) out.occupation = 'Enter at least 2 characters.';

  const acct = s.bankAccountNumber.replace(/\D/g, '');
  if (acct.length !== 8) {
    out.bankAccountNumber = 'Account number must be exactly 8 digits.';
  }
  const sort = s.bankSortCode.replace(/\D/g, '');
  if (sort.length !== 6) {
    out.bankSortCode = 'Sort code must be 6 digits.';
  }
  return out;
}

export function getStep5ConsentError(
  s: AffiliateLeadFormState
): string | undefined {
  if (validateStep5(s)) return undefined;
  return 'Please accept all required consents to continue.';
}
