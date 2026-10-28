import type { PublicClientPositioning } from "@/types/db";

// URL slug for the specialty page, from the process name:
// "The Golf Lifestyle Match™" -> "golf-lifestyle-match". A leading "The" is
// dropped so the address reads as the thing, not the phrase.
export function processSlug(positioning: PublicClientPositioning | null | undefined): string | null {
  const name = positioning?.process_name?.trim();
  if (!name) return null;
  const slug = name
    .replace(/[™®©]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || null;
}

export function processPath(positioning: PublicClientPositioning | null | undefined): string | null {
  const slug = processSlug(positioning);
  return slug ? `/process/${slug}` : null;
}

// Buyer questions the page answers, built from the worksheet in the
// agent's own words. Rendered as an FAQ and as FAQPage schema.
export function processFaqs(positioning: PublicClientPositioning, agentName: string | null): { q: string; a: string }[] {
  const name = positioning.process_name?.trim() || "this process";
  const who = positioning.who_you_help?.trim();
  const unlike = positioning.unlike?.trim();
  const dread = positioning.dread?.trim();
  const outcome = positioning.outcome?.trim();
  const dream = positioning.dream_outcome?.trim();
  const description = positioning.process_description?.trim();
  const out: { q: string; a: string }[] = [];
  if (description) out.push({ q: `What is ${name}?`, a: description });
  if (who) out.push({ q: `Who is ${name} for?`, a: who });
  if (unlike) out.push({ q: `How is ${name} different from working with any agent?`, a: unlike });
  if (dread) out.push({ q: `What does ${name} help buyers avoid?`, a: dread });
  if (outcome || dream) out.push({ q: `What does the result look like?`, a: [outcome, dream].filter(Boolean).join(" ") });
  if (agentName) out.push({ q: `Who created ${name}?`, a: `${name} is ${agentName}'s own consultation process${positioning.niche ? `. ${agentName} is a ${positioning.niche}` : ""}.` });
  return out;
}
