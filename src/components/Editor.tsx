'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Estado, FilaFinal, FilaInicial, Medidas, Objetivo } from '@/lib/types';
import { norm, num } from '@/lib/scoring';
import { GOALS } from '@/lib/format';
import { leerArchivo } from '@/lib/excel';

type RI = FilaInicial & { id: string };
type RF = FilaFinal & { id: string };
type Tab = 'ini' | 'fin';
type Mensaje = { text: string; err?: boolean } | null;

let seq = 0;
const uid = () => `r${++seq}`;
const conId = <T,>(r: T): T & { id: string } => ({ ...r, id: uid() });

/** Entradas sin control de React: así "65." no se convierte en "65" mientras se teclea. */
function N({ id, value, label, onChange }: { id: string; value: number | null; label: string; onChange: (v: number | null) => void }) {
  return (
    <input
      className="in num"
      id={id}
      inputMode="decimal"
      defaultValue={value ?? ''}
      aria-label={label}
      onChange={(e) => onChange(num(e.target.value))}
    />
  );
}

export default function Editor({ estado, conLogin }: { estado: Estado; conLogin: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('ini');
  const [margen, setMargen] = useState(estado.margen);
  const [medidas, setMedidas] = useState<string[]>(estado.medidas);
  const [ini, setIni] = useState<RI[]>(() => estado.inicial.map(conId));
  const [fin, setFin] = useState<RF[]>(() => estado.final.map(conId));
  const [nuevaM, setNuevaM] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Mensaje>(null);
  const [armed, setArmed] = useState<string | null>(null);

  const touch = () => setDirty(true);

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
        return;
      }
      if (kind === 'ini') {
        setIni(p.rows.map(conId));
        setMedidas(p.labels);
      } else {
        const meds = [...medidas];
        for (const l of p.labels) if (!meds.some((m) => norm(m) === norm(l))) meds.push(l);
        setMedidas(meds);
        setFin(
          p.rows.map((r) => {
            const m: Medidas = {};
            for (const l of p.labels) {
              const destino = meds.find((x) => norm(x) === norm(l)) as string;
              m[destino] = r.m[l] ?? null;
            }
            return conId<FilaFinal>({ nombre: r.nombre, peso: r.peso, estatura: r.estatura, m });
          }),
        );
      }
      touch();
      setMsg({
        text: `Cargadas ${p.rows.length} personas${p.labels.length ? ` y ${p.labels.length} medidas (${p.labels.join(', ')})` : ''}. Revisa la tabla y toca Guardar.`,
      });
    } catch {
      setMsg({ text: 'No pude leer el archivo. Revisa que sea .xlsx, .xls o .csv.', err: true });
    }
  }

  function copiarEncabezados(kind: Tab) {
    const heads = kind === 'ini' ? ['Nombre', 'Objetivo', 'Meta_kg', 'Peso', 'Estatura', ...medidas] : ['Nombre', 'Peso', ...medidas];
    const fallo = () => setMsg({ text: `No pude copiar. Escribe estos encabezados en la primera fila de tu Excel: ${heads.join(', ')}`, err: true });
    try {
      navigator.clipboard.writeText(heads.join('\t')).then(() => setMsg({ text: 'Encabezados copiados. Pégalos en la primera fila de tu Excel.' }), fallo);
    } catch {
      fallo();
    }
  }

  function agregarMedida() {
    const v = nuevaM.trim();
    if (v && !medidas.some((m) => norm(m) === norm(v))) {
      setMedidas([...medidas, v]);
      setNuevaM('');
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
        setMsg({ text: 'Guardado. Los resultados ya están actualizados.' });
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

  return (
    <div className="sec">
      <div className="card sec">
        <div className="head-row">
          <h2>Captura de datos</h2>
          <div className="tools">
            <span className={`status${msg?.err ? ' err' : ''}`} role="status">
              {dirty && !msg?.err ? 'Hay cambios sin guardar.' : msg?.text}
            </span>
            <button className="btn primary" onClick={guardar} disabled={saving || !dirty}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            {conLogin && (
              <button className="btn" onClick={salir}>
                Salir
              </button>
            )}
          </div>
        </div>
        <div className="field">
          <label htmlFor="margen">Margen para quien busca mantenerse (± kg)</label>
          <input
            className="in narrow num"
            id="margen"
            inputMode="decimal"
            defaultValue={margen}
            onChange={(e) => {
              const n = num(e.target.value);
              setMargen(n != null && n > 0 ? n : 1);
              touch();
            }}
          />
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Fase de captura">
        <button className="tab" role="tab" aria-selected={tab === 'ini'} onClick={() => setTab('ini')}>
          Datos iniciales
        </button>
        <button className="tab" role="tab" aria-selected={tab === 'fin'} onClick={() => setTab('fin')}>
          Datos finales
        </button>
      </div>

      <datalist id="names">
        {ini
          .filter((r) => r.nombre)
          .map((r) => (
            <option key={r.id} value={r.nombre} />
          ))}
      </datalist>

      {tab === 'ini' ? (
        <section className="sec" role="tabpanel">
          <div className="card sec">
            <h2>Punto de partida</h2>
            <p className="muted small" style={{ margin: 0 }}>
              Carga un Excel o captura a mano. Columnas: <strong>Nombre</strong>, <strong>Objetivo</strong> (bajar,
              mantener o subir), <strong>Meta_kg</strong>, <strong>Peso</strong> (kg), <strong>Estatura</strong> (cm) y
              una columna por medida en cm, como Cintura, Cadera o Brazo. El IMC se calcula solo.
            </p>
            <div className="tools">
              <label className="btn primary" htmlFor="file-ini">
                Cargar Excel inicial
              </label>
              <input
                type="file"
                id="file-ini"
                accept=".xlsx,.xls,.csv"
                hidden
                onChange={(e) => {
                  void onFile('ini', e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <button className="btn" onClick={() => copiarEncabezados('ini')}>
                Copiar encabezados
              </button>
              <button
                className="btn"
                onClick={() => {
                  setIni((rs) => [...rs, conId<FilaInicial>({ nombre: '', objetivo: '', meta: null, peso: null, estatura: null, m: {} })]);
                  touch();
                }}
              >
                Agregar persona
              </button>
              <button
                className="btn warn"
                onClick={() =>
                  confirmar('ci', () => {
                    setIni([]);
                    touch();
                  })
                }
              >
                {armed === 'ci' ? '¿Seguro? Toca otra vez' : 'Vaciar tabla'}
              </button>
            </div>
            <div className="tools">
              <label className="small muted" htmlFor="newm">
                Otra medida
              </label>
              <input
                className="in narrow"
                id="newm"
                placeholder="Ej. Muslo"
                value={nuevaM}
                onChange={(e) => setNuevaM(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && agregarMedida()}
              />
              <button className="btn" onClick={agregarMedida}>
                Agregar medida
              </button>
            </div>
          </div>
          <div className="tbl-wrap">
            <table className="edit">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Objetivo</th>
                  <th>Meta (kg)</th>
                  <th>Peso (kg)</th>
                  <th>Estatura (cm)</th>
                  {medidas.map((m) => (
                    <th key={m}>
                      {m} (cm){' '}
                      <button
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
                  <th />
                </tr>
              </thead>
              <tbody>
                {ini.length === 0 && (
                  <tr>
                    <td colSpan={6 + medidas.length} className="muted">
                      Sin personas. Carga un Excel o agrega una fila.
                    </td>
                  </tr>
                )}
                {ini.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <input
                        className="in"
                        id={`ini-${r.id}-nombre`}
                        list="names"
                        defaultValue={r.nombre}
                        aria-label="Nombre"
                        onChange={(e) => patchIni(r.id, { nombre: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        className="in"
                        id={`ini-${r.id}-objetivo`}
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
                      <N id={`ini-${r.id}-meta`} value={r.meta} label="Meta en kilos" onChange={(v) => patchIni(r.id, { meta: v })} />
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
                    <td>
                      <button
                        className="btn icon"
                        aria-label={`Quitar a ${r.nombre || 'persona'}`}
                        onClick={() => {
                          setIni((rs) => rs.filter((x) => x.id !== r.id));
                          touch();
                        }}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="sec" role="tabpanel">
          <div className="card sec">
            <h2>Resultado final</h2>
            <p className="muted small" style={{ margin: 0 }}>
              Mismas columnas de peso y medidas que en el inicial, con el mismo nombre de cada persona. El objetivo y la
              meta se toman de los datos iniciales. La estatura es opcional.
            </p>
            <div className="tools">
              <label className="btn primary" htmlFor="file-fin">
                Cargar Excel final
              </label>
              <input
                type="file"
                id="file-fin"
                accept=".xlsx,.xls,.csv"
                hidden
                onChange={(e) => {
                  void onFile('fin', e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <button className="btn" onClick={() => copiarEncabezados('fin')}>
                Copiar encabezados
              </button>
              <button
                className="btn"
                onClick={() => {
                  setFin((rs) => [...rs, conId<FilaFinal>({ nombre: '', peso: null, estatura: null, m: {} })]);
                  touch();
                }}
              >
                Agregar persona
              </button>
              <button
                className="btn warn"
                onClick={() =>
                  confirmar('cf', () => {
                    setFin([]);
                    touch();
                  })
                }
              >
                {armed === 'cf' ? '¿Seguro? Toca otra vez' : 'Vaciar tabla'}
              </button>
            </div>
          </div>
          <div className="tbl-wrap">
            <table className="edit">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Peso (kg)</th>
                  <th>Estatura (cm, opcional)</th>
                  {medidas.map((m) => (
                    <th key={m}>{m} (cm)</th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {fin.length === 0 && (
                  <tr>
                    <td colSpan={4 + medidas.length} className="muted">
                      Sin personas. Carga un Excel o agrega una fila.
                    </td>
                  </tr>
                )}
                {fin.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <input
                        className="in"
                        id={`fin-${r.id}-nombre`}
                        list="names"
                        defaultValue={r.nombre}
                        aria-label="Nombre"
                        onChange={(e) => patchFin(r.id, { nombre: e.target.value })}
                      />
                    </td>
                    <td>
                      <N id={`fin-${r.id}-peso`} value={r.peso} label="Peso final" onChange={(v) => patchFin(r.id, { peso: v })} />
                    </td>
                    <td>
                      <N id={`fin-${r.id}-est`} value={r.estatura} label="Estatura final en cm (opcional)" onChange={(v) => patchFin(r.id, { estatura: v })} />
                    </td>
                    {medidas.map((m, j) => (
                      <td key={m}>
                        <N id={`fin-${r.id}-m${j}`} value={r.m[m] ?? null} label={`${m} final de ${r.nombre}`} onChange={(v) => patchFinM(r.id, m, v)} />
                      </td>
                    ))}
                    <td>
                      <button
                        className="btn icon"
                        aria-label={`Quitar a ${r.nombre || 'persona'}`}
                        onClick={() => {
                          setFin((rs) => rs.filter((x) => x.id !== r.id));
                          touch();
                        }}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
