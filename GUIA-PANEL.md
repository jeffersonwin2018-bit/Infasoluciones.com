# Guía rápida — Panel INFA (www.infasoluciones.com/admin)

## Entrar
1. Abre **www.infasoluciones.com/admin** en el celular.
2. Escribe tu usuario y contraseña.
3. Consejo: menú del navegador → **"Agregar a pantalla de inicio"**. Así entras en un toque.

## Qué puede hacer cada persona
| Rol | Puede |
|---|---|
| **Propietario** (papá, Jefferson) | Todo: subir fotos, elegir qué se ve, editar textos y colores, dar o quitar accesos. |
| **Editor** | Subir fotos, editar todos los trabajos, textos y diseño. No gestiona usuarios. |
| **Colaborador** (familiares) | Subir fotos y editar o borrar **solo las suyas**. |

## Subir fotos (📷)
1. Toca **"Toca para elegir fotos"**. Puedes elegir varias o tomar una al momento.
2. Ponle título, tipo de trabajo, fecha y lugar (la fecha se llena sola con la de la foto).
3. ⭐ "Mostrar en la portada" la pone en la galería principal (solo propietario/editor).
4. Toca **Publicar**. En segundos aparece en la web, en "Recién salido del taller" y en /proyectos.

## Trabajos (🖼️)
- ⭐ Portada sí/no · 👁 mostrar/ocultar (no borra) · ✏️ editar · ↑ subir en el orden · 🗑 borrar.
- Si dudas, **oculta** en vez de borrar.

## Textos (✏️) y Diseño (🎨)
- Textos de la portada, quiénes somos, cifras, historia y aviso superior (franja de promociones).
- Diseño: color principal, encender/apagar el módulo 3D que gira y cada sección de la portada.

## Usuarios (👥, solo propietario)
- **Agregar persona**: nombre, usuario, contraseña inicial (mín. 8 caracteres) y permisos.
- Puedes cambiar permisos, resetear claves, pausar o quitar accesos.

---

# Publicación (Vercel)
- El sitio se publica solo desde GitHub (jeffersonwin2018-bit/Infasoluciones.com, rama main) en el proyecto
  de Vercel **infasoluciones.comdev**, con el dominio **www.infasoluciones.com**.
- Las fotos y textos del panel se guardan en **Vercel Blob privado** (store infa-panel), así que no se pierden al
  volver a publicar el código.

## Activar el panel (una sola vez — Jefferson)
1. En Vercel → proyecto infasoluciones.comdev → *Settings → Environment Variables* agrega
    = una clave secreta que solo tú sepas (entorno Production).
2. *Deployments* → en el último, menú ⋯ → **Redeploy** (para que tome la variable).
3. Entra a **www.infasoluciones.com/admin**, crea tu cuenta de propietario con esa clave, y luego crea la de tu papá
   como **Propietario** y las de los familiares como **Colaborador**.

# Para aparecer primero al buscar "INFA" en Google
El código ya está optimizado (títulos que empiezan por INFA, datos estructurados con todas las variantes del
nombre y las redes, sitemap con imágenes). Lo que más pesa ahora está **fuera** del código:
1. **Google Search Console**: verifica infasoluciones.com y envía `https://www.infasoluciones.com/sitemap.xml`.
   Pega el código de verificación en `src/config/site.ts` → `googleVerification`.
2. **Perfil de Empresa de Google (Google Maps)** con el nombre "INFA – Mueblerías y Soluciones", la misma
   dirección y teléfono de la web, fotos y el enlace a infasoluciones.com. Es lo que más ayuda en búsquedas de marca.
3. Pon el enlace **www.infasoluciones.com** en la bio de Facebook, Instagram y TikTok.
4. Pide reseñas en Google a clientes reales.
5. Completa los datos marcados `[COMPLETAR]` en `src/config/site.ts` (RUC, dirección, correo, horario).

"INFA" es una palabra corta que también usan otras organizaciones, así que nadie puede garantizar el puesto 1
solo con el código; con los pasos de arriba, las búsquedas "INFA muebles", "INFA Arequipa", "Mueblerías INFA"
suelen posicionarse en pocas semanas.
