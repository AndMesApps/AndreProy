import { EnlaceAyuda } from '@/components/manual/enlace-ayuda';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getFacilitador } from '@/lib/auth';
import { db } from '@/lib/supabase/server';
import { nombresCreadores } from '@/lib/usuarios';
import {
  ESTADOS_PROYECTO,
  ICONO_AGENDA,
  SALUD,
  TIPOS_PROYECTO,
  agendaProyecto,
  avanceCronograma,
  avanceTiempo,
  cumplimientoObjetivos,
  formatearHoras,
  formatearPesos,
  horasEjecutadas,
  hitoAbierto,
  hoyISO,
  pct,
  saludProyecto,
  type EventoAgenda,
  type Salud,
} from '@/lib/proyectos';
import { diasHasta } from '@/lib/procesos';
import { cn, formatearFecha } from '@/lib/utils';
import { FormularioProyecto } from '@/components/proyectos/formulario-proyecto';
import { BarraAvance } from '@/components/proyectos/registro';

export const metadata = { title: 'Proyectos' };

const FILTROS = { activos: 'Activos', todos: 'Todos', cerrados: 'Finalizados y cancelados' } as const;
type Filtro = keyof typeof FILTROS;

export default async function ProyectosPage({ searchParams }: { searchParams: Promise<{ ver?: string; grupo?: string }> }) {
  const facilitador = await getFacilitador();
  if (!facilitador) redirect('/ingresar');
  const { ver, grupo } = await searchParams;
  const filtro: Filtro = ver && ver in FILTROS ? (ver as Filtro) : 'activos';
  const esAdmin = facilitador.rol === 'admin';

  const sb = db();
  let consulta = sb.from('pr_proyectos').select('*').order('fecha_fin', { ascending: true, nullsFirst: false });
  if (!esAdmin) consulta = consulta.eq('creado_por', facilitador.id);
  const { data: todos, error } = await consulta;
  const lista = ((todos ?? []) as any[]).map((p) => ({ ...p, horas_contratadas: p.horas_contratadas == null ? null : Number(p.horas_contratadas), valor_contrato: p.valor_contrato == null ? null : Number(p.valor_contrato) }));
  const grupos = [...new Set(lista.map((p) => p.grupo).filter(Boolean))] as string[];

  const visibles = lista.filter(
    (p) =>
      (filtro === 'todos' || (filtro === 'activos' ? p.estado !== 'finalizado' && p.estado !== 'cancelado' : p.estado === 'finalizado' || p.estado === 'cancelado')) &&
      (!grupo || p.grupo === grupo),
  );
  const ids = visibles.map((p) => p.id as string);

  const [hitos, pagos, bitacora, objetivos, kpis, mediciones] = ids.length
    ? await Promise.all([
        sb.from('pr_hitos').select('id, proyecto_id, fase, nombre, estado, peso, fecha_inicio, fecha_limite, fecha_real, responsable, proximo_paso, situacion').in('proyecto_id', ids),
        sb.from('pr_pagos').select('id, proyecto_id, concepto, tipo, valor, estado, fecha_limite').in('proyecto_id', ids),
        sb.from('pr_bitacora').select('proyecto_id, fecha, tiempo_min, proximo_paso, fecha_proximo').in('proyecto_id', ids),
        sb.from('pr_objetivos').select('id, proyecto_id, descripcion, estado, avance, peso, fecha_meta').in('proyecto_id', ids),
        sb.from('pr_kpis').select('id, proyecto_id, objetivo_id, nombre, unidad, sentido, linea_base, meta').in('proyecto_id', ids),
        sb.from('pr_mediciones').select('proyecto_id, kpi_id, fecha, valor').in('proyecto_id', ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];
  const de = <T,>(res: { data: unknown }, id: string) => ((res.data ?? []) as (T & { proyecto_id: string })[]).filter((x) => x.proyecto_id === id);

  const creadores = esAdmin ? await nombresCreadores(visibles.map((p) => p.creado_por)) : new Map<string, string>();
  const hoy = hoyISO();
  const mes = hoy.slice(0, 7);

  const filas = visibles.map((p) => {
    const h = de<any>(hitos, p.id).map((x) => ({ ...x, peso: Number(x.peso) || 0 }));
    const pg = de<any>(pagos, p.id).map((x) => ({ ...x, valor: Number(x.valor) }));
    const b = de<any>(bitacora, p.id);
    const o = de<any>(objetivos, p.id).map((x) => ({ ...x, avance: x.avance == null ? null : Number(x.avance), peso: Number(x.peso) || 0 }));
    const k = de<any>(kpis, p.id).map((x) => ({ ...x, linea_base: x.linea_base == null ? null : Number(x.linea_base), meta: x.meta == null ? null : Number(x.meta) }));
    const m = de<any>(mediciones, p.id).map((x) => ({ ...x, valor: Number(x.valor) }));
    const salud = saludProyecto(p, h);
    return {
      p,
      salud,
      avance: avanceCronograma(h),
      tiempo: avanceTiempo(p),
      objetivos: cumplimientoObjetivos(o, k, m),
      horas: horasEjecutadas(b),
      horasMes: horasEjecutadas(b.filter((x: any) => x.fecha.startsWith(mes))),
      vencidos: h.filter((x) => hitoAbierto(x) && x.fecha_limite && diasHasta(x.fecha_limite) < 0).length,
      porCobrar: pg.filter((x) => x.tipo !== 'gasto' && (x.estado === 'pendiente' || x.estado === 'facturado')).reduce((s, x) => s + x.valor, 0),
      agenda: agendaProyecto(p, h, pg, b, 14).map((e) => ({ ...e, proyecto: p })),
      ultima: [...b].sort((a: any, c: any) => c.fecha.localeCompare(a.fecha))[0]?.fecha as string | undefined,
    };
  });

  const activos = filas.filter((f) => f.p.estado === 'en_curso' || f.p.estado === 'por_iniciar' || f.p.estado === 'pausado');
  const conteo = (s: Salud) => activos.filter((f) => f.salud === s).length;
  const agenda = filas.flatMap((f) => f.agenda).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const kpisPortafolio: [string, string | number, string, string?][] = [
    ['Proyectos activos', activos.length, 'text-secundario', `${conteo('al_dia')} al día`],
    ['En riesgo o atrasados', conteo('en_riesgo') + conteo('atrasado'), conteo('atrasado') ? 'text-bajo' : conteo('en_riesgo') ? 'text-medio' : 'text-alto', `${conteo('atrasado')} atrasados`],
    ['Hitos vencidos', filas.reduce((s, f) => s + f.vencidos, 0), filas.some((f) => f.vencidos) ? 'text-bajo' : 'text-alto'],
    ['Horas este mes', formatearHoras(filas.reduce((s, f) => s + f.horasMes, 0)), 'text-secundario'],
    ['Por cobrar', formatearPesos(filas.reduce((s, f) => s + f.porCobrar, 0)), 'text-medio'],
  ];

  // Hoja de ruta: todos los proyectos con fechas en una misma línea de tiempo.
  const conFechas = filas.filter((f) => f.p.fecha_inicio && f.p.fecha_fin);
  const tt = (x: string) => new Date(`${x}T12:00:00`).getTime();
  const rMin = conFechas.length ? Math.min(...conFechas.map((f) => tt(f.p.fecha_inicio)), tt(hoy)) : 0;
  const rMax = conFechas.length ? Math.max(...conFechas.map((f) => tt(f.p.fecha_fin)), tt(hoy)) : 1;
  const xr = (x: string) => ((tt(x) - rMin) / Math.max(1, rMax - rMin)) * 100;
  const meses: { etiqueta: string; x: number }[] = [];
  if (conFechas.length) {
    const d = new Date(rMin);
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    while (d.getTime() <= rMax) {
      const iso = d.toISOString().slice(0, 10);
      meses.push({ etiqueta: d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }), x: xr(iso) });
      d.setMonth(d.getMonth() + 1);
    }
  }

  const url = (cambios: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const v = { ver: filtro === 'activos' ? undefined : filtro, grupo, ...cambios };
    for (const [k, x] of Object.entries(v)) if (x) q.set(k, x);
    const s = q.toString();
    return `/proyectos${s ? `?${s}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-degradado px-6 py-7 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-6 -top-8 select-none text-[9rem] leading-none opacity-15" aria-hidden>
          🧭
        </div>
        <div className="relative max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-acento">Consultoría · Ejecutar y controlar</p>
            <EnlaceAyuda seccion="proyectos" claro />
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold">Proyectos</h1>
          <p className="mt-2 text-sm text-white/85">
            Cada proyecto con su cronograma, objetivos, KPIs, bitácora, horas, pagos, riesgos, documentos y los procesos del cliente. La app te dice cómo va y qué
            atender primero.
          </p>
          <div className="mt-4">
            <FormularioProyecto grupos={grupos} />
          </div>
        </div>
      </div>

      {error && (
        <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-medio">
          No se pudieron leer los proyectos. Si es la primera vez, falta correr la migración <strong>0005_proyectos.sql</strong> en Supabase.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {kpisPortafolio.map(([titulo, valor, tono, nota]) => (
          <div key={titulo} className="card p-3">
            <p className="text-[11px] font-medium text-marmol-500">{titulo}</p>
            <p className={cn('font-display text-xl font-bold', tono)}>{valor}</p>
            {nota && <p className="text-[11px] text-marmol-400">{nota}</p>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {(Object.keys(FILTROS) as Filtro[]).map((f) => (
          <Link key={f} href={url({ ver: f === 'activos' ? undefined : f })} className={cn('rounded-full px-3 py-1', filtro === f ? 'bg-secundario font-semibold text-white' : 'bg-white text-marmol-600 ring-1 ring-marmol-200')}>
            {FILTROS[f]}
          </Link>
        ))}
        {grupos.length > 0 && <span className="ml-2 text-marmol-400">Grupo:</span>}
        {grupos.map((g) => (
          <Link key={g} href={url({ grupo: grupo === g ? undefined : g })} className={cn('rounded-full px-3 py-1', grupo === g ? 'bg-marca-600 font-semibold text-white' : 'bg-white text-marmol-600 ring-1 ring-marmol-200')}>
            {g}
          </Link>
        ))}
      </div>

      {visibles.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-3xl">🧭</p>
          <p className="mt-2 text-sm font-medium text-marmol-700">{lista.length ? 'No hay proyectos con este filtro' : 'Todavía no hay proyectos'}</p>
          {!lista.length && <p className="mt-1 text-xs text-marmol-400">Crea el primero con “Nuevo proyecto”: elige una plantilla y el cronograma se arma solo.</p>}
        </div>
      ) : (
        <>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {/* Hoja de ruta */}
            <section className="card p-4">
              <h2 className="font-display text-lg font-semibold text-secundario">🛣️ Hoja de ruta</h2>
              <p className="text-[11px] text-marmol-400">Cada barra va del inicio al fin del proyecto; la parte llena es su avance. La línea roja es hoy.</p>
              {conFechas.length === 0 ? (
                <p className="mt-3 text-sm text-marmol-500">Pon fechas de inicio y fin a los proyectos para verlos en la hoja de ruta.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <div className="min-w-[32rem]">
                    <div className="relative ml-[9rem] h-5 text-[10px] text-marmol-400">
                      {meses.map((m) => (
                        <span key={m.etiqueta} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${m.x}%` }}>
                          {m.etiqueta}
                        </span>
                      ))}
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute bottom-0 top-0 z-10 ml-[9rem] w-[calc(100%-9rem)]">
                        <div className="absolute bottom-0 top-0 w-0.5 bg-bajo/70" style={{ left: `${xr(hoy)}%` }} />
                      </div>
                      {conFechas.map((f) => (
                        <Link key={f.p.id} href={`/proyectos/${f.p.id}`} className="flex items-center border-b border-marmol-100 py-1 hover:bg-marca-50/40">
                          <span className="w-[9rem] shrink-0 truncate pr-2 text-xs text-marmol-700" title={`${f.p.cliente} · ${f.p.nombre}`}>
                            {SALUD[f.salud].emoji} {f.p.cliente}
                          </span>
                          <span className="relative h-5 flex-1">
                            <span
                              className="absolute top-0.5 h-4 overflow-hidden rounded-full bg-marmol-200"
                              style={{ left: `${xr(f.p.fecha_inicio)}%`, width: `${Math.max(1, xr(f.p.fecha_fin) - xr(f.p.fecha_inicio))}%` }}
                              title={`${f.p.nombre}: ${pct(f.avance)} de avance`}
                            >
                              <span
                                className={cn('block h-full rounded-full', f.salud === 'atrasado' ? 'bg-bajo' : f.salud === 'en_riesgo' ? 'bg-acento' : 'bg-marca-500')}
                                style={{ width: `${(f.avance ?? 0) * 100}%` }}
                              />
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Agenda */}
            <section className="card p-4">
              <h2 className="font-display text-lg font-semibold text-secundario">📆 Mi agenda · 14 días</h2>
              <p className="text-[11px] text-marmol-400">Hitos, pagos, próximos pasos y cierres de todos los proyectos (incluye lo vencido).</p>
              {agenda.length === 0 ? (
                <p className="mt-3 text-sm text-alto">✓ Nada pendiente en los próximos 14 días.</p>
              ) : (
                <ol className="mt-3 max-h-[20rem] space-y-1.5 overflow-y-auto pr-1">
                  {agenda.map((e: EventoAgenda & { proyecto: any }, i) => {
                    const d = diasHasta(e.fecha);
                    return (
                      <li key={i}>
                        <Link
                          href={`/proyectos/${e.proyecto.id}${e.tipo === 'pago' ? '?vista=finanzas' : e.tipo === 'paso' ? '?vista=bitacora' : e.tipo === 'hito' ? '?vista=cronograma' : ''}`}
                          className={cn('flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:ring-1 hover:ring-marca-300', e.vencido ? 'bg-red-50' : d <= 2 ? 'bg-amber-50' : 'bg-marmol-50')}
                        >
                          <span>{ICONO_AGENDA[e.tipo]}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-marmol-800">{e.titulo}</span>
                            <span className="text-[11px] text-marmol-500">
                              {e.proyecto.cliente}
                              {e.detalle && ` · ${e.detalle}`}
                            </span>
                          </span>
                          <span className={cn('shrink-0 text-[11px] font-semibold', e.vencido ? 'text-bajo' : d <= 2 ? 'text-medio' : 'text-marmol-500')}>
                            {e.vencido ? `vencido ${-d} d` : d === 0 ? 'hoy' : d === 1 ? 'mañana' : formatearFecha(e.fecha).replace(/ de \d{4}$/, '')}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </div>

          {/* Tarjetas */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filas.map((f) => {
              const s = SALUD[f.salud];
              const diasSin = f.ultima ? -diasHasta(f.ultima) : null;
              return (
                <Link key={f.p.id} href={`/proyectos/${f.p.id}`} className="card group space-y-2 p-4 transition hover:-translate-y-0.5 hover:border-marca-300 hover:shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', s.clase)}>
                      {s.emoji} {s.nombre}
                    </span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', ESTADOS_PROYECTO[f.p.estado as keyof typeof ESTADOS_PROYECTO].clase)}>
                      {ESTADOS_PROYECTO[f.p.estado as keyof typeof ESTADOS_PROYECTO].nombre}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-marca-600">
                      {f.p.cliente}
                      {f.p.grupo && <span className="font-normal text-marmol-400"> · {f.p.grupo}</span>}
                    </p>
                    <h3 className="font-medium text-marmol-900 group-hover:text-secundario">{f.p.nombre}</h3>
                    <p className="text-[11px] text-marmol-400">
                      {TIPOS_PROYECTO[f.p.tipo as keyof typeof TIPOS_PROYECTO]}
                      {esAdmin && creadores.get(f.p.creado_por) && ` · ${creadores.get(f.p.creado_por)}`}
                    </p>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-marmol-500">Cronograma</span>
                      <BarraAvance valor={f.avance} esperado={f.tiempo} tono={f.salud === 'atrasado' ? 'bg-bajo' : f.salud === 'en_riesgo' ? 'bg-acento' : 'bg-marca-500'} alto="h-2" />
                      <span className="w-11 shrink-0 text-right font-semibold text-marmol-700">{pct(f.avance)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-marmol-500">Objetivos</span>
                      <BarraAvance valor={f.objetivos} tono="bg-alto" alto="h-2" />
                      <span className="w-11 shrink-0 text-right font-semibold text-marmol-700">{pct(f.objetivos)}</span>
                    </div>
                  </div>
                  <p className="flex flex-wrap gap-x-3 text-[11px] text-marmol-500">
                    {f.p.fecha_fin && <span>🏁 {diasHasta(f.p.fecha_fin) >= 0 ? `faltan ${diasHasta(f.p.fecha_fin)} d` : 'fecha pasada'}</span>}
                    <span>⏱ {formatearHoras(f.horas)}{f.p.horas_contratadas ? ` / ${formatearHoras(f.p.horas_contratadas)}` : ''}</span>
                    {f.vencidos > 0 && <span className="font-semibold text-bajo">🚩 {f.vencidos} {f.vencidos === 1 ? 'vencido' : 'vencidos'}</span>}
                    {diasSin != null && f.p.frecuencia_dias && diasSin > f.p.frecuencia_dias && <span className="font-semibold text-medio">💤 {diasSin} d sin intervenir</span>}
                  </p>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
