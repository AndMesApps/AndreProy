'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { archivarProceso, eliminarProceso, vincularJuego } from '@/app/procesos/actions';
import { Archive, FileText, Link2, Trash2, Unlink } from 'lucide-react';

export interface JuegoVinculable {
  juego: 'makigami' | 'kaizen';
  id: string;
  titulo: string;
  estado: string;
  procesoId: string | null;
}

const NOMBRE_JUEGO = { makigami: '🎯 Cacería Makigami', kaizen: '🔁 Carrera Kaizen' };

/** Los juegos que se hicieron sobre este proceso, y cómo unir otros. */
export function JuegosProceso({ procesoId, juegos }: { procesoId: string; juegos: JuegoVinculable[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [elegido, setElegido] = useState('');

  const unidos = juegos.filter((j) => j.procesoId === procesoId);
  const libres = juegos.filter((j) => j.procesoId !== procesoId);

  const vincular = (j: JuegoVinculable, proceso: string | null) =>
    startTransition(async () => {
      setError(null);
      const res = await vincularJuego(j.juego, j.id, proceso);
      if (!res.ok) return setError(res.error);
      setElegido('');
      router.refresh();
    });

  return (
    <div className="space-y-3">
      {unidos.length === 0 ? (
        <p className="text-sm text-marmol-500">Aún no hay juegos sobre este proceso.</p>
      ) : (
        <ul className="space-y-1.5">
          {unidos.map((j) => (
            <li key={j.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-marmol-200 px-3 py-2 text-sm">
              <span className="text-xs text-marmol-400">{NOMBRE_JUEGO[j.juego]}</span>
              <Link href={`/${j.juego}/${j.id}`} className="min-w-0 flex-1 truncate font-medium text-marmol-800 hover:text-secundario">
                {j.titulo}
              </Link>
              <Link href={`/${j.juego}/${j.id}/informe`} className="no-imprimir inline-flex items-center gap-1 text-xs text-marca-600 hover:underline">
                <FileText size={12} /> Informe
              </Link>
              <button type="button" disabled={pending} onClick={() => vincular(j, null)} className="no-imprimir text-marmol-300 hover:text-bajo" title="Soltar del proceso">
                <Unlink size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {libres.length > 0 && (
        <div className="no-imprimir flex flex-wrap items-center gap-2">
          <select value={elegido} onChange={(e) => setElegido(e.target.value)} className="campo max-w-sm py-1.5 text-xs" aria-label="Juego para unir">
            <option value="">Unir un juego que ya hiciste…</option>
            {libres.map((j) => (
              <option key={j.id} value={j.id}>
                {NOMBRE_JUEGO[j.juego]} · {j.titulo}
                {j.procesoId ? ' (en otro proceso)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={pending || !elegido}
            onClick={() => {
              const j = libres.find((x) => x.id === elegido);
              if (j) vincular(j, procesoId);
            }}
            className="boton-secundario px-3 py-1.5 text-xs"
          >
            <Link2 size={13} /> Unir
          </button>
        </div>
      )}
      <p className="no-imprimir text-xs text-marmol-500">
        ¿Un juego nuevo para este proceso? Crea una{' '}
        <Link href="/makigami" className="font-semibold text-marca-600 hover:underline">
          Cacería Makigami
        </Link>{' '}
        para diagnosticar o una{' '}
        <Link href="/kaizen" className="font-semibold text-marca-600 hover:underline">
          Carrera Kaizen
        </Link>{' '}
        para entrenar la mejora, y únela aquí.
      </p>
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}

/** Archivar o borrar el proceso (borrar pide confirmación en la misma pantalla). */
export function OpcionesProceso({ procesoId, activo }: { procesoId: string; activo: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmar, setConfirmar] = useState(false);

  return (
    <div className="no-imprimir flex flex-wrap items-center gap-3 text-xs">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await archivarProceso(procesoId, !activo);
            router.refresh();
          })
        }
        className="inline-flex items-center gap-1 text-marmol-500 hover:text-secundario"
      >
        <Archive size={12} /> {activo ? 'Archivar' : 'Reactivar'}
      </button>
      {confirmar ? (
        <span className="inline-flex items-center gap-2">
          <span className="text-bajo">¿Borrar el proceso con sus mediciones y acciones?</span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await eliminarProceso(procesoId);
                if (res.ok) router.push('/procesos');
              })
            }
            className="font-semibold text-bajo"
          >
            Sí, borrar
          </button>
          <button type="button" onClick={() => setConfirmar(false)} className="text-marmol-500">
            No
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setConfirmar(true)} className="inline-flex items-center gap-1 text-marmol-400 hover:text-bajo">
          <Trash2 size={12} /> Borrar
        </button>
      )}
    </div>
  );
}
