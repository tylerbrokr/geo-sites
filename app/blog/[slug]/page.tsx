import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveHost, canonicalHost } from "@/lib/resolve-host";
import { getPost, getProfile, getSiteCopy, listAreas } from "@/lib/queries";
import { stripMarkdown, linkAreasInMarkdown } from "@/lib/utils";
import { PostBody } from "@/app/components/PostBody";

export const runtime = "edge";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) return {};

  const [post, profile, copy] = await Promise.all([
    getPost(resolved.clientId, slug),
    getProfile(resolved.clientId),
    getSiteCopy(resolved.clientId),
  ]);
  if (!post) return {};

  const canonical = "https://" + canonicalHost(resolved.site) + "/blog/" + post.slug;
  const ogImage =
    post.cover_image_url ||
    copy?.og_image_url ||
    profile?.headshot_url ||
    undefined;

  return {
    title: post.title,
    description: post.excerpt || undefined,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: "article",
      url: canonical,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) notFound();

  const [post, profile, areas] = await Promise.all([
    getPost(resolved.clientId, slug),
    getProfile(resolved.clientId),
    listAreas(resolved.clientId),
  ]);
  if (!post) notFound();

  const agentName =
    resolved.site.agent_display_name ||
    profile?.business_name ||
    profile?.brokerage ||
    "Author";
  const hostname = canonicalHost(resolved.site);
  const postTag = (post as any).tag as string | null | undefined;

  const linkedMarkdown = linkAreasInMarkdown(post.body ?? "", areas);
  const plainBody = stripMarkdown(post.body ?? "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.excerpt || undefined,
        image: post.cover_image_url || undefined,
        datePublished: post.published_at,
        dateModified: post.updated_at || post.published_at,
        articleBody: plainBody || undefined,
        wordCount: plainBody ? plainBody.split(/\s+/).length : undefined,
        author: { "@type": "Person", name: agentName },
        publisher: {
          "@type": "Organization",
          name: profile?.brokerage || agentName,
          logo: profile?.logo_url || undefined,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://" + hostname + "/" },
          { "@type": "ListItem", position: 2, name: "Blog", item: "https://" + hostname + "/blog" },
          { "@type": "ListItem", position: 3, name: post.title, item: "https://" + hostname + "/blog/" + post.slug },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-[720px] px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-xs text-ink-60 mb-8">
        <a href="/" className="hover:text-ink transition-colors">Home</a>
        <span className="mx-2">·</span>
        <a href="/blog" className="hover:text-ink transition-colors">Blog</a>
      </nav>

      {/* Tag eyebrow — accent color */}
      {postTag && (
        <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--brand-accent)] mb-3">
          {postTag}
        </p>
      )}

      <p className="text-xs uppercase tracking-[0.2em] text-ink-60 mb-4">
        {post.published_at
          ? new Date(post.published_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : ""}
      </p>

      <h1 className="font-display text-4xl md:text-5xl leading-[1.1]">{post.title}</h1>
      {/* Decorative rule: 2px, 32px wide, 12px below title */}
      <div className="mt-3 mb-8 h-[2px] w-8 bg-[var(--brand-accent)]" />

      {post.cover_image_url && (
        <img src={post.cover_image_url} alt="" className="w-full mb-10 border hairline" />
      )}
      <PostBody markdown={linkedMarkdown} />
    </main>
  );
}
