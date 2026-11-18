'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS: [string, string][] = [
  ['/', 'Resultados'],
  ['/datos', 'Captura'],
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="site-nav" aria-label="Secciones">
      {ITEMS.map(([href, label]) => {
        const current = href === '/' ? pathname === '/' || pathname.startsWith('/persona') : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={current ? 'page' : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
