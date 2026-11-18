'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS: [string, string][] = [
  ['/', 'Resultados'],
  ['/datos', 'Datos'],
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="tabs" aria-label="Secciones">
      {ITEMS.map(([href, label]) => (
        <Link key={href} href={href} className="tab" aria-current={pathname === href ? 'page' : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
