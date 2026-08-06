import type { GroupId, NewsItem } from "@/lib/types";
import { SUBCATEGORY_LABELS } from "@/lib/types";

const GROUP_STYLES: Record<GroupId, { text: string; bg: string }> = {
  tecnologia: { text: "text-tecnologia", bg: "bg-tecnologia-soft" },
  economia: { text: "text-economia", bg: "bg-economia-soft" },
  politica: { text: "text-politica", bg: "bg-politica-soft" },
  deportes: { text: "text-deportes", bg: "bg-deportes-soft" },
  aeronautica: { text: "text-aeronautica", bg: "bg-aeronautica-soft" },
};

export function NewsCard({ item }: { item: NewsItem }) {
  const style = GROUP_STYLES[item.group];

  return (
    <article className="group flex h-full flex-col gap-3 rounded-xl border border-line bg-white p-5 transition-shadow hover:shadow-md">
      <span
        className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${style.bg} ${style.text}`}
      >
        {SUBCATEGORY_LABELS[item.subcategory]}
      </span>

      <h3 className="font-serif text-lg leading-snug text-ink">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          {item.title}
        </a>
      </h3>

      <p className="flex-1 text-sm leading-relaxed text-ink-soft">
        {item.summary}
      </p>

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-ink-soft transition-colors group-hover:text-ink"
      >
        {item.source}
        <span aria-hidden>↗</span>
      </a>
    </article>
  );
}
