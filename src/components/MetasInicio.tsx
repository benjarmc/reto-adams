import Link from 'next/link';
import type { FilaInicial, Objetivo } from '@/lib/types';
import { f1 } from '@/lib/format';
import { colorAvatar, iniciales } from '@/lib/insights';

function chip(o: Objetivo | '') {
  if (o === 'bajar') return { label: '↓ Bajar', className: 'chip-obj bajar' };
  if (o === 'subir') return { label: '↑ Subir', className: 'chip-obj subir' };
  if (o === 'mantener') return { label: '= Mantener', className: 'chip-obj mantener' };
  return { label: 'Sin objetivo', className: 'chip-obj mantener' };
}

function metaCelda(r: FilaInicial, margen: number): { principal: string; sub?: string } {
  if (r.objetivo === 'mantener') return { principal: `±${f1(margen)} kg`, sub: 'Se mide por margen' };
  if (r.objetivo === 'bajar' || r.objetivo === 'subir') {
    if (r.meta == null || r.meta <= 0) return { principal: '—', sub: 'Falta meta en kg' };
    return {
      principal: `${f1(r.meta)} kg`,
      sub: r.objetivo === 'bajar' ? 'A bajar' : 'A subir',
    };
  }
  return { principal: '—' };
}

export default function MetasInicio({
  inscritos,
  margen,
  pendientes,
  avisos,
}: {
  inscritos: FilaInicial[];
  margen: number;
  pendientes: { nombre: string; motivo: string }[];
  avisos: string[];
}) {
  const lista = inscritos.filter((r) => r.nombre.trim());

  return (
    <div className="tablero sec metas-inicio">
      {avisos.length > 0 && (
        <ul className="warns">
          {avisos.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}

      <div className="banner-fase">
        <div>
          <strong>Inscripción lista · faltan datos finales</strong>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Ya hay punto de partida. Cuando cargues el corte final en Captura, aquí aparecen podio y rankings.
          </p>
        </div>
        <Link className="btn primary" href="/datos">
          Ir a Captura
        </Link>
      </div>

      <section className="hero-copy" style={{ maxWidth: 640 }}>
        <span className="eyebrow">
          {lista.length} participante{lista.length === 1 ? '' : 's'} · margen ±{f1(margen)} kg
        </span>
        <h1 className="hero-title">Metas del reto</h1>
        <p className="hero-sub">Así quedó cada quien al inicio: objetivo, meta a cambiar y peso de partida.</p>
      </section>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Persona</th>
                <th>Objetivo</th>
                <th>Meta</th>
                <th>Peso inicial</th>
                <th>Estatura</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((r) => {
                const c = chip(r.objetivo);
                return (
                  <tr key={r.nombre}>
                    <td>
                      <span className="name-cell">
                        <span className="avatar sm" style={{ background: colorAvatar(r.nombre) }}>
                          {iniciales(r.nombre)}
                        </span>
                        <strong>{r.nombre}</strong>
                      </span>
                    </td>
                    <td>
                      <span className={c.className}>{c.label}</span>
                    </td>
                    <td>
                      {(() => {
                        const m = metaCelda(r, margen);
                        return (
                          <>
                            <span className="num">{m.principal}</span>
                            {m.sub && (
                              <div className="muted small">{m.sub}</div>
                            )}
                          </>
                        );
                      })()}
                    </td>
                    <td className="num">{r.peso != null ? `${f1(r.peso)} kg` : '—'}</td>
                    <td className="num">{r.estatura != null ? `${f1(r.estatura, 0)} cm` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pendientes.length > 0 && (
        <div className="card sec">
          <h2>Pendiente para el ranking</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {pendientes.map((p) => (
              <li key={p.nombre}>
                <strong>{p.nombre}</strong>: {p.motivo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
