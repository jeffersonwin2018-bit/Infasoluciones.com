#!/usr/bin/env node
/**
 * Convierte las fotos originales (3–4 MB JPG de cámara) a WebP + AVIF responsivos.
 *
 *   assets-src/proyectos/<slug>/*.jpg  →  public/media/proyectos/<slug>/<nombre>-{640,1280,1920}.{webp,avif}
 *
 * Uso:  npm run images
 * Renombra los originales con nombres descriptivos ANTES (ej. porton-levadizo-ves-01.jpg),
 * no "20121105_185219.jpg": el nombre del archivo también es señal SEO para Google Imágenes.
 */
import { readdir, mkdir, stat } from 'node:fs/promises';
import { join, parse, relative } from 'node:path';
import sharp from 'sharp';

const SRC = 'assets-src';
const OUT = 'public/media';
const WIDTHS = [640, 1280, 1920];
const EXT = /\.(jpe?g|png|webp|tiff?)$/i;

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (EXT.test(e.name)) yield p;
  }
}

let n = 0, before = 0, after = 0;
try { await stat(SRC); } catch { console.log(`Crea la carpeta ${SRC}/ y pon ahí los originales.`); process.exit(0); }

for await (const file of walk(SRC)) {
  const { dir, name } = parse(relative(SRC, file));
  const outDir = join(OUT, dir);
  await mkdir(outDir, { recursive: true });
  before += (await stat(file)).size;
  const img = sharp(file).rotate(); // respeta orientación EXIF y la elimina
  const meta = await img.metadata();
  for (const w of WIDTHS.filter((w) => w <= (meta.width ?? 9999))) {
    const base = join(outDir, `${name}-${w}`);
    const r = img.clone().resize({ width: w, withoutEnlargement: true });
    const webp = await r.clone().webp({ quality: 76 }).toFile(`${base}.webp`);
    const avif = await r.clone().avif({ quality: 52 }).toFile(`${base}.avif`);
    after += webp.size + avif.size;
  }
  n++;
  console.log('✓', file);
}
console.log(`\n${n} imágenes · ${(before / 1e6).toFixed(1)} MB originales → ${(after / 1e6).toFixed(1)} MB en todas las variantes`);
