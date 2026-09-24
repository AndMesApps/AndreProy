'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cambiarEstadoReto, eliminarReto } from '@/app/makigami/actions';
import { ETAPAS_RETO, type EstadoReto } from '@/lib/makigami';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

const TEXTO_AVANZAR: Record<EstadoReto, string> = {
  mapeo: '🎯 Abrir la cacería',
  caceria: '💡 Cerrar cacería y pasar a Rediseño',
  rediseno: '🎉 Cerrar el reto y publicar resultados',
  cerrado: '',
};

const CONFIRMAR_AVANZAR: Record<EstadoReto, string> = {
  mapeo: 'Los jugadores podrán empezar a cazar desperdicios. El mapa ya no se podrá editar (salvo que regreses a Mapeo).',
  caceria: 'Se cierran las cazas (sus puntos quedan fijos). Luego todos podrán proponer y votar mejoras.',
  rediseno: 'Se cierran propuestas y votos, y se muestran los resultados finales: el antes vs. después del proceso y el ranking de equipos.',
  cerrado: '',
};

/** Línea de tiempo del reto + controles del facilitador para moverlo de fase. */
export function EtapasReto({ retoId, estado, esFacilitador }: { retoId: string; estado: EstadoReto; esFacilitador: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<'avanzar' | 'eliminar' | null>(null);
  const idx = ETAPAS_RETO.findIndex((e) => e.estado === estado);
  const siguiente = ETAPAS_RETO[idx + 1]?.estado;
  const anterior = ETAPAS_RETO[idx - 1]?.estado;

  const mover = (destino: EstadoReto) => {
    setError(null);
    startTransition(async () => {
      const res = await cambiarEstadoReto(retoId, destino);
      setConfirmando(null);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  };

  return (
    <div className="card p-4 space-y-3">
      <ol className="grid grid-cols-4 gap-1">
        {ETAPAS_RETO.map((e, i) => (
          <li key={e.estado} className="min-w-0">
            <div className={cn('h-1.5 rounded-full', i < idx ? 'bg-marca-500' : i === idx ? 'bg-degradado animate-pulse' : 'bg-marmol-200')} />
            <p className={cn('mt-1.5 text-xs font-semibold', i === idx ? 'text-secundario' : i < idx ? 'text-marca-700' : 'text-marmol-400')}>
              {i + 1}. {e.titulo}
            </p>
            <p className="hidden sm:block text-[11px] leading-tight text-marmol-400">{e.descripcion}</p>
          </li>
        ))}
      </ol>

      {esFacilitador && (
        <div className="flex flex-wrap items-center gap-2 border-t border-marmol-100 pt-3">
          {confirmando === 'avanzar' && siguiente ? (
            <div className="w-full rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-marmol-700">
              <p>{CONFIRMAR_AVANZAR[estado]}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" disabled={pending} onClick={() => mover(siguiente)} className="rounded-lg bg-marca-500 hover:bg-marca-600 text-white text-sm font-medium px-3 py-1.5">
                  {pending ? 'Un momento…' : 'Sí, continuar'}
                </button>
                <button type="button" onClick={() => setConfirmando(null)} className="rounded-lg border border-marmol-200 text-marmol-500 text-sm px-3 py-1.5">
                  Cancelar
                </button>
              </div>
            </div>
          ) : confirmando === 'eliminar' ? (
            <div className="w-full rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-marmol-700">
              <p>Se eliminará el reto con su mapa, equipos, jugadores, cazas y propuestas. No se puede deshacer.</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await eliminarReto(retoId);
                      if (!res.ok) return setError(res.error);
                      router.push('/makigami');
                    })
                  }
                  className="rounded-lg bg-bajo text-white text-sm font-medium px-3 py-1.5"
                >
                  Eliminar reto
                </button>
                <button type="button" onClick={() => setConfirmando(null)} className="rounded-lg border border-marmol-200 text-marmol-500 text-sm px-3 py-1.5">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              {anterior && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => mover(anterior)}
                  className="inline-flex items-center gap-0.5 rounded-lg border border-marmol-200 text-marmol-500 text-sm px-3 py-1.5 hover:text-secundario"
                >
                  <ChevronLeft size={14} /> Volver a {ETAPAS_RETO[idx - 1]?.titulo}
                </button>
              )}
              {siguiente && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setConfirmando('avanzar')}
                  className="inline-flex items-center gap-1 rounded-lg bg-marca-500 hover:bg-marca-600 text-white text-sm font-semibold px-4 py-1.5 shadow-sm"
                >
                  {TEXTO_AVANZAR[estado]} <ChevronRight size={14} />
                </button>
              )}
              <button type="button" onClick={() => setConfirmando('eliminar')} className="ml-auto p-1.5 text-marmol-300 hover:text-bajo" title="Eliminar reto">
                <Trash2 size={15} />
              </button>
            </>
          )}
          {error && <p className="w-full text-sm text-bajo">{error}</p>}
        </div>
      )}
    </div>
  );
}
