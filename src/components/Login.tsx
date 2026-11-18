'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState('');
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
    <form className="card sec" onSubmit={entrar} style={{ maxWidth: 380 }}>
      <h2>Captura de datos</h2>
      <p className="muted small" style={{ margin: 0 }}>
        Los resultados son públicos. Para cargar o editar datos, entra con la contraseña del reto.
      </p>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <input
          className="in"
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <div className="status err" role="alert">{error}</div>}
      <div className="tools">
        <button className="btn primary" type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </div>
    </form>
  );
}
