'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { crearReto, actualizarReto } from '@/app/mudagami/actions';
import { Pencil, Plus } from 'lucide-react';

interface DatosReto {
  titulo: string;
  descripcion: string;
  fechaLimite: string;
  duracionCorridaMin: number;
  duracionRedisenoMin: number;
}

const VACIO: DatosReto = { titulo: '', descripcion: '', fechaLimite: '', duracionCorridaMin: 10, duracionRedisenoMin: 4 };

/** Crea un reto nuevo, o edita uno existente si recibe retoId + datosIniciales. */
export function FormularioReto({ retoId, datosIniciales }: { retoId?: string; datosIniciales?: DatosReto }) {
  const router = useRouter();
  const esEdicion = Boolean(retoId);
  const [mostrar, setMostrar] = useState(false);
  const [datos, setDatos] = useState<DatosReto>(datosIniciales ?? VACIO);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const set = (campo: keyof DatosReto) => (e: { target: { value: string } }) => setDatos((d) => ({ ...d, [campo]: e.target.value }) as DatosReto);
  const setNum = (campo: 'duracionCorridaMin' | 'duracionRedisenoMin') => (e: { target: { value: string } }) =>
    setDatos((d) => ({ ...d, [campo]: Number(e.target.value) || 0 }));

  function guardar() {
    setError(null);
    const input = {
      titulo: datos.titulo,
      descripcion: datos.descripcion || undefined,
      fechaLimite: datos.fechaLimite || undefined,
      duracionCorridaSeg: Math.max(60, datos.duracionCorridaMin * 60),
      duracionRedisenoSeg: Math.max(60, datos.duracionRedisenoMin * 60),
    };
    startTransition(async () => {
      const res = retoId ? await actualizarReto(retoId, input) : await crearReto(input);
      if (!res.ok) return setError(res.error);
      setMostrar(false);
      if (!retoId && 'id' in res) router.push(`/mudagami/${res.id}`);
      else router.refresh();
    });
  }

  if (!mostrar) {
    return esEdicion ? (
      <button type="button" onClick={() => setMostrar(true)} className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
        <Pencil size={12} /> Editar datos del reto
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setMostrar(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white text-secundario hover:bg-marca-50 text-sm font-semibold px-4 py-2 shadow transition"
      >
        <Plus size={16} /> Nuevo reto
      </button>
    );
  }

  const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm text-marmol-900 bg-white';

  return (
    <div className="card p-4 space-y-3 max-w-lg text-left">
      <h3 className="font-display font-semibold text-secundario">{esEdicion ? 'Editar reto' : 'Nuevo reto MudaGami'}</h3>
      <input type="text" placeholder="Título del reto (ej. Taller de mudas — sede norte)" value={datos.titulo} onChange={set('titulo')} className={campo} />
      <textarea placeholder="¿Qué buscamos con este taller? (opcional)" value={datos.descripcion} onChange={set('descripcion')} rows={2} className={campo} />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-marmol-500">
          Minutos por corrida
          <input type="number" min={1} value={datos.duracionCorridaMin} onChange={setNum('duracionCorridaMin')} className={`${campo} mt-1`} />
        </label>
        <label className="text-xs text-marmol-500">
          Minutos para el rediseño
          <input type="number" min={1} value={datos.duracionRedisenoMin} onChange={setNum('duracionRedisenoMin')} className={`${campo} mt-1`} />
        </label>
      </div>
      <label className="block text-xs text-marmol-500">
        Fecha límite del taller (opcional)
        <input type="date" value={datos.fechaLimite} onChange={set('fechaLimite')} className={`${campo} mt-1`} />
      </label>
      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !datos.titulo.trim()}
          onClick={guardar}
          className="rounded-lg bg-marca-500 hover:bg-marca-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Guardando…' : esEdicion ? 'Guardar' : 'Crear reto'}
        </button>
        <button type="button" onClick={() => setMostrar(false)} className="rounded-lg border border-marmol-200 text-marmol-500 text-sm font-medium px-4 py-2 transition">
          Cancelar
        </button>
      </div>
    </div>
  );
}
