'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarProyecto, crearProyecto } from '@/app/proyectos/actions';
import { ESTADOS_PROYECTO, PLANTILLAS, TIPOS_PROYECTO, leerNumero, type EstadoProyecto, type TipoProyecto } from '@/lib/proyectos';
import { cn } from '@/lib/utils';
import { Pencil, Plus } from 'lucide-react';

export interface DatosFormularioProyecto {
  nombre: string;
  cliente: string;
  grupo: string;
  tipo: TipoProyecto;
  programa: string;
  descripcion: string;
  objetivoGeneral: string;
  contactoNombre: string;
  contactoCargo: string;
  contactoCorreo: string;
  contactoCelular: string;
  gestorExterno: string;
  fechaInicio: string;
  fechaFin: string;
  fechaCierreLimite: string;
  horasContratadas: string;
  valorContrato: string;
  frecuenciaDias: string;
  estado: EstadoProyecto;
  reglas: string;
  enlaces: string;
}

const VACIO: DatosFormularioProyecto = {
  nombre: '',
  cliente: '',
  grupo: '',
  tipo: 'consultoria',
  programa: '',
  descripcion: '',
  objetivoGeneral: '',
  contactoNombre: '',
  contactoCargo: '',
  contactoCorreo: '',
  contactoCelular: '',
  gestorExterno: '',
  fechaInicio: '',
  fechaFin: '',
  fechaCierreLimite: '',
  horasContratadas: '',
  valorContrato: '',
  frecuenciaDias: '7',
  estado: 'en_curso',
  reglas: '',
  enlaces: '',
};

/** Plantilla sugerida según el tipo de proyecto. */
const PLANTILLA_POR_TIPO: Partial<Record<TipoProyecto, string>> = {
  consultoria: 'consultoria',
  programa: 'programa',
  aplicativo: 'aplicativo',
  capacitacion: 'capacitacion',
  acompanamiento: 'consultoria',
};

/** Crea un proyecto (con plantilla de cronograma) o edita su ficha si recibe proyectoId. */
export function FormularioProyecto({ proyectoId, datosIniciales, grupos = [] }: { proyectoId?: string; datosIniciales?: DatosFormularioProyecto; grupos?: string[] }) {
  const router = useRouter();
  const esEdicion = Boolean(proyectoId);
  const [mostrar, setMostrar] = useState(false);
  const [datos, setDatos] = useState<DatosFormularioProyecto>(datosIniciales ?? VACIO);
  const [plantilla, setPlantilla] = useState('consultoria');
  const [diaSeguimiento, setDiaSeguimiento] = useState('3');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const set = (campo: keyof DatosFormularioProyecto) => (e: { target: { value: string } }) => {
    const valor = e.target.value;
    setDatos((d) => ({ ...d, [campo]: valor }));
    if (campo === 'tipo' && !esEdicion) setPlantilla(PLANTILLA_POR_TIPO[valor as TipoProyecto] ?? '');
  };

  function guardar() {
    setError(null);
    const numeroONulo = (v: string) => (v.trim() === '' ? null : leerNumero(v));
    const horas = numeroONulo(datos.horasContratadas);
    const valor = numeroONulo(datos.valorContrato);
    const frecuencia = numeroONulo(datos.frecuenciaDias);
    if ((datos.horasContratadas && horas == null) || (datos.valorContrato && valor == null) || (datos.frecuenciaDias && frecuencia == null)) {
      return setError('Revisa las horas, el valor y la frecuencia: deben ser números.');
    }
    const input = {
      ...datos,
      horasContratadas: horas,
      valorContrato: valor,
      frecuenciaDias: frecuencia == null ? null : Math.round(frecuencia),
    };
    startTransition(async () => {
      const res = proyectoId ? await actualizarProyecto(proyectoId, input) : await crearProyecto(input, plantilla || undefined, Number(diaSeguimiento) || 3);
      if (!res.ok) return setError(res.error);
      setMostrar(false);
      if (!proyectoId && 'id' in res) router.push(`/proyectos/${res.id}`);
      else router.refresh();
    });
  }

  if (!mostrar) {
    return esEdicion ? (
      <button type="button" onClick={() => setMostrar(true)} className="no-imprimir inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
        <Pencil size={12} /> Editar ficha del proyecto
      </button>
    ) : (
      <button type="button" onClick={() => setMostrar(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-secundario shadow transition hover:bg-marca-50">
        <Plus size={16} /> Nuevo proyecto
      </button>
    );
  }

  const planSel = PLANTILLAS[plantilla];

  return (
    <div className="card no-imprimir max-w-3xl space-y-4 p-4 text-left">
      <h3 className="font-display font-semibold text-secundario">{esEdicion ? 'Editar ficha del proyecto' : 'Nuevo proyecto'}</h3>

      <Bloque titulo="📁 El proyecto">
        <Campo etiqueta="Nombre del proyecto *">
          <input value={datos.nombre} onChange={set('nombre')} placeholder="Ej. Mejora del proceso de compras" className="campo" />
        </Campo>
        <Campo etiqueta="Cliente / empresa *">
          <input value={datos.cliente} onChange={set('cliente')} placeholder="Ej. Ferrara" className="campo" />
        </Campo>
        <Campo etiqueta="Tipo">
          <select value={datos.tipo} onChange={set('tipo')} className="campo">
            {(Object.keys(TIPOS_PROYECTO) as TipoProyecto[]).map((t) => (
              <option key={t} value={t}>
                {TIPOS_PROYECTO[t]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Grupo o aliado">
          <input value={datos.grupo} onChange={set('grupo')} list="grupos-proyecto" placeholder="Ej. Acescorp y Andrea" className="campo" />
          <datalist id="grupos-proyecto">
            {grupos.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </Campo>
        <Campo etiqueta="Programa o línea">
          <input value={datos.programa} onChange={set('programa')} placeholder="Ej. Fábricas de Productividad · Transformación Digital" className="campo" />
        </Campo>
        <Campo etiqueta="Estado">
          <select value={datos.estado} onChange={set('estado')} className="campo">
            {(Object.keys(ESTADOS_PROYECTO) as EstadoProyecto[]).map((e) => (
              <option key={e} value={e}>
                {ESTADOS_PROYECTO[e].nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Alcance / descripción" ancho>
          <textarea value={datos.descripcion} onChange={set('descripcion')} rows={2} className="campo" />
        </Campo>
        <Campo etiqueta="Objetivo general" ancho>
          <textarea value={datos.objetivoGeneral} onChange={set('objetivoGeneral')} rows={2} placeholder="Ej. Aumentar la productividad del área de compras en un 20 %" className="campo" />
        </Campo>
      </Bloque>

      <Bloque titulo="📅 Fechas, horas y valor">
        <Campo etiqueta="Fecha de inicio">
          <input type="date" value={datos.fechaInicio} onChange={set('fechaInicio')} className="campo" />
        </Campo>
        <Campo etiqueta="Fecha límite de finalización">
          <input type="date" value={datos.fechaFin} onChange={set('fechaFin')} className="campo" />
        </Campo>
        <Campo etiqueta="Límite del acta de cierre">
          <input type="date" value={datos.fechaCierreLimite} onChange={set('fechaCierreLimite')} className="campo" />
        </Campo>
        <Campo etiqueta="Intervenir cada (días)">
          <input inputMode="numeric" value={datos.frecuenciaDias} onChange={set('frecuenciaDias')} className="campo" />
        </Campo>
        <Campo etiqueta="Horas contratadas">
          <input inputMode="decimal" value={datos.horasContratadas} onChange={set('horasContratadas')} placeholder="Ej. 60" className="campo" />
        </Campo>
        <Campo etiqueta="Valor del contrato (COP)">
          <input inputMode="decimal" value={datos.valorContrato} onChange={set('valorContrato')} placeholder="Ej. 14.100.000" className="campo" />
        </Campo>
      </Bloque>

      <Bloque titulo="👥 Personas">
        <Campo etiqueta="Contacto en el cliente">
          <input value={datos.contactoNombre} onChange={set('contactoNombre')} className="campo" />
        </Campo>
        <Campo etiqueta="Cargo del contacto">
          <input value={datos.contactoCargo} onChange={set('contactoCargo')} className="campo" />
        </Campo>
        <Campo etiqueta="Correo del contacto">
          <input type="email" value={datos.contactoCorreo} onChange={set('contactoCorreo')} className="campo" />
        </Campo>
        <Campo etiqueta="Celular del contacto">
          <input type="tel" value={datos.contactoCelular} onChange={set('contactoCelular')} className="campo" />
        </Campo>
        <Campo etiqueta="Gestor(a) o supervisor(a) externo" ancho>
          <input value={datos.gestorExterno} onChange={set('gestorExterno')} placeholder="Ej. Gestora del programa, interventoría" className="campo" />
        </Campo>
      </Bloque>

      <details className="rounded-xl border border-marmol-200 p-3" open={esEdicion && Boolean(datos.reglas || datos.enlaces)}>
        <summary className="cursor-pointer text-sm font-semibold text-marmol-700">📜 Reglas clave y enlaces (opcional)</summary>
        <div className="mt-3 grid gap-3">
          <Campo etiqueta="Reglas clave del contrato o programa (topes, plazos, condiciones)" ancho>
            <textarea value={datos.reglas} onChange={set('reglas')} rows={4} placeholder="Ej. Máximo 30 h ejecutadas antes de aprobar el PT1. Seguimiento mensual a más tardar el 3.er día hábil." className="campo" />
          </Campo>
          <Campo etiqueta="Enlaces y especificaciones (Drive, plataforma del programa, repositorio…)" ancho>
            <textarea value={datos.enlaces} onChange={set('enlaces')} rows={3} className="campo" />
          </Campo>
        </div>
      </details>

      {!esEdicion && (
        <div className="rounded-xl border-2 border-dashed border-marca-300 bg-marca-50/40 p-3">
          <p className="text-sm font-semibold text-marmol-800">🗓️ Cronograma inicial</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[['', 'Empezar vacío'], ...Object.entries(PLANTILLAS).map(([k, v]) => [k, v.nombre])].map(([k, nombre]) => (
              <button
                key={k}
                type="button"
                onClick={() => setPlantilla(k!)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition',
                  plantilla === k ? 'border-marca-500 bg-white font-semibold text-marca-700' : 'border-marmol-200 bg-white text-marmol-600 hover:border-marca-300',
                )}
              >
                {nombre}
              </button>
            ))}
          </div>
          {planSel && (
            <p className="mt-2 text-xs text-marmol-600">
              {planSel.descripcion} Los {planSel.hitos.length} hitos se reparten entre la fecha de inicio y la de finalización.
            </p>
          )}
          {planSel?.seguimientos && (
            <label className="mt-2 flex items-center gap-2 text-xs text-marmol-600">
              Los seguimientos mensuales vencen el día hábil
              <input inputMode="numeric" value={diaSeguimiento} onChange={(e) => setDiaSeguimiento(e.target.value)} className="campo w-14 py-1 text-center" />
              del mes siguiente.
            </label>
          )}
          {plantilla && (!datos.fechaInicio || !datos.fechaFin) && <p className="mt-2 text-xs text-medio">Pon la fecha de inicio y la de finalización para crear el cronograma.</p>}
        </div>
      )}

      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={pending || datos.nombre.trim().length < 2 || datos.cliente.trim().length < 2} onClick={guardar} className="boton">
          {pending ? 'Guardando…' : esEdicion ? 'Guardar' : 'Crear proyecto'}
        </button>
        <button type="button" onClick={() => setMostrar(false)} className="boton-secundario">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-marmol-200 p-3">
      <legend className="px-1 text-sm font-semibold text-marmol-700">{titulo}</legend>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Campo({ etiqueta, ancho, children }: { etiqueta: string; ancho?: boolean; children: React.ReactNode }) {
  return (
    <label className={cn('block text-xs font-medium text-marmol-500', ancho && 'sm:col-span-2')}>
      {etiqueta}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}
