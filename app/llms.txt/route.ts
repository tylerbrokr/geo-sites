import { headers } from "next/headers";
import { resolveHost, canonicalHost } from "@/lib/resolve-host";
import { getProfile, getSiteCopy, listAreas, listPosts } from "@/lib/queries";
import { formatPhoneUs } from "@/lib/utils";
import { profileLinks } from "@/lib/entity";

export const runtime = "edge";

export async function GET() {
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);

  if (!resolved) {
    return new Response("Not found", { status: 404 });
  }

  const hostname = canonicalHost(resolved.site);

  const [profile, copy, areas, posts] = await Promise.all([
    getProfile(resolved.clientId),
    getSiteCopy(resolved.clientId),
    listAreas(resolved.clientId),
    listPosts(resolved.clientId, 10),
  ]);

  const agentName =
    resolved.site.agent_display_name ||
    profile?.business_name ||
    profile?.brokerage ||
    "Agent";

  const lines: string[] = [];

  lines.push(`# ${agentName}`);
  lines.push("");

  if (copy?.tagline) {
    lines.push(copy.tagline);
    lines.push("");
  }

  if (copy?.bio_short) {
    lines.push(copy.bio_short);
    lines.push("");
  }

  if (profile?.brokerage) {
    lines.push("## Brokerage");
    lines.push(profile.brokerage);
    lines.push("");
  }

  // NAP block
  const hasNap = profile?.phone_e164 || profile?.city;
  if (hasNap) {
    lines.push("## Contact");
    if (profile?.phone_e164) lines.push(`- Phone: ${formatPhoneUs(profile.phone_e164)}`);
    const locationParts = [profile?.city, profile?.state].filter(Boolean);
    if (locationParts.length > 0) lines.push(`- Location: ${locationParts.join(", ")}`);
    lines.push("");
  }

  const links = profileLinks(profile);
  const license = profile?.license_number?.trim();
  if (license || links.length > 0) {
    lines.push("## Credentials and profiles");
    if (license) lines.push(`- Real estate license: ${license}`);
    for (const l of links) lines.push(`- [${l.label}](${l.url})`);
    lines.push("");
  }

  if (areas.length > 0) {
    lines.push("## Areas served");
    for (const a of areas) {
      const label = a.name + (a.state ? `, ${a.state}` : "");
      lines.push(`- [${label}](https://${hostname}/areas/${a.slug})`);
    }
    lines.push("");
  }

  if (posts.length > 0) {
    lines.push("## Recent posts");
    for (const p of posts) {
      const excerpt = p.excerpt ? ` — ${p.excerpt}` : "";
      lines.push(`- [${p.title}](https://${hostname}/blog/${p.slug})${excerpt}`);
    }
    lines.push("");
  }

  lines.push("## Site map");
  lines.push(`- [Home](https://${hostname}/)`);
  lines.push(`- [About](https://${hostname}/about)`);
  lines.push(`- [Sitemap](https://${hostname}/sitemap.xml)`);

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
