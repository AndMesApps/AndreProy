'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarSesion, crearSesion, eliminarSesion } from '@/app/mudalab/actions';
import { Pencil, Plus, Trash2 } from 'lucide-react';

/** Crea un caso MudaLab o edita el existente (con opción de eliminarlo). */
export function FormularioCaso({ sesionId, inicial }: { sesionId?: string; inicial?: { titulo: string; descripcion: string } }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [d, setD] = useState(inicial ?? { titulo: '', descripcion: '' });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [borrar, setBorrar] = useState(false);

  const guardar = () =>
    startTransition(async () => {
      setError(null);
      const input = { titulo: d.titulo, descripcion: d.descripcion || undefined };
      const r = sesionId ? await actualizarSesion(sesionId, input) : await crearSesion(input);
      if (!r.ok) return setError(r.error);
      setAbierto(false);
      if (!sesionId && 'id' in r) router.push(`/mudalab/${r.id}`);
      else router.refresh();
    });

  if (!abierto) {
    return sesionId ? (
      <span className="inline-flex flex-wrap items-center gap-3 text-xs">
        <button type="button" onClick={() => setAbierto(true)} className="inline-flex items-center gap-1 text-marmol-500 hover:text-marca-600">
          <Pencil size={12} /> Editar datos del caso
        </button>
        {borrar ? (
          <span className="inline-flex items-center gap-2">
            <span className="text-bajo">¿Eliminar el caso con sus equipos, jugadas y Banco de oportunidades?</span>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await eliminarSesion(sesionId);
                  if (r.ok) router.push('/mudalab');
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
            <Trash2 size={12} /> Eliminar caso
          </button>
        )}
      </span>
    ) : (
      <button type="button" onClick={() => setAbierto(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-secundario shadow hover:bg-marca-50">
        <Plus size={16} /> Nuevo caso MudaLab
      </button>
    );
  }

  return (
    <div className="card max-w-xl space-y-3 p-4 text-left">
      <h3 className="font-display font-semibold text-secundario">{sesionId ? 'Editar caso' : 'Nuevo caso MudaLab'}</h3>
      <input value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} placeholder="Ej. MudaLab · Equipo administrativo" className="campo" />
      <textarea value={d.descripcion} onChange={(e) => setD({ ...d, descripcion: e.target.value })} rows={2} placeholder="Mensaje para las agencias (opcional)" className="campo" />
      <p className="text-xs text-marmol-500">Expediente: 📁 «La compra que tardaba 5 días» (12 pasos reales, 8 Mudas escondidas).</p>
      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={pending || !d.titulo.trim()} onClick={guardar} className="boton">
          {pending ? 'Guardando…' : sesionId ? 'Guardar' : 'Crear caso'}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="boton-secundario">
          Cancelar
        </button>
      </div>
    </div>
  );
}
