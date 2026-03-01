/**
 * Decode, variant detection, and view building for Customer Lender Result.
 */
import type { DecodedLenderData, LenderResultView, LenderVariant } from './types';

export function decodePayload(d: string): DecodedLenderData | null {
  try {
    const base64 = d.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    const decoded = JSON.parse(json) as DecodedLenderData;
    console.log('[CustomerLenderResult] decodePayload: raw decoded keys', Object.keys(decoded));
    console.log('[CustomerLenderResult] decodePayload: full decoded payload', decoded);
    return decoded;
  } catch (e) {
    console.error('[CustomerLenderResult] decodePayload failed', e);
    return null;
  }
}

export function getLenderVariant(lenderCode: string | undefined): LenderVariant {
  if (!lenderCode) return 'generic';
  const code = lenderCode.toLowerCase().trim();
  if (/evlo/.test(code)) return 'evlo';
  if (/evolution/.test(code)) return 'evolution';
  if (/selfy/.test(code)) return 'selfy';
  if (/loans?co?uk|loans?\.co\.uk|loan\.co\.uk/.test(code) || (code.includes('loan') && (code.includes('co') || code.includes('uk')))) return 'loanscouk';
  return 'generic';
}

export function formatCurrency(value: number): string {
  return `£${Number(value).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatCurrency2(value: number): string {
  return `£${Number(value).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function buildLenderResultView(data: DecodedLenderData): LenderResultView {
  console.log('[CustomerLenderResult] buildLenderResultView: input data keys', Object.keys(data));

  const agreement = (data.agreementNumber ?? data.Agreement ?? '').toString().trim();
  const loanAmountNum = data.loanAmount ?? data.LoanAmount ?? null;
  const loanDurationNum = data.loanDuration ?? data.LoanDuration ?? data.term ?? null;
  const emiAmountNum = data.emiAmount ?? data.EMIAmount ?? data.emi ?? null;
  const aprNum = data.apr ?? data.APR ?? null;
  const totalNum = data.totalPayableAmount ?? data.TotalPayableAmount ?? data.totalPayable ?? null;

  console.log('[CustomerLenderResult] buildLenderResultView: extracted loan fields', {
    agreement,
    loanAmountNum,
    loanDurationNum,
    emiAmountNum,
    aprNum,
    totalNum,
    'data.loanAmount': data.loanAmount,
    'data.LoanAmount': (data as Record<string, unknown>).LoanAmount,
    'data.term': data.term,
    'data.emi': data.emi,
    'data.apr': data.apr,
    'data.totalPayable': data.totalPayable,
  });

  const loanAmountStr = loanAmountNum != null ? formatCurrency(Number(loanAmountNum)) : '';
  const termStr = loanDurationNum != null ? `${loanDurationNum} months` : '';
  const emiStr = emiAmountNum != null ? formatCurrency2(Number(emiAmountNum)) : '';
  const aprStr = aprNum != null ? `${aprNum}%` : '';
  const totalStr = totalNum != null ? formatCurrency2(Number(totalNum)) : '';
  const logoUrl = (data.logoUrl ?? data.LogoUrl ?? '').toString().trim();
  const branchPhoneRaw = (data.branchTelephone ?? data.BranchPhone ?? '').toString().trim();
  const branchPhone = branchPhoneRaw.replace(/\s/g, '').length > 0 ? branchPhoneRaw : '';
  const branchName = (data.branchName ?? '').toString().trim() || null;
  const lenderName = (data.lenderName ?? data.lenderCompanyName ?? '').toString().trim() || 'Your lender';
  const isEvloConnect = Boolean(data.isEvloConnectRequired ?? data.IsEvloConnectRequired ?? data.evloConnectUrl);
  const evloConnectUrl = (data.evloConnectUrl ?? '').toString().trim() || null;
  const hasAnyLoanFigures = loanAmountNum != null || loanDurationNum != null || emiAmountNum != null || aprNum != null || totalNum != null;

  console.log('[CustomerLenderResult] buildLenderResultView: hasAnyLoanFigures', hasAnyLoanFigures, 'view summary', {
    loanAmountStr,
    termStr,
    emiStr,
    aprStr,
    totalStr,
  });

  return {
    agreement,
    loanAmountStr,
    termStr,
    emiStr,
    aprStr,
    totalStr,
    logoUrl,
    branchPhone,
    branchName,
    lenderName,
    isEvloConnect,
    evloConnectUrl,
    hasAnyLoanFigures,
    loanAmountNum,
    loanDurationNum,
    emiAmountNum,
    aprNum,
    totalNum,
  };
}

/** Dummy Evlo view for end-to-end testing. Use ?test=evlo to see the full Evlo flow. */
export function getDummyEvloView(): LenderResultView {
  return {
    agreement: '0042956962',
    loanAmountStr: '£5,000',
    termStr: '24 months',
    emiStr: '£230.50',
    aprStr: '9.9%',
    totalStr: '£5,532.00',
    logoUrl: '/assets/lenders/EveryDayLoans_logo.png',
    branchPhone: '01274 299380',
    branchName: 'Bradford Branch',
    lenderName: 'Evlo',
    isEvloConnect: true,
    evloConnectUrl: 'https://evlo.co.uk',
    hasAnyLoanFigures: true,
    loanAmountNum: 5000,
    loanDurationNum: 24,
    emiAmountNum: 230.5,
    aprNum: 9.9,
    totalNum: 5532,
  };
}

/** Dummy Selfy view for end-to-end testing. Use ?test=selfy to see the full Selfy flow. */
export function getDummySelfyView(): LenderResultView {
  return {
    agreement: '0042957001',
    loanAmountStr: '£3,000',
    termStr: '18 months',
    emiStr: '£185.20',
    aprStr: '12.5%',
    totalStr: '£3,333.60',
    logoUrl: '/assets/lenders/everyday-selfy-loans-logo.png',
    branchPhone: '01274 299380',
    branchName: 'Bradford Branch',
    lenderName: 'Selfy Loans',
    isEvloConnect: true,
    evloConnectUrl: 'https://evlo.co.uk',
    hasAnyLoanFigures: true,
    loanAmountNum: 3000,
    loanDurationNum: 18,
    emiAmountNum: 185.2,
    aprNum: 12.5,
    totalNum: 3333.6,
  };
}

/** Dummy Evolution Money view for end-to-end testing. Use ?test=evolution to see the Evolution flow. */
export function getDummyEvolutionView(): LenderResultView {
  return {
    agreement: 'EV-8829101',
    loanAmountStr: '£4,500',
    termStr: '36 months',
    emiStr: '£162.40',
    aprStr: '14.9%',
    totalStr: '£5,846.40',
    logoUrl: '/assets/lenders/Evolutionmoney_logo.png',
    branchPhone: '0161 768 9410',
    branchName: null,
    lenderName: 'Evolution Money',
    isEvloConnect: false,
    evloConnectUrl: null,
    hasAnyLoanFigures: true,
    loanAmountNum: 4500,
    loanDurationNum: 36,
    emiAmountNum: 162.4,
    aprNum: 14.9,
    totalNum: 5846.4,
  };
}

/** Dummy Loans.co.uk view for end-to-end testing. Use ?test=loanscouk to see the Loans.co.uk flow. */
export function getDummyLoansCoUkView(): LenderResultView {
  return {
    agreement: '',
    loanAmountStr: '£2,500',
    termStr: '12 months',
    emiStr: '£225.00',
    aprStr: '19.9%',
    totalStr: '£2,700.00',
    logoUrl: '/assets/lenders/loanscouk_logo.svg',
    branchPhone: '',
    branchName: null,
    lenderName: 'loans-co-uk',
    isEvloConnect: false,
    evloConnectUrl: null,
    hasAnyLoanFigures: true,
    loanAmountNum: 2500,
    loanDurationNum: 12,
    emiAmountNum: 225,
    aprNum: 19.9,
    totalNum: 2700,
  };
}
