'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarProceso, crearProceso } from '@/app/procesos/actions';
import { FRECUENCIAS, type Frecuencia } from '@/lib/procesos';
import { cn } from '@/lib/utils';
import { Pencil, Plus } from 'lucide-react';

export interface DatosFormularioProceso {
  nombre: string;
  cliente: string;
  area: string;
  responsable: string;
  objetivo: string;
  indicador: string;
  unidad: string;
  sentido: 'bajar' | 'subir';
  lineaBase: string;
  meta: string;
  frecuencia: Frecuencia;
}

const VACIO: DatosFormularioProceso = {
  nombre: '',
  cliente: '',
  area: '',
  responsable: '',
  objetivo: '',
  indicador: 'Tiempo total del proceso',
  unidad: 'días',
  sentido: 'bajar',
  lineaBase: '',
  meta: '',
  frecuencia: 'semanal',
};

/** Indicadores típicos para llenar el formulario con un toque. */
const INDICADORES: { indicador: string; unidad: string; sentido: 'bajar' | 'subir' }[] = [
  { indicador: 'Tiempo total del proceso', unidad: 'días', sentido: 'bajar' },
  { indicador: 'Entregas a tiempo', unidad: '%', sentido: 'subir' },
  { indicador: 'Errores o reprocesos', unidad: '%', sentido: 'bajar' },
  { indicador: 'Casos atendidos', unidad: 'casos/semana', sentido: 'subir' },
  { indicador: 'Costo por caso', unidad: 'COP', sentido: 'bajar' },
  { indicador: 'Satisfacción del cliente', unidad: 'puntos (1 a 5)', sentido: 'subir' },
];

const numero = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));

/** Crea un proceso, o lo edita si recibe procesoId + datosIniciales. */
export function FormularioProceso({
  procesoId,
  datosIniciales,
  abierto = false,
  proyectoId,
  textoBoton = 'Nuevo proceso',
}: {
  procesoId?: string;
  datosIniciales?: DatosFormularioProceso;
  abierto?: boolean;
  /** Crea el proceso ya unido a este proyecto y se queda en la página actual. */
  proyectoId?: string;
  textoBoton?: string;
}) {
  const router = useRouter();
  const esEdicion = Boolean(procesoId);
  const [mostrar, setMostrar] = useState(abierto);
  const [datos, setDatos] = useState<DatosFormularioProceso>(datosIniciales ?? VACIO);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const set = (campo: keyof DatosFormularioProceso) => (e: { target: { value: string } }) => setDatos((d) => ({ ...d, [campo]: e.target.value }));

  function guardar() {
    setError(null);
    const lineaBase = numero(datos.lineaBase);
    const meta = numero(datos.meta);
    if ((lineaBase != null && Number.isNaN(lineaBase)) || (meta != null && Number.isNaN(meta))) return setError('La línea base y la meta son números.');
    const input = {
      nombre: datos.nombre,
      cliente: datos.cliente || undefined,
      area: datos.area || undefined,
      responsable: datos.responsable || undefined,
      objetivo: datos.objetivo || undefined,
      indicador: datos.indicador,
      unidad: datos.unidad,
      sentido: datos.sentido,
      lineaBase,
      meta,
      frecuencia: datos.frecuencia,
    };
    startTransition(async () => {
      const res = procesoId ? await actualizarProceso(procesoId, input) : await crearProceso(input, proyectoId);
      if (!res.ok) return setError(res.error);
      setMostrar(false);
      if (!procesoId && !proyectoId && 'id' in res) router.push(`/procesos/${res.id}`);
      else router.refresh();
    });
  }

  if (!mostrar) {
    return esEdicion ? (
      <button type="button" onClick={() => setMostrar(true)} className="no-imprimir inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
        <Pencil size={12} /> Editar proceso e indicador
      </button>
    ) : (
      <button type="button" onClick={() => setMostrar(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-secundario shadow transition hover:bg-marca-50">
        <Plus size={16} /> {textoBoton}
      </button>
    );
  }

  return (
    <div className="card no-imprimir max-w-2xl space-y-3 p-4 text-left">
      <h3 className="font-display font-semibold text-secundario">{esEdicion ? 'Editar proceso' : 'Nuevo proceso'}</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <Campo etiqueta="Nombre del proceso *">
          <input value={datos.nombre} onChange={set('nombre')} placeholder="Ej. Compra de papelería" className="campo" />
        </Campo>
        <Campo etiqueta="Cliente o empresa">
          <input value={datos.cliente} onChange={set('cliente')} placeholder="Ej. Papelería El Punto" className="campo" />
        </Campo>
        <Campo etiqueta="Área">
          <input value={datos.area} onChange={set('area')} placeholder="Ej. Compras" className="campo" />
        </Campo>
        <Campo etiqueta="Dueño del proceso">
          <input value={datos.responsable} onChange={set('responsable')} placeholder="Nombre de quien responde por él" className="campo" />
        </Campo>
      </div>
      <Campo etiqueta="Objetivo de la mejora">
        <textarea value={datos.objetivo} onChange={set('objetivo')} rows={2} placeholder="Ej. Que las áreas reciban su papelería en máximo 5 días." className="campo" />
      </Campo>

      <div className="rounded-xl border border-marmol-200 p-3">
        <p className="text-xs font-semibold text-marmol-600">📏 Indicador principal</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {INDICADORES.map((i) => (
            <button
              key={i.indicador}
              type="button"
              onClick={() => setDatos((d) => ({ ...d, ...i }))}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[11px] transition',
                datos.indicador === i.indicador ? 'border-marca-500 bg-marca-50 font-semibold text-marca-700' : 'border-marmol-200 text-marmol-600 hover:border-marca-300',
              )}
            >
              {i.indicador}
            </button>
          ))}
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-[2fr_1fr]">
          <Campo etiqueta="Qué se mide *">
            <input value={datos.indicador} onChange={set('indicador')} className="campo" />
          </Campo>
          <Campo etiqueta="Unidad *">
            <input value={datos.unidad} onChange={set('unidad')} className="campo" />
          </Campo>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Campo etiqueta="Mejorar es que…">
            <select value={datos.sentido} onChange={set('sentido')} className="campo">
              <option value="bajar">baje ⬇️</option>
              <option value="subir">suba ⬆️</option>
            </select>
          </Campo>
          <Campo etiqueta="Línea base (hoy)">
            <input inputMode="decimal" value={datos.lineaBase} onChange={set('lineaBase')} placeholder="Ej. 12.4" className="campo" />
          </Campo>
          <Campo etiqueta="Meta">
            <input inputMode="decimal" value={datos.meta} onChange={set('meta')} placeholder="Ej. 5" className="campo" />
          </Campo>
          <Campo etiqueta="Se mide cada">
            <select value={datos.frecuencia} onChange={set('frecuencia')} className="campo">
              {(Object.keys(FRECUENCIAS) as Frecuencia[]).map((f) => (
                <option key={f} value={f}>
                  {FRECUENCIAS[f].toLowerCase()}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </div>

      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={pending || !datos.nombre.trim() || !datos.indicador.trim() || !datos.unidad.trim()} onClick={guardar} className="boton">
          {pending ? 'Guardando…' : esEdicion ? 'Guardar' : 'Crear proceso'}
        </button>
        <button type="button" onClick={() => setMostrar(false)} className="boton-secundario">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-marmol-500">
      {etiqueta}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}
