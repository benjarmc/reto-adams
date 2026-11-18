/** @type {import('next').NextConfig} */
const nextConfig = {
  // Imagen mínima para Docker: server.js + solo las dependencias que se usan.
  output: 'standalone',
  // better-sqlite3 es un módulo nativo: no se empaqueta, se carga tal cual.
  serverExternalPackages: ['better-sqlite3'],
  poweredByHeader: false,
};

export default nextConfig;
