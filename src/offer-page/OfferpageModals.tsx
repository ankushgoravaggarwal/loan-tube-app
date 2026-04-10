import React from 'react';
import { X } from 'lucide-react';

interface InfoModalProps {
  activeInfoModal: string | null;
  closeInfoModal: () => void;
}

const infoContent = {
  'acceptance-certainty': {
    title: 'Acceptance Certainty',
    content: 'Acceptance certainty is a score which our lenders provide us for your loan application. It shows the likelihood of you being accepted by a lender based on a soft credit search on you and processing of visible information you provided us in your loan application. However, the displayed loan offers are still subject to affordability, fraud, anti-money laundering and other final verification checks.',
    tooltip: 'Shows likelihood of acceptance based on a soft search; final checks still apply.'
  },
  'apr-rate': {
    title: 'APR Rate',
    content: 'Rate Guaranteed by LoanTube is a badge that we give to loan offers where we have arrangements with the lender to lock the APR rate for you. However a lender may change this rate for one of the following reasons: You change the loan amount or duration, You provided inaccurate or incomplete information, During the final checks the lender finds some information which makes your profile look riskier than before.',
    tooltip: 'Rate may be locked; can change if you change amount or duration or if the lender finds new information.'
  },
  'quote-valid': {
    title: 'Quote Valid For',
    content: 'Your quote will expire after this time duration. Make sure to complete your application before the timer runs out to secure this offer at the current rate.',
    tooltip: 'Complete your application before this time to secure the offer at the current rate.'
  },
  'loan-payout': {
    title: 'Loan Payout to Your Bank',
    content: 'Loan is paid out to you upon successful acceptance and completion of the rest of the loan application. Payments can be delayed if it\'s a bank holiday or a weekend. The typical payout time is within 24 hours of approval.',
    tooltip: 'Typically within 24 hours of approval; may be delayed on weekends or bank holidays.'
  },
  'fees': {
    title: 'Fees',
    content: 'Fees are charges that the lender may apply to your loan. The amount shown is specific to this offer.',
    tooltip: 'Charges that the lender may apply to this loan offer.'
  },
  'fees-uk-credit': {
    title: 'Fees (added to your loan amount)',
    content:
      'For UK Credit, fees are added to your loan amount (capitalised), so they form part of what you borrow and repay. The amount shown is specific to this offer.',
    tooltip: 'These fees are added to your loan amount and repaid with the loan.'
  }
};

export const getInfoModalContent = (key: string) => {
  const item = infoContent[key as keyof typeof infoContent];
  return item ? { title: item.title, content: item.content } : { title: 'Information', content: 'No information available.' };
};

/** Short text for hover tooltip on info icons */
export const getInfoTooltip = (key: string): string => {
  const item = infoContent[key as keyof typeof infoContent];
  return item?.tooltip ?? 'More information';
};

export const InfoModal: React.FC<InfoModalProps> = ({ activeInfoModal, closeInfoModal }) => {
  if (!activeInfoModal) return null;

  const { title, content } = getInfoModalContent(activeInfoModal);

  return (
    <div className="modal-overlay" onClick={closeInfoModal}>
      <div className="info-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="info-modal-header">
          <h3>{title}</h3>
          <button 
            className="modal-close-button"
            onClick={closeInfoModal}
          >
            <X size={20} />
          </button>
        </div>
        <div className="info-modal-body">
          <p>{content}</p>
        </div>
      </div>
    </div>
  );
};

/** Plain whole pounds only: no decimals, commas, or leading zeros; £ is separate in the UI. */
function normalizePlainPoundsInput(raw: string): string {
  const noExponent = raw.split(/[eE]/)[0] ?? '';
  const integerPart = noExponent.split('.')[0] ?? '';
  const digitsOnly = integerPart.replace(/\D/g, '');
  return digitsOnly.replace(/^0+/, '');
}

function initialLoanAmountDigits(amount: number): string {
  const n = Math.max(0, Math.floor(Number(amount)));
  return n === 0 ? '' : String(n);
}

interface ModifySearchModalProps {
  isModifyModalOpen: boolean;
  setIsModifyModalOpen: (isOpen: boolean) => void;
  webtoken: string | null;
  currentLoanAmount: number;
  currentLoanDuration: number;
  onUpdate: (loanAmount: number, loanDurationMonths: number) => Promise<void>;
}

export const ModifySearchModal: React.FC<ModifySearchModalProps> = ({ 
  isModifyModalOpen, 
  setIsModifyModalOpen,
  webtoken,
  currentLoanAmount,
  currentLoanDuration,
  onUpdate
}) => {
  const [loanAmountDigits, setLoanAmountDigits] = React.useState<string>(initialLoanAmountDigits(currentLoanAmount));
  const [loanTerm, setLoanTerm] = React.useState<string>(currentLoanDuration.toString());
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset form when modal opens/closes or current values change
  React.useEffect(() => {
    if (isModifyModalOpen) {
      setLoanAmountDigits(initialLoanAmountDigits(currentLoanAmount));
      setLoanTerm(currentLoanDuration.toString());
      setError(null);
    }
  }, [isModifyModalOpen, currentLoanAmount, currentLoanDuration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webtoken) {
      setError('Webtoken is missing. Please refresh the page.');
      return;
    }

    const parsedAmount = parseInt(loanAmountDigits, 10);

    if (loanAmountDigits === '' || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid loan amount.');
      return;
    }

    const parsedTerm = parseInt(loanTerm, 10);
    if (isNaN(parsedTerm) || parsedTerm <= 0) {
      setError('Please select a valid loan term.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onUpdate(parsedAmount, parsedTerm);
      setIsModifyModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update loan details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isModifyModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => !isSubmitting && setIsModifyModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Modify Your Search</h2>
          <button 
            className="modal-close-button"
            onClick={() => !isSubmitting && setIsModifyModalOpen(false)}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="error-message" style={{ 
                color: '#e74c3c', 
                padding: '10px', 
                marginBottom: '15px', 
                backgroundColor: '#fee',
                borderRadius: '4px'
              }}>
                {error}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="loanAmount">Loan amount</label>
              <div className="modify-loan-amount-field">
                <span className="modify-loan-amount-currency" aria-hidden="true">
                  £
                </span>
                <input
                  type="text"
                  id="loanAmount"
                  className="form-input modify-loan-amount-input"
                  placeholder="2500"
                  inputMode="numeric"
                  autoComplete="off"
                  name="loanAmountPounds"
                  value={loanAmountDigits}
                  onChange={(e) => setLoanAmountDigits(normalizePlainPoundsInput(e.target.value))}
                  disabled={isSubmitting}
                  aria-describedby="loanAmount-hint"
                  required
                />
              </div>
              <p id="loanAmount-hint" className="modify-loan-amount-hint">
                Whole pounds only, no pence.
              </p>
            </div>
            
            <div className="form-group">
              <label htmlFor="loanTerm">Loan Term</label>
              <select 
                id="loanTerm" 
                className="form-select" 
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                disabled={isSubmitting}
                required
              >
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="9">9 months</option>
                <option value="12">12 months</option>
                <option value="18">18 months</option>
                <option value="24">2 years</option>
                <option value="36">3 years</option>
                <option value="48">4 years</option>
                <option value="60">5 years</option>
                <option value="72">6 years</option>
                <option value="84">7 years</option>
                <option value="96">8 years</option>
                <option value="120">10 years</option>
                <option value="144">12 years</option>
                <option value="180">15 years</option>
                <option value="240">20 years</option>
              </select>
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              type="button"
              className="modal-cancel-button"
              onClick={() => setIsModifyModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="modal-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ContinueModalProps {
  isContinueModalOpen: boolean;
  setIsContinueModalOpen: (isOpen: boolean) => void;
  handleProceed: () => void;
  errorMessage?: string | null;
}

export const ContinueModal: React.FC<ContinueModalProps> = ({ isContinueModalOpen, setIsContinueModalOpen, handleProceed, errorMessage = null }) => {
  if (!isContinueModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setIsContinueModalOpen(false)}>
      <div className="continue-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="continue-modal-header">
          <h2>By clicking 'Proceed':</h2>
          <button 
            className="modal-close-button"
            onClick={() => setIsContinueModalOpen(false)}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="continue-modal-body">
          <div className="consent-item">
            <span className="consent-number">1.</span>
            <p>
              <em>You confirm that you agree to and accept our</em>{' '}
              <a href="https://www.loantube.com/terms-and-conditions/" target="_blank" rel="noopener noreferrer">Terms and Conditions</a>,{' '}
              <a href="https://www.loantube.com/privacy-policy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>{' '}
              <em>and</em>{' '}
              <a href="https://www.loantube.com/cookies-policy/" target="_blank" rel="noopener noreferrer">Cookie Policy</a>.
            </p>
          </div>
          
          <div className="consent-item">
            <span className="consent-number">2.</span>
            <p>
              <em>You consent to be contacted by LoanTube, its</em>{' '}
              <a href="https://www.loantube.com/our-partners/" target="_blank" rel="noopener noreferrer">Our Partners</a>{' '}
              <em>regarding this loan application, your experience with us, and other products and services via email, SMS, phone calls, and postal mail.</em>
            </p>
          </div>
          
          <div className="consent-item">
            <span className="consent-number">3.</span>
            <p>
              <em>You confirm that you understand the selected loan offer is subject to affordability, fraud, anti-money laundering, and other final checks by the lender.</em>
            </p>
          </div>
          
          <div className="consent-item">
            <span className="consent-number">4.</span>
            <p>
              <em>You acknowledge that you understand LoanTube earns commissions from its partner lenders as part of its business operations, and that in some cases, these commissions may influence the loan costs offered to you.</em>
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="continue-modal-error" role="alert">
            {errorMessage}
          </div>
        )}
        
        <div className="continue-modal-footer">
          <button 
            className="modal-cancel-button"
            onClick={() => setIsContinueModalOpen(false)}
          >
            Cancel
          </button>
          <button 
            className="modal-proceed-button"
            onClick={handleProceed}
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
}; 