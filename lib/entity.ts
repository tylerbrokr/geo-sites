import type { PublicClientProfile } from "@/types/db";

// The agent's presence elsewhere on the web: Google Business Profile, Zillow,
// Realtor.com, their brokerage page, and so on. Linking these (visibly and as
// schema.org sameAs) is what lets a search or answer engine confirm this site
// and those profiles describe the same licensed person.

export type ProfileLink = { label: string; url: string };

const LABELS: [RegExp, string][] = [
  [/(^|\.)zillow\.com$/, "Zillow"],
  [/(^|\.)realtor\.com$/, "Realtor.com"],
  [/(^|\.)homes\.com$/, "Homes.com"],
  [/(^|\.)homelight\.com$/, "HomeLight"],
  [/(^|\.)ramseysolutions\.com$/, "RamseyTrusted"],
  [/(^|\.)fastexpert\.com$/, "FastExpert"],
  [/(^|\.)linkedin\.com$/, "LinkedIn"],
  [/(^|\.)facebook\.com$/, "Facebook"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)youtube\.com$/, "YouTube"],
  [/(^|\.)(google\.com|g\.page|goo\.gl)$/, "Google Business Profile"],
];

// Only http(s) links are ever rendered; anything else typed into the field
// (including javascript: URLs) is dropped.
function parse(raw: string | null | undefined): URL | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u : null;
  } catch {
    return null;
  }
}

function labelFor(u: URL): string {
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  return LABELS.find(([re]) => re.test(host))?.[1] ?? host;
}

export function profileLinks(profile: PublicClientProfile | null | undefined): ProfileLink[] {
  const out: ProfileLink[] = [];
  const seen = new Set<string>();
  const add = (raw: string | null | undefined, label?: string) => {
    const u = parse(raw);
    if (!u || seen.has(u.href)) return;
    seen.add(u.href);
    out.push({ label: label ?? labelFor(u), url: u.href });
  };
  add(profile?.gbp_url, "Google Business Profile");
  for (const l of profile?.profile_links ?? []) add(l);
  return out;
}

// Extra properties for the RealEstateAgent / LocalBusiness node.
export function agentEntitySchema(profile: PublicClientProfile | null | undefined) {
  const links = profileLinks(profile);
  const license = profile?.license_number?.trim();
  return {
    sameAs: links.length ? links.map((l) => l.url) : undefined,
    identifier: license
      ? { "@type": "PropertyValue", name: "Real estate license", value: license }
      : undefined,
  };
}
