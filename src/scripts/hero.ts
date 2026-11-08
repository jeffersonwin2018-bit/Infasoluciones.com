/**
 * Giro 360° por scroll: precarga progresiva de fotogramas (primero 1 de cada 6 para poder
 * girar enseguida, luego el resto) y dibujo en canvas tipo "object-fit: cover".
 */
import { gsap, ScrollTrigger } from './motion';

export function initHero() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;
  const pre = document.querySelector<HTMLElement>('[data-pre]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches && !location.search.includes('motion=1');
  const reveal = () => {
    pre?.classList.add('is-done');
    requestAnimationFrame(() => hero.classList.add('hero--in'));
    try { sessionStorage.setItem('infa-pre', '1'); } catch {}
  };

  if (!hero.classList.contains('hero--scrub') || reduce) {
    hero.classList.remove('hero--scrub');
    reveal();
    return;
  }

  const N = Number(hero.dataset.frames) || 120;
  const mobile = matchMedia('(max-width: 760px)').matches;
  const dir = mobile ? 'm' : 'd';
  const url = (i: number) => `/media/hero/${dir}/f${String(i + 1).padStart(3, '0')}.webp`;
  const frames: (HTMLImageElement | null)[] = new Array(N).fill(null);
  const canvas = hero.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;
  const pctEl = document.querySelector('[data-pct]');
  const pbar = document.querySelector<HTMLElement>('[data-pbar]');
  const degEl = hero.querySelector('[data-deg]');
  const bar = hero.querySelector<HTMLElement>('[data-bar]');
  const callouts = [...hero.querySelectorAll<HTMLElement>('.hero__callouts li')];

  let current = 0;
  let firstPass = 0;
  const STEP = 6;
  const firstPassTotal = Math.ceil(N / STEP);

  const nearestLoaded = (i: number) => {
    for (let d = 0; d < N; d++) {
      if (frames[i - d]) return frames[i - d];
      if (frames[i + d]) return frames[i + d];
    }
    return null;
  };

  const draw = (i: number) => {
    const img = frames[i] ?? nearestLoaded(i);
    if (!img) return;
    const cw = canvas.width, ch = canvas.height;
    const ir = img.naturalWidth / img.naturalHeight, cr = cw / ch;
    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 0, cw, ch);
    if (mobile) {
      // Móvil (pantalla alta): el módulo completo arriba, el texto abajo. Igual que .hero__poster en CSS.
      // Al empezar a girar (el texto ya se fue) el módulo crece y se centra.
      const k = Math.min(1, Math.max(0, (i / (N - 1) - 0.04) / 0.16));
      const e = k * k * (3 - 2 * k);
      const w = cw * (1.55 + 0.45 * e), h = w / ir;
      const x = -cw * (0.52 + 0.27 * e);
      const y = ch * 0.08 + ((ch - h) * 0.42 - ch * 0.08) * e;
      ctx.drawImage(img, x, y, w, h);
      // fundir los bordes superior e inferior con el fondo
      const f = h * 0.18;
      for (const [y0, y1] of [[y, y + f], [y + h, y + h - f]]) {
        const g = ctx.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, '#050507'); g.addColorStop(1, 'rgba(5,5,7,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, Math.min(y0, y1) - 1, cw, f + 2);
      }
      return;
    }
    let w = cw, h = ch;
    if (ir > cr) w = ch * ir; else h = cw / ir;
    const shift = cw * 0.1; // el módulo se corre a la derecha, lejos del titular
    ctx.drawImage(img, (cw - w) * 0.7 + shift, (ch - h) * 0.5, w, h);
  };

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, mobile ? 2 : 1.5);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    draw(current);
  };
  addEventListener('resize', resize);

  const load = (i: number) => new Promise<void>((res) => {
    if (frames[i]) return res();
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { frames[i] = img; if (i === current) draw(i); res(); };
    img.onerror = () => res();
    img.src = url(i);
  });

  // Preloader: solo la primera visita de la sesión espera; después entra directo
  let visited = false;
  try { visited = sessionStorage.getItem('infa-pre') === '1'; } catch {}
  if (visited && pre) pre.style.display = 'none';
  const timeout = setTimeout(reveal, visited ? 0 : 3200);

  (async () => {
    const first = Array.from({ length: firstPassTotal }, (_, k) => k * STEP);
    await Promise.all(first.map((i) => load(i).then(() => {
      firstPass++;
      const p = Math.round((firstPass / firstPassTotal) * 100);
      if (pctEl) pctEl.textContent = String(p);
      if (pbar) pbar.style.width = p + '%';
    })));
    resize();
    hero.classList.add('hero--ready');
    clearTimeout(timeout);
    setTimeout(reveal, visited ? 0 : 250);
    // Resto de fotogramas, en lotes para no saturar la red
    const rest = Array.from({ length: N }, (_, i) => i).filter((i) => i % STEP !== 0);
    for (let k = 0; k < rest.length; k += 8) await Promise.all(rest.slice(k, k + 8).map(load));
  })();

  const content = hero.querySelector<HTMLElement>('.hero__content');
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (st) => {
      const p = st.progress;
      const i = Math.min(N - 1, Math.round(p * (N - 1)));
      if (i !== current) { current = i; draw(i); }
      if (degEl) degEl.textContent = String(Math.round(p * 360));
      if (bar) bar.style.transform = `scaleX(${p})`;
      callouts.forEach((c) => {
        const at = Number(c.dataset.at);
        c.classList.toggle('is-on', p > at && p < at + 0.32);
      });
      if (content) {
        const k = Math.min(1, Math.max(0, (p - 0.04) / 0.16));
        content.style.opacity = String(1 - k);
        content.style.transform = `translateY(${-k * 60}px)`;
        content.style.pointerEvents = k > 0.6 ? 'none' : '';
      }
    },
  });

  // Ligera inclinación con el mouse (sensación 3D extra)
  if (matchMedia('(pointer: fine)').matches) {
    const rx = gsap.quickTo(canvas, 'rotationY', { duration: 1.2, ease: 'power3' });
    const ry = gsap.quickTo(canvas, 'rotationX', { duration: 1.2, ease: 'power3' });
    gsap.set(canvas, { transformPerspective: 1400, scale: 1.04 });
    hero.addEventListener('pointermove', (e) => { rx((e.clientX / innerWidth - 0.5) * 4); ry(-(e.clientY / innerHeight - 0.5) * 3); });
  }
}
