'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { alternarVoto, eliminarPropuesta, proponerMejora, resolverPropuesta } from '@/app/makigami/actions';
import { ACCIONES_PROPUESTA, calcularTiempoFuturo, formatearDuracion, type AccionPropuesta, type EstadoReto, type MetricasProceso } from '@/lib/makigami';
import { cn } from '@/lib/utils';
import { Check, ThumbsUp, Trash2, Undo2, X, Zap } from 'lucide-react';
import { ContadorAnimado } from './contador-animado';
import { EntradaDuracion, aMinutos, type Duracion } from './entrada-duracion';
import type { PasoVista, PropuestaVista } from './tipos';

const TONO_ACCION: Record<AccionPropuesta, string> = {
  eliminar: 'bg-red-100 text-bajo',
  simplificar: 'bg-amber-100 text-medio',
  automatizar: 'bg-blue-100 text-deber',
  combinar: 'bg-teal-100 text-saber',
  otro: 'bg-marmol-100 text-marmol-600',
};

/**
 * Fase de Rediseño (y vista de Resultados): propuestas de mejora, votos,
 * aprobación del facilitador y el simulador que muestra en vivo cómo se
 * encoge el proceso con las mejoras elegidas.
 */
export function Rediseno({
  retoId,
  estado,
  pasos,
  propuestas,
  metricas,
  miJugadorId,
  esFacilitador,
  pasoSugerido,
  onSimulacion,
}: {
  retoId: string;
  estado: EstadoReto;
  pasos: PasoVista[];
  propuestas: PropuestaVista[];
  metricas: MetricasProceso;
  miJugadorId: string | null;
  esFacilitador: boolean;
  pasoSugerido: string | null;
  /** Avisa al tablero qué pasos quedarían eliminados con la simulación actual. */
  onSimulacion: (pasosEliminados: Set<string>) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const abierto = estado === 'rediseno';

  const aprobadas = propuestas.filter((p) => p.estado === 'aprobada').map((p) => p.id);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set(aprobadas));
  const clavesAprobadas = aprobadas.join(',');
  useEffect(() => setSeleccion(new Set(clavesAprobadas ? clavesAprobadas.split(',') : [])), [clavesAprobadas]);

  const elegidas = propuestas.filter((p) => seleccion.has(p.id) && p.estado !== 'descartada');
  const ahorro = elegidas.reduce((s, p) => s + (Number(p.ahorro_estimado_min) || 0), 0);
  const futuro = calcularTiempoFuturo(metricas, ahorro);
  const reduccion = metricas.tiempoTotal > 0 ? ((metricas.tiempoTotal - futuro) / metricas.tiempoTotal) * 100 : 0;

  const clavesEliminados = elegidas
    .filter((p) => p.accion === 'eliminar' && p.paso_id)
    .map((p) => p.paso_id!)
    .sort()
    .join(',');
  useEffect(() => onSimulacion(new Set(clavesEliminados ? clavesEliminados.split(',') : [])), [clavesEliminados, onSimulacion]);

  const numeroDePaso = useMemo(() => new Map(pasos.map((p, i) => [p.id, i + 1])), [pasos]);

  // Formulario de nueva propuesta
  const [pasoId, setPasoId] = useState(pasoSugerido ?? '');
  useEffect(() => {
    if (pasoSugerido) setPasoId(pasoSugerido);
  }, [pasoSugerido]);
  const [accion, setAccion] = useState<AccionPropuesta>('simplificar');
  const [descripcion, setDescripcion] = useState('');
  const [ahorroInput, setAhorroInput] = useState<Duracion>({ valor: '', unidad: 'd' });

  const ejecutar = (fn: () => Promise<{ ok: boolean; error?: string }>, despues?: () => void) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? 'Error');
      despues?.();
      router.refresh();
    });
  };

  const ordenadas = [...propuestas].sort((a, b) => {
    const peso = (p: PropuestaVista) => (p.estado === 'aprobada' ? 2 : p.estado === 'propuesta' ? 1 : 0);
    return peso(b) - peso(a) || b.votos.length - a.votos.length;
  });

  const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm text-marmol-900';

  return (
    <div className="space-y-4">
      {/* Simulador antes / después */}
      <div className="card overmarca-hidden">
        <div className="bg-degradado px-5 py-4 text-white">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                {estado === 'cerrado' ? 'Resultado del rediseño' : 'Simulador del proceso rediseñado'}
              </p>
              <p className="font-display text-2xl font-semibold">
                <ContadorAnimado valor={metricas.tiempoTotal} formato={formatearDuracion} /> →{' '}
                <span className="text-acento">
                  <ContadorAnimado valor={futuro} formato={formatearDuracion} />
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-bold text-acento">
                <Zap size={22} className="inline -mt-1" /> <ContadorAnimado valor={reduccion} formato={(n) => `-${Math.round(n)}%`} />
              </p>
              <p className="text-xs text-white/70">
                {elegidas.length} {elegidas.length === 1 ? 'mejora' : 'mejoras'} · {formatearDuracion(metricas.tiempoTotal - futuro)} menos
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-2 px-5 py-4">
          <BarraTiempo etiqueta="Hoy" valor={metricas.tiempoTotal} max={metricas.tiempoTotal} clase="bg-red-400" />
          <BarraTiempo etiqueta="Rediseñado" valor={futuro} max={metricas.tiempoTotal} clase="bg-marca-500" />
          <p className="text-xs text-marmol-400">
            {abierto
              ? 'Marca “Simular” en las propuestas para ver cuánto se encoge el proceso. Los pasos que se eliminarían se atenúan en el tablero.'
              : 'Calculado con las mejoras aprobadas. El tiempo que agrega valor nunca se descuenta.'}
          </p>
        </div>
      </div>

      {/* Nueva propuesta */}
      {abierto && miJugadorId && (
        <div className="card p-4 space-y-2">
          <h3 className="font-display font-semibold text-secundario">💡 Propón una mejora</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            <select value={pasoId} onChange={(e) => setPasoId(e.target.value)} className={campo}>
              <option value="">Todo el proceso</option>
              {pasos.map((p, i) => (
                <option key={p.id} value={p.id}>
                  Paso {i + 1}: {p.descripcion.slice(0, 50)}
                </option>
              ))}
            </select>
            <select value={accion} onChange={(e) => setAccion(e.target.value as AccionPropuesta)} className={campo}>
              {(Object.keys(ACCIONES_PROPUESTA) as AccionPropuesta[]).map((k) => (
                <option key={k} value={k}>
                  {ACCIONES_PROPUESTA[k]}
                </option>
              ))}
            </select>
          </div>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} placeholder="¿Qué cambiarías y cómo?" className={campo} />
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-56">
              <EntradaDuracion etiqueta="¿Cuánto tiempo ahorraría? (estimado)" valor={ahorroInput} onChange={setAhorroInput} />
            </div>
            <button
              type="button"
              disabled={pending || !descripcion.trim()}
              onClick={() =>
                ejecutar(
                  () => proponerMejora({ retoId, pasoId: pasoId || undefined, accion, descripcion, ahorroEstimadoMin: aMinutos(ahorroInput) }),
                  () => {
                    setDescripcion('');
                    setAhorroInput({ valor: '', unidad: 'd' });
                  }
                )
              }
              className="rounded-lg bg-marca-500 hover:bg-marca-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
            >
              Proponer
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-bajo">{error}</p>}

      {/* Propuestas */}
      <div className="space-y-2">
        {ordenadas.length === 0 && (
          <div className="card p-6 text-center text-sm text-marmol-400">
            {abierto ? 'Todavía no hay propuestas. ¡Sé el primero en proponer cómo mejorar este proceso!' : 'No se registraron propuestas de mejora.'}
          </div>
        )}
        {ordenadas.map((p) => {
          const yoVote = miJugadorId ? p.votos.includes(miJugadorId) : false;
          const esMia = p.jugador_id === miJugadorId;
          const numero = p.paso_id ? numeroDePaso.get(p.paso_id) : null;
          return (
            <div
              key={p.id}
              className={cn(
                'card p-3 flex gap-3',
                p.estado === 'aprobada' && 'border-marca-300 bg-marca-50/40',
                p.estado === 'descartada' && 'opacity-50'
              )}
            >
              <button
                type="button"
                disabled={!abierto || esMia || !miJugadorId || pending}
                onClick={() => ejecutar(() => alternarVoto(retoId, p.id))}
                title={esMia ? 'No puedes votar tu propia propuesta' : yoVote ? 'Quitar mi voto' : 'Votar'}
                className={cn(
                  'flex w-12 shrink-0 flex-col items-center justify-center rounded-lg border text-xs font-semibold transition',
                  yoVote ? 'border-marca-500 bg-marca-500 text-white' : 'border-marmol-200 text-marmol-500 enabled:hover:border-marca-400'
                )}
              >
                <ThumbsUp size={14} />
                {p.votos.length}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className={cn('rounded px-1.5 py-0.5 font-semibold', TONO_ACCION[p.accion])}>{ACCIONES_PROPUESTA[p.accion]}</span>
                  {numero && <span className="text-marmol-500">Paso {numero}</span>}
                  {p.ahorro_estimado_min > 0 && <span className="text-marca-700 font-medium">⚡ ahorra {formatearDuracion(p.ahorro_estimado_min)}</span>}
                  {p.estado === 'aprobada' && <span className="rounded bg-marca-500 px-1.5 py-0.5 font-semibold text-white">Aprobada</span>}
                  {p.estado === 'descartada' && <span className="rounded bg-marmol-200 px-1.5 py-0.5 text-marmol-600">Descartada</span>}
                </div>
                <p className="mt-1 text-sm text-marmol-800">{p.descripcion}</p>
                <p className="mt-0.5 text-xs text-marmol-400">— {p.jugador_nombre}</p>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {abierto && p.estado !== 'descartada' && (
                    <label className="inline-flex items-center gap-1 text-marmol-500">
                      <input
                        type="checkbox"
                        checked={seleccion.has(p.id)}
                        onChange={(e) =>
                          setSeleccion((s) => {
                            const n = new Set(s);
                            if (e.target.checked) n.add(p.id);
                            else n.delete(p.id);
                            return n;
                          })
                        }
                      />
                      Simular
                    </label>
                  )}
                  {esFacilitador && estado !== 'mapeo' && (
                    <>
                      {p.estado !== 'aprobada' && (
                        <button type="button" disabled={pending} onClick={() => ejecutar(() => resolverPropuesta(retoId, p.id, 'aprobada'))} className="inline-flex items-center gap-0.5 text-marca-700 hover:underline">
                          <Check size={12} /> Aprobar
                        </button>
                      )}
                      {p.estado === 'propuesta' && (
                        <button type="button" disabled={pending} onClick={() => ejecutar(() => resolverPropuesta(retoId, p.id, 'descartada'))} className="inline-flex items-center gap-0.5 text-marmol-500 hover:underline">
                          <X size={12} /> Descartar
                        </button>
                      )}
                      {p.estado !== 'propuesta' && (
                        <button type="button" disabled={pending} onClick={() => ejecutar(() => resolverPropuesta(retoId, p.id, 'propuesta'))} className="inline-flex items-center gap-0.5 text-marmol-500 hover:underline">
                          <Undo2 size={12} /> Reabrir
                        </button>
                      )}
                    </>
                  )}
                  {((esMia && p.estado === 'propuesta' && abierto) || esFacilitador) && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => ejecutar(() => eliminarPropuesta(retoId, p.id))}
                      className="ml-auto text-marmol-300 hover:text-bajo"
                      title="Eliminar propuesta"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarraTiempo({ etiqueta, valor, max, clase }: { etiqueta: string; valor: number; max: number; clase: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs font-medium text-marmol-500">{etiqueta}</span>
      <div className="h-4 flex-1 overmarca-hidden rounded-full bg-marmol-100">
        <div className={`${clase} h-full rounded-full transition-all duration-700 ease-out`} style={{ width: `${max > 0 ? Math.max(2, (valor / max) * 100) : 0}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right text-xs font-semibold text-marmol-700">{formatearDuracion(valor)}</span>
    </div>
  );
}
