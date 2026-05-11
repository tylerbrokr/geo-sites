import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * On-demand revalidation webhook.
 *
 * Called by the Supabase publish-post edge function (Phase 2) and the
 * site_cache_purges sweep with the shared REVALIDATE_SECRET in
 * x-revalidate-secret. Body shape:
 *
 *   { hostname: "agent.sites.geoemployee.com", paths: ["/", "/blog/foo"] }
 *
 * If paths is empty we revalidate "/" by default.
 */
export const runtime = "edge";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { hostname?: string; paths?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const paths = body.paths && body.paths.length > 0 ? body.paths : ["/"];
  for (const p of paths) {
    revalidatePath(p);
  }

  return NextResponse.json({ ok: true, revalidated: paths });
}
