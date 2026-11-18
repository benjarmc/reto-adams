import type { Estado, FilaFinal, Medidas, Objetivo } from './types';
import { GOALS, f1, sg, tono } from './format';

/** Minúsculas, sin acentos ni signos: sirve para cruzar nombres y encabezados. */
export const norm = (s: unknown): string =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const num = (v: unknown): number | null => {
  if (v === '' || v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
};

export function goalOf(v: unknown): Objetivo | null {
  const s = norm(v);
  if (!s) return null;
  if (/^(baj|perd|reduc|dismin)/.test(s)) return 'bajar';
  if (/^mant/.test(s)) return 'mantener';
  if (/^(sub|gan|aument)/.test(s)) return 'subir';
  return null;
}

export interface Calculo {
  pI: number;
  pF: number;
  imcI: number;
  imcF: number;
  dImc: number;
  dPeso: number;
  /** Cambio de peso en % respecto al inicial (con signo real). */
  pct: number;
  /** Kilos a favor del objetivo. Negativo si fue en contra. */
  fav: number;
  /** Kilos a favor como % del peso inicial. */
  favPct: number;
  /** % de la meta lograda. null si no hay meta capturada. */
  cumpl: number | null;
  /** Cambio por medida en cm. */
  dm: Record<string, number | null>;
}

interface EntradaInicial {
  objetivo: Objetivo;
  meta: number | null;
  peso: number;
  estatura: number;
  m: Medidas;
}
interface EntradaFinal {
  peso: number;
  estatura: number | null;
  m: Medidas;
}

export function calcRow(i: EntradaInicial, f: EntradaFinal, margen: number): Calculo {
  const mg = margen > 0 ? margen : 0.1;
  const pI = i.peso;
  const pF = f.peso;
  const eF = f.estatura || i.estatura;
  const imcI = pI / Math.pow(i.estatura / 100, 2);
  const imcF = pF / Math.pow(eF / 100, 2);
  const dPeso = pF - pI;

  let fav: number;
  if (i.objetivo === 'bajar') fav = -dPeso;
  else if (i.objetivo === 'subir') fav = dPeso;
  else {
    const ad = Math.abs(dPeso);
    fav = ad <= mg ? 0 : -(ad - mg);
  }

  let cumpl: number | null = null;
  if (i.objetivo === 'mantener') {
    const ad = Math.abs(dPeso);
    cumpl = ad <= mg ? 100 : Math.max(0, 100 - ((ad - mg) / mg) * 100);
  } else if (i.meta != null && i.meta > 0) {
    cumpl = (fav / i.meta) * 100;
  }

  const dm: Record<string, number | null> = {};
  for (const k of Object.keys(i.m)) {
    const a = i.m[k];
    const b = f.m[k];
    dm[k] = a != null && b != null ? b - a : null;
  }

  return { pI, pF, imcI, imcF, dImc: imcF - imcI, dPeso, pct: (dPeso / pI) * 100, fav, favPct: (fav / pI) * 100, cumpl, dm };
}

export interface Fila extends Calculo {
  nombre: string;
  objetivo: Objetivo;
  meta: number | null;
}
export interface Pendiente {
  nombre: string;
  motivo: string;
}

/** Cruza iniciales con finales por nombre y calcula a quien ya se puede comparar. */
export function comparar(e: Estado): { filas: Fila[]; pendientes: Pendiente[]; avisos: string[] } {
  const fin = new Map<string, FilaFinal>();
  for (const r of e.final) {
    const k = norm(r.nombre);
    if (k && !fin.has(k)) fin.set(k, r);
  }
  const filas: Fila[] = [];
  const pendientes: Pendiente[] = [];
  const avisos: string[] = [];
  const vistos = new Set<string>();

  for (const i of e.inicial) {
    const k = norm(i.nombre);
    if (!k) continue;
    if (vistos.has(k)) {
      avisos.push(`${i.nombre} aparece repetido en los datos iniciales. Se usa la primera fila.`);
      continue;
    }
    vistos.add(k);
    if (!i.objetivo) {
      pendientes.push({ nombre: i.nombre, motivo: 'Falta el objetivo (bajar, mantener o subir).' });
      continue;
    }
    if (!(i.peso != null && i.peso > 0) || !(i.estatura != null && i.estatura > 0)) {
      pendientes.push({ nombre: i.nombre, motivo: 'Faltan peso o estatura iniciales.' });
      continue;
    }
    const f = fin.get(k);
    if (!f) {
      pendientes.push({ nombre: i.nombre, motivo: 'Todavía no tiene datos finales.' });
      continue;
    }
    if (!(f.peso != null && f.peso > 0)) {
      pendientes.push({ nombre: i.nombre, motivo: 'Falta el peso final.' });
      continue;
    }
    const c = calcRow(
      { objetivo: i.objetivo, meta: i.meta, peso: i.peso, estatura: i.estatura, m: i.m },
      { peso: f.peso, estatura: f.estatura, m: f.m },
      e.margen,
    );
    filas.push({ nombre: i.nombre, objetivo: i.objetivo, meta: i.meta, ...c });
  }
  const iniKeys = new Set(e.inicial.map((i) => norm(i.nombre)));
  fin.forEach((r, k) => {
    if (!iniKeys.has(k)) avisos.push(`${r.nombre} está en los datos finales pero no en los iniciales. Revisa que el nombre sea igual.`);
  });
  return { filas, pendientes, avisos };
}

export interface Item {
  nombre: string;
  principal: string;
  tono: '' | 'good' | 'bad';
  sub: string;
  /** 0 a 1, para la barra. */
  barra: number;
}

const verbo = (d: number): string =>
  Math.abs(d) < 0.05 ? 'Sin cambio de peso' : `${d < 0 ? 'Bajó' : 'Subió'} ${f1(Math.abs(d))} kg`;

export function rankings(filas: Fila[], margen: number) {
  const k = filas.slice().sort((a, b) => b.fav - a.fav);
  const maxK = Math.max(0.001, ...k.map((r) => r.fav));
  const kilos: Item[] = k.map((r) => ({
    nombre: r.nombre,
    principal: `${sg(r.fav)} kg`,
    tono: tono(r.fav),
    sub: `${verbo(r.dPeso)} · objetivo: ${GOALS[r.objetivo].toLowerCase()}`,
    barra: r.fav / maxK,
  }));

  const p = filas.slice().sort((a, b) => b.favPct - a.favPct);
  const maxP = Math.max(0.001, ...p.map((r) => r.favPct));
  const porcentaje: Item[] = p.map((r) => ({
    nombre: r.nombre,
    principal: `${sg(r.favPct)}%`,
    tono: tono(r.favPct),
    sub: `${f1(r.pI)} → ${f1(r.pF)} kg · ${GOALS[r.objetivo].toLowerCase()}`,
    barra: r.favPct / maxP,
  }));

  const c = filas.filter((r) => r.cumpl != null).sort((a, b) => (b.cumpl as number) - (a.cumpl as number));
  const cumplimiento: Item[] = c.map((r) => {
    const v = r.cumpl as number;
    return {
      nombre: r.nombre,
      principal: `${f1(v, 0)}%`,
      tono: v >= 100 ? 'good' : v < 0 ? 'bad' : '',
      sub:
        r.objetivo === 'mantener'
          ? `margen ±${f1(margen)} kg · se movió ${f1(Math.abs(r.dPeso))} kg`
          : `meta ${f1(r.meta)} kg · a favor ${sg(r.fav)} kg`,
      barra: v / 100,
    };
  });
  const sinMeta = filas.filter((r) => r.cumpl == null).map((r) => r.nombre);

  return { kilos, porcentaje, cumplimiento, sinMeta };
}
