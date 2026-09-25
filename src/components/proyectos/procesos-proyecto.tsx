'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { vincularProceso } from '@/app/proyectos/actions';
import { SEMAFOROS, formatearValor, type Semaforo } from '@/lib/procesos';
import { cn } from '@/lib/utils';
import { Link2, Unlink } from 'lucide-react';
import { FormularioProceso } from '@/components/procesos/formulario-proceso';

export interface ProcesoDelProyecto {
  id: string;
  nombre: string;
  indicador: string;
  unidad: string;
  meta: number | null;
  ultima: number | null;
  semaforo: Semaforo;
  accionesAbiertas: number;
  juegos: number;
}

/** Procesos del cliente que se mejoran en el proyecto (del Control de procesos). */
export function ProcesosProyecto({
  proyectoId,
  cliente,
  procesos,
  libres,
}: {
  proyectoId: string;
  cliente: string;
  procesos: ProcesoDelProyecto[];
  libres: { id: string; nombre: string; cliente: string | null }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [elegido, setElegido] = useState('');
  const [error, setError] = useState<string | null>(null);

  const vincular = (procesoId: string, unir: boolean) =>
    startTransition(async () => {
      setError(null);
      const res = await vincularProceso(proyectoId, procesoId, unir);
      if (!res.ok) return setError(res.error);
      setElegido('');
      router.refresh();
    });

  return (
    <div className="space-y-3">
      {procesos.length === 0 ? (
        <p className="rounded-lg bg-marmol-50 p-4 text-sm text-marmol-500">
          Aún no hay procesos en este proyecto. Crea los procesos del cliente que se van a mejorar: cada uno lleva su indicador, su meta, su plan de acción y los
          juegos (Makigami y Kaizen) que se hagan sobre él.
        </p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {procesos.map((p) => (
            <div key={p.id} className="flex items-start gap-2 rounded-xl border border-marmol-200 p-3 text-sm">
              <span title={SEMAFOROS[p.semaforo].nombre}>{SEMAFOROS[p.semaforo].emoji}</span>
              <div className="min-w-0 flex-1">
                <Link href={`/procesos/${p.id}`} className="font-semibold text-marmol-800 hover:text-secundario">
                  {p.nombre}
                </Link>
                <p className="text-xs text-marmol-500">
                  {p.indicador}: <strong>{formatearValor(p.ultima, p.unidad)}</strong>
                  {p.meta != null && ` · meta ${formatearValor(p.meta, p.unidad)}`}
                </p>
                <p className="text-[11px] text-marmol-400">
                  📋 {p.accionesAbiertas} acciones abiertas · 🎲 {p.juegos} {p.juegos === 1 ? 'juego' : 'juegos'}
                </p>
              </div>
              <button type="button" disabled={pending} onClick={() => vincular(p.id, false)} className="no-imprimir text-marmol-300 hover:text-bajo" title="Sacar del proyecto">
                <Unlink size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="no-imprimir flex flex-wrap items-center gap-2">
        <FormularioProceso proyectoId={proyectoId} textoBoton="Nuevo proceso del proyecto" datosIniciales={undefined} />
        {libres.length > 0 && (
          <>
            <select value={elegido} onChange={(e) => setElegido(e.target.value)} className={cn('campo w-auto max-w-xs py-1.5 text-xs')} aria-label="Proceso existente">
              <option value="">Unir un proceso que ya existe…</option>
              {libres.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                  {p.cliente ? ` · ${p.cliente}` : ''}
                  {p.cliente && p.cliente.toLowerCase() === cliente.toLowerCase() ? ' ★' : ''}
                </option>
              ))}
            </select>
            <button type="button" disabled={pending || !elegido} onClick={() => vincular(elegido, true)} className="boton-secundario py-1.5 text-xs">
              <Link2 size={13} /> Unir
            </button>
          </>
        )}
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}
