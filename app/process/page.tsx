import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { resolveHost } from "@/lib/resolve-host";
import { getPositioning } from "@/lib/queries";
import { processPath } from "@/lib/positioning";

export const runtime = "edge";

// /process always points at the agent's one specialty page.
export default async function ProcessIndex() {
  const host = (await headers()).get("x-resolved-host");
  const resolved = await resolveHost(host);
  if (!resolved) notFound();
  const path = processPath(await getPositioning(resolved.clientId));
  if (!path) notFound();
  permanentRedirect(path);
}
