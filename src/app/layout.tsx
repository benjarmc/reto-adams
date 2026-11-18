import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Saira_Condensed, Source_Sans_3 } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import Nav from '@/components/Nav';

const saira = Saira_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-saira',
  display: 'swap',
});

const source = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-source',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Reto de Cambio · Adams Academia',
  description: 'Peso, IMC y medidas antes y después. Tres rankings para saber quién avanzó más.',
  icons: { icon: '/logo-adams.png' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${saira.variable} ${source.variable}`}>
      <body>
        <div className="wrap">
          <header className="brand-bar">
            <Link href="/" className="brand-mark">
              <Image src="/logo-adams.png" alt="Adams Academia de Gimnasia" width={64} height={64} priority unoptimized />
              <div className="brand-copy">
                <p className="academy">Adams · Academia de Gimnasia</p>
                <h1>Reto de Cambio</h1>
                <p className="lede">
                  Cada quien parte de su meta. El marcador muestra quién avanzó más — kilos, porcentaje y cumplimiento.
                </p>
              </div>
            </Link>
          </header>
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
