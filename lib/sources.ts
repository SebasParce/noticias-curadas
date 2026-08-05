// Fuentes a revisar en cada corrida del cron.
// `url` debe ser una URL real y estable: Claude solo puede usar web_fetch
// sobre URLs que ya aparecieron en el mensaje, así que estas se incluyen
// directamente en el prompt.
//
// IMPORTANTE: la API de Anthropic valida que los dominios de `allowed_domains`
// (web_fetch/web_search) sean accesibles para su crawler. Si un solo dominio
// de la lista está bloqueado (robots.txt), la corrida ENTERA falla con un
// 400, no solo esa fuente. Por eso NO están acá BBC, BBC Mundo, IGN, Marca
// ni Diario AS: los 4 dominios (bbc.com, ign.com, marca.com, as.com)
// bloquean el crawler de Anthropic. Si querés volver a probar alguno (o
// alguno deja de bloquear en el futuro), agregalo, redeployá y corré el
// cron a mano: si ese dominio sigue bloqueado, el error de la API te lo va
// a decir explícitamente.
export interface Source {
  name: string;
  url: string;
  language: "es" | "en";
  notes?: string;
}

export const SOURCES: Source[] = [
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/",
    language: "en",
    notes: "Tecnología, startups y AI.",
  },
  {
    name: "Xataka",
    url: "https://www.xataka.com/",
    language: "es",
    notes: "Tecnología y tendencias en español.",
  },
  {
    name: "Gizmodo en español",
    url: "https://es.gizmodo.com/",
    language: "es",
    notes: "Tecnología y notas curiosas.",
  },
  {
    name: "3DJuegos",
    url: "https://www.3djuegos.com/",
    language: "es",
    notes: "Videojuegos en español; usar solo si conecta con tecnología/tendencias.",
  },
  {
    name: "Bloomberg Línea",
    url: "https://www.bloomberglinea.com/actualidad/",
    language: "es",
    notes: "Economía y negocios en español.",
  },
  {
    name: "ESPN",
    url: "https://www.espn.com/soccer/",
    language: "en",
    notes: "Fútbol: usar SOLO noticias de Premier League y LaLiga (resultados, fichajes/traspasos).",
  },
  {
    name: "ESPN",
    url: "https://www.espn.com/nba/",
    language: "en",
    notes: "Baloncesto NBA: partidos, resultados, fichajes/traspasos.",
  },
];

export const TOPICS_OF_INTEREST = [
  "Tecnología",
  "Startups",
  "Inteligencia artificial",
  "Economía",
  "Política internacional",
  "Notas curiosas / historias humanas interesantes",
  "Fútbol de la Premier League y de LaLiga (España), incluyendo fichajes/traspasos",
  "Baloncesto de la NBA, incluyendo fichajes/traspasos",
];
