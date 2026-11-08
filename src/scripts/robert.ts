/** Chat de Robert en el navegador: streaming, acciones dentro de la web y memoria de la conversación. */
import { playAmbient, playYouTube, pause, resume, next, stop, volume, music } from './audio';

interface Msg { role: 'user' | 'model'; text: string }
const KEY = 'infa-robert';
const root = document.querySelector<HTMLElement>('[data-robert]');
const log = root?.querySelector<HTMLElement>('[data-robert-log]');
const form = root?.querySelector<HTMLFormElement>('[data-robert-form]');
const ta = form?.querySelector('textarea');
const chips = root?.querySelector<HTMLElement>('[data-robert-chips]');
let history: Msg[] = [];
try { history = JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch {}
const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(history.slice(-30))); } catch {} };
let busy = false;
let pendingWa: string | null = null;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
/** Markdown mínimo y seguro: **negrita**, *cursiva*, listas, enlaces http(s). */
function md(src: string) {
  const lines = esc(src.trim()).split('\n');
  let html = '', list = false;
  for (const l of lines) {
    const li = l.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)/);
    if (li) { if (!list) { html += '<ul>'; list = true; } html += `<li>${li[1]}</li>`; continue; }
    if (list) { html += '</ul>'; list = false; }
    if (l.trim()) html += `<p>${l}</p>`;
  }
  if (list) html += '</ul>';
  return html
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
    .replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}

function bubble(role: 'me' | 'bot' | 'status', html: string) {
  const d = document.createElement('div');
  d.className = `rb__msg rb__msg--${role}`;
  d.innerHTML = html;
  log!.appendChild(d);
  log!.scrollTop = log!.scrollHeight;
  return d;
}
const GREETING = '¡Hola! Soy **Robert**, el asistente de INFA 👋\nTe cuento lo que hacemos, te muestro obras reales, te ayudo a cotizar o te pongo la música que quieras. ¿En qué te ayudo?';

function render() {
  if (!log) return;
  log.innerHTML = '';
  bubble('bot', md(GREETING));
  history.forEach((m) => bubble(m.role === 'user' ? 'me' : 'bot', md(m.text)));
  chips!.hidden = history.length > 0;
}

function open(prefill = '') {
  if (!root) return;
  if (root.hidden) { root.hidden = false; render(); }
  document.documentElement.classList.add('rb-open');
  (window as any).__lenis?.stop();
  if (prefill && ta) { ta.value = prefill; }
  setTimeout(() => { ta?.focus(); ta?.setSelectionRange(ta.value.length, ta.value.length); }, 120);
}
function close() {
  if (!root) return;
  root.hidden = true;
  document.documentElement.classList.remove('rb-open');
  (window as any).__lenis?.start();
}

const go = (href: string) => {
  if (location.pathname === href) { close(); scrollTo({ top: 0, behavior: 'smooth' }); return; }
  setTimeout(() => (location.href = href), 700);
};

function act(name: string, args: any) {
  switch (name) {
    case 'play_ambient': playAmbient(); break;
    case 'play_youtube': playYouTube(args); break;
    case 'control_music': {
      const a = args.action;
      if (a === 'pausar') pause(); else if (a === 'reanudar') resume(); else if (a === 'siguiente') next();
      else if (a === 'detener') stop(); else if (a === 'subir_volumen') volume(0.15); else if (a === 'bajar_volumen') volume(-0.15);
      break;
    }
    case 'navigate': go(args.href); break;
    case 'show_works': {
      const cat = args.category && args.category !== 'todas' ? args.category : '';
      if (location.pathname === '/proyectos') {
        close();
        document.querySelector<HTMLButtonElement>(`[data-f="${cat || 'all'}"]`)?.click();
        document.querySelector('.gal')?.scrollIntoView({ behavior: 'smooth' });
      } else go('/proyectos' + (cat ? `?tipo=${cat}` : ''));
      break;
    }
    case 'open_whatsapp': {
      pendingWa = args.message;
      const a = document.createElement('a');
      a.className = 'rb__act';
      a.href = `https://wa.me/${document.documentElement.dataset.wa}?text=${encodeURIComponent(args.message)}`;
      a.target = '_blank'; a.rel = 'noopener';
      a.textContent = '💬 Abrir WhatsApp con el mensaje';
      log!.appendChild(a);
      log!.scrollTop = log!.scrollHeight;
      // En escritorio se abre solo; en celular se toca el botón (algunos navegadores bloquean ventanas automáticas)
      if (!matchMedia('(max-width: 860px)').matches) window.open(a.href, '_blank', 'noopener');
      break;
    }
  }
}

async function send(text: string) {
  if (busy || !text.trim()) return;
  busy = true;
  chips!.hidden = true;
  const btn = form!.querySelector('button')!;
  btn.disabled = true;
  history.push({ role: 'user', text: text.trim() });
  save();
  bubble('me', md(text));
  const out = bubble('bot', '<span class="rb__typing"><i></i><i></i><i></i></span>');
  let acc = '';
  let status: HTMLElement | null = null;
  try {
    const r = await fetch('/api/robert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }) });
    if (!r.ok || !r.body) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.error || 'No pude responder ahora.');
    }
    const reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1);
        if (!line.trim()) continue;
        const ev = JSON.parse(line);
        if (ev.t === 'text') { acc += ev.d; out.innerHTML = md(acc); log!.scrollTop = log!.scrollHeight; }
        else if (ev.t === 'status') { status ??= bubble('status', ''); status.textContent = '⏳ ' + ev.d; }
        else if (ev.t === 'action') { status?.remove(); status = null; act(ev.name, ev.args); }
        else if (ev.t === 'error') throw new Error(ev.d);
      }
    }
    status?.remove();
    if (!acc) out.remove();
    else { history.push({ role: 'model', text: acc }); save(); }
  } catch (e: any) {
    status?.remove();
    out.innerHTML = md(`${e.message}\n\nSi prefieres, escríbenos por WhatsApp y te atiende una persona.`);
    history.pop(); save();
  }
  busy = false;
  btn.disabled = false;
}

// ── Eventos ─────────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const o = t.closest<HTMLElement>('[data-robert-open]');
  if (o) { e.preventDefault(); document.querySelector('[data-mtip]')?.setAttribute('hidden', ''); open(o.dataset.prefill || ''); }
  if (t.closest('[data-robert-close]')) close();
  if (t.closest('[data-robert-clear]')) { history = []; save(); render(); }
});
addEventListener('keydown', (e) => { if (e.key === 'Escape' && root && !root.hidden) close(); });
addEventListener('robert-open', (e: any) => open(e.detail?.prefill || ''));
chips?.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => send(b.textContent || '')));
form?.addEventListener('submit', (e) => { e.preventDefault(); const v = ta!.value; ta!.value = ''; ta!.style.height = ''; send(v); });
ta?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !matchMedia('(max-width: 860px)').matches) { e.preventDefault(); form!.requestSubmit(); } });
ta?.addEventListener('input', () => { ta.style.height = ''; ta.style.height = Math.min(120, ta.scrollHeight) + 'px'; });

// Si la canción de YouTube no se puede reproducir, Robert lo dice y ofrece otra
addEventListener('infa-music-error', () => {
  if (root && !root.hidden) bubble('bot', md('Esa canción no se deja reproducir aquí 😕. Pídeme otra versión u otra canción.'));
  else window.dispatchEvent(new CustomEvent('robert-open', { detail: { prefill: 'Pon otra versión de ' + music().title } }));
});

// Sugerencia al activar el sonido: "¿Otra música? Pídesela a Robert"
const tip = document.querySelector<HTMLElement>('[data-mtip]');
let tipT = 0;
addEventListener('infa-music-tip', () => {
  if (!tip) return;
  tip.hidden = false;
  clearTimeout(tipT);
  tipT = window.setTimeout(() => (tip.hidden = true), 9000);
});
tip?.querySelector('.mtip__x')?.addEventListener('click', () => (tip.hidden = true));

// Abrir la galería ya filtrada si Robert lo pidió (?tipo=…)
const tipo = new URLSearchParams(location.search).get('tipo');
if (tipo && location.pathname === '/proyectos') {
  addEventListener('load', () => setTimeout(() => document.querySelector<HTMLButtonElement>(`[data-f="${tipo}"]`)?.click(), 300));
}

// El botón de Robert se compacta al hacer scroll para no tapar contenido
const launch = document.querySelector<HTMLElement>('.rb-launch');
addEventListener('scroll', () => launch?.classList.toggle('is-compact', scrollY > innerHeight * 0.8), { passive: true });
