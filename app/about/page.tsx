import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { resolveHost, canonicalHost } from "@/lib/resolve-host";
import { getProfile, getSiteCopy, listAreas } from "@/lib/queries";
import { formatPhoneUs } from "@/lib/utils";

export const runtime = "edge";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) return {};
  const [profile, copy] = await Promise.all([
    getProfile(resolved.clientId),
    getSiteCopy(resolved.clientId),
  ]);
  const agentName =
    resolved.site.agent_display_name ||
    profile?.business_name ||
    profile?.brokerage ||
    "Agent";
  const canonical = "https://" + canonicalHost(resolved.site) + "/about";
  const ogImage = copy?.og_image_url || profile?.headshot_url || undefined;
  return {
    title: "About " + agentName,
    description: copy?.bio_short || undefined,
    alternates: { canonical },
    openGraph: {
      title: "About " + agentName,
      description: copy?.bio_short || copy?.meta_description || undefined,
      type: "website",
      url: canonical,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function AboutPage() {
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) notFound();

  const [profile, copy, areas] = await Promise.all([
    getProfile(resolved.clientId),
    getSiteCopy(resolved.clientId),
    listAreas(resolved.clientId),
  ]);
  if (!profile) notFound();

  const agentName =
    resolved.site.agent_display_name || profile.business_name || profile.brokerage;
  const hostname = canonicalHost(resolved.site);
  const location = [profile.city, profile.state].filter(Boolean).join(", ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["RealEstateAgent", "LocalBusiness"],
        "@id": "https://" + hostname + "/#agent",
        name: agentName,
        image: profile.headshot_url || undefined,
        logo: profile.logo_url || undefined,
        telephone: profile.phone_e164 || undefined,
        url: "https://" + hostname + "/",
        address:
          profile.street_address || profile.city || profile.state
            ? {
                "@type": "PostalAddress",
                streetAddress: profile.street_address || undefined,
                addressLocality: profile.city || undefined,
                addressRegion: profile.state || undefined,
                postalCode: profile.postal_code || undefined,
                addressCountry: "US",
              }
            : undefined,
        areaServed: areas.map((a) => ({
          "@type": "Place",
          name: a.name + (a.state ? ", " + a.state : ""),
        })),
        memberOf: profile.brokerage
          ? { "@type": "Organization", name: profile.brokerage }
          : undefined,
      },
    ],
  };

  const bioParagraphs = copy?.bio_long?.split(/\n\n+/) ?? [];

  return (
    <main className="mx-auto max-w-[720px] px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-xs text-ink-60 mb-8">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span className="mx-2">·</span>
        <span>About</span>
      </nav>

      <header className="flex items-start gap-8 mb-12">
        {profile.headshot_url && (
          <img
            src={profile.headshot_url}
            alt={agentName || "Agent"}
            className="w-24 h-24 rounded-full object-cover shrink-0"
          />
        )}
        <div>
          {/* Eyebrow — accent color */}
          {location && (
            <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--brand-accent)] mb-2">
              {location}
            </p>
          )}
          <h1 className="font-display text-4xl md:text-5xl leading-[1.1]">{agentName}</h1>
          {/* Decorative rule: 2px, 24px wide */}
          <div className="mt-3 mb-3 h-[2px] w-6 bg-[var(--brand-accent)]" />
          {profile.brokerage && <p className="text-lg text-ink-60">{profile.brokerage}</p>}
          {profile.years_experience && (
            <p className="mt-1 text-sm text-ink-60">{profile.years_experience} years in real estate</p>
          )}
        </div>
      </header>

      {bioParagraphs.length > 0 && (
        <section className="mb-12 font-sans text-lg leading-[1.7]">
          {bioParagraphs.map((p, i) => (
            <p key={i} className="mb-4">{p}</p>
          ))}
        </section>
      )}

      {areas.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display text-2xl mb-4">Areas served</h2>
          <ul className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <li key={a.slug}>
                <Link
                  href={"/areas/" + a.slug}
                  className="inline-block px-3 py-1.5 border hairline text-sm hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-colors"
                >
                  {a.name}{a.state ? ", " + a.state : ""}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-t hairline pt-8">
        <h2 className="font-display text-xl mb-4">Contact</h2>
        <address className="not-italic text-sm leading-relaxed text-ink-60">
          <div className="font-semibold text-ink">{agentName}</div>
          {profile.brokerage && <div>{profile.brokerage}</div>}
          {profile.street_address && <div>{profile.street_address}</div>}
          {(profile.city || profile.state || profile.postal_code) && (
            <div>
              {profile.city}{profile.city && profile.state ? ", " : ""}{profile.state}{" "}
              {profile.postal_code}
            </div>
          )}
          {profile.phone_e164 && (
            <div>
              <a href={"tel:" + profile.phone_e164} className="hover:text-ink transition-colors">
                {formatPhoneUs(profile.phone_e164)}
              </a>
            </div>
          )}
        </address>
      </section>
    </main>
  );
}
