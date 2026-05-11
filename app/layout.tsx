import "@/styles/globals.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { resolveHost } from "@/lib/resolve-host";
import { getProfile, getSiteCopy } from "@/lib/queries";
import type { CSSProperties, ReactNode } from "react";
import { readableForeground } from "@/lib/utils";

export const runtime = "edge";
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) return { title: "Site not found" };

  const [profile, copy] = await Promise.all([
    getProfile(resolved.clientId),
    getSiteCopy(resolved.clientId),
  ]);

  const siteName =
    resolved.site.agent_display_name ||
    profile?.business_name ||
    profile?.brokerage ||
    "Real estate";

  const ogImage = copy?.og_image_url || profile?.headshot_url || profile?.logo_url;

  return {
    title: { default: copy?.meta_title || siteName, template: `%s · ${siteName}` },
    description: copy?.meta_description || copy?.tagline || undefined,
    openGraph: {
      siteName,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);

  let brandPrimary = "#1a1a1a";
  let brandAccent = "#c9a96e";
  let brandOnPrimary = "#fff";

  if (resolved) {
    const profile = await getProfile(resolved.clientId);
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
      <body className="font-sans bg-canvas text-ink">{children}</body>
    </html>
  );
}
