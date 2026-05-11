import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { resolveHost, canonicalHost } from "@/lib/resolve-host";
import { getProfile, getMarket, getSiteCopy } from "@/lib/queries";
import { supabasePublic } from "@/lib/supabase";

export const runtime = "edge";

const PAGE_SIZE = 20;

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) return {};
  const [profile, market] = await Promise.all([
    getProfile(resolved.clientId),
    getMarket(resolved.clientId),
  ]);
  const agentName =
    resolved.site.agent_display_name || profile?.business_name || profile?.brokerage || "";
  const canonical = "https://" + canonicalHost(resolved.site) + "/blog";
  return {
    title: "Writing",
    description: market?.primary_city
      ? "Recent writing from " + agentName + " on " + market.primary_city + " real estate."
      : "Recent writing from " + agentName + ".",
    alternates: { canonical },
    openGraph: { title: "Writing | " + agentName, url: canonical },
  };
}

export default async function BlogIndexPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) notFound();

  const [profile, copy] = await Promise.all([
    getProfile(resolved.clientId),
    getSiteCopy(resolved.clientId),
  ]);
  if (!profile) notFound();

  const agentName =
    resolved.site.agent_display_name || profile.business_name || profile.brokerage;
  const hostname = canonicalHost(resolved.site);

  const { data: posts, count } = await supabasePublic()
    .from("posts")
    .select("id, slug, title, excerpt, cover_image_url, published_at, tag", { count: "exact" })
    .eq("client_id", resolved.clientId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);

  const totalCount = count ?? 0;
  const hasPrev = page > 1;
  const hasNext = from + (posts?.length ?? 0) < totalCount;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Writing | " + agentName,
        url: "https://" + hostname + "/blog",
        itemListElement: (posts ?? []).map((p, i) => ({
          "@type": "ListItem",
          position: from + i + 1,
          url: "https://" + hostname + "/blog/" + p.slug,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://" + hostname + "/" },
          { "@type": "ListItem", position: 2, name: "Writing", item: "https://" + hostname + "/blog" },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b hairline pb-10 mb-10">
        <h1 className="font-display text-5xl md:text-6xl leading-[1.05]">Writing</h1>
        {copy?.bio_short && (
          <p className="mt-4 text-ink-60 max-w-2xl">{copy.bio_short}</p>
        )}
      </header>

      {!posts || posts.length === 0 ? (
        <p className="text-ink-60">No posts yet.</p>
      ) : (
        <ul className="divide-y divide-ink-08">
          {posts.map((p) => (
            <li key={p.id} className="py-8">
              <Link href={"/blog/" + p.slug} className="block group">
                {p.cover_image_url && (
                  <img
                    src={p.cover_image_url}
                    alt=""
                    className="w-full max-h-48 object-cover mb-4 border hairline"
                  />
                )}
                <p className="text-xs uppercase tracking-[0.2em] text-ink-60 mb-2">
                  {p.published_at
                    ? new Date(p.published_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : ""}
                  {p.tag && <span className="ml-3 text-[var(--brand-accent)]">{p.tag}</span>}
                </p>
                <h2 className="font-display text-2xl group-hover:text-[var(--brand-primary)] transition-colors">
                  {p.title}
                </h2>
                {p.excerpt && (
                  <p className="mt-2 text-ink-60 leading-relaxed">{p.excerpt}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {(hasPrev || hasNext) && (
        <div className="flex items-center justify-between mt-12 pt-6 border-t hairline text-sm">
          {hasPrev ? (
            <Link href={"/blog?page=" + (page - 1)} className="text-ink-60 hover:text-ink transition-colors">
              ← Newer posts
            </Link>
          ) : <span />}
          {hasNext && (
            <Link href={"/blog?page=" + (page + 1)} className="text-ink-60 hover:text-ink transition-colors">
              Older posts →
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
