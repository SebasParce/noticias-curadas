// Fuentes a revisar en cada corrida del cron.
// `url` debe ser una URL real y estable: Claude solo puede usar web_fetch
// sobre URLs que ya aparecieron en el mensaje, así que estas se incluyen
// directamente en el prompt.

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
    name: "IGN",
    url: "https://www.ign.com/",
    language: "en",
    notes: "Videojuegos y entretenimiento; usar solo si conecta con tecnología/tendencias.",
  },
  {
    name: "3DJuegos",
    url: "https://www.3djuegos.com/",
    language: "es",
    notes: "Videojuegos en español; usar solo si conecta con tecnología/tendencias.",
  },
  {
    name: "BBC Mundo",
    url: "https://www.bbc.com/mundo",
    language: "es",
    notes: "Política internacional y economía en español.",
  },
  {
    name: "BBC",
    url: "https://www.bbc.com/",
    language: "en",
    notes: "Política internacional, economía y notas curiosas.",
  },
  {
    name: "Bloomberg Línea",
    url: "https://www.bloomberglinea.com/actualidad/",
    language: "es",
    notes: "Economía y negocios en español.",
  },
  {
    name: "Diario AS",
    url: "https://as.com/",
    language: "es",
    notes:
      "Deportes: usar SOLO fútbol de Premier League/LaLiga y baloncesto NBA (ignorar todo lo demás: motor, tenis, otras ligas, etc.).",
  },
  {
    name: "Marca",
    url: "https://www.marca.com/",
    language: "es",
    notes:
      "Deportes: fuerte en LaLiga y mercado de fichajes. Usar SOLO fútbol de Premier League/LaLiga y baloncesto NBA.",
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
