import { SITE } from '@/config/site';
import { SERVICES, type Service } from '@/data/services';

/**
 * Generadores de JSON-LD. Se insertan en el HTML estático (Google los lee sin ejecutar JS).
 * Los campos vacíos ([COMPLETAR]) se omiten automáticamente: mejor no declarar que declarar mal.
 */
const clean = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== '' && v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)),
  ) as T;

const ORG_ID = `${SITE.url}/#organization`;

export function organizationSchema() {
  return clean({
    '@context': 'https://schema.org',
    '@type': ['HomeAndConstructionBusiness', 'GeneralContractor'],
    '@id': ORG_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    alternateName: SITE.alternateNames,
    url: SITE.url,
    logo: `${SITE.url}/media/brand/logo-infa.png`,
    image: `${SITE.url}${SITE.ogImage}`,
    description: SITE.description,
    telephone: `+${SITE.whatsapp}`,
    email: SITE.email,
    taxID: SITE.ruc,
    address: clean({ '@type': 'PostalAddress', ...SITE.address }),
    geo: { '@type': 'GeoCoordinates', latitude: SITE.geo.lat, longitude: SITE.geo.lng },
    hasMap: SITE.maps,
    openingHours: SITE.openingHours,
    priceRange: 'S/ 3,000 – S/ 50,000+',
    areaServed: ['Lima', 'Arequipa', 'Huaral', 'Cañete', 'Áncash', 'Perú'].map((name) => ({ '@type': 'AdministrativeArea', name })),
    sameAs: Object.values(SITE.social), // añade aquí el enlace de Google Business Profile cuando exista
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios de INFA',
      itemListElement: SERVICES.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title, url: `${SITE.url}/servicios/${s.slug}` },
      })),
    },
  });
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    alternateName: SITE.alternateNames,
    inLanguage: 'es-PE',
    publisher: { '@id': ORG_ID },
  };
}

export function serviceSchema(s: Service) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.title,
    serviceType: s.keyword,
    description: s.short,
    url: `${SITE.url}/servicios/${s.slug}`,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'Perú' },
  };
}

export function faqSchema(faqs: readonly { q: string; a: string }[]) {
  const ready = faqs.filter((f) => !f.a.includes('[COMPLETAR]'));
  if (!ready.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ready.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${SITE.url}${it.path}` })),
  };
}
