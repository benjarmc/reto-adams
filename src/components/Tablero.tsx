'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type CSSProperties } from 'react';
import type { Item } from '@/lib/scoring';
import type { Objetivo } from '@/lib/types';
import { f1, sg } from '@/lib/format';
import { colorAvatar, iniciales } from '@/lib/insights';

export type RankingKey = 'kilos' | 'pct' | 'meta';

export type TableroProps = {
  n: number;
  avisos: string[];
  pendientes: { nombre: string; motivo: string }[];
  rankings: {
    kilos: Item[];
    porcentaje: Item[];
    cumplimiento: Item[];
    sinMeta: string[];
  };
  objetivos: Record<string, Objetivo>;
  resumen: {
    kgBajados: { total: number; nombres: string[] } | null;
    cinturaPromedio: { antes: number; despues: number; delta: number } | null;
    enMeta: { n: number; total: number; nombres: string[] };
    masaGanada: { total: number; nombres: string[] } | null;
  };
  destacados: { titulo: string; nombre: string; valor: string; icono: 'cintura' | 'imc' | 'constante' | 'medida' }[];
  initial?: RankingKey;
  /** Vista previa con DEMO; no enlaza a fichas reales. */
  esDemo?: boolean;
};

const MODES: { key: RankingKey; label: string; short: string; title: string; desc: string }[] = [
  {
    key: 'kilos',
    label: 'Kilos a favor',
    short: 'kilos a favor',
    title: 'Más kilos a favor',
    desc: 'Cambio de peso en la dirección de su objetivo',
  },
  {
    key: 'pct',
    label: '% de cambio',
    short: 'porcentaje de cambio',
    title: 'Mayor cambio porcentual',
    desc: 'Kilos a favor entre el peso inicial',
  },
  {
    key: 'meta',
    label: 'Cumplimiento',
    short: 'cumplimiento de la meta',
    title: 'Cumplimiento de la meta',
    desc: 'Kilos a favor ÷ meta a cambiar (no el peso objetivo)',
  },
];

const HEIGHTS_DESK = [132, 184, 104];
const HEIGHTS_MOB = [64, 92, 48];
const COL_COLORS = ['var(--accent)', 'var(--first)', 'var(--ink)'];
const COL_FG = ['#ffffff', 'var(--first-ink)', '#ffffff'];

function chipObjetivo(o: Objetivo): { label: string; className: string } {
  if (o === 'bajar') return { label: '↓ Bajar', className: 'chip-obj bajar' };
  if (o === 'subir') return { label: '↑ Subir', className: 'chip-obj subir' };
  return { label: '= Mantener', className: 'chip-obj mantener' };
}

function Icono({ tipo }: { tipo: 'cintura' | 'imc' | 'constante' | 'medida' }) {
  if (tipo === 'cintura' || tipo === 'medida') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M4 12h16" />
        <path d="M8 8l-4 4 4 4" />
        <path d="M16 8l4 4-4 4" />
      </svg>
    );
  }
  if (tipo === 'imc') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 18l6-6 4 4 6-8" />
        <path d="M14 8h6v6" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M8 12h8" />
    </svg>
  );
}

const ICON_BG: Record<string, string> = {
  cintura: '#FFF0C2',
  medida: '#FFF0C2',
  imc: '#D6E0FF',
  constante: '#F6E1FF',
};

export default function Tablero({
  n,
  avisos,
  pendientes,
  rankings,
  objetivos,
  resumen,
  destacados,
  initial = 'kilos',
  esDemo = false,
}: TableroProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [mode, setMode] = useState<RankingKey>(initial);

  const meta = MODES.find((m) => m.key === mode)!;
  const list =
    mode === 'kilos' ? rankings.kilos : mode === 'pct' ? rankings.porcentaje : rankings.cumplimiento;

  function pick(k: RankingKey) {
    setMode(k);
    startTransition(() => {
      router.replace(`/?r=${k}`, { scroll: false });
    });
  }

  const top = list.slice(0, 3);
  const podiumOrder = [top[1], top[0], top[2]].filter(Boolean) as Item[];
  const podiumSlots = podiumOrder.map((it) => {
    const place = list.findIndex((x) => x.nombre === it.nombre); // 0,1,2
    return { it, place };
  });

  return (
    <div className={`tablero sec${esDemo ? ' tablero-demo' : ''}`}>
      {esDemo && (
        <div className="banner-fase">
          <div>
            <strong>Vista de ejemplo</strong>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              Así se ve el tablero con datos de muestra. No son resultados reales. Captura el inicio y el final para
              ver el tuyo.
            </p>
          </div>
          <Link className="btn primary" href="/datos">
            Empezar en Captura
          </Link>
        </div>
      )}
      {avisos.length > 0 && (
        <ul className="warns">
          {avisos.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}

      <div className="hero-board">
        <section className="hero-copy">
          <span className="eyebrow">
            {esDemo ? 'Ejemplo' : 'Corte final'} · {n} participante{n === 1 ? '' : 's'}
          </span>
          <h1 className="hero-title">¿Quién avanzó más?</h1>
          <p className="hero-sub">Cada quien contra su propia meta. Cambia de ranking para ver cómo se mueve el podio.</p>
        </section>
        <div className="seg" role="tablist" aria-label="Ranking">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={mode === m.key}
              className={mode === m.key ? 'on' : undefined}
              onClick={() => pick(m.key)}
            >
              <span className="seg-full">{m.label}</span>
              <span className="seg-short">{m.key === 'kilos' ? 'Kilos' : m.key === 'pct' ? '% cambio' : 'Meta'}</span>
            </button>
          ))}
        </div>

        <section className="podium-card" aria-label="Podio">
          <div className="podium-head">
            <h2>{meta.title}</h2>
            <span className="muted small">{meta.desc}</span>
          </div>
          <div className="podium-cols">
            {podiumSlots.map(({ it, place }) => {
              const desk = HEIGHTS_DESK[place] ?? 104;
              const mob = HEIGHTS_MOB[place] ?? 48;
              const bg = COL_COLORS[place] ?? 'var(--ink)';
              const fg = COL_FG[place] ?? '#fff';
              return (
                <div key={it.nombre} className={`podium-person place-${place + 1}`}>
                  <div
                    className={`avatar${place === 0 ? ' ring' : ''}`}
                    style={{ background: colorAvatar(it.nombre) }}
                  >
                    {iniciales(it.nombre)}
                  </div>
                  <div className="podium-meta">
                    <div className="podium-name">{it.nombre}</div>
                    <div className="podium-val num">{it.principal}</div>
                    <div className="podium-sub muted">{it.sub}</div>
                  </div>
                  <div
                    className="podium-col"
                    style={
                      {
                        '--h-desk': `${desk}px`,
                        '--h-mob': `${mob}px`,
                        background: bg,
                        color: fg,
                      } as CSSProperties
                    }
                  >
                    {place + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="kpi-row" aria-label="Números clave">
        {resumen.kgBajados && (
          <div className="kpi kpi-ink">
            <span className="kpi-label">Bajados entre todos</span>
            <span className="kpi-val num">{f1(resumen.kgBajados.total)} kg</span>
            <span className="kpi-sub">{resumen.kgBajados.nombres.join(', ')}</span>
          </div>
        )}
        {resumen.cinturaPromedio && (
          <div className="kpi">
            <span className="kpi-label">Cintura promedio</span>
            <span className="kpi-val num good">{sg(resumen.cinturaPromedio.delta)} cm</span>
            <span className="kpi-sub">
              De {f1(resumen.cinturaPromedio.antes)} a {f1(resumen.cinturaPromedio.despues)} cm
            </span>
          </div>
        )}
        {resumen.enMeta.total > 0 && (
          <div className="kpi">
            <span className="kpi-label">Llegaron a su meta</span>
            <span className="kpi-val num">
              {resumen.enMeta.n} de {resumen.enMeta.total}
            </span>
            <span className="kpi-sub">
              {resumen.enMeta.nombres.length ? resumen.enMeta.nombres.join(', ') : 'Nadie alcanzó el 100%'}
            </span>
          </div>
        )}
        {resumen.masaGanada && (
          <div className="kpi">
            <span className="kpi-label">Subió de masa</span>
            <span className="kpi-val num" style={{ color: 'var(--accent)' }}>
              {sg(resumen.masaGanada.total)} kg
            </span>
            <span className="kpi-sub">{resumen.masaGanada.nombres.join(', ')}</span>
          </div>
        )}
      </section>

      <section className="board-cols">
        <div className="table-card">
          <div className="table-card-head">
            <h2>Tabla completa</h2>
            <span className="muted small">Ordenada por {meta.short}</span>
          </div>
          <ol className="board-list">
            {list.map((it, i) => {
              const obj = objetivos[it.nombre];
              const chip = obj ? chipObjetivo(obj) : null;
              const w = Math.max(2, Math.round(Math.max(0, Math.min(1, it.barra)) * 100));
              const barColor = i === 0 ? 'var(--first)' : 'var(--accent)';
              const row = (
                <>
                  <span className="board-pos num">{i + 1}</span>
                  <span className="avatar sm" style={{ background: colorAvatar(it.nombre) }}>
                    {iniciales(it.nombre)}
                  </span>
                  <span className="board-mid">
                    <span className="board-line">
                      <span className="board-name">{it.nombre}</span>
                      {chip && <span className={chip.className}>{chip.label}</span>}
                    </span>
                    <span className="board-bar">
                      <i style={{ width: `${w}%`, background: barColor }} />
                    </span>
                    <span className="board-sub muted">{it.sub}</span>
                  </span>
                  <span className="board-val num">{it.principal}</span>
                </>
              );
              return (
                <li key={it.nombre}>
                  {esDemo ? (
                    <div className="board-row">{row}</div>
                  ) : (
                    <Link href={`/persona/${encodeURIComponent(it.nombre)}`} className="board-row">
                      {row}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
          {mode === 'meta' && rankings.sinMeta.length > 0 && (
            <p className="muted small" style={{ padding: '8px 16px 4px' }}>
              Sin meta en kg: {rankings.sinMeta.join(', ')}.
            </p>
          )}
        </div>

        <aside className="destacados" aria-label="Destacados">
          <h2>Destacados</h2>
          {destacados.map((d) => (
            <div key={d.titulo + d.nombre} className="destacado-card">
              <span className="destacado-icon" style={{ background: ICON_BG[d.icono] }}>
                <Icono tipo={d.icono} />
              </span>
              <span className="destacado-text">
                <span className="muted small">{d.titulo}</span>
                <span className="destacado-line">
                  {d.nombre} · <span className="num good">{d.valor}</span>
                </span>
              </span>
            </div>
          ))}
        </aside>
      </section>

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
