import { supabasePublic } from "./supabase";
import type {
  PublicClientProfile,
  PublicClientMarket,
  PublicPost,
  SiteCopy,
  PublicClientArea,
  AreaFact,
  AreaFacts,
  GeoPlace,
} from "@/types/db";

export async function getProfile(clientId: string): Promise<PublicClientProfile | null> {
  const { data } = await supabasePublic()
    .from("public_client_profile")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle<PublicClientProfile>();
  return data ?? null;
}

export async function getMarket(clientId: string): Promise<PublicClientMarket | null> {
  const { data } = await supabasePublic()
    .from("public_client_market")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle<PublicClientMarket>();
  return data ?? null;
}

export async function getSiteCopy(clientId: string): Promise<SiteCopy | null> {
  const { data } = await supabasePublic()
    .from("public_site_copy")
    // "*" on purpose: naming a column the view doesn't expose (og_image_url)
    // made the whole query error, which silently blanked every site's tagline,
    // bios, title, and description.
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle<SiteCopy>();
  return data ?? null;
}

export async function listAreas(clientId: string): Promise<PublicClientArea[]> {
  const { data } = await supabasePublic()
    .from("public_client_areas")
    .select("client_id, slug, area_type, name, state, intro, market_blurb, faqs, meta_title, meta_description, updated_at")
    .eq("client_id", clientId)
    .order("name", { ascending: true });
  return (data ?? []) as PublicClientArea[];
}

export async function getArea(clientId: string, slug: string): Promise<PublicClientArea | null> {
  const { data } = await supabasePublic()
    .from("public_client_areas")
    // "*" so a column the view gains later (geo_id) is picked up without a
    // deploy-order dependency, and a missing one can't fail the whole query.
    .select("*")
    .eq("client_id", clientId)
    .eq("slug", slug)
    .maybeSingle<PublicClientArea>();
  return data ?? null;
}

// Display order for the "at a glance" table. Anything not listed is omitted.
const LOCAL_METRICS = [
  "population",
  "housing_units",
  "median_home_value",
  "median_rent",
  "median_property_tax",
  "owner_occupied_pct",
  "single_family_detached_pct",
  "median_year_built",
  "commute_under_30_pct",
  "hpi_change_1y",
  "hpi_change_5y",
];
const COUNTY_METRICS = ["hpi_change_1y", "hpi_change_5y"];
const NATIONAL_METRICS = ["mortgage_rate_30y", "mortgage_rate_30y_year_ago"];

const pick = (facts: AreaFact[], geoId: string, order: string[]) =>
  order.map((m) => facts.find((f) => f.geo_id === geoId && f.metric === m)).filter((f): f is AreaFact => !!f);

// Sourced government facts for the geography an area was matched to, plus
// its county's price trend and the national mortgage rate. Returns an empty
// result (never throws) when the area isn't matched or the tables don't
// exist yet.
export async function getAreaFacts(geoId: string | null | undefined): Promise<AreaFacts> {
  const empty: AreaFacts = { place: null, rows: [] };
  if (!geoId) return empty;
  const sb = supabasePublic();
  const { data: place } = await sb.from("geo_places").select("*").eq("geo_id", geoId).maybeSingle<GeoPlace>();
  if (!place) return empty;
  const ids = [geoId, place.county_geo_id, "us"].filter((x): x is string => !!x);
  const { data } = await sb.from("area_facts").select("*").in("geo_id", ids);
  const facts = (data ?? []) as AreaFact[];
  const county = place.county_geo_id && place.county_geo_id !== geoId
    ? pick(facts, place.county_geo_id, COUNTY_METRICS).map((f) => ({
        ...f,
        label: place.county_name ? f.label.replace("(county)", `(${place.county_name})`) : f.label,
      }))
    : [];
  const local = pick(facts, geoId, LOCAL_METRICS).map((f) => ({
    ...f,
    label: f.label.replace(" (county)", ""),
  }));
  return { place, rows: [...local, ...county, ...pick(facts, "us", NATIONAL_METRICS)] };
}

export async function listPosts(clientId: string, limit = 20): Promise<PublicPost[]> {
  const { data } = await supabasePublic()
    .from("posts")
    .select("id, client_id, slug, title, excerpt, body, cover_image_url, tag, target_keyword, published_at, created_at, updated_at")
    .eq("client_id", clientId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as PublicPost[];
}

export async function getPost(clientId: string, slug: string): Promise<PublicPost | null> {
  const { data } = await supabasePublic()
    .from("posts")
    .select("id, client_id, slug, title, excerpt, body, cover_image_url, tag, target_keyword, published_at, created_at, updated_at")
    .eq("client_id", clientId)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<PublicPost>();
  return data ?? null;
}

// Platform-wide public settings (today: the Bing Webmaster verification
// code, which is one value for the whole account). Missing view or key
// returns null so a site never fails to render over it.
export async function getPlatformSetting(key: string): Promise<string | null> {
  const { data } = await supabasePublic()
    .from("public_platform_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle<{ value: string | null }>();
  return data?.value ?? null;
}
