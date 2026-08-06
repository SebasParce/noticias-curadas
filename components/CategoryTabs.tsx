import type { GroupId } from "@/lib/types";
import { GROUP_LABELS } from "@/lib/types";

export type GroupFilter = GroupId | "todas";

interface CategoryTabsProps {
  /** Grupos que efectivamente tienen noticias ese día. */
  groups: GroupId[];
  selected: GroupFilter;
  onSelect: (group: GroupFilter) => void;
}

// Tabs de categoría, arriba del contenido del día. Es un componente "tonto"
// (recibe estado + callback por props): solo funciona porque su padre
// (BriefingBrowser) es un client component.
export function CategoryTabs({ groups, selected, onSelect }: CategoryTabsProps) {
  if (groups.length === 0) return null;

  const options: GroupFilter[] = ["todas", ...groups];

  return (
    <div
      role="tablist"
      aria-label="Filtrar por categoría"
      className="mb-8 flex flex-wrap gap-2 border-b border-line pb-5"
    >
      {options.map((option) => {
        const isSelected = option === selected;
        const label = option === "todas" ? "Todas" : GROUP_LABELS[option];

        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(option)}
            className={
              isSelected
                ? "rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-paper"
                : "rounded-full border border-line px-3.5 py-1.5 text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink"
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
