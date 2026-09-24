'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { eliminarSesion } from '@/app/kaizen/actions';
import { Trash2 } from 'lucide-react';

/** Elimina la carrera con todo (pide confirmación en la misma pantalla). */
export function EliminarSesion({ sesionId }: { sesionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirmando) {
    return (
      <button type="button" onClick={() => setConfirmando(true)} className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-bajo">
        <Trash2 size={12} /> Eliminar carrera
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-xs">
      <span className="text-bajo">¿Eliminar la carrera con sus equipos, tarjetas y resultados?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await eliminarSesion(sesionId);
            if (!res.ok) return setError(res.error);
            router.push('/kaizen');
          })
        }
        className="font-semibold text-bajo"
      >
        Sí, eliminar
      </button>
      <button type="button" onClick={() => setConfirmando(false)} className="text-marmol-500">
        No
      </button>
      {error && <span className="text-bajo">{error}</span>}
    </span>
  );
}
