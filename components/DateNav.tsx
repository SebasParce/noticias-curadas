import { formatShortDayLabel } from "@/lib/date";

interface DateNavDay {
  date: string;
  itemCount: number;
}

interface DateNavProps {
  /** Ordenados de la fecha más vieja a la más reciente. */
  days: DateNavDay[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

// Menú de navegación por fecha: pills horizontales scrolleables en mobile,
// lista vertical fija ("sticky") a la izquierda en desktop. Es un componente
// "tonto" (recibe estado + callback por props): solo funciona porque su
// padre (BriefingBrowser) es un client component.
export function DateNav({ days, selectedDate, onSelect }: DateNavProps) {
  return (
    <nav
      aria-label="Navegación por fecha"
      className="mb-6 lg:sticky lg:top-8 lg:mb-0 lg:h-fit lg:self-start"
    >
      <p className="mb-3 hidden text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft lg:block">
        Días
      </p>
      <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:border-l lg:border-line lg:pb-0">
        {days.map(({ date, itemCount }) => {
          const isSelected = date === selectedDate;

          return (
            <li key={date} className="flex-none lg:flex-auto">
              <button
                type="button"
                onClick={() => onSelect(date)}
                title={`${itemCount} noticias`}
                aria-current={isSelected || undefined}
                className={
                  isSelected
                    ? "block w-full whitespace-nowrap rounded-full border border-ink bg-ink px-3 py-1.5 text-left text-xs font-semibold text-paper lg:-ml-px lg:rounded-none lg:border-0 lg:border-l-2 lg:border-ink lg:bg-transparent lg:px-3 lg:py-1 lg:text-sm lg:text-ink"
                    : "block w-full whitespace-nowrap rounded-full border border-line bg-white px-3 py-1.5 text-left text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink lg:-ml-px lg:rounded-none lg:border-0 lg:border-l-2 lg:border-transparent lg:bg-transparent lg:px-3 lg:py-1 lg:text-sm lg:hover:border-ink lg:hover:bg-transparent"
                }
              >
                {formatShortDayLabel(date)}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
