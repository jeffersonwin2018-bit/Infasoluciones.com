/** Sitemap dinámico: páginas + imágenes de obras (Google Imágenes también trae clientes). */
import type { APIRoute } from 'astro';
import { SITE } from '@/config/site';
import { SERVICES } from '@/data/services';
import { COBERTURA } from '@/data/content';
import { publicWorks } from '@/lib/server/content';

export const prerender = false;
const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

export const GET: APIRoute = async () => {
  const works = await publicWorks();
  const last = works.reduce((m, w) => (w.createdAt > m ? w.createdAt : m), '2026-11-07').slice(0, 10);
  const pages: { loc: string; pri: string; imgs?: typeof works }[] = [
    { loc: '/', pri: '1.0', imgs: works.filter((w) => w.featured) },
    { loc: '/proyectos', pri: '0.9', imgs: works },
    { loc: '/servicios', pri: '0.9' },
    ...SERVICES.map((s) => ({ loc: `/servicios/${s.slug}`, pri: '0.8', imgs: works.filter((w) => w.category === s.workCategory).slice(0, 9) })),
    { loc: '/nosotros', pri: '0.7' },
    { loc: '/cobertura', pri: '0.6' },
    ...COBERTURA.map((c) => ({ loc: `/cobertura/${c.slug}`, pri: '0.6' })),
    { loc: '/cotizar', pri: '0.7' },
    { loc: '/privacidad', pri: '0.2' },
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages.map((p) => `<url><loc>${SITE.url}${p.loc === '/' ? '' : p.loc}</loc><lastmod>${last}</lastmod><priority>${p.pri}</priority>${(p.imgs ?? []).map((w) => `<image:image><image:loc>${esc(new URL(w.src, SITE.url).href)}</image:loc><image:title>${esc(w.title)}</image:title></image:image>`).join('')}</url>`).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate', 'Vercel-CDN-Cache-Control': 'public, max-age=31536000, stale-while-revalidate=86400', 'Vercel-Cache-Tag': 'infa-content' } });
};
