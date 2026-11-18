import Link from 'next/link';
import type { Estado } from '@/lib/types';
import { comparar, rankings, type Item } from '@/lib/scoring';
import { GOALS, f1, sg, tono } from '@/lib/format';

function RankCard({ titulo, desc, items, vacio }: { titulo: string; desc: string; items: Item[]; vacio?: string }) {
  return (
    <article className="rank-card">
      <h2>{titulo}</h2>
      <p>{desc}</p>
      {items.length === 0 ? (
        <p className="muted">{vacio ?? 'Sin datos para este ranking.'}</p>
      ) : (
        <ol className="rank-list">
          {items.map((it, k) => (
            <li key={it.nombre} className={`rank-item${k === 0 ? ' first' : ''}`}>
              <span className="pos">{k + 1}</span>
              <span className="who">{it.nombre}</span>
              <span className={`val num ${it.tono}`}>{it.principal}</span>
              <span className="sub">{it.sub}</span>
              <span className="bar">
                <i style={{ width: `${Math.round(Math.max(0, Math.min(1, it.barra)) * 100)}%` }} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

function Podium({ items }: { items: Item[] }) {
  const top = items.slice(0, 3);
  if (top.length === 0) return null;

  const slotClass = (k: number) => {
    if (k === 0) return 'podium-slot first slot-1';
    if (k === 1) return 'podium-slot second slot-2';
    return 'podium-slot third slot-3';
  };

  return (
    <ol className="podium" aria-label="Podio kilos a favor">
      {top.map((it, k) => (
        <li key={it.nombre} className={slotClass(k)}>
          <span className="place" aria-label={`Puesto ${k + 1}`}>
            {k + 1}
          </span>
          <span className="who">{it.nombre}</span>
          <span className={`val num ${it.tono}`}>{it.principal}</span>
          <span className="sub">{it.sub}</span>
        </li>
      ))}
    </ol>
  );
}

export default function Resultados({ estado }: { estado: Estado }) {
  const { filas, pendientes, avisos } = comparar(estado);
  const r = rankings(filas, estado.margen);
  const restoKilos = r.kilos.slice(3);

  return (
    <div className="sec">
      <p className="meta-line">
        Margen para quien busca mantenerse: ±{f1(estado.margen)} kg. Se cambia en la pestaña Datos.
      </p>

      {avisos.length > 0 && (
        <ul className="warns">
          {avisos.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}

      {filas.length === 0 ? (
        <div className="card empty">
          <h2>Todavía no hay nada que comparar</h2>
          <p className="muted">
            Carga o captura los datos iniciales y los finales en la pestaña <Link href="/datos">Datos</Link>. Cada
            persona necesita aparecer en las dos con el mismo nombre.
          </p>
        </div>
      ) : (
        <>
          <section className="podium-block" aria-labelledby="podio-titulo">
            <header>
              <h2 id="podio-titulo">Más kilos a favor</h2>
              <p>Cambio de peso en la dirección de su objetivo. El podio marca a quienes más avanzaron.</p>
            </header>
            <Podium items={r.kilos} />
            {restoKilos.length > 0 && (
              <ol className="rank-list" style={{ marginTop: 4 }}>
                {restoKilos.map((it, k) => (
                  <li key={it.nombre} className="rank-item">
                    <span className="pos">{k + 4}</span>
                    <span className="who">{it.nombre}</span>
                    <span className={`val num ${it.tono}`}>{it.principal}</span>
                    <span className="sub">{it.sub}</span>
                    <span className="bar">
                      <i style={{ width: `${Math.round(Math.max(0, Math.min(1, it.barra)) * 100)}%` }} />
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="ranks">
            <RankCard
              titulo="Mayor cambio porcentual"
              desc="Kilos a favor entre el peso inicial. Parejo entre cuerpos de distinto tamaño."
              items={r.porcentaje}
            />
            <RankCard
              titulo="Cumplimiento de la meta"
              desc={
                r.sinMeta.length
                  ? `Sin meta en kg, fuera de este ranking: ${r.sinMeta.join(', ')}.`
                  : 'Qué parte de su propia meta logró cada quien.'
              }
              items={r.cumplimiento}
              vacio="Nadie capturó una meta en kg."
            />
          </div>

          <div className="section-title">
            <h2>Detalle por persona</h2>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Objetivo</th>
                  <th>Peso (kg)</th>
                  <th>Δ peso</th>
                  <th>Δ %</th>
                  <th>IMC</th>
                  <th>Δ IMC</th>
                  {estado.medidas.map((m) => (
                    <th key={m}>Δ {m} (cm)</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.nombre}>
                    <td>
                      <strong>{f.nombre}</strong>
                    </td>
                    <td>{GOALS[f.objetivo]}</td>
                    <td>
                      {f1(f.pI)} → {f1(f.pF)}
                    </td>
                    <td className={tono(f.fav)}>{sg(f.dPeso)} kg</td>
                    <td>{sg(f.pct)}%</td>
                    <td>
                      {f1(f.imcI)} → {f1(f.imcF)}
                    </td>
                    <td>{sg(f.dImc, 2)}</td>
                    {estado.medidas.map((m) => (
                      <td key={m}>{f.dm[m] == null ? '—' : sg(f.dm[m])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pendientes.length > 0 && (
        <div className="card sec">
          <h2>Sin comparar todavía</h2>
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
