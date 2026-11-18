import { leerEstado } from '@/lib/db';
import Resultados from '@/components/Resultados';

// Lee la base en cada visita: nunca se pre-renderiza con datos viejos.
export const dynamic = 'force-dynamic';

export default function Page() {
  return <Resultados estado={leerEstado()} />;
}
