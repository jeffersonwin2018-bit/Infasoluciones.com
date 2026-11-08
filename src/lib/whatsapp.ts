import { SITE } from '@/config/site';

/**
 * Genera el enlace de WhatsApp EN EL HTML (en build), no con JavaScript en el navegador.
 * En el sitio actual los botones salen como "https://wa.me/" vacío y main.js los arregla
 * después: si el JS falla o Google lee el HTML crudo, el enlace queda roto.
 */
export function waLink(message = 'Hola INFA Soluciones, quisiera cotizar un proyecto.'): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}

export interface QuoteInput {
  tipo: string;
  medidas?: string;
  provincia: string;
  distrito?: string;
  plazo?: string;
  factura?: boolean;
  nombre?: string;
  empresa?: string;
  detalle?: string;
}

/** Mensaje formateado del cotizador express (lo usa también el script del cliente). */
export function quoteMessage(q: QuoteInput): string {
  const lines = [
    '*Solicitud de cotización — INFA Soluciones*',
    '',
    `• Tipo de obra: ${q.tipo}`,
    q.medidas ? `• Medidas aprox.: ${q.medidas}` : '',
    `• Ubicación: ${[q.distrito, q.provincia].filter(Boolean).join(', ')}`,
    q.plazo ? `• Plazo: ${q.plazo}` : '',
    `• Comprobante: ${q.factura ? 'Factura (RUC)' : 'Boleta'}`,
    q.nombre ? `• Nombre: ${q.nombre}` : '',
    q.empresa ? `• Empresa: ${q.empresa}` : '',
    q.detalle ? `\nDetalle: ${q.detalle}` : '',
    '',
    'Puedo enviar planos o fotos por este chat.',
  ];
  return lines.filter((l) => l !== '').join('\n');
}
