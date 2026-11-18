import { leerEstado } from '@/lib/db';
import { comparar, rankings } from '@/lib/scoring';
import { destacados, resumen } from '@/lib/insights';
import { DEMO } from '@/lib/demo';
import Tablero, { type RankingKey } from '@/components/Tablero';
import MetasInicio from '@/components/MetasInicio';
import type { Objetivo } from '@/lib/types';

export const dynamic = 'force-dynamic';

function propsDesdeEstado(estado: typeof DEMO, initial: RankingKey, esDemo = false) {
  const { filas, pendientes, avisos } = comparar(estado);
  const r = rankings(filas, estado.margen);
  const objetivos: Record<string, Objetivo> = {};
  for (const f of filas) objetivos[f.nombre] = f.objetivo;
  return {
    n: filas.length,
    avisos,
    pendientes,
    rankings: r,
    objetivos,
    resumen: resumen(filas, estado),
    destacados: destacados(filas, estado.medidas),
    initial,
    esDemo,
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ r?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const rParam = sp?.r;
  const initial: RankingKey = rParam === 'pct' || rParam === 'meta' || rParam === 'kilos' ? rParam : 'kilos';

  const estado = leerEstado();
  const tieneIni = estado.inicial.some((r) => r.nombre.trim());
  const tieneFin = estado.final.some((r) => r.nombre.trim());

  // Sin datos: mostrar DEMO solo en pantalla (no se guarda en la BD).
  if (!tieneIni && !tieneFin) {
    return <Tablero {...propsDesdeEstado(DEMO, initial, true)} />;
  }

  const { filas, pendientes, avisos } = comparar(estado);

  // Hay iniciales pero aún no hay filas comparables → tabla de metas/objetivos.
  if (filas.length === 0 && tieneIni) {
    return (
      <MetasInicio
        inscritos={estado.inicial}
        margen={estado.margen}
        pendientes={pendientes}
        avisos={avisos}
      />
    );
  }

  if (filas.length === 0) {
    return <Tablero {...propsDesdeEstado(DEMO, initial, true)} />;
  }

  // Inicio + fin: tablero real.
  const r = rankings(filas, estado.margen);
  const objetivos: Record<string, Objetivo> = {};
  for (const f of filas) objetivos[f.nombre] = f.objetivo;

  return (
    <Tablero
      n={filas.length}
      avisos={avisos}
      pendientes={pendientes}
      rankings={r}
      objetivos={objetivos}
      resumen={resumen(filas, estado)}
      destacados={destacados(filas, estado.medidas)}
      initial={initial}
    />
  );
}
