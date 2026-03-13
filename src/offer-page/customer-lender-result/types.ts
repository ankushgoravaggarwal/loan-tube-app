/**
 * Types for the Customer Lender Result modular flow (/customer/lenderresult?d=...).
 */

/** Raw payload from base64 d (supports both camelCase and PascalCase from backend). */
export interface DecodedLenderData {
  applicationId?: string;
  agreementNumber?: string;
  Agreement?: string;
  branchName?: string;
  branchTelephone?: string;
  BranchPhone?: string;
  offerId?: string;
  /** Backend: lender name (preferred over lenderCompanyName). */
  lenderName?: string;
  lenderCompanyName?: string;
  /** Backend: lender code from lender.getCode() – used to pick variant (evlo, evolution, etc.). */
  lenderCode?: string;
  logoUrl?: string;
  LogoUrl?: string;
  loanAmount?: number;
  LoanAmount?: number;
  loanDuration?: number;
  LoanDuration?: number;
  term?: number;
  emiAmount?: number;
  EMIAmount?: number;
  emi?: number;
  apr?: number;
  APR?: number;
  totalPayableAmount?: number;
  TotalPayableAmount?: number;
  totalPayable?: number;
  isEvloConnectRequired?: boolean;
  IsEvloConnectRequired?: boolean;
  /** Backend includes in base64 d for evlo/selfy when Evlo Connect (Open Banking) is available. Not used for evolution/loanscouk. */
  evloConnectUrl?: string;
}

export type LenderVariant = 'evlo' | 'evolution' | 'loanscouk' | 'selfy' | 'generic';

/** Normalized view model passed to each lender-specific result component. */
export interface LenderResultView {
  agreement: string;
  loanAmountStr: string;
  termStr: string;
  emiStr: string;
  aprStr: string;
  totalStr: string;
  logoUrl: string;
  branchPhone: string;
  branchName: string | null;
  lenderName: string;
  isEvloConnect: boolean;
  evloConnectUrl: string | null;
  hasAnyLoanFigures: boolean;
  loanAmountNum: number | null;
  loanDurationNum: number | null;
  emiAmountNum: number | null;
  aprNum: number | null;
  totalNum: number | null;
}
