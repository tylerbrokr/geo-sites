import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { resolveHost } from "@/lib/resolve-host";
import { getProfile, getMarket, listPosts, getSiteCopy } from "@/lib/queries";

export const runtime = "edge";

export default async function HomePage() {
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) notFound();

  const [profile, market, posts, copy] = await Promise.all([
    getProfile(resolved.clientId),
    getMarket(resolved.clientId),
    listPosts(resolved.clientId, 12),
    getSiteCopy(resolved.clientId),
  ]);
  if (!profile) notFound();

  // H1: agent display name from client_sites (AI-resolved), fallback to business_name.
  const agentName = resolved.site.agent_display_name || profile.business_name || profile.brokerage;
  // Subhead: brokerage name.
  const brokerageName = profile.brokerage;
  // Eyebrow: city, state.
  const location = [market?.primary_city, market?.primary_state].filter(Boolean).join(", ");

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-16">
      <header className="border-b hairline pb-12 mb-12">
        {location ? (
          <p className="text-xs uppercase tracking-[0.2em] text-ink-60 mb-4">{location}</p>
        ) : null}

        <h1 className="font-display text-5xl md:text-7xl leading-[1.05]">{agentName}</h1>

        {brokerageName ? (
          <p className="mt-3 text-xl text-ink-60">{brokerageName}</p>
        ) : null}

        {copy?.tagline ? (
          <p className="mt-6 text-lg text-ink-80 max-w-2xl">{copy.tagline}</p>
        ) : null}

        {copy?.bio_short ? (
          <p className="mt-4 text-base text-ink-60 max-w-2xl leading-relaxed">{copy.bio_short}</p>
        ) : null}
      </header>

      <section>
        <h2 className="font-display text-3xl mb-8">Recent writing</h2>
        {posts.length === 0 ? (
          <p className="text-ink-60">No posts yet.</p>
        ) : (
          <ul className="divide-y divide-ink-08">
            {posts.map((p) => (
              <li key={p.id} className="py-6">
                <Link href={`/blog/${p.slug}`} className="block">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink-60 mb-2">
                    {p.published_at ? new Date(p.published_at).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    }) : ""}
                  </p>
                  <h3 className="font-display text-2xl">{p.title}</h3>
                  {p.excerpt ? <p className="mt-2 text-ink-60">{p.excerpt}</p> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
