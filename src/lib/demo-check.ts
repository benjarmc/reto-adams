import type { Estado } from './types';
import { DEMO } from './demo';
import { norm } from './scoring';

/** True si SEED_DEMO está activo y el estado coincide con los datos de ejemplo. */
export function esDatosDemo(estado: Estado): boolean {
  if (process.env.SEED_DEMO !== 'true') return false;
  if (estado.margen !== DEMO.margen) return false;
  if (estado.medidas.length !== DEMO.medidas.length) return false;
  if (estado.inicial.length !== DEMO.inicial.length || estado.final.length !== DEMO.final.length) return false;
  for (let i = 0; i < DEMO.medidas.length; i++) {
    if (norm(estado.medidas[i]) !== norm(DEMO.medidas[i])) return false;
  }
  const ini = [...estado.inicial].sort((a, b) => norm(a.nombre).localeCompare(norm(b.nombre)));
  const demoIni = [...DEMO.inicial].sort((a, b) => norm(a.nombre).localeCompare(norm(b.nombre)));
  for (let i = 0; i < demoIni.length; i++) {
    const a = ini[i];
    const b = demoIni[i];
    if (norm(a.nombre) !== norm(b.nombre) || a.objetivo !== b.objetivo || a.peso !== b.peso || a.meta !== b.meta) {
      return false;
    }
  }
  const fin = [...estado.final].sort((a, b) => norm(a.nombre).localeCompare(norm(b.nombre)));
  const demoFin = [...DEMO.final].sort((a, b) => norm(a.nombre).localeCompare(norm(b.nombre)));
  for (let i = 0; i < demoFin.length; i++) {
    if (norm(fin[i].nombre) !== norm(demoFin[i].nombre) || fin[i].peso !== demoFin[i].peso) return false;
  }
  return true;
}
