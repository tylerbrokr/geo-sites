import { headers } from "next/headers";
import { resolveHost, canonicalHost } from "@/lib/resolve-host";
import { listPosts, listAreas } from "@/lib/queries";

export const runtime = "edge";

export async function GET() {
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);

  if (!resolved) {
    return new Response("Not found", { status: 404 });
  }

  const hostname = canonicalHost(resolved.site);
  const [posts, areas] = await Promise.all([
    listPosts(resolved.clientId, 100),
    listAreas(resolved.clientId),
  ]);

  const staticRoutes = [
    { loc: "/", changefreq: "weekly", priority: "1.0" },
    { loc: "/about", changefreq: "monthly", priority: "0.8" },
  ];

  const areaUrls = areas.map((a) => ({
    loc: "/areas/" + a.slug,
    lastmod: a.updated_at ? a.updated_at.slice(0, 10) : undefined,
    changefreq: "monthly",
    priority: "0.8",
  }));

  const postUrls = posts.map((p) => ({
    loc: "/blog/" + p.slug,
    lastmod: p.updated_at ? p.updated_at.slice(0, 10) : p.published_at ? p.published_at.slice(0, 10) : undefined,
    changefreq: "monthly",
    priority: "0.7",
  }));

  const allUrls = [...staticRoutes, ...areaUrls, ...postUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>https://${hostname}${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
