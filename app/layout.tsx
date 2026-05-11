import "@/styles/globals.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { resolveHost } from "@/lib/resolve-host";
import { getProfile, getSiteCopy } from "@/lib/queries";

export const runtime = "edge";
export const revalidate = 3600; // hourly background ISR; on-demand via /api/revalidate

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) return { title: "Site not found" };

  // Prefer AI-generated copy; fall back to raw profile fields.
  const [profile, copy] = await Promise.all([
    getProfile(resolved.clientId),
    getSiteCopy(resolved.clientId),
  ]);

  const siteName = resolved.site.agent_display_name
    || profile?.business_name
    || profile?.brokerage
    || "Real estate";

  const metaTitle = copy?.meta_title || siteName;
  const metaDescription = copy?.meta_description || profile?.ideal_client || undefined;

  return {
    title: { default: metaTitle, template: `%s · ${siteName}` },
    description: metaDescription,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-canvas text-ink">{children}</body>
    </html>
  );
}
