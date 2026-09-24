'use client';

import { formatearDuracion, type MetricasProceso } from '@/lib/makigami';
import { ContadorAnimado } from './contador-animado';

/**
 * La barra que "duele": cuánto del tiempo total del proceso agrega valor de
 * verdad, frente a lo necesario y al desperdicio (incluidas todas las esperas).
 */
export function AnalisisProceso({
  metricas,
  traspasos,
  totalCazas,
  cazadores,
}: {
  metricas: MetricasProceso;
  traspasos: number;
  totalCazas: number;
  cazadores: number;
}) {
  const total = metricas.tiempoTotal || 1;
  const segmentos = [
    { clave: 'va', etiqueta: 'Agrega valor', valor: metricas.valorAgregado, clase: 'bg-marca-500' },
    { clave: 'nec', etiqueta: 'Necesario (no agrega valor)', valor: metricas.necesario, clase: 'bg-amber-400' },
    { clave: 'desp', etiqueta: 'Trabajo que es desperdicio', valor: metricas.desperdicio - metricas.espera, clase: 'bg-red-500' },
    {
      clave: 'esp',
      etiqueta: 'Esperas',
      valor: metricas.espera,
      clase: 'bg-red-300 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(255,255,255,.35)_6px,rgba(255,255,255,.35)_12px)]',
    },
  ];

  const tarjetas = [
    { etiqueta: 'Tiempo total del proceso', valor: <ContadorAnimado valor={metricas.tiempoTotal} formato={formatearDuracion} />, tono: 'text-secundario' },
    { etiqueta: 'Tiempo que agrega valor', valor: <ContadorAnimado valor={metricas.valorAgregado} formato={formatearDuracion} />, tono: 'text-marca-600' },
    {
      etiqueta: 'Eficiencia del proceso',
      valor: <ContadorAnimado valor={metricas.eficiencia} formato={(n) => `${n < 10 ? n.toFixed(1) : Math.round(n)}%`} />,
      tono: metricas.eficiencia < 10 ? 'text-bajo' : metricas.eficiencia < 25 ? 'text-medio' : 'text-alto',
    },
    { etiqueta: 'Traspasos entre áreas', valor: traspasos, tono: 'text-medio' },
    { etiqueta: 'Desperdicios cazados', valor: totalCazas, tono: 'text-bajo' },
    { etiqueta: 'Cazadores', valor: cazadores, tono: 'text-secundario' },
  ];

  return (
    <div className="card p-5 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {tarjetas.map((t) => (
          <div key={t.etiqueta}>
            <p className="text-[11px] font-medium text-marmol-500 leading-tight">{t.etiqueta}</p>
            <p className={`font-display text-xl font-semibold ${t.tono}`}>{t.valor}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex h-5 w-full overmarca-hidden rounded-full bg-marmol-100">
          {segmentos.map((s) =>
            s.valor > 0 ? (
              <div
                key={s.clave}
                className={`${s.clase} h-full transition-all duration-700`}
                style={{ width: `${(s.valor / total) * 100}%` }}
                title={`${s.etiqueta}: ${formatearDuracion(s.valor)}`}
              />
            ) : null
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-marmol-500">
          {segmentos.map((s) => (
            <span key={s.clave} className="inline-flex items-center gap-1.5">
              <span className={`inline-block h-2.5 w-2.5 rounded-sm ${s.clase}`} />
              {s.etiqueta} · {Math.round((s.valor / total) * 100)}%
            </span>
          ))}
        </div>
      </div>
      {metricas.tiempoTotal > 0 && (
        <p className="text-sm text-marmol-600">
          De cada 100 horas que dura este proceso, solo <strong className="text-marca-700">{metricas.eficiencia < 1 ? '<1' : Math.round(metricas.eficiencia)}</strong> le
          agregan valor al cliente. El resto es lo que vamos a cazar. 🎯
        </p>
      )}
    </div>
  );
}
