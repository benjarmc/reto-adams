import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export const COOKIE = 'reto_session';

/** Sin ADMIN_PASSWORD la edición queda abierta. */
export const authRequired = (): boolean => Boolean(process.env.ADMIN_PASSWORD);

const secret = (): string => process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || '';

export const sessionToken = (): string =>
  crypto.createHmac('sha256', secret()).update('reto-admin-v1').digest('hex');

/** Comparación en tiempo constante, sin filtrar la longitud. */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export async function isAdmin(): Promise<boolean> {
  if (!authRequired()) return true;
  const c = (await cookies()).get(COOKIE)?.value;
  return Boolean(c) && safeEqual(c as string, sessionToken());
}
