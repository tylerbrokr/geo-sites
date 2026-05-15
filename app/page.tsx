import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { resolveHost, canonicalHost } from "@/lib/resolve-host";
import { getProfile, getMarket, listPosts, getSiteCopy, listAreas } from "@/lib/queries";
import { formatPhoneUs } from "@/lib/utils";

export const runtime = "edge";

export default async function HomePage() {
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) notFound();

  const [profile, market, posts, copy, areas] = await Promise.all([
    getProfile(resolved.clientId),
    getMarket(resolved.clientId),
    listPosts(resolved.clientId, 4),
    getSiteCopy(resolved.clientId),
    listAreas(resolved.clientId),
  ]);
  if (!profile) notFound();

  const agentName = resolved.site.agent_display_name || profile.business_name || profile.brokerage;
  const hostname = canonicalHost(resolved.site);
  const location = [market?.primary_city, market?.primary_state].filter(Boolean).join(", ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["RealEstateAgent", "LocalBusiness"],
        "@id": `https://${hostname}/#agent`,
        name: agentName,
        image: profile.headshot_url || undefined,
        logo: profile.logo_url || undefined,
        telephone: profile.phone_e164 || undefined,
        url: `https://${hostname}/`,
        address: (profile.street_address || profile.city || profile.state) ? {
          "@type": "PostalAddress",
          streetAddress: profile.street_address || undefined,
          addressLocality: profile.city || undefined,
          addressRegion: profile.state || undefined,
          postalCode: profile.postal_code || undefined,
          addressCountry: "US",
        } : undefined,
        areaServed: areas.map((a) => ({
          "@type": "Place",
          name: `${a.name}${a.state ? `, ${a.state}` : ""}`,
        })),
        memberOf: profile.brokerage
          ? { "@type": "Organization", name: profile.brokerage }
          : undefined,
      },
    ],
  };

  const featuredAreas = areas.slice(0, 3);

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero header */}
      <header className="border-b hairline pb-12 mb-12">
        {/* Eyebrow — accent color */}
        {location && (
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--brand-accent)] mb-4">
            {location}
          </p>
        )}
        <h1 className="font-display text-5xl md:text-7xl leading-[1.05]">{agentName}</h1>
        {/* Decorative rule: 2px, 24px wide, accent color */}
        <div className="mt-3 mb-3 h-[2px] w-6 bg-[var(--brand-accent)]" />
        {profile.brokerage && (
          <p className="text-xl text-ink-60">{profile.brokerage}</p>
        )}
        {copy?.tagline && (
          <p className="mt-6 text-lg text-ink-80 max-w-2xl">{copy.tagline}</p>
        )}
        {copy?.bio_short && (
          <p className="mt-4 text-base text-ink-60 max-w-2xl leading-relaxed">{copy.bio_short}</p>
        )}
      </header>

      {/* Where I work strip */}
      {featuredAreas.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display text-2xl mb-6">Where I work</h2>
          <ul className="flex flex-wrap gap-3">
            {featuredAreas.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/areas/${a.slug}`}
                  className="inline-block px-4 py-2 border hairline text-sm hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-colors"
                >
                  {a.name}{a.state ? `, ${a.state}` : ""}
                </Link>
              </li>
            ))}
            {areas.length > 3 && (
              <li>
                <Link href="/about" className="inline-block px-4 py-2 text-sm text-ink-60 hover:text-ink transition-colors">
                  +{areas.length - 3} more →
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}

      {/* Recent writing */}
      <section className="mb-16">
        <h2 className="font-display text-3xl mb-8">Recent writing</h2>
        {posts.length === 0 ? (
          <p className="text-ink-60">No posts yet.</p>
        ) : (
          <ul className="divide-y divide-ink-08">
            {posts.map((p) => (
              <li key={p.id} className="py-6">
                <Link href={`/blog/${p.slug}`} className="block group">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink-60 mb-2">
                    {p.published_at
                      ? new Date(p.published_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : ""}
                    {(p as any).tag && (
                      <span className="ml-3 text-[var(--brand-accent)]">{(p as any).tag}</span>
                    )}
                  </p>
                  <h3 className="font-display text-2xl">{p.title}</h3>
                  {p.excerpt && <p className="mt-2 text-ink-60">{p.excerpt}</p>}
                  {/* Read → arrow, accent on hover */}
                  <span className="inline-block mt-3 text-xs text-ink-40 group-hover:text-[var(--brand-accent)] transition-colors">
                    Read →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* NAP footer block */}
      <footer className="border-t hairline pt-8 mt-8">
        <address className="not-italic text-sm leading-relaxed text-ink-60">
          <div className="font-semibold text-ink">{agentName}</div>
          {profile.brokerage && <div>{profile.brokerage}</div>}
          {profile.street_address && <div>{profile.street_address}</div>}
          {(profile.city || profile.state || profile.postal_code) && (
            <div>
              {profile.city}
              {profile.city && profile.state ? ", " : ""}
              {profile.state} {profile.postal_code}
            </div>
          )}
          {profile.phone_e164 && (
            <div>
              <a href={`tel:${profile.phone_e164}`} className="hover:text-ink transition-colors">
                {formatPhoneUs(profile.phone_e164)}
              </a>
            </div>
          )}
        </address>
        <nav className="mt-4 flex gap-4 text-xs text-ink-60">
          <Link href="/about" className="hover:text-ink transition-colors">About</Link>
          {areas.length > 0 && (
            <Link href={`/areas/${areas[0].slug}`} className="hover:text-ink transition-colors">Areas</Link>
          )}
        </nav>
      </footer>
    </main>
  );
}
