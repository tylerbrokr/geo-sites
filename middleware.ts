import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { classifyVisit } from "./lib/visit-log";

const PARENT = (process.env.NEXT_PUBLIC_SITES_PARENT_DOMAIN || "sites.geoemployee.com").toLowerCase();

/**
 * Edge middleware. Two jobs:
 *
 * 1. www-first canonicalization for custom domains. Apex (`example.com`) 301s
 *    to `www.example.com`. Subdomains on the parent are left alone.
 *
 * 2. Pass the resolved host to the app via `x-resolved-host` so layouts and
 *    pages can read it without re-parsing. Actual client_id resolution happens
 *    inside Server Components via lib/resolve-host.ts (so we hit Supabase
 *    once per request through Next's data cache, not twice).
 *
 * 3. Proof log. A request from an AI crawler, a search crawler, or a person
 *    an AI assistant or search engine sent here is recorded in site_visits
 *    (host, path, kind, agent only; no IP, no raw user agent). Fire and
 *    forget: the response never waits on it.
 */
export function middleware(req: NextRequest, event: NextFetchEvent) {
  const url = req.nextUrl;
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(":")[0].toLowerCase();

  // Skip Next internals + the revalidate webhook.
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api/revalidate") ||
    url.pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isParentSubdomain = host.endsWith(`.${PARENT}`) || host === PARENT;
  const isApexCustom = !isParentSubdomain && !host.startsWith("www.") && host.split(".").length === 2;

  if (isApexCustom) {
    const redirectUrl = new URL(url.pathname + url.search, `https://www.${host}`);
    return NextResponse.redirect(redirectUrl, 301);
  }

  const visit = classifyVisit(req.headers.get("user-agent"), req.headers.get("referer"));
  if (visit && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    event.waitUntil(
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/site_visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anon, Authorization: `Bearer ${anon}`, Prefer: "return=minimal" },
        body: JSON.stringify({ host, path: url.pathname.slice(0, 512), kind: visit.kind, agent: visit.agent }),
      }).catch(() => {}),
    );
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-resolved-host", host);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("x-resolved-host", host);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
