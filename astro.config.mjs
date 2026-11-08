// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Host canónico: www.infasoluciones.com (dominio principal en Vercel; el dominio sin www redirige aquí).
// Todas las páginas se renderizan bajo demanda y se guardan en el CDN (ver src/middleware.ts):
// así los cambios hechos en /admin se ven al instante sin volver a publicar el sitio.
export default defineConfig({
  site: 'https://www.infasoluciones.com',
  trailingSlash: 'never',
  output: 'server',
  adapter: vercel({ maxDuration: 60 }),
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  security: { checkOrigin: false }, // el API valida el origen por su cuenta (src/pages/api)
});
