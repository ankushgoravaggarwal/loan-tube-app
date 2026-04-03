import { buildAffiliateLeadPayload } from '../affiliate-lead/buildPayload';
import type { AffiliateLeadFormState } from '../affiliate-lead/types';

export interface AffiliateLeadResponse {
  lead_id?: string;
  status?: string;
  status_text?: string;
  redirect_url?: string;
  error?: string;
  message?: string;
}

function affiliateLeadUrl(): string {
  const base =
    import.meta.env.VITE_BACKEND_BASE_URL || 'https://sample.loantube.com';
  return (
    import.meta.env.VITE_AFFILIATE_LEAD_URL || `${base.replace(/\/$/, '')}/affiliates/lead`
  );
}

export async function submitAffiliateLead(
  state: AffiliateLeadFormState
): Promise<AffiliateLeadResponse> {
  const url = affiliateLeadUrl();
  const body = buildAffiliateLeadPayload(state);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data: AffiliateLeadResponse = {};
  if (text) {
    try {
      data = JSON.parse(text) as AffiliateLeadResponse;
    } catch {
      throw new Error('Something went wrong. Please try again.');
    }
  }

  if (!response.ok) {
    const msg =
      data.error ||
      data.message ||
      `Something went wrong. Please try again.`;
    throw new Error(msg);
  }

  return data;
}
