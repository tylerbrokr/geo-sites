import { headers } from "next/headers";
import { resolveHost } from "@/lib/resolve-host";

export const runtime = "edge";

/**
 * GET /{indexnow_key}.txt
 *
 * Serves the IndexNow key verification file for the current tenant.
 * IndexNow requires a plain-text file at /{key}.txt containing only the key.
 *
 * The key is stored in client_sites.indexnow_key and exposed via the
 * public_client_site view (added in the IndexNow Lovable migration).
 *
 * Any slug that doesn't match the tenant's indexnow_key returns 404.
 * All other root-level paths (e.g. /about, /blog) are handled by their
 * own page.tsx files which take precedence over this dynamic route handler.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Only handle *.txt requests
  if (!slug.endsWith(".txt")) {
    return new Response("Not found", { status: 404 });
  }

  const keyFromUrl = slug.slice(0, -4); // strip ".txt"
  if (!keyFromUrl) {
    return new Response("Not found", { status: 404 });
  }

  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);

  if (!resolved) {
    return new Response("Not found", { status: 404 });
  }

  const siteKey = resolved.site.indexnow_key;

  if (!siteKey || siteKey !== keyFromUrl) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(siteKey, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Cache for 1 hour — key never changes once generated
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
