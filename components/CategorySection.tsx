import type { GroupId, NewsItem } from "@/lib/types";
import {
  GROUP_LABELS,
  SUBCATEGORIES_BY_GROUP,
  SUBCATEGORY_LABELS,
} from "@/lib/types";
import { NewsCard } from "./NewsCard";

const GROUP_BORDER: Record<GroupId, string> = {
  tecnologia: "border-tecnologia",
  economia: "border-economia",
  politica: "border-politica",
  deportes: "border-deportes",
  aeronautica: "border-aeronautica",
};

export function CategorySection({
  group,
  items,
}: {
  group: GroupId;
  items: NewsItem[];
}) {
  // Aeronáutica se muestra siempre, aunque ese día no haya noticias, para
  // que la categoría nunca desaparezca del menú. Las demás siguen
  // ocultándose por completo si no tienen nada (así las mantiene DaySection
  // cuando el filtro es "todas").
  if (items.length === 0 && group !== "aeronautica") return null;

  const subcategories = SUBCATEGORIES_BY_GROUP[group];

  return (
    <section className="mb-12 sm:mb-16">
      <h2
        className={`border-l-4 pl-4 font-serif text-2xl text-ink sm:text-3xl ${GROUP_BORDER[group]}`}
      >
        {GROUP_LABELS[group]}
      </h2>

      {items.length === 0 ? (
        <p className="mt-6 pl-4 text-sm text-ink-soft">
          Sin noticias de {GROUP_LABELS[group]} en esta corrida.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {subcategories.map((subcategory) => {
            const subItems = items.filter(
              (item) => item.subcategory === subcategory,
            );
            if (subItems.length === 0) return null;

            return (
              <div key={subcategory}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft">
                  {SUBCATEGORY_LABELS[subcategory]}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {subItems.map((item, i) => (
                    <NewsCard key={`${item.url}-${i}`} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
