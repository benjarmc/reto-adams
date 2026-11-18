import type { FilaInicial, Medidas } from './types';
import { goalOf, norm, num } from './scoring';

type Rol = 'nombre' | 'objetivo' | 'meta' | 'peso' | 'estatura' | 'skip' | 'medida';

function rolDe(h: string): Rol {
  const n = norm(h);
  if (/^(nombre|name|participante|persona|amigo)/.test(n)) return 'nombre';
  if (/^(objetivo|goal)/.test(n)) return 'objetivo';
  if (/^meta/.test(n)) return 'meta';
  if (/^peso/.test(n)) return 'peso';
  if (/^(estatura|altura|talla)/.test(n)) return 'estatura';
  if (/^(imc|indice|fecha|nota|comentario|observ)/.test(n)) return 'skip';
  return 'medida';
}

export interface Hoja {
  rows: FilaInicial[];
  labels: string[];
}

/**
 * Convierte las filas de una hoja (objetos por encabezado) en filas de captura.
 * Sirve para el Excel inicial y para el final: del final se ignoran objetivo y meta.
 * Devuelve null si no hay columnas Nombre y Peso.
 */
export function parseSheet(json: Record<string, unknown>[]): Hoja | null {
  if (!json.length) return null;
  const heads: string[] = [];
  for (const r of json) for (const h of Object.keys(r)) if (!heads.includes(h)) heads.push(h);

  const map: Partial<Record<Rol, string>> = {};
  const meds: string[] = [];
  for (const h of heads) {
    const rol = rolDe(h);
    if (rol === 'medida') {
      if (json.some((r) => num(r[h]) != null)) meds.push(h);
    } else if (rol !== 'skip' && !(rol in map)) {
      map[rol] = h;
    }
  }
  if (!map.nombre || !map.peso) return null;

  const labels = meds.map((h) => {
    const s = String(h).replace(/_/g, ' ').trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  });

  const rows: FilaInicial[] = [];
  for (const r of json) {
    const nombre = String(r[map.nombre] ?? '').trim();
    if (!nombre) continue;
    let est = map.estatura ? num(r[map.estatura]) : null;
    if (est != null && est < 3) est = est * 100; // venía en metros
    const m: Medidas = {};
    meds.forEach((h, j) => {
      m[labels[j]] = num(r[h]);
    });
    rows.push({
      nombre,
      objetivo: map.objetivo ? goalOf(r[map.objetivo]) ?? '' : '',
      meta: map.meta ? num(r[map.meta]) : null,
      peso: num(r[map.peso]),
      estatura: est,
      m,
    });
  }
  return { rows, labels };
}
