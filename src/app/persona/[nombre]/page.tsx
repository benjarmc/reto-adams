import Link from 'next/link';
import { notFound } from 'next/navigation';
import { leerEstado } from '@/lib/db';
import { comparar, norm } from '@/lib/scoring';
import { categoriaImc, colorAvatar, iniciales, posiciones } from '@/lib/insights';
import { f1, sg } from '@/lib/format';

export const dynamic = 'force-dynamic';

const CIRC = 2 * Math.PI * 52;

function tonoMedida(objetivo: string, delta: number): 'good' | 'bad' | '' {
  if (Math.abs(delta) < 0.05) return '';
  if (objetivo === 'subir') return delta > 0 ? 'good' : 'bad';
  return delta < 0 ? 'good' : 'bad';
}

export default async function PersonaPage({
  params,
}: {
  params: Promise<{ nombre: string }>;
}) {
  const { nombre: raw } = await params;
  const nombreParam = decodeURIComponent(raw);
  const estado = leerEstado();
  const { filas } = comparar(estado);
  const fila = filas.find((f) => norm(f.nombre) === norm(nombreParam));
  if (!fila) notFound();

  const pos = posiciones(filas)[norm(fila.nombre)];
  const best = Math.min(...[pos.kilos, pos.pct, pos.meta].filter((x): x is number => x != null));

  const cumpl = fila.cumpl;
  const ringPct = cumpl == null ? null : Math.max(0, Math.min(100, cumpl));
  const dash = ringPct == null ? 0 : (ringPct / 100) * CIRC;

  let metaLine = '';
  let chipMeta = '';
  if (fila.objetivo === 'mantener') {
    chipMeta = `= Mantener ±${f1(estado.margen)} kg`;
    metaLine = `Se movió ${f1(Math.abs(fila.dPeso))} kg, dentro del margen de ±${f1(estado.margen)} kg.`;
    if (Math.abs(fila.dPeso) > estado.margen) {
      metaLine = `Se movió ${f1(Math.abs(fila.dPeso))} kg, fuera del margen de ±${f1(estado.margen)} kg.`;
    }
  } else if (fila.meta == null) {
    chipMeta = fila.objetivo === 'bajar' ? '↓ Bajar' : '↑ Subir';
    metaLine = 'Sin meta en kg';
  } else {
    const logro = Math.max(0, fila.fav);
    const falta = Math.max(0, fila.meta - logro);
    chipMeta = `${fila.objetivo === 'bajar' ? '↓ Bajar' : '↑ Subir'} ${f1(fila.meta)} kg`;
    if (fila.fav >= fila.meta) metaLine = `Logró ${f1(logro)} kg. Superó su meta.`;
    else metaLine = `Logró ${f1(logro)} kg. Le faltaron ${f1(falta)} kg.`;
  }

  const catI = categoriaImc(fila.imcI);
  const catF = categoriaImc(fila.imcF);
  const imcCambio =
    catI !== catF ? ` · ${fila.dImc < 0 ? 'bajó' : 'subió'} de ${catI.toLowerCase()} a ${catF.toLowerCase()}` : '';

  const iniRow = estado.inicial.find((r) => norm(r.nombre) === norm(fila.nombre));
  const finRow = estado.final.find((r) => norm(r.nombre) === norm(fila.nombre));

  return (
    <div className="persona sec">
      <div className="persona-back">
        <Link href="/" className="back-btn" aria-label="Volver a resultados">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="muted">Resultados</span>
      </div>

      <div className="persona-hero card">
        <div className="ring-wrap">
          <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={ringPct == null ? 'Sin meta' : `${f1(ringPct, 0)}% de la meta`}>
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-2)" strokeWidth="12" />
            {ringPct != null && (
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="var(--first)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${CIRC}`}
                transform="rotate(-90 60 60)"
              />
            )}
          </svg>
          <div className="ring-label">
            <span className="num ring-pct">{ringPct == null ? '—' : `${f1(ringPct, 0)}%`}</span>
            <span className="muted small">{ringPct == null ? 'Sin meta en kg' : 'de su meta'}</span>
          </div>
        </div>
        <div className="persona-id">
          <div className="persona-name-row">
            <span className="avatar sm" style={{ background: colorAvatar(fila.nombre) }}>
              {iniciales(fila.nombre)}
            </span>
            <h1>{fila.nombre}</h1>
          </div>
          <span className={`chip-obj ${fila.objetivo}`}>{chipMeta}</span>
          <span className="muted">{metaLine}</span>
        </div>
      </div>

      <div className="pos-grid">
        {(
          [
            ['kilos', 'Kilos a favor', pos.kilos],
            ['pct', '% de cambio', pos.pct],
            ['meta', 'Cumplimiento', pos.meta],
          ] as const
        ).map(([key, label, p]) => {
          const highlight = p != null && p === best;
          return (
            <div key={key} className={`pos-card${highlight ? ' best' : ''}`}>
              <span className="pos-num">#{p ?? '—'}</span>
              <span className="pos-label">{label}</span>
            </div>
          );
        })}
      </div>

      <div className="persona-stats">
        <div>
          <span className="stat-label">Peso</span>
          <span className="stat-val num">
            {f1(fila.pI)} → {f1(fila.pF)}
          </span>
          <span className={`stat-delta num ${fila.objetivo === 'subir' ? (fila.dPeso > 0 ? 'good' : 'bad') : fila.dPeso < 0 ? 'good' : fila.dPeso > 0 ? 'bad' : ''}`}>
            {sg(fila.dPeso)} kg · {sg(fila.pct)}%
          </span>
        </div>
        <div>
          <span className="stat-label">IMC</span>
          <span className="stat-val num">
            {f1(fila.imcI)} → {f1(fila.imcF)}
          </span>
          <span className={`stat-delta num ${fila.dImc < 0 ? 'good' : fila.dImc > 0 ? 'bad' : ''}`}>
            {sg(fila.dImc, 1)}
            {imcCambio}
          </span>
        </div>
      </div>

      <div className="card medidas-card">
        <h2>Medidas</h2>
        {estado.medidas.map((m) => {
          const a = iniRow?.m[m] ?? null;
          const b = finRow?.m[m] ?? null;
          const d = fila.dm[m];
          if (a == null && b == null) return null;
          const max = Math.max(a ?? 0, b ?? 0, 1);
          const w = b != null ? Math.max(2, Math.round((b / max) * 100)) : 0;
          const tono = d == null ? '' : tonoMedida(fila.objetivo, d);
          return (
            <div key={m} className="medida-row">
              <div className="medida-top">
                <span className="medida-name">{m}</span>
                <span className={`num ${tono}`}>{d == null ? '—' : `${sg(d)} cm`}</span>
              </div>
              <div className="medida-bar-row num">
                <span>{a == null ? '—' : f1(a)}</span>
                <span className="medida-track">
                  <i style={{ width: `${w}%` }} />
                </span>
                <span>{b == null ? '—' : f1(b)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
