'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { avanzarFase, controlarCronometro, decidirTarjeta, retrocederFase } from '@/app/kaizen/actions';
import { INFO_FASE, momentoAnterior, momentoSiguiente, tarjetaCompleta, formatearPct, type MarcadorEquipo, type Momento } from '@/lib/kaizen';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Eye, Play, RotateCcw, Square } from 'lucide-react';
import { FormularioResultado } from './formulario-resultado';
import { ResumenTarjeta } from './tarjeta-kaizen';
import type { EquipoVista, SesionVista, TarjetaVista } from './tipos';

function textoMomento(m: Momento | null, total: number) {
  if (!m) return '';
  if (m.estado === 'cerrado') return '🏁 Terminar carrera y ver resultados';
  if (m.estado === 'preparacion') return 'Volver a preparación';
  const f = m.fase ? INFO_FASE[m.fase] : null;
  return `Ronda ${m.ronda}${m.ronda === 1 ? ' (línea base)' : ''} · ${f?.emoji} ${f?.nombre}${m.ronda === total && m.fase === 'actuar' ? ' (última)' : ''}`;
}

/**
 * Mando del facilitador: mover la carrera de fase en fase, manejar el
 * cronómetro y ver (y corregir) cómo va cada equipo en cualquier ronda.
 */
export function ControlFacilitador({
  sesion,
  equipos,
  tarjetas,
  marcadores,
}: {
  sesion: SesionVista;
  equipos: EquipoVista[];
  tarjetas: TarjetaVista[];
  marcadores: Map<string, MarcadorEquipo>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmarFin, setConfirmarFin] = useState(false);
  const [rondaVista, setRondaVista] = useState<number | null>(null);
  const [verTarjeta, setVerTarjeta] = useState<string | null>(null);

  const momento: Momento = { estado: sesion.estado, ronda: sesion.rondaActual, fase: sesion.fase };
  const siguiente = momentoSiguiente(momento, sesion.totalRondas);
  const anterior = momentoAnterior(momento, sesion.totalRondas);
  const ronda = rondaVista ?? Math.max(1, sesion.rondaActual);

  const ejecutar = (fn: () => Promise<{ ok: boolean; error?: string }>, despues?: () => void) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? 'Error');
      despues?.();
      router.refresh();
    });
  };

  const avanzar = () => {
    if (siguiente?.estado === 'cerrado' && !confirmarFin) return setConfirmarFin(true);
    ejecutar(() => avanzarFase(sesion.id), () => {
      setConfirmarFin(false);
      setRondaVista(null);
    });
  };

  // Qué equipos van atrasados en la fase actual.
  const pendientes =
    sesion.estado !== 'jugando'
      ? []
      : equipos.filter((e) => {
          const r = marcadores.get(e.id)?.rondas.find((x) => x.ronda === sesion.rondaActual);
          if (sesion.fase === 'planear') return !r?.tarjeta;
          if (sesion.fase === 'verificar') return !r?.resultado;
          if (sesion.fase === 'actuar') return r?.tarjeta && !r.tarjeta.decision;
          return false;
        });

  return (
    <div className="card space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display font-semibold text-secundario">🎛️ Mando del facilitador</span>
        {sesion.fase === 'hacer' && (
          <div className="flex flex-wrap gap-1.5 sm:ml-auto">
            {!sesion.cronometroInicio ? (
              <button type="button" disabled={pending} onClick={() => ejecutar(() => controlarCronometro(sesion.id))} className="boton bg-acento px-3 py-1.5 text-secundario hover:bg-amber-300">
                <Play size={14} /> Iniciar cronómetro
              </button>
            ) : (
              <>
                <button type="button" disabled={pending} onClick={() => ejecutar(() => controlarCronometro(sesion.id))} className="boton-secundario px-3 py-1.5 text-xs">
                  <RotateCcw size={13} /> Reiniciar
                </button>
                <button type="button" disabled={pending} onClick={() => ejecutar(() => controlarCronometro(sesion.id, true))} className="boton-secundario px-3 py-1.5 text-xs">
                  <Square size={13} /> Detener
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {anterior && (
          <button type="button" disabled={pending} onClick={() => ejecutar(() => retrocederFase(sesion.id))} className="boton-secundario px-3 py-2 text-xs" title={`Volver a: ${textoMomento(anterior, sesion.totalRondas)}`}>
            <ChevronLeft size={14} /> Atrás
          </button>
        )}
        {siguiente && (
          <button type="button" disabled={pending} onClick={avanzar} className={cn('boton flex-1 sm:flex-none', confirmarFin && 'bg-bajo hover:bg-red-800')}>
            {confirmarFin ? '¿Seguro? Toca otra vez para terminar' : sesion.estado === 'preparacion' ? '▶ Empezar: Ronda 1 (línea base)' : <>Siguiente: {textoMomento(siguiente, sesion.totalRondas)}</>}
            {!confirmarFin && sesion.estado !== 'preparacion' && <ChevronRight size={15} />}
          </button>
        )}
        {confirmarFin && (
          <button type="button" onClick={() => setConfirmarFin(false)} className="text-xs text-marmol-500">
            Cancelar
          </button>
        )}
      </div>
      {pendientes.length > 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-medio ring-1 ring-amber-200">
          ⏳ Faltan: {pendientes.map((e) => `${e.emoji} ${e.nombre}`).join(', ')}
          {sesion.fase === 'planear' && ' (sin tarjeta Kaizen)'}
          {sesion.fase === 'verificar' && ' (sin resultado)'}
          {sesion.fase === 'actuar' && ' (sin decidir)'}. Puedes esperar o seguir de todos modos.
        </p>
      )}
      {error && <p className="text-sm text-bajo">{error}</p>}

      {sesion.estado !== 'preparacion' && equipos.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-marmol-500">Ver ronda:</span>
            {Array.from({ length: Math.max(1, sesion.estado === 'cerrado' ? sesion.totalRondas : sesion.rondaActual) }, (_, i) => i + 1).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRondaVista(r)}
                className={cn('rounded-full px-2.5 py-0.5', r === ronda ? 'bg-secundario font-semibold text-white' : 'bg-marmol-100 text-marmol-600 hover:bg-marmol-200')}
              >
                R{r}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-xs">
              <thead className="text-left text-marmol-400">
                <tr>
                  <th className="py-1.5 font-medium">Equipo</th>
                  {ronda > 1 && <th className="font-medium">Tarjeta Kaizen</th>}
                  <th className="font-medium">Con calidad / defectos</th>
                  <th className="font-medium">Mejora</th>
                  {ronda > 1 && <th className="font-medium">Decisión</th>}
                </tr>
              </thead>
              <tbody>
                {equipos.map((e) => {
                  const r = marcadores.get(e.id)?.rondas.find((x) => x.ronda === ronda);
                  const tarjeta = tarjetas.find((t) => t.equipo_id === e.id && t.ronda === ronda);
                  const clave = `${e.id}-${ronda}`;
                  return (
                    <tr key={e.id} className="border-t border-marmol-100 align-top">
                      <td className="py-2 pr-2">
                        <span className="font-medium text-marmol-800">
                          {e.emoji} {e.nombre}
                        </span>
                        <span className="block text-[10px] text-marmol-400">
                          {e.miembros} {e.miembros === 1 ? 'jugador' : 'jugadores'}
                        </span>
                      </td>
                      {ronda > 1 && (
                        <td className="py-2 pr-2">
                          {tarjeta ? (
                            <button type="button" onClick={() => setVerTarjeta((v) => (v === clave ? null : clave))} className="inline-flex items-center gap-1 text-left text-marmol-700 hover:text-secundario">
                              <Eye size={12} className="shrink-0" />
                              <span className="line-clamp-2">{tarjeta.idea || 'Sin idea todavía'}</span>
                              {tarjetaCompleta(tarjeta) && <span title="Tarjeta completa">🧠</span>}
                            </button>
                          ) : (
                            <span className="text-marmol-400">—</span>
                          )}
                          {verTarjeta === clave && tarjeta && (
                            <div className="mt-2 rounded-lg bg-marmol-50 p-2">
                              <ResumenTarjeta tarjeta={tarjeta} unidad={sesion.unidad} compacto />
                            </div>
                          )}
                        </td>
                      )}
                      <td className="py-2 pr-2">
                        <FormularioResultado key={clave} sesionId={sesion.id} equipoId={e.id} ronda={ronda} resultado={r?.resultado} unidad={sesion.unidad} compacto />
                      </td>
                      <td className={cn('py-2 pr-2 font-semibold', (r?.mejoraPct ?? 0) > 0 ? 'text-alto' : (r?.mejoraPct ?? 0) < 0 ? 'text-bajo' : 'text-marmol-400')}>
                        {ronda === 1 ? <span className="font-normal text-marmol-400">base</span> : formatearPct(r?.mejoraPct ?? null)}
                        {tarjeta?.prediccion != null && r?.resultado && <span className="block text-[10px] font-normal text-marmol-400">predijo {tarjeta.prediccion}</span>}
                      </td>
                      {ronda > 1 && (
                        <td className="py-2">
                          {tarjeta ? (
                            <select
                              value={tarjeta.decision ?? ''}
                              disabled={pending}
                              onChange={(ev) => ejecutar(() => decidirTarjeta(sesion.id, e.id, ronda, (ev.target.value || null) as 'estandar' | 'descartada' | null))}
                              className="rounded border border-marmol-200 bg-white px-1 py-0.5 text-xs"
                            >
                              <option value="">Sin decidir</option>
                              <option value="estandar">⭐ Estándar</option>
                              <option value="descartada">🗑️ Descartada</option>
                            </select>
                          ) : (
                            <span className="text-marmol-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-marmol-400">Puedes corregir el conteo de cualquier equipo: escribe los números y toca ✓.</p>
        </div>
      )}
    </div>
  );
}
