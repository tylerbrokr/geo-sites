import "@/styles/globals.css";
import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { headers } from "next/headers";
import { resolveHost } from "@/lib/resolve-host";
import { getPlatformSetting, getProfile, getSiteCopy, listAreas, listPosts } from "@/lib/queries";
import { readableForeground } from "@/lib/utils";
import SiteHeader from "@/app/components/SiteHeader";
import SiteFooter from "@/app/components/SiteFooter";

export const runtime = "edge";
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) return { title: "Site not found" };

  const [profile, copy, bingCode] = await Promise.all([
    getProfile(resolved.clientId),
    getSiteCopy(resolved.clientId),
    getPlatformSetting("bing_site_verification"),
  ]);

  // Search engine ownership proofs. Google issues one token per site (stored
  // on the site row by register-search-engines); Bing uses one code for the
  // whole Webmaster account. Rendering them is what lets registration finish
  // without anyone touching DNS.
  const googleToken = resolved.site.google_verification_token || undefined;
  const verification: Metadata["verification"] | undefined =
    googleToken || bingCode
      ? { google: googleToken, other: bingCode ? { "msvalidate.01": bingCode } : undefined }
      : undefined;

  const siteName =
    resolved.site.agent_display_name ||
    profile?.business_name ||
    profile?.brokerage ||
    "Real estate";

  const ogImage = copy?.og_image_url || profile?.headshot_url || profile?.logo_url;

  return {
    title: { default: copy?.meta_title || siteName, template: `%s · ${siteName}` },
    description: copy?.meta_description || copy?.tagline || undefined,
    openGraph: { siteName, images: ogImage ? [ogImage] : undefined },
    twitter: { card: "summary_large_image" },
    verification,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);

  let brandPrimary = "#1a1a1a";
  let brandAccent = "#c9a96e";
  let brandOnPrimary = "#fff";

  let profile = null;
  let areas: Awaited<ReturnType<typeof listAreas>> = [];
  let recentPosts: Awaited<ReturnType<typeof listPosts>> = [];

  if (resolved) {
    [profile, areas, recentPosts] = await Promise.all([
      getProfile(resolved.clientId),
      listAreas(resolved.clientId),
      listPosts(resolved.clientId, 5),
    ]);
    if (profile?.primary_color) {
      brandPrimary = profile.primary_color;
      brandOnPrimary = readableForeground(profile.primary_color);
    }
    if (profile?.accent_color) brandAccent = profile.accent_color;
  }

  return (
    <html
      lang="en"
      style={
        {
          "--brand-primary": brandPrimary,
          "--brand-accent": brandAccent,
          "--brand-on-primary": brandOnPrimary,
        } as CSSProperties
      }
    >
      <body className="font-sans bg-canvas text-ink flex flex-col min-h-screen">
        {resolved && (
          <SiteHeader site={resolved.site} profile={profile} />
        )}
        <div className="flex-1">{children}</div>
        {resolved && (
          <SiteFooter
            site={resolved.site}
            profile={profile}
            areas={areas}
            recentPosts={recentPosts}
          />
        )}
      </body>
    </html>
  );
}
