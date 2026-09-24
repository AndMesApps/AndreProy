'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cambiarEstadoAccion, eliminarAccion, guardarAccion } from '@/app/procesos/actions';
import { ESTADOS_ACCION, ORIGENES_ACCION, accionVencida, diasHasta, type EstadoAccion, type OrigenAccion } from '@/lib/procesos';
import { PRIORIDADES, type Recomendacion } from '@/lib/recomendaciones';
import { cn, formatearFecha } from '@/lib/utils';
import { Pencil, Plus, Trash2 } from 'lucide-react';

export interface AccionVista {
  id: string;
  titulo: string;
  detalle: string | null;
  responsable: string | null;
  fecha_compromiso: string | null;
  estado: EstadoAccion;
  origen: OrigenAccion;
  created_at: string;
}

type Borrador = { id?: string; titulo: string; detalle: string; responsable: string; fechaCompromiso: string };
const VACIO: Borrador = { titulo: '', detalle: '', responsable: '', fechaCompromiso: '' };

const ORDEN_ESTADO: Record<EstadoAccion, number> = { en_curso: 0, pendiente: 1, hecha: 2, descartada: 3 };

/** Plan de acción del proceso: qué se va a hacer, quién, para cuándo y en qué va. */
export function PlanAccion({ procesoId, acciones }: { procesoId: string; acciones: AccionVista[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [confirmar, setConfirmar] = useState<string | null>(null);

  const ejecutar = (fn: () => Promise<{ ok: boolean; error?: string }>, despues?: () => void) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? 'Error');
      despues?.();
      router.refresh();
    });
  };

  const guardar = () =>
    borrador &&
    ejecutar(
      () =>
        guardarAccion({
          procesoId,
          id: borrador.id,
          titulo: borrador.titulo,
          detalle: borrador.detalle || undefined,
          responsable: borrador.responsable || undefined,
          fechaCompromiso: borrador.fechaCompromiso,
        }),
      () => setBorrador(null),
    );

  const orden = [...acciones].sort(
    (a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] || (a.fecha_compromiso ?? '9999').localeCompare(b.fecha_compromiso ?? '9999') || a.created_at.localeCompare(b.created_at),
  );
  const hechas = acciones.filter((a) => a.estado === 'hecha').length;
  const vigentes = acciones.filter((a) => a.estado !== 'descartada').length;

  const formulario = borrador && (
    <div className="space-y-2 rounded-xl border-2 border-dashed border-marca-300 bg-marca-50/40 p-3">
      <input autoFocus value={borrador.titulo} onChange={(e) => setBorrador({ ...borrador, titulo: e.target.value })} maxLength={200} placeholder="¿Qué se va a hacer?" className="campo" />
      <textarea value={borrador.detalle} onChange={(e) => setBorrador({ ...borrador, detalle: e.target.value })} rows={2} placeholder="Detalle (opcional)" className="campo" />
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={borrador.responsable} onChange={(e) => setBorrador({ ...borrador, responsable: e.target.value })} maxLength={120} placeholder="Responsable" className="campo" />
        <input type="date" value={borrador.fechaCompromiso} onChange={(e) => setBorrador({ ...borrador, fechaCompromiso: e.target.value })} className="campo" aria-label="Fecha de compromiso" />
      </div>
      <div className="flex gap-2">
        <button type="button" disabled={pending || !borrador.titulo.trim()} onClick={guardar} className="boton py-1.5">
          {borrador.id ? 'Guardar' : 'Agregar acción'}
        </button>
        <button type="button" onClick={() => setBorrador(null)} className="boton-secundario py-1.5">
          Cancelar
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {vigentes > 0 && (
          <div className="min-w-[10rem] flex-1">
            <div className="flex justify-between text-xs text-marmol-500">
              <span>Avance del plan</span>
              <span>
                {hechas} de {vigentes} hechas
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-marmol-100">
              <div className="h-2 rounded-full bg-marca-500" style={{ width: `${(hechas / vigentes) * 100}%` }} />
            </div>
          </div>
        )}
        {!borrador?.id && !borrador && (
          <button type="button" onClick={() => setBorrador(VACIO)} className="boton-secundario no-imprimir py-1.5 text-xs">
            <Plus size={13} /> Nueva acción
          </button>
        )}
      </div>
      {borrador && !borrador.id && formulario}
      {error && <p className="text-sm text-bajo">{error}</p>}

      {orden.length === 0 ? (
        <p className="rounded-lg bg-marmol-50 p-4 text-sm text-marmol-500">
          El plan está vacío. Agrega acciones a mano o envíalas desde el informe de un juego (Cacería Makigami o Carrera Kaizen).
        </p>
      ) : (
        <ul className="space-y-2">
          {orden.map((a) =>
            borrador?.id === a.id ? (
              <li key={a.id}>{formulario}</li>
            ) : (
              <li key={a.id} className={cn('rounded-xl border p-3', accionVencida(a) ? 'border-red-200 bg-red-50/40' : 'border-marmol-200', a.estado === 'descartada' && 'opacity-60')}>
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={cn('font-medium text-marmol-800', (a.estado === 'hecha' || a.estado === 'descartada') && 'line-through decoration-marmol-300')}>{a.titulo}</p>
                    {a.detalle && <p className="mt-0.5 whitespace-pre-line text-xs text-marmol-500">{a.detalle}</p>}
                    <p className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-marmol-400">
                      <span>{ORIGENES_ACCION[a.origen]}</span>
                      <span>👤 {a.responsable || <em className="text-medio">sin responsable</em>}</span>
                      {a.fecha_compromiso && (
                        <span className={cn(accionVencida(a) && 'font-semibold text-bajo')}>
                          📅 {formatearFecha(a.fecha_compromiso)}
                          {accionVencida(a) && ` · vencida hace ${-diasHasta(a.fecha_compromiso)} días`}
                        </span>
                      )}
                    </p>
                  </div>
                  <select
                    value={a.estado}
                    disabled={pending}
                    onChange={(e) => ejecutar(() => cambiarEstadoAccion(procesoId, a.id, e.target.value as EstadoAccion))}
                    className={cn('rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold', ESTADOS_ACCION[a.estado].clase)}
                    aria-label="Estado de la acción"
                  >
                    {(Object.keys(ESTADOS_ACCION) as EstadoAccion[]).map((e) => (
                      <option key={e} value={e}>
                        {ESTADOS_ACCION[e].nombre}
                      </option>
                    ))}
                  </select>
                  <div className="no-imprimir flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBorrador({ id: a.id, titulo: a.titulo, detalle: a.detalle ?? '', responsable: a.responsable ?? '', fechaCompromiso: a.fecha_compromiso ?? '' })}
                      className="text-marmol-300 hover:text-secundario"
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </button>
                    {confirmar === a.id ? (
                      <button type="button" disabled={pending} onClick={() => ejecutar(() => eliminarAccion(procesoId, a.id), () => setConfirmar(null))} className="text-xs font-semibold text-bajo">
                        Borrar
                      </button>
                    ) : (
                      <button type="button" onClick={() => setConfirmar(a.id)} className="text-marmol-300 hover:text-bajo" title="Borrar acción">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

/** Alertas que ya hablan del plan de acción: no tiene sentido volverlas otra acción. */
const SOBRE_EL_PLAN = ['pc-vencidas', 'pc-responsables'];

/** Opciones de mejora del proceso, con un botón para pasarlas al plan de acción. */
export function SugerenciasProceso({ procesoId, recomendaciones }: { procesoId: string; recomendaciones: Recomendacion[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [agregadas, setAgregadas] = useState<Set<string>>(new Set());

  if (recomendaciones.length === 0) return <p className="text-sm text-alto">✓ Todo en orden: el indicador se mide, el plan avanza y no hay alertas.</p>;

  return (
    <ul className="space-y-2">
      {recomendaciones.map((r) => (
        <li key={r.ref} className="flex flex-wrap gap-2 rounded-xl border border-marmol-200 p-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-marmol-800">{r.titulo}</p>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', PRIORIDADES[r.prioridad].clase)}>{PRIORIDADES[r.prioridad].nombre}</span>
            </div>
            <p className="mt-0.5 text-sm text-marmol-600">{r.detalle}</p>
            {r.herramienta && <p className="mt-1 text-xs text-marca-700">🧰 {r.herramienta}</p>}
          </div>
          {!SOBRE_EL_PLAN.includes(r.ref) && (
          <button
            type="button"
            disabled={pending || agregadas.has(r.ref)}
            onClick={() =>
              startTransition(async () => {
                const res = await guardarAccion({ procesoId, titulo: r.titulo.slice(0, 200), detalle: r.detalle, fechaCompromiso: '' });
                if (res.ok) {
                  setAgregadas((s) => new Set(s).add(r.ref));
                  router.refresh();
                }
              })
            }
            className="boton-secundario no-imprimir self-start px-3 py-1 text-xs"
          >
            {agregadas.has(r.ref) ? '✓ Agregada' : '+ Al plan'}
          </button>
          )}
        </li>
      ))}
    </ul>
  );
}
