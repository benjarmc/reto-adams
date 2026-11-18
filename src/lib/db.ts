import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type { Estado, FilaFinal, FilaInicial, Medidas, Objetivo } from './types';
import { norm } from './scoring';
import { DEMO } from './demo';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS medidas (
  nombre TEXT PRIMARY KEY,
  orden  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS personas (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  clave    TEXT NOT NULL UNIQUE,            -- nombre normalizado, para cruzar inicial y final
  nombre   TEXT NOT NULL,
  objetivo TEXT CHECK (objetivo IN ('bajar','mantener','subir')),
  meta_kg  REAL
);
CREATE TABLE IF NOT EXISTS registros (
  persona_id  INTEGER NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  fase        TEXT NOT NULL CHECK (fase IN ('inicial','final')),
  peso_kg     REAL,
  estatura_cm REAL,
  medidas     TEXT NOT NULL DEFAULT '{}',   -- JSON: { "Cintura": 82, "Cadera": 100 }
  PRIMARY KEY (persona_id, fase)
);
`;

type Global = typeof globalThis & { __retoDb?: Database.Database };

function escribir(d: Database.Database, e: Estado): void {
  d.exec('DELETE FROM registros; DELETE FROM personas; DELETE FROM medidas;');
  d.prepare("INSERT INTO settings (key, value) VALUES ('margen', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(String(e.margen));

  const im = d.prepare('INSERT INTO medidas (nombre, orden) VALUES (?, ?)');
  e.medidas.forEach((m, i) => im.run(m, i));

  const ip = d.prepare('INSERT INTO personas (clave, nombre, objetivo, meta_kg) VALUES (?, ?, ?, ?)');
  const ir = d.prepare('INSERT INTO registros (persona_id, fase, peso_kg, estatura_cm, medidas) VALUES (?, ?, ?, ?, ?)');
  const ids = new Map<string, number>();
  const hechos = new Set<string>();

  const persona = (nombre: string, objetivo: Objetivo | '', meta: number | null): number => {
    const k = norm(nombre);
    let id = ids.get(k);
    if (id == null) {
      id = Number(ip.run(k, nombre, objetivo || null, meta).lastInsertRowid);
      ids.set(k, id);
    }
    return id;
  };

  for (const r of e.inicial) {
    if (!norm(r.nombre)) continue;
    const id = persona(r.nombre, r.objetivo, r.meta);
    if (hechos.has(`${id}:inicial`)) continue; // nombre repetido: gana la primera fila
    hechos.add(`${id}:inicial`);
    ir.run(id, 'inicial', r.peso, r.estatura, JSON.stringify(r.m));
  }
  for (const r of e.final) {
    if (!norm(r.nombre)) continue;
    const id = persona(r.nombre, '', null);
    if (hechos.has(`${id}:final`)) continue;
    hechos.add(`${id}:final`);
    ir.run(id, 'final', r.peso, r.estatura, JSON.stringify(r.m));
  }
}

export function getDb(): Database.Database {
  const g = globalThis as Global;
  if (g.__retoDb) return g.__retoDb;

  const file = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'reto.db');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const d = new Database(file);
  d.pragma('journal_mode = WAL');
  d.pragma('foreign_keys = ON');
  d.exec(SCHEMA);
  g.__retoDb = d;

  if (process.env.SEED_DEMO === 'true') {
    const hay = d.prepare('SELECT COUNT(*) FROM personas').pluck().get() as number;
    const yaSembrada = d.prepare("SELECT 1 FROM settings WHERE key = 'demo_sembrada'").pluck().get();
    if (hay === 0 && !yaSembrada) {
      d.transaction(() => {
        escribir(d, DEMO);
        d.prepare("INSERT INTO settings (key, value) VALUES ('demo_sembrada', '1')").run();
      })();
    }
  }
  return d;
}

interface FilaDb {
  nombre: string;
  objetivo: Objetivo | null;
  meta_kg: number | null;
  fase: 'inicial' | 'final';
  peso_kg: number | null;
  estatura_cm: number | null;
  medidas: string;
}

export function leerEstado(): Estado {
  const d = getDb();
  const margen = Number(d.prepare("SELECT value FROM settings WHERE key = 'margen'").pluck().get() ?? 1) || 1;
  const medidas = d.prepare('SELECT nombre FROM medidas ORDER BY orden').pluck().all() as string[];
  const rows = d
    .prepare(
      `SELECT p.nombre, p.objetivo, p.meta_kg, r.fase, r.peso_kg, r.estatura_cm, r.medidas
         FROM personas p JOIN registros r ON r.persona_id = p.id
        ORDER BY p.id`,
    )
    .all() as FilaDb[];

  const inicial: FilaInicial[] = [];
  const final: FilaFinal[] = [];
  for (const r of rows) {
    const m = JSON.parse(r.medidas) as Medidas;
    if (r.fase === 'inicial') {
      inicial.push({ nombre: r.nombre, objetivo: r.objetivo ?? '', meta: r.meta_kg, peso: r.peso_kg, estatura: r.estatura_cm, m });
    } else {
      final.push({ nombre: r.nombre, peso: r.peso_kg, estatura: r.estatura_cm, m });
    }
  }
  return { margen, medidas, inicial, final };
}

/** Reemplaza todo el contenido en una sola transacción: o se guarda completo o no se guarda. */
export function guardarEstado(e: Estado): void {
  const d = getDb();
  d.transaction(() => escribir(d, e))();
}

export function ping(): void {
  getDb().prepare('SELECT 1').get();
}
