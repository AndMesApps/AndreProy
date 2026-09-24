'use client';

import { useState } from 'react';
import type { MarcadorEquipo } from '@/lib/kaizen';
import { cn } from '@/lib/utils';
import type { EquipoVista } from './tipos';

const ANCHO = 640;
const ALTO = 260;
const M = { arriba: 16, derecha: 96, abajo: 30, izquierda: 40 };

/** Escala "bonita" del eje Y: 0 a un tope redondo con 4 o 5 divisiones. */
function ticksY(max: number) {
  const paso = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000].find((p) => max / p <= 5) ?? Math.ceil(max / 5);
  const tope = Math.max(paso, Math.ceil(max / paso) * paso);
  return Array.from({ length: tope / paso + 1 }, (_, i) => i * paso);
}

/**
 * Curva de mejora: unidades buenas por ronda, una línea por equipo. El color
 * sigue al equipo (orden de creación), nunca a su puesto. Al pasar el dedo o
 * el mouse por una ronda se ven los valores de todos los equipos.
 */
export function GraficaMejora({
  equipos,
  marcadores,
  totalRondas,
  unidad,
  destacadoId,
}: {
  equipos: EquipoVista[];
  marcadores: Map<string, MarcadorEquipo>;
  totalRondas: number;
  unidad: string;
  destacadoId?: string | null;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const series = equipos.map((e) => ({
    equipo: e,
    puntos: (marcadores.get(e.id)?.rondas ?? []).filter((r) => r.resultado).map((r) => ({ ronda: r.ronda, valor: r.resultado!.unidades_buenas })),
  }));
  const hayDatos = series.some((s) => s.puntos.length > 0);
  if (!hayDatos) {
    return <p className="rounded-lg bg-marmol-50 p-6 text-center text-sm text-marmol-500">La curva aparece cuando los equipos registren el resultado de la ronda 1.</p>;
  }

  const max = Math.max(1, ...series.flatMap((s) => s.puntos.map((p) => p.valor)));
  const ticks = ticksY(max);
  const tope = ticks[ticks.length - 1]!;
  const anchoPlot = ANCHO - M.izquierda - M.derecha;
  const altoPlot = ALTO - M.arriba - M.abajo;
  const x = (ronda: number) => M.izquierda + (totalRondas <= 1 ? anchoPlot / 2 : ((ronda - 1) / (totalRondas - 1)) * anchoPlot);
  const y = (v: number) => M.arriba + altoPlot - (v / tope) * altoPlot;
  const etiquetasDirectas = series.length <= 4;

  // Etiquetas al final de cada línea, separadas para que no se monten.
  const finales = series
    .filter((s) => s.puntos.length > 0)
    .map((s) => ({ s, yFinal: y(s.puntos[s.puntos.length - 1]!.valor), ronda: s.puntos[s.puntos.length - 1]!.ronda }))
    .sort((a, b) => a.yFinal - b.yFinal);
  for (let i = 1; i < finales.length; i++) finales[i]!.yFinal = Math.max(finales[i]!.yFinal, finales[i - 1]!.yFinal + 14);

  return (
    <div>
      {/* Leyenda: siempre presente con 2 o más equipos, para no depender solo del color. */}
      {series.length > 1 && (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-marmol-600">
          {series.map(({ equipo }) => (
            <li key={equipo.id} className={cn('inline-flex items-center gap-1.5', destacadoId === equipo.id && 'font-semibold text-marmol-900')}>
              <span className="inline-block h-0.5 w-4 rounded-full" style={{ backgroundColor: equipo.color }} aria-hidden />
              {equipo.emoji} {equipo.nombre}
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="h-auto w-full" role="img" aria-label={`Unidades buenas (${unidad}) por ronda y por equipo`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.izquierda} x2={ANCHO - M.derecha} y1={y(t)} y2={y(t)} stroke="#e4e0d8" strokeWidth={1} />
              <text x={M.izquierda - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-marmol-400 text-[11px]">
                {t}
              </text>
            </g>
          ))}
          {Array.from({ length: totalRondas }, (_, i) => i + 1).map((r) => (
            <text key={r} x={x(r)} y={ALTO - 10} textAnchor="middle" className={cn('text-[11px]', hover === r ? 'fill-marmol-800 font-semibold' : 'fill-marmol-400')}>
              {r === 1 ? 'R1 · base' : `R${r}`}
            </text>
          ))}
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={M.arriba} y2={M.arriba + altoPlot} stroke="#aca194" strokeWidth={1} strokeDasharray="3 3" />}

          {series.map(({ equipo, puntos }) => {
            const atenuado = destacadoId && destacadoId !== equipo.id;
            return (
              <g key={equipo.id} opacity={atenuado ? 0.35 : 1}>
                {puntos.length > 1 && (
                  <polyline
                    points={puntos.map((p) => `${x(p.ronda)},${y(p.valor)}`).join(' ')}
                    fill="none"
                    stroke={equipo.color}
                    strokeWidth={destacadoId === equipo.id ? 3 : 2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
                {puntos.map((p) => (
                  <circle key={p.ronda} cx={x(p.ronda)} cy={y(p.valor)} r={hover === p.ronda ? 5.5 : 4} fill={equipo.color} stroke="#ffffff" strokeWidth={2} />
                ))}
              </g>
            );
          })}

          {etiquetasDirectas &&
            finales.map(({ s, yFinal, ronda }) => (
              <text key={s.equipo.id} x={x(ronda) + 10} y={yFinal} dominantBaseline="middle" className="fill-marmol-700 text-[11px] font-medium">
                {s.equipo.emoji} {s.puntos[s.puntos.length - 1]!.valor}
              </text>
            ))}

          {/* Zonas de contacto por ronda (más grandes que los puntos). */}
          {Array.from({ length: totalRondas }, (_, i) => i + 1).map((r) => (
            <rect
              key={r}
              x={x(r) - anchoPlot / Math.max(1, totalRondas - 1) / 2}
              y={M.arriba}
              width={anchoPlot / Math.max(1, totalRondas - 1)}
              height={altoPlot}
              fill="transparent"
              onMouseEnter={() => setHover(r)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setHover((h) => (h === r ? null : r))}
            />
          ))}
        </svg>

        {hover != null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[10rem] rounded-lg border border-marmol-200 bg-white px-3 py-2 text-xs shadow-lg"
            style={{ left: `${Math.min(70, (x(hover) / ANCHO) * 100)}%` }}
          >
            <p className="mb-1 font-semibold text-marmol-800">Ronda {hover}{hover === 1 ? ' (línea base)' : ''}</p>
            {series
              .map(({ equipo }) => ({ equipo, r: marcadores.get(equipo.id)?.rondas.find((x) => x.ronda === hover) }))
              .filter(({ r }) => r?.resultado)
              .sort((a, b) => b.r!.resultado!.unidades_buenas - a.r!.resultado!.unidades_buenas)
              .map(({ equipo, r }) => (
                <p key={equipo.id} className="flex items-center gap-1.5 text-marmol-600">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: equipo.color }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">
                    {equipo.emoji} {equipo.nombre}
                  </span>
                  <strong className="text-marmol-900">{r!.resultado!.unidades_buenas}</strong>
                  {r!.mejoraPct != null && (
                    <span className={cn('w-12 text-right', r!.mejoraPct > 0 ? 'text-alto' : r!.mejoraPct < 0 ? 'text-bajo' : 'text-marmol-400')}>
                      {r!.mejoraPct > 0 ? '▲' : r!.mejoraPct < 0 ? '▼' : '='} {Math.abs(Math.round(r!.mejoraPct))}%
                    </span>
                  )}
                </p>
              ))}
          </div>
        )}
      </div>
      <p className="mt-1 text-[11px] text-marmol-400">
        Unidades con calidad ({unidad}) por ronda. Toca o pasa el mouse sobre una ronda para ver el detalle.
      </p>
    </div>
  );
}
