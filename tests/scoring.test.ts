import test from 'node:test';
import assert from 'node:assert/strict';
import { calcRow, comparar, goalOf, norm, num, rankings } from '../src/lib/scoring';
import { parseSheet } from '../src/lib/parse';
import { sanitizarEstado } from '../src/lib/validate';
import { DEMO } from '../src/lib/demo';

test('los tres rankings de ejemplo tienen ganadores distintos', () => {
  const { filas, pendientes } = comparar(DEMO);
  assert.equal(filas.length, 5);
  assert.equal(pendientes.length, 0);
  const r = rankings(filas, DEMO.margen);
  assert.equal(r.kilos[0].nombre, 'Chuy'); // 4.0 kg a favor
  assert.equal(r.porcentaje[0].nombre, 'Benja'); // 3.68 % de su peso
  assert.equal(r.cumplimiento[0].nombre, 'Lupita'); // se mantuvo dentro del margen
});

test('quien busca mantenerse: 0 dentro del margen, resta lo que se pasa', () => {
  const base = { objetivo: 'mantener' as const, meta: null, peso: 58.4, estatura: 158, m: {} };
  const dentro = calcRow(base, { peso: 58.9, estatura: null, m: {} }, 1);
  assert.equal(dentro.fav, 0);
  assert.equal(dentro.cumpl, 100);
  const fuera = calcRow(base, { peso: 60.4, estatura: null, m: {} }, 1);
  assert.ok(Math.abs(fuera.fav + 1) < 1e-9);
  assert.equal(fuera.cumpl, 0);
});

test('bajar y subir miden en la dirección de la meta', () => {
  const bajar = calcRow({ objetivo: 'bajar', meta: 4, peso: 68, estatura: 163, m: {} }, { peso: 65.8, estatura: null, m: {} }, 1);
  assert.ok(Math.abs(bajar.fav - 2.2) < 1e-9);
  assert.ok(Math.abs((bajar.cumpl as number) - 55) < 1e-9);
  const malDireccion = calcRow({ objetivo: 'subir', meta: 3, peso: 61, estatura: 172, m: {} }, { peso: 60, estatura: null, m: {} }, 1);
  assert.ok(malDireccion.fav < 0);
  assert.ok((malDireccion.cumpl as number) < 0);
});

test('IMC y cambio por medida', () => {
  const c = calcRow({ objetivo: 'bajar', meta: 4, peso: 68, estatura: 163, m: { Cintura: 82 } }, { peso: 65.8, estatura: null, m: { Cintura: 79.5 } }, 1);
  assert.ok(Math.abs(c.imcI - 25.59) < 0.01);
  assert.ok(Math.abs(c.dImc + 0.83) < 0.01);
  assert.equal(c.dm.Cintura, -2.5);
});

test('quien no tiene final queda pendiente y un final sin inicial avisa', () => {
  const e = structuredClone(DEMO);
  e.final = e.final.filter((f) => f.nombre !== 'Mau');
  e.final.push({ nombre: 'Fantasma', peso: 70, estatura: null, m: {} });
  const { filas, pendientes, avisos } = comparar(e);
  assert.equal(filas.length, 4);
  assert.equal(pendientes[0].nombre, 'Mau');
  assert.ok(avisos.some((a) => a.includes('Fantasma')));
});

test('los nombres se cruzan sin importar acentos ni mayúsculas', () => {
  const e = structuredClone(DEMO);
  e.inicial[0].nombre = 'Rosélá';
  e.final[0].nombre = '  rosela ';
  assert.equal(comparar(e).filas.length, 5);
});

test('parseSheet entiende encabezados de Excel', () => {
  const hoja = parseSheet([
    { Nombre: 'Ana', Objetivo: 'Bajar de peso', Meta_kg: 3, 'Peso (kg)': '70,5', Estatura: 1.65, Cintura: 80, Notas: 'x' },
    { Nombre: '', Objetivo: 'bajar', Peso: 60 },
  ]);
  assert.ok(hoja);
  assert.deepEqual(hoja.labels, ['Cintura']);
  assert.equal(hoja.rows.length, 1);
  assert.deepEqual(hoja.rows[0], { nombre: 'Ana', objetivo: 'bajar', meta: 3, peso: 70.5, estatura: 165, m: { Cintura: 80 } });
  assert.equal(parseSheet([{ Algo: 1 }]), null);
});

test('sanitizarEstado descarta basura y respeta límites', () => {
  assert.equal(sanitizarEstado('hola'), null);
  const e = sanitizarEstado({
    margen: -3,
    medidas: ['Cintura', 'cintura', ''],
    inicial: [{ nombre: ' Ana ', objetivo: 'volar', peso: 9999, estatura: 160, m: { Cintura: 80, Otra: 5 } }, { nombre: '' }],
    final: [{ nombre: 'Ana', peso: 70, m: { Cintura: 'x' } }],
  });
  assert.ok(e);
  assert.equal(e.margen, 1);
  assert.deepEqual(e.medidas, ['Cintura']);
  assert.equal(e.inicial.length, 1);
  assert.equal(e.inicial[0].nombre, 'Ana');
  assert.equal(e.inicial[0].objetivo, '');
  assert.equal(e.inicial[0].peso, null);
  assert.deepEqual(e.inicial[0].m, { Cintura: 80 });
  assert.deepEqual(e.final[0].m, { Cintura: null });
});

test('utilidades de texto y números', () => {
  assert.equal(goalOf('Bajar de peso'), 'bajar');
  assert.equal(goalOf('MANTENER'), 'mantener');
  assert.equal(goalOf('Ganar masa'), 'subir');
  assert.equal(goalOf(''), null);
  assert.equal(num('70,5 kg'), 70.5);
  assert.equal(num(''), null);
  assert.equal(norm('  Cintura  '), 'cintura');
});
