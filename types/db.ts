// Generated types for the public read surface in Supabase.
// Mirror of the views shipped in the Phase 1 / Half A migration.

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
