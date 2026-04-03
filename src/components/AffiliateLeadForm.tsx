import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartner } from '../partner/PartnerContext';
import { NavigationButtons } from './ui';
import {
  getInitialAffiliateLeadState,
  LOAN_DURATION_MONTHS,
  LOAN_PURPOSES,
  GENDERS,
  DOB_MONTH_OPTIONS,
  MARITAL_STATUSES,
  RESIDENTIAL_STATUSES,
  INCOME_FREQUENCIES,
  EMPLOYMENT_TYPES,
  type AffiliateLeadFormState,
  type LoanPurpose,
} from '../affiliate-lead/types';
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateAllForSubmit,
  normalizeLoanAmountDigits,
  normalizeUkMobileSuffix,
  affiliateDobYearRange,
  maxAffiliateDobDay,
  getStep1FieldErrors,
  getStep2FieldErrors,
  getStep3FieldErrors,
  getStep4FieldErrors,
  getStep5ConsentError,
  UK_POSTCODE_MAX_LENGTH,
} from '../affiliate-lead/validation';
import { submitAffiliateLead } from '../services/affiliateLeadApi';
import { LOAN_PURPOSE_UI } from '../affiliate-lead/loanPurposeUi';

function redirectFromLeadResponse(
  navigate: ReturnType<typeof useNavigate>,
  data: { status?: string; redirect_url?: string }
) {
  const status = data.status;
  const redirectUrl = data.redirect_url;

  if (status === '1' && redirectUrl) {
    try {
      const urlObj = new URL(redirectUrl);
      navigate(urlObj.pathname + urlObj.search);
    } catch {
      const match = redirectUrl.match(/[?&]webtoken=([^&]+)/);
      if (match?.[1]) {
        navigate(
          `/customer/application-result?webtoken=${encodeURIComponent(match[1])}`
        );
      } else {
        navigate('/customer/application-result');
      }
    }
    return;
  }

  if (status === '2') {
    throw new Error(
      'Sorry — none of our lenders could offer a loan on this occasion, so there are no offers to show. This application cannot continue further.'
    );
  }

  navigate('/offerpage');
}

type OptionProps<T extends string> = {
  options: readonly T[];
  value: T | '';
  onSelect: (v: T) => void;
  selectedOptionStyle: React.CSSProperties;
  optionHoverStyle: React.CSSProperties;
};

function OptionGrid<T extends string>({
  options,
  value,
  onSelect,
  selectedOptionStyle,
  optionHoverStyle,
}: OptionProps<T>) {
  return (
    <div className="term-options-grid affiliate-option-grid">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`term-option ${value === opt ? 'selected' : ''}`}
          style={{
            ...(value === opt ? selectedOptionStyle : {}),
            ...optionHoverStyle,
          }}
          onClick={() => onSelect(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

const AffiliateLeadForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AffiliateLeadFormState>(
    getInitialAffiliateLeadState
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { partner, isPartnerRoute } = usePartner();

  const partnerStyles = useMemo(() => {
    if (!isPartnerRoute || !partner) {
      return {
        textColorStyle: {} as React.CSSProperties,
        inputFocusStyle: {} as React.CSSProperties,
        inputErrorStyle: {} as React.CSSProperties,
        errorMessageStyle: {} as React.CSSProperties,
        selectedOptionStyle: {} as React.CSSProperties,
        optionHoverStyle: {} as React.CSSProperties,
        buttonStyle: {} as React.CSSProperties,
      };
    }
    const primary = partner.primary_color;
    const selBg = partner.select_button_background_color || primary;
    const selText = partner.select_button_text_color;
    const err = partner.error_input_focus_color;
    const navBg = partner.navbar_button_background_color || primary;
    const navText = partner.navbar_button_text_color;
    return {
      textColorStyle: primary ? { color: primary } : {},
      inputFocusStyle: err ? { borderColor: err } : {},
      inputErrorStyle: err ? { borderColor: err } : {},
      errorMessageStyle: err ? { color: err } : {},
      selectedOptionStyle: {
        ...(selBg ? { backgroundColor: selBg, borderColor: selBg } : {}),
        ...(selText ? { color: selText } : {}),
      },
      optionHoverStyle: selBg
        ? ({ '--hover-text-color': selBg } as React.CSSProperties)
        : {},
      buttonStyle: {
        ...(navBg ? { backgroundColor: navBg } : {}),
        ...(navText ? { color: navText } : {}),
      },
    };
  }, [isPartnerRoute, partner]);

  const {
    textColorStyle,
    inputFocusStyle,
    inputErrorStyle,
    errorMessageStyle,
    selectedOptionStyle,
    optionHoverStyle,
    buttonStyle,
  } = partnerStyles;

  const fieldErrStyle = useMemo(
    () =>
      ({
        color: '#dc2626',
        ...errorMessageStyle,
      }) as React.CSSProperties,
    [errorMessageStyle]
  );

  const [dirtyFields, setDirtyFields] = useState(() => new Set<string>());
  const markDirty = useCallback((stepNum: number, field: string) => {
    const k = `${stepNum}:${field}`;
    setDirtyFields((prev) => {
      if (prev.has(k)) return prev;
      const next = new Set(prev);
      next.add(k);
      return next;
    });
  }, []);

  const showFieldError = useCallback(
    (stepNum: number, field: string, message?: string) =>
      Boolean(message && dirtyFields.has(`${stepNum}:${field}`)),
    [dirtyFields]
  );

  const step1Err = useMemo(() => getStep1FieldErrors(form), [form]);
  const step2Err = useMemo(() => getStep2FieldErrors(form), [form]);
  const step3Err = useMemo(() => getStep3FieldErrors(form), [form]);
  const step4Err = useMemo(() => getStep4FieldErrors(form), [form]);
  const step5ConsentErr = useMemo(() => getStep5ConsentError(form), [form]);

  const update = useCallback(
    (patch: Partial<AffiliateLeadFormState>) => {
      setForm((prev) => ({ ...prev, ...patch }));
      setSubmitError(null);
    },
    [setForm]
  );

  const dobYearOptions = useMemo(() => {
    const { min, max } = affiliateDobYearRange();
    const ys: number[] = [];
    for (let y = max; y >= min; y -= 1) ys.push(y);
    return ys;
  }, []);

  const dobMaxDay = useMemo(
    () => maxAffiliateDobDay(form.dobMonth, form.dobYear),
    [form.dobMonth, form.dobYear]
  );

  const dobDayOptions = useMemo(
    () => Array.from({ length: dobMaxDay }, (_, i) => String(i + 1)),
    [dobMaxDay]
  );

  useEffect(() => {
    const d = parseInt(form.dobDay, 10);
    if (!form.dobDay || !Number.isFinite(d)) return;
    if (d > dobMaxDay) update({ dobDay: String(dobMaxDay) });
  }, [dobMaxDay, form.dobDay, update]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const amount = q.get('amount');
    const term = q.get('term');
    const purpose = q.get('purpose');

    setForm((prev) => {
      const next = { ...prev };
      if (amount) next.loanAmount = normalizeLoanAmountDigits(amount);
      if (term) {
        const n = parseInt(term.replace(/\D/g, ''), 10);
        if (LOAN_DURATION_MONTHS.includes(n as (typeof LOAN_DURATION_MONTHS)[number]))
          next.loanDurationMonths = n as AffiliateLeadFormState['loanDurationMonths'];
      }
      if (purpose) {
        const map: Record<string, LoanPurpose> = {
          car: 'Car',
          car_purchase: 'Car',
          home_improvement: 'Home Improvement',
          debt_consolidation: 'Debt Consolidation',
          wedding: 'Wedding',
          holiday: 'Holiday',
          other: 'Other',
        };
        const p = map[purpose.toLowerCase()] ||
          (LOAN_PURPOSES.includes(purpose as LoanPurpose)
            ? (purpose as LoanPurpose)
            : '');
        if (p) next.loanPurpose = p;
      }
      const fn = q.get('first_name');
      const ln = q.get('last_name');
      const em = q.get('email');
      const ph = q.get('phone');
      if (fn) next.firstName = fn;
      if (ln) next.lastName = ln;
      if (em) next.email = em;
      if (ph) next.cellPhone = normalizeUkMobileSuffix(ph);
      return next;
    });
  }, []);

  const progressPct = useMemo(
    () => ((step - 1) / 4) * 100,
    [step]
  );

  const progressStyle = useMemo(() => {
    const base = { width: `${progressPct}%` };
    if (partner?.primary_color)
      return { ...base, backgroundColor: partner.primary_color };
    return base;
  }, [progressPct, partner?.primary_color]);

  const stepTitle = [
    '',
    'Loan Details',
    'Personal Details',
    'Residential Details',
    'Financial Details',
    'Consent & submit',
  ][step];

  const handleNext = () => {
    if (step >= 5) return;
    const ok =
      (step === 1 && validateStep1(form)) ||
      (step === 2 && validateStep2(form)) ||
      (step === 3 && validateStep3(form)) ||
      (step === 4 && validateStep4(form));
    if (ok) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!validateAllForSubmit(form)) {
      setSubmitError('Please complete all steps before submitting.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await submitAffiliateLead(form);
      redirectFromLeadResponse(navigate, res);
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container affiliate-lead-form">
      <div className="progress-container">
        <div className="progress-label" style={textColorStyle}>
          {stepTitle}
        </div>
        <div className="progress-bar">
          <div className="progress-indicator" style={progressStyle} />
        </div>
      </div>

      {step === 1 && (
        <div className="affiliate-step1">
          <div className="input-container affiliate-step1-amount-block">
            <label className="input-label affiliate-step1-money-label">
              Loan amount
            </label>
            <div className="affiliate-sticky-pound-wrap">
              <span className="affiliate-sticky-pound" aria-hidden="true">
                £
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                aria-label="Loan amount in pounds, digits only"
                className={`input-field affiliate-step1-amount-input affiliate-step1-amount-input--with-pound ${showFieldError(1, 'loanAmount', step1Err.loanAmount) ? 'error' : ''}`}
                placeholder="5000"
                value={form.loanAmount}
                onChange={(e) => {
                  markDirty(1, 'loanAmount');
                  update({ loanAmount: normalizeLoanAmountDigits(e.target.value) });
                }}
                style={
                  showFieldError(1, 'loanAmount', step1Err.loanAmount)
                    ? inputErrorStyle
                    : {}
                }
                autoFocus
              />
            </div>
            {showFieldError(1, 'loanAmount', step1Err.loanAmount) && (
              <p
                className="affiliate-field-error-msg"
                style={fieldErrStyle}
                role="alert"
              >
                {step1Err.loanAmount}
              </p>
            )}
          </div>

          <div className="input-container affiliate-step1-term-block">
            <label
              className="input-label affiliate-step1-money-label"
              htmlFor="affiliate-loan-term"
            >
              Loan term
            </label>
            <div className="affiliate-select-wrap">
              <select
                id="affiliate-loan-term"
                className={`input-field affiliate-select ${showFieldError(1, 'loanDurationMonths', step1Err.loanDurationMonths) ? 'error' : ''}`}
                value={form.loanDurationMonths === '' ? '' : String(form.loanDurationMonths)}
                onChange={(e) => {
                  markDirty(1, 'loanDurationMonths');
                  const v = e.target.value;
                  update({
                    loanDurationMonths: v
                      ? (Number(v) as AffiliateLeadFormState['loanDurationMonths'])
                      : '',
                  });
                }}
                style={
                  showFieldError(1, 'loanDurationMonths', step1Err.loanDurationMonths)
                    ? inputErrorStyle
                    : {}
                }
              >
                <option value="">Select repayment period</option>
                {LOAN_DURATION_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m} {m === 1 ? 'month' : 'months'}
                  </option>
                ))}
              </select>
            </div>
            {showFieldError(1, 'loanDurationMonths', step1Err.loanDurationMonths) && (
              <p
                className="affiliate-field-error-msg"
                style={fieldErrStyle}
                role="alert"
              >
                {step1Err.loanDurationMonths}
              </p>
            )}
          </div>

          <h2 className="form-title affiliate-purpose-heading">Select your loan purpose</h2>
          <div className="affiliate-purpose-grid" role="list">
            {LOAN_PURPOSE_UI.map(({ purpose, label, Icon }) => {
              const selected = form.loanPurpose === purpose;
              return (
                <button
                  key={purpose}
                  type="button"
                  role="listitem"
                  aria-label={purpose}
                  aria-pressed={selected}
                  className={`affiliate-purpose-card ${selected ? 'affiliate-purpose-card--selected' : ''}`}
                  style={{
                    ...(selected && partner?.primary_color
                      ? {
                          borderColor: partner.primary_color,
                          background: `linear-gradient(155deg, ${partner.primary_color}18, #ffffff 55%)`,
                          boxShadow: `0 8px 28px ${partner.primary_color}28`,
                        }
                      : {}),
                  }}
                  onClick={() => {
                    markDirty(1, 'loanPurpose');
                    update({ loanPurpose: purpose });
                  }}
                >
                  <span
                    className="affiliate-purpose-card-icon"
                    aria-hidden
                    style={
                      selected && partner?.primary_color
                        ? { color: partner.primary_color }
                        : undefined
                    }
                  >
                    <Icon size={22} strokeWidth={1.75} />
                  </span>
                  <span className="affiliate-purpose-card-text">
                    <span className="affiliate-purpose-card-title">{label}</span>
                  </span>
                  {selected && (
                    <span className="affiliate-purpose-card-check" aria-hidden>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {showFieldError(1, 'loanPurpose', step1Err.loanPurpose) && (
            <p
              className="affiliate-field-error-msg affiliate-purpose-error-msg"
              style={fieldErrStyle}
              role="alert"
            >
              {step1Err.loanPurpose}
            </p>
          )}

          <NavigationButtons
            nextStep={handleNext}
            prevStep={undefined}
            isNextDisabled={!validateStep1(form)}
            nextButtonId="affiliate_step1_next"
          />
        </div>
      )}

      {step === 2 && (
        <div className="affiliate-step2">
          <h2 className="form-title affiliate-step2-main-title">Your details</h2>
          <div className="affiliate-step2-name-row">
            <div className="input-container">
              <label className="input-label" style={textColorStyle}>
                First name
              </label>
              <input
                type="text"
                autoComplete="given-name"
                className={`input-field ${showFieldError(2, 'firstName', step2Err.firstName) ? 'error' : ''}`}
                value={form.firstName}
                onChange={(e) => {
                  markDirty(2, 'firstName');
                  update({ firstName: e.target.value });
                }}
                style={
                  showFieldError(2, 'firstName', step2Err.firstName)
                    ? inputErrorStyle
                    : {}
                }
              />
              {showFieldError(2, 'firstName', step2Err.firstName) && (
                <p
                  className="affiliate-field-error-msg"
                  style={fieldErrStyle}
                  role="alert"
                >
                  {step2Err.firstName}
                </p>
              )}
            </div>
            <div className="input-container">
              <label className="input-label" style={textColorStyle}>
                Last name
              </label>
              <input
                type="text"
                autoComplete="family-name"
                className={`input-field ${showFieldError(2, 'lastName', step2Err.lastName) ? 'error' : ''}`}
                value={form.lastName}
                onChange={(e) => {
                  markDirty(2, 'lastName');
                  update({ lastName: e.target.value });
                }}
                style={
                  showFieldError(2, 'lastName', step2Err.lastName)
                    ? inputErrorStyle
                    : {}
                }
              />
              {showFieldError(2, 'lastName', step2Err.lastName) && (
                <p
                  className="affiliate-field-error-msg"
                  style={fieldErrStyle}
                  role="alert"
                >
                  {step2Err.lastName}
                </p>
              )}
            </div>
          </div>
          <div className="affiliate-step2-dob-block">
            <div className="affiliate-dob-main-label" style={textColorStyle}>
              Date of birth
            </div>
            <div className="affiliate-dob-grid">
              <div className="affiliate-dob-cell affiliate-dob-cell--day">
                <label className="affiliate-dob-sublabel" htmlFor="affiliate-dob-day">
                  Day
                </label>
                <div className="affiliate-select-wrap affiliate-dob-day-wrap">
                  <select
                    id="affiliate-dob-day"
                    autoComplete="bday-day"
                    className={`input-field affiliate-select affiliate-dob-day-select ${showFieldError(2, 'dob', step2Err.dob) ? 'error' : ''}`}
                    value={form.dobDay}
                    onChange={(e) => {
                      markDirty(2, 'dob');
                      update({ dobDay: e.target.value });
                    }}
                    style={
                      showFieldError(2, 'dob', step2Err.dob) ? inputErrorStyle : {}
                    }
                  >
                    <option value="">Select day</option>
                    {dobDayOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="affiliate-dob-cell affiliate-dob-cell--month">
                <label
                  className="affiliate-dob-sublabel"
                  htmlFor="affiliate-dob-month"
                >
                  Month
                </label>
                <div className="affiliate-select-wrap affiliate-dob-month-wrap">
                  <select
                    id="affiliate-dob-month"
                    autoComplete="bday-month"
                    className={`input-field affiliate-select affiliate-dob-month-select ${showFieldError(2, 'dob', step2Err.dob) ? 'error' : ''}`}
                    value={form.dobMonth}
                    onChange={(e) => {
                      markDirty(2, 'dob');
                      update({ dobMonth: e.target.value });
                    }}
                    style={
                      showFieldError(2, 'dob', step2Err.dob) ? inputErrorStyle : {}
                    }
                  >
                    <option value="">Select month</option>
                    {DOB_MONTH_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="affiliate-dob-cell affiliate-dob-cell--year">
                <label className="affiliate-dob-sublabel" htmlFor="affiliate-dob-year">
                  Year
                </label>
                <div className="affiliate-select-wrap affiliate-dob-year-wrap">
                  <select
                    id="affiliate-dob-year"
                    autoComplete="bday-year"
                    className={`input-field affiliate-select affiliate-dob-year-select ${showFieldError(2, 'dob', step2Err.dob) ? 'error' : ''}`}
                    value={form.dobYear}
                    onChange={(e) => {
                      markDirty(2, 'dob');
                      update({ dobYear: e.target.value });
                    }}
                    style={
                      showFieldError(2, 'dob', step2Err.dob) ? inputErrorStyle : {}
                    }
                  >
                    <option value="">Select year</option>
                    {dobYearOptions.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {showFieldError(2, 'dob', step2Err.dob) && (
              <p
                className="affiliate-field-error-msg"
                style={fieldErrStyle}
                role="alert"
              >
                {step2Err.dob}
              </p>
            )}
          </div>
          <h3 className="affiliate-step2-subheading">Gender *</h3>
          <OptionGrid
            options={GENDERS}
            value={form.gender}
            onSelect={(v) => {
              markDirty(2, 'gender');
              update({ gender: v as AffiliateLeadFormState['gender'] });
            }}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
          />
          {showFieldError(2, 'gender', step2Err.gender) && (
            <p
              className="affiliate-field-error-msg"
              style={fieldErrStyle}
              role="alert"
            >
              {step2Err.gender}
            </p>
          )}
          <div className="input-container">
            <label className="input-label" style={textColorStyle}>
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              className={`input-field ${showFieldError(2, 'email', step2Err.email) ? 'error' : ''}`}
              value={form.email}
              onChange={(e) => {
                markDirty(2, 'email');
                update({ email: e.target.value });
              }}
              style={
                showFieldError(2, 'email', step2Err.email) ? inputErrorStyle : {}
              }
            />
            {showFieldError(2, 'email', step2Err.email) && (
              <p
                className="affiliate-field-error-msg"
                style={fieldErrStyle}
                role="alert"
              >
                {step2Err.email}
              </p>
            )}
          </div>
          <div className="input-container">
            <label className="input-label" style={textColorStyle}>
              Mobile (UK)
            </label>
            <div
              className={`affiliate-sticky-mobile-wrap ${showFieldError(2, 'cellPhone', step2Err.cellPhone) ? 'affiliate-sticky-mobile-wrap--error' : ''}`}
            >
              <span className="affiliate-sticky-07" aria-hidden="true">
                07
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="tel"
                className={`input-field affiliate-step2-mobile-input--with-07 ${showFieldError(2, 'cellPhone', step2Err.cellPhone) ? 'error' : ''}`}
                placeholder="123456789"
                aria-label="UK mobile: 9 digits after 07"
                maxLength={9}
                value={form.cellPhone}
                onChange={(e) => {
                  markDirty(2, 'cellPhone');
                  update({
                    cellPhone: normalizeUkMobileSuffix(e.target.value),
                  });
                }}
                style={
                  showFieldError(2, 'cellPhone', step2Err.cellPhone)
                    ? inputErrorStyle
                    : {}
                }
              />
            </div>
            {showFieldError(2, 'cellPhone', step2Err.cellPhone) && (
              <p
                className="affiliate-field-error-msg"
                style={fieldErrStyle}
                role="alert"
              >
                {step2Err.cellPhone}
              </p>
            )}
          </div>
          <div className="affiliate-step2-marital-dependents-row">
            <div className="input-container affiliate-step2-marital-cell">
              <label
                className="input-label"
                style={textColorStyle}
                htmlFor="affiliate-marital-status"
              >
                Marital status
              </label>
              <div className="affiliate-select-wrap">
                <select
                  id="affiliate-marital-status"
                  className={`input-field affiliate-select ${showFieldError(2, 'maritalStatus', step2Err.maritalStatus) ? 'error' : ''}`}
                  value={form.maritalStatus === '' ? '' : form.maritalStatus}
                  onChange={(e) => {
                    markDirty(2, 'maritalStatus');
                    const v = e.target.value;
                    update({
                      maritalStatus: v
                        ? (v as AffiliateLeadFormState['maritalStatus'])
                        : '',
                    });
                  }}
                  style={
                    showFieldError(2, 'maritalStatus', step2Err.maritalStatus)
                      ? inputErrorStyle
                      : {}
                  }
                >
                  <option value="">Select marital status</option>
                  {MARITAL_STATUSES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              {showFieldError(2, 'maritalStatus', step2Err.maritalStatus) && (
                <p
                  className="affiliate-field-error-msg"
                  style={fieldErrStyle}
                  role="alert"
                >
                  {step2Err.maritalStatus}
                </p>
              )}
            </div>
            <div className="input-container affiliate-step2-dependents-cell">
              <label className="input-label" style={textColorStyle}>
                Dependents
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                autoComplete="off"
                className={`input-field affiliate-step2-dependents-digit ${showFieldError(2, 'numberOfDependents', step2Err.numberOfDependents) ? 'error' : ''}`}
                aria-label="Number of dependents, single digit"
                value={form.numberOfDependents}
                onChange={(e) => {
                  markDirty(2, 'numberOfDependents');
                  const d = e.target.value.replace(/\D/g, '').slice(0, 1);
                  update({ numberOfDependents: d });
                }}
                style={
                  showFieldError(2, 'numberOfDependents', step2Err.numberOfDependents)
                    ? inputErrorStyle
                    : {}
                }
              />
              {showFieldError(2, 'numberOfDependents', step2Err.numberOfDependents) && (
                <p
                  className="affiliate-field-error-msg"
                  style={fieldErrStyle}
                  role="alert"
                >
                  {step2Err.numberOfDependents}
                </p>
              )}
            </div>
          </div>
          <NavigationButtons
            prevStep={handleBack}
            nextStep={handleNext}
            isNextDisabled={!validateStep2(form)}
            backButtonId="affiliate_step2_back"
            nextButtonId="affiliate_step2_next"
          />
        </div>
      )}

      {step === 3 && (
        <div className="affiliate-step3">
          <h2 className="form-title affiliate-step-section-title">Your address</h2>
          <div className="affiliate-step3-postcode-months-row">
            <div className="input-container">
              <label className="input-label" style={textColorStyle}>
                Postcode
              </label>
              <input
                type="text"
                autoComplete="postal-code"
                maxLength={UK_POSTCODE_MAX_LENGTH}
                className={`input-field ${showFieldError(3, 'postCode', step3Err.postCode) ? 'error' : ''}`}
                value={form.postCode}
                onChange={(e) => {
                  markDirty(3, 'postCode');
                  const v = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9\s]/g, '')
                    .slice(0, UK_POSTCODE_MAX_LENGTH);
                  update({ postCode: v });
                }}
                style={
                  showFieldError(3, 'postCode', step3Err.postCode)
                    ? inputErrorStyle
                    : {}
                }
              />
              {showFieldError(3, 'postCode', step3Err.postCode) && (
                <p
                  className="affiliate-field-error-msg"
                  style={fieldErrStyle}
                  role="alert"
                >
                  {step3Err.postCode}
                </p>
              )}
            </div>
            <div className="input-container">
              <label className="input-label" style={textColorStyle}>
                Months at address
              </label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className={`input-field ${showFieldError(3, 'monthsAtAddress', step3Err.monthsAtAddress) ? 'error' : ''}`}
                value={form.monthsAtAddress}
                onChange={(e) => {
                  markDirty(3, 'monthsAtAddress');
                  update({ monthsAtAddress: e.target.value });
                }}
                style={
                  showFieldError(3, 'monthsAtAddress', step3Err.monthsAtAddress)
                    ? inputErrorStyle
                    : {}
                }
              />
              {showFieldError(3, 'monthsAtAddress', step3Err.monthsAtAddress) && (
                <p
                  className="affiliate-field-error-msg"
                  style={fieldErrStyle}
                  role="alert"
                >
                  {step3Err.monthsAtAddress}
                </p>
              )}
            </div>
          </div>
          <p className="affiliate-step3-address-line-hint">Building &amp; flat</p>
          <div className="affiliate-manual-address-grid">
            <input
              type="text"
              placeholder="House number"
              className={`manual-address-input ${showFieldError(3, 'houseNumber', step3Err.houseNumber) ? 'error' : ''}`}
              value={form.houseNumber}
              onChange={(e) => {
                markDirty(3, 'houseNumber');
                update({ houseNumber: e.target.value });
              }}
              style={
                showFieldError(3, 'houseNumber', step3Err.houseNumber)
                  ? inputErrorStyle
                  : {}
              }
            />
            <input
              type="text"
              placeholder="Flat (optional)"
              className="manual-address-input"
              value={form.flatNumber}
              onChange={(e) => update({ flatNumber: e.target.value })}
            />
            <input
              type="text"
              placeholder="House name (optional)"
              className="manual-address-input affiliate-manual-full-span"
              value={form.houseName}
              onChange={(e) => update({ houseName: e.target.value })}
            />
          </div>
          {showFieldError(3, 'houseNumber', step3Err.houseNumber) && (
            <p
              className="affiliate-field-error-msg affiliate-manual-address-error"
              style={fieldErrStyle}
              role="alert"
            >
              {step3Err.houseNumber}
            </p>
          )}
          <div className="affiliate-step3-street-city-row">
            <div className="input-container">
              <label className="input-label" style={textColorStyle}>
                Street
              </label>
              <input
                type="text"
                className={`input-field ${showFieldError(3, 'street', step3Err.street) ? 'error' : ''}`}
                value={form.street}
                onChange={(e) => {
                  markDirty(3, 'street');
                  update({ street: e.target.value });
                }}
                style={
                  showFieldError(3, 'street', step3Err.street)
                    ? inputErrorStyle
                    : {}
                }
              />
              {showFieldError(3, 'street', step3Err.street) && (
                <p
                  className="affiliate-field-error-msg"
                  style={fieldErrStyle}
                  role="alert"
                >
                  {step3Err.street}
                </p>
              )}
            </div>
            <div className="input-container">
              <label className="input-label" style={textColorStyle}>
                City / town
              </label>
              <input
                type="text"
                className={`input-field ${showFieldError(3, 'city', step3Err.city) ? 'error' : ''}`}
                value={form.city}
                onChange={(e) => {
                  markDirty(3, 'city');
                  update({ city: e.target.value });
                }}
                style={
                  showFieldError(3, 'city', step3Err.city) ? inputErrorStyle : {}
                }
              />
              {showFieldError(3, 'city', step3Err.city) && (
                <p
                  className="affiliate-field-error-msg"
                  style={fieldErrStyle}
                  role="alert"
                >
                  {step3Err.city}
                </p>
              )}
            </div>
          </div>
          <div className="input-container">
            <label className="input-label" style={textColorStyle}>
              County (optional)
            </label>
            <input
              type="text"
              className="input-field"
              value={form.county}
              onChange={(e) => update({ county: e.target.value })}
            />
          </div>
          <h3 className="affiliate-step2-subheading affiliate-step3-residential-heading">
            Residential status
          </h3>
          <OptionGrid
            options={RESIDENTIAL_STATUSES}
            value={form.residentialStatus}
            onSelect={(v) => {
              markDirty(3, 'residentialStatus');
              update({
                residentialStatus: v as AffiliateLeadFormState['residentialStatus'],
              });
            }}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
          />
          {showFieldError(3, 'residentialStatus', step3Err.residentialStatus) && (
            <p
              className="affiliate-field-error-msg"
              style={fieldErrStyle}
              role="alert"
            >
              {step3Err.residentialStatus}
            </p>
          )}
          <NavigationButtons
            prevStep={handleBack}
            nextStep={handleNext}
            isNextDisabled={!validateStep3(form)}
            backButtonId="affiliate_step3_back"
            nextButtonId="affiliate_step3_next"
          />
        </div>
      )}

      {step === 4 && (
        <div className="affiliate-step4">
          <h2 className="form-title affiliate-step-section-title">
            Income &amp; living costs
          </h2>
          <div className="affiliate-step4-amounts-row">
            <div className="input-container">
              <label className="input-label" style={textColorStyle}>
                Net monthly income (£)
              </label>
              <input
                type="text"
                inputMode="decimal"
                className={`input-field ${showFieldError(4, 'netMonthlyIncome', step4Err.netMonthlyIncome) ? 'error' : ''}`}
                value={form.netMonthlyIncome}
                onChange={(e) => {
                  markDirty(4, 'netMonthlyIncome');
                  update({
                    netMonthlyIncome: e.target.value.replace(/[^0-9.]/g, ''),
                  });
                }}
                style={
                  showFieldError(4, 'netMonthlyIncome', step4Err.netMonthlyIncome)
                    ? inputErrorStyle
                    : {}
                }
              />
              {showFieldError(4, 'netMonthlyIncome', step4Err.netMonthlyIncome) && (
                <p
                  className="affiliate-field-error-msg"
                  style={fieldErrStyle}
                  role="alert"
                >
                  {step4Err.netMonthlyIncome}
                </p>
              )}
            </div>
            <div className="input-container">
              <label className="input-label" style={textColorStyle}>
                Monthly housing (£)
              </label>
              <input
                type="text"
                inputMode="decimal"
                className={`input-field ${showFieldError(4, 'expenseHousing', step4Err.expenseHousing) ? 'error' : ''}`}
                value={form.expenseHousing}
                onChange={(e) => {
                  markDirty(4, 'expenseHousing');
                  update({
                    expenseHousing: e.target.value.replace(/[^0-9.]/g, ''),
                  });
                }}
                style={
                  showFieldError(4, 'expenseHousing', step4Err.expenseHousing)
                    ? inputErrorStyle
                    : {}
                }
              />
              {showFieldError(4, 'expenseHousing', step4Err.expenseHousing) && (
                <p
                  className="affiliate-field-error-msg"
                  style={fieldErrStyle}
                  role="alert"
                >
                  {step4Err.expenseHousing}
                </p>
              )}
            </div>
          </div>
          <h3 className="affiliate-step2-subheading">How often are you paid?</h3>
          <OptionGrid
            options={INCOME_FREQUENCIES}
            value={form.incomePaymentFrequency}
            onSelect={(v) => {
              markDirty(4, 'incomePaymentFrequency');
              update({
                incomePaymentFrequency:
                  v as AffiliateLeadFormState['incomePaymentFrequency'],
              });
            }}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
          />
          {showFieldError(
            4,
            'incomePaymentFrequency',
            step4Err.incomePaymentFrequency
          ) && (
            <p
              className="affiliate-field-error-msg"
              style={fieldErrStyle}
              role="alert"
            >
              {step4Err.incomePaymentFrequency}
            </p>
          )}
          <div className="input-container affiliate-step4-optional-date">
            <label className="input-label" style={textColorStyle}>
              Next pay date (optional)
            </label>
            <input
              type="date"
              className="input-field"
              value={form.incomeNextDate1}
              onChange={(e) => update({ incomeNextDate1: e.target.value })}
            />
          </div>
          <h3 className="affiliate-step2-subheading">Employment</h3>
          <OptionGrid
            options={EMPLOYMENT_TYPES}
            value={form.employmentType}
            onSelect={(v) => {
              markDirty(4, 'employmentType');
              update({
                employmentType: v as AffiliateLeadFormState['employmentType'],
              });
            }}
            selectedOptionStyle={selectedOptionStyle}
            optionHoverStyle={optionHoverStyle}
          />
          {showFieldError(4, 'employmentType', step4Err.employmentType) && (
            <p
              className="affiliate-field-error-msg"
              style={fieldErrStyle}
              role="alert"
            >
              {step4Err.employmentType}
            </p>
          )}
          <div className="input-container">
            <label className="input-label" style={textColorStyle}>
              Occupation
            </label>
            <input
              type="text"
              className={`input-field ${showFieldError(4, 'occupation', step4Err.occupation) ? 'error' : ''}`}
              value={form.occupation}
              onChange={(e) => {
                markDirty(4, 'occupation');
                update({ occupation: e.target.value });
              }}
              style={
                showFieldError(4, 'occupation', step4Err.occupation)
                  ? inputErrorStyle
                  : {}
              }
            />
            {showFieldError(4, 'occupation', step4Err.occupation) && (
              <p
                className="affiliate-field-error-msg"
                style={fieldErrStyle}
                role="alert"
              >
                {step4Err.occupation}
              </p>
            )}
          </div>
          <h3 className="affiliate-step2-subheading">Bank details</h3>
          <div className="affiliate-step4-bank-row">
            <div className="input-container">
              <label className="input-label" style={textColorStyle}>
                Account no. (8 digits)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                className={`input-field ${showFieldError(4, 'bankAccountNumber', step4Err.bankAccountNumber) ? 'error' : ''}`}
                value={form.bankAccountNumber}
                onChange={(e) => {
                  markDirty(4, 'bankAccountNumber');
                  update({
                    bankAccountNumber: e.target.value.replace(/\D/g, '').slice(0, 8),
                  });
                }}
                style={
                  showFieldError(4, 'bankAccountNumber', step4Err.bankAccountNumber)
                    ? inputErrorStyle
                    : {}
                }
              />
              {showFieldError(4, 'bankAccountNumber', step4Err.bankAccountNumber) && (
                <p
                  className="affiliate-field-error-msg"
                  style={fieldErrStyle}
                  role="alert"
                >
                  {step4Err.bankAccountNumber}
                </p>
              )}
            </div>
            <div className="input-container">
              <label className="input-label" style={textColorStyle}>
                Sort code (6 digits)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                className={`input-field ${showFieldError(4, 'bankSortCode', step4Err.bankSortCode) ? 'error' : ''}`}
                placeholder="00-00-00"
                value={form.bankSortCode}
                onChange={(e) => {
                  markDirty(4, 'bankSortCode');
                  update({
                    bankSortCode: e.target.value.replace(/\D/g, '').slice(0, 6),
                  });
                }}
                style={
                  showFieldError(4, 'bankSortCode', step4Err.bankSortCode)
                    ? inputErrorStyle
                    : {}
                }
              />
              {showFieldError(4, 'bankSortCode', step4Err.bankSortCode) && (
                <p
                  className="affiliate-field-error-msg"
                  style={fieldErrStyle}
                  role="alert"
                >
                  {step4Err.bankSortCode}
                </p>
              )}
            </div>
          </div>
          <NavigationButtons
            prevStep={handleBack}
            nextStep={handleNext}
            isNextDisabled={!validateStep4(form)}
            backButtonId="affiliate_step4_back"
            nextButtonId="affiliate_step4_next"
          />
        </div>
      )}

      {step === 5 && (
        <div className="affiliate-step5">
          <h2 className="form-title affiliate-step-section-title">Review &amp; consent</h2>
          <p className="affiliate-field-hint affiliate-step5-lead">
            Please confirm the required items below. You can still choose how we may
            contact you for marketing.
          </p>
          <div className="affiliate-consent-panel">
            <p className="affiliate-consent-panel-label">Required</p>
            <div className="affiliate-consent-list">
              <label className="affiliate-consent-row">
                <input
                  type="checkbox"
                  checked={form.consentTerms}
                  onChange={(e) => {
                    markDirty(5, 'consent');
                    update({ consentTerms: e.target.checked });
                  }}
                />
                <span style={textColorStyle}>
                  I accept the terms and conditions and privacy policy.
                </span>
              </label>
              <label className="affiliate-consent-row">
                <input
                  type="checkbox"
                  checked={form.consentCreditSearch}
                  onChange={(e) => {
                    markDirty(5, 'consent');
                    update({ consentCreditSearch: e.target.checked });
                  }}
                />
                <span style={textColorStyle}>
                  I consent to a credit search and affordability assessment.
                </span>
              </label>
              <label className="affiliate-consent-row">
                <input
                  type="checkbox"
                  checked={form.consentDataProcessing}
                  onChange={(e) => {
                    markDirty(5, 'consent');
                    update({ consentDataProcessing: e.target.checked });
                  }}
                />
                <span style={textColorStyle}>
                  I consent to processing of my data to assess this application.
                </span>
              </label>
              <label className="affiliate-consent-row">
                <input
                  type="checkbox"
                  checked={form.consentFinancial}
                  onChange={(e) => {
                    markDirty(5, 'consent');
                    update({ consentFinancial: e.target.checked });
                  }}
                />
                <span style={textColorStyle}>
                  I consent to financial processing and relevant disclosures in
                  connection with this application.
                </span>
              </label>
              <label className="affiliate-consent-row">
                <input
                  type="checkbox"
                  checked={form.consentContact}
                  onChange={(e) => {
                    markDirty(5, 'consent');
                    update({ consentContact: e.target.checked });
                  }}
                />
                <span style={textColorStyle}>
                  I consent to being contacted about this application (for example
                  by phone, email or SMS). This is separate from marketing below.
                </span>
              </label>
            </div>
          </div>
          {showFieldError(5, 'consent', step5ConsentErr) && (
            <p
              className="affiliate-field-error-msg affiliate-step5-consent-error"
              style={fieldErrStyle}
              role="alert"
            >
              {step5ConsentErr}
            </p>
          )}
          <div className="affiliate-marketing-panel">
            <h3 className="affiliate-step2-subheading affiliate-marketing-heading">
              Marketing (optional)
            </h3>
            <p className="affiliate-field-hint affiliate-marketing-hint">
              Choose how you&apos;d like to hear about offers and news.
            </p>
            <div className="affiliate-marketing-grid">
              <label className="affiliate-marketing-chip">
                <input
                  type="checkbox"
                  checked={form.marketingEmail}
                  onChange={(e) => update({ marketingEmail: e.target.checked })}
                />
                <span>Email</span>
              </label>
              <label className="affiliate-marketing-chip">
                <input
                  type="checkbox"
                  checked={form.marketingPhone}
                  onChange={(e) => update({ marketingPhone: e.target.checked })}
                />
                <span>Phone</span>
              </label>
              <label className="affiliate-marketing-chip">
                <input
                  type="checkbox"
                  checked={form.marketingSMS}
                  onChange={(e) => update({ marketingSMS: e.target.checked })}
                />
                <span>SMS</span>
              </label>
            </div>
          </div>

          {submitError && (
            <p
              className="affiliate-field-error-msg affiliate-submit-error"
              style={{ ...fieldErrStyle, ...errorMessageStyle }}
              role="alert"
            >
              {submitError}
            </p>
          )}

          <div className="navigation-buttons">
            <button
              type="button"
              className="back-button"
              onClick={handleBack}
              id="affiliate_step5_back"
            >
              <span>
                <svg
                  className="back-button-icon"
                  viewBox="64 64 896 896"
                  focusable="false"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z" />
                </svg>
              </span>{' '}
              Back
            </button>
            <button
              type="button"
              className={`next-button ${validateAllForSubmit(form) && !submitting ? 'enabled' : 'disabled'}`}
              disabled={!validateAllForSubmit(form) || submitting}
              onClick={() => void handleSubmit()}
              style={buttonStyle}
              id="affiliate_submit"
            >
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateLeadForm;
