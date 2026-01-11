import { supabase } from './supabaseClient';

export interface PartnerFooterLink {
  id: string;
  text: string;
  url: string;
}

export interface Partner {
  id: string;
  name: string;
  partner_slug: string;
  logo_left_url: string | null;
  logo_right_url: string | null;
  logo_pledge_box_url: string | null;
  logo_left_enabled: boolean;
  logo_right_enabled: boolean;
  logo_pledge_box_enabled: boolean;
  primary_color: string | null;
  secondary_color: string | null;
  logo_mobile_left_enabled: boolean | null;
  logo_mobile_right_enabled: boolean | null;
  logo_mobile_left_url: string | null;
  logo_mobile_right_url: string | null;
  shadow_color: string | null;
  shadow_enabled: boolean | null;
  footer_links?: PartnerFooterLink[] | null;
  footer_info?: string | null;
  terms_info_1?: string | null;
  terms_info_2?: string | null;
  terms_info_3?: string | null;
  terms_info_4?: string | null;
  terms_info_5?: string | null;
  terms_info_6?: string | null;
  terms_info_7?: string | null;
  sidebar_loan_text_color?: string | null;
  sidebar_words_text_color?: string | null;
  customer_name_color?: string | null;
  error_input_focus_color?: string | null;
  select_button_background_color?: string | null;
  select_button_text_color?: string | null;
  navbar_button_background_color?: string | null;
  navbar_button_text_color?: string | null;
  checkbox_section_background_color?: string | null;
  checkbox_text_color?: string | null;
  checkbox_supporting_text_color?: string | null;
  checkbox_supporting_link_color?: string | null;
  checkbox_background_selected_color?: string | null;
  checkbox_border_unselected_color?: string | null;
  checkbox_border_selected_color?: string | null;
  checkbox_tick_color?: string | null;
  checkbox_1_text?: string | null;
  checkbox_1_supporting_text?: string | null;
  checkbox_2_text?: string | null;
  checkbox_2_supporting_text?: string | null;
  checkbox_3_enabled?: boolean | null;
  checkbox_3_text?: string | null;
  checkbox_3_supporting_text?: string | null;
}

export const getPartnerBySlug = async (slug: string): Promise<Partner | null> => {
  if (!slug?.trim()) return null;
  
  const cleanSlug = slug.trim().toLowerCase();
  
  const { data } = await supabase
    .from('partners')
    .select('*')
    .eq('partner_slug', cleanSlug)
    .maybeSingle();
    
  return data || null;
}; 