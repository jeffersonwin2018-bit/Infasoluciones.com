/** Contenido editable de secciones: comparativa, confianza, FAQ, cobertura, testimonios. */

export const COMPARATIVA = [
  { criterio: 'Cotización', informal: 'Precio "al ojo", verbal', infa: 'Cotización escrita, partidas detalladas y vigencia' },
  { criterio: 'Comprobante', informal: 'Sin boleta o factura', infa: 'Factura electrónica con RUC' },
  { criterio: 'Planos', informal: 'Se improvisa en obra', infa: 'Plano o croquis acotado aprobado antes de fabricar' },
  { criterio: 'Materiales', informal: 'Calidad no declarada', infa: 'Especificación de material por escrito' },
  { criterio: 'Plazo', informal: '"La próxima semana"', infa: 'Cronograma por etapas con fecha de entrega' },
  { criterio: 'Acabado', informal: 'Variable', infa: 'Tolerancias medidas, soldadura esmerilada y pintada' },
  { criterio: 'Garantía', informal: 'Ninguna', infa: 'Garantía escrita por fabricación e instalación' },
] as const;

export const CONFIANZA = [
  { titulo: 'Factura y RUC', texto: 'Emitimos factura electrónica. Ideal para empresas, condominios y contratistas.' },
  { titulo: 'Garantía escrita', texto: 'Respaldamos por escrito la fabricación y la instalación de cada proyecto.' },
  { titulo: 'Montaje en provincias', texto: 'Fabricamos en taller y trasladamos/montamos en Lima, Huaral, Cañete, Áncash y otras provincias.' },
  { titulo: 'Plano antes de fabricar', texto: 'Nada se corta sin un plano o croquis acotado aprobado por el cliente.' },
] as const;

/**
 * Testimonios: SOLO reales, con permiso del cliente. Vacío = la sección no se renderiza.
 * Inventar testimonios es ilegal (publicidad engañosa — INDECOPI) y Google lo penaliza.
 */
export const TESTIMONIOS: { nombre: string; cargo: string; texto: string; proyecto?: string }[] = [];

export const FAQS = [
  {
    q: '¿Fabrican módulos de exhibición para tiendas y marcas?',
    a: 'Sí, es nuestra especialidad: islas, muros de pantallas, góndolas, cabeceras, tótems y mesas de exhibición con iluminación LED y acrílico. Trabajamos con ficha técnica por módulo e instalamos fuera del horario de tienda.',
  },
  {
    q: '¿Emiten factura?',
    a: 'Sí. Emitimos factura electrónica con RUC para empresas, condominios y contratistas, y boleta para clientes residenciales.',
  },
  {
    q: '¿Trabajan fuera de Lima?',
    a: 'Sí. Hemos fabricado e instalado mobiliario de exhibición en Arequipa y atendemos Lima y provincias como Huaral, Cañete y Áncash. El costo de traslado se detalla en la cotización.',
  },
  {
    q: '¿Qué necesito para recibir una cotización?',
    a: 'Tipo de obra, medidas aproximadas, ubicación y fotos del lugar. Si tienes planos, mejor. Con eso preparamos una cotización escrita por partidas.',
  },
  {
    q: '¿Hacen visita técnica?',
    a: '[COMPLETAR] Indicar si la visita técnica es gratuita en Lima y cómo se cobra en provincias.',
  },
  {
    q: '¿Qué garantía ofrecen?',
    a: '[COMPLETAR] Plazo y alcance de la garantía en estructuras, portones y carpintería.',
  },
  {
    q: '¿Cuánto demora un portón o una estructura?',
    a: 'Depende del tamaño y del material. El plazo se fija por escrito en la cotización, con cronograma por etapas.',
  },
] as const;

/** Páginas de cobertura local (SEO): /cobertura/<slug>. Solo zonas donde realmente se trabaja. */
export const COBERTURA = [
  { slug: 'arequipa', nombre: 'Arequipa', foco: 'Cayma, Cercado, Paucarpata, José Luis Bustamante y Rivero, Mariano Melgar: tiendas en Mall Aventura, Porongoche, Lambramani y más' },
  { slug: 'lima', nombre: 'Lima Metropolitana', foco: 'Lima Sur: Villa El Salvador, San Juan de Miraflores, Villa María del Triunfo, Surco, Chorrillos' },
  { slug: 'huaral', nombre: 'Huaral', foco: 'Huaral, Chancay y alrededores' },
  { slug: 'canete', nombre: 'Cañete', foco: 'San Vicente de Cañete, Asia, Mala' },
  { slug: 'ancash', nombre: 'Áncash', foco: 'Huaraz, Chimbote y zonas mineras' },
] as const;

export const PROCESO = [
  { n: '01', t: 'Requerimiento', d: 'Nos envías fotos, medidas o planos por WhatsApp.' },
  { n: '02', t: 'Visita y plano', d: 'Medición en sitio y plano o croquis acotado.' },
  { n: '03', t: 'Cotización formal', d: 'Partidas, materiales, plazo, garantía y factura.' },
  { n: '04', t: 'Fabricación', d: 'En taller, con avance fotográfico.' },
  { n: '05', t: 'Montaje y entrega', d: 'Instalación, limpieza y acta de entrega.' },
] as const;
