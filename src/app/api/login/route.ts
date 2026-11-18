import { NextResponse } from 'next/server';
import { COOKIE, authRequired, safeEqual, sessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!authRequired()) return NextResponse.json({ ok: true });

  let password = '';
  try {
    const b = (await req.json()) as { password?: unknown };
    password = typeof b.password === 'string' ? b.password : '';
  } catch {
    /* cuerpo vacío: cuenta como contraseña incorrecta */
  }

  if (!safeEqual(password, process.env.ADMIN_PASSWORD as string)) {
    await new Promise((r) => setTimeout(r, 400)); // frena la fuerza bruta
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }

  const https = req.headers.get('x-forwarded-proto') === 'https' || new URL(req.url).protocol === 'https:';
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: COOKIE,
    value: sessionToken(),
    httpOnly: true,
    sameSite: 'lax',
    secure: https,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
