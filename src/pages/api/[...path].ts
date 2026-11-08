/**
 * API del panel /admin (función de Vercel). Un solo enrutador pequeño para todo.
 * Todas las escrituras exigen sesión + mismo origen (protección CSRF).
 */
import type { APIRoute } from 'astro';
import {
  ROLES, can, checkLock, clearCookie, currentUser, hashPassword, listUsers, newId, normalizeUsername,
  publicUser, registerAttempt, saveUsers, sessionCookie, validatePassword, verifyPassword, type Role, type User,
} from '@/lib/server/auth';
import { getSettings, getWorks, saveSettings, saveWorks } from '@/lib/server/content';
import { purgeContentCache, store } from '@/lib/server/store';
import { WORK_CATEGORIES, type Work, type WorkCategory } from '@/data/works';

export const prerender = false;

const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });
const err = (message: string, status = 400) => json({ error: message }, status);

const isSecure = (req: Request) => new URL(req.url).protocol === 'https:';
const sameOrigin = (req: Request) => {
  const o = req.headers.get('origin');
  return !o || new URL(o).host === new URL(req.url).host;
};
const body = async (req: Request) => { try { return await req.json(); } catch { return {}; } };
const str = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const today = () => new Date().toISOString().slice(0, 10);
const ALLOWED_IMG = ['image/webp', 'image/jpeg', 'image/png', 'image/avif'];

export const ALL: APIRoute = async ({ request, params }) => {
  const parts = (params.path ?? '').split('/').filter(Boolean);
  const [res, id, sub] = parts;
  const method = request.method;

  // ── Media pública (las fotos subidas) ───────────────────────────
  if (res === 'media' && method === 'GET') {
    const key = parts.slice(1).join('/');
    if (!/^u\/[\w-]+\.(webp|jpg|jpeg|png|avif)$/.test(key)) return err('No encontrado', 404);
    const bin = await (await store()).getBin(key);
    if (!bin) return err('No encontrado', 404);
    return new Response(bin.data, { headers: { 'Content-Type': bin.contentType, 'Cache-Control': 'public, max-age=31536000, immutable', 'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable' } });
  }

  if (method !== 'GET' && !sameOrigin(request)) return err('Origen no permitido', 403);

  const users = await listUsers();
  const me = await currentUser(request);

  // ── Sesión ──────────────────────────────────────────────────────
  if (res === 'session' && method === 'GET') {
    return json({ user: me ? publicUser(me) : null, setupNeeded: users.length === 0, roles: ROLES, categories: WORK_CATEGORIES });
  }

  if (res === 'setup' && method === 'POST') {
    if (users.length > 0) return err('El panel ya fue configurado.', 409);
    const b = await body(request);
    const code = process.env.INFA_SETUP_CODE;
    if (!import.meta.env.DEV) {
      if (!code) return err('Falta la variable INFA_SETUP_CODE en Vercel. Agrégala y vuelve a intentar.', 503);
      if (str(b.code) !== code) return err('Código de configuración incorrecto.', 401);
    }
    const pwErr = validatePassword(b.password);
    if (pwErr) return err(pwErr);
    const username = normalizeUsername(b.username);
    if (username.length < 3) return err('El usuario debe tener al menos 3 caracteres.');
    const u: User = { id: newId(), username, name: str(b.name, 60) || username, role: 'propietario', active: true, createdAt: new Date().toISOString(), ...(await hashPassword(b.password)) };
    await saveUsers([u]);
    return json({ user: publicUser(u) }, 201, { 'Set-Cookie': await sessionCookie(u, isSecure(request)) });
  }

  if (res === 'login' && method === 'POST') {
    const b = await body(request);
    const username = normalizeUsername(b.username);
    const locked = await checkLock(username);
    if (locked) return err(`Demasiados intentos. Espera ${locked} min.`, 429);
    const u = users.find((x) => x.username === username && x.active);
    const ok = !!u && typeof b.password === 'string' && (await verifyPassword(u, b.password));
    await registerAttempt(username, ok);
    if (!ok || !u) return err('Usuario o contraseña incorrectos.', 401);
    u.lastLogin = new Date().toISOString();
    await saveUsers(users);
    return json({ user: publicUser(u) }, 200, { 'Set-Cookie': await sessionCookie(u, isSecure(request)) });
  }

  if (res === 'logout' && method === 'POST') return json({ ok: true }, 200, { 'Set-Cookie': clearCookie(isSecure(request)) });

  // ── A partir de aquí: requiere sesión ───────────────────────────
  if (!me) return err('Inicia sesión.', 401);

  if (res === 'password' && method === 'POST') {
    const b = await body(request);
    if (!(await verifyPassword(me, String(b.current ?? '')))) return err('La contraseña actual no es correcta.', 401);
    const pwErr = validatePassword(b.next);
    if (pwErr) return err(pwErr);
    Object.assign(me, await hashPassword(b.next));
    await saveUsers(users);
    return json({ ok: true }, 200, { 'Set-Cookie': await sessionCookie(me, isSecure(request)) });
  }

  // ── Textos y diseño ─────────────────────────────────────────────
  if (res === 'settings') {
    if (method === 'GET') return json(await getSettings());
    if (method === 'PUT') {
      if (!can(me, 'editor')) return err('Tu rol no puede editar textos ni diseño.', 403);
      const s = await saveSettings(await body(request));
      await purgeContentCache();
      return json(s);
    }
  }

  // ── Trabajos / fotos ────────────────────────────────────────────
  if (res === 'works') {
    const works = await getWorks();
    const owns = (w: Work) => can(me, 'editor') || w.uploaderId === me.id;

    if (method === 'GET' && !id) return json(works);

    if (method === 'POST' && !id) {
      const fd = await request.formData();
      const full = fd.get('full'), thumb = fd.get('thumb');
      if (!(full instanceof File) || !(thumb instanceof File)) return err('Falta la imagen.');
      if (!ALLOWED_IMG.includes(full.type) || !ALLOWED_IMG.includes(thumb.type)) return err('Formato de imagen no permitido.');
      if (full.size > 5.5e6 || thumb.size > 1e6) return err('La imagen es demasiado pesada.');
      const ext = full.type === 'image/jpeg' ? 'jpg' : full.type.split('/')[1];
      const key = newId();
      const s = await store();
      await s.setBin(`u/${key}.${ext}`, await full.arrayBuffer(), full.type);
      await s.setBin(`u/${key}-t.${ext}`, await thumb.arrayBuffer(), thumb.type);
      const cat = str(fd.get('category'), 30) as WorkCategory;
      const date = str(fd.get('date'), 10);
      const w: Work = {
        id: key,
        title: str(fd.get('title'), 120) || 'Nuevo trabajo',
        description: str(fd.get('description'), 600),
        category: cat in WORK_CATEGORIES ? cat : 'exhibicion',
        location: str(fd.get('location'), 80),
        date: isDate(date) ? date : today(),
        src: `/api/media/u/${key}.${ext}`,
        thumb: `/api/media/u/${key}-t.${ext}`,
        w: Math.max(1, Math.min(10000, Number(fd.get('w')) || 1600)),
        h: Math.max(1, Math.min(10000, Number(fd.get('h')) || 1200)),
        featured: can(me, 'editor') && fd.get('featured') === 'true',
        visible: true,
        order: Math.min(0, ...works.map((x) => x.order)) - 1, // lo nuevo, primero
        uploadedBy: me.name,
        uploaderId: me.id,
        createdAt: new Date().toISOString(),
      };
      works.unshift(w);
      await saveWorks(works);
      await purgeContentCache();
      return json(w, 201);
    }

    if (method === 'POST' && id === 'reorder') {
      if (!can(me, 'editor')) return err('Tu rol no puede reordenar.', 403);
      const b = await body(request);
      const ids: string[] = Array.isArray(b.ids) ? b.ids : [];
      ids.forEach((wid, i) => { const w = works.find((x) => x.id === wid); if (w) w.order = i; });
      await saveWorks(works);
      await purgeContentCache();
      return json({ ok: true });
    }

    const w = works.find((x) => x.id === id);
    if (!w) return err('Trabajo no encontrado.', 404);
    if (!owns(w)) return err('Solo puedes editar tus propias fotos.', 403);

    if (method === 'PATCH') {
      const b = await body(request);
      if ('title' in b) w.title = str(b.title, 120) || w.title;
      if ('description' in b) w.description = str(b.description, 600);
      if ('location' in b) w.location = str(b.location, 80);
      if ('date' in b && isDate(str(b.date, 10))) w.date = str(b.date, 10);
      if ('category' in b && b.category in WORK_CATEGORIES) w.category = b.category;
      if ('visible' in b) w.visible = !!b.visible;
      if ('featured' in b && can(me, 'editor')) w.featured = !!b.featured;
      await saveWorks(works);
      await purgeContentCache();
      return json(w);
    }

    if (method === 'DELETE') {
      if (w.src.startsWith('/api/media/')) {
        const s = await store();
        await s.del(w.src.replace('/api/media/', ''));
        await s.del(w.thumb.replace('/api/media/', ''));
      }
      await saveWorks(works.filter((x) => x.id !== w.id));
      await purgeContentCache();
      return json({ ok: true });
    }
  }

  // ── Usuarios (solo propietario) ─────────────────────────────────
  if (res === 'users') {
    if (!can(me, 'propietario')) return err('Solo un propietario puede gestionar usuarios.', 403);
    if (method === 'GET') return json(users.map(publicUser));

    if (method === 'POST' && !id) {
      const b = await body(request);
      const username = normalizeUsername(b.username);
      if (username.length < 3) return err('El usuario debe tener al menos 3 caracteres.');
      if (users.some((u) => u.username === username)) return err('Ese usuario ya existe.', 409);
      const role: Role = b.role in ROLES ? b.role : 'colaborador';
      const pwErr = validatePassword(b.password);
      if (pwErr) return err(pwErr);
      const u: User = { id: newId(), username, name: str(b.name, 60) || username, role, active: true, createdAt: new Date().toISOString(), ...(await hashPassword(b.password)) };
      users.push(u);
      await saveUsers(users);
      return json(publicUser(u), 201);
    }

    const u = users.find((x) => x.id === id);
    if (!u) return err('Usuario no encontrado.', 404);
    const owners = users.filter((x) => x.role === 'propietario' && x.active);
    const lastOwner = u.role === 'propietario' && owners.length <= 1;

    if (method === 'PATCH') {
      const b = await body(request);
      if ('name' in b) u.name = str(b.name, 60) || u.name;
      if ('role' in b && b.role in ROLES) {
        if (lastOwner && b.role !== 'propietario') return err('Debe quedar al menos un propietario.');
        u.role = b.role;
      }
      if ('active' in b) {
        if (lastOwner && !b.active) return err('No puedes desactivar al único propietario.');
        u.active = !!b.active;
      }
      if (sub === 'password' || 'password' in b) {
        const pwErr = validatePassword(b.password);
        if (pwErr) return err(pwErr);
        Object.assign(u, await hashPassword(b.password));
      }
      await saveUsers(users);
      return json(publicUser(u));
    }
    if (method === 'DELETE') {
      if (lastOwner) return err('No puedes eliminar al único propietario.');
      if (u.id === me.id) return err('No puedes eliminar tu propia cuenta.');
      await saveUsers(users.filter((x) => x.id !== u.id));
      return json({ ok: true });
    }
  }

  return err('Ruta no encontrada.', 404);
};
