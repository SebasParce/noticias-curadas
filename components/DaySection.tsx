import { getTimezone } from "@/lib/date";
import type { Briefing } from "@/lib/types";
import { GROUP_IDS } from "@/lib/types";
import type { GroupFilter } from "./CategoryTabs";
import { CategorySection } from "./CategorySection";
import { ExecutiveSummary } from "./ExecutiveSummary";

interface DaySectionProps {
  briefing: Briefing;
  isToday: boolean;
  groupFilter: GroupFilter;
}

// Contenido del día seleccionado en el panel derecho: encabezado + resumen
// ejecutivo + las categorías (todas, o solo una si hay un filtro activo).
export function DaySection({ briefing, isToday, groupFilter }: DaySectionProps) {
  const generatedLabel = new Intl.DateTimeFormat("es-ES", {
    timeZone: getTimezone(),
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(briefing.generatedAt));

  const groupsToShow = groupFilter === "todas" ? GROUP_IDS : [groupFilter];

  return (
    <section>
      <header className="mb-8">
        {isToday && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-tecnologia">
            Hoy
          </p>
        )}
        <h2 className="font-serif text-2xl leading-tight text-ink sm:text-3xl">
          {briefing.displayDate}
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          {briefing.items.length} noticias curadas · actualizado a las{" "}
          {generatedLabel}
        </p>
      </header>

      <ExecutiveSummary bullets={briefing.executiveSummary} />

      {groupsToShow.map((group) => (
        <CategorySection
          key={group}
          group={group}
          items={briefing.items.filter((item) => item.group === group)}
        />
      ))}
    </section>
  );
}
