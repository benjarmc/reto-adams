import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { guardarEstado, leerEstado } from '@/lib/db';
import { sanitizarEstado } from '@/lib/validate';

export const dynamic = 'force-dynamic';

/** Lectura pública: sirve también como respaldo de los datos en JSON. */
export async function GET() {
  return NextResponse.json(leerEstado());
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'El cuerpo no es JSON válido' }, { status: 400 });
  }
  const estado = sanitizarEstado(body);
  if (!estado) return NextResponse.json({ error: 'Formato de datos inválido' }, { status: 400 });

  guardarEstado(estado);
  return NextResponse.json({ ok: true, personas: estado.inicial.length });
}
