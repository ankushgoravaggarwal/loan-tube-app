import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

/**
 * Redirect from email campaign URL to offer page.
 * URL: /customer/viewloandetails?token1=...&token2=...&utm_source=...&utm_campaign=...&utm_medium=...
 * Redirects to: /customer/application-result?applicationId=<token2>&utm_source=...&utm_medium=...&utm_campaign=...
 */
export default function ViewLoandetailsRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token2 = searchParams.get('token2');
    const utm_source = searchParams.get('utm_source');
    const utm_medium = searchParams.get('utm_medium');
    const utm_campaign = searchParams.get('utm_campaign');

    const params = new URLSearchParams();
    if (token2 != null && token2.trim() !== '') {
      params.set('applicationId', token2.trim());
    }
    if (utm_source != null && utm_source.trim() !== '') {
      params.set('utm_source', utm_source.trim());
    }
    if (utm_medium != null && utm_medium.trim() !== '') {
      params.set('utm_medium', utm_medium.trim());
    }
    if (utm_campaign != null && utm_campaign.trim() !== '') {
      params.set('utm_campaign', utm_campaign.trim());
    }

    const query = params.toString();
    navigate(`/customer/application-result${query ? `?${query}` : ''}`, { replace: true });
  }, [searchParams, navigate]);

  return null;
}
