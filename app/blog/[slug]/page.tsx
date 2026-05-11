import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveHost, canonicalHost } from "@/lib/resolve-host";
import { getPost, getProfile } from "@/lib/queries";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const host = headers().get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) return {};
  const post = await getPost(resolved.clientId, params.slug);
  if (!post) return {};

  const canonical = `https://${canonicalHost(resolved.site)}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt || undefined,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      url: canonical,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const host = headers().get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) notFound();

  const [post, profile] = await Promise.all([
    getPost(resolved.clientId, params.slug),
    getProfile(resolved.clientId),
  ]);
  if (!post) notFound();

  // JSON-LD Article schema for GEO discoverability.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.cover_image_url || undefined,
    datePublished: post.published_at,
    author: {
      "@type": "Person",
      name: profile?.business_name || profile?.brokerage || "Author",
    },
  };

  return (
    <main className="mx-auto max-w-[720px] px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="text-xs uppercase tracking-[0.2em] text-ink-60 mb-4">
        {post.published_at ? new Date(post.published_at).toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric",
        }) : ""}
      </p>
      <h1 className="font-display text-4xl md:text-5xl leading-[1.1] mb-8">{post.title}</h1>
      {post.cover_image_url ? (
        <img src={post.cover_image_url} alt="" className="w-full mb-10 border hairline" />
      ) : null}
      <article
        className="prose-content font-sans text-lg leading-[1.7]"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />
    </main>
  );
}
