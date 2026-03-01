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
