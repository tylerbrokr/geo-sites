// Generated types for the public read surface in Supabase.
// Mirror of the views shipped in the Phase 1 / Half A migration + Phase 2 site_copy.

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
};

export type PublicClientSite = {
  client_id: string;
  subdomain: string | null;
  custom_domain: string | null;
  ssl_status: "pending" | "active" | "failed" | null;
  provisioned_at: string | null;
  // Added Phase 2 — AI-resolved display name for the agent
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
};

// Phase 2 — AI-generated copy for each site.
// Populated by the generate-site-copy edge function; refreshed by cron every 2 min.
export type SiteCopy = {
  client_id: string;
  tagline: string | null;
  bio_short: string | null;
  bio_long: string | null;
  area_blurb: string | null;
  meta_title: string | null;
  meta_description: string | null;
  stale: boolean;
  ai_model: string | null;
  updated_at: string | null;
};
