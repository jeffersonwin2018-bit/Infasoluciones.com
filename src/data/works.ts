/** Tipos y categorías de "trabajos" (fotos de obras) que se gestionan desde /admin. */
export type WorkCategory = 'exhibicion' | 'metalmecanica' | 'carpinteria' | 'mantenimiento' | 'taller';

export const WORK_CATEGORIES: Record<WorkCategory, { label: string; short: string }> = {
  exhibicion: { label: 'Exhibición comercial', short: 'Retail' },
  carpinteria: { label: 'Carpintería y melamina', short: 'Carpintería' },
  metalmecanica: { label: 'Metalmecánica', short: 'Metal' },
  mantenimiento: { label: 'Mantenimiento', short: 'Mantenimiento' },
  taller: { label: 'Taller y logística', short: 'Taller' },
};

export interface Work {
  id: string;
  title: string;
  description?: string;
  category: WorkCategory;
  location?: string;
  date: string;          // YYYY-MM-DD (fecha del trabajo / foto)
  src: string;           // imagen grande
  thumb: string;         // miniatura
  w: number;
  h: number;
  featured: boolean;     // aparece en la portada
  visible: boolean;      // false = oculta al público
  order: number;         // menor = primero
  uploadedBy: string;    // nombre de quien la subió
  uploaderId?: string;
  createdAt: string;     // ISO, fecha de subida
  kind?: 'image' | 'video';
  video?: string;        // URL del video (src/thumb son su portada)
  duration?: number;     // segundos
}
