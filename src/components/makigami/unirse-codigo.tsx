'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Campo para escribir el código de 6 caracteres que da el facilitador. */
export function UnirseCodigo() {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const limpio = codigo.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (limpio.length === 6) router.push(`/makigami/unirse/${limpio}`);
      }}
      className="flex flex-wrap gap-2"
    >
      <input
        value={limpio}
        onChange={(e) => setCodigo(e.target.value)}
        placeholder="CÓDIGO"
        autoCapitalize="characters"
        autoComplete="off"
        aria-label="Código del reto"
        className="w-40 rounded-lg border-2 border-white/40 bg-white/95 px-3 py-2 text-center font-display text-lg font-bold tracking-[0.3em] text-secundario placeholder:tracking-widest placeholder:text-marmol-300"
      />
      <button
        type="submit"
        disabled={limpio.length !== 6}
        className="rounded-lg bg-acento px-4 py-2 text-sm font-bold text-secundario shadow transition hover:brightness-105 disabled:opacity-50"
      >
        Unirme al juego
      </button>
    </form>
  );
}
