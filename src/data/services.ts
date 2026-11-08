/**
 * Servicios = páginas SEO propias (/servicios/<slug>). Una intención de búsqueda por página.
 * `image` = foto REAL si existe (/media/obras), o imagen referencial generada con IA (/media/ia),
 * que se rotula como "Imagen referencial" en la web.
 */
export type Division = 'exhibicion' | 'carpinteria' | 'metalmecanica' | 'instalaciones';

export interface Service {
  slug: string;
  division: Division;
  title: string;          // H1 de la página
  short: string;          // tarjeta / meta
  keyword: string;        // keyword principal (no repetir entre páginas)
  intro: string[];        // contenido único de la página (SEO)
  items: string[];
  specs: string[];
  image: string;
  imageIsReal: boolean;
  workCategory: string;   // categoría de obras relacionada
}

export const DIVISIONS: Record<Division, { label: string; blurb: string }> = {
  exhibicion: { label: 'Exhibición comercial', blurb: 'Módulos, islas, muros y góndolas para tiendas y marcas: diseño, fabricación, instalación y mantenimiento.' },
  carpinteria: { label: 'Carpintería y melamina', blurb: 'Cocinas, closets, puertas, marcos y mobiliario a medida en melamina y maderas nobles.' },
  metalmecanica: { label: 'Metalmecánica', blurb: 'Estructuras, coberturas de aluzinc, portones y escaleras con plano y soldadura de calidad.' },
  instalaciones: { label: 'Instalaciones y mantenimiento', blurb: 'Acondicionamiento de locales y mantenimiento preventivo/correctivo para empresas.' },
};

export const SERVICES: Service[] = [
  {
    slug: 'modulos-de-exhibicion',
    division: 'exhibicion',
    title: 'Módulos de exhibición y mobiliario comercial para retail',
    short: 'Islas, muros de pantallas, góndolas, corners y exhibidores iluminados para tiendas y marcas.',
    keyword: 'módulos de exhibición para tiendas',
    intro: [
      'Fabricamos mobiliario de exhibición para tiendas por departamento, supermercados y marcas: muros de televisores, islas iluminadas, líneas de lavadoras y refrigeradoras, video walls, tótems y mesas de exhibición. Hemos instalado en tiendas como Saga Falabella, Plaza Vea, Ripley, Curacao, EFE, Wong y Estilos.',
      'Trabajamos con planos y fichas técnicas (alto, largo, profundidad y ploteo de cada pieza), acabados lacados, acrílico, iluminación LED integrada y bases resistentes al tránsito de tienda. Instalamos fuera del horario comercial y también damos mantenimiento: retoque de bordes, cambio de acrílicos y reposición de luces.',
    ],
    items: ['Islas y muros de pantallas', 'Góndolas y cabeceras', 'Línea blanca (lavadoras, refrigeradoras)', 'Tótems y corners iluminados', 'Mesas de exhibición', 'Video walls'],
    specs: ['Melamina / MDF lacado', 'Acrílico retroiluminado', 'Iluminación LED integrada', 'Ploteo e impresión de gráficas', 'Ficha técnica por módulo'],
    image: '/media/obras/muro-smart-tv.webp',
    imageIsReal: true,
    workCategory: 'exhibicion',
  },
  {
    slug: 'instalaciones-comerciales',
    division: 'exhibicion',
    title: 'Acondicionamiento e implementación de locales comerciales',
    short: 'Implementación integral de tiendas, stands y locales: mobiliario, drywall, iluminación y montaje.',
    keyword: 'implementación de locales comerciales',
    intro: [
      'Implementamos locales completos: desde el plano de distribución hasta el último exhibidor. Coordinamos carpintería, drywall, iluminación y montaje para que tu tienda abra a tiempo.',
      'Ideal para franquicias, tiendas de marca, stands y remodelaciones donde el plazo y el acabado son críticos. Trabajamos por etapas con cronograma y acta de entrega.',
    ],
    items: ['Stands y tiendas de marca', 'Drywall y cielos rasos', 'Exhibición comercial', 'Remodelaciones'],
    specs: ['Cronograma por etapas', 'Trabajo en horario no operativo', 'Acta de entrega'],
    image: '/media/ia/retail.webp',
    imageIsReal: false,
    workCategory: 'exhibicion',
  },
  {
    slug: 'mobiliario-melamina',
    division: 'carpinteria',
    title: 'Muebles de melamina a medida: cocinas, closets y oficinas',
    short: 'Reposteros, closets, centros de entretenimiento, módulos de oficina y mobiliario comercial.',
    keyword: 'muebles de melamina a medida',
    intro: [
      'Diseñamos y fabricamos muebles de melamina a medida con corte y enchapado de precisión: cocinas, closets, centros de TV, escritorios y módulos de oficina.',
      'Te entregamos una propuesta con medidas, colores de tablero y herrajes antes de fabricar, y lo instalamos a nivel y plomo.',
    ],
    items: ['Cocinas y reposteros', 'Closets y vestidores', 'Muebles de TV', 'Módulos de oficina'],
    specs: ['Tableros de melamina de 18 mm', 'Canto PVC', 'Herrajes de cierre lento'],
    image: '/media/ia/melamina.webp',
    imageIsReal: false,
    workCategory: 'carpinteria',
  },
  {
    slug: 'carpinteria-arquitectonica',
    division: 'carpinteria',
    title: 'Carpintería en madera: puertas, marcos y jambas',
    short: 'Puertas principales e interiores, marcos, jambas y revestimientos en maderas nobles.',
    keyword: 'puertas de madera a medida',
    intro: [
      'Fabricamos puertas principales e interiores, marcos, jambas, contrazócalos y revestimientos en maderas nobles, con acabado de obra fina.',
      'Seleccionamos y secamos la madera para evitar torceduras, y aplicamos laca o barniz poliuretano según el uso (interior o exterior).',
    ],
    items: ['Puertas principales', 'Marcos y jambas', 'Contrazócalos', 'Revestimientos'],
    specs: ['Madera seleccionada y secada', 'Laca / barniz poliuretano', 'Instalación a plomo y nivel'],
    image: '/media/ia/puertas.webp',
    imageIsReal: false,
    workCategory: 'carpinteria',
  },
  {
    slug: 'estructuras-metalicas',
    division: 'metalmecanica',
    title: 'Estructuras metálicas en Lima y provincias',
    short: 'Naves, mezzanines, techos y estructuras de acero con plano y memoria de cálculo.',
    keyword: 'estructuras metálicas Lima',
    intro: [
      'Fabricamos e instalamos estructuras de acero para almacenes, mezzanines, techos y refuerzos, con plano previo y soldadura revisada.',
      'Entregamos con pintura anticorrosiva y acabado, y coordinamos el montaje en Lima y provincias.',
    ],
    items: ['Naves y almacenes', 'Mezzanines', 'Estructuras para techo', 'Refuerzos'],
    specs: ['Soldadura MIG / TIG / SMAW', 'Acero estructural certificado', 'Pintura anticorrosiva + acabado'],
    image: '/media/ia/estructuras.webp',
    imageIsReal: false,
    workCategory: 'metalmecanica',
  },
  {
    slug: 'coberturas-aluzinc',
    division: 'metalmecanica',
    title: 'Techos y coberturas de aluzinc',
    short: 'Techos de aluzinc y policarbonato sobre estructura metálica, con canaletas y sellado.',
    keyword: 'techos de aluzinc Lima',
    intro: [
      'Instalamos coberturas de aluzinc y policarbonato sobre estructura metálica para patios, cocheras, terrazas y naves.',
      'Calculamos pendiente y calibre según la luz, e incluimos canaletas, bajadas y fijación con arandela de sellado.',
    ],
    items: ['Techos de aluzinc', 'Policarbonato', 'Canaletas y bajadas', 'Cobertura termoacústica'],
    specs: ['Calibre según luz y uso', 'Pendiente mínima calculada', 'Fijación autoperforante con arandela EPDM'],
    image: '/media/ia/coberturas.webp',
    imageIsReal: false,
    workCategory: 'metalmecanica',
  },
  {
    slug: 'portones-metalicos',
    division: 'metalmecanica',
    title: 'Portones metálicos a medida',
    short: 'Portones levadizos, corredizos y batientes; listos para motorizar.',
    keyword: 'portones metálicos Lima',
    intro: [
      'Fabricamos portones levadizos, corredizos y batientes a medida, con diseño moderno y preparación para motor.',
      'Usamos bisagras y rieles de carga y pintura de alta duración para exteriores.',
    ],
    items: ['Levadizos', 'Corredizos', 'Batientes', 'Rejas y cercos'],
    specs: ['Preparación para motor', 'Bisagras y rieles de carga', 'Garantía escrita'],
    image: '/media/ia/portones.webp',
    imageIsReal: false,
    workCategory: 'metalmecanica',
  },
  {
    slug: 'escaleras-metalicas',
    division: 'metalmecanica',
    title: 'Escaleras caracol y escaleras metálicas',
    short: 'Escaleras caracol, rectas y pasamanos en acero, con peldaños en madera o plancha.',
    keyword: 'escaleras caracol metálicas',
    intro: [
      'Diseñamos escaleras caracol y rectas en acero, con peldaños de madera noble o plancha antideslizante, pasamanos y barandas.',
      'Cada escalera se fabrica con plano previo y se ancla con anclaje químico para máxima firmeza.',
    ],
    items: ['Escalera caracol', 'Escalera recta', 'Pasamanos', 'Barandas'],
    specs: ['Plano de fabricación previo', 'Peldaño metal o madera noble', 'Anclaje químico'],
    image: '/media/ia/escaleras.webp',
    imageIsReal: false,
    workCategory: 'metalmecanica',
  },
  {
    slug: 'mantenimiento-b2b',
    division: 'instalaciones',
    title: 'Mantenimiento de mobiliario y locales para empresas',
    short: 'Mantenimiento preventivo y correctivo de módulos de exhibición, locales y oficinas.',
    keyword: 'mantenimiento de mobiliario comercial',
    intro: [
      'Damos mantenimiento a módulos de exhibición y locales: retoque de bordes y lacados, cambio de acrílicos, reposición de iluminación, ajuste de piezas sueltas y limpieza de bases.',
      'Entregamos un informe con fotos antes y después y podemos trabajar con facturación mensual.',
    ],
    items: ['Preventivo', 'Correctivo', 'Retoque de lacados y bordes', 'Iluminación y acrílicos'],
    specs: ['Informe con fotos antes/después', 'Facturación mensual', 'Atención programada o de emergencia'],
    image: '/media/ia/mantenimiento.webp',
    imageIsReal: false,
    workCategory: 'mantenimiento',
  },
];

export const serviceBySlug = (slug: string) => SERVICES.find((s) => s.slug === slug);
const NAMES: Record<string, string> = {
  'modulos-de-exhibicion': 'Módulos de exhibición',
  'instalaciones-comerciales': 'Implementación de locales',
  'mobiliario-melamina': 'Muebles de melamina',
  'carpinteria-arquitectonica': 'Puertas y carpintería',
  'estructuras-metalicas': 'Estructuras metálicas',
  'coberturas-aluzinc': 'Techos de aluzinc',
  'portones-metalicos': 'Portones metálicos',
  'escaleras-metalicas': 'Escaleras metálicas',
  'mantenimiento-b2b': 'Mantenimiento',
};
export const shortTitle = (s: Service) => NAMES[s.slug] ?? s.title.split(/ en | para |:/)[0];
