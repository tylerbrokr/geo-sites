// Generated types for the public read surface in Supabase.
// Phase 1 (public views) + Phase 2 (site_copy, client_areas, NAP fields).

export type PublicClientProfile = {
  client_id: string;
  business_name: string | null;
  brokerage: string | null;
  years_experience: string | null;
  headshot_url: string | null;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  voice: string | null;
  values_text: string | null;
  ideal_client: string | null;
  brokerage_story: string | null;
  differentiators: string | null;
  property_types: string[];
  // Phase 2 NAP fields (requires public_client_profile view to be updated)
  phone_e164: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
};

export type PublicClientSite = {
  client_id: string;
  subdomain: string | null;
  custom_domain: string | null;
  ssl_status: "pending" | "active" | "failed" | null;
  provisioned_at: string | null;
  agent_display_name: string | null;
};

export type PublicClientMarket = {
  client_id: string;
  primary_city: string | null;
  primary_state: string | null;
  cities: string[];
  counties: string[];
  neighborhoods: string[];
};

export type PublicPost = {
  id: string;
  client_id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  tag: string | null;
  target_keyword: string | null;
  published_at: string | null;
  created_at: string;
  updated_at?: string | null;
};

// Phase 2: AI-generated copy exposed via public_site_copy view.
export type SiteCopy = {
  client_id: string;
  tagline: string | null;
  bio_short: string | null;
  bio_long: string | null;
  ideal_client_blurb: string | null;
  area_blurb: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
};

// Phase 2: Per-area landing pages exposed via public_client_areas view.
export type PublicClientArea = {
  client_id: string;
  slug: string;
  area_type: "city" | "neighborhood" | "county";
  name: string;
  state: string | null;
  intro: string;
  market_blurb: string;
  faqs: Array<{ q: string; a: string }>;
  meta_title: string;
  meta_description: string;
  updated_at: string | null;
};
