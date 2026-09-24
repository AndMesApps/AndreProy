'use client';

import { useEffect, useState } from 'react';
import { formatearReloj } from '@/lib/kaizen';
import { cn } from '@/lib/utils';

/**
 * Cuenta regresiva de la fase Hacer. El inicio viene del servidor; se corrige
 * la diferencia entre el reloj del servidor y el del celular (`desfaseMs`)
 * para que todos los equipos vean el mismo tiempo.
 */
export function Cronometro({
  inicio,
  duracionSeg,
  desfaseMs,
  grande = false,
}: {
  inicio: string | null;
  duracionSeg: number;
  desfaseMs: number;
  grande?: boolean;
}) {
  const [ahora, setAhora] = useState(() => Date.now() + desfaseMs);

  useEffect(() => {
    if (!inicio) return;
    const t = setInterval(() => setAhora(Date.now() + desfaseMs), 250);
    return () => clearInterval(t);
  }, [inicio, desfaseMs]);

  const restante = inicio ? duracionSeg - (ahora - new Date(inicio).getTime()) / 1000 : duracionSeg;
  const termino = Boolean(inicio) && restante <= 0;
  const avance = inicio ? Math.min(1, Math.max(0, 1 - restante / duracionSeg)) : 0;
  const urgente = Boolean(inicio) && !termino && restante <= 10;

  return (
    <div className={cn('text-center', grande ? 'py-2' : '')} role="timer" aria-live={termino ? 'assertive' : 'off'}>
      <p
        className={cn(
          'font-display font-bold tabular-nums',
          grande ? 'text-6xl sm:text-7xl' : 'text-3xl',
          termino ? 'text-bajo' : urgente ? 'animate-pulse text-medio' : inicio ? 'text-secundario' : 'text-marmol-400',
        )}
      >
        {termino ? '¡Tiempo!' : formatearReloj(restante)}
      </p>
      <div className={cn('mx-auto mt-2 h-2 overflow-hidden rounded-full bg-marmol-200', grande ? 'max-w-md' : 'max-w-[10rem]')}>
        <div className={cn('h-full rounded-full transition-[width] duration-300', termino ? 'bg-bajo' : 'bg-marca-500')} style={{ width: `${avance * 100}%` }} />
      </div>
      <p className="mt-1 text-xs text-marmol-500">
        {!inicio ? 'Esperando a que el facilitador inicie el cronómetro…' : termino ? 'Dejen de producir: a contar.' : 'Produciendo…'}
      </p>
    </div>
  );
}
