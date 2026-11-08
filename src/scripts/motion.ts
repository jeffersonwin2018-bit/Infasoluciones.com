/**
 * Capa de movimiento global: scroll suave (Lenis) + GSAP ScrollTrigger.
 * Todo es progresivo: sin JS o con "reducir movimiento" el contenido se ve completo y estático.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches && !location.search.includes('motion=1');
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const W = window as any;

// ── Scroll suave ───────────────────────────────────────────────
if (!reduce) {
  const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
  W.__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const el = document.querySelector(a.getAttribute('href')!);
      if (el) { e.preventDefault(); lenis.scrollTo(el as HTMLElement, { offset: -80 }); }
    }),
  );
}

// ── Reveal genérico ────────────────────────────────────────────
const io = new IntersectionObserver(
  (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }),
  { rootMargin: '0px 0px -8% 0px' },
);
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

if (!reduce) {
  // Titulares por líneas que suben desde una máscara
  document.fonts.ready.then(() => {
    document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
      const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
      gsap.from(split.lines, {
        yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    // Frase que se "enciende" palabra por palabra con el scroll
    document.querySelectorAll<HTMLElement>('[data-words]').forEach((el) => {
      const split = SplitText.create(el, { type: 'words' });
      gsap.fromTo(split.words, { opacity: 0.14 }, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
      });
    });
    ScrollTrigger.refresh();
  });

  // Parallax interno de imágenes
  document.querySelectorAll<HTMLElement>('.px img, [data-px]').forEach((img) => {
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.closest('.px') ?? img, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Velocidad diferencial
  document.querySelectorAll<HTMLElement>('[data-speed]').forEach((el) => {
    const s = parseFloat(el.dataset.speed || '0');
    gsap.to(el, { yPercent: s * -100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Marquesinas que aceleran con la velocidad del scroll
  document.querySelectorAll<HTMLElement>('[data-marquee]').forEach((m) => {
    const track = m.querySelector<HTMLElement>('[data-track]');
    if (!track) return;
    track.innerHTML += track.innerHTML; // duplicar para bucle continuo
    let x = 0, boost = 0;
    const dir = m.dataset.marquee === 'rtl' ? 1 : -1;
    ScrollTrigger.create({ trigger: m, start: 'top bottom', end: 'bottom top', onUpdate: (st) => { boost = Math.min(Math.abs(st.getVelocity()) / 120, 14); } });
    gsap.ticker.add(() => {
      const half = track.scrollWidth / 2;
      x += dir * (0.6 + boost);
      boost *= 0.92;
      if (x <= -half) x += half; if (x >= 0 && dir > 0) x -= half;
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
  });
}

// ── Contadores ────────────────────────────────────────────────
document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
  const raw = el.dataset.count || el.textContent || '';
  const m = raw.match(/^(\D*)(\d+)(.*)$/);
  if (!m || reduce) return;
  const [, pre, num, post] = m;
  const target = parseInt(num, 10);
  const obj = { v: target > 1900 && target < 2100 ? target - 40 : 0 };
  el.textContent = pre + obj.v + post;
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => gsap.to(obj, { v: target, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = pre + Math.round(obj.v) + post) }),
  });
});

// ── Cursor personalizado y botones magnéticos (solo mouse) ─────
if (fine && !reduce) {
  document.documentElement.classList.add('has-cursor');
  const dot = document.querySelector<HTMLElement>('.cursor__dot');
  const ring = document.querySelector<HTMLElement>('.cursor__ring');
  const label = ring?.querySelector('em');
  const xd = gsap.quickTo(dot, 'x', { duration: 0.1 }), yd = gsap.quickTo(dot, 'y', { duration: 0.1 });
  const xr = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' }), yr = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
  addEventListener('pointermove', (e) => { xd(e.clientX); yd(e.clientY); xr(e.clientX); yr(e.clientY); }, { passive: true });
  const root = document.documentElement;
  document.addEventListener('pointerover', (e) => {
    const t = e.target as HTMLElement;
    const view = t.closest<HTMLElement>('[data-cursor]');
    root.classList.toggle('cursor--view', !!view);
    if (view && label) label.textContent = view.dataset.cursor || 'Ver';
    root.classList.toggle('cursor--link', !view && !!t.closest('a, button, summary, label, select'));
  });

  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const xm = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1,0.4)' });
    const ym = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1,0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xm((e.clientX - r.left - r.width / 2) * 0.3); ym((e.clientY - r.top - r.height / 2) * 0.4);
    });
    el.addEventListener('pointerleave', () => { xm(0); ym(0); });
  });
}

// ── Música y Robert ───────────────────────────────────────
import './audio';

export { gsap, ScrollTrigger, reduce };
