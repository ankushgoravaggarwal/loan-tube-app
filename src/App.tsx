import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, memo, useEffect } from 'react';
import { RecaptchaProvider } from './components/RecaptchaProvider';
import { PartnerProvider, usePartner } from './partner/PartnerContext';
import './styles/App.css';

// Lazy load heavy components for better performance
const LoanForm = lazy(() => import('./components/LoanForm'));
const NotFound = lazy(() => import('./components/NotFound'));
const OfferPage = lazy(() => import('./offer-page/OfferPage'));
const LenderDeeplink = lazy(() => import('./offer-page/LenderDeeplink'));
const LenderResult = lazy(() => import('./offer-page/LenderResult'));
const TestApp = lazy(() => import('./components/TestApp'));

// Optimized loading component
const LoadingScreen = memo(({ text = "Loading Application Form..." }: { text?: string }) => {
  return (
    <div className="app-loading">
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
      <p className="loading-text">{text}</p>
    </div>
  );
});

// Optimized content component with memoization
const AppContent = memo(() => {
  const {partner, isPartnerRoute, loading} = usePartner();
  
  // Show loading screen ONLY if we're on a partner route and still loading
  if (isPartnerRoute && loading) {
    return <LoadingScreen />;
  }
  
  // Show NotFound ONLY for partner routes that don't exist
  if (isPartnerRoute && !loading && !partner) {
    return (
      <Suspense fallback={null}>
        <NotFound />
      </Suspense>
    );
  }
  
  // Regular route - load immediately without loading screen
  return (
    <div className="App">
      <Suspense fallback={null}>
        <LoanForm />
      </Suspense>
    </div>
  );
});

// Memoized route components for better performance
const OfferPageRoute = memo(() => {
  const { loading: partnerLoading } = usePartner();
  
  // Ensure GTM loads immediately on offer page navigation inside SPA
  useEffect(() => {
    const win = window as unknown as { loadGTM?: () => void };
    if (typeof win.loadGTM === 'function') {
      win.loadGTM();
    }
  }, []);
  
  // Show loading screen while partner data loads
  if (partnerLoading) {
    return <LoadingScreen text="Loading loan offers..." />;
  }
  
  return (
    <Suspense fallback={<LoadingScreen text="Loading loan offers..." />}>
      <OfferPage />
    </Suspense>
  );
});

const LenderDeeplinkRoute = memo(() => (
  <Suspense fallback={null}>
    <LenderDeeplink />
  </Suspense>
));

const LenderResultRoute = memo(() => (
  <Suspense fallback={null}>
    <LenderResult />
  </Suspense>
));

const TestAppRoute = memo(() => (
  <Suspense fallback={null}>
    <TestApp />
  </Suspense>
));

// Main App component with optimisations
function App() {
  // Get reCaptcha key from environment variables
  const RECAPTCHA_V3_SITE_KEY = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY as string || '';
  
  return (
    <>
      <PartnerProvider>
        <RecaptchaProvider reCaptchaKey={RECAPTCHA_V3_SITE_KEY}>
          <BrowserRouter>
            <Routes>
              <Route path="/customer/application-result" element={<OfferPageRoute />} />
              <Route path="/offerpage" element={<OfferPageRoute />} />
              <Route path="/lender-deeplink" element={<LenderDeeplinkRoute />} />
              <Route path="/lender-result" element={<LenderResultRoute />} />
              <Route path="/testapp" element={<TestAppRoute />} />
              <Route path="/*" element={<AppContent />} />
            </Routes>
          </BrowserRouter>
        </RecaptchaProvider>
      </PartnerProvider>
    </>
  );
}

export default App;