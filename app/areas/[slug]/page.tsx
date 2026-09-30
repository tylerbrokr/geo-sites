import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { resolveHost, canonicalHost } from "@/lib/resolve-host";
import { getProfile, getArea, getAreaFacts, listPosts } from "@/lib/queries";

export const runtime = "edge";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) return {};
  const area = await getArea(resolved.clientId, slug);
  if (!area) return {};
  const canonical = "https://" + canonicalHost(resolved.site) + "/areas/" + slug;
  return {
    title: area.meta_title || area.name + " Real Estate",
    description: area.meta_description || area.intro || undefined,
    alternates: { canonical },
    openGraph: { title: area.meta_title || area.name, url: canonical },
  };
}

export default async function AreaPage({ params }: Props) {
  const { slug } = await params;
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) notFound();

  const [area, profile, recentPosts] = await Promise.all([
    getArea(resolved.clientId, slug),
    getProfile(resolved.clientId),
    listPosts(resolved.clientId, 20),
  ]);
  if (!area) notFound();

  const facts = await getAreaFacts(area.geo_id);
  // For a neighborhood the figures describe its parent city.
  const factsPlace = facts.place
    ? facts.place.geo_type === "county"
      ? facts.place.name
      : facts.place.base_name + (facts.place.state_abbr ? ", " + facts.place.state_abbr : "")
    : "";
  const factSources = [...new Map(facts.rows.map((f) => [f.source, f.source_url])).entries()];

  const agentName =
    resolved.site.agent_display_name || profile?.business_name || profile?.brokerage;
  const hostname = canonicalHost(resolved.site);
  const areaLabel = area.name + (area.state ? ", " + area.state : "");

  const areaPosts = recentPosts
    .filter((p) => p.title.toLowerCase().includes(area.name.toLowerCase()))
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Place",
        name: areaLabel,
        containedInPlace: area.state
          ? { "@type": "AdministrativeArea", name: area.state }
          : undefined,
        additionalProperty: facts.rows.length
          ? facts.rows.map((f) => ({
              "@type": "PropertyValue",
              name: area.area_type === "neighborhood" ? `${f.label} (${factsPlace})` : f.label,
              value: f.display,
              description: `${f.source}, ${f.period}`,
            }))
          : undefined,
      },
      {
        "@type": "FAQPage",
        mainEntity: area.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://" + hostname + "/" },
          { "@type": "ListItem", position: 2, name: "Areas", item: "https://" + hostname + "/" },
          { "@type": "ListItem", position: 3, name: area.name, item: "https://" + hostname + "/areas/" + slug },
        ],
      },
    ],
  };

  const marketParagraphs = area.market_blurb?.split(/\n\n+/) ?? [];

  return (
    <main className="mx-auto max-w-[720px] px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-xs text-ink-60 mb-8">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span className="mx-2">·</span>
        <span>{area.name}</span>
      </nav>

      {/* Eyebrow — agent name in accent */}
      {agentName && (
        <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--brand-accent)] mb-3">
          {agentName}
        </p>
      )}
      <h1 className="font-display text-4xl md:text-5xl leading-[1.1] mb-6">
        {area.name} Real Estate
      </h1>

      {area.intro && (
        <p className="text-lg leading-relaxed text-ink-80 mb-8">{area.intro}</p>
      )}

      {marketParagraphs.length > 0 && (
        <section className="mb-12 font-sans text-base leading-[1.7] text-ink-60">
          {marketParagraphs.map((p, i) => (
            <p key={i} className="mb-4">{p}</p>
          ))}
        </section>
      )}

      {facts.rows.length > 0 && (
        <section className="mb-12">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--brand-accent)] mb-2">By the numbers</p>
          <h2 className="font-display text-2xl mb-3">{factsPlace} at a glance</h2>
          {area.area_type === "neighborhood" && (
            <p className="text-sm text-ink-60 mb-4">
              {area.name} is in {factsPlace}. These figures are for {factsPlace} as a whole.
            </p>
          )}
          <table className="w-full text-sm">
            <tbody>
              {facts.rows.map((f) => (
                <tr key={f.geo_id + f.metric} className="border-t hairline">
                  <th scope="row" className="text-left font-normal py-2.5 pr-4">
                    <span className="text-ink-80">{f.label}</span>
                    <span className="block text-xs text-ink-40">{f.period}</span>
                  </th>
                  <td className="py-2.5 text-right font-semibold whitespace-nowrap align-top">{f.display}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-ink-40 leading-relaxed">
            Sources:{" "}
            {factSources.map(([source, url], i) => (
              <span key={source}>
                {i > 0 && "; "}
                {url ? <a href={url} target="_blank" rel="noopener" className="underline">{source}</a> : source}
              </span>
            ))}
            . Published estimates for the area as a whole, not a valuation of any property.
          </p>
        </section>
      )}

      {area.faqs.length > 0 && (
        <section className="mb-12">
          {/* Section eyebrow — accent */}
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--brand-accent)] mb-2">FAQ</p>
          <h2 className="font-display text-2xl mb-6">Frequently asked questions</h2>
          <div className="divide-y divide-ink-08">
            {area.faqs.map((faq, i) => (
              <details key={i} className="py-4 group open:border-l-2 open:border-[var(--brand-accent)] open:pl-4 transition-all">
                <summary className="cursor-pointer font-semibold text-base list-none flex justify-between items-center">
                  {faq.q}
                  <span className="ml-4 text-ink-40 group-open:rotate-180 transition-transform">↓</span>
                </summary>
                <p className="mt-3 text-ink-60 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {areaPosts.length > 0 && (
        <section className="mb-12">
          {/* Section eyebrow — accent */}
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--brand-accent)] mb-2">Related</p>
          <h2 className="font-display text-2xl mb-6">Related posts</h2>
          <ul className="divide-y divide-ink-08">
            {areaPosts.map((p) => (
              <li key={p.id} className="py-4">
                <Link href={"/blog/" + p.slug} className="block group hover:text-[var(--brand-primary)] transition-colors">
                  <h3 className="font-display text-xl">{p.title}</h3>
                  {p.excerpt && <p className="mt-1 text-sm text-ink-60">{p.excerpt}</p>}
                  <span className="inline-block mt-2 text-xs text-ink-40 group-hover:text-[var(--brand-accent)] transition-colors">
                    Read →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
