import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Partner, getPartnerBySlug } from './partnerService';

interface PartnerContextType {
  partner: Partner | null;
  loading: boolean;
  error: string | null;
  isPartnerRoute: boolean;
}

const PartnerContext = createContext<PartnerContextType>({
  partner: null,
  loading: false,
  error: null,
  isPartnerRoute: false
});

export const usePartner = () => useContext(PartnerContext);

export const PartnerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState({
    partner: null as Partner | null,
    loading: true,
    error: null as string | null,
    isPartnerRoute: false
  });
  
  const loadPartner = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Extract first path segment as slug
      const path = window.location.pathname;
      const slug = path.split('/').filter(Boolean)[0];
      
      if (!slug) {
        setState(prev => ({ ...prev, isPartnerRoute: false, loading: false }));
        return;
      }
      
      setState(prev => ({ ...prev, isPartnerRoute: true }));
      const partnerData = await getPartnerBySlug(slug);
      setState(prev => ({ ...prev, partner: partnerData, loading: false }));
    } catch (err) {
      console.warn('Partner loading failed:', err);
      // Still show the page with default styling instead of blocking
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load partner data', 
        loading: false,
        partner: null 
      }));
    }
  };

  useEffect(() => {
    loadPartner();
    
    // Listen for route changes
    window.addEventListener('popstate', loadPartner);
    return () => window.removeEventListener('popstate', loadPartner);
  }, []);

  return (
    <PartnerContext.Provider value={state}>
      {children}
    </PartnerContext.Provider>
  );
}; 