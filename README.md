# Briefing — Noticias curadas

Dashboard tipo "morning briefing": un cron diario usa Claude (con `web_fetch` +
`web_search`) para leer TechCrunch, Xataka, Gizmodo en español, IGN, 3DJuegos,
BBC, BBC Mundo y Bloomberg Línea, filtrar lo relevante a tecnología/startups/AI,
economía y política internacional, sintetizarlo en español y clasificarlo. El
resultado se guarda como un JSON en Vercel Blob y la página pública solo lo lee.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- `@anthropic-ai/sdk` (Claude, modelo `claude-sonnet-5`, tools `web_fetch` +
  `web_search`)
- `@vercel/blob` para persistir el último resultado (sin base de datos)
- Vercel Cron Jobs para disparar la generación 1 vez por día

## Estructura del proyecto

```
app/
  api/cron/route.ts    → endpoint que genera y guarda el briefing (llamado por el cron)
  page.tsx             → dashboard público, lee el último briefing guardado
  layout.tsx, globals.css
components/
  Header.tsx, ExecutiveSummary.tsx, CategorySection.tsx, NewsCard.tsx
lib/
  types.ts             → tipos del briefing (grupos, subcategorías, noticia)
  sources.ts           → lista de fuentes + temas de interés (editable)
  anthropic.ts         → prompt + llamada a la API de Claude + validación (zod)
  blob.ts              → guardar/leer el JSON en Vercel Blob
  date.ts              → helpers de fecha/zona horaria
vercel.json             → configuración del cron
.env.example
```

## Cómo funciona

1. **Vercel Cron Job** llama por `GET` a `/api/cron` una vez por día, con el
   header `Authorization: Bearer <CRON_SECRET>` que Vercel agrega solo.
2. La ruta valida ese secreto y llama a `generateBriefingPayload()`
   (`lib/anthropic.ts`), que le da a Claude las 8 URLs de fuentes y dos tools:
   - `web_fetch`: para leer el contenido real de cada portada.
   - `web_search` (restringido a esos mismos dominios): de apoyo, para
     encontrar la URL directa de una nota puntual.
   Claude devuelve un único bloque JSON con el resumen ejecutivo y las
   noticias ya traducidas/sintetizadas (2-4 líneas, en español) y clasificadas
   en grupo (`tecnologia` / `economia` / `politica`) + subcategoría
   (`actualidad` / `notas_curiosas` / `tendencias`).
3. Ese JSON se valida con `zod` y se guarda con `@vercel/blob` en
   `briefing/latest.json` (mismo path siempre, se sobreescribe cada corrida).
4. `app/page.tsx` (Server Component) lee ese blob y renderiza el dashboard.
   Se revalida cada 5 minutos (`revalidate = 300`) — no hay que regenerar nada
   en cada visita.

### ¿Por qué Vercel Blob y no una base de datos?

Es un solo objeto JSON que se sobreescribe una vez al día: no hace falta
Postgres/Redis. `@vercel/blob` da un `put()`/`list()` simple, se activa desde
el dashboard de Vercel en un clic y el plan gratuito alcanza de sobra para
este uso.

## Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sí | API key de Claude. Se genera en [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys). |
| `CRON_SECRET` | Sí | String random que vos elegís (ej. `openssl rand -hex 32`). Protege `/api/cron` para que solo Vercel pueda dispararlo. |
| `BLOB_READ_WRITE_TOKEN` | Automática | La crea Vercel solo al conectar un Blob Store al proyecto. No la cargues a mano en producción. |
| `BRIEFING_TIMEZONE` | Opcional (default `UTC`) | Zona horaria usada para la fecha mostrada y el corte de "hoy". Ej: `America/Argentina/Buenos_Aires`, `America/Mexico_City`, `Europe/Madrid`. |

Copiá `.env.example` a `.env.local` para desarrollo local.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completá ANTHROPIC_API_KEY, CRON_SECRET, BRIEFING_TIMEZONE
npm run dev
```

La home va a mostrar "Todavía no hay un briefing generado" hasta que corras el
endpoint del cron una vez. Para local necesitás además un `BLOB_READ_WRITE_TOKEN`
real (lo conseguís creando el Blob Store en Vercel y copiando el token, ver
abajo) o probar `generateBriefingPayload()` por separado.

Para disparar la generación a mano (local o en producción) una vez que
`CRON_SECRET` está configurado:

```bash
curl -X GET "https://TU-DOMINIO/api/cron" \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

## Deploy en Vercel

1. **Subí el repo a GitHub** (o GitLab/Bitbucket).
2. En [vercel.com/new](https://vercel.com/new), importá el repositorio.
   Vercel detecta Next.js automáticamente, no hace falta tocar el build
   command.
3. **Antes de dar deploy** (o después, desde Settings), cargá las variables de
   entorno del proyecto (Settings → Environment Variables):
   - `ANTHROPIC_API_KEY`
   - `CRON_SECRET`
   - `BRIEFING_TIMEZONE` (opcional, recomendado)
4. **Creá el Blob Store**: en el proyecto ya importado, andá a la pestaña
   **Storage** → **Create Database** → **Blob** → conectalo a este proyecto.
   Vercel agrega `BLOB_READ_WRITE_TOKEN` solo, no hace falta copiarlo.
5. Hacé (o re-hacé) el **deploy**.
6. El cron ya queda registrado por `vercel.json` (Settings → Cron Jobs lo
   debería mostrar). Por defecto corre a las **09:00 UTC** todos los días —
   ajustá el `schedule` según tu zona horaria (ver abajo).
7. **Probalo a mano** una vez, para no esperar hasta mañana:
   ```bash
   curl -X GET "https://tu-proyecto.vercel.app/api/cron" \
     -H "Authorization: Bearer EL_MISMO_CRON_SECRET"
   ```
   Si devuelve `{"ok":true,...}`, entrá a la home: ya debería mostrar el
   briefing.

### Ajustar el horario del cron a tu zona horaria

`vercel.json` usa cron en **UTC**. Ejemplos para que corra ~9am hora local:

| Zona horaria | Hora local | `schedule` (UTC) |
|---|---|---|
| Argentina / Chile / Uruguay (UTC-3) | 09:00 | `0 12 * * *` |
| México / CDMX (UTC-6) | 09:00 | `0 15 * * *` |
| España peninsular, horario verano (UTC+2) | 09:00 | `0 7 * * *` |

Cambiá `BRIEFING_TIMEZONE` al mismo huso para que la fecha/hora mostradas en
el header coincidan.

> En el plan **Hobby**, los cron jobs de Vercel están limitados a **una
> corrida por día** por proyecto — coincide justo con lo que necesitamos acá.

## Personalización

- **Fuentes**: editá `lib/sources.ts` (nombre, URL, idioma, notas de qué
  buscar en esa fuente).
- **Temas de interés / criterios de clasificación**: editá
  `TOPICS_OF_INTEREST` en `lib/sources.ts` y las reglas en
  `buildSystemPrompt()` dentro de `lib/anthropic.ts`.
- **Grupos y subcategorías**: `lib/types.ts` (`GROUP_IDS`, `SUBCATEGORY_IDS`,
  labels). Si agregás/sacás alguno, actualizá también el prompt en
  `lib/anthropic.ts`.
- **Modelo / cantidad de búsquedas**: constantes `MODEL`, `MAX_TOKENS` y los
  `max_uses` de las tools en `lib/anthropic.ts`.
- **Colores y tipografía**: tokens en `app/globals.css` (`@theme`) — está
  usando Newsreader (serif, para títulos) + Inter (sans, para el resto).

## Costos aproximados (Anthropic)

- `web_search`: **US$10 cada 1.000 búsquedas**, más tokens estándar. Con
  `max_uses: 10` por corrida, como mucho son 10 búsquedas/día ≈ centavos/mes.
- `web_fetch`: **sin costo adicional**, solo tokens estándar del contenido
  traído (con `max_content_tokens: 8000` por fetch para no dispararse).
- Con 8 fuentes + razonamiento + JSON de salida, una corrida diaria con
  `claude-sonnet-5` debería costar centavos de dólar por día. Revisá el
  consumo real en [console.anthropic.com](https://console.anthropic.com).

## Troubleshooting

- **La home dice "Todavía no hay un briefing generado"**: el cron todavía no
  corrió o falló. Disparalo a mano con el `curl` de arriba y mirá la
  respuesta/logs (Vercel → tu proyecto → pestaña **Logs** o **Functions**).
- **401 al llamar `/api/cron`**: el header `Authorization` no coincide con
  `CRON_SECRET`. Si estás probando en Vercel, confirmá que cargaste la env var
  en el ambiente correcto (Production/Preview).
- **Error "No se encontró un bloque JSON..."**: Claude no devolvió el JSON en
  el formato esperado (raro, pero puede pasar). Reintentá; si persiste, revisá
  los logs para ver la respuesta cruda y ajustá el prompt en
  `lib/anthropic.ts`.
- **Timeout en el cron**: `maxDuration` está en 120s (bien dentro del límite
  de 300s de Hobby/Pro con Fluid Compute). Si necesitás más margen, subilo en
  `app/api/cron/route.ts`.
