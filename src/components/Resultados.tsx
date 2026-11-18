import Link from 'next/link';
import type { Estado } from '@/lib/types';
import { comparar, rankings, type Item } from '@/lib/scoring';
import { GOALS, f1, sg, tono } from '@/lib/format';

function RankCard({ titulo, desc, items, vacio }: { titulo: string; desc: string; items: Item[]; vacio?: string }) {
  return (
    <article className="card rank-card">
      <h2>{titulo}</h2>
      <p>{desc}</p>
      {items.length === 0 ? (
        <p>{vacio ?? 'Sin datos para este ranking.'}</p>
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

export default function Resultados({ estado }: { estado: Estado }) {
  const { filas, pendientes, avisos } = comparar(estado);
  const r = rankings(filas, estado.margen);

  return (
    <div className="sec">
      <p className="small muted" style={{ margin: 0 }}>
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
          <div className="ranks">
            <RankCard titulo="Más kilos a favor" desc="Cambio de peso en la dirección de su objetivo." items={r.kilos} />
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

          <h2>Detalle por persona</h2>
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

      <details>
        <summary>Cómo se calcula cada ranking</summary>
        <ul>
          <li>
            <strong>Más kilos a favor.</strong> Cambio de peso en la dirección de su objetivo. Quien quería bajar suma lo
            que bajó, quien quería subir suma lo que subió. Quien quería mantenerse suma 0 si se quedó dentro del margen
            y resta lo que se pasó.
          </li>
          <li>
            <strong>Mayor cambio porcentual.</strong> Esos kilos a favor divididos entre su peso inicial. Así una persona
            de 120 kg y una de 60 kg compiten en igualdad.
          </li>
          <li>
            <strong>Cumplimiento de la meta.</strong> Kilos a favor entre la meta en kilos que cada quien se puso. Quien
            busca mantenerse llega a 100% si se queda dentro del margen y baja hasta 0% cuando se mueve el doble del
            margen.
          </li>
          <li>El IMC se calcula con peso y estatura. Los cambios de IMC y de cada medida aparecen en el detalle por persona.</li>
        </ul>
      </details>
    </div>
  );
}
