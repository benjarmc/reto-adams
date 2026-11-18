import type { Estado, FilaFinal, FilaInicial, Medidas } from './types';
import { norm } from './scoring';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const n = (v: unknown, min: number, max: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null;
const s = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const MAX_FILAS = 200;
const MAX_MEDIDAS = 20;

/** Limpia lo que llega por la API. Devuelve null si el cuerpo no tiene la forma esperada. */
export function sanitizarEstado(raw: unknown): Estado | null {
  if (!isObj(raw)) return null;

  const margen = n(raw.margen, 0.1, 20) ?? 1;

  const medidas: string[] = [];
  for (const m of Array.isArray(raw.medidas) ? raw.medidas : []) {
    const t = s(m, 40);
    if (t && medidas.length < MAX_MEDIDAS && !medidas.some((x) => norm(x) === norm(t))) medidas.push(t);
  }

  const limpiarM = (v: unknown): Medidas => {
    const out: Medidas = {};
    for (const k of medidas) out[k] = isObj(v) ? n(v[k], 0, 500) : null;
    return out;
  };

  const inicial: FilaInicial[] = [];
  for (const r of (Array.isArray(raw.inicial) ? raw.inicial : []).slice(0, MAX_FILAS)) {
    if (!isObj(r)) continue;
    const nombre = s(r.nombre, 80);
    if (!nombre) continue;
    const obj = r.objetivo;
    inicial.push({
      nombre,
      objetivo: obj === 'bajar' || obj === 'mantener' || obj === 'subir' ? obj : '',
      meta: n(r.meta, 0, 200),
      peso: n(r.peso, 0, 500),
      estatura: n(r.estatura, 0, 300),
      m: limpiarM(r.m),
    });
  }

  const final: FilaFinal[] = [];
  for (const r of (Array.isArray(raw.final) ? raw.final : []).slice(0, MAX_FILAS)) {
    if (!isObj(r)) continue;
    const nombre = s(r.nombre, 80);
    if (!nombre) continue;
    final.push({ nombre, peso: n(r.peso, 0, 500), estatura: n(r.estatura, 0, 300), m: limpiarM(r.m) });
  }

  return { margen, medidas, inicial, final };
}
