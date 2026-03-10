import { useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

/**
 * Redirect from SMS link URL to offer page.
 * URL: /{applicationId}:{smsnumber} e.g. /12345:447123456789
 * Redirects to: /customer/application-result?applicationId=12345&utm_source=Telesign&utm_medium=sms&utm_campaign=447123456789
 * If segment does not match \d+:\d+, redirect to home.
 */
export default function SmsOfferRedirect({ fallback }: { fallback?: ReactNode }) {
  const { applicationIdSms } = useParams<{ applicationIdSms: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const match = applicationIdSms?.trim().match(/^(\d+):(\d+)$/);
    if (!match) {
      return;
    }
    const applicationId = match[1];
    const smsnumber = match[2];
    const params = new URLSearchParams({
      applicationId,
      utm_source: 'Telesign',
      utm_medium: 'sms',
      utm_campaign: smsnumber,
    });
    navigate(`/customer/application-result?${params.toString()}`, { replace: true });
  }, [applicationIdSms, navigate]);

  const match = applicationIdSms?.trim().match(/^(\d+):(\d+)$/);
  if (!match) {
    return <>{fallback ?? <Navigate to="/" replace />}</>;
  }
  return null;
}
