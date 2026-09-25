'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarSesion, crearSesion, eliminarSesion } from '@/app/riesgo/actions';
import { CONFIG_BASE, MARCOS, type Marco } from '@/lib/riesgo';
import { Pencil, Plus, Trash2 } from 'lucide-react';

interface Datos {
  titulo: string;
  descripcion: string;
  marco: Marco;
  responsable: string;
  canal: string;
  umbral: number;
}

const VACIO: Datos = { titulo: '', descripcion: '', marco: CONFIG_BASE.marco, responsable: CONFIG_BASE.responsable, canal: CONFIG_BASE.canal, umbral: CONFIG_BASE.umbral };

/** Crea una sesión de La Ruta del Riesgo o edita la existente (con la ruta real de la empresa). */
export function FormularioSesion({ sesionId, inicial }: { sesionId?: string; inicial?: Datos }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [d, setD] = useState<Datos>(inicial ?? VACIO);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [borrar, setBorrar] = useState(false);

  const guardar = () =>
    startTransition(async () => {
      setError(null);
      const input = { ...d, descripcion: d.descripcion || undefined, umbral: Number(d.umbral) };
      const r = sesionId ? await actualizarSesion(sesionId, input) : await crearSesion(input);
      if (!r.ok) return setError(r.error);
      setAbierto(false);
      if (!sesionId && 'id' in r) router.push(`/riesgo/${r.id}`);
      else router.refresh();
    });

  if (!abierto) {
    return sesionId ? (
      <span className="inline-flex flex-wrap items-center gap-3 text-xs">
        <button type="button" onClick={() => setAbierto(true)} className="inline-flex items-center gap-1 text-marmol-500 hover:text-marca-600">
          <Pencil size={12} /> Editar datos y ruta de la empresa
        </button>
        {borrar ? (
          <span className="inline-flex items-center gap-2">
            <span className="text-bajo">¿Eliminar la sesión con sus equipos y jugadas?</span>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await eliminarSesion(sesionId);
                  if (r.ok) router.push('/riesgo');
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
            <Trash2 size={12} /> Eliminar sesión
          </button>
        )}
      </span>
    ) : (
      <button type="button" onClick={() => setAbierto(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-secundario shadow hover:bg-marca-50">
        <Plus size={16} /> Nueva sesión
      </button>
    );
  }

  return (
    <div className="card max-w-xl space-y-3 p-4 text-left text-marmol-800">
      <h3 className="font-display font-semibold text-secundario">{sesionId ? 'Editar sesión' : 'Nueva sesión de La Ruta del Riesgo'}</h3>
      <input value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} placeholder="Ej. Ruta del Riesgo · Área comercial y compras" className="campo" />
      <textarea value={d.descripcion} onChange={(e) => setD({ ...d, descripcion: e.target.value })} rows={2} placeholder="Mensaje para los equipos (opcional)" className="campo" />
      <div className="rounded-lg bg-marmol-50 p-3">
        <p className="text-sm font-semibold text-marmol-800">📣 La ruta real de la empresa</p>
        <p className="text-[11px] text-marmol-500">Los retos usan estos datos: las reglas, responsables y rutas de reporte dependen del tipo de entidad y de su sistema de prevención.</p>
        <label className="mt-2 block text-xs font-medium text-marmol-600">
          Sistema
          <select value={d.marco} onChange={(e) => setD({ ...d, marco: e.target.value as Marco })} className="campo mt-1">
            {(Object.keys(MARCOS) as Marco[]).map((k) => (
              <option key={k} value={k}>
                {MARCOS[k].nombre} — {MARCOS[k].detalle}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-2 block text-xs font-medium text-marmol-600">
          ¿A quién se escala?
          <input value={d.responsable} onChange={(e) => setD({ ...d, responsable: e.target.value })} placeholder="Ej. Oficial de Cumplimiento" className="campo mt-1" />
        </label>
        <label className="mt-2 block text-xs font-medium text-marmol-600">
          ¿Por qué canal?
          <input value={d.canal} onChange={(e) => setD({ ...d, canal: e.target.value })} placeholder="Ej. el formato de operación inusual en la intranet" className="campo mt-1" />
        </label>
        <label className="mt-2 block text-xs font-medium text-marmol-600">
          % mínimo por competencia para certificar como Guardián del Riesgo
          <input type="number" min={50} max={100} value={d.umbral} onChange={(e) => setD({ ...d, umbral: Number(e.target.value) })} className="campo mt-1 w-28" />
        </label>
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={pending || !d.titulo.trim()} onClick={guardar} className="boton">
          {pending ? 'Guardando…' : sesionId ? 'Guardar' : 'Crear sesión'}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="boton-secundario">
          Cancelar
        </button>
      </div>
    </div>
  );
}
