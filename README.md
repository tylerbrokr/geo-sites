# geo-sites

Multi-tenant blog hosting for The Inner Cirql GEO product. One Next.js 14 deployment on Cloudflare Pages serves every member's site, routing by `Host` header against the `client_sites` table in the shared Supabase project.

## What this is

- **Render layer only.** All content authoring happens in the GEO admin (separate Lovable project). This repo reads.
- **Anon-key reads only.** Three curated views (`public_client_profile`, `public_client_site`, `public_client_market`) plus published `posts`. No secrets in the runtime.
- **Hostname routing.** Wildcard `*.sites.geoemployee.com` for managed subdomains, plus arbitrary custom domains via Cloudflare for SaaS.

## Local setup

```bash
cp .env.example .env.local
# Edit REVALIDATE_SECRET. The Supabase URL + anon key are pre-filled.

npm install
npm run dev
```

To test a tenant locally, edit `/etc/hosts`:
```
127.0.0.1   demo.sites.geoemployee.com
```
Then visit `http://demo.sites.geoemployee.com:3000`.

## Deploy: Cloudflare Pages

1. Connect this repo. Build command: `npx @cloudflare/next-on-pages`. Output: `.vercel/output/static`.
2. Set env vars in Pages settings: copy from `.env.example`. Generate a real `REVALIDATE_SECRET` (32+ chars) and store the same value as a Supabase function secret.
3. Add the wildcard custom hostname `*.sites.geoemployee.com` in Pages → Custom domains.
4. **Cloudflare for SaaS** (one-time, on the GEO Cloudflare account):
   - Zone → SSL/TLS → Custom Hostnames → enable.
   - Set fallback origin to the Pages production hostname.
   - The Phase 2 `verify-domain` edge function will create custom hostnames programmatically via the CF API.

## Architecture

```text
Visitor
  │
  ▼
Cloudflare edge ── middleware.ts ─┐
  │                                │ www-first redirect
  │                                │ x-resolved-host header
  ▼                                ▼
Server Component ── lib/resolve-host.ts ── Supabase (anon)
                                            └─ public_client_site (view)
                                            └─ public_client_profile (view)
                                            └─ public_client_market (view)
                                            └─ posts WHERE status='published'
```

Cache invalidation: the Supabase `publish-post` edge function POSTs to `/api/revalidate` with the shared secret. ISR fallback runs hourly.

## What's NOT in this scaffold yet

- Sitemap + RSS routes (Phase 1 polish).
- Per-tenant favicon / OG image generation (Phase 1 polish).
- Cloudflare for SaaS hostname provisioning client (Phase 2 — lives in the admin repo's `verify-domain` edge function, not here).
- The `purge-cache` cron sweep (Phase 3).
