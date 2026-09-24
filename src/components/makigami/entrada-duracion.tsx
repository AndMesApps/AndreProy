'use client';

import { UNIDADES_TIEMPO, type UnidadTiempo } from '@/lib/makigami';

export interface Duracion {
  valor: string;
  unidad: UnidadTiempo;
}

export function aMinutos(d: Duracion) {
  const n = Number(d.valor.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n * UNIDADES_TIEMPO[d.unidad] : 0;
}

/** Número + unidad (min / h / días calendario). */
export function EntradaDuracion({ etiqueta, valor, onChange }: { etiqueta: string; valor: Duracion; onChange: (d: Duracion) => void }) {
  return (
    <label className="block text-xs text-marmol-500">
      {etiqueta}
      <div className="mt-1 flex">
        <input
          type="number"
          min={0}
          step="any"
          value={valor.valor}
          onChange={(e) => onChange({ ...valor, valor: e.target.value })}
          className="w-full min-w-0 rounded-l-lg border border-marmol-200 px-2.5 py-1.5 text-sm text-marmol-900"
        />
        <select
          value={valor.unidad}
          onChange={(e) => onChange({ ...valor, unidad: e.target.value as UnidadTiempo })}
          className="rounded-r-lg border border-l-0 border-marmol-200 bg-marmol-50 px-1.5 text-sm text-marmol-700"
        >
          <option value="min">min</option>
          <option value="h">horas</option>
          <option value="d">días</option>
        </select>
      </div>
    </label>
  );
}
