import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { resolveHost } from "@/lib/resolve-host";
import { getProfile, getMarket, listPosts } from "@/lib/queries";

export default async function HomePage() {
  const host = headers().get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) notFound();

  const [profile, market, posts] = await Promise.all([
    getProfile(resolved.clientId),
    getMarket(resolved.clientId),
    listPosts(resolved.clientId, 12),
  ]);
  if (!profile) notFound();

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-16">
      <header className="border-b hairline pb-12 mb-12">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-60 mb-4">
          {market?.primary_city}{market?.primary_state ? `, ${market.primary_state}` : ""}
        </p>
        <h1 className="font-display text-5xl md:text-7xl leading-[1.05]">
          {profile.business_name || profile.brokerage}
        </h1>
        {profile.ideal_client ? (
          <p className="mt-6 text-lg text-ink-60 max-w-2xl">{profile.ideal_client}</p>
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
