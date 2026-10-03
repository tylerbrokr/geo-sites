// Classifies a request as an AI crawler, a search crawler, or a visit
// referred by an AI assistant or a search engine. Anything else is an
// ordinary visitor and is not logged: the point is proof that AI systems
// read and send people to the site, not analytics on people.
//
// Pure, so it can be unit-tested; middleware.ts does the sending.

export type VisitKind = "ai_crawler" | "search_crawler" | "ai_referral" | "search_referral";

const AI_CRAWLERS: [RegExp, string][] = [
  [/OAI-SearchBot/i, "OAI-SearchBot"],
  [/ChatGPT-User/i, "ChatGPT-User"],
  [/GPTBot/i, "GPTBot"],
  [/Claude-SearchBot/i, "Claude-SearchBot"],
  [/Claude-User/i, "Claude-User"],
  [/ClaudeBot/i, "ClaudeBot"],
  [/anthropic-ai/i, "anthropic-ai"],
  [/Perplexity-User/i, "Perplexity-User"],
  [/PerplexityBot/i, "PerplexityBot"],
  [/Amazonbot/i, "Amazonbot"],
  [/Bytespider/i, "Bytespider"],
  [/CCBot/i, "CCBot"],
  [/cohere-ai/i, "cohere-ai"],
  [/meta-externalagent|meta-externalfetcher/i, "Meta-ExternalAgent"],
  [/DuckAssistBot/i, "DuckAssistBot"],
  [/YouBot/i, "YouBot"],
  [/MistralAI-User/i, "MistralAI-User"],
  [/Google-CloudVertexBot/i, "Google-CloudVertexBot"],
];

const SEARCH_CRAWLERS: [RegExp, string][] = [
  [/Googlebot/i, "Googlebot"],
  [/bingbot/i, "Bingbot"],
  [/Applebot/i, "Applebot"],
  [/DuckDuckBot/i, "DuckDuckBot"],
];

// Referrer hosts (suffix match) for AI assistants that link out to sources.
const AI_REFERRERS: [string, string][] = [
  ["chatgpt.com", "ChatGPT"],
  ["chat.openai.com", "ChatGPT"],
  ["perplexity.ai", "Perplexity"],
  ["copilot.microsoft.com", "Copilot"],
  ["gemini.google.com", "Gemini"],
  ["claude.ai", "Claude"],
  ["you.com", "You.com"],
  ["duck.ai", "DuckDuckGo AI"],
  ["meta.ai", "Meta AI"],
  ["grok.com", "Grok"],
];

const SEARCH_REFERRERS: [RegExp, string][] = [
  [/(^|\.)google\.[a-z.]+$/i, "Google"],
  [/(^|\.)bing\.com$/i, "Bing"],
  [/(^|\.)duckduckgo\.com$/i, "DuckDuckGo"],
  [/(^|\.)search\.yahoo\.com$/i, "Yahoo"],
  [/(^|\.)search\.brave\.com$/i, "Brave"],
];

export interface Visit {
  kind: VisitKind;
  agent: string;
}

export function classifyVisit(userAgent: string | null, referrer: string | null): Visit | null {
  const ua = userAgent ?? "";
  if (/GEO-Visibility-Bot/i.test(ua)) return null; // our own checker
  for (const [re, name] of AI_CRAWLERS) if (re.test(ua)) return { kind: "ai_crawler", agent: name };
  for (const [re, name] of SEARCH_CRAWLERS) if (re.test(ua)) return { kind: "search_crawler", agent: name };

  if (referrer) {
    let host = "";
    try { host = new URL(referrer).hostname.toLowerCase(); } catch { return null; }
    for (const [suffix, name] of AI_REFERRERS) {
      if (host === suffix || host.endsWith(`.${suffix}`)) return { kind: "ai_referral", agent: name };
    }
    for (const [re, name] of SEARCH_REFERRERS) if (re.test(host)) return { kind: "search_referral", agent: name };
  }
  return null;
}
