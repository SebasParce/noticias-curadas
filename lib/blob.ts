import { put, list } from "@vercel/blob";
import type { Briefing } from "./types";

// Guardamos siempre en el mismo pathname y sobreescribimos ("allowOverwrite").
// Así la home siempre lee el último resultado sin necesitar una base de datos.
const BRIEFING_PATHNAME = "briefing/latest.json";

export async function saveBriefing(briefing: Briefing): Promise<string> {
  const { url } = await put(BRIEFING_PATHNAME, JSON.stringify(briefing), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60, // el cliente puede revalidar rápido; el cron corre 1x/día
  });
  return url;
}

export async function getBriefing(): Promise<Briefing | null> {
  try {
    const { blobs } = await list({ prefix: BRIEFING_PATHNAME, limit: 1 });
    const blob = blobs.find((b) => b.pathname === BRIEFING_PATHNAME);
    if (!blob) return null;

    const res = await fetch(blob.url, {
      // Revalidamos cada 5 min: suficiente para reflejar la corrida diaria
      // sin pegarle a Blob en cada visita.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    return (await res.json()) as Briefing;
  } catch (err) {
    console.error("[blob] Error leyendo el briefing:", err);
    return null;
  }
}
