import { parseSheet, type Hoja } from './parse';

/** Lee la primera hoja de un .xlsx, .xls o .csv. Solo se usa en el navegador. */
export async function leerArchivo(file: File): Promise<Hoja | null> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: true });
  return parseSheet(json);
}
