import { getTimezone } from "@/lib/date";

interface HeaderProps {
  displayDate: string;
  generatedAt: string;
  itemCount: number;
}

export function Header({ displayDate, generatedAt, itemCount }: HeaderProps) {
  const generatedLabel = new Intl.DateTimeFormat("es-ES", {
    timeZone: getTimezone(),
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(generatedAt));

  return (
    <header className="mb-8 border-b border-line pb-6 sm:mb-10 sm:pb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-soft sm:text-sm">
        Briefing diario
      </p>
      <h1 className="mt-2 font-serif text-3xl leading-tight text-ink sm:text-4xl md:text-5xl">
        {displayDate}
      </h1>
      <p className="mt-3 text-sm text-ink-soft">
        {itemCount} noticias curadas · actualizado a las {generatedLabel}
      </p>
    </header>
  );
}
