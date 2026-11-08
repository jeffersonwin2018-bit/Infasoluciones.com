/**
 * Robert — asistente IA de INFA (Gemini).
 * - La API key vive SOLO en el servidor (variable GEMINI_API_KEY en Vercel).
 * - Conoce la web: servicios, obras, cobertura, preguntas frecuentes y textos editados en /admin.
 * - Tiene "funciones" que ejecuta el navegador: poner música, navegar, mostrar obras, abrir WhatsApp.
 */
import { SITE, SOCIALS, CLIENTES } from '@/config/site';
import { SERVICES, shortTitle } from '@/data/services';
import { COBERTURA, FAQS, PROCESO } from '@/data/content';
import { WORK_CATEGORIES } from '@/data/works';
import { getSettings, publicWorks } from './content';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
// Si un modelo está saturado (503/429/500) o no existe, se prueba el siguiente automáticamente.
const MODELS = [...new Set([process.env.GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-flash-lite-latest'].filter(Boolean) as string[])];
const RETRY = new Set([400, 404, 408, 429, 500, 502, 503, 504]);
// Modelos que fallaron hace poco se saltan 5 minutos (no perder segundos en uno saturado)
const cooldown = new Map<string, number>();
const models = () => { const now = Date.now(); const ok = MODELS.filter((m) => (cooldown.get(m) ?? 0) < now); return ok.length ? ok : MODELS; };
const markBad = (m: string) => cooldown.set(m, Date.now() + 5 * 60e3);
const key = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
export const robertReady = () => !!key();

export const NAV_TARGETS: Record<string, { label: string; href: string }> = {
  inicio: { label: 'Inicio', href: '/' },
  obras: { label: 'Galería de obras', href: '/proyectos' },
  servicios: { label: 'Servicios', href: '/servicios' },
  nosotros: { label: 'Nosotros', href: '/nosotros' },
  cobertura: { label: 'Cobertura', href: '/cobertura' },
  cotizar: { label: 'Cotizador', href: '/cotizar' },
  ...Object.fromEntries(SERVICES.map((s) => [`servicio:${s.slug}`, { label: shortTitle(s), href: `/servicios/${s.slug}` }])),
  ...Object.fromEntries(COBERTURA.map((c) => [`cobertura:${c.slug}`, { label: c.nombre, href: `/cobertura/${c.slug}` }])),
};

const TOOLS = [{
  functionDeclarations: [
    {
      name: 'play_music',
      description: 'Pone música en la web para el visitante. Úsala cuando pida una canción, artista, género o ambiente ("pon algo de jazz", "ponme Bad Bunny", "música para concentrarme"). Para la música propia de INFA usa query "ambiente INFA".',
      parameters: { type: 'OBJECT', properties: {
        query: { type: 'STRING', description: 'Qué buscar: "canción - artista", artista, género o ambiente. Ej.: "Blinding Lights - The Weeknd", "jazz lounge elegante".' },
      }, required: ['query'] },
    },
    {
      name: 'control_music',
      description: 'Controla la música que está sonando.',
      parameters: { type: 'OBJECT', properties: {
        action: { type: 'STRING', enum: ['pausar', 'reanudar', 'siguiente', 'detener', 'subir_volumen', 'bajar_volumen'] },
      }, required: ['action'] },
    },
    {
      name: 'navigate',
      description: 'Lleva al visitante a una página de la web.',
      parameters: { type: 'OBJECT', properties: {
        target: { type: 'STRING', enum: Object.keys(NAV_TARGETS) },
      }, required: ['target'] },
    },
    {
      name: 'show_works',
      description: 'Abre la galería de obras reales, opcionalmente filtrada por tipo.',
      parameters: { type: 'OBJECT', properties: {
        category: { type: 'STRING', enum: ['todas', ...Object.keys(WORK_CATEGORIES)] },
      } },
    },
    {
      name: 'open_whatsapp',
      description: 'Abre WhatsApp con INFA y un mensaje ya redactado. Úsala cuando el visitante quiera cotizar o hablar con una persona. Si faltan datos clave (qué necesita, medidas aproximadas, ciudad), pregúntalos ANTES en una sola pregunta corta.',
      parameters: { type: 'OBJECT', properties: {
        message: { type: 'STRING', description: 'Mensaje en primera persona del visitante, claro y ordenado, con lo que contó (tipo de trabajo, medidas, ciudad, plazo).' },
      }, required: ['message'] },
    },
  ],
}];

async function systemPrompt() {
  const [s, works] = await Promise.all([getSettings(), publicWorks()]);
  const byCat = Object.entries(WORK_CATEGORIES).map(([k, c]) => `${c.label}: ${works.filter((w) => w.category === k).length}`).join(', ');
  const recent = [...works].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12)
    .map((w) => `- ${w.title}${w.location ? ` (${w.location})` : ''}, ${w.date}`).join('\n');
  const faqs = FAQS.filter((f) => !f.a.includes('[COMPLETAR]')).map((f) => `P: ${f.q}\nR: ${f.a}`).join('\n');
  const today = new Date().toLocaleDateString('es-PE', { dateStyle: 'full', timeZone: 'America/Lima' });

  return `Eres Robert, el asistente virtual de ${SITE.brand} (${SITE.legalName}), en la web ${SITE.url}. Hoy es ${today}.
Personalidad: cálido, seguro, peruano neutro, profesional y con buen humor ligero. Hablas en español (o en el idioma del visitante).
Eres una IA general: puedes conversar de cualquier tema y ayudar con dudas generales, pero tu misión es que el visitante conozca INFA y, si tiene un proyecto, termine cotizando por WhatsApp.

ESTILO (la mayoría usa celular):
- Respuestas cortas: 1 a 4 frases. Usa listas con "- " solo si ayudan. Puedes usar **negritas**.
- No repitas saludos. No inventes datos.
- Cuando uses una función, igual escribe una frase breve diciendo lo que hiciste.

REGLAS:
- Nunca inventes precios, plazos, RUC, garantías ni direcciones. Para precios: "depende de medidas y materiales; te cotizamos gratis por WhatsApp" y ofrece abrir WhatsApp.
- Las fotos con la etiqueta "Obra real" son trabajos reales de INFA. Las que dicen "Imagen referencial" (y el módulo 3D que gira en la portada) son ilustrativas.
- Si piden música, usa play_music de inmediato (no preguntes). Si dicen "otra" o "siguiente", usa control_music siguiente.
- Si quieren ver trabajos, usa show_works. Si preguntan por un servicio o ciudad concreta, puedes usar navigate.
- Para cotizar: pregunta lo mínimo que falte y luego usa open_whatsapp con un mensaje bien redactado.

EMPRESA
- Qué hace: ${SITE.description}
- Lema: ${SITE.tagline}. Portada: "${s.hero.title} ${s.hero.highlight}" — ${s.hero.lead}
- Quiénes somos: ${s.intro.body}
- Historia: ${s.about.body}
- Cifras: ${s.stats.map((x) => `${x.value} ${x.label}`).join(' · ')}
- Tiendas donde han fabricado/instalado: ${CLIENTES.join(', ')}.
- Contacto: WhatsApp ${SITE.phoneDisplay}. Redes: ${SOCIALS.filter((x) => x.key !== 'whatsapp').map((x) => `${x.label} ${x.href}`).join(' · ')}.
- Panel interno /admin: solo para la familia y el equipo de INFA (suben fotos y editan la web).

SERVICIOS
${SERVICES.map((x) => `- ${shortTitle(x)}: ${x.short} Incluye: ${x.items.join(', ')}.`).join('\n')}

COBERTURA
${COBERTURA.map((c) => `- ${c.nombre}: ${c.foco}`).join('\n')}

PROCESO
${PROCESO.map((p) => `${p.n}. ${p.t}: ${p.d}`).join('\n')}

OBRAS EN LA GALERÍA (${works.length} fotos): ${byCat}
Más recientes:
${recent}

PREGUNTAS FRECUENTES
${faqs}

MÚSICA DE LA WEB: el botón "Sonido" pone la música ambiental de INFA. El visitante puede pedirte cualquier canción o estilo y la pones con play_music.`;
}

export interface ChatMsg { role: 'user' | 'model'; text: string }

/** Llama a Gemini en streaming. Prueba los modelos en orden si alguno no existe. */
export async function streamGemini(messages: ChatMsg[], signal?: AbortSignal) {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: await systemPrompt() }] },
    contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    tools: TOOLS,
    generationConfig: { temperature: 0.6, maxOutputTokens: 700 },
  });
  let last = '';
  for (const model of models()) {
    // Si el modelo no empieza a responder en 8 s, se corta y se prueba el siguiente.
    // (El límite solo cubre la espera inicial; la respuesta en streaming puede durar lo que necesite.)
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    signal?.addEventListener('abort', () => ctrl.abort(), { once: true });
    let r: Response;
    try {
      r = await fetch(`${API}/${model}:streamGenerateContent?alt=sse`, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key() },
        body,
      });
    } catch (e: any) { clearTimeout(timer); last = `${model}: ${e?.name ?? e}`; if (signal?.aborted) break; markBad(model); continue; }
    clearTimeout(timer);
    if (r.ok && r.body) return r.body;
    last = `${model}: ${r.status} ${(await r.text()).slice(0, 300)}`;
    console.warn('[Robert] modelo falló, probando el siguiente →', last.slice(0, 120));
    if (r.status === 429 || r.status >= 500) markBad(model);
    if (!RETRY.has(r.status)) break; // 401/403: clave inválida, no sirve probar otro
  }
  throw new Error(last);
}


/** Llama a Gemini (sin streaming) probando modelos; devuelve el JSON completo o null. */
async function gen(payload: object, ms: number, tag: string) {
  for (const model of models()) {
    try {
      const r = await fetch(`${API}/${model}:generateContent`, {
        method: 'POST', signal: AbortSignal.timeout(ms),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key() },
        body: JSON.stringify(payload),
      });
      if (r.ok) return await r.json();
      console.warn(`[Robert:${tag}] ${model} → ${r.status}`);
      if (r.status === 429 || r.status >= 500) markBad(model);
      if (!RETRY.has(r.status)) return null;
    } catch (e: any) { console.warn(`[Robert:${tag}] ${model} → ${e?.name}`); markBad(model); }
  }
  return null;
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ');

/**
 * Busca una canción para reproducir con YouTube. Dos vías en paralelo:
 *  1) Gemini + Google Search (resultados actuales)  2) memoria del modelo (rápido para canciones conocidas)
 * Cada candidato se valida con oEmbed de YouTube (existe y se puede insertar) y se prefiere el que coincide con lo pedido.
 */
export async function findSong(query: string): Promise<{ id: string; title: string; author: string } | null> {
  const ask = `Necesito videos de YouTube que se puedan reproducir para: "${query}".
Si es una canción o artista: el video oficial, el "official audio" o un lyric video oficial. Si es un género o ambiente: una mezcla/playlist larga en un solo video.
Responde SOLO con hasta 5 enlaces https://www.youtube.com/watch?v=ID (uno por línea), del más adecuado al menos.`;
  const [grounded, memory] = await Promise.all([
    gen({ contents: [{ role: 'user', parts: [{ text: ask }] }], tools: [{ google_search: {} }], generationConfig: { temperature: 0.2 } }, 15000, 'search'),
    gen({ contents: [{ role: 'user', parts: [{ text: ask + '\nUsa tu conocimiento: solo IDs reales que recuerdes con seguridad.' }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 400 } }, 8000, 'memory'),
  ]);
  const text = JSON.stringify([grounded, memory]);
  const ids = [...new Set([...text.matchAll(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/|\/vi\/)([A-Za-z0-9_-]{11})/g)].map((m) => m[1]))].slice(0, 10);
  console.info('[Robert:song]', JSON.stringify({ query, grounded: !!grounded, memory: !!memory, ids }));
  const checked = await Promise.all(ids.map(async (id) => {
    try {
      const o = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}`, { signal: AbortSignal.timeout(5000) });
      if (!o.ok) { console.warn('[Robert:oembed]', id, o.status); return null; }
      const d = await o.json();
      return { id, title: String(d.title), author: String(d.author_name) };
    } catch (e: any) { console.warn('[Robert:oembed]', id, e?.name); return null; }
  }));
  const ok = checked.filter(Boolean) as { id: string; title: string; author: string }[];
  if (!ok.length) return null;
  // Preferir el que más palabras comparte con lo pedido (evita reproducir algo equivocado)
  const words = norm(query).split(/\s+/).filter((w) => w.length > 2);
  const score = (v: { title: string; author: string }) => { const t = norm(v.title + ' ' + v.author); return words.filter((w) => t.includes(w)).length; };
  ok.sort((a, b) => score(b) - score(a));
  return ok[0];
}
