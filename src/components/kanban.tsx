'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ColumnaKanban {
  id: string;
  titulo: string;
  /** Clase de color del encabezado de la columna. */
  clase?: string;
}

/**
 * Tablero Kanban reutilizable: columnas por estado y tarjetas que se
 * arrastran de una columna a otra (en computador). En el celular, cada
 * tarjeta tiene un menú «Mover a…» porque arrastrar no funciona bien al tacto.
 * Mueve la tarjeta de inmediato y luego llama a `onMover` para guardar.
 */
export function Kanban<T extends { id: string }>({
  columnas,
  items,
  columnaDe,
  tarjeta,
  onMover,
  deshabilitado = false,
  vacio = 'Nada aquí',
}: {
  columnas: ColumnaKanban[];
  items: T[];
  columnaDe: (item: T) => string;
  tarjeta: (item: T) => React.ReactNode;
  onMover: (item: T, columna: string) => Promise<void> | void;
  deshabilitado?: boolean;
  vacio?: string;
}) {
  const [movidos, setMovidos] = useState<Record<string, string>>({});
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  // Cuando llegan los datos guardados, se olvidan los movimientos locales.
  useEffect(() => setMovidos({}), [items]);

  const columnaActual = (item: T) => movidos[item.id] ?? columnaDe(item);

  const mover = async (item: T, columna: string) => {
    if (columnaActual(item) === columna) return;
    setMovidos((m) => ({ ...m, [item.id]: columna }));
    await onMover(item, columna);
  };

  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3 px-1">
        {columnas.map((col) => {
          const suyos = items.filter((i) => columnaActual(i) === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                if (deshabilitado || !arrastrando) return;
                e.preventDefault();
                setSobre(col.id);
              }}
              onDragLeave={() => setSobre((s) => (s === col.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                const item = items.find((i) => i.id === arrastrando);
                setArrastrando(null);
                setSobre(null);
                if (item) void mover(item, col.id);
              }}
              className={cn('flex w-64 shrink-0 flex-col rounded-xl bg-marmol-100/70 p-2 transition', sobre === col.id && 'bg-marca-100 ring-2 ring-marca-400')}
            >
              <div className={cn('mb-2 flex items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold', col.clase ?? 'bg-white text-marmol-700')}>
                <span>{col.titulo}</span>
                <span className="opacity-70">{suyos.length}</span>
              </div>
              <div className="flex min-h-[4rem] flex-col gap-2">
                {suyos.length === 0 && <p className="px-2 py-3 text-center text-[11px] text-marmol-400">{vacio}</p>}
                {suyos.map((item) => (
                  <div
                    key={item.id}
                    draggable={!deshabilitado}
                    onDragStart={(e) => {
                      setArrastrando(item.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setArrastrando(null);
                      setSobre(null);
                    }}
                    className={cn(
                      'rounded-lg border border-marmol-200 bg-white p-2.5 text-sm shadow-sm',
                      !deshabilitado && 'cursor-grab active:cursor-grabbing',
                      arrastrando === item.id && 'opacity-40',
                    )}
                  >
                    {tarjeta(item)}
                    {!deshabilitado && (
                      <select
                        value=""
                        onChange={(e) => e.target.value && void mover(item, e.target.value)}
                        className="mt-2 w-full rounded border border-marmol-200 bg-marmol-50 px-1 py-0.5 text-[11px] text-marmol-500"
                        aria-label="Mover a otra columna"
                      >
                        <option value="">Mover a…</option>
                        {columnas
                          .filter((c) => c.id !== col.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.titulo}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
