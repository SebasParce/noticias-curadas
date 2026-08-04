// Tipos compartidos del briefing de noticias curadas.

export const GROUP_IDS = ["tecnologia", "economia", "politica", "deportes"] as const;
export type GroupId = (typeof GROUP_IDS)[number];

// Las subcategorías son propias de cada grupo (no todos comparten el mismo
// set): tecnología/economía/política usan el trío editorial de siempre,
// deportes usa las dos disciplinas que le interesan a Sebas.
export const SUBCATEGORIES_BY_GROUP = {
  tecnologia: ["actualidad", "notas_curiosas", "tendencias"],
  economia: ["actualidad", "notas_curiosas", "tendencias"],
  politica: ["actualidad", "notas_curiosas", "tendencias"],
  deportes: ["futbol", "baloncesto"],
} as const;

export type SubcategoryId =
  (typeof SUBCATEGORIES_BY_GROUP)[GroupId][number];

export function isValidSubcategory(
  group: GroupId,
  subcategory: string,
): subcategory is SubcategoryId {
  return (SUBCATEGORIES_BY_GROUP[group] as readonly string[]).includes(
    subcategory,
  );
}

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
  deportes: "Deportes",
};

export const SUBCATEGORY_LABELS: Record<SubcategoryId, string> = {
  actualidad: "Actualidad",
  notas_curiosas: "Notas curiosas",
  tendencias: "Tendencias",
  futbol: "Fútbol",
  baloncesto: "Baloncesto",
};
