'use client';

import { Fragment, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { aplicarPlantilla, cambiarEstadoHito, generarSeguimientos } from '@/app/proyectos/actions';
import { ESTADOS_HITO, PLANTILLAS, diasParaVencer, hitoAbierto, hoyISO, type EstadoHito } from '@/lib/proyectos';
import { cn, formatearFecha } from '@/lib/utils';
import { CalendarPlus, Plus } from 'lucide-react';
import { FormularioRegistro, type Referencias, type Registro } from './registro';

export interface HitoVista extends Registro {
  id: string;
  fase: string | null;
  nombre: string;
  que_cumplir: string | null;
  insumos: string | null;
  responsable: string | null;
  fecha_inicio: string | null;
  fecha_limite: string | null;
  fecha_real: string | null;
  estado: EstadoHito;
  peso: number;
  horas_estimadas: number | null;
  situacion: string | null;
  proximo_paso: string | null;
  soporte: string | null;
  orden: number;
}

const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const t = (f: string) => new Date(`${f}T12:00:00`).getTime();

/** Etiqueta de "días para vencer", como en el control de hitos del Excel. */
export function Vence({ hito }: { hito: Pick<HitoVista, 'estado' | 'fecha_limite'> }) {
  const d = diasParaVencer(hito);
  if (d == null) return <span className="text-marmol-300">—</span>;
  if (d < 0) return <span className="font-semibold text-bajo">Vencido hace {-d} d</span>;
  if (d === 0) return <span className="font-semibold text-medio">Vence hoy</span>;
  return <span className={cn(d <= 7 ? 'font-semibold text-medio' : 'text-marmol-500')}>En {d} d</span>;
}

export function Cronograma({
  proyectoId,
  inicio,
  fin,
  hitos,
  referencias,
  soloLectura = false,
}: {
  proyectoId: string;
  inicio: string | null;
  fin: string | null;
  hitos: HitoVista[];
  referencias: Referencias;
  soloLectura?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editando, setEditando] = useState<HitoVista | 'nuevo' | null>(null);
  const [vista, setVista] = useState<'gantt' | 'tabla'>('gantt');
  const [ocultarCumplidos, setOcultarCumplidos] = useState(false);
  const [plantilla, setPlantilla] = useState('');
  const [diaHabil, setDiaHabil] = useState('3');
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  const ejecutar = (fn: () => Promise<{ ok: boolean; error?: string; aviso?: string }>) => {
    setMensaje(null);
    startTransition(async () => {
      const res = await fn();
      setMensaje(res.ok ? (res.aviso ? { ok: true, texto: res.aviso } : null) : { ok: false, texto: res.error ?? 'Error' });
      router.refresh();
    });
  };

  const ordenados = useMemo(
    () => [...hitos].sort((a, b) => (a.fecha_limite ?? '9999').localeCompare(b.fecha_limite ?? '9999') || a.orden - b.orden),
    [hitos],
  );
  const visibles = ocultarCumplidos ? ordenados.filter(hitoAbierto) : ordenados;

  // Fases en el orden en que aparecen por primera vez.
  const fases = useMemo(() => {
    const m = new Map<string, HitoVista[]>();
    for (const h of visibles) {
      const k = h.fase?.trim() || 'Sin fase';
      m.set(k, [...(m.get(k) ?? []), h]);
    }
    return [...m.entries()];
  }, [visibles]);

  // Rango del Gantt: el proyecto y todos los hitos.
  const fechas = [inicio, fin, ...hitos.flatMap((h) => [h.fecha_inicio, h.fecha_limite, h.fecha_real])].filter((f): f is string => Boolean(f));
  const min = fechas.length ? Math.min(...fechas.map(t)) : null;
  const max = fechas.length ? Math.max(...fechas.map(t)) : null;
  const rango = min != null && max != null ? Math.max(max - min, 86400000) : null;
  const x = (f: string) => (rango ? ((t(f) - min!) / rango) * 100 : 0);
  const hoy = hoyISO();
  const meses: { etiqueta: string; x: number }[] = [];
  if (min != null && max != null) {
    const d = new Date(min);
    d.setDate(1);
    while (d.getTime() <= max) {
      const iso = d.toISOString().slice(0, 10);
      if (t(iso) >= min) meses.push({ etiqueta: `${MES_CORTO[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, x: x(iso) });
      d.setMonth(d.getMonth() + 1);
    }
  }

  const formulario = (h?: HitoVista) => (
    <FormularioRegistro entidad="hitos" proyectoId={proyectoId} registro={h} referencias={referencias} onListo={() => setEditando(null)} />
  );

  return (
    <div className="space-y-3">
      {!soloLectura && (
        <div className="no-imprimir flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setEditando('nuevo')} className="boton py-1.5">
            <Plus size={14} /> Hito
          </button>
          <select value={plantilla} onChange={(e) => setPlantilla(e.target.value)} className="campo w-auto py-1.5 text-xs" aria-label="Plantilla">
            <option value="">Agregar hitos de una plantilla…</option>
            {Object.entries(PLANTILLAS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.nombre}
              </option>
            ))}
          </select>
          {plantilla && (
            <button type="button" disabled={pending} onClick={() => ejecutar(() => aplicarPlantilla(proyectoId, plantilla, Number(diaHabil)))} className="boton-secundario py-1.5 text-xs">
              Agregar
            </button>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-marmol-500">
            <button type="button" disabled={pending} onClick={() => ejecutar(() => generarSeguimientos(proyectoId, Number(diaHabil)))} className="boton-secundario py-1.5 text-xs">
              <CalendarPlus size={13} /> Seguimientos mensuales
            </button>
            al día hábil
            <input inputMode="numeric" value={diaHabil} onChange={(e) => setDiaHabil(e.target.value)} className="campo w-12 py-1 text-center text-xs" aria-label="Día hábil" />
          </span>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-1 text-marmol-500">
              <input type="checkbox" checked={ocultarCumplidos} onChange={(e) => setOcultarCumplidos(e.target.checked)} /> Ocultar cumplidos
            </label>
            <div className="inline-flex overflow-hidden rounded-lg border border-marmol-200">
              {(['gantt', 'tabla'] as const).map((v) => (
                <button key={v} type="button" onClick={() => setVista(v)} className={cn('px-2.5 py-1', vista === v ? 'bg-secundario text-white' : 'bg-white text-marmol-600')}>
                  {v === 'gantt' ? 'Gantt' : 'Tabla'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {mensaje && <p className={cn('text-sm', mensaje.ok ? 'text-alto' : 'text-bajo')}>{mensaje.texto}</p>}
      {editando === 'nuevo' && formulario()}

      {hitos.length === 0 ? (
        <p className="rounded-lg bg-marmol-50 p-6 text-center text-sm text-marmol-500">
          El cronograma está vacío. Agrega hitos a mano o desde una plantilla (necesita la fecha de inicio y la de finalización del proyecto).
        </p>
      ) : vista === 'gantt' || soloLectura ? (
        <div className="overflow-x-auto">
          <div className="min-w-[44rem]">
            {/* Encabezado de meses */}
            <div className="relative ml-[15rem] mr-3 h-6 border-b border-marmol-200 text-[10px] text-marmol-400">
              {meses.map((m) => (
                <span key={m.etiqueta} className="absolute top-1 -translate-x-1/2 whitespace-nowrap" style={{ left: `${m.x}%` }}>
                  {m.etiqueta}
                </span>
              ))}
            </div>
            <div className="relative">
              {/* Línea de hoy */}
              {rango && t(hoy) >= min! && t(hoy) <= max! && (
                <div className="pointer-events-none absolute bottom-0 top-0 z-10 ml-[15rem] w-[calc(100%-15.75rem)]">
                  <div className="absolute bottom-0 top-0 w-0.5 bg-bajo/70" style={{ left: `${x(hoy)}%` }}>
                    <span className="absolute -top-0 left-1 rounded bg-bajo px-1 text-[9px] font-semibold text-white">hoy</span>
                  </div>
                </div>
              )}
              {fases.map(([fase, lista]) => (
                <Fragment key={fase}>
                  <div className="bg-marmol-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-marmol-500">{fase}</div>
                  {lista.map((h) => {
                    const color = ESTADOS_HITO[h.estado].barra;
                    const vencido = (diasParaVencer(h) ?? 1) < 0;
                    return (
                      <Fragment key={h.id}>
                        <button
                          type="button"
                          disabled={soloLectura}
                          onClick={() => setEditando(editando !== 'nuevo' && editando?.id === h.id ? null : h)}
                          className="group flex w-full items-center border-b border-marmol-100 text-left hover:bg-marca-50/40"
                        >
                          <span className="flex w-[15rem] shrink-0 items-center gap-1.5 truncate px-2 py-1.5 text-xs">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                            <span className={cn('truncate', h.estado === 'cumplido' ? 'text-marmol-400 line-through' : 'text-marmol-800')}>{h.nombre}</span>
                          </span>
                          <span className="relative mr-3 h-7 flex-1">
                            {h.fecha_limite &&
                              (h.fecha_inicio ? (
                                <span
                                  className={cn('absolute top-1.5 h-4 rounded', vencido && 'ring-2 ring-bajo')}
                                  style={{ left: `${x(h.fecha_inicio)}%`, width: `${Math.max(0.8, x(h.fecha_limite) - x(h.fecha_inicio))}%`, backgroundColor: color }}
                                  title={`${h.nombre}: ${formatearFecha(h.fecha_inicio)} → ${formatearFecha(h.fecha_limite)} · ${ESTADOS_HITO[h.estado].nombre}`}
                                />
                              ) : (
                                <span
                                  className={cn('absolute top-2 h-3 w-3 -translate-x-1/2 rotate-45', vencido && 'ring-2 ring-bajo')}
                                  style={{ left: `${x(h.fecha_limite)}%`, backgroundColor: color }}
                                  title={`${h.nombre}: vence ${formatearFecha(h.fecha_limite)} · ${ESTADOS_HITO[h.estado].nombre}`}
                                />
                              ))}
                          </span>
                        </button>
                        {editando !== 'nuevo' && editando?.id === h.id && <div className="p-2">{formulario(h)}</div>}
                      </Fragment>
                    );
                  })}
                </Fragment>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-marmol-500">
              {(Object.keys(ESTADOS_HITO) as EstadoHito[]).map((e) => (
                <span key={e} className="inline-flex items-center gap-1">
                  <span className="h-2 w-3 rounded-sm" style={{ backgroundColor: ESTADOS_HITO[e].barra }} /> {ESTADOS_HITO[e].nombre}
                </span>
              ))}
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rotate-45 bg-marmol-400" /> hito puntual
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-3 rounded-sm ring-2 ring-bajo" /> vencido
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-xs">
            <thead className="text-left text-marmol-400">
              <tr>
                <th className="py-1.5 font-medium">Hito</th>
                <th className="font-medium">Responsable</th>
                <th className="font-medium">Límite</th>
                <th className="font-medium">Días para vencer</th>
                <th className="font-medium">Estado</th>
                <th className="font-medium">Situación / próximo paso</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((h) => (
                <Fragment key={h.id}>
                  <tr className="border-t border-marmol-100 align-top">
                    <td className="py-2 pr-2">
                      <button type="button" onClick={() => setEditando(h)} className="text-left font-medium text-marmol-800 hover:text-secundario">
                        {h.nombre}
                      </button>
                      <span className="block text-[10px] text-marmol-400">{h.fase}</span>
                    </td>
                    <td className="pr-2 text-marmol-600">{h.responsable ?? '—'}</td>
                    <td className="whitespace-nowrap pr-2 text-marmol-600">
                      {h.fecha_limite ? formatearFecha(h.fecha_limite) : '—'}
                      {h.fecha_real && <span className="block text-[10px] text-alto">entregado {formatearFecha(h.fecha_real)}</span>}
                    </td>
                    <td className="whitespace-nowrap pr-2">
                      <Vence hito={h} />
                    </td>
                    <td className="pr-2">
                      <select
                        value={h.estado}
                        disabled={pending}
                        onChange={(e) => ejecutar(() => cambiarEstadoHito(proyectoId, h.id, e.target.value as EstadoHito))}
                        className={cn('rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold', ESTADOS_HITO[h.estado].clase)}
                        aria-label="Estado del hito"
                      >
                        {(Object.keys(ESTADOS_HITO) as EstadoHito[]).map((e) => (
                          <option key={e} value={e}>
                            {ESTADOS_HITO[e].nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-marmol-600">
                      {h.situacion && <span className="block">{h.situacion}</span>}
                      {h.proximo_paso && <span className="block text-marca-700">→ {h.proximo_paso}</span>}
                    </td>
                  </tr>
                  {editando !== 'nuevo' && editando?.id === h.id && (
                    <tr>
                      <td colSpan={6} className="pb-2">
                        {formulario(h)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
