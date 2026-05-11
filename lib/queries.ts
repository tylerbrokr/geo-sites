import { supabasePublic } from "./supabase";
import type {
  PublicClientProfile,
  PublicClientMarket,
  PublicPost,
  SiteCopy,
  PublicClientArea,
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
    .select("client_id, tagline, bio_short, bio_long, ideal_client_blurb, area_blurb, meta_title, meta_description, og_image_url")
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
    .select("client_id, slug, area_type, name, state, intro, market_blurb, faqs, meta_title, meta_description, updated_at")
    .eq("client_id", clientId)
    .eq("slug", slug)
    .maybeSingle<PublicClientArea>();
  return data ?? null;
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
