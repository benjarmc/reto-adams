'use client';

import { useEffect, useState, type DragEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { Estado, FilaFinal, FilaInicial, Medidas, Objetivo } from '@/lib/types';
import { norm, num } from '@/lib/scoring';
import { GOALS } from '@/lib/format';
import { leerArchivo } from '@/lib/excel';
import { colorAvatar, iniciales } from '@/lib/insights';
import HelpTip from '@/components/HelpTip';

type RI = FilaInicial & { id: string };
type RF = FilaFinal & { id: string };
type Tab = 'ini' | 'fin';
type Mensaje = { text: string; err?: boolean } | null;
type FileInfo = { name: string; personas: number; medidas: string[]; warn?: string };

let seq = 0;
const uid = () => `r${++seq}`;
const conId = <T,>(r: T): T & { id: string } => ({ ...r, id: uid() });

/** Arma filas finales desde el inicial; conserva peso/medidas ya capturados. */
function mergeFinDesdeIni(iniList: { nombre: string }[], fin: RF[]): RF[] {
  const byKey = new Map<string, RF>();
  for (const f of fin) {
    const k = norm(f.nombre);
    if (k && !byKey.has(k)) byKey.set(k, f);
  }
  const out: RF[] = [];
  const seen = new Set<string>();
  for (const i of iniList) {
    const k = norm(i.nombre);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    const prev = byKey.get(k);
    if (prev) out.push({ ...prev, nombre: i.nombre.trim(), estatura: null });
    else out.push(conId<FilaFinal>({ nombre: i.nombre.trim(), peso: null, estatura: null, m: {} }));
  }
  return out;
}

function N({ id, value, label, onChange }: { id: string; value: number | null; label: string; onChange: (v: number | null) => void }) {
  return (
    <input
      className="cell"
      id={id}
      inputMode="decimal"
      defaultValue={value ?? ''}
      aria-label={label}
      onChange={(e) => onChange(num(e.target.value))}
    />
  );
}

function CardField({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="card-field">
      <div className="card-field-label">{label}</div>
      {children}
    </div>
  );
}

const META_HELP = (
  <HelpTip label="Ayuda: qué significa Meta">
    <strong>No pongas el peso al que quieres llegar.</strong>
    <p>
      Pon cuántos kilos quieres <em>bajar o subir</em>. Si pesas 100 y quieres llegar a 90, la meta es <strong>10</strong>.
    </p>
    <p className="muted small" style={{ marginBottom: 0 }}>
      Si eliges mantener, no uses meta: cuenta el margen (± kg).
    </p>
  </HelpTip>
);

const MEDIDA_HELP = (
  <HelpTip label="Ayuda: qué son las medidas">
    <strong>Cintura, cadera, brazo… en cm</strong>
    <p>Se anotan al inicio y al final para ver el cambio de cada una.</p>
    <p className="muted small" style={{ marginBottom: 0 }}>
      No definen el podio; salen en Destacados y en la ficha de cada persona.
    </p>
  </HelpTip>
);

function statusIni(r: RI): { text: string; kind: string } {
  if (!r.nombre.trim()) return { text: 'Sin nombre', kind: 'warn' };
  if (r.peso == null || r.estatura == null) return { text: 'Falta peso o estatura', kind: 'warn' };
  if (r.objetivo === 'mantener') return { text: 'Ok · usa el margen', kind: 'ok' };
  if ((r.objetivo === 'bajar' || r.objetivo === 'subir') && (r.meta == null || r.meta <= 0)) {
    return { text: 'Falta meta', kind: 'warn' };
  }
  if (!r.objetivo) return { text: 'Falta objetivo', kind: 'warn' };
  return { text: 'Listo', kind: 'ok' };
}

function statusFin(r: RF, iniNames: Set<string>): { text: string; kind: string } {
  if (!r.nombre.trim()) return { text: 'Sin nombre', kind: 'warn' };
  if (!iniNames.has(norm(r.nombre))) return { text: 'No está en el inicial', kind: 'warn' };
  if (r.peso == null) return { text: 'Falta peso', kind: 'warn' };
  return { text: 'Listo', kind: 'ok' };
}

export default function Editor({ estado, conLogin }: { estado: Estado; conLogin: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('ini');
  const [margen, setMargen] = useState(estado.margen);
  const [medidas, setMedidas] = useState<string[]>(estado.medidas);
  const [ini, setIni] = useState<RI[]>(() => estado.inicial.map(conId));
  const [fin, setFin] = useState<RF[]>(() => mergeFinDesdeIni(estado.inicial, estado.final.map(conId)));
  const [nuevaM, setNuevaM] = useState('');
  const [showMedida, setShowMedida] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Mensaje>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [lastFile, setLastFile] = useState<FileInfo | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 719px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const touch = () => setDirty(true);
  const iniNames = new Set(ini.map((r) => norm(r.nombre)).filter(Boolean));

  const patchIni = (id: string, p: Partial<FilaInicial>) => {
    setIni((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    touch();
  };
  const patchIniM = (id: string, m: string, v: number | null) => {
    setIni((rs) => rs.map((r) => (r.id === id ? { ...r, m: { ...r.m, [m]: v } } : r)));
    touch();
  };
  const patchFin = (id: string, p: Partial<FilaFinal>) => {
    setFin((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    touch();
  };
  const patchFinM = (id: string, m: string, v: number | null) => {
    setFin((rs) => rs.map((r) => (r.id === id ? { ...r, m: { ...r.m, [m]: v } } : r)));
    touch();
  };

  const confirmar = (key: string, accion: () => void) => {
    if (armed === key) {
      setArmed(null);
      accion();
    } else {
      setArmed(key);
      setTimeout(() => setArmed((a) => (a === key ? null : a)), 3500);
    }
  };

  async function onFile(kind: Tab, file: File | undefined) {
    if (!file) return;
    try {
      const p = await leerArchivo(file);
      if (!p || !p.rows.length) {
        setMsg({ text: 'El archivo necesita al menos las columnas Nombre y Peso, con una fila por persona.', err: true });
        setLastFile({ name: file.name, personas: 0, medidas: [], warn: 'Sin filas válidas' });
        return;
      }
      if (kind === 'ini') {
        const rows = p.rows.map(conId);
        setIni(rows);
        setMedidas(p.labels);
        setFin((prev) => mergeFinDesdeIni(rows, prev));
      } else {
        const meds = [...medidas];
        for (const l of p.labels) if (!meds.some((m) => norm(m) === norm(l))) meds.push(l);
        setMedidas(meds);
        const incoming = p.rows.map((r) => {
          const m: Medidas = {};
          for (const l of p.labels) {
            const destino = meds.find((x) => norm(x) === norm(l)) as string;
            m[destino] = r.m[l] ?? null;
          }
          return conId<FilaFinal>({ nombre: r.nombre, peso: r.peso, estatura: null, m });
        });
        // Cruza por nombre con quienes ya están en el inicial; no inventa participantes nuevos.
        setFin((prev) => {
          const base = mergeFinDesdeIni(ini, prev);
          const byKey = new Map(incoming.map((r) => [norm(r.nombre), r] as const));
          return base.map((row) => {
            const hit = byKey.get(norm(row.nombre));
            if (!hit) return row;
            return { ...row, peso: hit.peso, m: { ...row.m, ...hit.m }, estatura: null };
          });
        });
      }
      touch();
      const warn =
        kind === 'fin'
          ? p.rows.some((r) => !iniNames.has(norm(r.nombre)))
            ? 'Hay nombres que no están en el inicial'
            : undefined
          : undefined;
      setLastFile({ name: file.name, personas: p.rows.length, medidas: p.labels, warn });
      setMsg({
        text: `Cargadas ${p.rows.length} personas${p.labels.length ? ` y ${p.labels.length} medidas (${p.labels.join(', ')})` : ''}. Revisa la tabla y toca Guardar.`,
      });
    } catch {
      setMsg({ text: 'No pude leer el archivo. Revisa que sea .xlsx, .xls o .csv.', err: true });
    }
  }

  async function descargarPlantilla() {
    const heads = tab === 'ini' ? ['Nombre', 'Objetivo', 'Meta_kg', 'Peso', 'Estatura', ...medidas] : ['Nombre', 'Peso', ...medidas];
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet([heads]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tab === 'ini' ? 'Inicial' : 'Final');
    XLSX.writeFile(wb, tab === 'ini' ? 'plantilla-inicial.xlsx' : 'plantilla-final.xlsx');
  }

  function agregarMedida() {
    const v = nuevaM.trim();
    if (v && !medidas.some((m) => norm(m) === norm(v))) {
      setMedidas([...medidas, v]);
      setNuevaM('');
      setShowMedida(false);
      touch();
    }
  }

  async function guardar() {
    setSaving(true);
    setMsg(null);
    const body: Estado = {
      margen,
      medidas,
      inicial: ini.map(({ id: _id, ...r }) => r),
      final: fin.map(({ id: _id, ...r }) => r),
    };
    try {
      const res = await fetch('/api/state', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (res.status === 401) {
        setMsg({ text: 'Tu sesión terminó. Recarga la página y entra de nuevo.', err: true });
      } else if (!res.ok) {
        setMsg({ text: 'No se pudo guardar. Revisa los datos e intenta de nuevo.', err: true });
      } else {
        setDirty(false);
        setMsg({ text: 'Guardado. Ya se actualizaron los resultados.' });
        router.refresh();
      }
    } catch {
      setMsg({ text: 'No hay conexión con el servidor.', err: true });
    } finally {
      setSaving(false);
    }
  }

  async function salir() {
    await fetch('/api/logout', { method: 'POST' });
    router.refresh();
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void onFile(tab, e.dataTransfer.files?.[0]);
  }

  const rows = tab === 'ini' ? ini : fin;

  return (
    <div className="captura sec">
      <section className="captura-head">
        <div>
          <h1 className="captura-title">Captura de datos</h1>
          <p className="muted" style={{ margin: 0 }}>
            Sube un Excel o llena la tabla. No se guarda hasta que toques Guardar.
          </p>
        </div>
        <div className="tools">
          <span className={`status${msg?.err ? ' err' : msg && !dirty ? ' ok' : ''}`} role="status">
            {dirty && !msg?.err ? 'Hay cambios sin guardar.' : msg?.text}
          </span>
          <button type="button" className="btn" onClick={() => void descargarPlantilla()}>
            Descargar plantilla
          </button>
          <button type="button" className="btn primary" onClick={() => void guardar()} disabled={saving || !dirty}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {conLogin && (
            <button type="button" className="btn ghost" onClick={() => void salir()}>
              Salir
            </button>
          )}
        </div>
      </section>

      <section className="stepper" aria-label="Fase">
        <button type="button" className={tab === 'ini' ? 'step on' : 'step'} aria-pressed={tab === 'ini'} onClick={() => setTab('ini')}>
          <span className="step-num">1</span>
          <span className="step-text">
            <span className="step-title">Datos iniciales</span>
            <span className="step-sub">Con lo que empiezan</span>
          </span>
        </button>
        <button
          type="button"
          className={tab === 'fin' ? 'step on' : 'step'}
          aria-pressed={tab === 'fin'}
          onClick={() => {
            setFin((prev) => mergeFinDesdeIni(ini, prev));
            setTab('fin');
          }}
        >
          <span className="step-num">2</span>
          <span className="step-text">
            <span className="step-title">Datos finales</span>
            <span className="step-sub">Peso y medidas al cierre</span>
          </span>
        </button>
      </section>

      <section className="upload-row">
        <label
          className={`dropzone${dragging ? ' over' : ''}`}
          htmlFor="excel-file"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <span className="drop-icon" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4" />
              <path d="M7 9l5-5 5 5" />
              <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
            </svg>
          </span>
          <span>
            <strong>Arrastra tu Excel {tab === 'ini' ? 'inicial' : 'final'} aquí</strong>
            <span className="muted small" style={{ display: 'block' }}>
              o haz clic para elegirlo · .xlsx, .xls o .csv
            </span>
          </span>
          <input
            id="excel-file"
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            onChange={(e) => {
              void onFile(tab, e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        <div className="file-summary">
          <span className="kpi-label">Último archivo leído</span>
          <span className="num" style={{ fontSize: 16 }}>
            {lastFile?.name ?? 'Ninguno todavía'}
          </span>
          {lastFile && (
            <div className="file-chips">
              <span className="file-chip ok">{lastFile.personas} personas</span>
              {lastFile.medidas.length > 0 && <span className="file-chip info">{lastFile.medidas.join(' · ')}</span>}
              {lastFile.warn && <span className="file-chip warn">{lastFile.warn}</span>}
            </div>
          )}
        </div>
      </section>

      <datalist id="names">
        {ini
          .filter((r) => r.nombre)
          .map((r) => (
            <option key={r.id} value={r.nombre} />
          ))}
      </datalist>

      <section className="table-card captura-table">
        <div className="table-card-head">
          <div className="tools" style={{ gap: 12 }}>
            <h2 style={{ margin: 0 }}>{tab === 'ini' ? 'Punto de partida' : 'Resultado final'}</h2>
            {tab === 'ini' && (
              <label className="margen-inline">
                Margen ±
                <input
                  className="cell narrow"
                  id="margen"
                  inputMode="decimal"
                  defaultValue={margen}
                  aria-label="Margen para quien busca mantenerse en kg"
                  onChange={(e) => {
                    const n = num(e.target.value);
                    setMargen(n != null && n > 0 ? n : 1);
                    touch();
                  }}
                />
                kg
              </label>
            )}
          </div>
          <div className="tools">
            <button
              type="button"
              className="btn warn"
              onClick={() =>
                confirmar(tab === 'ini' ? 'ci' : 'cf', () => {
                  if (tab === 'ini') {
                    setIni([]);
                    setFin([]);
                  } else {
                    setFin(mergeFinDesdeIni(ini, []));
                  }
                  touch();
                })
              }
            >
              {armed === (tab === 'ini' ? 'ci' : 'cf')
                ? '¿Seguro? Toca otra vez'
                : tab === 'ini'
                  ? 'Vaciar tabla'
                  : 'Limpiar finales'}
            </button>
          </div>
        </div>

        {/* —— Móvil: cards (solo una vista montada para no duplicar inputs) —— */}
        {isMobile && (
        <div className="captura-mobile">
          <div className="captura-mobile-tools">
            {showMedida ? (
              <span className="add-medida-inline">
                <input
                  className="cell"
                  placeholder="Ej. Muslo"
                  value={nuevaM}
                  autoFocus
                  onChange={(e) => setNuevaM(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') agregarMedida();
                    if (e.key === 'Escape') {
                      setShowMedida(false);
                      setNuevaM('');
                    }
                  }}
                  aria-label="Nombre de la nueva medida"
                />
                <button type="button" className="btn primary" onClick={agregarMedida}>
                  OK
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    setShowMedida(false);
                    setNuevaM('');
                  }}
                >
                  ×
                </button>
              </span>
            ) : (
              <span className="th-with-help">
                <button type="button" className="btn table-add" onClick={() => setShowMedida(true)}>
                  + Medida
                </button>
                {MEDIDA_HELP}
              </span>
            )}
            {medidas.length > 0 && (
              <div className="medida-chips">
                {medidas.map((m) => (
                  <span key={m} className="medida-chip">
                    {m}
                    <button
                      type="button"
                      className="btn icon"
                      aria-label={`Quitar medida ${m}`}
                      onClick={() => {
                        setMedidas((ms) => ms.filter((x) => x !== m));
                        touch();
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {rows.length === 0 && (
            <p className="muted captura-mobile-empty">
              {tab === 'fin'
                ? 'Primero agrega gente en Datos iniciales. Aquí aparecen solas.'
                : 'Nadie todavía. Sube un Excel o agrega una persona abajo.'}
            </p>
          )}

          {tab === 'ini' &&
            ini.map((r) => {
              const st = statusIni(r);
              return (
                <article key={r.id} className="persona-card">
                  <header className="persona-card-head">
                    <span className="avatar sm" style={{ background: colorAvatar(r.nombre || '?') }}>
                      {iniciales(r.nombre || '?')}
                    </span>
                    <input
                      className="cell persona-card-name"
                      list="names"
                      defaultValue={r.nombre}
                      aria-label="Nombre"
                      placeholder="Nombre"
                      onChange={(e) => patchIni(r.id, { nombre: e.target.value })}
                    />
                    <span className={`status-chip ${st.kind}`}>{st.text}</span>
                  </header>
                  <div className="persona-card-grid">
                    <CardField label="Objetivo">
                      <select
                        className="cell"
                        value={r.objetivo}
                        aria-label="Objetivo"
                        onChange={(e) => patchIni(r.id, { objetivo: e.target.value as Objetivo | '' })}
                      >
                        <option value="">Elegir</option>
                        {(Object.keys(GOALS) as Objetivo[]).map((g) => (
                          <option key={g} value={g}>
                            {GOALS[g]}
                          </option>
                        ))}
                      </select>
                    </CardField>
                    <CardField
                      label={
                        <span className="th-with-help">
                          Meta (kg) {META_HELP}
                        </span>
                      }
                    >
                      <N
                        id={`m-ini-${r.id}-meta`}
                        value={r.meta}
                        label="Meta: kilos a bajar o subir"
                        onChange={(v) => patchIni(r.id, { meta: v })}
                      />
                    </CardField>
                    <CardField label="Peso (kg)">
                      <N id={`m-ini-${r.id}-peso`} value={r.peso} label="Peso inicial" onChange={(v) => patchIni(r.id, { peso: v })} />
                    </CardField>
                    <CardField label="Estatura (cm)">
                      <N
                        id={`m-ini-${r.id}-est`}
                        value={r.estatura}
                        label="Estatura en cm"
                        onChange={(v) => patchIni(r.id, { estatura: v })}
                      />
                    </CardField>
                    {medidas.map((m, j) => (
                      <CardField key={m} label={`${m} (cm)`}>
                        <N
                          id={`m-ini-${r.id}-m${j}`}
                          value={r.m[m] ?? null}
                          label={`${m} de ${r.nombre}`}
                          onChange={(v) => patchIniM(r.id, m, v)}
                        />
                      </CardField>
                    ))}
                  </div>
                  <footer className="persona-card-foot">
                    <button
                      type="button"
                      className="btn icon"
                      aria-label={`Quitar a ${r.nombre || 'persona'}`}
                      onClick={() => {
                        const clave = norm(r.nombre);
                        setIni((rs) => rs.filter((x) => x.id !== r.id));
                        if (clave) setFin((rs) => rs.filter((x) => norm(x.nombre) !== clave));
                        touch();
                      }}
                    >
                      Quitar
                    </button>
                  </footer>
                </article>
              );
            })}

          {tab === 'fin' &&
            fin.map((r) => {
              const st = statusFin(r, iniNames);
              return (
                <article key={r.id} className="persona-card">
                  <header className="persona-card-head">
                    <span className="avatar sm" style={{ background: colorAvatar(r.nombre || '?') }}>
                      {iniciales(r.nombre || '?')}
                    </span>
                    <span className="name-locked persona-card-name">{r.nombre}</span>
                    <span className={`status-chip ${st.kind}`}>{st.text}</span>
                  </header>
                  <div className="persona-card-grid">
                    <CardField label="Peso (kg)">
                      <N id={`m-fin-${r.id}-peso`} value={r.peso} label="Peso final" onChange={(v) => patchFin(r.id, { peso: v })} />
                    </CardField>
                    {medidas.map((m, j) => (
                      <CardField key={m} label={`${m} (cm)`}>
                        <N
                          id={`m-fin-${r.id}-m${j}`}
                          value={r.m[m] ?? null}
                          label={`${m} final de ${r.nombre}`}
                          onChange={(v) => patchFinM(r.id, m, v)}
                        />
                      </CardField>
                    ))}
                  </div>
                  <footer className="persona-card-foot">
                    <button
                      type="button"
                      className="btn icon"
                      aria-label={`Limpiar datos finales de ${r.nombre}`}
                      onClick={() => {
                        setFin((rs) =>
                          rs.map((x) =>
                            x.id === r.id ? conId<FilaFinal>({ nombre: r.nombre, peso: null, estatura: null, m: {} }) : x,
                          ),
                        );
                        touch();
                      }}
                    >
                      Limpiar
                    </button>
                  </footer>
                </article>
              );
            })}

          {tab === 'ini' && (
            <button
              type="button"
              className="btn table-add row-add-btn captura-add-persona"
              onClick={() => {
                setIni((rs) => [
                  ...rs,
                  conId<FilaInicial>({ nombre: '', objetivo: '', meta: null, peso: null, estatura: null, m: {} }),
                ]);
                touch();
              }}
            >
              + Agregar persona
            </button>
          )}
        </div>
        )}

        {/* —— Desktop: tabla —— */}
        {!isMobile && (
        <div className="captura-desktop tbl-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="edit captura-grid">
            <thead>
              <tr>
                <th>Persona</th>
                {tab === 'ini' && (
                  <>
                    <th>Objetivo</th>
                    <th>
                      <span className="th-with-help">
                        Meta (kg)
                        {META_HELP}
                      </span>
                    </th>
                    <th>Peso (kg)</th>
                    <th>Estatura (cm)</th>
                  </>
                )}
                {tab === 'fin' && <th>Peso (kg)</th>}
                {medidas.map((m) => (
                  <th key={m}>
                    {m}{' '}
                    <button
                      type="button"
                      className="btn icon"
                      aria-label={`Quitar medida ${m}`}
                      onClick={() => {
                        setMedidas((ms) => ms.filter((x) => x !== m));
                        touch();
                      }}
                    >
                      ×
                    </button>
                  </th>
                ))}
                <th className="th-add-medida">
                  {showMedida ? (
                    <span className="add-medida-inline">
                      <input
                        className="cell"
                        style={{ width: 110 }}
                        placeholder="Ej. Muslo"
                        value={nuevaM}
                        autoFocus
                        onChange={(e) => setNuevaM(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') agregarMedida();
                          if (e.key === 'Escape') {
                            setShowMedida(false);
                            setNuevaM('');
                          }
                        }}
                        aria-label="Nombre de la nueva medida"
                      />
                      <button type="button" className="btn primary" onClick={agregarMedida}>
                        OK
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => {
                          setShowMedida(false);
                          setNuevaM('');
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ) : (
                    <span className="th-with-help">
                      <button type="button" className="btn table-add" onClick={() => setShowMedida(true)}>
                        + Medida
                      </button>
                      {MEDIDA_HELP}
                    </span>
                  )}
                </th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={20} className="muted">
                    {tab === 'fin'
                      ? 'Primero agrega gente en Datos iniciales. Aquí aparecen solas.'
                      : 'Nadie todavía. Sube un Excel o agrega una persona abajo.'}
                  </td>
                </tr>
              )}
              {tab === 'ini' &&
                ini.map((r) => {
                  const st = statusIni(r);
                  return (
                    <tr key={r.id}>
                      <td>
                        <span className="name-cell">
                          <span className="avatar sm" style={{ background: colorAvatar(r.nombre || '?') }}>
                            {iniciales(r.nombre || '?')}
                          </span>
                          <input
                            className="cell"
                            list="names"
                            defaultValue={r.nombre}
                            aria-label="Nombre"
                            onChange={(e) => patchIni(r.id, { nombre: e.target.value })}
                          />
                        </span>
                      </td>
                      <td>
                        <select
                          className="cell"
                          value={r.objetivo}
                          aria-label="Objetivo"
                          onChange={(e) => patchIni(r.id, { objetivo: e.target.value as Objetivo | '' })}
                        >
                          <option value="">Elegir</option>
                          {(Object.keys(GOALS) as Objetivo[]).map((g) => (
                            <option key={g} value={g}>
                              {GOALS[g]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <N
                          id={`ini-${r.id}-meta`}
                          value={r.meta}
                          label="Meta: kilos a bajar o subir (no el peso objetivo)"
                          onChange={(v) => patchIni(r.id, { meta: v })}
                        />
                      </td>
                      <td>
                        <N id={`ini-${r.id}-peso`} value={r.peso} label="Peso inicial" onChange={(v) => patchIni(r.id, { peso: v })} />
                      </td>
                      <td>
                        <N id={`ini-${r.id}-est`} value={r.estatura} label="Estatura en cm" onChange={(v) => patchIni(r.id, { estatura: v })} />
                      </td>
                      {medidas.map((m, j) => (
                        <td key={m}>
                          <N id={`ini-${r.id}-m${j}`} value={r.m[m] ?? null} label={`${m} de ${r.nombre}`} onChange={(v) => patchIniM(r.id, m, v)} />
                        </td>
                      ))}
                      <td className="td-add-medida" />
                      <td>
                        <span className={`status-chip ${st.kind}`}>{st.text}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn icon"
                          aria-label={`Quitar a ${r.nombre || 'persona'}`}
                          onClick={() => {
                            const clave = norm(r.nombre);
                            setIni((rs) => rs.filter((x) => x.id !== r.id));
                            if (clave) setFin((rs) => rs.filter((x) => norm(x.nombre) !== clave));
                            touch();
                          }}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              {tab === 'ini' && (
                <tr className="row-add">
                  <td colSpan={8 + medidas.length}>
                    <button
                      type="button"
                      className="btn table-add row-add-btn"
                      onClick={() => {
                        setIni((rs) => [
                          ...rs,
                          conId<FilaInicial>({ nombre: '', objetivo: '', meta: null, peso: null, estatura: null, m: {} }),
                        ]);
                        touch();
                      }}
                    >
                      + Agregar persona
                    </button>
                  </td>
                </tr>
              )}
              {tab === 'fin' &&
                fin.map((r) => {
                  const st = statusFin(r, iniNames);
                  return (
                    <tr key={r.id}>
                      <td>
                        <span className="name-cell">
                          <span className="avatar sm" style={{ background: colorAvatar(r.nombre || '?') }}>
                            {iniciales(r.nombre || '?')}
                          </span>
                          <span className="name-locked">{r.nombre}</span>
                        </span>
                      </td>
                      <td>
                        <N id={`fin-${r.id}-peso`} value={r.peso} label="Peso final" onChange={(v) => patchFin(r.id, { peso: v })} />
                      </td>
                      {medidas.map((m, j) => (
                        <td key={m}>
                          <N id={`fin-${r.id}-m${j}`} value={r.m[m] ?? null} label={`${m} final de ${r.nombre}`} onChange={(v) => patchFinM(r.id, m, v)} />
                        </td>
                      ))}
                      <td className="td-add-medida" />
                      <td>
                        <span className={`status-chip ${st.kind}`}>{st.text}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn icon"
                          aria-label={`Limpiar datos finales de ${r.nombre}`}
                          onClick={() => {
                            setFin((rs) =>
                              rs.map((x) =>
                                x.id === r.id ? conId<FilaFinal>({ nombre: r.nombre, peso: null, estatura: null, m: {} }) : x,
                              ),
                            );
                            touch();
                          }}
                        >
                          Limpiar
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        )}
      </section>
    </div>
  );
}
