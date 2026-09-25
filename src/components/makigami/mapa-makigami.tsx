'use client';

import { useEffect, useState } from 'react';
import { CLASIFICACIONES, DESPERDICIOS, formatearDuracion, type TipoDesperdicio } from '@/lib/makigami';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import type { CarrilVista, Hallazgo, PasoVista } from './tipos';

// Geometría fija: permite calcular los conectores SVG sin medir el DOM. En
// celular se usa una versión compacta para que quepan carril + ~1.5 pasos.
const GEOMETRIA = {
  normal: { LABEL_W: 148, COL_W: 184, ROW_H: 138 },
  compacta: { LABEL_W: 84, COL_W: 158, ROW_H: 128 },
};
const HEADER_H = 30;
const PAD = 10;
const FILA_ANALISIS_H = 30;

function useEsCelular() {
  const [celular, setCelular] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const actualizar = () => setCelular(mq.matches);
    actualizar();
    mq.addEventListener('change', actualizar);
    return () => mq.removeEventListener('change', actualizar);
  }, []);
  return celular;
}

const TONO_CLASIFICACION: Record<string, string> = {
  agrega_valor: 'bg-marca-100 text-marca-700',
  necesaria: 'bg-amber-100 text-medio',
  desperdicio: 'bg-red-100 text-bajo',
};

/** Nivel de calor 0-4 según cuántas cazas tiene el paso frente al más cazado. */
function nivelCalor(total: number, max: number) {
  if (total === 0 || max === 0) return 0;
  return Math.max(1, Math.ceil((total / max) * 4));
}

const SOMBRA_CALOR = [
  '',
  '0 0 0 2px rgba(251,191,36,.45)',
  '0 0 0 3px rgba(249,115,22,.45), 0 0 14px rgba(249,115,22,.25)',
  '0 0 0 3px rgba(239,68,68,.55), 0 0 18px rgba(239,68,68,.3)',
  '0 0 0 4px rgba(220,38,38,.7), 0 0 26px rgba(220,38,38,.45)',
];

export function MapaMakigami({
  carriles,
  pasos,
  hallazgosPorPaso,
  seleccionadoId,
  onSeleccionar,
  pasosAtenuados,
  mostrarCalor,
  onAgregarPaso,
}: {
  carriles: CarrilVista[];
  pasos: PasoVista[];
  hallazgosPorPaso: Map<string, Hallazgo[]>;
  seleccionadoId: string | null;
  onSeleccionar: (pasoId: string) => void;
  pasosAtenuados?: Set<string>;
  mostrarCalor: boolean;
  /** Solo en fase de mapeo: muestra una columna extra con "+" por carril. */
  onAgregarPaso?: (carrilId: string) => void;
}) {
  const celular = useEsCelular();
  const { LABEL_W, COL_W, ROW_H } = celular ? GEOMETRIA.compacta : GEOMETRIA.normal;
  const filaDeCarril = new Map(carriles.map((c, i) => [c.id, i]));
  const columnas = pasos.length + (onAgregarPaso ? 1 : 0);
  const ancho = LABEL_W + columnas * COL_W;
  const altoCarriles = carriles.length * ROW_H;

  const totales = pasos.map((p) => (hallazgosPorPaso.get(p.id) ?? []).reduce((s, h) => s + h.cazas.length, 0));
  const maxCazas = Math.max(0, ...totales);

  const centro = (col: number, fila: number) => ({
    x: LABEL_W + col * COL_W,
    y: HEADER_H + fila * ROW_H + ROW_H / 2,
  });

  // Conectores entre pasos consecutivos; los traspasos (cambio de carril) van punteados en ámbar.
  const conectores = pasos.slice(1).map((p, idx) => {
    const anterior = pasos[idx]!;
    const fa = filaDeCarril.get(anterior.carril_id) ?? 0;
    const fb = filaDeCarril.get(p.carril_id) ?? 0;
    const a = centro(idx, fa);
    const b = centro(idx + 1, fb);
    const x1 = a.x + COL_W - PAD;
    const x2 = b.x + PAD;
    const mid = (x1 + x2) / 2;
    const traspaso = fa !== fb;
    const d = traspaso ? `M ${x1} ${a.y} H ${mid} V ${b.y} H ${x2 - 2}` : `M ${x1} ${a.y} H ${x2 - 2}`;
    return { id: p.id, d, traspaso };
  });

  if (carriles.length === 0) {
    return (
      <div className="card p-10 text-center text-sm text-marmol-400">
        Todavía no hay carriles. Agrega los roles o áreas que participan en el proceso para empezar a dibujarlo.
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <div
        className="relative grid"
        style={{
          width: ancho,
          gridTemplateColumns: `${LABEL_W}px repeat(${columnas}, ${COL_W}px)`,
          gridTemplateRows: `${HEADER_H}px repeat(${carriles.length}, ${ROW_H}px) repeat(2, ${FILA_ANALISIS_H}px)`,
        }}
      >
        {/* Encabezado: número de paso */}
        <div className="sticky left-0 z-20 bg-white border-b border-marmol-200" style={{ gridColumn: 1, gridRow: 1 }} />
        {pasos.map((p, i) => (
          <div
            key={`h-${p.id}`}
            className="flex items-center justify-center text-[11px] font-medium uppercase tracking-wide text-marmol-400 border-b border-marmol-200"
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            Paso {i + 1}
          </div>
        ))}

        {/* Fondo de cada carril + etiqueta fija a la izquierda */}
        {carriles.map((c, i) => (
          <div
            key={`bg-${c.id}`}
            className={cn('border-b border-marmol-100', i % 2 === 0 ? 'bg-marmol-50/60' : 'bg-white')}
            style={{ gridColumn: '1 / -1', gridRow: i + 2 }}
          />
        ))}
        {carriles.map((c, i) => (
          <div
            key={`l-${c.id}`}
            className={cn(
              'sticky left-0 z-20 flex items-center px-2 sm:px-3 border-r border-b border-marmol-200 text-xs sm:text-sm font-semibold text-secundario break-words',
              i % 2 === 0 ? 'bg-marmol-50' : 'bg-white'
            )}
            style={{ gridColumn: 1, gridRow: i + 2 }}
          >
            {c.nombre}
          </div>
        ))}

        {/* Conectores */}
        <svg className="absolute left-0 top-0 pointer-events-none z-0" width={ancho} height={HEADER_H + altoCarriles} aria-hidden>
          <defs>
            <marker id="mk-flecha" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#8a7f70" />
            </marker>
            <marker id="mk-flecha-traspaso" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#d97706" />
            </marker>
          </defs>
          {conectores.map((c) => (
            <path
              key={c.id}
              d={c.d}
              fill="none"
              stroke={c.traspaso ? '#d97706' : '#aca194'}
              strokeWidth={c.traspaso ? 2 : 1.5}
              strokeDasharray={c.traspaso ? '5 4' : undefined}
              markerEnd={c.traspaso ? 'url(#mk-flecha-traspaso)' : 'url(#mk-flecha)'}
            />
          ))}
        </svg>

        {/* Tarjetas de paso */}
        {pasos.map((p, i) => {
          const fila = filaDeCarril.get(p.carril_id) ?? 0;
          const hallazgos = [...(hallazgosPorPaso.get(p.id) ?? [])].sort((a, b) => b.cazas.length - a.cazas.length);
          const total = totales[i] ?? 0;
          const nivel = mostrarCalor ? nivelCalor(total, maxCazas) : 0;
          const atenuado = pasosAtenuados?.has(p.id);
          const seleccionado = p.id === seleccionadoId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSeleccionar(p.id)}
              className={cn(
                'relative z-10 m-2.5 flex flex-col rounded-lg border bg-white p-2 text-left transition hover:-translate-y-0.5 hover:shadow-md',
                seleccionado ? 'border-marca-500 ring-2 ring-marca-300' : 'border-marmol-200',
                atenuado && 'opacity-35 grayscale'
              )}
              style={{ gridColumn: i + 2, gridRow: fila + 2, boxShadow: seleccionado ? undefined : SOMBRA_CALOR[nivel] }}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secundario text-[10px] font-bold text-white">{i + 1}</span>
                {p.clasificacion && (
                  <span className={cn('rounded px-1 text-[10px] font-semibold', TONO_CLASIFICACION[p.clasificacion])} title={CLASIFICACIONES[p.clasificacion].nombre}>
                    {CLASIFICACIONES[p.clasificacion].corto}
                  </span>
                )}
                {mostrarCalor && total > 0 && (
                  <span className={cn('ml-auto text-[11px] font-semibold', nivel >= 3 ? 'text-bajo' : 'text-medio')} title={`${total} cazas en este paso`}>
                    🔥 {total}
                  </span>
                )}
              </div>
              <p className={cn('text-xs leading-snug text-marmol-800 line-clamp-3', atenuado && 'line-through')}>{p.descripcion}</p>
              <div className="mt-auto pt-1 flex flex-wrap gap-1">
                {hallazgos.slice(0, 4).map((h) => (
                  <span
                    key={h.tipo}
                    title={`${DESPERDICIOS[h.tipo as TipoDesperdicio].nombre}: ${h.cazas.length}${h.validado ? ' · validado por el equipo' : ''}`}
                    className={cn(
                      'inline-flex items-center gap-0.5 rounded-full px-1.5 text-[10px] leading-4',
                      h.validado ? 'bg-red-100 text-bajo ring-1 ring-red-300 font-semibold' : 'bg-marmol-100 text-marmol-600'
                    )}
                  >
                    {DESPERDICIOS[h.tipo as TipoDesperdicio].emoji}
                    {h.cazas.length}
                  </span>
                ))}
                {hallazgos.length > 4 && <span className="text-[10px] text-marmol-400">+{hallazgos.length - 4}</span>}
              </div>
            </button>
          );
        })}

        {/* Columna para agregar pasos (fase de mapeo) */}
        {onAgregarPaso &&
          carriles.map((c, i) => (
            <div key={`add-${c.id}`} className="relative z-10 flex items-center justify-center" style={{ gridColumn: pasos.length + 2, gridRow: i + 2 }}>
              <button
                type="button"
                onClick={() => onAgregarPaso(c.id)}
                className="flex h-[calc(100%-20px)] w-[calc(100%-20px)] items-center justify-center gap-1 rounded-lg border-2 border-dashed border-marmol-200 text-xs text-marmol-400 hover:border-marca-400 hover:text-marca-600 transition"
              >
                <Plus size={14} /> Paso aquí
              </button>
            </div>
          ))}

        {/* Filas de análisis Makigami */}
        {(['Trabajo', 'Espera'] as const).map((etiqueta, f) => (
          <div
            key={etiqueta}
            className="sticky left-0 z-20 flex items-center gap-1 px-2 sm:px-3 bg-marmol-100 border-r border-b border-marmol-200 text-[10px] sm:text-[11px] font-semibold uppercase sm:tracking-wide text-marmol-500"
            style={{ gridColumn: 1, gridRow: carriles.length + 2 + f }}
          >
            {etiqueta === 'Trabajo' ? '⚙️' : '⏳'} {etiqueta}
          </div>
        ))}
        {pasos.map((p, i) => (
          <div key={`t-${p.id}`} className="flex items-center justify-center bg-marmol-50 border-b border-marmol-200 text-xs text-marmol-700" style={{ gridColumn: i + 2, gridRow: carriles.length + 2 }}>
            {formatearDuracion(p.tiempo_trabajo_min)}
          </div>
        ))}
        {pasos.map((p, i) => (
          <div
            key={`e-${p.id}`}
            className={cn(
              'flex items-center justify-center bg-marmol-50 border-b border-marmol-200 text-xs',
              p.tiempo_espera_min >= 1440 ? 'text-bajo font-semibold' : 'text-marmol-700'
            )}
            style={{ gridColumn: i + 2, gridRow: carriles.length + 3 }}
          >
            {formatearDuracion(p.tiempo_espera_min)}
          </div>
        ))}
      </div>
    </div>
  );
}
