'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { eliminarPaso, guardarPaso, moverPaso } from '@/app/makigami/actions';
import { CLASIFICACIONES, descomponerMinutos, type Clasificacion } from '@/lib/makigami';
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { EntradaDuracion, aMinutos, type Duracion } from './entrada-duracion';
import type { CarrilVista, PasoVista } from './tipos';

/**
 * Crea o edita un paso del mapa (facilitador, fase de mapeo). Para un paso
 * nuevo recibe el carril sugerido y la posición donde insertarlo.
 */
export function FormularioPaso({
  retoId,
  carriles,
  paso,
  carrilInicial,
  posicion,
  totalPasos,
  onListo,
}: {
  retoId: string;
  carriles: CarrilVista[];
  paso?: PasoVista;
  carrilInicial?: string;
  posicion?: number;
  totalPasos: number;
  onListo: (accion: 'guardado' | 'eliminado' | 'cancelado') => void;
}) {
  const router = useRouter();
  const [carrilId, setCarrilId] = useState(paso?.carril_id ?? carrilInicial ?? carriles[0]?.id ?? '');
  const [descripcion, setDescripcion] = useState(paso?.descripcion ?? '');
  const [trabajo, setTrabajo] = useState<Duracion>(descomponerMinutos(paso?.tiempo_trabajo_min ?? 0));
  const [espera, setEspera] = useState<Duracion>(descomponerMinutos(paso?.tiempo_espera_min ?? 0));
  const [documento, setDocumento] = useState(paso?.documento_sistema ?? '');
  const [clasificacion, setClasificacion] = useState<Clasificacion | ''>(paso?.clasificacion ?? '');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ejecutar = (fn: () => Promise<{ ok: boolean; error?: string }>, accion: 'guardado' | 'eliminado' | null) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? 'Error');
      router.refresh();
      if (accion) onListo(accion);
    });
  };

  const guardar = () =>
    ejecutar(
      () =>
        guardarPaso({
          retoId,
          id: paso?.id,
          carrilId,
          descripcion,
          tiempoTrabajoMin: aMinutos(trabajo),
          tiempoEsperaMin: aMinutos(espera),
          documentoSistema: documento || undefined,
          clasificacion: clasificacion || null,
          posicion,
        }),
      'guardado'
    );

  const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm text-marmol-900';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-secundario">
          {paso ? `Paso ${paso.orden}` : `Nuevo paso${posicion ? ` (posición ${posicion})` : ''}`}
        </h3>
        {paso && (
          <div className="flex gap-1">
            <button
              type="button"
              disabled={pending || paso.orden <= 1}
              onClick={() => ejecutar(() => moverPaso(retoId, paso.id, -1), null)}
              className="rounded border border-marmol-200 p-1 text-marmol-500 hover:text-marca-600 disabled:opacity-30"
              title="Mover antes"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              type="button"
              disabled={pending || paso.orden >= totalPasos}
              onClick={() => ejecutar(() => moverPaso(retoId, paso.id, 1), null)}
              className="rounded border border-marmol-200 p-1 text-marmol-500 hover:text-marca-600 disabled:opacity-30"
              title="Mover después"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      <label className="block text-xs text-marmol-500">
        ¿Quién lo hace?
        <select value={carrilId} onChange={(e) => setCarrilId(e.target.value)} className={`${campo} mt-1`}>
          {carriles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-marmol-500">
        ¿Qué hace? (verbo + objeto)
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className={`${campo} mt-1`} placeholder="Ej. Revisa la solicitud y la firma" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <EntradaDuracion etiqueta="⚙️ Tiempo de trabajo" valor={trabajo} onChange={setTrabajo} />
        <EntradaDuracion etiqueta="⏳ Espera antes del siguiente" valor={espera} onChange={setEspera} />
      </div>
      <label className="block text-xs text-marmol-500">
        Documento o sistema que usa
        <input value={documento} onChange={(e) => setDocumento(e.target.value)} className={`${campo} mt-1`} placeholder="Ej. Excel + correo, firma física, ERP…" />
      </label>
      <label className="block text-xs text-marmol-500">
        Clasificación Lean
        <select value={clasificacion} onChange={(e) => setClasificacion(e.target.value as Clasificacion | '')} className={`${campo} mt-1`}>
          <option value="">Sin clasificar (cuenta como necesaria)</option>
          {(Object.keys(CLASIFICACIONES) as Clasificacion[]).map((k) => (
            <option key={k} value={k}>
              {CLASIFICACIONES[k].corto} · {CLASIFICACIONES[k].nombre}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || !descripcion.trim() || !carrilId}
          onClick={guardar}
          className="rounded-lg bg-marca-500 hover:bg-marca-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Guardando…' : paso ? 'Guardar' : 'Agregar paso'}
        </button>
        <button type="button" onClick={() => onListo('cancelado')} className="rounded-lg border border-marmol-200 text-marmol-500 text-sm font-medium px-3 py-2">
          Cerrar
        </button>
        {paso && (
          <button
            type="button"
            disabled={pending}
            onClick={() => ejecutar(() => eliminarPaso(retoId, paso.id), 'eliminado')}
            className="ml-auto inline-flex items-center gap-1 rounded-lg text-bajo text-sm px-2 py-2 hover:bg-red-50"
          >
            <Trash2 size={14} /> Eliminar
          </button>
        )}
      </div>
    </div>
  );
}
