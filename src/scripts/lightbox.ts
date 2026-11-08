/** Visor de fotos a pantalla completa: teclado (← → Esc), deslizar en móvil, accesible. */
let box: HTMLDivElement | null = null;
let items: HTMLElement[] = [];
let idx = 0;
let lastFocus: HTMLElement | null = null;

function ensure() {
  if (box) return box;
  box = document.createElement('div');
  box.className = 'lb';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Visor de fotos');
  box.innerHTML = `
    <button class="lb__x" type="button" aria-label="Cerrar">✕</button>
    <button class="lb__nav lb__prev" type="button" aria-label="Anterior">←</button>
    <figure class="lb__fig"><img alt="" /><figcaption><strong></strong><span></span><em></em></figcaption></figure>
    <button class="lb__nav lb__next" type="button" aria-label="Siguiente">→</button>`;
  document.body.appendChild(box);
  const style = document.createElement('style');
  style.textContent = `
  .lb{position:fixed;inset:0;z-index:400;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:1rem;padding:4vh 2vw;background:rgb(5 5 7/.94);backdrop-filter:blur(10px);opacity:0;visibility:hidden;transition:opacity .4s,visibility .4s}
  .lb.is-open{opacity:1;visibility:visible}
  .lb__fig{margin:0;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1rem;min-width:0}
  .lb__fig img{max-width:100%;max-height:78vh;object-fit:contain;border-radius:10px;transform:scale(.97);transition:transform .5s cubic-bezier(.16,1,.3,1),opacity .3s}
  .lb.is-open .lb__fig img{transform:none}
  .lb__fig figcaption{display:grid;gap:4px;text-align:center;color:#eef1f5}
  .lb__fig strong{font-size:1.1rem}.lb__fig span{color:#9aa2b1;font-size:.9rem}.lb__fig em{font:500 .72rem 'IBM Plex Mono',monospace;color:#9aa2b1;font-style:normal;letter-spacing:.1em}
  .lb__nav,.lb__x{width:56px;height:56px;border-radius:50%;border:1px solid rgb(255 255 255/.2);background:rgb(255 255 255/.04);color:#fff;font-size:1.3rem;cursor:pointer;transition:background .3s}
  .lb__nav:hover,.lb__x:hover{background:var(--c-weld)}
  .lb__x{position:absolute;top:18px;right:18px}
  @media(max-width:700px){.lb{grid-template-columns:1fr;padding:70px 12px 90px}.lb__nav{position:absolute;bottom:20px}.lb__prev{left:calc(50% - 70px)}.lb__next{right:calc(50% - 70px)}}`;
  document.head.appendChild(style);
  box.querySelector('.lb__x')!.addEventListener('click', close);
  box.querySelector('.lb__prev')!.addEventListener('click', () => go(-1));
  box.querySelector('.lb__next')!.addEventListener('click', () => go(1));
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  let sx = 0;
  box.addEventListener('touchstart', (e) => (sx = e.touches[0].clientX), { passive: true });
  box.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); });
  addEventListener('keydown', (e) => {
    if (!box?.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });
  return box;
}

function render() {
  const el = items[idx];
  const b = ensure();
  const img = b.querySelector('img')!;
  img.style.opacity = '0';
  img.onload = () => (img.style.opacity = '1');
  img.src = el.dataset.src!;
  img.alt = el.dataset.title || '';
  b.querySelector('strong')!.textContent = el.dataset.title || '';
  b.querySelector('span')!.textContent = el.dataset.meta || '';
  b.querySelector('em')!.textContent = `${idx + 1} / ${items.length}`;
  // precarga vecinas
  [1, -1].forEach((d) => { const n = items[(idx + d + items.length) % items.length]; if (n) new Image().src = n.dataset.src!; });
}
function go(d: number) { idx = (idx + d + items.length) % items.length; render(); }
function open(el: HTMLElement) {
  const group = el.closest('[data-lb-group]');
  items = [...(group ?? document).querySelectorAll<HTMLElement>('[data-lb]')].filter((x) => x.offsetParent !== null || x === el);
  idx = Math.max(0, items.indexOf(el));
  lastFocus = el;
  render();
  ensure().classList.add('is-open');
  (window as any).__lenis?.stop();
  (box!.querySelector('.lb__x') as HTMLElement).focus();
}
function close() {
  box?.classList.remove('is-open');
  (window as any).__lenis?.start();
  lastFocus?.focus();
}

document.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-lb]');
  if (el) { e.preventDefault(); open(el); }
});
