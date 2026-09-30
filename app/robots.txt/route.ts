import { headers } from "next/headers";
import { resolveHost, canonicalHost } from "@/lib/resolve-host";

export const runtime = "edge";

export async function GET() {
  // Fall back to the raw host headers so the Sitemap line always names THIS
  // site. It used to fall back to a fixed parent domain, which sent every
  // crawler to a sitemap that doesn't exist.
  const h = await headers();
  const host = h.get("x-resolved-host") || h.get("x-forwarded-host") || h.get("host");
  const resolved = await resolveHost(host);
  const hostname = resolved ? canonicalHost(resolved.site) : (host ?? "").split(":")[0].toLowerCase();

  // Search/answer bots (OAI-SearchBot, Claude-SearchBot, PerplexityBot) are
  // what surface a site in AI answers; *-User bots fetch a page a person asked
  // about; GPTBot/ClaudeBot/Google-Extended are training crawlers.
  const content = `User-agent: *
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: GPTBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: Bytespider
Allow: /

${hostname ? `Sitemap: https://${hostname}/sitemap.xml\n` : ""}`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
