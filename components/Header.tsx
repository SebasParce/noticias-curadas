// Masthead del sitio: se muestra una sola vez, arriba de todo el scroll.
// La fecha de cada día vive en DaySection, no acá.
export function Header() {
  return (
    <div className="mb-12 sm:mb-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-soft sm:text-sm">
        Briefing
      </p>
      <h1 className="mt-2 font-serif text-2xl leading-tight text-ink sm:text-3xl">
        Tecnología, economía, política internacional y deportes
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Curado y sintetizado automáticamente con IA, un día a la vez.
      </p>
    </div>
  );
}
