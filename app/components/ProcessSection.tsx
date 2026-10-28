import Link from "next/link";
import type { PublicClientPositioning } from "@/types/db";
import { processPath } from "@/lib/positioning";

// "How I work": the agent's named process, from the specialist worksheet.
// Shown on the homepage and the About page so the process name and who it
// is for appear in the same words everywhere an AI might read them.
export function ProcessSection({ positioning, agentName }: { positioning: PublicClientPositioning | null; agentName: string | null }) {
  if (!positioning) return null;
  const name = positioning.process_name?.trim();
  const description = positioning.process_description?.trim();
  if (!name && !description) return null;
  const who = positioning.who_you_help?.trim();
  const unlike = positioning.unlike?.trim();
  const dream = positioning.dream_outcome?.trim();
  const href = processPath(positioning);
  return (
    <section className="mb-12 border-t hairline pt-10">
      <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--brand-accent)] mb-3">How I work</p>
      {name && <h2 className="font-display text-3xl mb-4">{name}</h2>}
      {description && <p className="text-lg text-ink-80 max-w-2xl leading-relaxed">{description}</p>}
      <dl className="mt-8 grid gap-6 sm:grid-cols-3 max-w-3xl">
        {who && (
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-ink-60 mb-2">Who it is for</dt>
            <dd className="text-sm text-ink-80 leading-relaxed">{who}</dd>
          </div>
        )}
        {unlike && (
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-ink-60 mb-2">What is different</dt>
            <dd className="text-sm text-ink-80 leading-relaxed">{unlike}</dd>
          </div>
        )}
        {dream && (
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-ink-60 mb-2">The result</dt>
            <dd className="text-sm text-ink-80 leading-relaxed">{dream}</dd>
          </div>
        )}
      </dl>
      {href && name && (
        <p className="mt-6">
          <Link href={href} className="inline-block px-4 py-2 border hairline text-sm hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-colors">
            How {name} works →
          </Link>
        </p>
      )}
      {agentName && name && (
        <p className="mt-4 text-xs text-ink-40">{name} is {agentName}&apos;s own consultation process.</p>
      )}
    </section>
  );
}
