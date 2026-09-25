'use client';

import { useState } from 'react';
import { diasHasta } from '@/lib/procesos';
import { formatearHoras, formatearPesos, nivelRiesgo, pct, type PagoMinimo, type RiesgoMinimo } from '@/lib/proyectos';
import { cn, formatearFecha } from '@/lib/utils';
import { ExternalLink, Pencil, Plus } from 'lucide-react';
import { BarraAvance, FormularioRegistro, type Registro } from './registro';

// ----------------------------------------------------------------------------
// Finanzas: horas y pagos
// ----------------------------------------------------------------------------

export type PagoVista = PagoMinimo & Registro & { fecha_pago: string | null; soporte: string | null };

const ESTADO_PAGO: Record<PagoMinimo['estado'], string> = {
  pendiente: 'bg-marmol-100 text-marmol-600',
  facturado: 'bg-blue-100 text-deber',
  pagado: 'bg-green-100 text-alto',
  anulado: 'bg-marmol-50 text-marmol-400 line-through',
};
const TIPO_PAGO = { cobro: '💰 Cobro', contrapartida: '🤝 Aporte o cofinanciación', gasto: '🧾 Gasto' } as const;

export function Finanzas({
  proyectoId,
  pagos,
  horasContratadas,
  horasEjecutadas,
  valorContrato,
  avance,
}: {
  proyectoId: string;
  pagos: PagoVista[];
  horasContratadas: number | null;
  horasEjecutadas: number;
  valorContrato: number | null;
  avance: number | null;
}) {
  const [editando, setEditando] = useState<PagoVista | 'nuevo' | null>(null);
  const vigentes = pagos.filter((p) => p.estado !== 'anulado');
  const cobros = vigentes.filter((p) => p.tipo !== 'gasto');
  const cobrado = cobros.filter((p) => p.estado === 'pagado').reduce((s, p) => s + Number(p.valor), 0);
  const porCobrar = cobros.filter((p) => p.estado !== 'pagado').reduce((s, p) => s + Number(p.valor), 0);
  const vencido = cobros.filter((p) => p.estado !== 'pagado' && p.fecha_limite && diasHasta(p.fecha_limite) < 0).reduce((s, p) => s + Number(p.valor), 0);
  const gastos = vigentes.filter((p) => p.tipo === 'gasto').reduce((s, p) => s + Number(p.valor), 0);
  const consumo = horasContratadas ? horasEjecutadas / horasContratadas : null;
  const orden = [...pagos].sort((a, b) => (a.fecha_limite ?? '9999').localeCompare(b.fecha_limite ?? '9999'));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-marmol-200 p-3">
          <p className="text-sm font-semibold text-marmol-800">⏱ Horas</p>
          <p className="mt-1 text-xs text-marmol-500">
            {formatearHoras(horasEjecutadas)} ejecutadas {horasContratadas ? `de ${formatearHoras(horasContratadas)} contratadas` : '(sin horas contratadas en la ficha)'}
          </p>
          {consumo != null && (
            <div className="mt-2 space-y-1">
              <BarraAvance valor={consumo} esperado={avance} tono={consumo > 1 ? 'bg-bajo' : avance != null && consumo - avance > 0.15 ? 'bg-acento' : 'bg-marca-500'} />
              <p className="text-[11px] text-marmol-500">
                {pct(consumo)} de las horas usadas · la marca oscura es el avance del cronograma ({pct(avance)}). Lo sano es que la barra no la pase por mucho.
              </p>
            </div>
          )}
          <p className="mt-2 text-[11px] text-marmol-400">Las horas salen de la bitácora (tiempo de cada intervención).</p>
        </div>
        <div className="rounded-xl border border-marmol-200 p-3">
          <p className="text-sm font-semibold text-marmol-800">💵 Dinero</p>
          <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <dt className="text-marmol-500">Valor del contrato</dt>
            <dd className="text-right font-semibold text-marmol-800">{formatearPesos(valorContrato)}</dd>
            <dt className="text-marmol-500">Cobrado</dt>
            <dd className="text-right font-semibold text-alto">{formatearPesos(cobrado)}</dd>
            <dt className="text-marmol-500">Por cobrar</dt>
            <dd className="text-right font-semibold text-secundario">{formatearPesos(porCobrar)}</dd>
            <dt className="text-marmol-500">Vencido</dt>
            <dd className={cn('text-right font-semibold', vencido ? 'text-bajo' : 'text-marmol-400')}>{formatearPesos(vencido)}</dd>
            <dt className="text-marmol-500">Gastos</dt>
            <dd className="text-right font-semibold text-marmol-600">{formatearPesos(gastos)}</dd>
          </dl>
          {valorContrato ? <BarraAvance valor={cobrado / valorContrato} tono="bg-alto" alto="mt-2 h-1.5" /> : null}
        </div>
      </div>

      <button type="button" onClick={() => setEditando('nuevo')} className="boton no-imprimir py-1.5">
        <Plus size={14} /> Pago o cobro
      </button>
      {editando === 'nuevo' && <FormularioRegistro entidad="pagos" proyectoId={proyectoId} onListo={() => setEditando(null)} />}
      {orden.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-xs">
            <thead className="text-left text-marmol-400">
              <tr>
                <th className="py-1.5 font-medium">Concepto</th>
                <th className="font-medium">Tipo</th>
                <th className="text-right font-medium">Valor</th>
                <th className="font-medium">&nbsp;Límite</th>
                <th className="font-medium">Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orden.map((p) =>
                editando !== 'nuevo' && editando?.id === p.id ? (
                  <tr key={p.id}>
                    <td colSpan={6} className="py-2">
                      <FormularioRegistro entidad="pagos" proyectoId={proyectoId} registro={p} onListo={() => setEditando(null)} />
                    </td>
                  </tr>
                ) : (
                  <tr key={p.id} className="border-t border-marmol-100">
                    <td className="py-1.5 pr-2 text-marmol-800">
                      {p.concepto}
                      {p.soporte && <span className="block text-[10px] text-marmol-400">📎 {p.soporte}</span>}
                    </td>
                    <td className="pr-2 text-marmol-500">{TIPO_PAGO[p.tipo]}</td>
                    <td className="pr-2 text-right font-semibold text-marmol-800">{formatearPesos(Number(p.valor))}</td>
                    <td className={cn('whitespace-nowrap pr-2', p.estado !== 'pagado' && p.fecha_limite && diasHasta(p.fecha_limite) < 0 ? 'font-semibold text-bajo' : 'text-marmol-500')}>
                      &nbsp;{p.fecha_limite ? formatearFecha(p.fecha_limite) : '—'}
                      {p.fecha_pago && <span className="block text-[10px] text-alto">&nbsp;pagado {formatearFecha(p.fecha_pago)}</span>}
                    </td>
                    <td>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', ESTADO_PAGO[p.estado])}>{p.estado[0]!.toUpperCase() + p.estado.slice(1)}</span>
                    </td>
                    <td className="no-imprimir text-right">
                      <button type="button" onClick={() => setEditando(p)} className="text-marmol-300 hover:text-secundario" title="Editar">
                        <Pencil size={12} />
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Riesgos: matriz probabilidad × impacto
// ----------------------------------------------------------------------------

export type RiesgoVista = RiesgoMinimo & Registro & { responsable: string | null };

const COLOR_NIVEL = (n: number) => (n >= 6 ? 'bg-red-100 text-bajo' : n >= 3 ? 'bg-amber-100 text-medio' : 'bg-green-100 text-alto');

export function Riesgos({ proyectoId, riesgos }: { proyectoId: string; riesgos: RiesgoVista[] }) {
  const [editando, setEditando] = useState<RiesgoVista | 'nuevo' | null>(null);
  const abiertos = riesgos.filter((r) => r.estado !== 'cerrado');
  const orden = [...riesgos].sort((a, b) => Number(a.estado === 'cerrado') - Number(b.estado === 'cerrado') || nivelRiesgo(b) - nivelRiesgo(a));
  const probs = ['alta', 'media', 'baja'] as const;
  const imps = ['bajo', 'medio', 'alto'] as const;

  return (
    <div className="space-y-3">
      <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)]">
        {/* Matriz */}
        <div>
          <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-marmol-400">Impacto →</p>
          <div className="flex">
            <div className="mr-1 flex flex-col justify-around text-[10px] font-semibold text-marmol-400">
              {probs.map((p) => (
                <span key={p} className="h-14 leading-[3.5rem]">
                  {p[0]!.toUpperCase() + p.slice(1)}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {probs.map((p) =>
                imps.map((i) => {
                  const n = nivelRiesgo({ probabilidad: p, impacto: i });
                  const cuantos = abiertos.filter((r) => r.probabilidad === p && r.impacto === i).length;
                  return (
                    <div key={`${p}${i}`} className={cn('flex h-14 w-16 items-center justify-center rounded-lg text-lg font-bold', COLOR_NIVEL(n))} title={`Probabilidad ${p} · impacto ${i}`}>
                      {cuantos || ''}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
          <div className="ml-10 mt-1 grid w-[12.5rem] grid-cols-3 text-center text-[10px] font-semibold text-marmol-400">
            <span>Bajo</span>
            <span>Medio</span>
            <span>Alto</span>
          </div>
          <p className="mt-1 text-center text-[10px] text-marmol-400">↑ Probabilidad · solo riesgos abiertos</p>
        </div>

        <div className="space-y-2">
          <button type="button" onClick={() => setEditando('nuevo')} className="boton no-imprimir py-1.5">
            <Plus size={14} /> Riesgo
          </button>
          {editando === 'nuevo' && <FormularioRegistro entidad="riesgos" proyectoId={proyectoId} onListo={() => setEditando(null)} />}
          {orden.length === 0 && <p className="rounded-lg bg-marmol-50 p-4 text-sm text-marmol-500">Sin riesgos registrados. ¿Qué podría frenar el proyecto? Datos que no llegan, aprobaciones lentas, cambios de personal…</p>}
          {orden.map((r) =>
            editando !== 'nuevo' && editando?.id === r.id ? (
              <FormularioRegistro key={r.id} entidad="riesgos" proyectoId={proyectoId} registro={r} onListo={() => setEditando(null)} />
            ) : (
              <div key={r.id} className={cn('rounded-xl border border-marmol-200 p-3 text-sm', r.estado === 'cerrado' && 'opacity-50')}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', COLOR_NIVEL(nivelRiesgo(r)))}>
                    Nivel {nivelRiesgo(r)} · P {r.probabilidad} · I {r.impacto}
                  </span>
                  <span className="text-[10px] text-marmol-400">{r.estado}</span>
                  <button type="button" onClick={() => setEditando(r)} className="no-imprimir ml-auto text-marmol-300 hover:text-secundario" title="Editar">
                    <Pencil size={12} />
                  </button>
                </div>
                <p className="mt-1 text-marmol-800">{r.descripcion}</p>
                <p className={cn('mt-1 text-xs', r.mitigacion ? 'text-marca-700' : 'text-bajo')}>🛡️ {r.mitigacion || 'Sin plan de mitigación'}</p>
                {r.responsable && <p className="text-[11px] text-marmol-400">👤 {r.responsable}</p>}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Documentos
// ----------------------------------------------------------------------------

export interface DocumentoVista extends Registro {
  id: string;
  nombre: string;
  tipo: string;
  url: string | null;
  fecha: string | null;
  notas: string | null;
}

const ICONO_DOC: Record<string, string> = { contrato: '📑', acta: '✍️', informe: '📊', entregable: '📦', evidencia: '📷', otro: '📎' };

export function Documentos({ proyectoId, documentos }: { proyectoId: string; documentos: DocumentoVista[] }) {
  const [editando, setEditando] = useState<DocumentoVista | 'nuevo' | null>(null);
  const orden = [...documentos].sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));
  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setEditando('nuevo')} className="boton no-imprimir py-1.5">
        <Plus size={14} /> Documento
      </button>
      {editando === 'nuevo' && <FormularioRegistro entidad="documentos" proyectoId={proyectoId} onListo={() => setEditando(null)} />}
      {orden.length === 0 ? (
        <p className="rounded-lg bg-marmol-50 p-4 text-sm text-marmol-500">Guarda aquí los enlaces a contratos, actas, informes, entregables y evidencias (Drive, OneDrive, SharePoint…).</p>
      ) : (
        <ul className="divide-y divide-marmol-100 rounded-xl border border-marmol-200">
          {orden.map((d) =>
            editando !== 'nuevo' && editando?.id === d.id ? (
              <li key={d.id} className="p-2">
                <FormularioRegistro entidad="documentos" proyectoId={proyectoId} registro={d} onListo={() => setEditando(null)} />
              </li>
            ) : (
              <li key={d.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="text-xl">{ICONO_DOC[d.tipo] ?? '📎'}</span>
                <span className="min-w-0 flex-1">
                  {d.url ? (
                    <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-secundario hover:underline">
                      {d.nombre} <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span className="font-medium text-marmol-800">{d.nombre}</span>
                  )}
                  <span className="block text-[11px] text-marmol-400">
                    {d.tipo}
                    {d.fecha && ` · ${formatearFecha(d.fecha)}`}
                    {d.notas && ` · ${d.notas}`}
                  </span>
                </span>
                <button type="button" onClick={() => setEditando(d)} className="no-imprimir text-marmol-300 hover:text-secundario" title="Editar">
                  <Pencil size={12} />
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
