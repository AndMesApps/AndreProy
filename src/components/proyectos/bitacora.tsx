'use client';

import { useState } from 'react';
import { ESTADOS_INTERVENCION, formatearHoras, horasEjecutadas } from '@/lib/proyectos';
import { diasHasta } from '@/lib/procesos';
import { cn, formatearFecha } from '@/lib/utils';
import { Pencil, Plus } from 'lucide-react';
import { FormularioRegistro, type Referencias, type Registro } from './registro';

export interface IntervencionVista extends Registro {
  id: string;
  fecha: string;
  actividad: string;
  tiempo_min: number | null;
  estado_tras: keyof typeof ESTADOS_INTERVENCION | null;
  proximo_paso: string | null;
  fecha_proximo: string | null;
  hito_id: string | null;
}

const TONO: Record<string, string> = {
  al_dia: 'bg-green-100 text-alto',
  pendiente: 'bg-marmol-100 text-marmol-600',
  atrasado: 'bg-red-100 text-bajo',
  pausado: 'bg-amber-100 text-medio',
  finalizado: 'bg-marca-100 text-marca-700',
};

/** Bitácora de intervenciones: qué se hizo, cuánto tiempo, en qué quedó y qué sigue. */
export function Bitacora({
  proyectoId,
  registros,
  referencias,
  frecuenciaDias,
}: {
  proyectoId: string;
  registros: IntervencionVista[];
  referencias: Referencias;
  frecuenciaDias: number | null;
}) {
  const [editando, setEditando] = useState<IntervencionVista | 'nuevo' | null>(null);
  const orden = [...registros].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const nombreHito = new Map((referencias.hitos ?? []).map((h) => [h.id, h.etiqueta]));
  const ultima = orden[0];
  const diasSin = ultima ? -diasHasta(ultima.fecha) : null;
  const mes = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }).slice(0, 7);
  const horasMes = horasEjecutadas(registros.filter((r) => r.fecha.startsWith(mes)));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-marmol-50 p-2">
          <p className="text-[10px] text-marmol-400">Intervenciones</p>
          <p className="font-display text-xl font-bold text-secundario">{registros.length}</p>
        </div>
        <div className="rounded-xl bg-marmol-50 p-2">
          <p className="text-[10px] text-marmol-400">Horas totales · este mes</p>
          <p className="font-display text-xl font-bold text-secundario">
            {formatearHoras(horasEjecutadas(registros))} <span className="text-sm text-marmol-400">· {formatearHoras(horasMes)}</span>
          </p>
        </div>
        <div className="rounded-xl bg-marmol-50 p-2">
          <p className="text-[10px] text-marmol-400">Días sin intervenir</p>
          <p className={cn('font-display text-xl font-bold', diasSin != null && frecuenciaDias && diasSin > frecuenciaDias ? 'text-bajo' : 'text-alto')}>{diasSin ?? '—'}</p>
          {frecuenciaDias && <p className="text-[10px] text-marmol-400">meta: cada {frecuenciaDias} días</p>}
        </div>
      </div>

      <button type="button" onClick={() => setEditando('nuevo')} className="boton no-imprimir py-1.5">
        <Plus size={14} /> Registrar intervención
      </button>
      {editando === 'nuevo' && <FormularioRegistro entidad="bitacora" proyectoId={proyectoId} referencias={referencias} onListo={() => setEditando(null)} />}

      {orden.length === 0 ? (
        <p className="rounded-lg bg-marmol-50 p-6 text-center text-sm text-marmol-500">Aún no hay intervenciones. Registra cada reunión, visita o trabajo con su tiempo: así se suman las horas ejecutadas.</p>
      ) : (
        <ol className="relative space-y-2 border-l-2 border-marca-200 pl-4">
          {orden.map((r) => (
            <li key={r.id} className="relative">
              <span className="absolute -left-[1.4rem] top-2 h-3 w-3 rounded-full border-2 border-white bg-marca-500" aria-hidden />
              {editando !== 'nuevo' && editando?.id === r.id ? (
                <FormularioRegistro entidad="bitacora" proyectoId={proyectoId} registro={r} referencias={referencias} onListo={() => setEditando(null)} />
              ) : (
                <div className="rounded-xl border border-marmol-200 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <strong className="text-marmol-800">{formatearFecha(r.fecha)}</strong>
                    {r.tiempo_min != null && <span className="text-marmol-500">⏱ {r.tiempo_min} min</span>}
                    {r.estado_tras && <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', TONO[r.estado_tras])}>{ESTADOS_INTERVENCION[r.estado_tras]}</span>}
                    {r.hito_id && nombreHito.get(r.hito_id) && <span className="text-marmol-400">· {nombreHito.get(r.hito_id)}</span>}
                    <button type="button" onClick={() => setEditando(r)} className="no-imprimir ml-auto text-marmol-300 hover:text-secundario" title="Editar">
                      <Pencil size={12} />
                    </button>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-marmol-700">{r.actividad}</p>
                  {r.proximo_paso && (
                    <p className="mt-1 text-xs text-marca-700">
                      → {r.proximo_paso}
                      {r.fecha_proximo && (
                        <span className={cn('ml-1', diasHasta(r.fecha_proximo) < 0 && r.id === ultima?.id ? 'font-semibold text-bajo' : 'text-marmol-400')}>
                          ({formatearFecha(r.fecha_proximo)})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
