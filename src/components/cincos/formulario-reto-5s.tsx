'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarSesion, crearSesion, eliminarSesion } from '@/app/cincos/actions';
import { ESCENARIOS, type ClaveEscenario } from '@/lib/cincos';
import { cn } from '@/lib/utils';
import { Pencil, Plus, Trash2 } from 'lucide-react';

/** Crea un Reto 5S o edita el existente (con opción de eliminarlo). */
export function FormularioReto5S({ sesionId, inicial }: { sesionId?: string; inicial?: { titulo: string; descripcion: string; escenario: ClaveEscenario } }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [d, setD] = useState(inicial ?? { titulo: '', descripcion: '', escenario: 'oficina' as ClaveEscenario });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [borrar, setBorrar] = useState(false);

  const guardar = () =>
    startTransition(async () => {
      setError(null);
      const input = { titulo: d.titulo, descripcion: d.descripcion || undefined, escenario: d.escenario };
      const r = sesionId ? await actualizarSesion(sesionId, input) : await crearSesion(input);
      if (!r.ok) return setError(r.error);
      setAbierto(false);
      if (!sesionId && 'id' in r) router.push(`/cincos/${r.id}`);
      else router.refresh();
    });

  if (!abierto) {
    return sesionId ? (
      <span className="inline-flex flex-wrap items-center gap-3 text-xs">
        <button type="button" onClick={() => setAbierto(true)} className="inline-flex items-center gap-1 text-marmol-500 hover:text-marca-600">
          <Pencil size={12} /> Editar datos del reto
        </button>
        {borrar ? (
          <span className="inline-flex items-center gap-2">
            <span className="text-bajo">¿Eliminar el reto con sus equipos, jugadas y misiones reales?</span>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await eliminarSesion(sesionId);
                  if (r.ok) router.push('/cincos');
                })
              }
              className="font-semibold text-bajo"
            >
              Sí, eliminar
            </button>
            <button type="button" onClick={() => setBorrar(false)} className="text-marmol-500">
              No
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setBorrar(true)} className="inline-flex items-center gap-1 text-marmol-400 hover:text-bajo">
            <Trash2 size={12} /> Eliminar reto
          </button>
        )}
      </span>
    ) : (
      <button type="button" onClick={() => setAbierto(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-secundario shadow hover:bg-marca-50">
        <Plus size={16} /> Nuevo Reto 5S
      </button>
    );
  }

  return (
    <div className="card max-w-xl space-y-3 p-4 text-left">
      <h3 className="font-display font-semibold text-secundario">{sesionId ? 'Editar reto' : 'Nuevo Reto 5S'}</h3>
      <input value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} placeholder="Ej. Reto 5S · Equipo de Compras" className="campo" />
      <textarea value={d.descripcion} onChange={(e) => setD({ ...d, descripcion: e.target.value })} rows={2} placeholder="Mensaje para los equipos (opcional)" className="campo" />
      <p className="text-xs font-medium text-marmol-500">Escenario de la simulación</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {(Object.keys(ESCENARIOS) as ClaveEscenario[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setD({ ...d, escenario: k })}
            className={cn('rounded-xl border-2 p-3 text-left text-xs', d.escenario === k ? 'border-marca-500 bg-marca-50' : 'border-marmol-200 hover:border-marca-300')}
          >
            <span className="block text-sm font-semibold text-marmol-800">
              {ESCENARIOS[k].emoji} {ESCENARIOS[k].nombre}
            </span>
            <span className="text-marmol-500">{ESCENARIOS[k].descripcion}</span>
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={pending || !d.titulo.trim()} onClick={guardar} className="boton">
          {pending ? 'Guardando…' : sesionId ? 'Guardar' : 'Crear reto'}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="boton-secundario">
          Cancelar
        </button>
      </div>
    </div>
  );
}
