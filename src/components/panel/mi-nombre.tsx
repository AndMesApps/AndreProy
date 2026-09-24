'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cambiarMiNombre } from '@/app/usuarios/actions';
import { Check, Pencil, X } from 'lucide-react';

/** Saludo del panel con el nombre de la persona; si aún no lo ha escrito, se lo pide. */
export function MiNombre({ nombre, sinNombre }: { nombre: string; sinNombre: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editando, setEditando] = useState(sinNombre);
  const [valor, setValor] = useState(sinNombre ? '' : nombre);
  const [error, setError] = useState<string | null>(null);

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await cambiarMiNombre(valor);
      if (!res.ok) return setError(res.error);
      setEditando(false);
      router.refresh();
    });
  };

  if (!editando) {
    return (
      <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
        Hola, {nombre.split(' ')[0]}
        <button type="button" onClick={() => setEditando(true)} className="text-white/50 hover:text-white" title="Cambiar mi nombre" aria-label="Cambiar mi nombre">
          <Pencil size={16} />
        </button>
      </h1>
    );
  }

  return (
    <form onSubmit={guardar} className="mt-2 max-w-md">
      <label className="text-sm font-semibold text-white">
        {sinNombre ? '¿Cómo te llamas? Así te saludaremos y te verán los demás.' : 'Tu nombre'}
        <div className="mt-1 flex gap-2">
          <input
            autoFocus
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            maxLength={80}
            placeholder="Ej. Andrea Mesías"
            className="campo flex-1 text-marmol-900"
          />
          <button type="submit" disabled={pending || valor.trim().length < 2} className="rounded-lg bg-acento px-3 text-secundario disabled:opacity-50" title="Guardar">
            <Check size={18} />
          </button>
          {!sinNombre && (
            <button type="button" onClick={() => setEditando(false)} className="rounded-lg bg-white/20 px-3 text-white" title="Cancelar">
              <X size={18} />
            </button>
          )}
        </div>
      </label>
      {error && <p className="mt-1 text-sm text-acento">{error}</p>}
    </form>
  );
}
