'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarSesion, crearSesion } from '@/app/kaizen/actions';
import { SIMULACIONES } from '@/lib/kaizen';
import { cn } from '@/lib/utils';
import { Pencil, Plus } from 'lucide-react';

export interface DatosFormularioSesion {
  titulo: string;
  descripcion: string;
  producto: string;
  unidad: string;
  criterioCalidad: string;
  totalRondas: number;
  minutosRonda: string;
}

const VACIO: DatosFormularioSesion = {
  titulo: '',
  descripcion: '',
  producto: '',
  unidad: '',
  criterioCalidad: '',
  totalRondas: 5,
  minutosRonda: '3',
};

/** Crea una carrera nueva, o edita una existente si recibe sesionId + datosIniciales. */
export function FormularioSesion({ sesionId, datosIniciales }: { sesionId?: string; datosIniciales?: DatosFormularioSesion }) {
  const router = useRouter();
  const esEdicion = Boolean(sesionId);
  const [mostrar, setMostrar] = useState(false);
  const [datos, setDatos] = useState<DatosFormularioSesion>(datosIniciales ?? VACIO);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const set = (campo: keyof DatosFormularioSesion) => (e: { target: { value: string } }) =>
    setDatos((d) => ({ ...d, [campo]: campo === 'totalRondas' ? Number(e.target.value) : e.target.value }));

  function guardar() {
    setError(null);
    const minutos = Number(datos.minutosRonda.replace(',', '.'));
    if (!Number.isFinite(minutos) || minutos <= 0) return setError('Escribe los minutos por ronda, por ejemplo 3 o 2.5.');
    const input = {
      titulo: datos.titulo,
      descripcion: datos.descripcion || undefined,
      producto: datos.producto,
      unidad: datos.unidad,
      criterioCalidad: datos.criterioCalidad || undefined,
      totalRondas: Math.round(datos.totalRondas),
      duracionRondaSeg: Math.round(minutos * 60),
    };
    startTransition(async () => {
      const res = sesionId ? await actualizarSesion(sesionId, input) : await crearSesion(input);
      if (!res.ok) return setError(res.error);
      setMostrar(false);
      if (!sesionId && 'id' in res) router.push(`/kaizen/${res.id}`);
      else router.refresh();
    });
  }

  if (!mostrar) {
    return esEdicion ? (
      <button type="button" onClick={() => setMostrar(true)} className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
        <Pencil size={12} /> Editar datos de la carrera
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setMostrar(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-secundario shadow transition hover:bg-marca-50"
      >
        <Plus size={16} /> Nueva carrera
      </button>
    );
  }

  return (
    <div className="card max-w-xl space-y-3 p-4 text-left">
      <h3 className="font-display font-semibold text-secundario">{esEdicion ? 'Editar carrera' : 'Nueva Carrera Kaizen'}</h3>

      {!esEdicion && (
        <div>
          <p className="text-xs font-medium text-marmol-500">¿Qué van a producir? Elige una simulación lista o escribe la tuya:</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {SIMULACIONES.map((s) => (
              <button
                key={s.nombre}
                type="button"
                onClick={() =>
                  setDatos((d) => ({
                    ...d,
                    titulo: d.titulo || `Carrera Kaizen: ${s.nombre.toLowerCase()}`,
                    producto: s.producto,
                    unidad: s.unidad,
                    criterioCalidad: s.criterio,
                    minutosRonda: String(s.duracionSeg / 60),
                  }))
                }
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition',
                  datos.producto === s.producto ? 'border-marca-500 bg-marca-50 font-semibold text-marca-700' : 'border-marmol-200 text-marmol-600 hover:border-marca-300',
                )}
              >
                {s.emoji} {s.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      <Campo etiqueta="Título de la carrera">
        <input type="text" placeholder="Ej. Taller Kaizen · Equipo de compras" value={datos.titulo} onChange={set('titulo')} className="campo" />
      </Campo>
      <Campo etiqueta="Mensaje para los jugadores (opcional)">
        <textarea placeholder="Ej. Hoy vamos a vivir la mejora continua en 5 rondas." value={datos.descripcion} onChange={set('descripcion')} rows={2} className="campo" />
      </Campo>
      <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
        <Campo etiqueta="Qué producen">
          <input type="text" placeholder="Ej. Aviones de papel" value={datos.producto} onChange={set('producto')} className="campo" />
        </Campo>
        <Campo etiqueta="Cómo se cuentan">
          <input type="text" placeholder="Ej. aviones" value={datos.unidad} onChange={set('unidad')} className="campo" />
        </Campo>
      </div>
      <Campo etiqueta="¿Cuándo una unidad cuenta como buena? (criterio de calidad)">
        <textarea placeholder="Ej. Vuela al menos 3 metros y tiene las alas simétricas." value={datos.criterioCalidad} onChange={set('criterioCalidad')} rows={2} className="campo" />
      </Campo>
      <div className="grid grid-cols-2 gap-2">
        <Campo etiqueta="Número de rondas">
          <select value={datos.totalRondas} onChange={set('totalRondas')} className="campo">
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n} rondas
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Minutos para producir">
          <input inputMode="decimal" value={datos.minutosRonda} onChange={set('minutosRonda')} placeholder="Ej. 3" className="campo" />
        </Campo>
      </div>
      <p className="text-[11px] text-marmol-400">La ronda 1 es la línea base: trabajan como saben. Desde la ronda 2 cada equipo aplica una mejora por ronda.</p>

      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={pending || !datos.titulo.trim() || !datos.producto.trim() || !datos.unidad.trim()} onClick={guardar} className="boton">
          {pending ? 'Guardando…' : esEdicion ? 'Guardar' : 'Crear carrera'}
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
