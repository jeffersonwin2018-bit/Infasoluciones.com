/**
 * FUENTE ÚNICA DE VERDAD de los datos de la empresa (NAP: Name, Address, Phone).
 * Todo el sitio (header, footer, JSON-LD, WhatsApp, cotizador) lee de aquí.
 * Lo que dice [COMPLETAR] NO se publica en el schema hasta que tenga un valor real.
 */
export const SITE = {
  url: 'https://www.infasoluciones.com',
  name: 'INFA',
  brand: 'INFA Soluciones',
  legalName: 'Mueblerías INFA S.R.L.', // [COMPLETAR] confirmar razón social exacta tal como figura en SUNAT
  // Variantes con las que la gente busca la marca: ayudan a que "INFA" encuentre esta web.
  alternateNames: ['INFA', 'INFA Soluciones', 'Mueblerías INFA', 'Mueblerías INFA SRL', 'Mueblerias Infa', 'Servicios Generales INFA', 'INFA Perú', 'Infa Arequipa', 'Infa Lima'],
  ruc: '', // [COMPLETAR] RUC de 11 dígitos — se muestra en el módulo de confianza y el footer
  tagline: 'Mobiliario de exhibición, carpintería y metalmecánica a medida',
  description:
    'INFA (Mueblerías INFA) diseña, fabrica e instala módulos de exhibición para retail, mobiliario a medida, carpintería en melamina y madera, y estructuras metálicas en Lima, Arequipa y todo el Perú. Cotización formal con factura.',
  whatsapp: '51922456016', // sin +, espacios ni guiones
  phoneDisplay: '+51 922 456 016',
  email: '', // [COMPLETAR] correo corporativo (ideal: contacto@infasoluciones.com)
  social: {
    facebook: 'https://www.facebook.com/muebleriasinfa',
    instagram: 'https://www.instagram.com/mueblerias._infa._srl/',
    tiktok: 'https://www.tiktok.com/@servicios.general219',
  },
  maps: 'https://maps.app.goo.gl/fCCXjbRnRNGMYsSn9',
  geo: { lat: -12.2192031, lng: -76.9263817 },
  address: {
    streetAddress: '', // [COMPLETAR] dirección del taller (igual que en Google Business Profile)
    addressLocality: 'Villa El Salvador',
    addressRegion: 'Lima',
    addressCountry: 'PE',
  },
  openingHours: ['Mo-Fr 08:00-18:00', 'Sa 08:00-13:00'], // [COMPLETAR] confirmar horario real
  availability: {
    active: true,
    label: 'Atendiendo proyectos en todo el Perú',
  },
  locale: 'es_PE',
  ogImage: '/media/og/og-infa.jpg',
  /** Código de verificación de Google Search Console (meta tag). [COMPLETAR] */
  googleVerification: '',
} as const;

export const SOCIALS = [
  { key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/${SITE.whatsapp}` },
  { key: 'facebook', label: 'Facebook', href: SITE.social.facebook },
  { key: 'instagram', label: 'Instagram', href: SITE.social.instagram },
  { key: 'tiktok', label: 'TikTok', href: SITE.social.tiktok },
] as const;

export const NAV = [
  { href: '/servicios', label: 'Servicios' },
  { href: '/proyectos', label: 'Obras' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/cobertura', label: 'Cobertura' },
] as const;

/** Cadenas donde INFA ha fabricado/instalado mobiliario (según su archivo de obras). Solo texto, sin logos. */
export const CLIENTES = ['Saga Falabella', 'Plaza Vea', 'Ripley', 'Curacao', 'EFE', 'Wong', 'Estilos', 'Claro'] as const;
