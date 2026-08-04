import { put, list } from "@vercel/blob";
import type { Briefing } from "./types";

// Cada corrida se guarda en su propio archivo por fecha: briefing/YYYY-MM-DD.json.
// Así la home puede mostrar un histórico (scroll por día) en vez de pisar
// siempre el mismo archivo. Si el cron se corre 2 veces el mismo día,
// "allowOverwrite" hace que la segunda corrida reemplace la de ese día
// en vez de duplicarla.
const BRIEFING_PREFIX = "briefing/";
const DATE_FILENAME_RE = /^briefing\/(\d{4}-\d{2}-\d{2})\.json$/;

function pathnameFor(date: string): string {
  return `${BRIEFING_PREFIX}${date}.json`;
}

export async function saveBriefing(briefing: Briefing): Promise<string> {
  const { url } = await put(pathnameFor(briefing.date), JSON.stringify(briefing), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return url;
}

/**
 * Devuelve hasta `limit` briefings, del más reciente al más antiguo.
 */
export async function getBriefingHistory(limit = 14): Promise<Briefing[]> {
  try {
    const { blobs } = await list({ prefix: BRIEFING_PREFIX, limit: 1000 });

    const dayBlobs = blobs
      .filter((b) => DATE_FILENAME_RE.test(b.pathname))
      .sort((a, b) => (a.pathname < b.pathname ? 1 : -1)) // YYYY-MM-DD ordena bien como string
      .slice(0, limit);

    const results = await Promise.all(
      dayBlobs.map(async (b) => {
        try {
          const res = await fetch(b.url, { next: { revalidate: 300 } });
          if (!res.ok) return null;
          return (await res.json()) as Briefing;
        } catch (err) {
          console.error(`[blob] Error leyendo ${b.pathname}:`, err);
          return null;
        }
      }),
    );

    return results
      .filter((b): b is Briefing => b !== null)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch (err) {
    console.error("[blob] Error leyendo el histórico de briefings:", err);
    return [];
  }
}
