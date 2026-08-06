import { BriefingBrowser } from "@/components/BriefingBrowser";
import { Header } from "@/components/Header";
import { getBriefingHistory } from "@/lib/blob";
import { SOURCES } from "@/lib/sources";

// Revalidamos cada 5 minutos: el cron corre 1x/día, esto solo evita
// pegarle a Blob en cada visita sin dejar de reflejar la última corrida.
export const revalidate = 300;

// Cuántos días de histórico traer para el buscador de fechas.
const HISTORY_DAYS = 14;

export default async function HomePage() {
  const history = await getBriefingHistory(HISTORY_DAYS);

  if (history.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-soft">
          Briefing diario
        </p>
        <h1 className="mt-3 font-serif text-3xl text-ink">
          Todavía no hay ningún briefing generado
        </h1>
        <p className="mt-4 text-ink-soft">
          El resumen se genera automáticamente todas las mañanas. Volvé en un
          rato, o si sos quien lo administra, revisá que el cron job y las
          variables de entorno estén bien configurados.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <Header />

      <BriefingBrowser history={history} />

      <footer className="mt-12 border-t border-line pt-6 text-xs leading-relaxed text-ink-soft">
        Curado y sintetizado automáticamente con IA a partir de{" "}
        {Array.from(new Set(SOURCES.map((s) => s.name))).join(", ")}. Mostrando
        los últimos {history.length} día{history.length === 1 ? "" : "s"}{" "}
        disponibles. Este contenido es un resumen editorial generado por un
        modelo de lenguaje: para el detalle completo, seguí el enlace a la
        fuente original de cada nota.
      </footer>
    </main>
  );
}
