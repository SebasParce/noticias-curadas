// Todas las fechas del briefing se calculan en un único huso horario,
// configurable con la variable de entorno BRIEFING_TIMEZONE (default: UTC).
// Ver README para instrucciones de cómo ajustarlo a tu zona horaria real.

export function getTimezone(): string {
  return process.env.BRIEFING_TIMEZONE?.trim() || "UTC";
}

/** YYYY-MM-DD en el huso horario configurado. Sirve como clave/orden del día. */
export function formatDateKey(date: Date, timeZone = getTimezone()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Fecha larga en español, ej. "martes 4 de agosto de 2026". */
export function formatDisplayDate(
  date: Date,
  timeZone = getTimezone(),
): string {
  const formatted = new Intl.DateTimeFormat("es-ES", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
