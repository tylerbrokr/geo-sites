import { headers } from "next/headers";
import { resolveHost, canonicalHost } from "@/lib/resolve-host";

export const runtime = "edge";

export async function GET() {
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  const hostname = resolved ? canonicalHost(resolved.site) : "mygeosite.com";

  const content = `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: Bytespider
Allow: /

Sitemap: https://${hostname}/sitemap.xml
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
