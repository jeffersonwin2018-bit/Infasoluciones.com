/**
 * Usuarios, roles y sesiones del panel /admin.
 *
 * Roles (de más a menos permisos):
 *  - propietario : todo (usuarios, textos, diseño, trabajos, fotos). Ej.: el dueño y su hijo.
 *  - editor      : textos, diseño, trabajos y fotos de todos. No gestiona usuarios.
 *  - colaborador : sube fotos y edita/borra SOLO las suyas. Ej.: familiares que aportan fotos.
 *
 * Contraseñas con scrypt + sal. Sesión en cookie HttpOnly firmada con HMAC (sin base de datos de sesiones).
 */
import crypto from 'node:crypto';
import { store } from './store';

export type Role = 'propietario' | 'editor' | 'colaborador';
export const ROLES: Record<Role, { label: string; rank: number; desc: string }> = {
  propietario: { label: 'Propietario', rank: 3, desc: 'Control total: usuarios, textos, diseño, trabajos y fotos.' },
  editor: { label: 'Editor', rank: 2, desc: 'Edita textos, diseño y todos los trabajos. No gestiona usuarios.' },
  colaborador: { label: 'Colaborador', rank: 1, desc: 'Sube fotos y edita solo las suyas.' },
};

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  hash: string;
  salt: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}
export type PublicUser = Omit<User, 'hash' | 'salt'>;
export const publicUser = ({ hash, salt, ...u }: User): PublicUser => u;

const USERS_KEY = 'users';
const COOKIE = 'infa_s';
const SESSION_DAYS = 30;

export async function listUsers(): Promise<User[]> {
  return (await (await store()).getJSON<User[]>(USERS_KEY)) ?? [];
}
export async function saveUsers(users: User[]) {
  await (await store()).setJSON(USERS_KEY, users);
}

const scrypt = (pw: string, salt: string) =>
  new Promise<string>((res, rej) => crypto.scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? rej(e) : res(k.toString('hex')))));

export async function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt, hash: await scrypt(pw, salt) };
}
export async function verifyPassword(u: User, pw: string) {
  const h = await scrypt(pw, u.salt);
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(u.hash, 'hex'));
}

export function validatePassword(pw: unknown): string | null {
  if (typeof pw !== 'string' || pw.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (pw.length > 200) return 'Contraseña demasiado larga.';
  return null;
}
export function normalizeUsername(u: unknown) {
  return String(u ?? '').trim().toLowerCase().replace(/\s+/g, '.').slice(0, 40);
}

// ── Secreto de firma: variable de entorno o uno generado y guardado una sola vez ──
let secretP: Promise<Buffer> | null = null;
function secret() {
  if (!secretP) {
    secretP = (async () => {
      if (process.env.INFA_SESSION_SECRET) return Buffer.from(process.env.INFA_SESSION_SECRET);
      const s = await store();
      let v = await s.getJSON<{ k: string }>('config/session-secret');
      if (!v) { v = { k: crypto.randomBytes(48).toString('hex') }; await s.setJSON('config/session-secret', v); }
      return Buffer.from(v.k);
    })();
  }
  return secretP;
}

const b64 = (s: string) => Buffer.from(s).toString('base64url');
async function sign(payload: object) {
  const body = b64(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', await secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}
async function unsign(token: string): Promise<any | null> {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expect = crypto.createHmac('sha256', await secret()).update(body).digest('base64url');
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()); } catch { return null; }
}

export async function sessionCookie(u: User, secure: boolean) {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  // `v` = fragmento del hash: si cambia la contraseña, las sesiones viejas dejan de valer.
  const token = await sign({ id: u.id, exp, v: u.hash.slice(0, 12) });
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure ? '; Secure' : ''}`;
}
export const clearCookie = (secure: boolean) => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
/** Marca visible para JS (sin datos): solo sirve para mostrar el botón "Editar web" en el sitio. */
export const flagCookie = (on: boolean, secure: boolean) =>
  `infa_team=${on ? '1' : ''}; Path=/; SameSite=Lax; Max-Age=${on ? SESSION_DAYS * 86400 : 0}${secure ? '; Secure' : ''}`;

export async function currentUser(request: Request): Promise<User | null> {
  const raw = request.headers.get('cookie') ?? '';
  const m = raw.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return null;
  const p = await unsign(m[1]);
  if (!p || typeof p.exp !== 'number' || p.exp < Date.now()) return null;
  const u = (await listUsers()).find((x) => x.id === p.id);
  if (!u || !u.active || u.hash.slice(0, 12) !== p.v) return null;
  return u;
}

export const can = (u: User | null, min: Role) => !!u && ROLES[u.role].rank >= ROLES[min].rank;

// ── Freno a fuerza bruta: 8 intentos fallidos → 15 min de bloqueo por usuario ──
interface Attempts { [username: string]: { n: number; until?: number } }
export async function checkLock(username: string) {
  const a = (await (await store()).getJSON<Attempts>('config/login-attempts')) ?? {};
  const r = a[username];
  return r?.until && r.until > Date.now() ? Math.ceil((r.until - Date.now()) / 60000) : 0;
}
export async function registerAttempt(username: string, ok: boolean) {
  const s = await store();
  const a = (await s.getJSON<Attempts>('config/login-attempts')) ?? {};
  if (ok) delete a[username];
  else {
    const r = a[username] ?? { n: 0 };
    r.n += 1;
    if (r.n >= 8) { r.until = Date.now() + 15 * 60000; r.n = 0; }
    a[username] = r;
  }
  await s.setJSON('config/login-attempts', a);
}

export const newId = () => crypto.randomBytes(9).toString('base64url');
