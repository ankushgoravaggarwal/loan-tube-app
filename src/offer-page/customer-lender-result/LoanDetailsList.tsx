import React from 'react';
import type { LenderResultView, LenderVariant } from './types';

export interface LoanDetailsListProps {
  view: LenderResultView;
  variant: LenderVariant;
  /** Use "Loan Confirmation ID" instead of "Loan Agreement Number" (Evolution). */
  agreementLabel?: string;
  /** Use "APRC" instead of "APR" (Evolution). Default: true when variant is evolution. */
  useAprcLabel?: boolean;
}

export const LoanDetailsList: React.FC<LoanDetailsListProps> = ({
  view,
  variant,
  agreementLabel = 'Loan Agreement Number',
  useAprcLabel = variant === 'evolution',
}) => (
  <>
    <ul className="customer-lender-result-details-list">
      {view.agreement && (
        <li>
          <span className="customer-lender-result-label">{agreementLabel}</span>
          <span className="customer-lender-result-value customer-lender-result-value--mono">{view.agreement}</span>
        </li>
      )}
      {(view.loanAmountNum != null || view.loanDurationNum != null) && (
        <li>
          <span className="customer-lender-result-label">Loan Approved</span>
          <span className="customer-lender-result-value">
            {view.loanAmountStr}{view.loanDurationNum != null ? ` for ${view.termStr}` : ''}
          </span>
        </li>
      )}
      {view.emiAmountNum != null && (
        <li>
          <span className="customer-lender-result-label">Monthly Instalment</span>
          <span className="customer-lender-result-value">{view.emiStr}</span>
        </li>
      )}
      {view.aprNum != null && (
        <li>
          <span className="customer-lender-result-label">{useAprcLabel ? 'APRC' : 'APR'}</span>
          <span className="customer-lender-result-value">{view.aprStr}</span>
        </li>
      )}
      {view.totalNum != null && (
        <li>
          <span className="customer-lender-result-label">Total Repayable Amount</span>
          <span className="customer-lender-result-value">{view.totalStr}</span>
        </li>
      )}
    </ul>
    {!view.hasAnyLoanFigures && view.agreement ? (
      <p className="customer-lender-result-note-text customer-lender-result-details-fallback">
        Loan amount and repayment details will be confirmed by {view.lenderName} when you call.
      </p>
    ) : null}
  </>
);

export interface LoanDetailsListLoansCoUkProps {
  view: LenderResultView;
}

export const LoanDetailsListLoansCoUk: React.FC<LoanDetailsListLoansCoUkProps> = ({ view }) => (
  <ul className="customer-lender-result-details-list">
    {view.loanAmountNum != null && (
      <li>
        <span className="customer-lender-result-label">Loan Amount</span>
        <span className="customer-lender-result-value">{view.loanAmountStr}</span>
      </li>
    )}
    {view.loanDurationNum != null && (
      <li>
        <span className="customer-lender-result-label">Term</span>
        <span className="customer-lender-result-value">{view.termStr}</span>
      </li>
    )}
    {view.emiAmountNum != null && (
      <li>
        <span className="customer-lender-result-label">Monthly Instalment</span>
        <span className="customer-lender-result-value">{view.emiStr}</span>
      </li>
    )}
    {view.aprNum != null && (
      <li>
        <span className="customer-lender-result-label">APR</span>
        <span className="customer-lender-result-value">{view.aprStr}</span>
      </li>
    )}
    {view.totalNum != null && (
      <li>
        <span className="customer-lender-result-label">Total Repayable Amount</span>
        <span className="customer-lender-result-value">{view.totalStr}</span>
      </li>
    )}
  </ul>
);
