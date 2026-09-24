'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { eliminarCarril, guardarCarril, moverCarril } from '@/app/makigami/actions';
import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from 'lucide-react';
import type { CarrilVista } from './tipos';

/** Carriles del Makigami: roles o áreas que intervienen en el proceso (facilitador, fase de mapeo). */
export function EditorCarriles({ retoId, carriles }: { retoId: string; carriles: CarrilVista[] }) {
  const router = useRouter();
  const [nuevo, setNuevo] = useState('');
  const [editando, setEditando] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ejecutar = (fn: () => Promise<{ ok: boolean; error?: string }>, despues?: () => void) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? 'Error');
      despues?.();
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-display font-semibold text-secundario">Carriles</h3>
        <p className="text-xs text-marmol-500">Cada carril es un rol o área que interviene. Luego usa “+ Paso aquí” en el tablero.</p>
      </div>
      <ul className="space-y-1.5">
        {carriles.map((c, i) => {
          const valor = editando[c.id] ?? c.nombre;
          const cambiado = valor.trim() !== c.nombre && valor.trim() !== '';
          return (
            <li key={c.id} className="flex items-center gap-1">
              <input
                value={valor}
                onChange={(e) => setEditando((s) => ({ ...s, [c.id]: e.target.value }))}
                className="min-w-0 flex-1 rounded-lg border border-marmol-200 px-2 py-1 text-sm"
              />
              {cambiado && (
                <button type="button" disabled={pending} onClick={() => ejecutar(() => guardarCarril({ retoId, id: c.id, nombre: valor }))} className="p-1 text-marca-600" title="Guardar nombre">
                  <Check size={14} />
                </button>
              )}
              <button type="button" disabled={pending || i === 0} onClick={() => ejecutar(() => moverCarril(retoId, c.id, -1))} className="p-1 text-marmol-400 disabled:opacity-30" title="Subir">
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                disabled={pending || i === carriles.length - 1}
                onClick={() => ejecutar(() => moverCarril(retoId, c.id, 1))}
                className="p-1 text-marmol-400 disabled:opacity-30"
                title="Bajar"
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => ejecutar(() => eliminarCarril(retoId, c.id))}
                className="p-1 text-marmol-300 hover:text-bajo"
                title="Eliminar carril (y sus pasos)"
              >
                <Trash2 size={14} />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex gap-1">
        <input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && nuevo.trim()) ejecutar(() => guardarCarril({ retoId, nombre: nuevo }), () => setNuevo(''));
          }}
          placeholder="Ej. Cliente, Compras, Gerencia…"
          className="min-w-0 flex-1 rounded-lg border border-marmol-200 px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          disabled={pending || !nuevo.trim()}
          onClick={() => ejecutar(() => guardarCarril({ retoId, nombre: nuevo }), () => setNuevo(''))}
          className="inline-flex items-center gap-1 rounded-lg bg-marca-500 hover:bg-marca-600 disabled:opacity-40 text-white text-sm px-3"
        >
          <Plus size={14} /> Carril
        </button>
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}
