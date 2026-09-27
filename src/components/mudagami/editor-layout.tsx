'use client';

import { useState } from 'react';
import { ESPACIOS, ESTACIONES, minimoTraslados, type Espacio, type Layout } from '@/lib/mudagami';
import { cn } from '@/lib/utils';
import { EstacionIcono } from './iconos';

/** Filas del tablero: cada una son dos espacios contiguos (uno de cada carril), como en el tablero físico. */
const FILAS: [Espacio, Espacio][] = [
  ['D', 'A'],
  ['E', 'B'],
  ['F', 'C'],
];

/**
 * Tablero de la planta (6 espacios en dos carriles + el ingreso). En modo
 * editable, tocar un espacio y luego otro los intercambia — así se rediseña
 * la planta sin arrastrar nada, cómodo también en celular.
 */
export function EditorLayout({
  layout,
  editable = false,
  onChange,
  mostrarMinimo = true,
}: {
  layout: Layout;
  editable?: boolean;
  onChange?: (layout: Layout) => void;
  mostrarMinimo?: boolean;
}) {
  const [seleccionado, setSeleccionado] = useState<Espacio | null>(null);

  const tocar = (espacio: Espacio) => {
    if (!editable || !onChange) return;
    if (!seleccionado) return setSeleccionado(espacio);
    if (seleccionado === espacio) return setSeleccionado(null);
    const nuevo = { ...layout, [seleccionado]: layout[espacio], [espacio]: layout[seleccionado] };
    onChange(nuevo);
    setSeleccionado(null);
  };

  return (
    <div className="inline-block">
      <div className="overflow-hidden rounded-xl border border-marmol-200">
        {FILAS.map(([izq, der], i) => (
          <div key={i} className="flex">
            <CeldaEspacio espacio={izq} estacion={layout[izq]} seleccionado={seleccionado === izq} editable={editable} onClick={() => tocar(izq)} borde={i > 0} />
            <div className="flex w-6 shrink-0 flex-col items-center justify-center gap-0.5 bg-marmol-50 text-marmol-300" aria-hidden>
              <span>↑</span>
              <span>↓</span>
            </div>
            <CeldaEspacio espacio={der} estacion={layout[der]} seleccionado={seleccionado === der} editable={editable} onClick={() => tocar(der)} borde={i > 0} />
          </div>
        ))}
        <div className="border-t border-marmol-200 bg-secundario px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white">Ingreso</div>
      </div>
      {editable && <p className="mt-1.5 text-xs text-marmol-400">{seleccionado ? 'Toca otro espacio para intercambiarlos.' : 'Toca un espacio y luego otro para cambiarlos de sitio.'}</p>}
      {mostrarMinimo && (
        <p className="mt-1.5 text-xs text-marmol-500">
          📐 Con este diseño, el mínimo posible de traslados es <strong className="text-secundario">{minimoTraslados(layout)}</strong>.
        </p>
      )}
    </div>
  );
}

function CeldaEspacio({
  espacio,
  estacion,
  seleccionado,
  editable,
  onClick,
  borde,
}: {
  espacio: Espacio;
  estacion: Layout[Espacio];
  seleccionado: boolean;
  editable: boolean;
  onClick: () => void;
  borde: boolean;
}) {
  const contenido = (
    <>
      <span className="absolute left-1.5 top-1 text-[9px] font-bold text-marmol-300">{espacio}</span>
      <EstacionIcono estacion={estacion} size={30} />
      <span className="px-1 text-center text-[10px] font-medium leading-tight text-marmol-600">{ESTACIONES[estacion].corto}</span>
    </>
  );
  const clases = cn(
    'relative flex w-28 flex-col items-center justify-center gap-1 py-2.5 sm:w-32',
    borde && 'border-t border-marmol-200',
    seleccionado ? 'bg-marca-100 ring-2 ring-inset ring-marca-500' : 'bg-white',
    editable && 'transition hover:bg-marca-50'
  );
  if (!editable) return <div className={clases}>{contenido}</div>;
  return (
    <button type="button" onClick={onClick} className={clases}>
      {contenido}
    </button>
  );
}
