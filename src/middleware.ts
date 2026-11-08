/**
 * - Carga los textos/diseño editables una vez por petición (Astro.locals.settings).
 * - Caché: las páginas públicas se guardan en el CDN de Vercel con la etiqueta `infa-content`.
 *   Cuando alguien edita algo en /admin, esa etiqueta se invalida y la web se actualiza sola.
 */
import { defineMiddleware } from 'astro:middleware';
import { getSettings } from '@/lib/server/content';
import { CACHE_TAG } from '@/lib/server/store';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const path = ctx.url.pathname;
  const isApi = path.startsWith('/api/');
  if (!isApi) ctx.locals.settings = await getSettings();

  const res = await next();

  if (ctx.request.method === 'GET' && !isApi && (res.headers.get('content-type') ?? '').includes('text/html')) {
    if (path.startsWith('/admin')) {
      res.headers.set('Cache-Control', 'no-store');
      res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    } else if (res.status === 200) {
      res.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
      res.headers.set('Vercel-CDN-Cache-Control', 'public, max-age=31536000, stale-while-revalidate=86400');
      res.headers.set('Vercel-Cache-Tag', CACHE_TAG);
      if (process.env.VERCEL) {
        try { const { addCacheTag } = await import('@vercel/functions'); await addCacheTag(CACHE_TAG); } catch { /* cabecera como respaldo */ }
      }
    }
  }
  return res;
});
