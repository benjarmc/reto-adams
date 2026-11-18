import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Reto de Cambio',
  description: 'Peso, IMC y medidas antes y después. Tres rankings para saber quién avanzó más.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="wrap">
          <header>
            <h1>Reto de Cambio</h1>
            <p className="lede">
              Cada quien registra su punto de partida y su objetivo. Un mes después se capturan los datos finales y el
              tablero muestra quién avanzó más, medido contra su propia meta.
            </p>
          </header>
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
