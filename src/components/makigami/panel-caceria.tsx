'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { alternarCaza } from '@/app/makigami/actions';
import { CAZADORES_PARA_VALIDAR, CLASIFICACIONES, DESPERDICIOS, PUNTOS_MAKIGAMI, TIPOS_DESPERDICIO, formatearDuracion, type TipoDesperdicio } from '@/lib/makigami';
import { cn } from '@/lib/utils';
import type { CarrilVista, Hallazgo, PasoVista } from './tipos';

/**
 * Detalle de un paso + los 8 botones de desperdicio. En fase de cacería cada
 * botón marca/desmarca la caza de quien mira; en las demás fases es solo lectura.
 */
export function PanelCaceria({
  retoId,
  paso,
  numero,
  carril,
  hallazgos,
  miJugadorId,
  puedeCazar,
  onFeedback,
}: {
  retoId: string;
  paso: PasoVista;
  numero: number;
  carril: CarrilVista | undefined;
  hallazgos: Hallazgo[];
  miJugadorId: string | null;
  puedeCazar: boolean;
  onFeedback: (mensaje: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Cambios optimistas mientras el servidor responde (tipo → marcado por mí).
  const [optimista, setOptimista] = useState<Partial<Record<TipoDesperdicio, boolean>>>({});
  useEffect(() => setOptimista({}), [hallazgos]);

  const porTipo = new Map(hallazgos.map((h) => [h.tipo, h]));

  function alternar(tipo: TipoDesperdicio) {
    if (!puedeCazar || !miJugadorId) return;
    const h = porTipo.get(tipo);
    const yaMarcado = optimista[tipo] ?? Boolean(h?.cazas.some((c) => c.jugador_id === miJugadorId));
    setOptimista((o) => ({ ...o, [tipo]: !yaMarcado }));
    setError(null);
    startTransition(async () => {
      const res = await alternarCaza({ retoId, pasoId: paso.id, tipo, comentario: yaMarcado ? undefined : comentario || undefined });
      if (!res.ok) {
        setOptimista((o) => ({ ...o, [tipo]: yaMarcado }));
        return setError(res.error);
      }
      if (res.marcado) {
        const antes = h?.cazas.length ?? 0;
        const d = DESPERDICIOS[tipo];
        if (antes === 0) onFeedback(`${d.emoji} ¡Eres el pionero! Si ${CAZADORES_PARA_VALIDAR - 1} más lo confirman, ganas +${PUNTOS_MAKIGAMI.hallazgoValidado} pts extra.`);
        else if (antes + 1 === CAZADORES_PARA_VALIDAR) onFeedback(`✅ ¡Con tu caza, “${d.nombre}” en el paso ${numero} quedó validado por el equipo!`);
        else onFeedback(`${d.emoji} +${PUNTOS_MAKIGAMI.cazarDesperdicio} pts en juego · confirmaste lo que otros vieron.`);
        setComentario('');
      }
      router.refresh();
    });
  }

  const comentarios = hallazgos.flatMap((h) => h.cazas.filter((c) => c.comentario).map((c) => ({ ...c, tipo: h.tipo })));

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 text-xs text-marmol-500">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secundario text-[10px] font-bold text-white">{numero}</span>
          {carril?.nombre}
          {paso.clasificacion && <span className="ml-auto">{CLASIFICACIONES[paso.clasificacion].nombre}</span>}
        </div>
        <p className="mt-1.5 text-sm font-medium text-marmol-900">{paso.descripcion}</p>
        <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-marmol-500">
          <span>⚙️ {formatearDuracion(paso.tiempo_trabajo_min)} de trabajo</span>
          <span className={paso.tiempo_espera_min >= 1440 ? 'text-bajo font-medium' : ''}>⏳ {formatearDuracion(paso.tiempo_espera_min)} de espera</span>
          {paso.documento_sistema && <span>📎 {paso.documento_sistema}</span>}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-marmol-400 mb-2">
          {puedeCazar ? '¿Qué desperdicio ves aquí? Toca para cazarlo' : 'Desperdicios cazados'}
        </p>
        {puedeCazar && !miJugadorId && <p className="mb-2 text-xs text-medio">Estás viendo como facilitador: los jugadores son quienes cazan.</p>}
        <div className="grid grid-cols-2 gap-1.5">
          {TIPOS_DESPERDICIO.map((tipo) => {
            const d = DESPERDICIOS[tipo];
            const h = porTipo.get(tipo);
            const soyCazador = Boolean(h?.cazas.some((c) => c.jugador_id === miJugadorId));
            const marcado = optimista[tipo] ?? soyCazador;
            const n = (h?.cazas.length ?? 0) + (marcado === soyCazador ? 0 : marcado ? 1 : -1);
            const validado = n >= CAZADORES_PARA_VALIDAR;
            if (!puedeCazar && n === 0) return null;
            return (
              <button
                key={tipo}
                type="button"
                title={d.ejemplo}
                disabled={!puedeCazar || !miJugadorId || pending}
                onClick={() => alternar(tipo)}
                className={cn(
                  'group relative flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-xs transition',
                  marcado ? 'border-bajo bg-red-50 text-bajo font-semibold scale-[1.02]' : 'border-marmol-200 text-marmol-700 hover:border-orange-300 hover:bg-orange-50',
                  'disabled:cursor-default'
                )}
              >
                <span className={cn('text-base transition', marcado && 'animate-pop')}>{d.emoji}</span>
                <span className="leading-tight">{d.nombre}</span>
                {n > 0 && (
                  <span className={cn('ml-auto rounded-full px-1.5 text-[10px] font-bold', validado ? 'bg-bajo text-white' : 'bg-marmol-100 text-marmol-600')}>
                    {validado ? '✓' : ''}
                    {n}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {!puedeCazar && hallazgos.length === 0 && <p className="text-xs text-marmol-400">Nadie cazó desperdicios en este paso.</p>}
        {puedeCazar && miJugadorId && (
          <input
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={500}
            placeholder="¿Por qué? (opcional, se guarda con tu próxima caza)"
            className="mt-2 w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-xs"
          />
        )}
        {error && <p className="mt-1 text-xs text-bajo">{error}</p>}
      </div>

      {hallazgos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-marmol-400">Quién lo vio</p>
          {hallazgos.map((h) => {
            const pionero = h.cazas[0]!;
            return (
              <div key={h.tipo} className="text-xs text-marmol-600">
                <span className="mr-1">{DESPERDICIOS[h.tipo].emoji}</span>
                <strong className="text-marmol-800">{pionero.jugador_nombre}</strong> lo vio primero
                {h.cazas.length > 1 && ` · ${h.cazas.length - 1} ${h.cazas.length === 2 ? 'confirmó' : 'confirmaron'}`}
                {h.validado && <span className="ml-1 rounded bg-red-100 px-1 font-semibold text-bajo">validado</span>}
              </div>
            );
          })}
          {comentarios.length > 0 && (
            <ul className="space-y-1.5 border-t border-marmol-100 pt-2">
              {comentarios.map((c) => (
                <li key={c.id} className="text-xs text-marmol-600">
                  <span className="mr-1">{DESPERDICIOS[c.tipo].emoji}</span>“{c.comentario}” <span className="text-marmol-400">— {c.jugador_nombre}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
