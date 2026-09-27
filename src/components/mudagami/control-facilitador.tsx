'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cambiarEstadoReto, controlarCronometro, eliminarReto } from '@/app/mudagami/actions';
import { calcularTabla1, ETAPAS_RETO, formatearPesos, minimoTraslados, LAYOUT_INICIAL, type EstadoReto, type Layout, type TrasladoMinimo } from '@/lib/mudagami';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Play, RotateCcw, Square, Trash2 } from 'lucide-react';
import type { EquipoVista } from './tipos';

const TEXTO_AVANZAR: Record<EstadoReto, string> = {
  espera: '🚚 Empezar: Corrida 1 (línea base)',
  corrida_1: '🧭 Cerrar corrida 1 y pasar a Rediseño',
  rediseno: '🚚 Empezar Corrida 2 con el diseño de cada equipo',
  corrida_2: '🎉 Cerrar el reto y publicar resultados',
  cerrado: '',
};

const CONFIRMAR_AVANZAR: Record<EstadoReto, string> = {
  espera: 'Todos van a producir con el diseño de planta inicial (igual para todos). Prepara los materiales físicos.',
  corrida_1: 'Se cierra el conteo de la corrida 1. Cada equipo tendrá 4 minutos (o los que definas) para rediseñar su propia planta.',
  rediseno: 'Se guarda el diseño que cada equipo dejó. Empieza la segunda producción, ya con esos diseños.',
  corrida_2: 'Se cierra el conteo y se muestran los resultados: traslados, tiempo y costo, antes vs. después, por equipo.',
  cerrado: '',
};

export function ControlFacilitador({
  reto,
  equipos,
  layouts,
  traslados,
}: {
  reto: { id: string; estado: EstadoReto; cronometroInicio: string | null };
  equipos: EquipoVista[];
  layouts: Map<string, Layout>;
  traslados: Map<string, TrasladoMinimo[]>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmarAvanzar, setConfirmarAvanzar] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  const idx = ETAPAS_RETO.findIndex((e) => e.estado === reto.estado);
  const siguiente = ETAPAS_RETO[idx + 1]?.estado;
  const anterior = ETAPAS_RETO[idx - 1]?.estado;
  const corridaActual = reto.estado === 'corrida_1' ? 1 : reto.estado === 'corrida_2' ? 2 : null;

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
    if (!siguiente) return;
    if (!confirmarAvanzar) return setConfirmarAvanzar(true);
    ejecutar(() => cambiarEstadoReto(reto.id, siguiente), () => setConfirmarAvanzar(false));
  };

  return (
    <div className="card space-y-4 p-4">
      <ol className="grid grid-cols-5 gap-1">
        {ETAPAS_RETO.map((e, i) => (
          <li key={e.estado} className="min-w-0">
            <div className={cn('h-1.5 rounded-full', i < idx ? 'bg-marca-500' : i === idx ? 'bg-degradado animate-pulse' : 'bg-marmol-200')} />
            <p className={cn('mt-1.5 text-[11px] font-semibold leading-tight', i === idx ? 'text-secundario' : i < idx ? 'text-marca-700' : 'text-marmol-400')}>{e.titulo}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display font-semibold text-secundario">🎛️ Mando del facilitador</span>
        {corridaActual && (
          <div className="flex flex-wrap gap-1.5 sm:ml-auto">
            {!reto.cronometroInicio ? (
              <button type="button" disabled={pending} onClick={() => ejecutar(() => controlarCronometro(reto.id))} className="boton bg-acento px-3 py-1.5 text-secundario hover:bg-amber-300">
                <Play size={14} /> Iniciar cronómetro
              </button>
            ) : (
              <>
                <button type="button" disabled={pending} onClick={() => ejecutar(() => controlarCronometro(reto.id))} className="boton-secundario px-3 py-1.5 text-xs">
                  <RotateCcw size={13} /> Reiniciar
                </button>
                <button type="button" disabled={pending} onClick={() => ejecutar(() => controlarCronometro(reto.id, true))} className="boton-secundario px-3 py-1.5 text-xs">
                  <Square size={13} /> Detener
                </button>
              </>
            )}
          </div>
        )}
        {reto.estado === 'rediseno' && (
          <div className="flex flex-wrap gap-1.5 sm:ml-auto">
            {!reto.cronometroInicio ? (
              <button type="button" disabled={pending} onClick={() => ejecutar(() => controlarCronometro(reto.id))} className="boton bg-acento px-3 py-1.5 text-secundario hover:bg-amber-300">
                <Play size={14} /> Iniciar los 4 minutos
              </button>
            ) : (
              <button type="button" disabled={pending} onClick={() => ejecutar(() => controlarCronometro(reto.id, true))} className="boton-secundario px-3 py-1.5 text-xs">
                <Square size={13} /> Detener
              </button>
            )}
          </div>
        )}
      </div>

      {confirmarAvanzar && siguiente ? (
        <div className="w-full rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-marmol-700">
          <p>{CONFIRMAR_AVANZAR[reto.estado]}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={pending} onClick={avanzar} className="rounded-lg bg-marca-500 hover:bg-marca-600 text-white text-sm font-medium px-3 py-1.5">
              {pending ? 'Un momento…' : 'Sí, continuar'}
            </button>
            <button type="button" onClick={() => setConfirmarAvanzar(false)} className="rounded-lg border border-marmol-200 text-marmol-500 text-sm px-3 py-1.5">
              Cancelar
            </button>
          </div>
        </div>
      ) : confirmarEliminar ? (
        <div className="w-full rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-marmol-700">
          <p>Se eliminará el reto con sus equipos, jugadores, diseños y traslados. No se puede deshacer.</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await eliminarReto(reto.id);
                  if (!res.ok) return setError(res.error);
                  router.push('/mudagami');
                })
              }
              className="rounded-lg bg-bajo text-white text-sm font-medium px-3 py-1.5"
            >
              Eliminar reto
            </button>
            <button type="button" onClick={() => setConfirmarEliminar(false)} className="rounded-lg border border-marmol-200 text-marmol-500 text-sm px-3 py-1.5">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {anterior && (
            <button type="button" disabled={pending} onClick={() => ejecutar(() => cambiarEstadoReto(reto.id, anterior))} className="inline-flex items-center gap-0.5 rounded-lg border border-marmol-200 text-marmol-500 text-sm px-3 py-1.5 hover:text-secundario">
              <ChevronLeft size={14} /> Atrás
            </button>
          )}
          {siguiente && (
            <button type="button" disabled={pending} onClick={avanzar} className="boton flex-1 sm:flex-none">
              {TEXTO_AVANZAR[reto.estado]} <ChevronRight size={15} />
            </button>
          )}
          <button type="button" onClick={() => setConfirmarEliminar(true)} className="ml-auto p-1.5 text-marmol-300 hover:text-bajo" title="Eliminar reto">
            <Trash2 size={15} />
          </button>
        </div>
      )}
      {error && <p className="text-sm text-bajo">{error}</p>}

      {equipos.length > 0 && reto.estado !== 'espera' && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] text-xs">
            <thead className="text-left text-marmol-400">
              <tr>
                <th className="py-1.5 font-medium">Equipo</th>
                <th className="font-medium">Corrida 1</th>
                <th className="font-medium">Diseño propio</th>
                <th className="font-medium">Corrida 2</th>
              </tr>
            </thead>
            <tbody>
              {equipos.map((e) => {
                const layout = layouts.get(e.id);
                const t1 = calcularTabla1(traslados.get(`${e.id}-1`) ?? []);
                const t2 = calcularTabla1(traslados.get(`${e.id}-2`) ?? []);
                return (
                  <tr key={e.id} className="border-t border-marmol-100">
                    <td className="py-1.5 pr-2 font-medium text-marmol-800">
                      {e.emoji} {e.nombre}
                    </td>
                    <td className="pr-2 text-marmol-600">{t1.tiempoMin} min · {formatearPesos(t1.costo)}</td>
                    <td className="pr-2 text-marmol-600">{layout ? `📐 mín. ${minimoTraslados(layout)}` : reto.estado === 'rediseno' ? 'en curso…' : `— (usará el inicial: mín. ${minimoTraslados(LAYOUT_INICIAL)})`}</td>
                    <td className="text-marmol-600">{reto.estado === 'corrida_2' || reto.estado === 'cerrado' ? `${t2.tiempoMin} min · ${formatearPesos(t2.costo)}` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
