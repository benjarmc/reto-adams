import type { Estado } from './types';

/** Datos inventados para probar la app. Se cargan solo con SEED_DEMO=true y la base vacía. */
export const DEMO: Estado = {
  margen: 1,
  medidas: ['Cintura', 'Cadera', 'Brazo'],
  inicial: [
    { nombre: 'Rosela', objetivo: 'bajar', meta: 4, peso: 68.0, estatura: 163, m: { Cintura: 82, Cadera: 100, Brazo: 28 } },
    { nombre: 'Benja', objetivo: 'bajar', meta: 5, peso: 92.5, estatura: 175, m: { Cintura: 104, Cadera: 106, Brazo: 34 } },
    { nombre: 'Mau', objetivo: 'subir', meta: 3, peso: 61.0, estatura: 172, m: { Cintura: 74, Cadera: 92, Brazo: 29 } },
    { nombre: 'Lupita', objetivo: 'mantener', meta: null, peso: 58.4, estatura: 158, m: { Cintura: 70, Cadera: 94, Brazo: 26 } },
    { nombre: 'Chuy', objetivo: 'bajar', meta: 8, peso: 118.0, estatura: 180, m: { Cintura: 121, Cadera: 116, Brazo: 38 } },
  ],
  final: [
    { nombre: 'Rosela', peso: 65.8, estatura: null, m: { Cintura: 79.5, Cadera: 98.5, Brazo: 27.5 } },
    { nombre: 'Benja', peso: 89.1, estatura: null, m: { Cintura: 100, Cadera: 104, Brazo: 33.5 } },
    { nombre: 'Mau', peso: 63.2, estatura: null, m: { Cintura: 75, Cadera: 93, Brazo: 30 } },
    { nombre: 'Lupita', peso: 58.9, estatura: null, m: { Cintura: 70.5, Cadera: 94, Brazo: 26 } },
    { nombre: 'Chuy', peso: 114.0, estatura: null, m: { Cintura: 116, Cadera: 113, Brazo: 37 } },
  ],
};
