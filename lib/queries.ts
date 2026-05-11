import { supabasePublic } from "./supabase";
import type { PublicClientProfile, PublicClientMarket, PublicPost, SiteCopy } from "@/types/db";

// All reads scoped by client_id at the application layer.

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

// Phase 2: reads the AI-generated copy for the site.
// The generate-site-copy edge function populates this row on provision
// and refreshes it whenever intake data changes.
export async function getSiteCopy(clientId: string): Promise<SiteCopy | null> {
  const { data } = await supabasePublic()
    .from("site_copy")
    .select("client_id, tagline, bio_short, bio_long, area_blurb, meta_title, meta_description, stale, ai_model, updated_at")
    .eq("client_id", clientId)
    .maybeSingle<SiteCopy>();
  return data ?? null;
}

export async function listPosts(clientId: string, limit = 20): Promise<PublicPost[]> {
  const { data } = await supabasePublic()
    .from("posts")
    .select("id, client_id, slug, title, excerpt, body, cover_image_url, tag, target_keyword, published_at, created_at")
    .eq("client_id", clientId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as PublicPost[];
}

export async function getPost(clientId: string, slug: string): Promise<PublicPost | null> {
  const { data } = await supabasePublic()
    .from("posts")
    .select("id, client_id, slug, title, excerpt, body, cover_image_url, tag, target_keyword, published_at, created_at")
    .eq("client_id", clientId)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<PublicPost>();
  return data ?? null;
}
