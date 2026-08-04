interface ExecutiveSummaryProps {
  bullets: string[];
}

export function ExecutiveSummary({ bullets }: ExecutiveSummaryProps) {
  if (bullets.length === 0) return null;

  return (
    <section className="mb-10 rounded-2xl border border-line bg-white/70 p-6 sm:mb-14 sm:p-8">
      <h2 className="mb-4 font-serif text-xl text-ink sm:text-2xl">
        Lo esencial de hoy
      </h2>
      <ul className="space-y-3">
        {bullets.map((bullet, i) => (
          <li
            key={i}
            className="flex gap-3 text-[15px] leading-relaxed text-ink sm:text-base"
          >
            <span
              className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-ink"
              aria-hidden
            />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
