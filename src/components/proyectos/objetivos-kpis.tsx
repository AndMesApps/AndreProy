'use client';

import { useState } from 'react';
import { KPIS_SUGERIDOS, avanceKpi, avanceObjetivo, pct, ultimaDe, type KpiMinimo, type MedicionMinima, type ObjetivoMinimo } from '@/lib/proyectos';
import { formatearValor } from '@/lib/procesos';
import { cn, formatearFecha } from '@/lib/utils';
import { Pencil, Plus } from 'lucide-react';
import { BarraAvance, FormularioRegistro, type Referencias, type Registro } from './registro';

export type ObjetivoVista = ObjetivoMinimo & Registro & { criterio: string | null; responsable: string | null };
export type KpiVista = KpiMinimo & Registro & { formula: string | null; fuente: string | null };
export type MedicionVista = MedicionMinima & Registro & { nota: string | null };

const ESTADO_OBJETIVO = {
  pendiente: 'bg-marmol-100 text-marmol-600',
  en_curso: 'bg-blue-100 text-deber',
  cumplido: 'bg-green-100 text-alto',
  no_cumplido: 'bg-red-100 text-bajo',
} as const;
const NOMBRE_ESTADO = { pendiente: 'Pendiente', en_curso: 'En curso', cumplido: 'Cumplido', no_cumplido: 'No cumplido' } as const;

const tonoAvance = (a: number | null) => (a == null ? 'bg-marmol-300' : a >= 1 ? 'bg-alto' : a >= 0.5 ? 'bg-marca-500' : a > 0 ? 'bg-acento' : 'bg-bajo');

/** Mini gráfica de las mediciones de un KPI (con la meta punteada). */
function Tendencia({ kpi, mediciones }: { kpi: KpiMinimo; mediciones: MedicionMinima[] }) {
  const puntos = mediciones.filter((m) => m.kpi_id === kpi.id).sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (puntos.length < 2) return null;
  const valores = [...puntos.map((p) => p.valor), ...(kpi.meta != null ? [kpi.meta] : []), ...(kpi.linea_base != null ? [kpi.linea_base] : [])];
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const y = (v: number) => (max === min ? 12 : 22 - ((v - min) / (max - min)) * 20);
  const x = (i: number) => 2 + (i / (puntos.length - 1)) * 96;
  return (
    <svg viewBox="0 0 100 24" className="h-6 w-24" role="img" aria-label={`Tendencia de ${kpi.nombre}`}>
      {kpi.meta != null && <line x1="0" x2="100" y1={y(kpi.meta)} y2={y(kpi.meta)} stroke="#15803d" strokeWidth="0.8" strokeDasharray="3 2" />}
      <polyline points={puntos.map((p, i) => `${x(i)},${y(p.valor)}`).join(' ')} fill="none" stroke="#0f766e" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx={x(puntos.length - 1)} cy={y(puntos.at(-1)!.valor)} r="1.8" fill="#0f766e" />
    </svg>
  );
}

export function ObjetivosKpis({
  proyectoId,
  objetivos,
  kpis,
  mediciones,
  referencias,
}: {
  proyectoId: string;
  objetivos: ObjetivoVista[];
  kpis: KpiVista[];
  mediciones: MedicionVista[];
  referencias: Referencias;
}) {
  const [form, setForm] = useState<
    | { tipo: 'objetivo'; registro?: ObjetivoVista }
    | { tipo: 'kpi'; registro?: KpiVista; objetivoId?: string; sugerido?: Record<string, string> }
    | { tipo: 'medicion'; kpiId: string }
    | null
  >(null);
  const cerrar = () => setForm(null);

  const filaKpi = (k: KpiVista) => {
    const ultima = ultimaDe(k.id, mediciones);
    const a = avanceKpi(k, mediciones);
    return (
      <div key={k.id} className="rounded-lg bg-marmol-50 p-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 flex-1 font-semibold text-marmol-800">📏 {k.nombre}</span>
          <Tendencia kpi={k} mediciones={mediciones} />
          <button type="button" onClick={() => setForm({ tipo: 'medicion', kpiId: k.id })} className="no-imprimir rounded-md border border-marca-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-marca-700 hover:bg-marca-50">
            + Medición
          </button>
          <button type="button" onClick={() => setForm({ tipo: 'kpi', registro: k })} className="no-imprimir text-marmol-400 hover:text-secundario" title="Editar KPI">
            <Pencil size={12} />
          </button>
        </div>
        <div className="mt-1.5 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-marmol-400">Línea base</p>
            <p className="font-semibold text-marmol-700">{formatearValor(k.linea_base, k.unidad)}</p>
          </div>
          <div>
            <p className="text-[10px] text-marmol-400">Último{ultima ? ` (${formatearFecha(ultima.fecha)})` : ''}</p>
            <p className="font-semibold text-secundario">{formatearValor(ultima?.valor, k.unidad)}</p>
          </div>
          <div>
            <p className="text-[10px] text-marmol-400">Meta {k.sentido === 'bajar' ? '⬇️' : '⬆️'}</p>
            <p className="font-semibold text-alto">{formatearValor(k.meta, k.unidad)}</p>
          </div>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <BarraAvance valor={a} tono={tonoAvance(a)} alto="h-1.5" />
          <span className="w-10 text-right font-semibold text-marmol-600">{pct(a)}</span>
        </div>
        {form?.tipo === 'medicion' && form.kpiId === k.id && (
          <div className="mt-2">
            <FormularioRegistro entidad="mediciones" proyectoId={proyectoId} referencias={referencias} fijos={{ kpi_id: k.id }} onListo={cerrar} titulo={`Nueva medición de «${k.nombre}»`} />
          </div>
        )}
        {form?.tipo === 'kpi' && form.registro?.id === k.id && (
          <div className="mt-2">
            <FormularioRegistro entidad="kpis" proyectoId={proyectoId} registro={k} referencias={referencias} onListo={cerrar} />
          </div>
        )}
      </div>
    );
  };

  const sueltos = kpis.filter((k) => !k.objetivo_id || !objetivos.some((o) => o.id === k.objetivo_id));

  return (
    <div className="space-y-3">
      <div className="no-imprimir flex flex-wrap gap-2">
        <button type="button" onClick={() => setForm({ tipo: 'objetivo' })} className="boton py-1.5">
          <Plus size={14} /> Objetivo
        </button>
        <button type="button" onClick={() => setForm({ tipo: 'kpi' })} className="boton-secundario py-1.5">
          <Plus size={14} /> KPI
        </button>
        <select
          value=""
          onChange={(e) => {
            const k = KPIS_SUGERIDOS.find((x) => x.nombre === e.target.value);
            if (k) setForm({ tipo: 'kpi', sugerido: { nombre: k.nombre, formula: k.formula, unidad: k.unidad, sentido: k.sentido } });
          }}
          className="campo w-auto max-w-xs py-1.5 text-xs"
          aria-label="KPI sugerido"
        >
          <option value="">📚 Agregar un KPI sugerido…</option>
          {[...new Set(KPIS_SUGERIDOS.map((k) => k.categoria))].map((cat) => (
            <optgroup key={cat} label={cat}>
              {KPIS_SUGERIDOS.filter((k) => k.categoria === cat).map((k) => (
                <option key={k.nombre} value={k.nombre}>
                  {k.nombre} ({k.unidad})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      {form?.tipo === 'objetivo' && !form.registro && <FormularioRegistro entidad="objetivos" proyectoId={proyectoId} onListo={cerrar} />}
      {form?.tipo === 'kpi' && !form.registro && (
        <FormularioRegistro entidad="kpis" proyectoId={proyectoId} referencias={referencias} fijos={{ ...(form.sugerido ?? {}), ...(form.objetivoId ? { objetivo_id: form.objetivoId } : {}) }}
          titulo={form.sugerido ? `KPI sugerido: ${form.sugerido.nombre}. Elige el objetivo y pon la línea base y la meta.` : undefined}
          onListo={cerrar}
        />
      )}

      {objetivos.length === 0 && kpis.length === 0 ? (
        <p className="rounded-lg bg-marmol-50 p-6 text-center text-sm text-marmol-500">
          Aún no hay objetivos. Escribe 2 a 4 objetivos medibles acordados con el cliente y asóciales KPIs con línea base y meta.
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {objetivos.map((o, i) => {
            const a = avanceObjetivo(o, kpis, mediciones);
            const suyos = kpis.filter((k) => k.objetivo_id === o.id);
            return (
              <div key={o.id} className="card space-y-2 p-3">
                <div className="flex items-start gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secundario text-[11px] font-bold text-white">{i + 1}</span>
                  <p className="min-w-0 flex-1 text-sm font-semibold text-marmol-900">{o.descripcion}</p>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', ESTADO_OBJETIVO[o.estado])}>{NOMBRE_ESTADO[o.estado]}</span>
                  <button type="button" onClick={() => setForm({ tipo: 'objetivo', registro: o })} className="no-imprimir text-marmol-400 hover:text-secundario" title="Editar objetivo">
                    <Pencil size={13} />
                  </button>
                </div>
                {o.criterio && <p className="text-xs text-marmol-500">✔ {o.criterio}</p>}
                <div className="flex items-center gap-2">
                  <BarraAvance valor={a} tono={tonoAvance(a)} />
                  <span className="w-12 text-right text-sm font-bold text-secundario">{pct(a)}</span>
                </div>
                <p className="text-[11px] text-marmol-400">
                  {o.responsable && `👤 ${o.responsable} · `}
                  {o.fecha_meta && `🎯 ${formatearFecha(o.fecha_meta)} · `}
                  {suyos.length ? `Se calcula con ${suyos.length} ${suyos.length === 1 ? 'KPI' : 'KPIs'}` : 'Avance manual'}
                </p>
                {form?.tipo === 'objetivo' && form.registro?.id === o.id && <FormularioRegistro entidad="objetivos" proyectoId={proyectoId} registro={o} onListo={cerrar} />}
                <div className="space-y-2">{suyos.map(filaKpi)}</div>
                <button type="button" onClick={() => setForm({ tipo: 'kpi', objetivoId: o.id })} className="no-imprimir text-xs font-semibold text-marca-600 hover:underline">
                  + KPI para este objetivo
                </button>
              </div>
            );
          })}
          {sueltos.length > 0 && (
            <div className="card space-y-2 p-3">
              <p className="text-sm font-semibold text-marmol-700">Otros KPIs del proyecto</p>
              {sueltos.map(filaKpi)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
