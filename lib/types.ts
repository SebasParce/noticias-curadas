// Tipos compartidos del briefing de noticias curadas.

export const GROUP_IDS = ["tecnologia", "economia", "politica"] as const;
export type GroupId = (typeof GROUP_IDS)[number];

export const SUBCATEGORY_IDS = [
  "actualidad",
  "notas_curiosas",
  "tendencias",
] as const;
export type SubcategoryId = (typeof SUBCATEGORY_IDS)[number];

export interface NewsItem {
  /** Título de la noticia, en español, reescrito por Claude (no copiado literal). */
  title: string;
  /** Síntesis de 2 a 4 líneas en español. */
  summary: string;
  /** Nombre legible de la fuente, p. ej. "TechCrunch". */
  source: string;
  /** URL original de la noticia (idealmente el artículo puntual, no la home). */
  url: string;
  group: GroupId;
  subcategory: SubcategoryId;
}

export interface Briefing {
  /** Fecha del briefing en formato YYYY-MM-DD (huso horario configurado en el server). */
  date: string;
  /** Fecha/hora legible para mostrar en el header, p. ej. "martes 4 de agosto de 2026". */
  displayDate: string;
  /** Timestamp ISO de cuándo se generó. */
  generatedAt: string;
  /** 3-4 bullets con el resumen ejecutivo del día. */
  executiveSummary: string[];
  items: NewsItem[];
}

export const GROUP_LABELS: Record<GroupId, string> = {
  tecnologia: "Tecnología",
  economia: "Economía",
  politica: "Política internacional",
};

export const SUBCATEGORY_LABELS: Record<SubcategoryId, string> = {
  actualidad: "Actualidad",
  notas_curiosas: "Notas curiosas",
  tendencias: "Tendencias",
};
