import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { SOURCES, TOPICS_OF_INTEREST } from "./sources";
import {
  GROUP_IDS,
  SUBCATEGORIES_BY_GROUP,
  type GroupId,
  type NewsItem,
} from "./types";

// Modelo de Claude a usar para curar y sintetizar el briefing.
const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 12000;

const NewsItemSchema = z
  .object({
    title: z.string().min(1).max(200),
    summary: z.string().min(1).max(600),
    source: z.string().min(1).max(80),
    url: z.string().url(),
    group: z.enum(GROUP_IDS),
    subcategory: z.string().min(1).max(40),
  })
  .refine(
    (item) =>
      (SUBCATEGORIES_BY_GROUP[item.group] as readonly string[]).includes(
        item.subcategory,
      ),
    "subcategory inválida para ese group",
  );

const BriefingPayloadSchema = z.object({
  executiveSummary: z.array(z.string().min(1).max(400)).min(1).max(6),
  items: z.array(NewsItemSchema),
});

// El `.refine()` de arriba valida en runtime que `subcategory` sea válida
// para su `group`, pero zod no puede angostar el tipo de "string" a la unión
// literal `SubcategoryId` a partir de eso. Como ya lo garantizamos a mano,
// tipamos `items` con el `NewsItem` "de verdad" (lib/types.ts) en vez del
// tipo inferido por zod.
export interface BriefingPayload {
  executiveSummary: string[];
  items: NewsItem[];
}

function uniqueDomains(urls: string[]): string[] {
  const domains = new Set<string>();
  for (const raw of urls) {
    const hostname = new URL(raw).hostname;
    domains.add(hostname);
    if (hostname.startsWith("www.")) {
      domains.add(hostname.slice(4));
    }
  }
  return Array.from(domains);
}

function buildSystemPrompt(): string {
  const groupSubcategoryLines = (Object.keys(SUBCATEGORIES_BY_GROUP) as GroupId[])
    .map((group) => `  - ${group}: ${SUBCATEGORIES_BY_GROUP[group].join(" | ")}`)
    .join("\n");

  return `Sos el editor automático de "Briefing", un panel de noticias curadas en español.

Tu trabajo en cada corrida:
1. Visitar (con la herramienta web_fetch) la portada de cada una de las fuentes indicadas por el usuario.
2. Usar web_search, restringido a esos mismos dominios, como apoyo para confirmar datos o encontrar la URL directa de una nota puntual cuando la portada no la deja clara.
3. Quedarte solo con las noticias relevantes a los temas de interés indicados.
4. Escribir cada noticia relevante en español (traducila si la fuente está en inglés) como un título corto y una síntesis de 2 a 4 líneas (entre 30 y 70 palabras), con tono informativo y directo, sin clickbait.
5. Clasificar cada noticia en un grupo y una subcategoría, usando EXCLUSIVAMENTE estas combinaciones válidas (no inventes otras):
${groupSubcategoryLines}
6. Escribir un resumen ejecutivo de 3 a 4 bullets con lo más importante del día en su conjunto (puede incluir deportes si hubo algo relevante).

Reglas de clasificación:
- "Startups" e "Inteligencia artificial" NO son grupos propios: una noticia de startups o IA va dentro de "tecnologia" si el eje es el producto/la tecnología/la innovación, o dentro de "economia" si el eje es financiamiento, valuación, mercado, resultados de negocio o macroeconomía.
- "actualidad": hechos noticiosos del día o de las últimas 24-48 horas. Aplica solo a tecnologia/economia/politica.
- "tendencias": análisis, patrones o cambios de mediano plazo (no es una noticia puntual de hoy, sino "hacia dónde va" algo). Aplica solo a tecnologia/economia/politica.
- "notas_curiosas": historias curiosas, insólitas, human-interest o llamativas que no encajan como noticia dura pero valen la pena. Aplica solo a tecnologia/economia/politica.
- El grupo "deportes" es un caso aparte, con sus propias subcategorías y criterio de filtro MUY estricto:
  - "futbol": SOLO Premier League y LaLiga (España). Incluí resultados, posiciones, fichajes/traspasos y bajas/lesiones relevantes de esos clubes. NO incluyas Champions League, Europa League, selecciones nacionales, Serie A, Bundesliga, Ligue 1 ni ninguna otra liga o país.
  - "baloncesto": SOLO NBA. Incluí partidos, resultados, fichajes/traspasos y lesiones relevantes. NO incluyas Euroliga, ACB ni otras ligas de básquet.
  - Si una noticia de deportes no encaja exactamente en esos dos casos, no la incluyas: preferí quedarte corto antes que meter ruido de otras ligas o deportes.
- Para IGN y 3DJuegos: incluí solo notas donde el eje conecte con tecnología, industria, negocio o algo genuinamente curioso (no reseñas de videojuegos comunes ni notas de puro fandom).
- Si una fuente no tiene nada relevante a los temas de interés, no inventes nada: simplemente no incluyas noticias de esa fuente en esa corrida.
- No dupliques la misma noticia si aparece en más de una fuente; quedate con la cobertura más completa y mencioná esa fuente.
- El campo "url" debe ser la URL de la nota puntual (no la portada) cuando esté disponible; si de verdad no se puede obtener, usá la URL de portada de esa fuente.
- El campo "source" debe ser exactamente el nombre de fuente que te pasó el usuario (ej. "TechCrunch", "BBC Mundo", "ESPN").

Formato de salida (muy importante):
- No agregues comentarios, saludos ni explicaciones fuera del JSON.
- Antes del JSON podés razonar brevemente y hacer las llamadas a las herramientas, pero el turno debe terminar SIEMPRE con un único bloque de código \`\`\`json que contenga un objeto JSON válido y nada más después de ese bloque.
- El JSON debe tener exactamente esta forma:

\`\`\`json
{
  "executiveSummary": ["string", "string", "string"],
  "items": [
    {
      "title": "string en español",
      "summary": "string en español, 2-4 líneas",
      "source": "string",
      "url": "string (URL válida)",
      "group": "tecnologia | economia | politica | deportes",
      "subcategory": "ver combinaciones válidas de arriba, según el group"
    }
  ]
}
\`\`\`

Apuntá a un total razonable de notas por corrida (aproximadamente entre 15 y 35 en total, según cuánto material relevante haya), priorizando calidad y relevancia por sobre cantidad.`;
}

function buildUserPrompt(nowLabel: string): string {
  const sourceLines = SOURCES.map((s) => {
    const lang = s.language === "en" ? "inglés" : "español";
    const notes = s.notes ? ` — ${s.notes}` : "";
    return `- ${s.name} (${lang}): ${s.url}${notes}`;
  }).join("\n");

  const topics = TOPICS_OF_INTEREST.join(", ");

  return `Hoy es ${nowLabel}. Armá el briefing del día con estas fuentes:

${sourceLines}

Temas de interés (filtrá solo lo que conecte con esto): ${topics}.

Visitá cada fuente con web_fetch para ver qué hay de nuevo hoy. Usá web_search (limitado a estos mismos dominios) si necesitás encontrar la URL directa de una nota o confirmar un dato. Priorizá contenido de las últimas 24-48 horas.

Devolvé el resultado siguiendo exactamente el formato JSON indicado en las instrucciones del sistema.`;
}

function extractJsonBlock(text: string): string {
  const fencedJson = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedJson) return fencedJson[1].trim();

  const fencedAny = text.match(/```\s*([\s\S]*?)```/);
  if (fencedAny) return fencedAny[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  throw new Error("No se encontró un bloque JSON en la respuesta de Claude.");
}

/**
 * Llama a la API de Anthropic con web_fetch + web_search para investigar
 * las fuentes configuradas, y devuelve el payload ya validado
 * (resumen ejecutivo + noticias clasificadas).
 */
export async function generateBriefingPayload(
  nowLabel: string,
): Promise<BriefingPayload> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Falta la variable de entorno ANTHROPIC_API_KEY.");
  }

  const client = new Anthropic({ apiKey });
  const allowedDomains = uniqueDomains(SOURCES.map((s) => s.url));

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserPrompt(nowLabel) }],
    tools: [
      {
        type: "web_fetch_20250910",
        name: "web_fetch",
        max_uses: 24,
        allowed_domains: allowedDomains,
        max_content_tokens: 8000,
      },
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 14,
        allowed_domains: allowedDomains,
      },
    ],
  });

  const fullText = response.content
    .filter(
      (block): block is Anthropic.TextBlock =>
        block.type === "text" && typeof block.text === "string",
    )
    .map((block) => block.text)
    .join("\n");

  if (!fullText.trim()) {
    throw new Error(
      `Claude no devolvió texto. stop_reason=${response.stop_reason}`,
    );
  }

  const jsonString = extractJsonBlock(fullText);
  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(jsonString);
  } catch (err) {
    throw new Error(
      `No se pudo parsear el JSON devuelto por Claude: ${(err as Error).message}`,
    );
  }

  const parsed = BriefingPayloadSchema.parse(parsedRaw);
  return {
    executiveSummary: parsed.executiveSummary,
    items: parsed.items as NewsItem[],
  };
}
