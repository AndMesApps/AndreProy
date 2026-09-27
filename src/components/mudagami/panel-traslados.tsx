'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { eliminarUltimoTraslado, registrarTraslado } from '@/app/mudagami/actions';
import { calcularTabla1, formatearPesos, MEDIOS_TRANSPORTE, type MedioTransporte, type TrasladoMinimo } from '@/lib/mudagami';
import { cn } from '@/lib/utils';
import { Undo2 } from 'lucide-react';
import { MedioIcono } from './iconos';

/**
 * El "Formato de medición de transportes" (Tabla 1) de los materiales
 * originales, en vivo: cada vez que el equipo mueve algo entre estaciones no
 * contiguas, registra aquí el viaje (montacargas o carretilla) y la tabla se
 * actualiza sola con el número de traslados, el tiempo y el costo.
 */
export function PanelTraslados({
  retoId,
  equipoId,
  traslados,
  puedeRegistrar,
}: {
  retoId: string;
  equipoId: string;
  traslados: TrasladoMinimo[];
  puedeRegistrar: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [articulos, setArticulos] = useState(3);
  const [error, setError] = useState<string | null>(null);

  const tabla = calcularTabla1(traslados);
  const total = traslados.length;

  const ejecutar = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? 'Error');
      router.refresh();
    });
  };

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-display font-semibold text-secundario">📋 Tabla 1 · Medición de transportes</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[22rem] text-sm">
          <thead className="text-left text-xs text-marmol-400">
            <tr>
              <th className="py-1 font-medium">&nbsp;</th>
              {(Object.keys(MEDIOS_TRANSPORTE) as MedioTransporte[]).map((m) => (
                <th key={m} className="py-1 pl-2 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <MedioIcono medio={m} size={18} /> {MEDIOS_TRANSPORTE[m].nombre}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-marmol-100">
              <td className="py-1.5 text-xs text-marmol-500">Traslados</td>
              {(Object.keys(MEDIOS_TRANSPORTE) as MedioTransporte[]).map((m) => (
                <td key={m} className="py-1.5 pl-2 font-semibold text-marmol-800">
                  {tabla.traslados[m]}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-marmol-50 px-2 py-2">
          <p className="font-display text-lg font-bold text-secundario">{total}</p>
          <p className="text-[10px] text-marmol-400">traslados</p>
        </div>
        <div className="rounded-lg bg-marmol-50 px-2 py-2">
          <p className="font-display text-lg font-bold text-secundario">{tabla.tiempoMin}</p>
          <p className="text-[10px] text-marmol-400">min en total</p>
        </div>
        <div className="rounded-lg bg-marmol-50 px-2 py-2">
          <p className="font-display text-lg font-bold text-secundario">{formatearPesos(tabla.costo)}</p>
          <p className="text-[10px] text-marmol-400">costo</p>
        </div>
      </div>

      {puedeRegistrar && (
        <div className="space-y-2 border-t border-marmol-100 pt-3">
          <p className="text-xs text-marmol-500">Cada vez que muevan algo entre estaciones que no quedan una al lado de la otra, registren el viaje aquí.</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => ejecutar(() => registrarTraslado({ retoId, equipoId, medio: 'carretilla', articulos: 1 }))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-marmol-600 hover:bg-marmol-700 disabled:opacity-40 px-3 py-2 text-sm font-medium text-white"
            >
              <MedioIcono medio="carretilla" size={20} /> + Carretilla (1)
            </button>
            <div className="inline-flex items-center gap-1 rounded-lg bg-medio px-2 py-1">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setArticulos(n)}
                  className={cn('h-6 w-6 rounded text-xs font-semibold', articulos === n ? 'bg-white text-medio' : 'text-white/80 hover:bg-white/20')}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => ejecutar(() => registrarTraslado({ retoId, equipoId, medio: 'montacargas', articulos }))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-medio hover:bg-amber-800 disabled:opacity-40 px-3 py-2 text-sm font-medium text-white"
            >
              <MedioIcono medio="montacargas" size={20} /> + Montacargas ({articulos})
            </button>
            {total > 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={() => ejecutar(() => eliminarUltimoTraslado(retoId, equipoId))}
                className="ml-auto inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-bajo"
                title="Deshacer el último traslado"
              >
                <Undo2 size={13} /> Deshacer
              </button>
            )}
          </div>
        </div>
      )}
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}
