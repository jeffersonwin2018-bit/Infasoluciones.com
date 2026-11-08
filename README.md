# INFA — infasoluciones.com

Astro (render bajo demanda + caché CDN en Vercel) · GSAP/Lenis · panel /admin con Vercel Blob privado.

```bash
npm install
npm run dev      # http://localhost:4321  (el panel guarda en .data/ en local)
npm run build
```

- **Hero 3D**: secuencia de fotogramas (giro 360° generado con Higgsfield) en `public/media/hero/{d,m}`.
- **Obras reales** curadas y mejoradas: `public/media/obras` + `src/data/seed-works.json` (siembra inicial del panel).
- **Imágenes referenciales IA**: `public/media/ia` (se rotulan "Imagen referencial" en la web).
- **Panel**: `src/pages/admin.astro` + `src/scripts/admin.ts`; API en `src/pages/api/[...path].ts`.
- **Textos/diseño por defecto**: `src/data/settings.ts` · **Datos de empresa y redes**: `src/config/site.ts`.
- Para probar animaciones con "reducir movimiento" activo en el sistema: añade `?motion=1` a la URL.

Guía para el equipo y pasos de publicación/SEO: **GUIA-PANEL.md**.
