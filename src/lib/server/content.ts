/** Lectura/escritura de textos, diseño y trabajos (con siembra inicial de obras reales). */
import { store } from './store';
import { DEFAULT_SETTINGS, mergeSettings, type SiteSettings } from '@/data/settings';
import type { Work } from '@/data/works';
import seed from '@/data/seed-works.json';

const WORKS_KEY = 'works';
const SETTINGS_KEY = 'settings';

export async function getSettings(): Promise<SiteSettings> {
  const saved = await (await store()).getJSON<Partial<SiteSettings>>(SETTINGS_KEY);
  return saved ? mergeSettings(DEFAULT_SETTINGS, saved) : structuredClone(DEFAULT_SETTINGS);
}
export async function saveSettings(patch: unknown) {
  const next = mergeSettings(await getSettings(), patch);
  await (await store()).setJSON(SETTINGS_KEY, next);
  return next;
}

export async function getWorks(): Promise<Work[]> {
  const s = await store();
  let works = await s.getJSON<Work[]>(WORKS_KEY);
  if (!works) {
    works = seed as Work[];
    await s.setJSON(WORKS_KEY, works);
  }
  return works.sort((a, b) => a.order - b.order);
}
export async function saveWorks(works: Work[]) {
  await (await store()).setJSON(WORKS_KEY, works);
}

/** Lo que ve el público. */
export async function publicWorks() {
  return (await getWorks()).filter((w) => w.visible);
}
