/**
 * Carga .env (via @next/env) antes de lanzar next.
 * El CLI de Next lee process.env.PORT al parsear flags; sin esto, PORT en .env se ignora.
 */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Uso: node scripts/with-env.mjs <comando> [...args]');
  process.exit(1);
}

const nextBin = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, ...args], {
  stdio: 'inherit',
  env: process.env,
});
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
