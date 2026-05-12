/**
 * Pick black or white text for legibility on a colored background.
 * Uses sRGB relative luminance.
 */
export function readableForeground(hex: string | null | undefined): string {
  if (!hex) return "#fff";
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#fff";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.55 ? "#000" : "#fff";
}

/**
 * Format an E.164 phone number as a US-readable string.
 * "+16125551234" => "(612) 555-1234"
 */
export function formatPhoneUs(e164: string | null | undefined): string {
  if (!e164) return "";
  const digits = e164.replace(/\D/g, "");
  const local = digits.startsWith("1") ? digits.slice(1) : digits;
  if (local.length !== 10) return e164;
  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}

/**
 * Auto-link the first occurrence of each area name in an HTML body string.
 * Safe: only replaces text nodes (won't corrupt tags or attributes).
 */
export function linkAreasInHtml(
  html: string,
  areas: Array<{ name: string; slug: string }>,
  hostname: string
): string {
  let result = html;
  for (const area of areas) {
    const escaped = area.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?<!["/=>])\\b(${escaped})\\b`, "i");
    const linked = `<a href="https://${hostname}/areas/${area.slug}" class="underline decoration-brand-primary/40 hover:decoration-brand-primary">$1</a>`;
    result = result.replace(pattern, linked);
  }
  return result;
}

/**
 * Strip markdown syntax and return plain text.
 * Used to populate JSON-LD articleBody so LLMs get a clean extraction target.
 */
export function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")         // headings
    .replace(/\*\*(.+?)\*\*/g, "$1")     // bold
    .replace(/\*(.+?)\*/g, "$1")         // italic
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")  // links
    .replace(/`(.+?)`/g, "$1")           // inline code
    .replace(/^>\s+/gm, "")              // blockquotes
    .replace(/^[-*+]\s+/gm, "")          // unordered list markers
    .replace(/^\d+\.\s+/gm, "")          // ordered list markers
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Auto-link the first occurrence of each area name in a markdown body string.
 * Injects a markdown link [Area Name](/areas/slug) so it renders correctly
 * inside react-markdown (unlike the HTML version which would show raw <a> tags).
 * Skips occurrences already inside a markdown link [...](...).
 */
export function linkAreasInMarkdown(
  markdown: string,
  areas: Array<{ name: string; slug: string }>
): string {
  let result = markdown;
  for (const area of areas) {
    const escaped = area.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Negative lookbehind: skip if already inside a markdown link bracket
    const pattern = new RegExp(`(?<!\\[)\\b(${escaped})\\b(?![^\\[]*\\])`, "i");
    result = result.replace(pattern, `[$1](/areas/${area.slug})`);
  }
  return result;
}
