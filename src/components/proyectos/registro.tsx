'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { eliminarRegistro, guardarRegistro } from '@/app/proyectos/actions';
import { ENTIDADES, hoyISO, type Campo, type Entidad } from '@/lib/proyectos';
import { cn } from '@/lib/utils';
import { Trash2, X } from 'lucide-react';

export type Opcion = { id: string; etiqueta: string };
export type Referencias = Partial<Record<'hitos' | 'objetivos' | 'kpis', Opcion[]>>;
export type Registro = { id: string } & Record<string, unknown>;

function valorInicial(campo: Campo, registro?: Registro, fijos?: Record<string, string>) {
  if (fijos?.[campo.clave] != null) return fijos[campo.clave]!;
  if (registro) {
    const v = registro[campo.clave];
    return v == null ? '' : String(v);
  }
  if (campo.tipo === 'fecha' && campo.requerido) return hoyISO();
  return campo.valorInicial ?? '';
}

/**
 * Formulario de cualquier registro del proyecto, armado a partir de la
 * definición de sus campos (lib/proyectos.ts → ENTIDADES).
 */
export function FormularioRegistro({
  entidad,
  proyectoId,
  registro,
  referencias = {},
  fijos,
  onListo,
  titulo,
}: {
  entidad: Entidad;
  proyectoId: string;
  registro?: Registro;
  referencias?: Referencias;
  /** Valores precargados (ej. el KPI al registrar una medición). */
  fijos?: Record<string, string>;
  onListo: () => void;
  titulo?: string;
}) {
  const def = ENTIDADES[entidad];
  const campos = def.campos as readonly Campo[];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [valores, setValores] = useState<Record<string, string>>(() => Object.fromEntries(campos.map((c) => [c.clave, valorInicial(c, registro, fijos)])));

  const ejecutar = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? 'Error');
      onListo();
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        ejecutar(() => guardarRegistro(entidad, proyectoId, registro?.id ?? null, valores));
      }}
      className="space-y-3 rounded-xl border-2 border-dashed border-marca-300 bg-marca-50/40 p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-marmol-800">{titulo ?? (registro ? `Editar ${def.singular}` : `Nuevo ${def.singular}`)}</p>
        <button type="button" onClick={onListo} className="text-marmol-400 hover:text-marmol-700" aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {campos.map((c) => (
          <label key={c.clave} className={cn('block text-xs font-medium text-marmol-500', c.ancho && 'sm:col-span-2')}>
            {c.etiqueta}
            {c.requerido && ' *'}
            <div className="mt-1 font-normal">
              <Entrada campo={c} valor={valores[c.clave] ?? ''} onCambio={(v) => setValores((x) => ({ ...x, [c.clave]: v }))} referencias={referencias} />
            </div>
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className="boton py-1.5">
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={onListo} className="boton-secundario py-1.5">
          Cancelar
        </button>
        {registro &&
          (confirmar ? (
            <span className="ml-auto flex items-center gap-2 text-xs">
              <span className="text-bajo">¿Borrar este {def.singular}?</span>
              <button type="button" disabled={pending} onClick={() => ejecutar(() => eliminarRegistro(entidad, proyectoId, registro.id))} className="font-semibold text-bajo">
                Sí, borrar
              </button>
              <button type="button" onClick={() => setConfirmar(false)} className="text-marmol-500">
                No
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmar(true)} className="ml-auto inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-bajo">
              <Trash2 size={12} /> Borrar
            </button>
          ))}
      </div>
    </form>
  );
}

function Entrada({ campo, valor, onCambio, referencias }: { campo: Campo; valor: string; onCambio: (v: string) => void; referencias: Referencias }) {
  const cambio = (e: { target: { value: string } }) => onCambio(e.target.value);
  switch (campo.tipo) {
    case 'area':
      return <textarea value={valor} onChange={cambio} rows={2} placeholder={campo.placeholder} className="campo" />;
    case 'fecha':
      return <input type="date" value={valor} onChange={cambio} className="campo" />;
    case 'numero':
      return <input inputMode="decimal" value={valor} onChange={cambio} placeholder={campo.placeholder} className="campo" />;
    case 'url':
      return <input type="url" value={valor} onChange={cambio} placeholder="https://…" className="campo" />;
    case 'opcion':
      return (
        <select value={valor} onChange={cambio} className="campo">
          {!campo.requerido && <option value="">—</option>}
          {Object.entries(campo.opciones ?? {}).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      );
    case 'referencia': {
      const opciones = (campo.referencia && referencias[campo.referencia]) || [];
      return (
        <select value={valor} onChange={cambio} className="campo">
          <option value="">{campo.requerido ? 'Elige…' : '— Ninguno —'}</option>
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      );
    }
    default:
      return <input value={valor} onChange={cambio} placeholder={campo.placeholder} className="campo" />;
  }
}

/** Barra de avance con su porcentaje; `esperado` dibuja una marca de dónde debería ir. */
export function BarraAvance({ valor, esperado, tono = 'bg-marca-500', alto = 'h-2.5' }: { valor: number | null; esperado?: number | null; tono?: string; alto?: string }) {
  return (
    <div className={cn('relative w-full rounded-full bg-marmol-100', alto)}>
      <div className={cn('h-full rounded-full transition-[width]', tono)} style={{ width: `${Math.max(0, Math.min(1, valor ?? 0)) * 100}%` }} />
      {esperado != null && (
        <div className="absolute -top-1 h-[calc(100%+0.5rem)] w-0.5 rounded bg-secundario" style={{ left: `${Math.max(0, Math.min(1, esperado)) * 100}%` }} title={`Esperado hoy: ${Math.round(esperado * 100)} %`} />
      )}
    </div>
  );
}
