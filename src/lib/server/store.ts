/**
 * Almacenamiento del panel (fotos, trabajos, textos, usuarios).
 * - En Vercel: Vercel Blob en modo PRIVADO (nadie puede leer los datos sin pasar por la API).
 *   Requiere la variable BLOB_READ_WRITE_TOKEN (Vercel la crea al conectar el Blob store al proyecto).
 * - En local (`npm run dev`) sin token: carpeta `.data/` del proyecto.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

type Bin = { data: ArrayBuffer; contentType: string };

interface Backend {
  getJSON<T>(key: string): Promise<T | null>;
  setJSON(key: string, value: unknown): Promise<void>;
  getBin(key: string): Promise<Bin | null>;
  setBin(key: string, data: ArrayBuffer, contentType: string): Promise<void>;
  del(key: string): Promise<void>;
}

const LOCAL_DIR = path.resolve(process.cwd(), '.data');
const safe = (k: string) => k.replace(/[^a-zA-Z0-9._/-]/g, '_');

const localBackend: Backend = {
  async getJSON(key) {
    try { return JSON.parse(await fs.readFile(path.join(LOCAL_DIR, safe(key) + '.json'), 'utf8')); } catch { return null; }
  },
  async setJSON(key, value) {
    const f = path.join(LOCAL_DIR, safe(key) + '.json');
    await fs.mkdir(path.dirname(f), { recursive: true });
    await fs.writeFile(f, JSON.stringify(value, null, 2));
  },
  async getBin(key) {
    try {
      const f = path.join(LOCAL_DIR, 'bin', safe(key));
      const buf = await fs.readFile(f);
      const ct = await fs.readFile(f + '.type', 'utf8').catch(() => 'application/octet-stream');
      return { data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, contentType: ct };
    } catch { return null; }
  },
  async setBin(key, data, contentType) {
    const f = path.join(LOCAL_DIR, 'bin', safe(key));
    await fs.mkdir(path.dirname(f), { recursive: true });
    await fs.writeFile(f, Buffer.from(data));
    await fs.writeFile(f + '.type', contentType);
  },
  async del(key) {
    await fs.rm(path.join(LOCAL_DIR, safe(key) + '.json'), { force: true });
    await fs.rm(path.join(LOCAL_DIR, 'bin', safe(key)), { force: true });
    await fs.rm(path.join(LOCAL_DIR, 'bin', safe(key) + '.type'), { force: true });
  },
};

async function vercelBackend(): Promise<Backend> {
  const { get, put, del } = await import('@vercel/blob');
  const opts = { access: 'private' as const };
  const read = async (pathname: string, fresh: boolean) => {
    const r = await get(pathname, { ...opts, useCache: !fresh });
    if (!r || !r.stream) return null;
    const data = await new Response(r.stream).arrayBuffer();
    return { data, contentType: r.blob?.contentType || 'application/octet-stream' };
  };
  return {
    async getJSON(key) {
      // useCache:false → siempre la última versión (los datos del panel se leen y escriben a menudo)
      const r = await read(`data/${key}.json`, true);
      return r ? JSON.parse(new TextDecoder().decode(r.data)) : null;
    },
    async setJSON(key, value) {
      await put(`data/${key}.json`, JSON.stringify(value), { ...opts, addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
    },
    async getBin(key) { return read(`media/${key}`, false); }, // las fotos nunca cambian de nombre → caché OK
    async setBin(key, buf, contentType) {
      await put(`media/${key}`, Buffer.from(buf), { ...opts, addRandomSuffix: false, allowOverwrite: true, contentType });
    },
    async del(key) {
      await del([`data/${key}.json`, `media/${key}`]).catch(() => {});
    },
  };
}

let backend: Promise<Backend> | null = null;
export function store(): Promise<Backend> {
  if (!backend) backend = process.env.BLOB_READ_WRITE_TOKEN ? vercelBackend() : Promise.resolve(localBackend);
  return backend;
}

export const CACHE_TAG = 'infa-content';

/** Invalida la caché del CDN de las páginas con contenido editable. */
export async function purgeContentCache() {
  if (!process.env.VERCEL) return;
  try {
    const { invalidateByTag } = await import('@vercel/functions');
    await invalidateByTag(CACHE_TAG);
  } catch (e) {
    console.warn('[INFA] invalidateByTag falló', e);
  }
}
