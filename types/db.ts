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
  // Public NAP is phone + city + state only. The street address and postal
  // code on file are the agent's HOME address and are deliberately not part
  // of this type: they must never be exposed by the view or rendered.
  // All optional: present only once the view exposes them.
  phone_e164?: string | null;
  city?: string | null;
  state?: string | null;
  gbp_url?: string | null;
  license_number?: string | null;
  profile_links?: string[] | null;
};

export type PublicClientSite = {
  client_id: string;
  subdomain: string | null;
  custom_domain: string | null;
  ssl_status: "pending" | "active" | "failed" | null;
  provisioned_at: string | null;
  agent_display_name: string | null;
  // Added when Lovable migration adds indexnow_key to client_sites + public_client_site view
  indexnow_key: string | null;
  // Google Site Verification META token, issued per site by register-search-engines.
  google_verification_token?: string | null;
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

// An official Census geography an area was matched to.
export type GeoPlace = {
  geo_id: string;
  geo_type: "place" | "cousub" | "county" | "nation";
  name: string;
  base_name: string;
  state_name: string | null;
  state_abbr: string | null;
  county_geo_id: string | null;
  county_name: string | null;
};

// One sourced, dated government statistic.
export type AreaFact = {
  geo_id: string;
  metric: string;
  value: number | null;
  display: string;
  label: string;
  source: string;
  source_url: string | null;
  period: string;
};

export type AreaFacts = { place: GeoPlace | null; rows: AreaFact[] };

// Phase 2: Per-area landing pages exposed via public_client_areas view.
export type PublicClientArea = {
  // Present once the view exposes them.
  geo_id?: string | null;
  geo_status?: "resolved" | "inherited" | "unresolved" | null;
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
