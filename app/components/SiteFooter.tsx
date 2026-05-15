import Link from "next/link";
import type { PublicClientSite, PublicClientProfile, PublicClientArea, PublicPost } from "@/types/db";
import { formatPhoneUs } from "@/lib/utils";

type Props = {
  site: PublicClientSite;
  profile: PublicClientProfile | null;
  areas: PublicClientArea[];
  recentPosts: PublicPost[];
};

export default function SiteFooter({ site, profile, areas, recentPosts }: Props) {
  const agentName = site.agent_display_name || profile?.business_name || profile?.brokerage || "";
  const year = new Date().getFullYear();
  const footerAreas = areas.slice(0, 12);

  return (
    <footer className="mt-16 bg-canvas relative">
      {/* 1px accent top border at 20% opacity */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[var(--brand-accent)] opacity-20" />

      <div className="mx-auto max-w-[1100px] px-6 py-12">
        {/* Three columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">

          {/* Col 1: Identity + NAP */}
          <div>
            <address className="not-italic text-sm leading-relaxed text-ink-60">
              <div className="font-semibold text-ink mb-1">{agentName}</div>
              {profile?.brokerage && <div>{profile.brokerage}</div>}
              {profile?.street_address && <div>{profile.street_address}</div>}
              {(profile?.city || profile?.state || profile?.postal_code) && (
                <div>
                  {profile.city}
                  {profile.city && profile.state ? ", " : ""}
                  {profile.state} {profile.postal_code}
                </div>
              )}
              {profile?.phone_e164 && (
                <div className="mt-1">
                  <a
                    href={"tel:" + profile.phone_e164}
                    className="hover:text-[var(--brand-primary)] transition-colors"
                  >
                    {formatPhoneUs(profile.phone_e164)}
                  </a>
                </div>
              )}
            </address>
          </div>

          {/* Col 2: Areas served */}
          {footerAreas.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-[0.15em] text-ink-60 mb-4">Areas served</h3>
              <ul className="space-y-1.5">
                {footerAreas.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={"/areas/" + a.slug}
                      className="text-sm text-ink-60 hover:text-[var(--brand-primary)] transition-colors"
                    >
                      {a.name}{a.state ? ", " + a.state : ""}
                    </Link>
                  </li>
                ))}
                {areas.length > 12 && (
                  <li>
                    <Link href="/" className="text-sm text-ink-60 hover:text-ink transition-colors">
                      View all →
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Col 3: Recent writing */}
          {recentPosts.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-[0.15em] text-ink-60 mb-4">Recent writing</h3>
              <ul className="space-y-2">
                {recentPosts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={"/blog/" + p.slug}
                      className="text-sm text-ink-60 hover:text-[var(--brand-primary)] transition-colors leading-snug block"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/blog"
                className="inline-block mt-3 text-sm text-ink-60 hover:text-ink transition-colors"
              >
                All posts →
              </Link>
            </div>
          )}
        </div>

        {/* Bottom strip */}
        <div className="border-t hairline mt-10 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-ink-60">
          <span>© {year} {agentName}</span>
          <span className="flex gap-4">
            <Link href="/sitemap.xml" className="hover:text-ink transition-colors">Sitemap</Link>
            <Link href="/llms.txt" className="hover:text-ink transition-colors">llms.txt</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
