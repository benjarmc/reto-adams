import type { Estado } from './types';
import type { Fila } from './scoring';
import { norm } from './scoring';
import { f1, sg } from './format';

const AVATARES = ['#FFD9CC', '#D6E0FF', '#CDEFE3', '#F6E1FF', '#FFF0C2'] as const;

export function colorAvatar(nombre: string): string {
  const s = norm(nombre);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATARES[h % AVATARES.length];
}

export function iniciales(nombre: string): string {
  const parts = String(nombre ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function categoriaImc(imc: number): string {
  if (!Number.isFinite(imc)) return '—';
  if (imc < 18.5) return 'Bajo peso';
  if (imc < 25) return 'Normal';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidad I';
  if (imc < 40) return 'Obesidad II';
  return 'Obesidad III';
}

function medidaKey(medidas: string[], label: string): string | null {
  const t = norm(label);
  return medidas.find((m) => norm(m) === t) ?? null;
}

export function resumen(filas: Fila[], estado: Estado) {
  const bajaron = filas.filter((f) => f.objetivo === 'bajar' && f.dPeso < 0);
  const kgBajados =
    bajaron.length === 0
      ? null
      : { total: bajaron.reduce((s, f) => s + -f.dPeso, 0), nombres: bajaron.map((f) => f.nombre) };

  const keyC = medidaKey(estado.medidas, 'cintura');
  let cinturaPromedio: { antes: number; despues: number; delta: number } | null = null;
  if (keyC) {
    const pares = filas
      .map((f) => {
        const ini = estado.inicial.find((r) => norm(r.nombre) === norm(f.nombre));
        const fin = estado.final.find((r) => norm(r.nombre) === norm(f.nombre));
        const a = ini?.m[keyC] ?? null;
        const b = fin?.m[keyC] ?? null;
        return a != null && b != null ? { a, b } : null;
      })
      .filter((x): x is { a: number; b: number } => x != null);
    if (pares.length) {
      const antes = pares.reduce((s, p) => s + p.a, 0) / pares.length;
      const despues = pares.reduce((s, p) => s + p.b, 0) / pares.length;
      cinturaPromedio = { antes, despues, delta: despues - antes };
    }
  }

  const enMetaNombres = filas.filter((f) => f.cumpl != null && f.cumpl >= 100).map((f) => f.nombre);
  const enMeta = { n: enMetaNombres.length, total: filas.length, nombres: enMetaNombres };

  const subieron = filas.filter((f) => f.objetivo === 'subir' && f.dPeso > 0);
  const masaGanada =
    subieron.length === 0
      ? null
      : { total: subieron.reduce((s, f) => s + f.dPeso, 0), nombres: subieron.map((f) => f.nombre) };

  return { kgBajados, cinturaPromedio, enMeta, masaGanada };
}

export function destacados(
  filas: Fila[],
  medidas: string[],
): { titulo: string; nombre: string; valor: string; icono: 'cintura' | 'imc' | 'constante' | 'medida' }[] {
  const out: { titulo: string; nombre: string; valor: string; icono: 'cintura' | 'imc' | 'constante' | 'medida' }[] = [];

  const keyC = medidaKey(medidas, 'cintura');
  const firstMed = keyC ?? medidas[0] ?? null;
  if (firstMed) {
    let best: Fila | null = null;
    let bestDelta = Infinity;
    for (const f of filas) {
      const d = f.dm[firstMed];
      if (d != null && d < bestDelta) {
        bestDelta = d;
        best = f;
      }
    }
    if (best && bestDelta < 0) {
      out.push({
        titulo: keyC ? 'Mayor reducción de cintura' : `Mayor reducción de ${firstMed}`,
        nombre: best.nombre,
        valor: `${sg(bestDelta)} cm`,
        icono: keyC ? 'cintura' : 'medida',
      });
    }
  }

  let bestImc: Fila | null = null;
  let bestDImc = Infinity;
  for (const f of filas) {
    if (f.dImc < bestDImc) {
      bestDImc = f.dImc;
      bestImc = f;
    }
  }
  if (bestImc && bestDImc < 0) {
    out.push({
      titulo: 'Mayor baja de IMC',
      nombre: bestImc.nombre,
      valor: `${f1(bestImc.imcI)} → ${f1(bestImc.imcF)}`,
      icono: 'imc',
    });
  }

  const mantener = filas.filter((f) => f.objetivo === 'mantener');
  if (mantener.length) {
    let bestM = mantener[0];
    for (const f of mantener) {
      if (Math.abs(f.dPeso) < Math.abs(bestM.dPeso)) bestM = f;
    }
    out.push({
      titulo: 'La más constante',
      nombre: bestM.nombre,
      valor: `±${f1(Math.abs(bestM.dPeso))} kg`,
      icono: 'constante',
    });
  }

  return out.slice(0, 3);
}

export function posiciones(filas: Fila[]): Record<string, { kilos: number; pct: number; meta: number | null }> {
  const byKilos = filas.slice().sort((a, b) => b.fav - a.fav);
  const byPct = filas.slice().sort((a, b) => b.favPct - a.favPct);
  const byMeta = filas.filter((f) => f.cumpl != null).sort((a, b) => (b.cumpl as number) - (a.cumpl as number));

  const out: Record<string, { kilos: number; pct: number; meta: number | null }> = {};
  for (const f of filas) {
    out[norm(f.nombre)] = {
      kilos: byKilos.findIndex((x) => norm(x.nombre) === norm(f.nombre)) + 1,
      pct: byPct.findIndex((x) => norm(x.nombre) === norm(f.nombre)) + 1,
      meta: (() => {
        const i = byMeta.findIndex((x) => norm(x.nombre) === norm(f.nombre));
        return i >= 0 ? i + 1 : null;
      })(),
    };
  }
  return out;
}
