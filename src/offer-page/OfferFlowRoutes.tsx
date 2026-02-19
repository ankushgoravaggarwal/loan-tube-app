/**
 * Single entry for /lender-deeplink and /lender-result so both routes
 * use the same chunk (Evlo, Evolution, Selfy, Loans.co.uk → result; others → countdown then redirect).
 */
import { useLocation } from 'react-router-dom';
import LenderDeeplink from './LenderDeeplink';
import LenderResult from './LenderResult';

export default function OfferFlowRoutes() {
  const { pathname } = useLocation();
  if (pathname === '/lender-result') {
    return <LenderResult />;
  }
  return <LenderDeeplink />;
}
