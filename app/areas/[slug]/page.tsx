import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { resolveHost, canonicalHost } from "@/lib/resolve-host";
import { getProfile, getArea, listPosts } from "@/lib/queries";

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

  const agentName =
    resolved.site.agent_display_name || profile?.business_name || profile?.brokerage;
  const hostname = canonicalHost(resolved.site);
  const areaLabel = area.name + (area.state ? ", " + area.state : "");

  // Filter posts loosely matching this area by title
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

      {agentName && (
        <p className="text-xs uppercase tracking-[0.2em] text-ink-60 mb-3">{agentName}</p>
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

      {area.faqs.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display text-2xl mb-6">Frequently asked questions</h2>
          <div className="divide-y divide-ink-08">
            {area.faqs.map((faq, i) => (
              <details key={i} className="py-4 group">
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
          <h2 className="font-display text-2xl mb-6">Related posts</h2>
          <ul className="divide-y divide-ink-08">
            {areaPosts.map((p) => (
              <li key={p.id} className="py-4">
                <Link href={"/blog/" + p.slug} className="block hover:text-[var(--brand-primary)] transition-colors">
                  <h3 className="font-display text-xl">{p.title}</h3>
                  {p.excerpt && <p className="mt-1 text-sm text-ink-60">{p.excerpt}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
