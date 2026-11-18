import type { Objetivo } from './types';

export const GOALS: Record<Objetivo, string> = {
  bajar: 'Bajar',
  mantener: 'Mantener',
  subir: 'Subir',
};

export const f1 = (n: number | null | undefined, d = 1): string =>
  n == null || !Number.isFinite(n)
    ? '—'
    : n.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Número con signo explícito y menos tipográfico. Redondea antes de decidir el signo. */
export const sg = (n: number | null | undefined, d = 1): string => {
  if (n == null || !Number.isFinite(n)) return '—';
  const r = Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
  return (r > 0 ? '+' : r < 0 ? '−' : '') + f1(Math.abs(r), d);
};

export const tono = (n: number): '' | 'good' | 'bad' => (n > 0.0499 ? 'good' : n < -0.0499 ? 'bad' : '');
