"use client";

import { useMemo, useState } from "react";
import type { Briefing } from "@/lib/types";
import { GROUP_IDS } from "@/lib/types";
import type { GroupFilter } from "./CategoryTabs";
import { CategoryTabs } from "./CategoryTabs";
import { DateNav } from "./DateNav";
import { DaySection } from "./DaySection";

interface BriefingBrowserProps {
  /** Ordenado del más reciente al más viejo (igual que getBriefingHistory). */
  history: Briefing[];
}

// Vista maestro-detalle: fechas a la izquierda, categorías arriba a la
// derecha. Clickear una fecha o una categoría filtra lo que se ve, no hace
// falta scrollear por todo el histórico.
export function BriefingBrowser({ history }: BriefingBrowserProps) {
  const mostRecentDate = history[0]?.date;

  const [selectedDate, setSelectedDate] = useState(mostRecentDate);
  const [selectedGroup, setSelectedGroup] = useState<GroupFilter>("todas");

  const selectedBriefing = useMemo(
    () => history.find((b) => b.date === selectedDate) ?? history[0],
    [history, selectedDate],
  );

  const navDays = useMemo(
    () =>
      [...history]
        .reverse()
        .map((b) => ({ date: b.date, itemCount: b.items.length })),
    [history],
  );

  // Mostramos tabs de categorías que tengan al menos una noticia ese día.
  // Aeronáutica es la excepción: se deja fija aunque ese día no haya
  // noticias, para que la sección nunca desaparezca del menú.
  const availableGroups = useMemo(
    () =>
      GROUP_IDS.filter(
        (group) =>
          group === "aeronautica" ||
          selectedBriefing.items.some((item) => item.group === group),
      ),
    [selectedBriefing],
  );

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setSelectedGroup("todas");
  }

  return (
    <div className="lg:grid lg:grid-cols-[140px_1fr] lg:gap-12">
      <DateNav
        days={navDays}
        selectedDate={selectedBriefing.date}
        onSelect={handleSelectDate}
      />

      <div>
        <CategoryTabs
          groups={availableGroups}
          selected={selectedGroup}
          onSelect={setSelectedGroup}
        />

        <DaySection
          briefing={selectedBriefing}
          isToday={selectedBriefing.date === mostRecentDate}
          groupFilter={selectedGroup}
        />
      </div>
    </div>
  );
}
