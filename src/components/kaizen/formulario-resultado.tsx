'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { guardarResultado } from '@/app/kaizen/actions';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { ResultadoVista } from './tipos';

/**
 * Registro de la fase Verificar: unidades buenas y defectuosas de la ronda.
 * `compacto` es la versión en línea de la tabla del facilitador.
 */
export function FormularioResultado({
  sesionId,
  equipoId,
  ronda,
  resultado,
  unidad,
  compacto = false,
}: {
  sesionId: string;
  equipoId: string;
  ronda: number;
  resultado: ResultadoVista | undefined;
  unidad: string;
  compacto?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [buenas, setBuenas] = useState(resultado ? String(resultado.unidades_buenas) : '');
  const [defectos, setDefectos] = useState(resultado ? String(resultado.defectos) : '');
  const [sucio, setSucio] = useState(false);

  // Si otro (compañero o facilitador) corrige el resultado, se ve aquí mientras no se esté escribiendo.
  const huella = resultado ? `${resultado.unidades_buenas}/${resultado.defectos}` : '';
  useEffect(() => {
    if (sucio) return;
    setBuenas(resultado ? String(resultado.unidades_buenas) : '');
    setDefectos(resultado ? String(resultado.defectos) : '');
  }, [huella]);

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const b = Number(buenas);
    const d = defectos.trim() === '' ? 0 : Number(defectos);
    if (buenas.trim() === '' || !Number.isInteger(b) || b < 0 || !Number.isInteger(d) || d < 0) return setError('Escribe números enteros, 0 o más.');
    startTransition(async () => {
      const res = await guardarResultado({ sesionId, equipoId, ronda, unidadesBuenas: b, defectos: d });
      if (!res.ok) return setError(res.error);
      setSucio(false);
      router.refresh();
    });
  }

  const guardado = Boolean(resultado) && !sucio;

  if (compacto) {
    return (
      <form onSubmit={guardar} className="flex items-center gap-1">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={buenas}
          onChange={(e) => (setBuenas(e.target.value), setSucio(true))}
          aria-label="Unidades buenas"
          title="Unidades buenas"
          className="w-14 rounded border border-marmol-200 px-1.5 py-0.5 text-center text-xs"
        />
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={defectos}
          onChange={(e) => (setDefectos(e.target.value), setSucio(true))}
          aria-label="Defectos"
          title="Defectos"
          className="w-12 rounded border border-marmol-200 px-1.5 py-0.5 text-center text-xs text-bajo"
        />
        {sucio && (
          <button type="submit" disabled={pending} className="text-marca-600" title="Guardar">
            <Check size={15} />
          </button>
        )}
        {error && <span className="text-[10px] text-bajo">{error}</span>}
      </form>
    );
  }

  return (
    <form onSubmit={guardar} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium text-marmol-700">
          ✅ Con calidad ({unidad})
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={buenas}
            onChange={(e) => (setBuenas(e.target.value), setSucio(true))}
            className="campo mt-1 text-center font-display text-2xl font-bold text-alto"
          />
        </label>
        <label className="block text-sm font-medium text-marmol-700">
          ❌ Con defecto
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={defectos}
            onChange={(e) => (setDefectos(e.target.value), setSucio(true))}
            placeholder="0"
            className="campo mt-1 text-center font-display text-2xl font-bold text-bajo"
          />
        </label>
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending || !sucio} className="boton">
          {pending ? 'Guardando…' : guardado ? 'Corregir resultado' : 'Registrar resultado'}
        </button>
        <span className={cn('inline-flex items-center gap-1 text-xs', guardado ? 'text-alto' : 'text-marmol-400')}>
          {guardado ? (
            <>
              <Check size={13} /> Registrado
            </>
          ) : (
            'Cuenten con el criterio de calidad antes de registrar.'
          )}
        </span>
      </div>
    </form>
  );
}
