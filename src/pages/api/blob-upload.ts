/**
 * Autoriza subidas de VIDEO directo desde el celular a Vercel Blob (privado).
 * El archivo no pasa por el servidor de la web (límite 4,5 MB), así se pueden subir videos grandes.
 * Solo usuarios con sesión del panel; solo videos; máximo 200 MB; solo en la carpeta media/v/.
 */
import type { APIRoute } from 'astro';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { currentUser } from '@/lib/server/auth';

export const prerender = false;
const MAX_VIDEO_MB = 200;

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return Response.json({ error: 'Origen no permitido' }, { status: 403 });
  const me = await currentUser(request);
  if (!me) return Response.json({ error: 'Inicia sesión.' }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ error: 'Almacenamiento de videos no configurado.' }, { status: 503 });

  const body = (await request.json()) as HandleUploadBody;
  try {
    const r = await handleUpload({
      body, request,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^media\/v\/[\w-]+\.(mp4|mov|webm|m4v)$/i.test(pathname)) throw new Error('Nombre de archivo no válido');
        return {
          allowedContentTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'],
          maximumSizeInBytes: MAX_VIDEO_MB * 1024 * 1024,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
    });
    return Response.json(r);
  } catch (e: any) {
    return Response.json({ error: e?.message ?? 'No se pudo autorizar la subida' }, { status: 400 });
  }
};
