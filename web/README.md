# INFA Soluciones — sitio corporativo

Sitio estático en HTML, CSS y JavaScript. No requiere compilación. Desde esta carpeta ejecuta `python -m http.server 8000` y abre `http://localhost:8000`.

## Estructura

```text
web/
├── index.html, privacidad.html, 404.html
├── nosotros.html, servicios.html, contacto.html
├── proyectos/      # índice de proyectos y colecciones visuales
├── css/            # estilos compartidos y específicos por página
├── js/content.js   # datos editables de servicios, proyectos, cifras y preguntas
├── js/main.js      # interacciones, formulario y vistas de contenido
├── js/pages.js     # interacciones y preselección de servicio
├── js/gallery-data.js, gallery.js # índice e interacciones de la galería
├── assets/         # identidad, ilustraciones, referencias y presentación temporal
├── manifest.webmanifest, robots.txt, sitemap.xml, netlify.toml
└── docs/ASSETS.md  # inventario de assets, tamaños y usos
```

## Editar contenido

- **Servicios, indicadores, preguntas y casos:** edita `js/content.js`. Los casos usan los campos `title`, `service`, `image`, `alt`, `location`, `workType`, `duration`, `challenge`, `solution` y `result`. Sustituye los marcadores `[COMPLETAR: ...]` con datos verificados.
- **Agregar fotografías de proyecto:** guarda una copia WebP autorizada en `assets/images/projects/` y completa `image` y `alt` del caso en `js/content.js`. No presentes las imágenes de referencia como proyectos propios.
- **Galería visual:** `proyectos/index.html` enlaza las colecciones de exhibición comercial, fichas visuales y acondicionamiento. El índice estático de archivos está en `js/gallery-data.js`; al agregar o retirar imágenes, actualízalo y revisa los contadores y textos alternativos. Las imágenes se presentan como referencias y no deben atribuirse a clientes o proyectos sin verificar su origen.
- **Comparativa antes/después:** añade elementos a `beforeAfter` en `js/content.js` con `title`, `before`, `beforeAlt`, `after` y `afterAlt`; el slider aparece automáticamente. Usa fotos del mismo proyecto y con permiso.
- **Cambiar WhatsApp:** modifica `company.whatsapp` en `js/content.js` con el código de país y número, sin `+`, espacios ni guiones.
- **Correo:** completa `company.email` con el correo corporativo y el marcador del enlace de correo en el formulario. El formulario prepara un borrador; no envía datos a un servidor.
- **Presentación:** reemplaza `assets/presentacion-empresa.pdf` con el PDF corporativo aprobado. El archivo actual es un placeholder para que el enlace no quede roto.
- **Logo, favicon y portada social:** los originales se conservan en `assets/`. La web usa una copia del logo. Reemplaza `assets/images/social/og-infa.png` por una imagen aprobada de 1200 × 630 manteniendo la ruta o actualizando metadatos.

## Publicación

La configuración de la raíz del proyecto (`../netlify.toml`) hace que las publicaciones conectadas a Git usen `web/` como carpeta pública; no se requiere instalar dependencias ni compilar el sitio. Si configuras Netlify manualmente con `web/` como directorio base, el `netlify.toml` de esta carpeta publica `.`. Para una publicación manual con Netlify Drop, selecciona o arrastra directamente esta carpeta `web/` —la que contiene `index.html`, `assets/`, `css/` y `js/`—, no la carpeta contenedora que está un nivel arriba.

Después del deploy, comprueba que el despliegue figure como **Published** en producción y abre el dominio principal, no solo la URL de un Deploy Preview. El sitio envía `Cache-Control: public, max-age=0, must-revalidate` para que HTML, estilos, scripts e imágenes con nombres no versionados se revaliden y no queden congelados en una versión anterior.

Antes de publicar, completa la lista en `docs/ASSETS.md`, revisa el formulario en móvil, comprueba el enlace WhatsApp y sustituye el PDF placeholder. La página de privacidad tiene texto legal marcado como pendiente: obtener revisión y completar antes de publicar. Los formularios abren WhatsApp o un borrador de correo y no guardan información en servidor.
