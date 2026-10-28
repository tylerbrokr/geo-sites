import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { resolveHost, canonicalHost } from "@/lib/resolve-host";
import { getProfile, getSiteCopy, getPositioning, listAreas } from "@/lib/queries";
import { formatPhoneUs } from "@/lib/utils";
import { agentEntitySchema, positioningSchema } from "@/lib/entity";
import { processSlug, processPath, processFaqs } from "@/lib/positioning";

export const runtime = "edge";

// The specialty page: the agent's named process, written from their
// worksheet. This is the page an answer engine should cite when someone
// asks for a specialist of this kind. Everything on it is the agent's own
// words from the worksheet; nothing is generated.

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) return {};
  const [positioning, profile, copy] = await Promise.all([
    getPositioning(resolved.clientId),
    getProfile(resolved.clientId),
    getSiteCopy(resolved.clientId),
  ]);
  if (!positioning || processSlug(positioning) !== slug) return {};
  const agentName = resolved.site.agent_display_name || profile?.business_name || "Agent";
  const name = positioning.process_name?.trim() || "How I work";
  const canonical = "https://" + canonicalHost(resolved.site) + processPath(positioning);
  const description = positioning.process_description?.trim() || positioning.positioning_statement?.trim() || undefined;
  const ogImage = copy?.og_image_url || profile?.headshot_url || undefined;
  return {
    title: `${name} | ${agentName}`,
    description,
    alternates: { canonical },
    openGraph: { title: `${name} | ${agentName}`, description, type: "website", url: canonical, images: ogImage ? [ogImage] : undefined },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ProcessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) notFound();

  const [positioning, profile, copy, areas] = await Promise.all([
    getPositioning(resolved.clientId),
    getProfile(resolved.clientId),
    getSiteCopy(resolved.clientId),
    listAreas(resolved.clientId),
  ]);
  if (!positioning || !profile) notFound();
  const canonicalSlug = processSlug(positioning);
  if (!canonicalSlug) notFound();
  // A renamed process moves the page; the old address follows it.
  if (canonicalSlug !== slug) permanentRedirect(`/process/${canonicalSlug}`);

  const agentName = resolved.site.agent_display_name || profile.business_name || profile.brokerage;
  const hostname = canonicalHost(resolved.site);
  const name = positioning.process_name?.trim() || "How I work";
  const niche = positioning.niche?.trim();
  const faqs = processFaqs(positioning, agentName);
  const location = [profile.city, profile.state].filter(Boolean).join(", ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["RealEstateAgent", "LocalBusiness"],
        "@id": `https://${hostname}/#agent`,
        name: agentName,
        image: profile.headshot_url || undefined,
        telephone: profile.phone_e164 || undefined,
        url: `https://${hostname}/`,
        ...agentEntitySchema(profile),
        ...positioningSchema(positioning),
        description: copy?.bio_short || undefined,
        areaServed: areas.map((a) => ({ "@type": "Place", name: `${a.name}${a.state ? `, ${a.state}` : ""}` })),
      },
      {
        "@type": "Service",
        "@id": `https://${hostname}${processPath(positioning)}#service`,
        name,
        description: positioning.process_description?.trim() || undefined,
        serviceType: niche || undefined,
        provider: { "@id": `https://${hostname}/#agent` },
        url: `https://${hostname}${processPath(positioning)}`,
        areaServed: areas.map((a) => ({ "@type": "Place", name: `${a.name}${a.state ? `, ${a.state}` : ""}` })),
      },
      faqs.length
        ? {
            "@type": "FAQPage",
            "@id": `https://${hostname}${processPath(positioning)}#faq`,
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }
        : undefined,
    ].filter(Boolean),
  };

  const Block = ({ label, text }: { label: string; text: string | null | undefined }) =>
    text?.trim() ? (
      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-[0.2em] text-ink-60 mb-3">{label}</h2>
        <p className="text-lg leading-[1.7]">{text.trim()}</p>
      </section>
    ) : null;

  return (
    <main className="mx-auto max-w-[720px] px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-xs text-ink-60 mb-8">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span className="mx-2">·</span>
        <span>{name}</span>
      </nav>

      <header className="mb-12">
        {niche && (
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--brand-accent)] mb-4">{niche}</p>
        )}
        <h1 className="font-display text-4xl md:text-6xl leading-[1.05]">{name}</h1>
        <div className="mt-3 mb-4 h-[2px] w-6 bg-[var(--brand-accent)]" />
        {agentName && <p className="text-lg text-ink-60">{agentName}&apos;s consultation process{location ? ` · ${location}` : ""}</p>}
        {positioning.process_description && (
          <p className="mt-6 text-xl text-ink-80 leading-relaxed">{positioning.process_description}</p>
        )}
      </header>

      <Block label="Who it is for" text={positioning.who_you_help} />
      <Block label="What you want" text={positioning.outcome} />
      <Block label="What goes wrong without it" text={positioning.dread} />
      <Block label="How it is different" text={positioning.unlike} />
      <Block label="The result" text={positioning.dream_outcome} />

      {positioning.positioning_statement && (
        <section className="mb-12 border-l-2 border-[var(--brand-accent)] pl-6">
          <p className="font-display text-2xl leading-[1.4]">{positioning.positioning_statement}</p>
          {agentName && <p className="mt-3 text-sm text-ink-60">{agentName}</p>}
        </section>
      )}

      {faqs.length > 0 && (
        <section className="mb-12 border-t hairline pt-10">
          <h2 className="font-display text-2xl mb-6">Questions about {name}</h2>
          <dl>
            {faqs.map((f) => (
              <div key={f.q} className="mb-6">
                <dt className="font-semibold mb-2">{f.q}</dt>
                <dd className="text-ink-80 leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {areas.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display text-2xl mb-4">Where {agentName ? agentName.split(" ")[0] : "I"} work{agentName ? "s" : ""}</h2>
          <ul className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <li key={a.slug}>
                <Link href={"/areas/" + a.slug} className="inline-block px-3 py-1.5 border hairline text-sm hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-colors">
                  {a.name}{a.state ? ", " + a.state : ""}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-t hairline pt-8">
        <h2 className="font-display text-xl mb-4">Start a conversation</h2>
        <address className="not-italic text-sm leading-relaxed text-ink-60">
          <div className="font-semibold text-ink">{agentName}</div>
          {profile.brokerage && <div>{profile.brokerage}</div>}
          {location && <div>{location}</div>}
          {profile.phone_e164 && (
            <div><a href={"tel:" + profile.phone_e164} className="hover:text-ink transition-colors">{formatPhoneUs(profile.phone_e164)}</a></div>
          )}
        </address>
        <p className="mt-4 text-xs text-ink-60"><Link href="/about" className="hover:text-ink transition-colors">About {agentName}</Link></p>
      </section>
    </main>
  );
}
