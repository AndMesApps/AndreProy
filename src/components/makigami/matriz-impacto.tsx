'use client';

import { NIVELES_COMPLEJIDAD, NIVELES_IMPACTO, ZONAS_MATRIZ, zonaPropuesta, type NivelMatriz } from '@/lib/makigami';
import { cn } from '@/lib/utils';

const TAM = 220;
const PAD = 26;

/** Coordenada del punto dentro del lienzo, con un pequeño jitter determinista para separar puntos repetidos. */
function ubicar(impacto: number, complejidad: number, salt: number) {
  const jitter = (n: number) => ((Math.sin(n * 12.9898) * 43758.5453) % 1) * 14 - 7;
  const x = PAD + ((complejidad - 1) / 2) * (TAM - 2 * PAD) + jitter(salt);
  const y = PAD + ((3 - impacto) / 2) * (TAM - 2 * PAD) + jitter(salt + 1);
  return { x, y };
}

/**
 * Matriz de calor impacto × complejidad de las propuestas de mejora (idea de
 * la hoja "Cuadro de Priorización" del formato Makigami de la consultora):
 * cada propuesta calificada se ubica sola en su cuadrante. El verde (alto
 * impacto, fácil) es lo que se puede arreglar ya con lo que se tiene.
 */
export function MatrizImpacto({
  propuestas,
  numeroDePaso,
  seleccionadaId,
  onSeleccionar,
}: {
  propuestas: { id: string; descripcion: string; impacto: number; complejidad: number; paso_id: string | null; estado: string }[];
  numeroDePaso?: Map<string, number>;
  seleccionadaId?: string | null;
  onSeleccionar?: (id: string) => void;
}) {
  if (propuestas.length === 0) {
    return <p className="text-sm text-marmol-400">Todavía no hay propuestas calificadas para ubicar en la matriz.</p>;
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="shrink-0">
        <svg width={TAM} height={TAM} viewBox={`0 0 ${TAM} ${TAM}`} role="img" aria-label="Matriz de impacto y complejidad">
          {/* Fondo: 4 cuadrantes según la regla de zonaPropuesta (corte en complejidad=1 e impacto=2). */}
          <rect x={0} y={0} width={(TAM * 1) / 3} height={(TAM * 2) / 3} fill="#f0fdf4" />
          <rect x={(TAM * 1) / 3} y={0} width={(TAM * 2) / 3} height={(TAM * 2) / 3} fill="#fffbeb" />
          <rect x={0} y={(TAM * 2) / 3} width={(TAM * 1) / 3} height={(TAM * 1) / 3} fill="#eff6ff" />
          <rect x={(TAM * 1) / 3} y={(TAM * 2) / 3} width={(TAM * 2) / 3} height={(TAM * 1) / 3} fill="#f5f5f4" />
          <line x1={(TAM * 1) / 3} y1={0} x2={(TAM * 1) / 3} y2={TAM} stroke="#d6d3d1" strokeWidth={1} />
          <line x1={0} y1={(TAM * 2) / 3} x2={TAM} y2={(TAM * 2) / 3} stroke="#d6d3d1" strokeWidth={1} />
          <rect x={0.5} y={0.5} width={TAM - 1} height={TAM - 1} fill="none" stroke="#d6d3d1" strokeWidth={1} />

          {propuestas.map((p, i) => {
            const zona = ZONAS_MATRIZ[zonaPropuesta(p.impacto, p.complejidad)];
            const { x, y } = ubicar(p.impacto, p.complejidad, i + (p.id.charCodeAt(0) || 0));
            const seleccionada = p.id === seleccionadaId;
            const numero = p.paso_id ? numeroDePaso?.get(p.paso_id) : null;
            return (
              <g
                key={p.id}
                transform={`translate(${x} ${y})`}
                onClick={() => onSeleccionar?.(p.id)}
                className={onSeleccionar ? 'cursor-pointer' : undefined}
              >
                <title>
                  {zona.emoji} {zona.nombre}
                  {numero ? ` · Paso ${numero}` : ''}: {p.descripcion}
                </title>
                <circle
                  r={seleccionada ? 9 : 7}
                  fill={zona.punto}
                  fillOpacity={p.estado === 'descartada' ? 0.3 : 0.85}
                  stroke="white"
                  strokeWidth={seleccionada ? 2.5 : 1.5}
                />
                {numero && (
                  <text textAnchor="middle" dy={3} fontSize={8} fontWeight={700} fill="white">
                    {numero}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="mt-1 flex items-center justify-between text-[10px] text-marmol-400">
          <span>← Fácil</span>
          <span>Complejidad →</span>
          <span>Difícil →</span>
        </div>
      </div>

      <div className="min-w-[12rem] flex-1 space-y-1.5 text-xs">
        {(Object.keys(ZONAS_MATRIZ) as (keyof typeof ZONAS_MATRIZ)[]).map((z) => {
          const zona = ZONAS_MATRIZ[z];
          const enZona = propuestas.filter((p) => zonaPropuesta(p.impacto, p.complejidad) === z && p.estado !== 'descartada');
          return (
            <div key={z} className={cn('rounded-lg px-2 py-1.5 ring-1', zona.tono)}>
              <p className="font-semibold">
                {zona.emoji} {zona.nombre} <span className="font-normal opacity-70">· {enZona.length}</span>
              </p>
              <p className="opacity-80">{zona.descripcion}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const OPCIONES_NIVEL: NivelMatriz[] = [1, 2, 3];
export { NIVELES_COMPLEJIDAD, NIVELES_IMPACTO };
