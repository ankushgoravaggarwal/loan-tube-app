/**
 * Customer Lender Result – entry for /customer/lenderresult?d=<base64>.
 * Decodes payload, detects lender variant, builds view, and renders the appropriate lender module.
 */
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { decodePayload, getLenderVariant, buildLenderResultView, getDummyEvloView, getDummySelfyView, getDummyEvolutionView, getDummyLoansCoUkView } from './utils';
import type { LenderVariant } from './types';
import ErrorView from './ErrorView';
import EvloResult from './EvloResult';
import EvolutionResult from './EvolutionResult';
import LoansCoUkResult from './LoansCoUkResult';
import SelfyResult from './SelfyResult';
import GenericResult from './GenericResult';

const CustomerLenderResult: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const evloConnectStep = searchParams.get('step') === 'connect';

  const { view, variant, error } = useMemo(() => {
    // const testEvlo = searchParams.get('test') === 'evlo';
    // if (testEvlo) {
    //   return { view: getDummyEvloView(), variant: 'evlo' as LenderVariant, error: null };
    // }
    // const testSelfy = searchParams.get('test') === 'selfy';
    // if (testSelfy) {
    //   return { view: getDummySelfyView(), variant: 'selfy' as LenderVariant, error: null };
    // }
    // const testEvolution = searchParams.get('test') === 'evolution';
    // if (testEvolution) {
    //   return { view: getDummyEvolutionView(), variant: 'evolution' as LenderVariant, error: null };
    // }
    // const testLoansCoUk = searchParams.get('test') === 'loanscouk';
    // if (testLoansCoUk) {
    //   return { view: getDummyLoansCoUkView(), variant: 'loanscouk' as LenderVariant, error: null };
    // }
    const d = searchParams.get('d');
    if (!d) return { view: null, variant: 'generic' as LenderVariant, error: 'Missing loan data.' };
    const decoded = decodePayload(d);
    if (!decoded) return { view: null, variant: 'generic' as LenderVariant, error: 'Invalid link.' };
    const variant = getLenderVariant(decoded.lenderCode);
    let view = buildLenderResultView(decoded);
    if (variant === 'evlo' || variant === 'selfy') {
      view = { ...view, isEvloConnect: true };
    }
    console.log('[CustomerLenderResult] index: variant', variant, 'view.hasAnyLoanFigures', view.hasAnyLoanFigures, 'view loan fields', {
      loanAmountNum: view.loanAmountNum,
      loanDurationNum: view.loanDurationNum,
      emiAmountNum: view.emiAmountNum,
      aprNum: view.aprNum,
      totalNum: view.totalNum,
    });
    return { view, variant, error: null };
  }, [searchParams]);

  const onGoBack = () => window.history.back();

  if (error || !view) {
    return <ErrorView message={error ?? 'Unable to load your result.'} onGoBack={onGoBack} />;
  }

  const onEvloContinueToConnect = () => {
    const d = searchParams.get('d');
    if (d) setSearchParams({ d, step: 'connect' });
  };

  switch (variant) {
    case 'evlo':
      return (
        <EvloResult
          view={view}
          onGoBack={onGoBack}
          showConnect={evloConnectStep}
          onContinueToConnect={onEvloContinueToConnect}
        />
      );
    case 'evolution':
      return <EvolutionResult view={view} onGoBack={onGoBack} />;
    case 'loanscouk':
      return <LoansCoUkResult view={view} onGoBack={onGoBack} />;
    case 'selfy':
      return <SelfyResult view={view} onGoBack={onGoBack} />;
    default:
      return <GenericResult view={view} onGoBack={onGoBack} />;
  }
};

export default CustomerLenderResult;
export type { DecodedLenderData, LenderResultView, LenderVariant } from './types';
