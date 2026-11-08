# /public/media — assets públicos optimizados

- `og/og-infa.jpg` → imagen social 1200×630 (< 150 KB). [COMPLETAR]
- `brand/logo-infa.png` → logo 512×512 para schema.org (Google exige raster para `logo`). [COMPLETAR]
- `proyectos/<slug>/` → fotos propias en WebP (generadas con `npm run images`).
- `models/` → modelos .glb con compresión Draco/Meshopt (< 2 MB c/u).

Origen de fotos: `assets-src/` (originales, NO se publican). Ver scripts/optimize-images.mjs.
