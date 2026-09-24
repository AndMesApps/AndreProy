'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { guardarTarjeta } from '@/app/kaizen/actions';
import { tarjetaCompleta } from '@/lib/kaizen';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { ResultadoVista, TarjetaVista } from './tipos';

const PREGUNTAS_PORQUE = ['¿Por qué pasó?', '¿Y eso por qué?', '¿Y por qué?', '¿Por qué?', '¿Por qué? (la causa raíz)'];

/**
 * Tarjeta Kaizen de la fase Planear: problema → 5 porqués → una idea →
 * predicción. Hay una sola tarjeta por equipo y ronda; si otro compañero la
 * guarda, se actualiza aquí mientras no se esté escribiendo.
 */
export function TarjetaKaizen({
  sesionId,
  equipoId,
  ronda,
  tarjeta,
  anterior,
  unidad,
  editable,
}: {
  sesionId: string;
  equipoId: string;
  ronda: number;
  tarjeta: TarjetaVista | undefined;
  anterior: ResultadoVista | undefined;
  unidad: string;
  editable: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [guardada, setGuardada] = useState(false);
  const [sucio, setSucio] = useState(false);

  const desde = (t: TarjetaVista | undefined) => ({
    problema: t?.problema ?? '',
    porques: [0, 1, 2, 3, 4].map((i) => t?.porques[i] ?? ''),
    idea: t?.idea ?? '',
    prediccion: t?.prediccion != null ? String(t.prediccion) : '',
  });
  const [datos, setDatos] = useState(() => desde(tarjeta));

  // Trae lo que guardó un compañero, salvo que yo esté escribiendo.
  const huella = JSON.stringify(tarjeta ? [tarjeta.problema, tarjeta.porques, tarjeta.idea, tarjeta.prediccion] : null);
  useEffect(() => {
    if (!sucio) setDatos(desde(tarjeta));
  }, [huella]);

  const cambiar = (cambio: Partial<typeof datos>) => {
    setDatos((d) => ({ ...d, ...cambio }));
    setSucio(true);
    setGuardada(false);
  };

  // Muestra solo los porqués que ya se están usando, más uno vacío (hasta 5).
  const usados = datos.porques.reduce((n, p, i) => (p.trim() ? i + 1 : n), 0);
  const visibles = Math.min(5, Math.max(1, usados + 1));

  const prediccion = datos.prediccion.trim() === '' ? null : Number(datos.prediccion);
  const completa = tarjetaCompleta({ problema: datos.problema, porques: datos.porques, idea: datos.idea, prediccion });

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (prediccion != null && (!Number.isInteger(prediccion) || prediccion < 0)) return setError('La predicción es un número entero de unidades.');
    startTransition(async () => {
      const res = await guardarTarjeta({
        sesionId,
        equipoId,
        ronda,
        problema: datos.problema,
        porques: datos.porques.map((p) => p.trim()).filter(Boolean),
        idea: datos.idea,
        prediccion,
      });
      if (!res.ok) return setError(res.error);
      setSucio(false);
      setGuardada(true);
      router.refresh();
    });
  }

  if (!editable) {
    if (!tarjeta) return <p className="rounded-lg bg-marmol-50 p-3 text-sm text-marmol-500">Tu equipo no llenó tarjeta Kaizen en esta ronda.</p>;
    return <ResumenTarjeta tarjeta={tarjeta} unidad={unidad} />;
  }

  return (
    <form onSubmit={guardar} className="space-y-3">
      {anterior && (
        <p className="rounded-lg bg-marmol-50 px-3 py-2 text-xs text-marmol-600">
          En la ronda {ronda - 1} hicieron <strong className="text-marmol-800">{anterior.unidades_buenas} {unidad} con calidad</strong> y {anterior.defectos}{' '}
          con defecto. ¿Qué los frenó?
        </p>
      )}
      <label className="block text-sm font-medium text-marmol-700">
        1. ¿Cuál es el problema?
        <textarea
          value={datos.problema}
          onChange={(e) => cambiar({ problema: e.target.value })}
          rows={2}
          maxLength={500}
          placeholder="Ej. Nos demoramos mucho doblando las alas y varias quedan torcidas."
          className="campo mt-1 font-normal"
        />
      </label>
      <fieldset>
        <legend className="text-sm font-medium text-marmol-700">2. Los 5 porqués: busquen la causa raíz</legend>
        <div className="mt-1 space-y-1.5">
          {PREGUNTAS_PORQUE.slice(0, visibles).map((pregunta, i) => (
            <label key={i} className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-xs text-marmol-500 sm:w-40">{pregunta}</span>
              <input
                value={datos.porques[i]}
                onChange={(e) => cambiar({ porques: datos.porques.map((p, j) => (j === i ? e.target.value : p)) })}
                maxLength={300}
                className="campo py-1.5"
              />
            </label>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-marmol-400">Con 3 porqués ya suele aparecer la causa de fondo. Paren cuando la respuesta sea algo que ustedes pueden cambiar.</p>
      </fieldset>
      <label className="block text-sm font-medium text-marmol-700">
        3. Nuestra idea de mejora (una sola)
        <textarea
          value={datos.idea}
          onChange={(e) => cambiar({ idea: e.target.value })}
          rows={2}
          maxLength={500}
          placeholder="Ej. Usar una plantilla de cartón para marcar los dobleces."
          className="campo mt-1 font-normal"
        />
      </label>
      <label className="block text-sm font-medium text-marmol-700">
        4. Predicción: ¿cuántos {unidad} con calidad harán con esta idea?
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={datos.prediccion}
          onChange={(e) => cambiar({ prediccion: e.target.value })}
          className="campo mt-1 max-w-[10rem] font-normal"
        />
      </label>

      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex flex-wrap items-center gap-3 border-t border-marmol-100 pt-3">
        <button type="submit" disabled={pending || !sucio} className="boton">
          {pending ? 'Guardando…' : 'Guardar tarjeta'}
        </button>
        {guardada && !sucio && (
          <span className="inline-flex items-center gap-1 text-xs text-alto">
            <Check size={13} /> Guardada
          </span>
        )}
        <span className={cn('text-xs', completa ? 'text-alto' : 'text-marmol-400')}>
          {completa ? '🧠 Tarjeta completa: +10 puntos' : 'Completa: problema, 3 porqués, idea y predicción = +10 puntos'}
        </span>
      </div>
      <p className="text-[11px] text-marmol-400">Hay una sola tarjeta por equipo: pónganse de acuerdo y que una persona la escriba.</p>
    </form>
  );
}

export function ResumenTarjeta({ tarjeta, unidad, compacto = false }: { tarjeta: TarjetaVista; unidad: string; compacto?: boolean }) {
  const porques = tarjeta.porques.filter((p) => p.trim());
  return (
    <div className={cn('space-y-1.5 text-sm', compacto && 'text-xs')}>
      {tarjeta.problema && (
        <p>
          <span className="font-semibold text-marmol-700">Problema:</span> <span className="text-marmol-600">{tarjeta.problema}</span>
        </p>
      )}
      {porques.length > 0 && (
        <div>
          <span className="font-semibold text-marmol-700">Porqués:</span>
          <ol className="ml-5 list-decimal text-marmol-600">
            {porques.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </div>
      )}
      {tarjeta.idea && (
        <p>
          <span className="font-semibold text-marmol-700">💡 Idea:</span> <span className="text-marmol-800">{tarjeta.idea}</span>
        </p>
      )}
      {tarjeta.prediccion != null && (
        <p>
          <span className="font-semibold text-marmol-700">🎯 Predicción:</span>{' '}
          <span className="text-marmol-600">
            {tarjeta.prediccion} {unidad} con calidad
          </span>
        </p>
      )}
    </div>
  );
}
