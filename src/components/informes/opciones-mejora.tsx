'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { enviarAlPlan } from '@/app/procesos/actions';
import { PRIORIDADES, type Recomendacion } from '@/lib/recomendaciones';
import { cn } from '@/lib/utils';
import { Check, Send } from 'lucide-react';

export interface ProcesoOpcion {
  id: string;
  nombre: string;
  cliente: string | null;
}

/**
 * Opciones de mejora del informe. El facilitador marca las que quiere y las
 * envía al plan de acción de un proceso del Control de procesos.
 */
export function OpcionesMejora({
  recomendaciones,
  juego,
  juegoId,
  procesos,
  procesoActualId,
  enviadas,
}: {
  recomendaciones: Recomendacion[];
  juego: 'makigami' | 'kaizen' | 'cincos' | 'mudalab' | 'riesgo';
  juegoId: string;
  procesos: ProcesoOpcion[];
  procesoActualId: string | null;
  /** refs de las recomendaciones que ya están en el plan del proceso actual. */
  enviadas: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [procesoId, setProcesoId] = useState(procesoActualId ?? procesos[0]?.id ?? '');
  const yaEnviadas = new Set(procesoId === procesoActualId ? enviadas : []);
  const [marcadas, setMarcadas] = useState<Set<string>>(() => new Set(recomendaciones.filter((r) => r.prioridad !== 'baja' && !enviadas.includes(r.ref)).map((r) => r.ref)));
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  const alternar = (ref: string) =>
    setMarcadas((m) => {
      const n = new Set(m);
      if (n.has(ref)) n.delete(ref);
      else n.add(ref);
      return n;
    });

  const aEnviar = recomendaciones.filter((r) => marcadas.has(r.ref) && !yaEnviadas.has(r.ref));

  function enviar() {
    setMensaje(null);
    startTransition(async () => {
      const res = await enviarAlPlan({
        procesoId,
        juego,
        juegoId,
        items: aEnviar.map((r) => ({ ref: r.ref, titulo: r.titulo.slice(0, 200), detalle: [r.detalle, r.herramienta && `Herramienta sugerida: ${r.herramienta}.`].filter(Boolean).join('\n') })),
      });
      if (!res.ok) return setMensaje({ ok: false, texto: res.error });
      setMensaje({
        ok: true,
        texto: `${res.agregadas} ${res.agregadas === 1 ? 'acción agregada' : 'acciones agregadas'} al plan${res.repetidas ? ` (${res.repetidas} ya estaban)` : ''}.`,
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {recomendaciones.map((r, i) => {
          const enPlan = yaEnviadas.has(r.ref);
          return (
            <li key={r.ref} className="flex gap-3 rounded-xl border border-marmol-200 p-3">
              <label className="no-imprimir mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={enPlan || marcadas.has(r.ref)}
                  disabled={enPlan}
                  onChange={() => alternar(r.ref)}
                  aria-label={`Enviar «${r.titulo}» al plan de acción`}
                />
              </label>
              <span className="w-5 shrink-0 font-display text-sm font-bold text-marmol-400">{i + 1}.</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-marmol-800">{r.titulo}</p>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', PRIORIDADES[r.prioridad].clase)}>{PRIORIDADES[r.prioridad].nombre}</span>
                  {enPlan && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-marca-100 px-2 py-0.5 text-[10px] font-semibold text-marca-700">
                      <Check size={10} /> En el plan de acción
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-marmol-600">{r.detalle}</p>
                {r.herramienta && <p className="mt-1 text-xs text-marca-700">🧰 Herramienta sugerida: {r.herramienta}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="no-imprimir rounded-xl bg-marmol-50 p-3">
        <p className="text-sm font-semibold text-marmol-800">📋 Llevar al plan de acción</p>
        {procesos.length === 0 ? (
          <p className="mt-1 text-sm text-marmol-600">
            Aún no tienes procesos en el Control de procesos.{' '}
            <Link href="/procesos" className="font-semibold text-marca-600 hover:underline">
              Crea el proceso de este cliente
            </Link>{' '}
            y vuelve a este informe para enviar las mejoras.
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select value={procesoId} onChange={(e) => setProcesoId(e.target.value)} className="campo max-w-xs py-1.5" aria-label="Proceso">
              {procesos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                  {p.cliente ? ` · ${p.cliente}` : ''}
                </option>
              ))}
            </select>
            <button type="button" disabled={pending || aEnviar.length === 0 || !procesoId} onClick={enviar} className="boton">
              <Send size={14} /> {pending ? 'Enviando…' : `Enviar ${aEnviar.length} ${aEnviar.length === 1 ? 'mejora' : 'mejoras'}`}
            </button>
            {procesoActualId && (
              <Link href={`/procesos/${procesoActualId}`} className="text-xs font-semibold text-marca-600 hover:underline">
                Ver el plan de acción →
              </Link>
            )}
          </div>
        )}
        {mensaje && <p className={cn('mt-2 text-sm', mensaje.ok ? 'text-alto' : 'text-bajo')}>{mensaje.texto}</p>}
      </div>
    </div>
  );
}
