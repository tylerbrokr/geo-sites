export const runtime = 'edge';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-32 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-ink-60 mb-4">404</p>
      <h1 className="font-display text-5xl leading-[1.05] mb-6">Page not found.</h1>
      <p className="text-ink-60">The page you were looking for is not here.</p>
    </main>
  );
}
