import test from 'node:test';
import assert from 'node:assert/strict';
import { comparar, norm } from '../src/lib/scoring';
import { DEMO } from '../src/lib/demo';
import { categoriaImc, colorAvatar, destacados, iniciales, posiciones, resumen } from '../src/lib/insights';

test('resumen con DEMO', () => {
  const { filas } = comparar(DEMO);
  const r = resumen(filas, DEMO);
  assert.ok(r.kgBajados);
  assert.ok(Math.abs(r.kgBajados.total - 9.6) < 1e-9);
  assert.deepEqual(r.kgBajados.nombres.sort(), ['Benja', 'Chuy', 'Rosela']);
  assert.ok(r.cinturaPromedio);
  assert.ok(Math.abs(r.cinturaPromedio.delta - -2.0) < 1e-9);
  assert.equal(r.enMeta.n, 1);
  assert.deepEqual(r.enMeta.nombres, ['Lupita']);
  assert.ok(r.masaGanada);
  assert.ok(Math.abs(r.masaGanada.total - 2.2) < 1e-9);
  assert.deepEqual(r.masaGanada.nombres, ['Mau']);
});

test('destacados con DEMO', () => {
  const { filas } = comparar(DEMO);
  const d = destacados(filas, DEMO.medidas);
  assert.equal(d.length, 3);
  assert.equal(d[0].nombre, 'Chuy');
  assert.equal(d[0].icono, 'cintura');
  assert.match(d[0].valor, /5\.0/);
  assert.equal(d[1].nombre, 'Chuy');
  assert.equal(d[1].icono, 'imc');
  assert.equal(d[2].nombre, 'Lupita');
  assert.equal(d[2].icono, 'constante');
});

test('categoriaImc OMS', () => {
  assert.equal(categoriaImc(30.2), 'Obesidad I');
  assert.equal(categoriaImc(29.1), 'Sobrepeso');
  assert.equal(categoriaImc(18.49), 'Bajo peso');
});

test('posiciones Benja', () => {
  const { filas } = comparar(DEMO);
  const p = posiciones(filas);
  assert.deepEqual(p[norm('Benja')], { kilos: 2, pct: 1, meta: 3 });
});

test('iniciales y colorAvatar estables', () => {
  assert.equal(iniciales('Rosela'), 'RO');
  assert.equal(iniciales('Ana María'), 'AM');
  assert.equal(colorAvatar('Benja'), colorAvatar('benja'));
  assert.ok(colorAvatar('Benja').startsWith('#'));
});
