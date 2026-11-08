/**
 * Panel INFA — app de una sola página, sin frameworks. Todo el texto de usuario se escapa (esc()).
 */
type Role = 'propietario' | 'editor' | 'colaborador';
interface User { id: string; username: string; name: string; role: Role; active: boolean; createdAt: string; lastLogin?: string }
interface Work { id: string; title: string; description?: string; category: string; location?: string; date: string; src: string; thumb: string; w: number; h: number; featured: boolean; visible: boolean; order: number; uploadedBy: string; uploaderId?: string; createdAt: string }
interface Session { user: User | null; setupNeeded: boolean; roles: Record<Role, { label: string; rank: number; desc: string }>; categories: Record<string, { label: string }> }

const app = document.getElementById('app')!;
const ACCENTS: { value: string; label: string }[] = JSON.parse(app.dataset.accents || '[]');
let S: Session;
let me: User;
let works: Work[] = [];
let tab = 'subir';
let filter = 'todas';

// ── utilidades ─────────────────────────────────────────────
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll(sel)] as T[];
const rank = (r: Role) => S.roles[r].rank;
const isEditor = () => rank(me.role) >= 2;
const isOwner = () => me.role === 'propietario';
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const fdate = (iso: string) => new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

let toastT = 0;
function toast(msg: string, bad = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'on' + (bad ? ' bad' : '');
  clearTimeout(toastT);
  toastT = window.setTimeout(() => (t.className = ''), 3200);
}

async function api<T = any>(path: string, opts: RequestInit & { json?: unknown } = {}): Promise<T> {
  const init: RequestInit = { credentials: 'same-origin', ...opts };
  if (opts.json !== undefined) { init.body = JSON.stringify(opts.json); init.headers = { 'Content-Type': 'application/json' }; }
  const r = await fetch('/api/' + path, init);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && !['login', 'password', 'setup'].includes(path)) { location.reload(); }
    throw new Error(data.error || 'Algo salió mal. Intenta de nuevo.');
  }
  return data;
}

const logo = `<div class="logo"><span>IN</span><b>FA</b></div>`;

// ── Acceso ─────────────────────────────────────────────────
function renderAuth(setup: boolean) {
  app.innerHTML = `
  <div class="auth"><form class="auth__card" novalidate>
    <div class="auth__logo">${logo}<div><h1>${setup ? 'Configurar panel' : 'Panel INFA'}</h1></div></div>
    <p>${setup ? 'Crea la primera cuenta de <b>propietario</b>. Luego podrás invitar a tu familia y equipo.' : 'Ingresa para subir fotos y editar la página. Entras una vez y quedas conectado 30 días.'}</p>
    <div class="err" hidden></div>
    ${setup ? `<label class="f"><span>Tu nombre</span><input type="text" name="name" autocomplete="name" placeholder="Ej.: Jefferson" required></label>` : ''}
    <label class="f"><span>Usuario</span><input type="text" name="username" autocomplete="username" autocapitalize="none" placeholder="ej.: papa" required></label>
    <label class="f"><span>Contraseña</span><input type="password" name="password" autocomplete="${setup ? 'new-password' : 'current-password'}" required><small>${setup ? 'Mínimo 8 caracteres.' : ''}</small></label>
    ${setup ? `<label class="f"><span>Código de configuración</span><input type="password" name="code" autocomplete="off"><small>El valor de INFA_SETUP_CODE en Vercel (en local no hace falta).</small></label>` : ''}
    <button class="b b--red b--block" type="submit">${setup ? 'Crear cuenta y entrar' : 'Entrar'}</button>
    <p style="margin:16px 0 0;text-align:center"><a href="/" style="color:var(--mute)">← Volver a la web</a></p>
  </form></div>`;
  const form = $<HTMLFormElement>('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $<HTMLButtonElement>('button[type=submit]', form);
    const err = $('.err', form);
    btn.disabled = true; err.hidden = true;
    try {
      const body = Object.fromEntries(new FormData(form));
      await api(setup ? 'setup' : 'login', { method: 'POST', json: body });
      await boot();
    } catch (x: any) {
      err.textContent = x.message; err.hidden = false; btn.disabled = false;
    }
  });
}

// ── Estructura principal ───────────────────────────────────
const TABS = () => [
  { id: 'subir', label: '📷 Subir fotos', show: true },
  { id: 'trabajos', label: '🖼️ Trabajos', show: true },
  { id: 'textos', label: '✏️ Textos', show: isEditor() },
  { id: 'diseno', label: '🎨 Diseño', show: isEditor() },
  { id: 'usuarios', label: '👥 Usuarios', show: isOwner() },
  { id: 'cuenta', label: '🔒 Mi cuenta', show: true },
].filter((t) => t.show);

function renderShell() {
  app.innerHTML = `
  <header class="top">${logo}
    <div class="top__who"><b>Hola, ${esc(me.name.split(' ')[0])}</b><small>${esc(S.roles[me.role].label)}</small></div>
    <span class="top__sp"></span>
    <a href="/" target="_blank" rel="noopener">Ver web ↗</a>
    <button type="button" data-logout>Salir</button>
  </header>
  <nav class="tabs" role="tablist">${TABS().map((t) => `<button type="button" role="tab" data-tab="${t.id}" aria-selected="${t.id === tab}">${t.label}</button>`).join('')}</nav>
  ${installBanner()}
  <main id="view"></main>`;
  bindInstall();
  $('[data-logout]').addEventListener('click', async () => {
    if (!confirm('¿Cerrar sesión? Tendrás que volver a escribir tu usuario y contraseña.')) return;
    await api('logout', { method: 'POST' }); location.reload();
  });
  $$('[data-tab]').forEach((b) => b.addEventListener('click', () => go(b.dataset.tab!)));
  go(tab);
}

function go(t: string) {
  tab = t;
  $$('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
  const v = $('#view');
  ({ subir: viewSubir, trabajos: viewTrabajos, textos: viewTextos, diseno: viewDiseno, usuarios: viewUsuarios, cuenta: viewCuenta } as Record<string, (v: HTMLElement) => void>)[t]?.(v);
  scrollTo({ top: 0 });
}

const catOptions = (sel = 'exhibicion') => Object.entries(S.categories).map(([k, c]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(c.label)}</option>`).join('');

// ── Subir fotos ────────────────────────────────────────────
interface Pending { file: File; url: string; id: string; date: string }
let pending: Pending[] = [];

function viewSubir(v: HTMLElement) {
  v.innerHTML = `
  <section class="card">
    <h2>Subir fotos de trabajos</h2>
    <p class="sub">Elige fotos del celular o toma una ahora. Se optimizan solas y se publican con su fecha. ${isEditor() ? '' : 'Solo podrás editar las fotos que tú subas.'}</p>
    <label class="drop" data-drop>
      <span class="drop__ico">+</span>
      <strong>Toca para elegir fotos</strong>
      <span>o arrástralas aquí · puedes elegir varias</span>
      <input type="file" accept="image/*" multiple hidden data-file>
    </label>
    <div class="ups" data-ups></div>
  </section>
  <div class="bar" data-bar hidden><button class="b b--red b--block" type="button" data-publish></button></div>`;
  const input = $<HTMLInputElement>('[data-file]', v);
  const drop = $('[data-drop]', v);
  input.addEventListener('change', () => { addFiles([...(input.files ?? [])]); input.value = ''; });
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('is-over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('is-over'); addFiles([...(e.dataTransfer?.files ?? [])]); });
  $('[data-publish]', v).addEventListener('click', publishAll);
  renderPending();
}

function addFiles(files: File[]) {
  for (const f of files.filter((f) => f.type.startsWith('image/'))) {
    const d = new Date(f.lastModified || Date.now());
    const date = new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
    pending.push({ file: f, url: URL.createObjectURL(f), id: Math.random().toString(36).slice(2), date: date > today() ? today() : date });
  }
  renderPending();
}

function renderPending() {
  const box = $('[data-ups]');
  const bar = $('[data-bar]');
  if (!box) return;
  box.innerHTML = pending.map((p) => `
    <div class="up" data-p="${p.id}">
      <div class="up__img"><img src="${p.url}" alt=""><button class="up__x" type="button" data-rm aria-label="Quitar">✕</button><div class="up__st" hidden></div></div>
      <div>
        <label class="f"><span>Título del trabajo</span><input type="text" name="title" maxlength="120" placeholder="Ej.: Isla de exhibición para TV"></label>
        <div class="row">
          <label class="f"><span>Tipo</span><select name="category">${catOptions()}</select></label>
          <label class="f"><span>Fecha</span><input type="date" name="date" value="${p.date}" max="${today()}"></label>
        </div>
        <label class="f"><span>Lugar (opcional)</span><input type="text" name="location" maxlength="80" placeholder="Ej.: Saga Falabella Cayma · Arequipa"></label>
        <label class="f"><span>Descripción (opcional)</span><input type="text" name="description" maxlength="600" placeholder="Materiales, medidas, detalles…"></label>
        ${isEditor() ? `<label class="chk"><input type="checkbox" name="featured"> ⭐ Mostrar en la portada</label>` : ''}
      </div>
    </div>`).join('');
  $$('[data-rm]', box).forEach((b) => b.addEventListener('click', () => {
    const id = b.closest<HTMLElement>('[data-p]')!.dataset.p;
    pending = pending.filter((p) => p.id !== id);
    renderPending();
  }));
  bar.hidden = pending.length === 0;
  $('[data-publish]').textContent = `Publicar ${pending.length} foto${pending.length === 1 ? '' : 's'}`;
}

async function resize(file: File, max: number, q: number): Promise<{ blob: Blob; w: number; h: number }> {
  let bmp: ImageBitmap | HTMLImageElement;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as any); }
  catch {
    bmp = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  }
  const sw = (bmp as any).width, sh = (bmp as any).height;
  const k = Math.min(1, max / Math.max(sw, sh));
  const w = Math.round(sw * k), h = Math.round(sh * k);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp as any, 0, 0, w, h);
  const toBlob = (type: string) => new Promise<Blob | null>((res) => c.toBlob(res, type, q));
  let blob = await toBlob('image/webp');
  if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg');
  return { blob: blob!, w, h };
}

async function publishAll() {
  const btn = $<HTMLButtonElement>('[data-publish]');
  btn.disabled = true;
  let ok = 0;
  for (const p of [...pending]) {
    const card = $(`[data-p="${p.id}"]`);
    const st = $('.up__st', card);
    st.hidden = false; st.className = 'up__st'; st.textContent = 'Optimizando…';
    try {
      const full = await resize(p.file, 2000, 0.82);
      const thumb = await resize(p.file, 720, 0.72);
      st.textContent = 'Subiendo…';
      const fd = new FormData();
      const ext = full.blob.type === 'image/webp' ? 'webp' : 'jpg';
      fd.append('full', full.blob, `foto.${ext}`);
      fd.append('thumb', thumb.blob, `mini.${ext}`);
      fd.append('w', String(full.w)); fd.append('h', String(full.h));
      $$<HTMLInputElement | HTMLSelectElement>('input, select', card).forEach((i) => {
        if (i instanceof HTMLInputElement && i.type === 'checkbox') fd.append(i.name, String(i.checked));
        else if (i.name) fd.append(i.name, i.value);
      });
      const w = await api<Work>('works', { method: 'POST', body: fd });
      works.unshift(w);
      st.textContent = '✓ Publicada'; st.classList.add('ok');
      pending = pending.filter((x) => x.id !== p.id);
      ok++;
    } catch (e: any) {
      st.textContent = '✕ ' + e.message; st.classList.add('bad');
    }
  }
  btn.disabled = false;
  if (ok) {
    toast(`✓ ${ok} foto${ok > 1 ? 's' : ''} publicada${ok > 1 ? 's' : ''} en la web`);
    setTimeout(renderPending, 1200);
  } else toast('No se pudo subir. Revisa tu conexión.', true);
}

// ── Trabajos ───────────────────────────────────────────────
async function viewTrabajos(v: HTMLElement) {
  v.innerHTML = `<section class="card"><h2>Trabajos publicados</h2><p class="sub">⭐ = sale en la portada · 👁 = mostrar u ocultar · ✏️ editar · ↑↓ cambiar orden · 🗑 borrar</p>
    <div class="filters">${[['todas', 'Todas'], ['portada', '⭐ Portada'], ['ocultas', 'Ocultas'], ['mias', 'Mis fotos']].map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${filter === k}">${l}</button>`).join('')}</div>
    <div class="grid" data-grid><div class="spin"></div></div></section>`;
  $$('[data-f]', v).forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f!; $$('[data-f]', v).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); renderGrid(); }));
  works = await api<Work[]>('works');
  renderGrid();
}

const canEdit = (w: Work) => isEditor() || w.uploaderId === me.id;

function renderGrid() {
  const g = $('[data-grid]');
  if (!g) return;
  const list = works.filter((w) => filter === 'portada' ? w.featured : filter === 'ocultas' ? !w.visible : filter === 'mias' ? w.uploaderId === me.id : true);
  if (!list.length) { g.innerHTML = `<p class="sub">No hay trabajos aquí todavía.</p>`; return; }
  g.innerHTML = list.map((w) => {
    const i = works.indexOf(w);
    const e = canEdit(w);
    return `<article class="w ${w.visible ? '' : 'is-hidden'}" data-w="${esc(w.id)}">
      <div class="w__img"><img src="${esc(w.thumb)}" alt="" loading="lazy"><div class="w__badges">${w.featured ? '<span class="pill pill--star">⭐ Portada</span>' : ''}${w.visible ? '' : '<span class="pill pill--hid">Oculta</span>'}</div></div>
      <div class="w__body"><strong>${esc(w.title)}</strong><small>${esc(S.categories[w.category]?.label ?? '')} · ${fdate(w.date)}${w.location ? ' · ' + esc(w.location) : ''}<br>Subida por ${esc(w.uploadedBy)}</small></div>
      <div class="w__act">
        <button type="button" data-a="star" title="Portada" ${isEditor() ? '' : 'disabled'}>${w.featured ? '⭐' : '☆'}</button>
        <button type="button" data-a="vis" title="Mostrar/ocultar" ${e ? '' : 'disabled'}>${w.visible ? '👁' : '🙈'}</button>
        <button type="button" data-a="edit" title="Editar" ${e ? '' : 'disabled'}>✏️</button>
        <button type="button" data-a="up" title="Subir" ${isEditor() && i > 0 && filter === 'todas' ? '' : 'disabled'}>↑</button>
        <button type="button" data-a="del" title="Borrar" ${e ? '' : 'disabled'}>🗑</button>
      </div></article>`;
  }).join('');
  $$('[data-a]', g).forEach((b) => b.addEventListener('click', () => act(b.closest<HTMLElement>('[data-w]')!.dataset.w!, b.dataset.a!)));
}

let orderT = 0;
async function act(id: string, a: string) {
  const w = works.find((x) => x.id === id)!;
  try {
    if (a === 'star' || a === 'vis') {
      const patch = a === 'star' ? { featured: !w.featured } : { visible: !w.visible };
      Object.assign(w, await api<Work>(`works/${encodeURIComponent(id)}`, { method: 'PATCH', json: patch }));
      toast(a === 'star' ? (w.featured ? '⭐ Ahora sale en la portada' : 'Quitada de la portada') : (w.visible ? '👁 Visible en la web' : '🙈 Oculta al público'));
      renderGrid();
    } else if (a === 'up') {
      const i = works.indexOf(w);
      [works[i - 1], works[i]] = [works[i], works[i - 1]];
      renderGrid();
      clearTimeout(orderT);
      orderT = window.setTimeout(async () => { await api('works/reorder', { method: 'POST', json: { ids: works.map((x) => x.id) } }); toast('Orden guardado'); }, 800);
    } else if (a === 'del') {
      if (!confirm(`¿Borrar "${w.title}" de la web? Esta acción no se puede deshacer.\n\nSi solo quieres esconderla, usa 👁 en lugar de borrar.`)) return;
      await api(`works/${encodeURIComponent(id)}`, { method: 'DELETE' });
      works = works.filter((x) => x.id !== id);
      toast('Trabajo borrado');
      renderGrid();
    } else if (a === 'edit') editWork(w);
  } catch (e: any) { toast(e.message, true); }
}

function modal(html: string) {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="modal__box" role="dialog" aria-modal="true">${html}</div>`;
  m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
  document.body.appendChild(m);
  return m;
}

function editWork(w: Work) {
  const m = modal(`<h3>Editar trabajo</h3><form>
    <img src="${esc(w.thumb)}" alt="" style="border-radius:12px;margin-bottom:14px;max-height:220px;width:100%;object-fit:cover">
    <label class="f"><span>Título</span><input type="text" name="title" maxlength="120" value="${esc(w.title)}"></label>
    <div class="row"><label class="f"><span>Tipo</span><select name="category">${catOptions(w.category)}</select></label>
    <label class="f"><span>Fecha</span><input type="date" name="date" value="${esc(w.date)}"></label></div>
    <label class="f"><span>Lugar</span><input type="text" name="location" maxlength="80" value="${esc(w.location ?? '')}"></label>
    <label class="f"><span>Descripción</span><textarea name="description" maxlength="600">${esc(w.description ?? '')}</textarea></label>
    <div style="display:flex;gap:10px"><button class="b b--ghost" type="button" data-close>Cancelar</button><button class="b b--red" style="flex:1" type="submit">Guardar cambios</button></div>
  </form>`);
  $('[data-close]', m).addEventListener('click', () => m.remove());
  $('form', m).addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      Object.assign(w, await api<Work>(`works/${encodeURIComponent(w.id)}`, { method: 'PATCH', json: Object.fromEntries(new FormData(e.target as HTMLFormElement)) }));
      m.remove(); toast('✓ Cambios guardados'); renderGrid();
    } catch (x: any) { toast(x.message, true); }
  });
}

// ── Textos ─────────────────────────────────────────────────
async function viewTextos(v: HTMLElement) {
  v.innerHTML = '<div class="spin"></div>';
  const s = await api('settings');
  const F = (name: string, label: string, val: string, area = false, hint = '') => `<label class="f"><span>${label}</span>${area ? `<textarea name="${name}" maxlength="1200">${esc(val)}</textarea>` : `<input type="text" name="${name}" maxlength="300" value="${esc(val)}">`}${hint ? `<small>${hint}</small>` : ''}</label>`;
  v.innerHTML = `<form data-form>
    <div class="help">💡 Los cambios se ven en la web apenas guardas (a veces tarda unos segundos).</div>
    <section class="card"><h2>Portada (lo primero que se ve)</h2><p class="sub">Texto grande sobre el módulo que gira.</p>
      ${F('hero.eyebrow', 'Línea pequeña de arriba', s.hero.eyebrow)}
      ${F('hero.title', 'Título', s.hero.title)}
      ${F('hero.highlight', 'Final del título (en color)', s.hero.highlight)}
      ${F('hero.lead', 'Texto de apoyo', s.hero.lead, true)}
      ${F('hero.cta', 'Texto del botón de WhatsApp', s.hero.cta)}
    </section>
    <section class="card"><h2>Quiénes somos</h2>
      ${F('intro.title', 'Título', s.intro.title)}
      ${F('intro.body', 'Texto', s.intro.body, true)}
      <p class="sub" style="margin-top:12px"><b>Cifras</b> (solo datos reales)</p>
      ${s.stats.map((st: any, i: number) => `<div class="row">${F(`stats.${i}.value`, `Cifra ${i + 1}`, st.value)}${F(`stats.${i}.label`, 'Descripción', st.label)}</div>`).join('')}
    </section>
    <section class="card"><h2>Taller / Nosotros</h2>
      ${F('about.title', 'Título', s.about.title)}
      ${F('about.body', 'Historia de la empresa', s.about.body, true)}
    </section>
    <section class="card"><h2>Llamado final</h2>
      ${F('cta.title', 'Título', s.cta.title)}
      ${F('cta.body', 'Texto', s.cta.body, true)}
    </section>
    <section class="card"><h2>Aviso superior</h2><p class="sub">Una franja de color arriba de toda la web, para promociones o noticias.</p>
      <div class="tog"><div><b>Mostrar aviso</b></div><span class="sw-t"><input type="checkbox" name="announcement.active" ${s.announcement.active ? 'checked' : ''}><i></i></span></div>
      ${F('announcement.text', 'Texto del aviso', s.announcement.text)}
    </section>
    <div class="bar"><button class="b b--red b--block" type="submit">Guardar textos</button></div>
  </form>`;
  bindSettingsForm(v);
}

function formToPatch(form: HTMLFormElement) {
  const out: any = {};
  const set = (path: string, val: unknown) => {
    const ks = path.split('.');
    let o = out;
    ks.slice(0, -1).forEach((k, i) => { const nextIsIdx = /^\d+$/.test(ks[i + 1]); o[k] ??= nextIsIdx ? [] : {}; o = o[k]; });
    o[ks.at(-1)!] = val;
  };
  $$<HTMLInputElement>('input, textarea, select', form).forEach((i) => {
    if (!i.name) return;
    if (i.type === 'checkbox') set(i.name, i.checked);
    else if (i.type === 'radio') { if (i.checked) set(i.name, i.value); }
    else set(i.name, i.value);
  });
  return out;
}

function bindSettingsForm(v: HTMLElement) {
  const form = $<HTMLFormElement>('[data-form]', v);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const b = $<HTMLButtonElement>('button[type=submit]', form);
    b.disabled = true;
    try { await api('settings', { method: 'PUT', json: formToPatch(form) }); toast('✓ Guardado. Ya se ve en la web'); }
    catch (x: any) { toast(x.message, true); }
    b.disabled = false;
  });
}

// ── Diseño ─────────────────────────────────────────────────
async function viewDiseno(v: HTMLElement) {
  v.innerHTML = '<div class="spin"></div>';
  const s = await api('settings');
  const d = s.design;
  const SEC: [string, string, string][] = [
    ['clientes', 'Tiendas donde trabajamos', 'Franja con nombres de tiendas que se desliza'],
    ['obras', 'Obras destacadas', 'Galería horizontal con las fotos ⭐'],
    ['servicios', 'Servicios', 'Lista de especialidades'],
    ['recientes', 'Recién salido del taller', 'Las últimas fotos subidas, con fecha'],
    ['proceso', 'Cómo trabajamos', 'Los 5 pasos'],
    ['cotizador', 'Cotizador', 'Formulario que arma el mensaje de WhatsApp'],
    ['faq', 'Preguntas frecuentes', ''],
  ];
  v.innerHTML = `<form data-form>
    <section class="card"><h2>Color principal</h2><p class="sub">Botones, detalles y acentos de toda la web.</p>
      <div class="sw">${ACCENTS.map((a) => `<label><input type="radio" name="design.accent" value="${a.value}" ${a.value === d.accent ? 'checked' : ''}><i style="background:${a.value}"></i>${esc(a.label)}</label>`).join('')}
      <label><input type="radio" name="design.accent" value="${esc(d.accent)}" data-custom ${ACCENTS.some((a) => a.value === d.accent) ? '' : 'checked'}><i style="background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red)"></i>Otro <input type="color" value="${esc(d.accent)}" data-color style="width:54px;height:30px;border:0;padding:0"></label></div>
    </section>
    <section class="card"><h2>Portada</h2>
      <div class="tog"><div><b>Módulo 3D que gira con el scroll</b><small>Si lo apagas, se muestra una imagen fija.</small></div><span class="sw-t"><input type="checkbox" name="design.heroVideo" ${d.heroVideo ? 'checked' : ''}><i></i></span></div>
    </section>
    <section class="card"><h2>Secciones de la portada</h2><p class="sub">Enciende o apaga cada bloque.</p>
      ${SEC.map(([k, l, h]) => `<div class="tog"><div><b>${l}</b>${h ? `<small>${h}</small>` : ''}</div><span class="sw-t"><input type="checkbox" name="design.sections.${k}" ${d.sections[k] ? 'checked' : ''}><i></i></span></div>`).join('')}
    </section>
    <div class="bar"><a class="b b--ghost" href="/" target="_blank" rel="noopener">Ver web</a><button class="b b--red" style="flex:1" type="submit">Guardar diseño</button></div>
  </form>`;
  const color = $<HTMLInputElement>('[data-color]', v);
  const custom = $<HTMLInputElement>('[data-custom]', v);
  color.addEventListener('input', () => { custom.value = color.value; custom.checked = true; });
  bindSettingsForm(v);
}

// ── Usuarios ───────────────────────────────────────────────
async function viewUsuarios(v: HTMLElement) {
  v.innerHTML = '<div class="spin"></div>';
  const users = await api<User[]>('users');
  const roleOpts = (sel: Role) => (Object.keys(S.roles) as Role[]).map((r) => `<option value="${r}" ${r === sel ? 'selected' : ''}>${S.roles[r].label}</option>`).join('');
  v.innerHTML = `
  <section class="card"><h2>Quién puede entrar</h2><p class="sub">Da acceso a tu familia o equipo. Cada uno entra con su propio usuario.</p>
    <ul class="roles">${(Object.keys(S.roles) as Role[]).map((r) => `<li><b>${S.roles[r].label}:</b> ${esc(S.roles[r].desc)}</li>`).join('')}</ul>
    ${users.map((u) => `<div class="u" data-u="${esc(u.id)}">
      <div><div class="u__name">${esc(u.name)} ${u.id === me.id ? '(tú)' : ''} ${u.active ? '' : '· <span style="color:var(--red)">desactivado</span>'}</div>
      <div class="u__meta">@${esc(u.username)} · ${u.lastLogin ? 'último ingreso ' + fdate(u.lastLogin) : 'aún no ingresa'}</div></div>
      <div class="u__act">
        <select data-role aria-label="Rol">${roleOpts(u.role)}</select>
        <button class="b b--ghost b--sm" type="button" data-pw>Clave</button>
        <button class="b b--ghost b--sm" type="button" data-act>${u.active ? 'Pausar' : 'Activar'}</button>
        ${u.id === me.id ? '' : '<button class="b b--ghost b--sm" type="button" data-del>🗑</button>'}
      </div></div>`).join('')}
  </section>
  <section class="card"><h2>Agregar persona</h2>
    <form data-new>
      <div class="row"><label class="f"><span>Nombre</span><input type="text" name="name" required placeholder="Ej.: Tío Carlos"></label>
      <label class="f"><span>Usuario</span><input type="text" name="username" required autocapitalize="none" placeholder="ej.: carlos"></label></div>
      <div class="row"><label class="f"><span>Contraseña inicial</span><input type="text" name="password" required minlength="8" placeholder="mínimo 8 caracteres"><small>Compártela por WhatsApp; luego cada uno puede cambiarla.</small></label>
      <label class="f"><span>Permisos</span><select name="role">${roleOpts('colaborador')}</select></label></div>
      <button class="b b--red" type="submit">Crear acceso</button>
    </form>
  </section>`;
  $$('[data-u]', v).forEach((row) => {
    const id = row.dataset.u!;
    $('[data-role]', row).addEventListener('change', async (e) => {
      try { await api(`users/${id}`, { method: 'PATCH', json: { role: (e.target as HTMLSelectElement).value } }); toast('✓ Permisos actualizados'); }
      catch (x: any) { toast(x.message, true); viewUsuarios(v); }
    });
    $('[data-pw]', row).addEventListener('click', async () => {
      const u = users.find((x) => x.id === id)!;
      const pw = prompt(`Nueva contraseña para ${u.name} (mínimo 8 caracteres):`, suggestPassword());
      if (!pw) return;
      try { await api(`users/${id}`, { method: 'PATCH', json: { password: pw } }); shareAccess(u.name, u.username, pw, u.role, true); } catch (x: any) { toast(x.message, true); }
    });
    $('[data-act]', row).addEventListener('click', async () => {
      const u = users.find((x) => x.id === id)!;
      try { await api(`users/${id}`, { method: 'PATCH', json: { active: !u.active } }); viewUsuarios(v); } catch (x: any) { toast(x.message, true); }
    });
    row.querySelector('[data-del]')?.addEventListener('click', async () => {
      if (!confirm('¿Quitar el acceso de esta persona? Sus fotos se quedan en la web.')) return;
      try { await api(`users/${id}`, { method: 'DELETE' }); toast('Acceso eliminado'); viewUsuarios(v); } catch (x: any) { toast(x.message, true); }
    });
  });
  $('[data-new]', v).addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target as HTMLFormElement)) as Record<string, string>;
    try {
      const u = await api<User>('users', { method: 'POST', json: data });
      viewUsuarios(v);
      shareAccess(u.name, u.username, data.password, u.role, false);
    } catch (x: any) { toast(x.message, true); }
  });
  const pwIn = $<HTMLInputElement>('[data-new] input[name=password]', v);
  if (!pwIn.value) pwIn.value = suggestPassword();
}

/** Contraseña fácil de dictar/escribir en el celular: palabra + 4 números (ej.: "madera4821"). */
function suggestPassword() {
  const words = ['madera', 'taller', 'modulo', 'acero', 'cedro', 'roble', 'lacado', 'repisa', 'vitrina', 'mueble'];
  const n = crypto.getRandomValues(new Uint32Array(2));
  return words[n[0] % words.length] + String(1000 + (n[1] % 9000));
}

/** Tras crear o resetear un acceso: mensaje listo para mandar por WhatsApp (el propietario elige el contacto). */
function shareAccess(name: string, username: string, password: string, role: Role, reset: boolean) {
  const url = `${location.origin}/admin`;
  const first = name.split(' ')[0];
  const que = role === 'colaborador'
    ? 'subir fotos de los trabajos (con su fecha) para que la web se vea siempre al día'
    : 'subir fotos, elegir qué trabajos salen en la portada y cambiar los textos de la web';
  const msg = [
    `Hola ${first} 👋`,
    reset ? 'Te cambié la contraseña del panel de la web de INFA.' : `Ya tienes acceso al panel de la web de INFA. Desde ahí puedes ${que}.`,
    '',
    `1️⃣ Entra aquí: ${url}`,
    `2️⃣ Usuario: ${username}`,
    `3️⃣ Contraseña: ${password}`,
    '',
    '📲 Para tenerlo como app en tu celular:',
    '• Android (Chrome): toca ⋮ → "Agregar a pantalla principal" o "Instalar app".',
    '• iPhone (Safari): toca Compartir ⬆️ → "Agregar a inicio".',
    '',
    'Tu sesión queda abierta 30 días. Puedes cambiar tu contraseña en "🔒 Mi cuenta".',
  ].join('\n');
  const m = modal(`<h3>✓ ${reset ? 'Contraseña cambiada' : 'Acceso creado'} para ${esc(name)}</h3>
    <p class="sub">Envíale este mensaje. Al tocar el botón se abre WhatsApp y eliges a quién mandarlo.</p>
    <pre style="white-space:pre-wrap;background:#f6f7f9;border-radius:12px;padding:12px;font:inherit;font-size:.88rem;margin:0 0 14px">${esc(msg)}</pre>
    <div style="display:grid;gap:10px">
      <a class="b b--ok b--block" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Enviar por WhatsApp</a>
      <button class="b b--ghost b--block" type="button" data-copy>Copiar mensaje</button>
      ${navigator.share ? '<button class="b b--ghost b--block" type="button" data-share>Compartir por otra app</button>' : ''}
      <button class="b b--ghost b--block" type="button" data-close>Listo</button>
    </div>`);
  $('[data-close]', m).addEventListener('click', () => m.remove());
  $('[data-copy]', m).addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(msg); toast('✓ Mensaje copiado'); } catch { toast('No se pudo copiar; selecciónalo a mano', true); }
  });
  m.querySelector('[data-share]')?.addEventListener('click', () => navigator.share({ text: msg }).catch(() => {}));
}

// ── Instalar el panel como app en el celular ───────────────
let installEvt: any = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; $('[data-install-go]')?.removeAttribute('hidden'); });
function installBanner() {
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
  let dismissed = false;
  try { dismissed = localStorage.getItem('infa-install-hide') === '1'; } catch {}
  if (standalone || dismissed || !matchMedia('(max-width: 900px)').matches) return '';
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<div class="help" data-install style="display:flex;gap:10px;align-items:flex-start;margin:12px 16px 0">
    <div style="flex:1">📲 <b>Ten el panel como app.</b> ${ios ? 'En Safari toca Compartir ⬆️ → "Agregar a inicio".' : 'Toca ⋮ del navegador → "Agregar a pantalla principal".'}
      <div><button class="b b--sm" type="button" data-install-go ${installEvt ? '' : 'hidden'} style="margin-top:8px">Instalar ahora</button></div></div>
    <button type="button" data-install-x aria-label="Ocultar" style="border:0;background:none;font-size:20px;cursor:pointer">×</button></div>`;
}
function bindInstall() {
  $('[data-install-x]')?.addEventListener('click', () => { try { localStorage.setItem('infa-install-hide', '1'); } catch {} $('[data-install]')?.remove(); });
  $('[data-install-go]')?.addEventListener('click', async () => {
    if (!installEvt) return;
    installEvt.prompt();
    const r = await installEvt.userChoice.catch(() => null);
    if (r?.outcome === 'accepted') $('[data-install]')?.remove();
    installEvt = null;
  });
}

// ── Mi cuenta ──────────────────────────────────────────────
function viewCuenta(v: HTMLElement) {
  v.innerHTML = `<section class="card"><h2>Mi cuenta</h2><p class="sub">@${esc(me.username)} · ${esc(S.roles[me.role].label)}: ${esc(S.roles[me.role].desc)}</p>
    <form data-pw>
      <label class="f"><span>Contraseña actual</span><input type="password" name="current" autocomplete="current-password" required></label>
      <label class="f"><span>Nueva contraseña</span><input type="password" name="next" autocomplete="new-password" minlength="8" required><small>Mínimo 8 caracteres.</small></label>
      <button class="b b--red" type="submit">Cambiar contraseña</button>
    </form></section>
    <section class="card"><h2>📲 Tener el panel como app</h2>
      <p class="sub"><b>Android (Chrome):</b> toca ⋮ arriba a la derecha → "Agregar a pantalla principal" o "Instalar app".<br>
      <b>iPhone (Safari):</b> toca Compartir ⬆️ abajo → "Agregar a inicio".<br>
      Aparecerá el ícono <b>Panel INFA</b>. Tu sesión queda abierta 30 días, así que no tendrás que escribir la contraseña cada vez.</p></section>`;
  $('[data-pw]', v).addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target as HTMLFormElement;
    try { await api('password', { method: 'POST', json: Object.fromEntries(new FormData(f)) }); toast('✓ Contraseña cambiada'); f.reset(); }
    catch (x: any) { toast(x.message, true); }
  });
}

// ── Arranque ───────────────────────────────────────────────
async function boot() {
  S = await api<Session>('session');
  const flag = (on: boolean) => { document.cookie = `infa_team=${on ? '1' : ''}; Path=/; SameSite=Lax; Max-Age=${on ? 2592000 : 0}${location.protocol === 'https:' ? '; Secure' : ''}`; };
  if (!S.user) { flag(false); return renderAuth(S.setupNeeded); }
  flag(true);
  me = S.user;
  renderShell();
}
boot().catch((e) => { app.innerHTML = `<div class="auth"><div class="auth__card"><p class="err">${esc(e.message)}</p><button class="b" onclick="location.reload()">Reintentar</button></div></div>`; });
