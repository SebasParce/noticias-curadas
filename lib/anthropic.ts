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
// Entre fetches, búsquedas y la narración de cada paso, el modelo puede
// gastar el presupuesto de output ANTES de llegar al JSON final (se vieron
// stop_reason=max_tokens con 12000 y con 16000). Subimos bastante más el
// techo y, sobre todo, acotamos con números concretos cuánto puede explorar
// (ver system prompt y max_uses de las tools más abajo).
const MAX_TOKENS = 24000;

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

Tu trabajo en cada corrida (con límites de uso de herramientas ESTRICTOS, ver más abajo):
1. Visitar (con la herramienta web_fetch) la portada de cada una de las fuentes indicadas por el usuario. Una sola vez cada una: 7 fetches en total, no repitas ninguna.
2. Usar web_search (sin restricción de dominio), como MÁXIMO 4 búsquedas en total en toda la corrida, repartidas así: 1-2 para política internacional, 1-2 para completar deportes (fichajes/resultados que no aparecieron en la portada de ESPN). No uses las 4 si con 2 ya tenés material suficiente.
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
- Para 3DJuegos: incluí solo notas donde el eje conecte con tecnología, industria, negocio o algo genuinamente curioso (no reseñas de videojuegos comunes ni notas de puro fandom).
- Para "politica" (no hay portada fija para este tema): con 1-2 búsquedas de web_search alcanza para encontrar varias noticias de medios internacionales serios (agencias, diarios de referencia). Evitá tabloides o fuentes de baja calidad, y evitá seguir buscando variantes de la misma búsqueda.
- Si una fuente de portada no tiene nada relevante a los temas de interés, no inventes nada: simplemente no incluyas noticias de esa fuente en esa corrida.
- No dupliques la misma noticia si aparece en más de una fuente; quedate con la cobertura más completa y mencioná esa fuente.
- El campo "url" debe ser la URL de la nota puntual (no la portada) cuando esté disponible; si de verdad no se puede obtener, usá la URL de portada de esa fuente.
- El campo "source" debe ser el nombre real de la fuente de esa noticia: para las fuentes de portada, exactamente el nombre que te pasó el usuario (ej. "TechCrunch", "ESPN"); para lo que encuentres vía web_search (sobre todo política), el nombre real del medio que la publicó (ej. "Reuters", "The Guardian", "DW").

Formato de salida (muy importante):
- No agregues comentarios, saludos ni explicaciones fuera del JSON.
- Sé MUY breve entre llamadas a herramientas: no narres cada fetch ni cada búsqueda con texto largo ("voy a revisar...", "ahora busco..."). Si necesitás decir algo, una frase corta alcanza; después andá directo a la siguiente acción. Tu presupuesto de tokens de salida es limitado y tiene que alcanzar para el JSON final con todas las noticias.
- No hagas más búsquedas/fetches de los necesarios: priorizá cubrir bien los temas por sobre agotar el máximo de usos disponible de cada herramienta.
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

Visitá cada fuente con web_fetch una sola vez (7 fetches en total). Usá como máximo 4 búsquedas de web_search en toda la corrida (no restringidas a estos dominios): 1-2 para política internacional y 1-2 para completar deportes. Priorizá contenido de las últimas 24-48 horas y sé eficiente con el presupuesto de tokens.

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
  // OJO: la API de Anthropic valida que TODOS los dominios de
  // `allowed_domains` sean accesibles a su crawler; si uno solo está
  // bloqueado (robots.txt), la corrida entera falla con 400. Por eso esta
  // restricción se aplica solo a web_fetch (con las fuentes ya filtradas en
  // lib/sources.ts) y NO a web_search, que queda sin restricción de dominio.
  const allowedDomains = uniqueDomains(SOURCES.map((s) => s.url));

  // Con max_tokens=24000 el SDK estima que la respuesta podría tardar más de
  // 10 minutos y exige streaming en vez de una llamada bloqueante
  // (client.messages.create) — ver
  // https://github.com/anthropics/anthropic-sdk-typescript#long-requests.
  // client.messages.stream() maneja el streaming solo y `finalMessage()` nos
  // da el mismo objeto Message de siempre.
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserPrompt(nowLabel) }],
    tools: [
      {
        type: "web_fetch_20250910",
        name: "web_fetch",
        // Exactamente las URLs configuradas (7), sin margen: el prompt le
        // pide una sola pasada por fuente.
        max_uses: SOURCES.length,
        allowed_domains: allowedDomains,
        max_content_tokens: 8000,
      },
      {
        type: "web_search_20250305",
        name: "web_search",
        // Tope técnico alineado al límite de 4 búsquedas del prompt: cada
        // búsqueda de más consume presupuesto de output que necesitamos
        // para el JSON final.
        max_uses: 4,
      },
    ],
  });

  const response = await stream.finalMessage();

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
