import "@/styles/globals.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { resolveHost } from "@/lib/resolve-host";
import { getProfile } from "@/lib/queries";

export const runtime = 'edge';
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const host = headers().get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) return { title: "Site not found" };

  const profile = await getProfile(resolved.clientId);
  const name = profile?.business_name || profile?.brokerage || "Real estate";
  return {
    title: { default: name, template: `%s. ${name}` },
    description: profile?.ideal_client || undefined,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-canvas text-ink">{children}</body>
    </html>
  );
}
