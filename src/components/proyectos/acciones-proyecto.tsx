'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cambiarEstadoProyecto, eliminarProyecto } from '@/app/proyectos/actions';
import { ESTADOS_PROYECTO, type EstadoProyecto } from '@/lib/proyectos';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

/** Cambio rápido de estado del proyecto y borrado (con confirmación en la misma pantalla). */
export function AccionesProyecto({ proyectoId, estado }: { proyectoId: string; estado: EstadoProyecto }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmar, setConfirmar] = useState(false);

  return (
    <div className="no-imprimir flex flex-wrap items-center gap-3 text-xs">
      <select
        value={estado}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            await cambiarEstadoProyecto(proyectoId, e.target.value as EstadoProyecto);
            router.refresh();
          })
        }
        className={cn('rounded-full border-0 px-2.5 py-1 text-[11px] font-semibold', ESTADOS_PROYECTO[estado].clase)}
        aria-label="Estado del proyecto"
      >
        {(Object.keys(ESTADOS_PROYECTO) as EstadoProyecto[]).map((e) => (
          <option key={e} value={e}>
            {ESTADOS_PROYECTO[e].nombre}
          </option>
        ))}
      </select>
      {confirmar ? (
        <span className="inline-flex items-center gap-2">
          <span className="text-bajo">¿Borrar el proyecto con su cronograma, bitácora y registros?</span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await eliminarProyecto(proyectoId);
                if (res.ok) router.push('/proyectos');
              })
            }
            className="font-semibold text-bajo"
          >
            Sí, borrar
          </button>
          <button type="button" onClick={() => setConfirmar(false)} className="text-marmol-500">
            No
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setConfirmar(true)} className="inline-flex items-center gap-1 text-marmol-400 hover:text-bajo">
          <Trash2 size={12} /> Borrar proyecto
        </button>
      )}
    </div>
  );
}
