/**
 * Música de la web.
 * - "Ambiente INFA": lista de 3 pistas propias (generadas para la marca), en bucle.
 * - Cualquier canción que el visitante pida a Robert: reproductor de YouTube (modo privacidad).
 * Todo empieza solo tras un toque del visitante (los navegadores bloquean el autoplay con sonido).
 */
type Src = 'none' | 'ambient' | 'youtube';
export interface NowPlaying { src: Src; title: string; author: string; playing: boolean; thumb?: string }

const TRACKS = [
  { file: '/media/audio/infa-lounge.mp3', title: 'Showroom Lounge', author: 'INFA Ambiente' },
  { file: '/media/audio/infa-groove.mp3', title: 'Boutique Groove', author: 'INFA Ambiente' },
  { file: '/media/audio/infa-bossa.mp3', title: 'Taller Bossa', author: 'INFA Ambiente' },
];
const VOL = 0.45;
let vol = VOL;
let idx = 0;
let audio: HTMLAudioElement | null = null;
let yt: any = null;
let ytReady: Promise<void> | null = null;
let state: NowPlaying = { src: 'none', title: '', author: '', playing: false };
const subs = new Set<(s: NowPlaying) => void>();
const emit = (p: Partial<NowPlaying>) => { state = { ...state, ...p }; subs.forEach((f) => f(state)); };
export const onMusic = (f: (s: NowPlaying) => void) => { subs.add(f); f(state); return () => subs.delete(f); };
export const music = () => state;
const pref = (on: boolean) => { try { localStorage.setItem('infa-sound', on ? '1' : '0'); } catch {} };

function fadeTo(a: HTMLAudioElement, to: number, ms = 800) {
  const from = a.volume, t0 = performance.now();
  return new Promise<void>((res) => {
    const step = (t: number) => { const k = Math.min(1, (t - t0) / ms); a.volume = from + (to - from) * k; k < 1 ? requestAnimationFrame(step) : res(); };
    requestAnimationFrame(step);
  });
}

function stopYouTube() { try { yt?.stopVideo?.(); } catch {} }
async function stopAmbient() { if (audio && !audio.paused) { await fadeTo(audio, 0, 400); audio.pause(); } }

export async function playAmbient(i = idx) {
  stopYouTube();
  idx = (i + TRACKS.length) % TRACKS.length;
  const t = TRACKS[idx];
  if (!audio) {
    audio = new Audio();
    audio.preload = 'auto';
    audio.addEventListener('ended', () => playAmbient(idx + 1));
  }
  if (!audio.src.endsWith(t.file)) audio.src = t.file;
  audio.volume = 0;
  try {
    await audio.play();
    fadeTo(audio, vol);
    emit({ src: 'ambient', title: t.title, author: t.author, playing: true, thumb: undefined });
    pref(true);
  } catch { emit({ playing: false }); }
}

function loadYT() {
  if (ytReady) return ytReady;
  ytReady = new Promise<void>((res) => {
    const host = document.createElement('div');
    host.className = 'yt-host';
    host.innerHTML = '<div id="yt-player"></div>';
    np.prepend(host); // el reproductor de YouTube queda visible dentro del mini reproductor
    (window as any).onYouTubeIframeAPIReady = () => {
      yt = new (window as any).YT.Player('yt-player', {
        host: 'https://www.youtube-nocookie.com',
        width: 240, height: 135,
        playerVars: { autoplay: 1, controls: 0, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => res(),
          onStateChange: (e: any) => {
            const YT = (window as any).YT.PlayerState;
            if (e.data === YT.PLAYING) emit({ playing: true });
            if (e.data === YT.PAUSED) emit({ playing: false });
            if (e.data === YT.ENDED) playAmbient(idx);
          },
          onError: () => { emit({ playing: false }); window.dispatchEvent(new CustomEvent('infa-music-error')); },
        },
      });
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });
  return ytReady;
}

export async function playYouTube(song: { id: string; title: string; author: string }) {
  await stopAmbient();
  emit({ src: 'youtube', title: song.title, author: song.author, playing: false, thumb: `https://i.ytimg.com/vi/${song.id}/mqdefault.jpg` });
  await loadYT();
  yt.setVolume(Math.round(vol * 100));
  yt.loadVideoById(song.id);
  pref(true);
}

export function pause() {
  if (state.src === 'ambient' && audio) { fadeTo(audio, 0, 300).then(() => audio!.pause()); }
  if (state.src === 'youtube') yt?.pauseVideo?.();
  emit({ playing: false });
}
export function resume() {
  if (state.src === 'youtube') { yt?.playVideo?.(); emit({ playing: true }); }
  else playAmbient(idx);
}
export function stop() { stopAmbient(); stopYouTube(); emit({ src: 'none', playing: false, title: '', author: '', thumb: undefined }); pref(false); }
export function next() { playAmbient(state.src === 'ambient' ? idx + 1 : idx); }
export function volume(delta: number) {
  vol = Math.max(0.05, Math.min(1, vol + delta));
  if (audio) audio.volume = vol;
  yt?.setVolume?.(Math.round(vol * 100));
}
export function toggle() { state.playing ? pause() : (state.src === 'none' ? playAmbient() : resume()); }

// ── Botones "Sonido" (cabecera / dock) ───────────────────────
document.querySelectorAll<HTMLButtonElement>('[data-sound]').forEach((b) => b.addEventListener('click', () => {
  const wasOff = !state.playing;
  toggle();
  if (wasOff) window.dispatchEvent(new CustomEvent('infa-music-tip'));
}));
onMusic((s) => document.querySelectorAll('[data-sound]').forEach((b) => {
  b.setAttribute('aria-pressed', String(s.playing));
  b.setAttribute('aria-label', s.playing ? 'Pausar música' : 'Activar música');
}));

// Si el visitante tenía la música activada, se reanuda con su primer toque
try {
  if (localStorage.getItem('infa-sound') === '1') {
    const go = (e: Event) => {
      if ((e.target as HTMLElement)?.closest?.('[data-sound], .np')) return;
      if (state.src === 'none') playAmbient();
    };
    addEventListener('pointerdown', go, { once: true });
  }
} catch {}
document.addEventListener('visibilitychange', () => {
  if (state.src !== 'ambient' || !audio || !state.playing) return;
  document.hidden ? audio.pause() : audio.play().catch(() => {});
});

// ── Mini reproductor "Ahora suena" ───────────────────────────
const np = document.createElement('div');
np.className = 'np';
np.hidden = true;
np.innerHTML = `
  <span class="np__art"><img alt="" hidden><i class="np__eq"><b></b><b></b><b></b></i></span>
  <span class="np__txt"><strong></strong><small></small></span>
  <button type="button" class="np__b" data-np="toggle" aria-label="Pausar">❚❚</button>
  <button type="button" class="np__b" data-np="next" aria-label="Siguiente">⏭</button>
  <button type="button" class="np__b" data-np="ask" aria-label="Pedir otra canción a Robert">🎤</button>
  <button type="button" class="np__b" data-np="close" aria-label="Cerrar música">✕</button>`;
document.body.appendChild(np);
np.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLElement>('[data-np]')?.dataset.np;
  if (a === 'toggle') toggle();
  if (a === 'next') next();
  if (a === 'close') stop();
  if (a === 'ask') window.dispatchEvent(new CustomEvent('robert-open', { detail: { prefill: 'Pon ' } }));
});
onMusic((s) => {
  np.hidden = s.src === 'none';
  np.classList.toggle('is-yt', s.src === 'youtube');
  np.classList.toggle('is-playing', s.playing);
  np.querySelector('strong')!.textContent = s.title || 'Música';
  np.querySelector('small')!.textContent = s.author;
  const img = np.querySelector('img')!;
  img.hidden = !s.thumb; if (s.thumb) img.src = s.thumb;
  const t = np.querySelector<HTMLElement>('[data-np=toggle]')!;
  t.textContent = s.playing ? '❚❚' : '▶';
  t.setAttribute('aria-label', s.playing ? 'Pausar' : 'Reproducir');
  document.documentElement.classList.toggle('has-np', !np.hidden);
  document.documentElement.classList.toggle('has-yt', s.src === 'youtube');
});
