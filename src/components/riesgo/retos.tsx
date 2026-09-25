'use client';

import { useMemo, useState } from 'react';
import {
  ACCIONES,
  ALERTAS,
  CARTAS,
  CASO_FINAL,
  CLAVES_ACCION,
  COLORES,
  CONTROLADOR,
  DECISION_R2,
  DECISION_R3,
  ESTRUCTURA,
  FICHAS_CONSULTA,
  MOVIMIENTOS,
  NOMBRE_ETIQUETA,
  OPERACIONES,
  PERFIL_XYZ,
  PREGUNTAS_R4,
  RUTA_DINERO,
  SITUACIONES,
  SOLICITUDES,
  candidatosBf,
  conRuta,
  participacionIndirecta,
  pesosRr,
  puntosAlerta,
  puntosDe,
  type Accion,
  type Color,
  type ConfigRuta,
  type Opcion,
} from '@/lib/riesgo';
import { mezclar } from '@/components/cincos/misiones';
import { cn } from '@/lib/utils';

type Ruta = Pick<ConfigRuta, 'responsable' | 'canal'>;
interface PropsReto {
  semilla: string;
  onEntregar: (respuestas: unknown) => void;
  pendiente: boolean;
  ruta: Ruta;
}

function BotonEntregar({ onClick, listo, pendiente, texto = 'Entregar reto', aviso }: { onClick: () => void; listo: boolean; pendiente: boolean; texto?: string; aviso?: string }) {
  return (
    <div className="sticky bottom-2 z-10 flex flex-col items-center gap-1 pt-2">
      {aviso && !listo && <p className="rounded-full bg-white/95 px-3 py-0.5 text-[11px] text-marmol-500 shadow">{aviso}</p>}
      <button type="button" disabled={pendiente || !listo} onClick={onClick} className={cn('boton px-6 py-3 text-base shadow-lg', !listo && 'bg-marmol-400 hover:bg-marmol-400')}>
        {pendiente ? 'Entregando…' : texto}
      </button>
    </div>
  );
}

function Puntos({ n }: { n: number }) {
  return <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', n > 0 ? 'bg-marca-100 text-marca-700' : n < 0 ? 'bg-red-100 text-bajo' : 'bg-marmol-100 text-marmol-500')}>{n > 0 ? `+${n}` : n}</span>;
}

function Etiquetas({ o }: { o: Opcion }) {
  if (!o.etiquetas.length) return <span className="text-[11px] text-marmol-500">sin puntos</span>;
  return <span className="text-[11px] text-marmol-500">{o.etiquetas.map((e) => NOMBRE_ETIQUETA[e]).join(' · ')}</span>;
}

/** Opciones de elección única (para las decisiones de los retos 2 y 3). */
function Elegir({ opciones, valor, onChange, ruta }: { opciones: Opcion[]; valor: string; onChange: (id: string) => void; ruta: Ruta }) {
  return (
    <div className="grid gap-1.5">
      {opciones.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn('rounded-lg border-2 px-3 py-2 text-left text-sm transition', valor === o.id ? 'border-secundario bg-secundario/5 font-medium text-secundario' : 'border-marmol-200 bg-white hover:border-marca-300')}
        >
          {conRuta(o.texto, ruta)}
        </button>
      ))}
    </div>
  );
}

/**
 * Decisiones con retroalimentación inmediata: al elegir, la opción queda fija
 * y aparece la explicación (situación → decisión → retroalimentación).
 */
function Decision({
  numero,
  emoji,
  titulo,
  texto,
  pregunta,
  opciones,
  elegida,
  onElegir,
  ruta,
}: {
  numero: number;
  emoji: string;
  titulo: string;
  texto: string;
  pregunta: string;
  opciones: Opcion[];
  elegida?: string;
  onElegir: (id: string) => void;
  ruta: Ruta;
}) {
  const o = opciones.find((x) => x.id === elegida);
  const mejor = Math.max(...opciones.map((x) => puntosDe(x.etiquetas)));
  const p = o ? puntosDe(o.etiquetas) : 0;
  return (
    <div className={cn('rounded-xl border-2 bg-white', o ? (p >= mejor ? 'border-marca-300' : p < 0 ? 'border-red-300' : 'border-amber-300') : 'border-acento')}>
      <div className="rounded-t-[0.7rem] bg-amber-50 px-3 py-2">
        <p className="font-display font-bold text-secundario">
          {emoji} {numero}. {titulo}
        </p>
      </div>
      <div className="space-y-2 p-3">
        <p className="text-sm text-marmol-700">{conRuta(texto, ruta)}</p>
        <p className="text-sm font-semibold text-marmol-800">{conRuta(pregunta, ruta)}</p>
        <div className="grid gap-1.5">
          {opciones.map((x) => {
            const esta = x.id === elegida;
            return (
              <button
                key={x.id}
                type="button"
                disabled={Boolean(o)}
                onClick={() => onElegir(x.id)}
                className={cn(
                  'rounded-lg border-2 px-3 py-2 text-left text-sm transition',
                  !o && 'border-marmol-200 hover:border-secundario',
                  o && esta && 'border-secundario bg-secundario/5 font-medium',
                  o && !esta && 'border-marmol-100 text-marmol-400',
                )}
              >
                {conRuta(x.texto, ruta)}
              </button>
            );
          })}
        </div>
        {o && (
          <div className={cn('animate-entrar rounded-lg p-2 text-sm', p >= mejor ? 'bg-marca-50 text-marmol-700' : p < 0 ? 'bg-red-50 text-marmol-700' : 'bg-amber-50 text-marmol-700')}>
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              {p >= mejor ? '✅ ¡Bien decidido!' : p < 0 ? '⚠️ Cuidado' : '🤔 Se puede mejor'} <Puntos n={p} /> <Etiquetas o={o} />
            </p>
            <p className="mt-1">{conRuta(o.porque, ruta)}</p>
            {p < mejor && (
              <p className="mt-1 text-xs text-marmol-600">
                👉 Mejor opción: «{conRuta(opciones.find((x) => puntosDe(x.etiquetas) === mejor)!.texto, ruta)}»
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Reto 1 — ¿Detectas la señal?
// ----------------------------------------------------------------------------

export function R1Senales({ semilla, onEntregar, pendiente }: PropsReto) {
  const [marcas, setMarcas] = useState<Record<string, string[]>>({});
  const [nada, setNada] = useState<Record<string, boolean>>({});
  const situaciones = useMemo(() => SITUACIONES.map((s) => ({ ...s, elementos: mezclar(s.elementos, semilla + s.id) })), [semilla]);
  const listas = SITUACIONES.filter((s) => nada[s.id] || (marcas[s.id]?.length ?? 0) > 0).length;

  const tocar = (sid: string, eid: string) => {
    setNada((n) => ({ ...n, [sid]: false }));
    setMarcas((m) => {
      const actual = m[sid] ?? [];
      return { ...m, [sid]: actual.includes(eid) ? actual.filter((x) => x !== eid) : [...actual, eid] };
    });
  };

  return (
    <div className="space-y-4">
      {situaciones.map((s, i) => (
        <div key={s.id} className="rounded-xl border border-marmol-200 bg-white p-3">
          <p className="font-display font-semibold text-secundario">
            {s.emoji} Situación {i + 1}: {s.titulo}
          </p>
          <p className="mt-1 text-sm text-marmol-700">{s.texto}</p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-marmol-500">¿Qué les llama la atención?</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {s.elementos.map((e) => {
              const on = marcas[s.id]?.includes(e.id);
              return (
                <button key={e.id} type="button" onClick={() => tocar(s.id, e.id)} className={cn('rounded-full border-2 px-3 py-1 text-xs transition', on ? 'border-bajo bg-red-50 font-semibold text-bajo' : 'border-marmol-200 bg-white text-marmol-700 hover:border-red-200')}>
                  {on ? '🚩 ' : ''}
                  {e.texto}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              setNada((n) => ({ ...n, [s.id]: !n[s.id] }));
              setMarcas((m) => ({ ...m, [s.id]: [] }));
            }}
            className={cn('mt-2 rounded-lg border-2 px-3 py-1.5 text-xs font-semibold', nada[s.id] ? 'border-alto bg-green-50 text-alto' : 'border-marmol-200 text-marmol-600 hover:border-green-300')}
          >
            🟢 No hay nada extraño
          </button>
        </div>
      ))}
      <BotonEntregar onClick={() => onEntregar({ marcas, nada })} listo={listas === SITUACIONES.length} pendiente={pendiente} texto="🔎 Entregar las señales" aviso={`Revisadas ${listas} de ${SITUACIONES.length} situaciones`} />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Reto 2 — Conoce a tu contraparte
// ----------------------------------------------------------------------------

export function R2Contraparte({ semilla, onEntregar, pendiente, ruta }: PropsReto) {
  const [pedidas, setPedidas] = useState<string[]>([]);
  const [decision, setDecision] = useState('');
  const solicitudes = useMemo(() => mezclar(SOLICITUDES, semilla), [semilla]);
  const decisiones = useMemo(() => mezclar(DECISION_R2, semilla + 'd'), [semilla]);
  const quedan = FICHAS_CONSULTA - pedidas.length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">🗂️ Ficha del cliente · Comercializadora XYZ S.A.S.</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PERFIL_XYZ.map((p) => (
            <span key={p} className="rounded-full bg-white px-2.5 py-1 text-xs text-marmol-700 shadow-sm">
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-secundario p-3 text-white">
        <p className="text-sm font-semibold">🎟️ Fichas de consulta:</p>
        <div className="flex gap-1">
          {Array.from({ length: FICHAS_CONSULTA }, (_, i) => (
            <span key={i} className={cn('inline-block h-4 w-4 rounded-full border-2 border-white', i < quedan ? 'bg-acento' : 'bg-transparent opacity-40')} />
          ))}
        </div>
        <p className="text-xs text-white/80">Elijan bien: no alcanzan para todo.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {solicitudes.map((s) => {
          const pedida = pedidas.includes(s.id);
          return (
            <div key={s.id} className={cn('rounded-xl border-2 p-3', pedida ? (s.pertinente ? 'border-marca-300 bg-marca-50/50' : 'border-red-300 bg-red-50/60') : 'border-marmol-200 bg-white')}>
              <div className="flex items-start gap-2">
                <span className="text-xl leading-none">{s.emoji}</span>
                <p className="flex-1 text-sm font-semibold text-marmol-800">{s.nombre}</p>
                {!pedida && (
                  <button type="button" disabled={quedan <= 0} onClick={() => setPedidas((p) => [...p, s.id])} className="rounded-lg bg-marmol-100 px-2 py-1 text-xs font-medium text-marmol-700 hover:bg-marca-50 disabled:opacity-40">
                    Pedir (1 ficha)
                  </button>
                )}
              </div>
              {pedida && <p className="mt-2 animate-entrar text-xs text-marmol-700">📬 {s.respuesta}</p>}
            </div>
          );
        })}
      </div>

      {pedidas.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-marmol-800">⚖️ Con lo que encontraron, ¿qué deciden?</p>
          <Elegir opciones={decisiones} valor={decision} onChange={setDecision} ruta={ruta} />
        </div>
      )}

      <BotonEntregar onClick={() => onEntregar({ pedidas, decision })} listo={pedidas.length > 0 && Boolean(decision)} pendiente={pendiente} texto="🪪 Entregar la debida diligencia" aviso="Pidan información y tomen una decisión" />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Reto 3 — Beneficiario final
// ----------------------------------------------------------------------------

function Nodo({ id, marcados, onToggle, nivel }: { id: string; marcados: string[]; onToggle: (id: string) => void; nivel: number }) {
  const n = ESTRUCTURA.find((x) => x.id === id)!;
  const hijos = ESTRUCTURA.filter((x) => x.padre === id);
  const on = marcados.includes(id);
  return (
    <li className={cn(nivel > 0 && 'border-l-2 border-dashed border-marmol-300 pl-3')}>
      <div className="flex items-center gap-2 py-1">
        {n.padre ? (
          <button
            type="button"
            onClick={() => onToggle(id)}
            className={cn('flex min-w-0 flex-1 items-center gap-2 rounded-lg border-2 px-2 py-1.5 text-left text-sm', on ? 'border-secundario bg-secundario/5' : 'border-marmol-200 bg-white hover:border-marca-300')}
          >
            <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs', on ? 'border-secundario bg-secundario text-white' : 'border-marmol-300')}>{on ? '✓' : ''}</span>
            <span className="text-lg leading-none">{n.tipo === 'natural' ? '🧑' : '🏢'}</span>
            <span className="min-w-0 flex-1">
              <strong className="text-marmol-800">{n.nombre}</strong>
              <span className="block text-[11px] text-marmol-500">{n.detalle}</span>
            </span>
            <span className="shrink-0 rounded-full bg-acento/30 px-2 py-0.5 text-xs font-bold text-marmol-800">{n.pct} %</span>
          </button>
        ) : (
          <p className="rounded-lg bg-secundario px-3 py-1.5 text-sm font-semibold text-white">🏢 {n.nombre}</p>
        )}
      </div>
      {hijos.length > 0 && (
        <ul className="ml-3">
          {hijos.map((h) => (
            <Nodo key={h.id} id={h.id} marcados={marcados} onToggle={onToggle} nivel={nivel + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function R3Beneficiario({ semilla, onEntregar, pendiente, ruta }: PropsReto) {
  const [marcados, setMarcados] = useState<string[]>([]);
  const [decision, setDecision] = useState('');
  const decisiones = useMemo(() => mezclar(DECISION_R3, semilla), [semilla]);
  const toggle = (id: string) => setMarcados((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  const onC = marcados.includes(CONTROLADOR.id);

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-marmol-50 p-2 text-xs text-marmol-600">
        💡 Pista: para saber cuánto tiene de verdad una persona, multipliquen los porcentajes de la cadena. Ej.: 50 % de una empresa que tiene el 40 % = 20 %. Marquen a
        quienes tengan el 5 % o más, o a quien controle por otros medios.
      </p>
      <ul>
        <Nodo id="xyz" marcados={marcados} onToggle={toggle} nivel={0} />
      </ul>
      <button type="button" onClick={() => toggle(CONTROLADOR.id)} className={cn('flex w-full items-start gap-2 rounded-xl border-2 p-3 text-left', onC ? 'border-secundario bg-secundario/5' : 'border-dashed border-acento bg-amber-50/60')}>
        <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs', onC ? 'border-secundario bg-secundario text-white' : 'border-marmol-300')}>{onC ? '✓' : ''}</span>
        <span className="text-sm">
          <strong className="text-marmol-800">📜 Documento encontrado: {CONTROLADOR.nombre}</strong>
          <span className="block text-xs text-marmol-600">{CONTROLADOR.detalle}</span>
        </span>
      </button>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-marmol-800">⚖️ El cliente no quiere dar los datos de estas personas. ¿Qué hacen?</p>
        <Elegir opciones={decisiones} valor={decision} onChange={setDecision} ruta={ruta} />
      </div>
      <BotonEntregar
        onClick={() => onEntregar({ marcados, decision })}
        listo={marcados.length > 0 && Boolean(decision)}
        pendiente={pendiente}
        texto={`👤 Entregar (${marcados.length} marcados)`}
        aviso="Marquen a los beneficiarios finales y decidan"
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Reto 4 — Sigue el dinero
// ----------------------------------------------------------------------------

export function R4Dinero({ semilla, onEntregar, pendiente }: PropsReto) {
  const [ruta, setRuta] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<Record<string, 'ok' | 'raro'>>({});
  const [preguntas, setPreguntas] = useState<Record<string, string>>({});
  const fichas = useMemo(() => mezclar(MOVIMIENTOS, semilla), [semilla]);
  const pregs = useMemo(() => PREGUNTAS_R4.map((p) => ({ ...p, opciones: mezclar(p.opciones, semilla + p.id) })), [semilla]);
  const listo = ruta.length > 0 && Object.keys(marcas).length === MOVIMIENTOS.length && Object.keys(preguntas).length === PREGUNTAS_R4.length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-dashed border-secundario/40 bg-white p-3">
        <p className="text-sm font-semibold text-marmol-800">🧭 El recorrido del dinero de la venta</p>
        <p className="text-[11px] text-marmol-500">Toquen «➕ Al recorrido» en el orden en que se mueve el dinero. Ojo: no todas las fichas hacen parte del recorrido.</p>
        {ruta.length === 0 ? (
          <p className="mt-2 text-center text-xs text-marmol-400">Todavía no han armado el recorrido.</p>
        ) : (
          <ol className="mt-2 flex flex-wrap items-center gap-1 text-xs">
            {ruta.map((id, i) => {
              const m = MOVIMIENTOS.find((x) => x.id === id)!;
              return (
                <li key={id} className="flex items-center gap-1">
                  {i === 0 && <span className="rounded bg-marmol-100 px-1.5 py-1">{m.de}</span>}
                  <span className="font-bold text-secundario">→ {pesosRr(m.monto)} →</span>
                  <span className="rounded bg-marmol-100 px-1.5 py-1">{m.a}</span>
                </li>
              );
            })}
          </ol>
        )}
        {ruta.length > 0 && (
          <button type="button" onClick={() => setRuta([])} className="mt-2 text-xs text-marmol-500 underline">
            Volver a armar
          </button>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {fichas.map((m) => (
          <div key={m.id} className={cn('rounded-xl border-2 p-3', marcas[m.id] === 'raro' ? 'border-red-300 bg-red-50/50' : marcas[m.id] === 'ok' ? 'border-green-300 bg-green-50/50' : 'border-marmol-200 bg-white')}>
            <p className="text-center font-display text-lg font-bold text-secundario">💰 {pesosRr(m.monto)}</p>
            <p className="text-center text-xs text-marmol-700">
              {m.de} <strong>→</strong> {m.a}
            </p>
            <p className="mt-1 text-center text-[11px] italic text-marmol-500">{m.concepto}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              <button type="button" onClick={() => setMarcas((x) => ({ ...x, [m.id]: 'ok' }))} className={cn('rounded-full px-2.5 py-1 text-xs', marcas[m.id] === 'ok' ? 'bg-alto font-semibold text-white' : 'bg-marmol-100 text-marmol-600')}>
                ✓ Cuadra
              </button>
              <button type="button" onClick={() => setMarcas((x) => ({ ...x, [m.id]: 'raro' }))} className={cn('rounded-full px-2.5 py-1 text-xs', marcas[m.id] === 'raro' ? 'bg-bajo font-semibold text-white' : 'bg-marmol-100 text-marmol-600')}>
                ⚠️ No cuadra
              </button>
              {!ruta.includes(m.id) && (
                <button type="button" onClick={() => setRuta((r) => [...r, m.id])} className="rounded-full bg-secundario/10 px-2.5 py-1 text-xs font-semibold text-secundario">
                  ➕ Al recorrido
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-marmol-800">❓ Las preguntas que siempre hay que hacer</p>
        {pregs.map((p) => (
          <div key={p.id} className="space-y-1">
            <p className="text-sm text-marmol-800">{p.pregunta}</p>
            <div className="grid gap-1">
              {p.opciones.map((o) => (
                <button key={o.id} type="button" onClick={() => setPreguntas((x) => ({ ...x, [p.id]: o.id }))} className={cn('rounded-lg border-2 px-3 py-1.5 text-left text-xs', preguntas[p.id] === o.id ? 'border-secundario bg-secundario/5 font-semibold' : 'border-marmol-200 bg-white')}>
                  {o.texto}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <BotonEntregar onClick={() => onEntregar({ ruta, marcas, preguntas })} listo={listo} pendiente={pendiente} texto="💸 Entregar el recorrido" aviso="Armen el recorrido, revisen las 4 fichas y respondan las preguntas" />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Reto 5 — Semáforo
// ----------------------------------------------------------------------------

export function R5Semaforo({ semilla, onEntregar, pendiente }: PropsReto) {
  const [colores, setColores] = useState<Record<string, Color>>({});
  const [razones, setRazones] = useState<Record<string, string>>({});
  const ops = useMemo(() => mezclar(OPERACIONES, semilla).map((o) => ({ ...o, razones: mezclar(o.razones, semilla + o.id) })), [semilla]);
  const listas = OPERACIONES.filter((o) => colores[o.id] && razones[o.id]).length;
  return (
    <div className="space-y-3">
      {ops.map((o, i) => (
        <div key={o.id} className="rounded-xl border border-marmol-200 bg-white p-3">
          <p className="text-sm text-marmol-800">
            <strong className="text-secundario">Operación {i + 1}.</strong> {o.texto}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(Object.keys(COLORES) as Color[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setColores((c) => ({ ...c, [o.id]: k }))}
                className={cn(
                  'rounded-full border-2 px-3 py-1 text-xs font-semibold',
                  colores[o.id] === k ? (k === 'verde' ? 'border-alto bg-green-50 text-alto' : k === 'amarillo' ? 'border-medio bg-amber-50 text-medio' : 'border-bajo bg-red-50 text-bajo') : 'border-marmol-200 text-marmol-600',
                )}
                title={COLORES[k].ayuda}
              >
                {COLORES[k].emoji} {COLORES[k].nombre}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-marmol-500">¿Por qué?</p>
          <div className="mt-1 grid gap-1">
            {o.razones.map((r) => (
              <button key={r.id} type="button" onClick={() => setRazones((x) => ({ ...x, [o.id]: r.id }))} className={cn('rounded-lg border-2 px-2.5 py-1.5 text-left text-xs', razones[o.id] === r.id ? 'border-secundario bg-secundario/5 font-semibold' : 'border-marmol-200')}>
                {r.texto}
              </button>
            ))}
          </div>
        </div>
      ))}
      <BotonEntregar onClick={() => onEntregar({ colores, razones })} listo={listas === OPERACIONES.length} pendiente={pendiente} texto="🚦 Entregar el semáforo" aviso={`Clasificadas ${listas} de ${OPERACIONES.length}`} />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Reto 6 — Cartas de evento
// ----------------------------------------------------------------------------

export function R6Cartas({ semilla, onEntregar, pendiente, ruta }: PropsReto) {
  const [el, setEl] = useState<Record<string, string>>({});
  const cartas = useMemo(() => CARTAS.map((c) => ({ ...c, opciones: mezclar(c.opciones, semilla + c.id) })), [semilla]);
  const visibles = cartas.slice(0, Object.keys(el).length + 1);
  return (
    <div className="space-y-3">
      {visibles.map((c, i) => (
        <Decision key={c.id} numero={i + 1} emoji={c.emoji} titulo={c.titulo} texto={c.texto} pregunta={c.pregunta} opciones={c.opciones} elegida={el[c.id]} onElegir={(id) => setEl((x) => ({ ...x, [c.id]: id }))} ruta={ruta} />
      ))}
      <p className="text-center text-[11px] text-marmol-400">
        Carta {Math.min(visibles.length, CARTAS.length)} de {CARTAS.length}
      </p>
      <BotonEntregar onClick={() => onEntregar({ elecciones: el })} listo={Object.keys(el).length === CARTAS.length} pendiente={pendiente} texto="🃏 Entregar las cartas" aviso="Decidan todas las cartas" />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Reto 7 — Escala correctamente
// ----------------------------------------------------------------------------

export function R7Escalar({ semilla, onEntregar, pendiente, ruta }: PropsReto) {
  const [acc, setAcc] = useState<Record<string, Accion>>({});
  const alertas = useMemo(() => mezclar(ALERTAS, semilla), [semilla]);
  const visibles = alertas.slice(0, Object.keys(acc).length + 1);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-marmol-50 p-2 sm:grid-cols-3">
        {CLAVES_ACCION.map((k) => (
          <p key={k} className="text-[11px] text-marmol-600">
            <strong>
              {ACCIONES[k].emoji} {ACCIONES[k].nombre}:
            </strong>{' '}
            {conRuta(ACCIONES[k].ayuda, ruta)}
          </p>
        ))}
      </div>
      {visibles.map((a, i) => {
        const elegida = acc[a.id];
        const p = puntosAlerta(a, elegida);
        const bien = elegida === a.mejor;
        return (
          <div key={a.id} className={cn('rounded-xl border-2 bg-white p-3', !elegida ? 'border-acento' : bien ? 'border-marca-300' : p < 0 ? 'border-red-300' : 'border-amber-300')}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-bajo">🔔 Nueva información {i + 1}</p>
            <p className="mt-1 text-sm text-marmol-800">{a.texto}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CLAVES_ACCION.map((k) => (
                <button
                  key={k}
                  type="button"
                  disabled={Boolean(elegida)}
                  onClick={() => setAcc((x) => ({ ...x, [a.id]: k }))}
                  className={cn('rounded-full border-2 px-3 py-1 text-xs font-medium', elegida === k ? 'border-secundario bg-secundario text-white' : elegida ? 'border-marmol-100 text-marmol-300' : 'border-marmol-200 hover:border-secundario')}
                >
                  {ACCIONES[k].emoji} {ACCIONES[k].nombre}
                </button>
              ))}
            </div>
            {elegida && (
              <div className={cn('mt-2 animate-entrar rounded-lg p-2 text-sm', bien ? 'bg-marca-50' : p < 0 ? 'bg-red-50' : 'bg-amber-50')}>
                <p className="flex flex-wrap items-center gap-2 font-semibold text-marmol-800">
                  {bien ? '✅ Ruta correcta' : `👉 Lo indicado era: ${ACCIONES[a.mejor].emoji} ${ACCIONES[a.mejor].nombre}`} <Puntos n={p} />
                </p>
                <p className="mt-1 text-marmol-700">{conRuta(a.porque, ruta)}</p>
              </div>
            )}
          </div>
        );
      })}
      <BotonEntregar onClick={() => onEntregar({ acciones: acc })} listo={Object.keys(acc).length === ALERTAS.length} pendiente={pendiente} texto="📣 Entregar las respuestas" aviso={`Respondidas ${Object.keys(acc).length} de ${ALERTAS.length}`} />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Reto 8 — Caso final
// ----------------------------------------------------------------------------

export function R8CasoFinal({ semilla, onEntregar, pendiente, ruta }: PropsReto) {
  const [el, setEl] = useState<Record<string, string>>({});
  const pasos = useMemo(() => CASO_FINAL.map((p) => ({ ...p, opciones: mezclar(p.opciones, semilla + p.id) })), [semilla]);
  const visibles = pasos.slice(0, Object.keys(el).length + 1);
  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {CASO_FINAL.map((p, i) => (
          <div key={p.id} className={cn('h-2 flex-1 rounded-full', el[p.id] ? 'bg-marca-500' : i === Object.keys(el).length ? 'bg-acento' : 'bg-marmol-200')} title={p.titulo} />
        ))}
      </div>
      {visibles.map((p, i) => (
        <Decision key={p.id} numero={i + 1} emoji={p.emoji} titulo={p.titulo} texto={p.texto} pregunta={p.pregunta} opciones={p.opciones} elegida={el[p.id]} onElegir={(id) => setEl((x) => ({ ...x, [p.id]: id }))} ruta={ruta} />
      ))}
      <BotonEntregar onClick={() => onEntregar({ elecciones: el })} listo={Object.keys(el).length === CASO_FINAL.length} pendiente={pendiente} texto="🏁 Cerrar el caso final" aviso={`Paso ${Math.min(Object.keys(el).length + 1, CASO_FINAL.length)} de ${CASO_FINAL.length}`} />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Revisión después de entregar (qué era lo correcto)
// ----------------------------------------------------------------------------

function RevisionDecisiones({ items, elecciones, ruta }: { items: { id: string; titulo: string; opciones: Opcion[] }[]; elecciones: Record<string, string>; ruta: Ruta }) {
  return (
    <ul className="space-y-1.5 text-left text-xs">
      {items.map((it) => {
        const o = it.opciones.find((x) => x.id === elecciones[it.id]);
        const mejor = it.opciones.reduce((a, b) => (puntosDe(b.etiquetas) > puntosDe(a.etiquetas) ? b : a));
        const bien = o && puntosDe(o.etiquetas) >= puntosDe(mejor.etiquetas);
        return (
          <li key={it.id} className={cn('rounded-lg p-2', bien ? 'bg-marca-50' : 'bg-red-50')}>
            <p className="font-semibold text-marmol-800">
              {bien ? '✅' : '❌'} {it.titulo} {o && <Puntos n={puntosDe(o.etiquetas)} />}
            </p>
            {!bien && o && <p className="text-marmol-500">Eligieron: «{conRuta(o.texto, ruta)}»</p>}
            <p className="text-marmol-700">
              Mejor decisión: «{conRuta(mejor.texto, ruta)}» — {conRuta(mejor.porque, ruta)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export function RevisionReto({ numero, respuestas, ruta }: { numero: number; respuestas: any; ruta: Ruta }) {
  const r = respuestas ?? {};
  if (numero === 1) {
    const marcas = (r.marcas ?? {}) as Record<string, string[]>;
    const nada = (r.nada ?? {}) as Record<string, boolean>;
    return (
      <div className="space-y-2 text-left text-xs">
        {SITUACIONES.map((s) => (
          <div key={s.id} className="rounded-lg bg-marmol-50 p-2">
            <p className="font-semibold text-marmol-800">
              {s.emoji} {s.titulo} {nada[s.id] && <span className="font-normal text-marmol-500">(dijeron «nada extraño»)</span>}
            </p>
            <ul className="mt-1 space-y-0.5">
              {s.elementos.map((e) => {
                const m = marcas[s.id]?.includes(e.id);
                const bien = Boolean(e.senal) === Boolean(m);
                return (
                  <li key={e.id} className={bien ? 'text-marmol-700' : 'text-bajo'}>
                    {e.senal ? '🚩' : '▫️'} {e.texto} — {bien ? '✓' : m ? '✗ no era señal' : '✗ se escapó'}. <span className="text-marmol-500">{e.porque}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-1 text-marmol-600">💡 {s.leccion}</p>
          </div>
        ))}
      </div>
    );
  }
  if (numero === 2) {
    const pedidas = (r.pedidas ?? []) as string[];
    return (
      <div className="space-y-2 text-left text-xs">
        <ul className="grid gap-1 sm:grid-cols-2">
          {SOLICITUDES.map((s) => (
            <li key={s.id} className={cn(pedidas.includes(s.id) ? (s.pertinente ? 'text-alto' : 'text-bajo') : 'text-marmol-500')}>
              {pedidas.includes(s.id) ? (s.pertinente ? '✓ Pidieron' : '✗ Pidieron') : s.clave ? '⚠️ Faltó (clave)' : '· No pidieron'}: {s.emoji} {s.nombre}
              {!s.pertinente && ' — no corresponde a la debida diligencia'}
            </li>
          ))}
        </ul>
        <p className="text-marmol-600">💡 Lo clave para una operación de $800 millones: quién está detrás (beneficiario final), de dónde viene el dinero y si su capacidad financiera lo explica.</p>
        <RevisionDecisiones items={[{ id: 'd', titulo: 'La decisión', opciones: DECISION_R2 }]} elecciones={{ d: r.decision }} ruta={ruta} />
      </div>
    );
  }
  if (numero === 3) {
    const marcados = (r.marcados ?? []) as string[];
    return (
      <div className="space-y-2 text-left text-xs">
        <ul className="space-y-0.5">
          {candidatosBf().map((k) => {
            const m = marcados.includes(k.id);
            const bien = m === k.esBf;
            const nodo = ESTRUCTURA.find((n) => n.id === k.id);
            return (
              <li key={k.id} className={bien ? 'text-marmol-700' : 'text-bajo'}>
                {k.esBf ? '👤' : '▫️'} <strong>{k.nombre}</strong>
                {nodo?.tipo === 'natural' && ` (${participacionIndirecta(k.id).toLocaleString('es-CO')} % real)`} — {bien ? '✓' : '✗'} {k.porque}
              </li>
            );
          })}
        </ul>
        <RevisionDecisiones items={[{ id: 'd', titulo: 'Si el cliente no da los datos', opciones: DECISION_R3 }]} elecciones={{ d: r.decision }} ruta={ruta} />
      </div>
    );
  }
  if (numero === 4) {
    const marcas = (r.marcas ?? {}) as Record<string, string>;
    const rutaE = (r.ruta ?? []) as string[];
    const rutaBien = rutaE.join() === RUTA_DINERO.join();
    return (
      <div className="space-y-2 text-left text-xs">
        <p className={rutaBien ? 'text-alto' : 'text-bajo'}>
          {rutaBien ? '✓' : '✗'} Recorrido correcto: Inversiones Omega → Textiles Horizonte → Servicios Brava → cuenta en el exterior. El flete es un pago normal y no hace parte del recorrido.
        </p>
        <ul className="space-y-0.5">
          {MOVIMIENTOS.map((m) => {
            const bien = (marcas[m.id] === 'raro') === m.inconsistente;
            return (
              <li key={m.id} className={bien ? 'text-marmol-700' : 'text-bajo'}>
                {m.inconsistente ? '⚠️' : '✓'} {m.de} → {m.a} ({pesosRr(m.monto)}): {bien ? '✓' : '✗'} {m.porque}
              </li>
            );
          })}
        </ul>
        <ul className="space-y-0.5">
          {PREGUNTAS_R4.map((p) => {
            const o = p.opciones.find((x) => x.id === r.preguntas?.[p.id]);
            const c = p.opciones.find((x) => x.correcta)!;
            return (
              <li key={p.id} className={o?.correcta ? 'text-marmol-700' : 'text-bajo'}>
                {o?.correcta ? '✓' : '✗'} {p.pregunta} → <strong>{c.texto}</strong>. {c.porque}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  if (numero === 5) {
    return (
      <ul className="space-y-1.5 text-left text-xs">
        {OPERACIONES.map((o) => {
          const col = r.colores?.[o.id] as Color | undefined;
          const raz = o.razones.find((x) => x.id === r.razones?.[o.id]);
          const solida = o.razones.find((x) => x.calidad === 'solida')!;
          return (
            <li key={o.id} className={cn('rounded-lg p-2', col === o.color && raz?.calidad === 'solida' ? 'bg-marca-50' : 'bg-red-50')}>
              <p className="text-marmol-800">{o.texto}</p>
              <p className="mt-0.5 font-semibold">
                Correcto: {COLORES[o.color].emoji} {COLORES[o.color].nombre} · ustedes: {col ? `${COLORES[col].emoji} ${COLORES[col].nombre}` : '—'}
                {raz && ` · razón ${raz.calidad === 'solida' ? 'sólida ✓' : raz.calidad === 'automatica' ? 'automática (+5)' : 'equivocada ✗'}`}
              </p>
              <p className="text-marmol-600">
                Razón sólida: «{solida.texto}» {o.porque}
              </p>
            </li>
          );
        })}
      </ul>
    );
  }
  if (numero === 6) return <RevisionDecisiones items={CARTAS.map((c) => ({ id: c.id, titulo: `${c.emoji} ${c.titulo}`, opciones: c.opciones }))} elecciones={r.elecciones ?? {}} ruta={ruta} />;
  if (numero === 7) {
    return (
      <ul className="space-y-1.5 text-left text-xs">
        {ALERTAS.map((a) => {
          const e = r.acciones?.[a.id] as Accion | undefined;
          return (
            <li key={a.id} className={cn('rounded-lg p-2', e === a.mejor ? 'bg-marca-50' : 'bg-red-50')}>
              <p className="text-marmol-800">{a.texto}</p>
              <p className="font-semibold">
                {e === a.mejor ? '✅' : '❌'} Indicado: {ACCIONES[a.mejor].emoji} {ACCIONES[a.mejor].nombre}
                {e && e !== a.mejor && ` · ustedes: ${ACCIONES[e].emoji} ${ACCIONES[e].nombre}`} <Puntos n={puntosAlerta(a, e)} />
              </p>
              <p className="text-marmol-600">{conRuta(a.porque, ruta)}</p>
            </li>
          );
        })}
      </ul>
    );
  }
  if (numero === 8) return <RevisionDecisiones items={CASO_FINAL.map((p) => ({ id: p.id, titulo: `${p.emoji} ${p.titulo}`, opciones: p.opciones }))} elecciones={r.elecciones ?? {}} ruta={ruta} />;
  return null;
}
