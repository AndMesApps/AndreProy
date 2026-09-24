'use client';

import { useState } from 'react';
import { formatearPct, type MarcadorEquipo } from '@/lib/kaizen';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import type { EquipoVista } from './tipos';

const MEDALLAS = ['🥇', '🥈', '🥉'];

/** Ranking de equipos por puntos, con el desglose de cada ronda al tocar la fila. */
export function Marcador({
  equipos,
  marcadores,
  miEquipoId,
  final,
}: {
  equipos: EquipoVista[];
  marcadores: Map<string, MarcadorEquipo>;
  miEquipoId: string | null;
  final: boolean;
}) {
  const [abierto, setAbierto] = useState<string | null>(null);
  const filas = equipos
    .map((e) => ({ equipo: e, m: marcadores.get(e.id)! }))
    .filter((f) => f.m)
    .sort((a, b) => b.m.total - a.m.total || (b.m.mejoraTotalPct ?? -1e9) - (a.m.mejoraTotalPct ?? -1e9));

  if (filas.length === 0) return <p className="text-sm text-marmol-500">Todavía no hay equipos.</p>;

  return (
    <div className="space-y-1.5">
      {filas.map(({ equipo, m }, i) => {
        const conPuntos = m.rondas.filter((r) => r.total > 0 || r.resultado);
        return (
          <div key={equipo.id} className={cn('rounded-xl border', miEquipoId === equipo.id ? 'border-marca-300 bg-marca-50/60' : 'border-marmol-200')}>
            <button type="button" onClick={() => setAbierto((a) => (a === equipo.id ? null : equipo.id))} className="flex w-full items-center gap-2 px-3 py-2 text-left">
              <span className="w-6 text-center text-lg">{m.total > 0 && MEDALLAS[i] ? MEDALLAS[i] : <span className="text-sm text-marmol-400">{i + 1}</span>}</span>
              <span className="text-xl">{equipo.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-marmol-800">{equipo.nombre}</span>
                <span className="text-[11px] text-marmol-500">
                  {m.lineaBase != null ? (
                    <>
                      {m.lineaBase} → {m.ultima} ·{' '}
                      <span className={cn((m.mejoraTotalPct ?? 0) > 0 ? 'text-alto' : (m.mejoraTotalPct ?? 0) < 0 ? 'text-bajo' : '')}>{formatearPct(m.mejoraTotalPct)} vs. base</span>
                      {m.estandares.length > 0 && ` · ${m.estandares.length} ${m.estandares.length === 1 ? 'estándar' : 'estándares'}`}
                    </>
                  ) : (
                    'Sin resultados todavía'
                  )}
                </span>
              </span>
              <span className="text-right">
                <span className="block font-display text-xl font-bold text-secundario">{m.total}</span>
                <span className="text-[10px] text-marmol-400">{final ? 'puntos finales' : 'puntos'}</span>
              </span>
              <ChevronDown size={14} className={cn('shrink-0 text-marmol-400 transition', abierto === equipo.id && 'rotate-180')} />
            </button>
            {abierto === equipo.id && (
              <div className="overflow-x-auto border-t border-marmol-100 px-3 py-2">
                {conPuntos.length === 0 ? (
                  <p className="text-xs text-marmol-400">Aún no hay rondas jugadas.</p>
                ) : (
                  <table className="w-full text-[11px]">
                    <thead className="text-marmol-400">
                      <tr>
                        <th className="py-1 text-left font-medium">Ronda</th>
                        <th className="font-medium" title="Unidades con calidad">Uds.</th>
                        <th className="font-medium" title="Mejora frente a la ronda anterior">📈</th>
                        <th className="font-medium" title="Acierto de la predicción">🎯</th>
                        <th className="font-medium" title="Tarjeta completa">🧠</th>
                        <th className="font-medium" title="Decisión coherente">✅</th>
                        <th className="font-medium" title="Cero defectos">💎</th>
                        <th className="text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-center text-marmol-600">
                      {conPuntos.map((r) => (
                        <tr key={r.ronda} className="border-t border-marmol-100">
                          <td className="py-1 text-left">R{r.ronda}</td>
                          <td>{r.resultado?.unidades_buenas ?? '—'}</td>
                          <td>{r.mejora || '·'}</td>
                          <td>{r.prediccion || '·'}</td>
                          <td>{r.tarjetaCompleta || '·'}</td>
                          <td>{r.decision || '·'}</td>
                          <td>{r.calidad || '·'}</td>
                          <td className="text-right font-semibold text-marmol-800">{r.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
