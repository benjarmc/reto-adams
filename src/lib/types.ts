export type Objetivo = 'bajar' | 'mantener' | 'subir';

/** Medidas en cm por nombre de medida (Cintura, Cadera, Brazo...). */
export type Medidas = Record<string, number | null>;

export interface FilaInicial {
  nombre: string;
  objetivo: Objetivo | '';
  /** Meta en kg a cambiar. Solo aplica a quien quiere bajar o subir. */
  meta: number | null;
  peso: number | null;
  /** Estatura en cm. */
  estatura: number | null;
  m: Medidas;
}

export interface FilaFinal {
  nombre: string;
  peso: number | null;
  /** Opcional: si falta se usa la estatura inicial. */
  estatura: number | null;
  m: Medidas;
}

export interface Estado {
  /** Margen en kg (±) para quien busca mantenerse. */
  margen: number;
  medidas: string[];
  inicial: FilaInicial[];
  final: FilaFinal[];
}
