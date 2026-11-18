import { leerEstado } from '@/lib/db';
import { comparar, rankings } from '@/lib/scoring';
import { destacados, resumen } from '@/lib/insights';
import Tablero, { type RankingKey } from '@/components/Tablero';
import type { Objetivo } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ r?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const rParam = sp?.r;
  const initial: RankingKey = rParam === 'pct' || rParam === 'meta' || rParam === 'kilos' ? rParam : 'kilos';

  const estado = leerEstado();
  const { filas, pendientes, avisos } = comparar(estado);
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
