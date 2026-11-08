/**
 * Chat de Robert. Respuesta en streaming (una línea JSON por evento):
 *   {t:'text', d}   trozo de texto
 *   {t:'status', d} "Buscando canción…"
 *   {t:'action', name, args}  función que ejecuta el navegador
 *   {t:'done'} | {t:'error', d}
 */
import type { APIRoute } from 'astro';
import { robertReady, streamGemini, NAV_TARGETS, type ChatMsg } from '@/lib/server/robert';
import { findSong, offlineAnswer, shortcut } from '@/lib/server/robert-tools';

export const prerender = false;

// Freno simple anti-abuso por IP (por instancia): 25 mensajes cada 10 minutos.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60e3);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 25;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return new Response('Origen no permitido', { status: 403 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress || 'x';
  if (limited(ip)) return Response.json({ error: 'Has enviado muchos mensajes seguidos. Espera unos minutos 🙏' }, { status: 429 });

  let messages: ChatMsg[] = [];
  try {
    const b = await request.json();
    messages = (Array.isArray(b.messages) ? b.messages : [])
      .filter((m: any) => (m.role === 'user' || m.role === 'model') && typeof m.text === 'string' && m.text.trim())
      .slice(-14)
      .map((m: any) => ({ role: m.role, text: m.text.slice(0, 1500) }));
  } catch { /* cuerpo inválido */ }
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length || messages.at(-1)!.role !== 'user') return Response.json({ error: 'Mensaje vacío' }, { status: 400 });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (o: object) => ctrl.enqueue(enc.encode(JSON.stringify(o) + '\n'));
      let wrote = false;
      const calls: { name: string; args: any }[] = [];
      const last = messages.at(-1)!.text;
      const playSong = async (q: string) => {
        send({ t: 'status', d: `Buscando "${q}"…` });
        const song = await findSong(q);
        const sep = wrote ? '\n\n' : '';
        if (song) { send({ t: 'action', name: 'play_youtube', args: song }); send({ t: 'text', d: `${sep}🎵 Sonando: **${song.title}**` }); }
        else send({ t: 'text', d: `${sep}No encontré "${q}" para reproducir aquí 😕. ¿Probamos con otra canción o artista?` });
        wrote = true;
      };

      // 1) Atajos instantáneos sin IA: "pon X", "pausa", "siguiente"…
      const sc = shortcut(last);
      if (sc) {
        if (sc.text) { wrote = true; send({ t: 'text', d: sc.text }); }
        if (sc.action) send({ t: 'action', ...sc.action });
        if (sc.song) await playSong(sc.song);
        send({ t: 'done' }); ctrl.close(); return;
      }

      try {
        if (!robertReady()) throw new Error('sin clave');
        const body = await streamGemini(messages, request.signal);
        const reader = body.pipeThrough(new TextDecoderStream()).getReader();
        let buf = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += value;
          let i;
          while ((i = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, i).trim();
            buf = buf.slice(i + 1);
            if (!line.startsWith('data:')) continue;
            let j: any;
            try { j = JSON.parse(line.slice(5)); } catch { continue; }
            for (const p of j.candidates?.[0]?.content?.parts ?? []) {
              if (p.thought) continue;
              if (p.text) { wrote = true; send({ t: 'text', d: p.text }); }
              if (p.functionCall) calls.push({ name: p.functionCall.name, args: p.functionCall.args ?? {} });
            }
          }
        }

        for (const c of calls) {
          if (c.name === 'play_music') {
            const q = String(c.args.query ?? '').slice(0, 120);
            if (!q || /ambiente\s*infa/i.test(q)) { send({ t: 'action', name: 'play_ambient', args: {} }); if (!wrote) send({ t: 'text', d: '🎵 Listo, puse la música ambiental de INFA.' }); continue; }
            await playSong(q);
          } else if (c.name === 'navigate') {
            const t = NAV_TARGETS[String(c.args.target)];
            if (t) { send({ t: 'action', name: 'navigate', args: { href: t.href } }); if (!wrote) send({ t: 'text', d: `Te llevo a **${t.label}** 👉` }); }
          } else if (c.name === 'show_works') {
            send({ t: 'action', name: 'show_works', args: { category: c.args.category || 'todas' } });
            if (!wrote) send({ t: 'text', d: 'Aquí tienes nuestras obras reales 👇' });
          } else if (c.name === 'open_whatsapp') {
            send({ t: 'action', name: 'open_whatsapp', args: { message: String(c.args.message ?? '').slice(0, 1200) } });
            if (!wrote) send({ t: 'text', d: 'Te dejé el mensaje listo en WhatsApp. Solo toca **Enviar** ✅' });
          } else if (c.name === 'control_music') {
            send({ t: 'action', name: 'control_music', args: { action: c.args.action } });
            if (!wrote) send({ t: 'text', d: '👌' });
          }
        }
        if (!wrote && !calls.length) send({ t: 'text', d: '¿Me lo repites de otra forma? 🙂' });
        send({ t: 'done' });
      } catch (e: any) {
        console.error('[Robert] Gemini no disponible → respuesta de respaldo:', String(e?.message ?? e).slice(0, 160));
        // 2) Respaldo sin IA: Robert igual responde algo útil
        if (!wrote) {
          const fb = offlineAnswer(last);
          send({ t: 'text', d: fb.text });
          if (fb.action) send({ t: 'action', ...fb.action });
        }
        send({ t: 'done' });
      }
      ctrl.close();
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' } });
};

export const GET: APIRoute = () => Response.json({ ready: robertReady() }, { headers: { 'Cache-Control': 'no-store' } });
