import { NextResponse } from "next/server";
import { generateBriefingPayload } from "@/lib/anthropic";
import { saveBriefing } from "@/lib/blob";
import { formatDateKey, formatDisplayDate } from "@/lib/date";
import type { Briefing } from "@/lib/types";

// Necesitamos Node.js (no Edge) por el SDK de Anthropic y @vercel/blob.
export const runtime = "nodejs";
// Fetches + búsquedas + generar ~15-35 noticias puede tardar 1-3 min en la
// práctica (se vio un FUNCTION_INVOCATION_TIMEOUT en 120s). Con Fluid
// Compute, Hobby y Pro soportan hasta 300s por default: dejamos casi todo
// ese margen.
export const maxDuration = 280;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Sin CRON_SECRET configurado, no hay forma de verificar el caller: negamos.
    return false;
  }
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function runBriefingJob() {
  const now = new Date();
  const nowLabel = formatDisplayDate(now);

  const payload = await generateBriefingPayload(nowLabel);

  const briefing: Briefing = {
    date: formatDateKey(now),
    displayDate: nowLabel,
    generatedAt: now.toISOString(),
    executiveSummary: payload.executiveSummary,
    items: payload.items,
  };

  await saveBriefing(briefing);
  return briefing;
}

export async function GET(req: Request) {
  // Vercel Cron Jobs invoca esta ruta por GET y agrega automáticamente
  // el header "Authorization: Bearer <CRON_SECRET>" cuando la env var
  // CRON_SECRET está configurada en el proyecto.
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const briefing = await runBriefingJob();
    return NextResponse.json({
      ok: true,
      date: briefing.date,
      itemCount: briefing.items.length,
    });
  } catch (err) {
    console.error("[cron] Error generando el briefing:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
