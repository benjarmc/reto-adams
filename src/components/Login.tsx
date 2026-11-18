'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) router.refresh();
      else setError(res.status === 401 ? 'Contraseña incorrecta.' : 'No pude iniciar sesión. Intenta de nuevo.');
    } catch {
      setError('No hay conexión con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="card sec login-card" onSubmit={entrar}>
      <h2>Captura de datos</h2>
      <p className="muted small" style={{ margin: 0 }}>
        Cualquiera puede ver los resultados. Para editar, entra con la contraseña.
      </p>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <div className="password-wrap">
          <input
            className="cell"
            id="password"
            type={ver ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="password-eye"
            onClick={() => setVer((v) => !v)}
            aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            title={ver ? 'Ocultar' : 'Mostrar'}
          >
            {ver ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <path d="M1 1l22 22" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {error && (
        <div className="status err" role="alert">
          {error}
        </div>
      )}
      <div className="tools">
        <button className="btn primary" type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </div>
    </form>
  );
}
