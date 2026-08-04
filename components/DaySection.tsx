import { getTimezone } from "@/lib/date";
import type { Briefing } from "@/lib/types";
import { GROUP_IDS } from "@/lib/types";
import { CategorySection } from "./CategorySection";
import { ExecutiveSummary } from "./ExecutiveSummary";

interface DaySectionProps {
  briefing: Briefing;
  /** El primero del scroll (el más reciente) se muestra más grande. */
  isLatest: boolean;
}

export function DaySection({ briefing, isLatest }: DaySectionProps) {
  const generatedLabel = new Intl.DateTimeFormat("es-ES", {
    timeZone: getTimezone(),
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(briefing.generatedAt));

  return (
    <section
      className={
        isLatest
          ? "mb-14 sm:mb-20"
          : "mb-14 border-t border-line pt-12 sm:mb-20 sm:pt-16"
      }
    >
      <header className="mb-8 sm:mb-10">
        {isLatest && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-tecnologia">
            Hoy
          </p>
        )}
        <h2
          className={
            isLatest
              ? "font-serif text-3xl leading-tight text-ink sm:text-4xl md:text-5xl"
              : "font-serif text-2xl leading-tight text-ink sm:text-3xl"
          }
        >
          {briefing.displayDate}
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          {briefing.items.length} noticias curadas · actualizado a las{" "}
          {generatedLabel}
        </p>
      </header>

      <ExecutiveSummary bullets={briefing.executiveSummary} />

      {GROUP_IDS.map((group) => (
        <CategorySection
          key={group}
          group={group}
          items={briefing.items.filter((item) => item.group === group)}
        />
      ))}
    </section>
  );
}
