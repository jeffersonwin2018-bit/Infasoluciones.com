/**
 * Herramientas de Robert que NO gastan cuota de Gemini:
 *  - findSong: búsqueda directa en YouTube + validación (rápida y fiable).
 *  - shortcut: atajos instantáneos ("pon X", "pausa", "siguiente"…).
 *  - offlineAnswer: respuestas útiles si Gemini está saturado o sin cuota.
 */
import { SITE } from '@/config/site';
import { SERVICES, shortTitle } from '@/data/services';
import { COBERTURA } from '@/data/content';
import { gen, key } from './robert';

export type Song = { id: string; title: string; author: string };
export type Shortcut = { text: string; action?: { name: string; args: any }; song?: string };

async function oembed(id: string): Promise<Song | null> {
  try {
    const o = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}`, { signal: AbortSignal.timeout(4000) });
    if (!o.ok) return null; // no existe o no permite insertarse en otras webs
    const d = await o.json();
    return { id, title: String(d.title), author: String(d.author_name) };
  } catch { return null; }
}

async function youtubeSearch(query: string): Promise<string[]> {
  try {
    const r = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D&hl=es`, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
        'Accept-Language': 'es-PE,es;q=0.9,en;q=0.8',
        Cookie: 'CONSENT=YES+1; SOCS=CAI',
      },
    });
    if (!r.ok) { console.warn('[Robert:yt] search', r.status); return []; }
    const html = await r.text();
    const ids = [...html.matchAll(/"videoRenderer":\{"videoId":"([A-Za-z0-9_-]{11})"/g)].map((m) => m[1]);
    return [...new Set(ids)].slice(0, 6);
  } catch (e: any) { console.warn('[Robert:yt] search', e?.name); return []; }
}

/** Busca una canción, artista o estilo y devuelve un video que se puede reproducir dentro de la web. */
export async function findSong(query: string): Promise<Song | null> {
  let ids = await youtubeSearch(query);
  if (!ids.length && key()) {
    // Respaldo: pedir enlaces a Gemini (todos se validan; los inventados se descartan)
    const j = await gen({ contents: [{ role: 'user', parts: [{ text: `Da hasta 5 enlaces https://www.youtube.com/watch?v=ID reales del video oficial de: "${query}". Solo enlaces.` }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 300 } }, 7000, 'song');
    ids = [...new Set([...JSON.stringify(j ?? '').matchAll(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/g)].map((m) => m[1]))];
  }
  const checked = await Promise.all(ids.slice(0, 5).map(oembed));
  const song = checked.find(Boolean) ?? null; // respeta el orden de relevancia de YouTube
  console.info('[Robert:song]', JSON.stringify({ query, ids: ids.length, ok: song?.id ?? null }));
  return song;
}

const strip = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!.,]/g, ' ').replace(/\s+/g, ' ').trim();

/** Atajos instantáneos, sin IA. */
export function shortcut(raw: string): Shortcut | null {
  const t = strip(raw).replace(/^(oye |hola |robert,? |robert |por favor |porfa )+/, '');
  if (t.split(' ').length <= 5) {
    if (/^(pausa|pausar|pausala|pon pausa|para|parala|para la musica|deten la musica|detener)$/.test(t)) return { text: '⏸ Pausé la música.', action: { name: 'control_music', args: { action: 'pausar' } } };
    if (/^(quita la musica|apaga la musica|sin musica|stop|silencio)$/.test(t)) return { text: '🔇 Listo, apagué la música.', action: { name: 'control_music', args: { action: 'detener' } } };
    if (/^(sigue|reanuda|continua|play|dale play)$/.test(t)) return { text: '▶ Seguimos.', action: { name: 'control_music', args: { action: 'reanudar' } } };
    if (/^(sube|sube el volumen|mas volumen|mas fuerte)$/.test(t)) return { text: '🔊 Subí el volumen.', action: { name: 'control_music', args: { action: 'subir_volumen' } } };
    if (/^(baja|baja el volumen|menos volumen|mas bajo|mas suave)$/.test(t)) return { text: '🔉 Bajé el volumen.', action: { name: 'control_music', args: { action: 'bajar_volumen' } } };
    if (/^(siguiente|la siguiente|cambia|cambiala|otra cancion)$/.test(t)) return { text: '⏭ Cambiando…', action: { name: 'control_music', args: { action: 'siguiente' } } };
  }
  const m = t.match(/^(?:pon(?:me|nos|ga|e)?|reproduce|reproduceme|toca|tocame|quiero (?:escuchar|oir)|me pones|puedes poner|podrias poner|play)\s+(.+)$/);
  if (m) {
    const q = m[1].replace(/^(la cancion|el tema|la musica de|musica de|canciones de|algo de|un poco de|una cancion de|el video de)\s+/, '').trim();
    if (/^(musica|la musica|algo|musica ambiental|ambiente)$/.test(q) || /infa/.test(q)) return { text: '🎵 Puse la música ambiental de INFA.', action: { name: 'play_ambient', args: {} } };
    if (q.length >= 2) return { text: '', song: q };
  }
  return null;
}

/** Respaldo sin IA: si Gemini está saturado o sin cuota, Robert igual responde algo útil. */
export function offlineAnswer(raw: string): Shortcut {
  const t = strip(raw);
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  const KW: Record<string, string[]> = {
    'modulos-de-exhibicion': ['exhibicion', 'modulo', 'gondola', 'retail', 'isla', 'vitrina', 'exhibidor'],
    'instalaciones-comerciales': ['local', 'stand', 'implementa', 'drywall', 'remodel'],
    'mobiliario-melamina': ['melamina', 'cocina', 'closet', 'ropero', 'repostero', 'mueble', 'escritorio'],
    'carpinteria-arquitectonica': ['puerta', 'madera', 'marco', 'jamba'],
    'estructuras-metalicas': ['estructura', 'nave', 'mezzanine', 'almacen'],
    'coberturas-aluzinc': ['techo', 'aluzinc', 'cobertura', 'policarbonato', 'calamina'],
    'portones-metalicos': ['porton', 'reja', 'cochera'],
    'escaleras-metalicas': ['escalera', 'baranda', 'pasamano'],
    'mantenimiento-b2b': ['mantenimiento', 'reparacion', 'arreglo', 'retoque'],
  };
  const svc = SERVICES.find((s) => (KW[s.slug] ?? []).some((w) => t.includes(w)));
  if (has('precio', 'cuanto cuesta', 'cuanto sale', 'costo', 'cotiza', 'presupuesto')) {
    return { text: `Los precios dependen de medidas y materiales, por eso te preparamos una **cotización formal gratis**. Cuéntame qué necesitas${svc ? ` (${shortTitle(svc).toLowerCase()})` : ''}, medidas aproximadas y tu ciudad, o escríbenos directo por WhatsApp al ${SITE.phoneDisplay}.` };
  }
  if (svc) return { text: `Sí, hacemos **${shortTitle(svc).toLowerCase()}**: ${svc.short}\nMás detalles: ${SITE.url}/servicios/${svc.slug}\n¿Te ayudo a cotizar?` };
  if (has('obra', 'trabajo', 'foto', 'galeria', 'proyecto', 'ejemplo')) return { text: 'Aquí tienes nuestras **obras reales** 👇', action: { name: 'show_works', args: { category: 'todas' } } };
  if (has('donde', 'ciudad', 'arequipa', 'lima', 'provincia', 'cobertura', 'trabajan en', 'llegan')) return { text: `Trabajamos en ${COBERTURA.map((c) => c.nombre).join(', ')} y en todo el Perú. Fabricamos en nuestro taller e instalamos con nuestro equipo.` };
  if (has('factura', 'ruc', 'boleta')) return { text: 'Sí, emitimos **factura electrónica** para empresas y boleta para clientes residenciales.' };
  if (has('telefono', 'numero', 'whatsapp', 'contacto', 'llamar', 'correo')) return { text: `Escríbenos o llámanos al **${SITE.phoneDisplay}** (WhatsApp). También estamos en Facebook, Instagram y TikTok.` };
  if (has('que hacen', 'quienes son', 'a que se dedican', 'servicios', 'que ofrecen')) return { text: `En INFA diseñamos, fabricamos e instalamos **módulos de exhibición para tiendas, muebles a medida, carpintería y estructuras metálicas**, en Lima, Arequipa y todo el Perú. ¿Qué proyecto tienes en mente?` };
  if (has('hola', 'buenas', 'buenos dias', 'que tal')) return { text: '¡Hola! 👋 ¿En qué te ayudo? Puedo mostrarte obras, contarte nuestros servicios, ayudarte a cotizar o poner música.' };
  return { text: `Ahora mismo tengo mucha demanda y no pude procesar bien tu pregunta 😅. Puedo ayudarte con **servicios, obras, cotizaciones o música**. Si es urgente, escríbenos por WhatsApp al ${SITE.phoneDisplay}.` };
}
