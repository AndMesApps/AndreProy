'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { OPCIONES_CONTROL, ZONAS, elementosBusqueda, type Clasificacion, type Escenario, type Frecuencia } from '@/lib/cincos';
import { cn } from '@/lib/utils';
import { Kanban } from '@/components/kanban';

/** Orden estable pero «revuelto» para que las respuestas no salgan en orden. */
export function mezclar<T extends { id: string }>(lista: T[], semilla: string) {
  const h = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return [...lista].sort((a, b) => h(a.id + semilla) - h(b.id + semilla));
}

/** Cuenta regresiva de la misión (no la cierra sola: solo avisa). */
export function Reloj({ inicio, segundos }: { inicio: string; segundos: number | null }) {
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  const pasados = Math.max(0, (ahora - new Date(inicio).getTime()) / 1000);
  if (!segundos) {
    return <span className="font-mono text-sm font-semibold text-marmol-500">⏱ {Math.floor(pasados / 60)}:{String(Math.floor(pasados % 60)).padStart(2, '0')}</span>;
  }
  const quedan = segundos - pasados;
  return (
    <span className={cn('font-mono text-lg font-bold', quedan <= 0 ? 'text-bajo' : quedan <= 15 ? 'animate-pulse text-medio' : 'text-secundario')}>
      {quedan <= 0 ? '¡Tiempo! Entreguen' : `⏳ ${Math.floor(quedan / 60)}:${String(Math.ceil(quedan % 60)).padStart(2, '0')}`}
    </span>
  );
}

function BotonEntregar({ onClick, listo, pendiente, texto = 'Entregar misión' }: { onClick: () => void; listo: boolean; pendiente: boolean; texto?: string }) {
  return (
    <div className="sticky bottom-2 z-10 flex justify-center pt-2">
      <button type="button" disabled={pendiente} onClick={onClick} className={cn('boton px-6 py-3 text-base shadow-lg', !listo && 'bg-marmol-400 hover:bg-marmol-500')}>
        {pendiente ? 'Entregando…' : texto}
      </button>
    </div>
  );
}

type Entregar = (respuestas: unknown) => void;

// ----------------------------------------------------------------------------
// Misión 1 — Clasificar
// ----------------------------------------------------------------------------

const CLASES: { id: Clasificacion; emoji: string; nombre: string; clase: string }[] = [
  { id: 'necesario', emoji: '🟢', nombre: 'Se queda', clase: 'border-green-400 bg-green-50' },
  { id: 'dudoso', emoji: '🟡', nombre: 'Dudoso', clase: 'border-amber-400 bg-amber-50' },
  { id: 'innecesario', emoji: '🔴', nombre: 'Sale', clase: 'border-red-400 bg-red-50' },
];

export function M1Clasificar({ esc, semilla, onEntregar, pendiente }: { esc: Escenario; semilla: string; onEntregar: Entregar; pendiente: boolean }) {
  const objetos = useMemo(() => mezclar(esc.objetos, semilla), [esc, semilla]);
  const [c, setC] = useState<Record<string, Clasificacion>>({});
  const hechos = Object.keys(c).length;
  return (
    <div className="space-y-3">
      <p className="text-sm text-marmol-600">
        Clasificados: <strong>{hechos}</strong> de {objetos.length}. Toquen 🟢 si se queda, 🟡 si hay duda (tarjeta roja) o 🔴 si sale.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {objetos.map((o) => {
          const sel = CLASES.find((x) => x.id === c[o.id]);
          return (
            <div key={o.id} className={cn('rounded-xl border-2 p-2 text-center transition', sel ? sel.clase : 'border-marmol-200 bg-white')}>
              <p className="text-3xl">{o.emoji}</p>
              <p className="mt-1 min-h-[2.5rem] text-xs font-medium leading-tight text-marmol-800">{o.nombre}</p>
              <div className="mt-1 grid grid-cols-3 gap-1">
                {CLASES.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => setC((v) => ({ ...v, [o.id]: x.id }))}
                    className={cn('rounded-md py-1 text-base', c[o.id] === x.id ? 'bg-white ring-2 ring-secundario' : 'bg-marmol-50 hover:bg-white')}
                    title={x.nombre}
                    aria-label={`${o.nombre}: ${x.nombre}`}
                  >
                    {x.emoji}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <BotonEntregar listo={hechos === objetos.length} pendiente={pendiente} onClick={() => onEntregar({ clasificacion: c })} texto={hechos === objetos.length ? 'Entregar misión' : `Entregar (faltan ${objetos.length - hechos})`} />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Misión 2 — Ordenar (y encontrar en menos de 10 segundos)
// ----------------------------------------------------------------------------

export function M2Ordenar({ esc, semilla, onEntregar, pendiente }: { esc: Escenario; semilla: string; onEntregar: Entregar; pendiente: boolean }) {
  const necesarios = useMemo(() => mezclar(esc.objetos.filter((o) => o.tipo === 'necesario'), semilla), [esc, semilla]);
  const [ubicacion, setUbicacion] = useState<Record<string, Frecuencia>>({});
  const [fase, setFase] = useState<'ordenar' | 'buscar'>('ordenar');
  const aBuscar = useMemo(() => mezclar(necesarios, semilla + 'b').slice(0, 5), [necesarios, semilla]);
  const [busqueda, setBusqueda] = useState<Record<string, { zona: Frecuencia; segundos: number }>>({});
  const desde = useRef(Date.now());
  const paso = Object.keys(busqueda).length;
  const actual = aBuscar[paso];
  const ubicados = Object.keys(ubicacion).length;

  if (fase === 'ordenar') {
    const columnas = [{ id: 'sin', titulo: '📥 Sin ubicar', clase: 'bg-white text-marmol-600' }, ...(Object.keys(ZONAS) as Frecuencia[]).map((z) => ({ id: z, titulo: `${ZONAS[z].emoji} ${ZONAS[z].nombre}`, clase: 'bg-marca-100 text-marca-700' }))];
    return (
      <div className="space-y-3">
        <p className="text-sm text-marmol-600">
          Arrastren cada elemento a su zona (en el celular usen «Mover a…»): ✋ lo de uso diario, 🗄️ lo semanal, 📦 lo eventual. Ubicados: <strong>{ubicados}</strong> de{' '}
          {necesarios.length}.
        </p>
        <Kanban
          columnas={columnas}
          items={necesarios}
          columnaDe={(o) => ubicacion[o.id] ?? 'sin'}
          onMover={(o, col) => setUbicacion((u) => {
            const n = { ...u };
            if (col === 'sin') delete n[o.id];
            else n[o.id] = col as Frecuencia;
            return n;
          })}
          vacio="Arrastra aquí"
          tarjeta={(o) => (
            <p className="flex items-center gap-2 text-sm">
              <span className="text-2xl">{o.emoji}</span>
              <span className="font-medium text-marmol-800">{o.nombre}</span>
            </p>
          )}
        />
        <BotonEntregar
          listo={ubicados === necesarios.length}
          pendiente={false}
          texto={ubicados === necesarios.length ? 'Listo: ahora a buscar →' : `Faltan ${necesarios.length - ubicados} por ubicar`}
          onClick={() => {
            if (ubicados < necesarios.length) return;
            desde.current = Date.now();
            setFase('buscar');
          }}
        />
      </div>
    );
  }

  if (!actual) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-marmol-600">¡Búsqueda terminada! Entreguen la misión para ver su resultado.</p>
        <BotonEntregar listo pendiente={pendiente} onClick={() => onEntregar({ ubicacion, busqueda })} />
      </div>
    );
  }
  return (
    <div className="space-y-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-marmol-400">Búsqueda {paso + 1} de 5 · un compañero que no ordenó debe responder</p>
      <p className="text-5xl">{actual.emoji}</p>
      <p className="font-display text-xl font-bold text-secundario">¿Dónde está «{actual.nombre}»?</p>
      <div className="mx-auto grid max-w-md gap-2">
        {(Object.keys(ZONAS) as Frecuencia[]).map((z) => (
          <button
            key={z}
            type="button"
            onClick={() => {
              const segundos = (Date.now() - desde.current) / 1000;
              setBusqueda((b) => ({ ...b, [actual.id]: { zona: z, segundos } }));
              desde.current = Date.now();
            }}
            className="rounded-xl border-2 border-marmol-200 bg-white p-3 text-left hover:border-marca-400"
          >
            <span className="text-2xl">{ZONAS[z].emoji}</span> <span className="font-semibold text-marmol-800">{ZONAS[z].nombre}</span>
            <span className="block text-xs text-marmol-500">{ZONAS[z].ayuda}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-marmol-400">Meta: menos de 10 segundos por elemento.</p>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Misión 3 — Limpiar (encontrar anomalías y atacar la causa)
// ----------------------------------------------------------------------------

export function M3Limpiar({ esc, semilla, onEntregar, pendiente }: { esc: Escenario; semilla: string; onEntregar: Entregar; pendiente: boolean }) {
  const escena = useMemo(() => mezclar(esc.anomalias, semilla), [esc, semilla]);
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [fase, setFase] = useState<'buscar' | 'decidir'>('buscar');
  const [acciones, setAcciones] = useState<Record<string, 'raiz' | 'superficial'>>({});
  const conOpciones = escena.filter((a) => marcadas.has(a.id) && a.superficial && a.raiz);

  if (fase === 'buscar') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-marmol-600">
          Toquen lo que esté mal. Marcadas: <strong>{marcadas.size}</strong>. Ojo: marcar algo que está bien resta puntos.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {escena.map((a) => {
            const m = marcadas.has(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  setMarcadas((s) => {
                    const n = new Set(s);
                    if (n.has(a.id)) n.delete(a.id);
                    else n.add(a.id);
                    return n;
                  })
                }
                className={cn('rounded-xl border-2 p-3 text-center transition', m ? 'border-bajo bg-red-50 ring-2 ring-red-200' : 'border-marmol-200 bg-white hover:border-marca-300')}
              >
                <p className="text-3xl">{a.emoji}</p>
                <p className="mt-1 text-xs font-medium leading-tight text-marmol-800">{a.nombre}</p>
                {m && <p className="mt-1 text-[10px] font-bold text-bajo">🔎 ANOMALÍA</p>}
              </button>
            );
          })}
        </div>
        <BotonEntregar listo={marcadas.size > 0} pendiente={false} texto="Listo: ¿qué hacemos con cada una? →" onClick={() => setFase('decidir')} />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-marmol-600">Para cada problema que encontraron, ¿qué hace el equipo?</p>
      {conOpciones.length === 0 && <p className="rounded-lg bg-marmol-50 p-3 text-sm text-marmol-500">No hay decisiones pendientes.</p>}
      {conOpciones.map((a) => {
        const opciones = mezclar(
          [
            { id: 'superficial' as const, texto: a.superficial! },
            { id: 'raiz' as const, texto: a.raiz! },
          ],
          semilla + a.id,
        );
        return (
          <div key={a.id} className="rounded-xl border border-marmol-200 bg-white p-3">
            <p className="text-sm font-semibold text-marmol-800">
              {a.emoji} {a.nombre}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {opciones.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setAcciones((x) => ({ ...x, [a.id]: o.id }))}
                  className={cn('rounded-lg border-2 p-2 text-left text-sm', acciones[a.id] === o.id ? 'border-marca-500 bg-marca-50' : 'border-marmol-200 hover:border-marca-300')}
                >
                  {o.texto}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <div className="flex justify-between">
        <button type="button" onClick={() => setFase('buscar')} className="text-xs text-marmol-500">
          ← Volver a buscar
        </button>
      </div>
      <BotonEntregar listo={Object.keys(acciones).length === conOpciones.length} pendiente={pendiente} onClick={() => onEntregar({ marcadas: [...marcadas], acciones })} />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Misión 4 — Estandarizar
// ----------------------------------------------------------------------------

export function M4Estandarizar({ esc, semilla, onEntregar, pendiente }: { esc: Escenario; semilla: string; onEntregar: Entregar; pendiente: boolean }) {
  const frases = useMemo(() => mezclar(esc.frases, semilla), [esc, semilla]);
  const [elegidas, setElegidas] = useState<Set<string>>(new Set());
  const [controles, setControles] = useState<Record<string, string>>({});
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-marmol-800">1. Elijan hasta 6 frases para el checklist del puesto ({elegidas.size}/6)</p>
        <p className="text-xs text-marmol-500">Pregúntense: ¿otra persona podría verificarlo con solo mirar, sin preguntarnos?</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {frases.map((f) => {
            const on = elegidas.has(f.id);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() =>
                  setElegidas((s) => {
                    const n = new Set(s);
                    if (n.has(f.id)) n.delete(f.id);
                    else if (n.size < 6) n.add(f.id);
                    return n;
                  })
                }
                className={cn('flex gap-2 rounded-lg border-2 p-2 text-left text-sm', on ? 'border-marca-500 bg-marca-50' : 'border-marmol-200 bg-white hover:border-marca-300')}
              >
                <span>{on ? '☑' : '☐'}</span>
                {f.texto}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-marmol-800">2. ¿Qué control visual resuelve cada problema?</p>
        <div className="mt-2 space-y-2">
          {esc.controles.map((c) => (
            <label key={c.id} className="block rounded-lg border border-marmol-200 bg-white p-2 text-sm">
              <span className="font-medium text-marmol-800">{c.problema}</span>
              <select value={controles[c.id] ?? ''} onChange={(e) => setControles((x) => ({ ...x, [c.id]: e.target.value }))} className="campo mt-1 py-1.5">
                <option value="">Elijan…</option>
                {OPCIONES_CONTROL.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>
      <BotonEntregar
        listo={elegidas.size > 0 && Object.keys(controles).length === esc.controles.length}
        pendiente={pendiente}
        onClick={() => onEntregar({ frases: [...elegidas], controles })}
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Misión 5 — Sostener (tres eventos sorpresa)
// ----------------------------------------------------------------------------

export function M5Sostener({
  esc,
  semilla,
  onEntregar,
  pendiente,
  ubicacionM2,
}: {
  esc: Escenario;
  semilla: string;
  onEntregar: Entregar;
  pendiente: boolean;
  ubicacionM2?: Record<string, Frecuencia>;
}) {
  const [paso, setPaso] = useState(0);
  const [urgencia, setUrgencia] = useState<string | null>(null);
  const [colaborador, setColaborador] = useState<Record<string, { zona: Frecuencia; segundos: number }>>({});
  const [turno, setTurno] = useState<Record<string, boolean>>({});
  const buscar = useMemo(() => elementosBusqueda(esc), [esc]);
  const desde = useRef(Date.now());
  const opciones = useMemo(() => mezclar(esc.urgencia.opciones, semilla), [esc, semilla]);
  const obs = useMemo(() => mezclar(esc.observaciones, semilla), [esc, semilla]);
  const actual = buscar[Object.keys(colaborador).length];

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {['🚨 Urgencia', '👤 Nuevo colaborador', '🔄 Cambio de turno'].map((t, i) => (
          <span key={t} className={cn('flex-1 rounded-lg px-2 py-1 text-center text-[11px] font-semibold', i === paso ? 'bg-secundario text-white' : i < paso ? 'bg-marca-100 text-marca-700' : 'bg-marmol-100 text-marmol-400')}>
            {t}
          </span>
        ))}
      </div>

      {paso === 0 && (
        <div className="space-y-2">
          <p className="font-display text-lg font-bold text-secundario">
            {esc.urgencia.emoji} {esc.urgencia.titulo}
          </p>
          <p className="text-sm text-marmol-700">{esc.urgencia.situacion}</p>
          {opciones.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setUrgencia(o.id)}
              className={cn('block w-full rounded-lg border-2 p-3 text-left text-sm', urgencia === o.id ? 'border-marca-500 bg-marca-50' : 'border-marmol-200 bg-white hover:border-marca-300')}
            >
              {o.texto}
            </button>
          ))}
          <BotonEntregar listo={Boolean(urgencia)} pendiente={false} texto="Siguiente evento →" onClick={() => urgencia && (setPaso(1), (desde.current = Date.now()))} />
        </div>
      )}

      {paso === 1 && (
        <div className="space-y-3 text-center">
          <p className="text-sm text-marmol-700">
            👤 <strong>Llega una persona nueva</strong> que nunca ha usado el puesto. Debe encontrar 5 elementos siguiendo el orden que ustedes definieron en la misión 2
            {ubicacionM2 ? '' : ' (no jugaron la misión 2: vale el orden ideal)'}. Que responda quien menos participó en ordenar.
          </p>
          {actual ? (
            <>
              <p className="text-5xl">{actual.emoji}</p>
              <p className="font-display text-xl font-bold text-secundario">¿Dónde está «{actual.nombre}»?</p>
              <div className="mx-auto grid max-w-md gap-2">
                {(Object.keys(ZONAS) as Frecuencia[]).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => {
                      setColaborador((c) => ({ ...c, [actual.id]: { zona: z, segundos: (Date.now() - desde.current) / 1000 } }));
                      desde.current = Date.now();
                    }}
                    className="rounded-xl border-2 border-marmol-200 bg-white p-3 text-left hover:border-marca-400"
                  >
                    <span className="text-2xl">{ZONAS[z].emoji}</span> <span className="font-semibold text-marmol-800">{ZONAS[z].nombre}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <BotonEntregar listo pendiente={false} texto="Siguiente evento →" onClick={() => setPaso(2)} />
          )}
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-2">
          <p className="text-sm text-marmol-700">
            🔄 <strong>Cambio de turno.</strong> El turno anterior dejó el puesto así. Con su estándar de la misión 4, ¿cada punto cumple o no?
          </p>
          {obs.map((v) => (
            <div key={v.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-marmol-200 bg-white p-2 text-sm">
              <span className="min-w-0 flex-1 text-marmol-800">{v.texto}</span>
              {[
                [true, '✅ Cumple'],
                [false, '❌ No cumple'],
              ].map(([val, txt]) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setTurno((t) => ({ ...t, [v.id]: val as boolean }))}
                  className={cn('rounded-md border px-2 py-1 text-xs font-semibold', turno[v.id] === val ? 'border-marca-500 bg-marca-50 text-marca-700' : 'border-marmol-200 text-marmol-500')}
                >
                  {txt as string}
                </button>
              ))}
            </div>
          ))}
          <BotonEntregar listo={Object.keys(turno).length === obs.length} pendiente={pendiente} onClick={() => onEntregar({ urgencia, colaborador, turno })} />
        </div>
      )}
    </div>
  );
}
