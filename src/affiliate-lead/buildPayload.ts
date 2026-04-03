import type { AffiliateLeadFormState } from './types';
import {
  formatAffiliateDobIso,
  fullUkMobileFromAffiliateSuffix,
  normalizeUkMobileDisplay,
} from './validation';

function apiId(): string {
  return (
    import.meta.env.VITE_AFFILIATE_API_ID ||
    'loantubedirect'
  );
}

function apiPassword(): string {
  return (
    import.meta.env.VITE_AFFILIATE_API_PASSWORD ||
    'LoanTubeDirect2024!@#$'
  );
}

/** Final JSON body for POST /affiliates/lead */
export function buildAffiliateLeadPayload(
  state: AffiliateLeadFormState
): Record<string, unknown> {
  let sort = state.bankSortCode.replace(/\D/g, '');
  if (sort.length < 6) sort = sort.padStart(6, '0');
  if (sort.length > 6) sort = sort.slice(0, 6);

  let acct = state.bankAccountNumber.replace(/\D/g, '');
  if (acct.length < 8) acct = acct.padStart(8, '0');
  if (acct.length > 8) acct = acct.slice(0, 8);

  const postCode = state.postCode.replace(/\s/g, '').toUpperCase();

  let cell = normalizeUkMobileDisplay(
    fullUkMobileFromAffiliateSuffix(state.cellPhone)
  ).replace(/\D/g, '');
  if (cell.length === 12 && cell.startsWith('447')) cell = `0${cell.slice(3)}`;
  if (cell.length === 13 && cell.startsWith('4407')) cell = cell.slice(2);

  const payload: Record<string, unknown> = {
    apiId: apiId(),
    apiPassword: apiPassword(),
    /** Internal affiliate lead — always zero (not a paid/lead-price field from the user). */
    price: 0,

    loanAmount: Math.round(parseFloat(state.loanAmount.replace(/,/g, ''))),
    loanDurationMonths: Number(state.loanDurationMonths),
    loanPurpose: state.loanPurpose,

    firstName: state.firstName.trim(),
    lastName: state.lastName.trim(),
    dob: formatAffiliateDobIso(state),
    gender: state.gender,
    email: state.email.trim().toLowerCase(),
    cellPhone:
      cell.length === 10 && cell.startsWith('7')
        ? `0${cell}`
        : cell,
    maritalStatus: state.maritalStatus,
    numberOfDependents: parseInt(state.numberOfDependents, 10) || 0,

    postCode,
    houseNumber: state.houseNumber.trim(),
    street: state.street.trim(),
    city: state.city.trim(),
    monthsAtAddress: parseInt(state.monthsAtAddress, 10) || 0,
    residentialStatus: state.residentialStatus,

    netMonthlyIncome: Math.round(
      parseFloat(state.netMonthlyIncome.replace(/,/g, ''))
    ),
    incomePaymentFrequency: state.incomePaymentFrequency,
    expenseHousing: Math.round(
      parseFloat(state.expenseHousing.replace(/,/g, ''))
    ),

    employmentType: state.employmentType,
    occupation: state.occupation.trim(),

    bankAccountNumber: acct.slice(0, 8).padStart(8, '0'),
    bankSortCode: sort.slice(0, 6).padStart(6, '0'),

    consentTerms: state.consentTerms === true,
    consentCreditSearch: state.consentCreditSearch === true,
    consentDataProcessing: state.consentDataProcessing === true,
    consentFinancial: state.consentFinancial === true,
    consentContact: state.consentContact === true,
  };

  const incDate = state.incomeNextDate1.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(incDate)) {
    payload.incomeNextDate1 = incDate;
  }

  const flat = state.flatNumber.trim();
  if (flat) payload.flatNumber = flat;

  const hn = state.houseName.trim();
  if (hn) payload.houseName = hn;

  const county = state.county.trim();
  if (county) payload.county = county;

  if (state.marketingEmail) payload.marketingEmail = true;
  if (state.marketingPhone) payload.marketingPhone = true;
  if (state.marketingSMS) payload.marketingSMS = true;

  return payload;
}
