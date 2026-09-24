'use client';

import { useState } from 'react';
import { formatearValor, metaCumplida, type ProcesoMinimo } from '@/lib/procesos';
import { formatearFecha } from '@/lib/utils';

const ANCHO = 640;
const ALTO = 240;
const M = { arriba: 16, derecha: 70, abajo: 30, izquierda: 48 };

/**
 * El indicador en el tiempo, con la línea base y la meta como referencia.
 * Una sola serie: el título de la sección la nombra, no lleva leyenda.
 */
export function GraficaIndicador({ proceso, mediciones }: { proceso: ProcesoMinimo; mediciones: { id: string; fecha: string; valor: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const puntos = [...mediciones].sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (puntos.length === 0) {
    return <p className="rounded-lg bg-marmol-50 p-6 text-center text-sm text-marmol-500">Registra la primera medición para ver la evolución del indicador.</p>;
  }

  const refs = [proceso.linea_base, proceso.meta].filter((v): v is number => v != null);
  const valores = [...puntos.map((p) => p.valor), ...refs];
  let min = Math.min(...valores);
  let max = Math.max(...valores);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const margen = (max - min) * 0.1;
  min = Math.max(min >= 0 ? 0 : min - margen, min - margen);
  max += margen;

  const anchoPlot = ANCHO - M.izquierda - M.derecha;
  const altoPlot = ALTO - M.arriba - M.abajo;
  const t0 = new Date(puntos[0]!.fecha).getTime();
  const t1 = new Date(puntos[puntos.length - 1]!.fecha).getTime();
  const x = (fecha: string) => (t1 === t0 ? M.izquierda + anchoPlot / 2 : M.izquierda + ((new Date(fecha).getTime() - t0) / (t1 - t0)) * anchoPlot);
  const y = (v: number) => M.arriba + altoPlot - ((v - min) / (max - min)) * altoPlot;
  const ticks = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);
  const color = '#0f766e';
  const p = hover != null ? puntos[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="h-auto w-full" role="img" aria-label={`${proceso.indicador} en el tiempo`}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={M.izquierda} x2={ANCHO - M.derecha} y1={y(t)} y2={y(t)} stroke="#f2f0ec" strokeWidth={1} />
            <text x={M.izquierda - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-marmol-400 text-[10px]">
              {formatearValor(t)}
            </text>
          </g>
        ))}
        {proceso.linea_base != null && (
          <g>
            <line x1={M.izquierda} x2={ANCHO - M.derecha} y1={y(proceso.linea_base)} y2={y(proceso.linea_base)} stroke="#aca194" strokeWidth={1.5} strokeDasharray="2 4" />
            <text x={ANCHO - M.derecha + 6} y={y(proceso.linea_base)} dominantBaseline="middle" className="fill-marmol-500 text-[10px]">
              Base {formatearValor(proceso.linea_base)}
            </text>
          </g>
        )}
        {proceso.meta != null && (
          <g>
            <line x1={M.izquierda} x2={ANCHO - M.derecha} y1={y(proceso.meta)} y2={y(proceso.meta)} stroke="#15803d" strokeWidth={1.5} strokeDasharray="6 4" />
            <text x={ANCHO - M.derecha + 6} y={y(proceso.meta)} dominantBaseline="middle" className="fill-alto text-[10px] font-semibold">
              Meta {formatearValor(proceso.meta)}
            </text>
          </g>
        )}
        {puntos.length > 1 && (
          <polyline points={puntos.map((m) => `${x(m.fecha)},${y(m.valor)}`).join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}
        {puntos.map((m, i) => (
          <g key={m.id}>
            <circle cx={x(m.fecha)} cy={y(m.valor)} r={hover === i ? 6 : 4.5} fill={metaCumplida(proceso, m.valor) ? '#15803d' : color} stroke="#ffffff" strokeWidth={2} />
            <circle cx={x(m.fecha)} cy={y(m.valor)} r={14} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover((h) => (h === i ? null : i))} />
          </g>
        ))}
        {/* Última medición con su valor escrito. */}
        <text x={x(puntos[puntos.length - 1]!.fecha)} y={y(puntos[puntos.length - 1]!.valor) - 12} textAnchor="middle" className="fill-marmol-800 text-[11px] font-semibold">
          {formatearValor(puntos[puntos.length - 1]!.valor)}
        </text>
        <text x={M.izquierda} y={ALTO - 8} className="fill-marmol-400 text-[10px]">
          {formatearFecha(puntos[0]!.fecha)}
        </text>
        {puntos.length > 1 && (
          <text x={ANCHO - M.derecha} y={ALTO - 8} textAnchor="end" className="fill-marmol-400 text-[10px]">
            {formatearFecha(puntos[puntos.length - 1]!.fecha)}
          </text>
        )}
      </svg>
      {p && (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-lg border border-marmol-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: `${Math.min(70, (x(p.fecha) / ANCHO) * 100)}%` }}
        >
          <p className="font-semibold text-marmol-800">{formatearFecha(p.fecha)}</p>
          <p className="text-marmol-600">
            {proceso.indicador}: <strong className="text-marmol-900">{formatearValor(p.valor, proceso.unidad)}</strong>
          </p>
          {metaCumplida(proceso, p.valor) && <p className="text-alto">✓ Meta cumplida</p>}
        </div>
      )}
    </div>
  );
}
