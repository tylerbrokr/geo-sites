import { supabasePublic } from "./supabase";
import type { PublicClientSite } from "@/types/db";

const PARENT = (process.env.NEXT_PUBLIC_SITES_PARENT_DOMAIN || "sites.geoemployee.com").toLowerCase();

/**
 * Resolve the incoming Host header to a client_id.
 *
 * Order:
 *  1. Strip port, lowercase, drop leading "www.".
 *  2. If host ends with the wildcard parent (e.g. "agent.sites.geoemployee.com"),
 *     pull the leftmost label as the subdomain and look it up in public_client_site.
 *  3. Otherwise treat the full host as a custom_domain lookup.
 *
 * The view (public_client_site) already filters to dns_verified = true rows,
 * so anything we return is a live, hosted site.
 */
export async function resolveHost(rawHost: string | null): Promise<{
  clientId: string;
  site: PublicClientSite;
} | null> {
  if (!rawHost) return null;

  const host = rawHost.split(":")[0].toLowerCase().replace(/^www\./, "");
  if (!host) return null;

  const sb = supabasePublic();

  // Subdomain on the parent
  if (host.endsWith(`.${PARENT}`)) {
    const sub = host.slice(0, -1 - PARENT.length);
    if (!sub) return null;

    const { data } = await sb
      .from("public_client_site")
      .select("*")
      .eq("subdomain", sub)
      .maybeSingle<PublicClientSite>();

    return data ? { clientId: data.client_id, site: data } : null;
  }

  // Custom domain
  const { data } = await sb
    .from("public_client_site")
    .select("*")
    .eq("custom_domain", host)
    .maybeSingle<PublicClientSite>();

  return data ? { clientId: data.client_id, site: data } : null;
}

/**
 * Compute the canonical host for a given site (www-first).
 * Used for <link rel="canonical"> and 301 redirects from the apex.
 */
export function canonicalHost(site: PublicClientSite): string {
  if (site.custom_domain) return `www.${site.custom_domain}`;
  if (site.subdomain) return `${site.subdomain}.${PARENT}`;
  return PARENT;
}
