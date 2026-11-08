const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "12 nov 2026" */
export function fecha(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MESES[m - 1]} ${y}`;
}

/** "hoy", "hace 3 días", "hace 2 semanas"… o la fecha si es antigua. */
export function haceCuanto(iso: string, now = Date.now()) {
  const t = new Date(iso).getTime();
  const days = Math.floor((now - t) / 864e5);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  if (days < 30) { const w = Math.floor(days / 7); return `hace ${w} semana${w > 1 ? 's' : ''}`; }
  if (days < 365) { const m = Math.floor(days / 30); return `hace ${m} mes${m > 1 ? 'es' : ''}`; }
  return fecha(iso);
}
