import { NextResponse } from 'next/server';
import { ping } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Para el healthcheck de Docker y de Dokploy: confirma que la base abre y responde. */
export async function GET() {
  try {
    ping();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
