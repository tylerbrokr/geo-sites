import Link from "next/link";
import type { PublicClientSite, PublicClientProfile } from "@/types/db";
import { formatPhoneUs } from "@/lib/utils";

type Props = {
  site: PublicClientSite;
  profile: PublicClientProfile | null;
  // The agent's specialty page, when they have a named process.
  processLink?: { href: string; label: string } | null;
};

export default function SiteHeader({ site, profile, processLink }: Props) {
  const agentName = site.agent_display_name || profile?.business_name || profile?.brokerage || "";

  return (
    <header className="sticky top-0 z-40 bg-canvas relative">
      <div className="mx-auto max-w-[1100px] px-6 py-4 flex items-center justify-between gap-6">
        {/* Left: name + brokerage */}
        <div className="min-w-0">
          <Link
            href="/"
            className="font-display text-xl leading-tight block truncate hover:text-[var(--brand-primary)] transition-colors"
          >
            {agentName}
          </Link>
          {profile?.brokerage && (
            <span className="text-xs text-ink-60 block truncate">{profile.brokerage}</span>
          )}
        </div>

        {/* Right: nav + phone */}
        <nav className="flex items-center gap-6 shrink-0 text-sm">
          {processLink && (
            <Link href={processLink.href} className="text-ink-60 hover:text-ink transition-colors hidden sm:block truncate max-w-[220px]">{processLink.label}</Link>
          )}
          <Link href="/about" className="text-ink-60 hover:text-ink transition-colors hidden sm:block">About</Link>
          <Link href="/blog" className="text-ink-60 hover:text-ink transition-colors hidden sm:block">Blog</Link>
          {profile?.phone_e164 && (
            <a
              href={"tel:" + profile.phone_e164}
              className="text-[var(--brand-accent)] hover:opacity-80 transition-opacity font-medium"
            >
              {formatPhoneUs(profile.phone_e164)}
            </a>
          )}
        </nav>
      </div>

      {/* Mobile nav row */}
      <div className="sm:hidden">
        <div className="mx-auto max-w-[1100px] px-6 py-2 flex gap-5 text-sm text-ink-60">
          {processLink && <Link href={processLink.href} className="hover:text-ink transition-colors truncate">{processLink.label}</Link>}
          <Link href="/about" className="hover:text-ink transition-colors">About</Link>
          <Link href="/blog" className="hover:text-ink transition-colors">Blog</Link>
        </div>
      </div>

      {/* 1px accent bottom border at 20% opacity */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[var(--brand-accent)] opacity-20" />
    </header>
  );
}
