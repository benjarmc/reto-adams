import Image from 'next/image';
import Link from 'next/link';
import { leerEstado } from '@/lib/db';
import { esDatosDemo } from '@/lib/demo-check';
import Nav from '@/components/Nav';
import ThemeToggle from '@/components/ThemeToggle';

export default function Header() {
  const demo = esDatosDemo(leerEstado());
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
          <Link href="/" className="brand">
            <Image
              className="brand-mark"
              src="/logo-adams.png"
              alt="Adams Academia de Gimnasia"
              width={40}
              height={40}
              priority
            />
            <span className="brand-text">
              <span className="brand-org">Adams · Academia de Gimnasia</span>
              <span className="brand-name">Reto de Cambio</span>
            </span>
          </Link>
          {demo && <span className="chip-demo">Datos de ejemplo</span>}
        </div>
        <div className="header-actions">
          <ThemeToggle />
          <Nav />
        </div>
      </div>
    </header>
  );
}
