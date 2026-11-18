import type { Metadata } from 'next';
import { authRequired, isAdmin } from '@/lib/auth';
import { leerEstado } from '@/lib/db';
import Editor from '@/components/Editor';
import Login from '@/components/Login';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Datos · Reto de Cambio · Adams' };

export default async function Datos() {
  if (!(await isAdmin())) return <Login />;
  return <Editor estado={leerEstado()} conLogin={authRequired()} />;
}
