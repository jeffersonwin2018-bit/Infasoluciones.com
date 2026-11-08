/**
 * Textos y diseño editables desde /admin → "Textos" y "Diseño".
 * Estos son los valores por defecto; lo que se guarda en el panel los sobrescribe.
 */
export interface SiteSettings {
  announcement: { active: boolean; text: string };
  hero: { eyebrow: string; title: string; highlight: string; lead: string; cta: string };
  intro: { title: string; body: string };
  stats: { value: string; label: string }[];
  about: { title: string; body: string };
  cta: { title: string; body: string };
  design: {
    accent: string;
    heroVideo: boolean;
    sections: { clientes: boolean; servicios: boolean; obras: boolean; recientes: boolean; proceso: boolean; cotizador: boolean; faq: boolean };
  };
}

export const ACCENTS = [
  { value: '#e8293a', label: 'Rojo INFA (logo)' },
  { value: '#ff5500', label: 'Naranja soldadura' },
  { value: '#d4a24c', label: 'Dorado madera' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#3b82f6', label: 'Azul acero' },
];

export const DEFAULT_SETTINGS: SiteSettings = {
  announcement: { active: false, text: 'Agenda tu visita técnica sin costo en Lima y Arequipa.' },
  hero: {
    eyebrow: 'Mueblerías INFA · Lima · Arequipa · Todo el Perú',
    title: 'Diseñamos, fabricamos e instalamos',
    highlight: 'espacios que venden.',
    lead: 'Módulos de exhibición, mobiliario a medida, carpintería y estructuras metálicas. Taller propio, plano antes de fabricar e instalación con factura.',
    cta: 'Cotiza por WhatsApp',
  },
  intro: {
    title: 'Del plano a la tienda, con un solo responsable.',
    body: 'Hemos fabricado e instalado módulos de exhibición para grandes cadenas de retail en Arequipa y Lima: muros de televisores, islas iluminadas, líneas de lavadoras y refrigeradoras, video walls y mobiliario comercial. Esa misma precisión la llevamos a cocinas, closets, puertas, portones y estructuras.',
  },
  stats: [
    { value: '2012', label: 'Obras documentadas desde' },
    { value: '7+', label: 'Cadenas de retail atendidas' },
    { value: '8', label: 'Especialidades en un solo taller' },
    { value: '100%', label: 'Con plano y cotización por escrito' },
  ],
  about: {
    title: 'Empresa familiar. Estándar de fábrica.',
    body: 'INFA nació como un taller familiar de carpintería y creció fabricando mobiliario de exhibición para tiendas por departamento. Hoy unimos carpintería fina, melamina, acrílico, iluminación LED y metalmecánica en un mismo taller, para entregar proyectos completos: diseño, fabricación, traslado, instalación y mantenimiento.',
  },
  cta: {
    title: '¿Tienes un proyecto en mente?',
    body: 'Envíanos fotos o medidas por WhatsApp. Te respondemos con una propuesta clara, plano y cotización formal.',
  },
  design: {
    accent: '#e8293a',
    heroVideo: true,
    sections: { clientes: true, servicios: true, obras: true, recientes: true, proceso: true, cotizador: true, faq: true },
  },
};

/** Mezcla profunda segura: solo acepta claves conocidas y tipos correctos. */
export function mergeSettings(base: SiteSettings, patch: any): SiteSettings {
  const out: any = structuredClone(base);
  const walk = (o: any, p: any) => {
    if (!p || typeof p !== 'object') return;
    for (const k of Object.keys(o)) {
      if (!(k in p)) continue;
      if (Array.isArray(o[k])) {
        if (Array.isArray(p[k])) o[k] = p[k].slice(0, 8).map((x: any) => ({ value: String(x?.value ?? '').slice(0, 20), label: String(x?.label ?? '').slice(0, 60) }));
      } else if (typeof o[k] === 'object') walk(o[k], p[k]);
      else if (typeof o[k] === typeof p[k]) o[k] = typeof p[k] === 'string' ? p[k].slice(0, 1200) : p[k];
    }
  };
  walk(out, patch);
  if (!/^#[0-9a-f]{6}$/i.test(out.design.accent)) out.design.accent = base.design.accent;
  return out;
}
