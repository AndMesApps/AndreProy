'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { eliminarMedicion, registrarMedicion } from '@/app/procesos/actions';
import { formatearValor, metaCumplida, type ProcesoMinimo } from '@/lib/procesos';
import { formatearFecha } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

function hoyBogota() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

/** Registrar el valor del indicador y ver las mediciones anteriores. */
export function Mediciones({
  procesoId,
  proceso,
  mediciones,
}: {
  procesoId: string;
  proceso: ProcesoMinimo;
  mediciones: { id: string; fecha: string; valor: number; nota: string | null }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fecha, setFecha] = useState(hoyBogota);
  const [valor, setValor] = useState('');
  const [nota, setNota] = useState('');
  const [confirmar, setConfirmar] = useState<string | null>(null);

  const ejecutar = (fn: () => Promise<{ ok: boolean; error?: string }>, despues?: () => void) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? 'Error');
      despues?.();
      router.refresh();
    });
  };

  function registrar(e: React.FormEvent) {
    e.preventDefault();
    const v = Number(valor.replace(',', '.'));
    if (valor.trim() === '' || Number.isNaN(v)) return setError('Escribe el valor medido.');
    ejecutar(() => registrarMedicion({ procesoId, fecha, valor: v, nota: nota || undefined }), () => {
      setValor('');
      setNota('');
    });
  }

  const orden = [...mediciones].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="space-y-3">
      <form onSubmit={registrar} className="no-imprimir flex flex-wrap items-end gap-2 rounded-xl bg-marmol-50 p-3">
        <label className="text-xs font-medium text-marmol-500">
          Fecha
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="campo mt-1 py-1.5" />
        </label>
        <label className="text-xs font-medium text-marmol-500">
          {proceso.indicador} ({proceso.unidad})
          <input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className="campo mt-1 w-32 py-1.5" />
        </label>
        <label className="min-w-[10rem] flex-1 text-xs font-medium text-marmol-500">
          Nota (opcional)
          <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={300} placeholder="Ej. Semana con festivo" className="campo mt-1 py-1.5" />
        </label>
        <button type="submit" disabled={pending} className="boton py-1.5">
          <Plus size={14} /> Registrar
        </button>
      </form>
      {error && <p className="text-sm text-bajo">{error}</p>}
      {orden.length > 0 && (
        <details>
          <summary className="cursor-pointer text-xs font-medium text-marmol-500">Ver las {orden.length} mediciones</summary>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {orden.map((m) => (
                <tr key={m.id} className="border-t border-marmol-100">
                  <td className="py-1.5 text-marmol-600">{formatearFecha(m.fecha)}</td>
                  <td className="text-right font-semibold text-marmol-900">
                    {formatearValor(m.valor, proceso.unidad)} {metaCumplida(proceso, m.valor) && <span title="Meta cumplida">✅</span>}
                  </td>
                  <td className="px-2 text-xs text-marmol-400">{m.nota}</td>
                  <td className="no-imprimir w-20 text-right">
                    {confirmar === m.id ? (
                      <button type="button" disabled={pending} onClick={() => ejecutar(() => eliminarMedicion(procesoId, m.id), () => setConfirmar(null))} className="text-xs font-semibold text-bajo">
                        Borrar
                      </button>
                    ) : (
                      <button type="button" onClick={() => setConfirmar(m.id)} className="text-marmol-300 hover:text-bajo" title="Borrar medición">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}
