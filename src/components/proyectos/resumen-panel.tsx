import Link from 'next/link';
import { db } from '@/lib/supabase/server';
import type { Facilitador } from '@/lib/auth';
import { ICONO_AGENDA, SALUD, agendaProyecto, avanceCronograma, avanceTiempo, pct, saludProyecto } from '@/lib/proyectos';
import { diasHasta } from '@/lib/procesos';
import { cn, formatearFecha } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { BarraAvance } from './registro';

/** Bloque de "Mi panel": proyectos activos con su salud y lo que vence pronto. */
export async function ResumenProyectosPanel({ facilitador }: { facilitador: Facilitador }) {
  const sb = db();
  let consulta = sb.from('pr_proyectos').select('*').in('estado', ['por_iniciar', 'en_curso', 'pausado']).order('fecha_fin', { ascending: true, nullsFirst: false });
  if (facilitador.rol !== 'admin') consulta = consulta.eq('creado_por', facilitador.id);
  const { data: proyectos, error } = await consulta;
  if (error) return null; // Migración 0005 sin correr: el panel sigue funcionando sin este bloque.
  const lista = (proyectos ?? []) as any[];
  const ids = lista.map((p) => p.id as string);
  const [hitos, pagos, bitacora] = ids.length
    ? await Promise.all([
        sb.from('pr_hitos').select('proyecto_id, id, fase, nombre, estado, peso, fecha_inicio, fecha_limite, fecha_real, responsable, proximo_paso, situacion').in('proyecto_id', ids),
        sb.from('pr_pagos').select('proyecto_id, id, concepto, tipo, valor, estado, fecha_limite').in('proyecto_id', ids),
        sb.from('pr_bitacora').select('proyecto_id, fecha, tiempo_min, proximo_paso, fecha_proximo').in('proyecto_id', ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const de = (res: { data: unknown }, id: string) => ((res.data ?? []) as any[]).filter((x) => x.proyecto_id === id);

  const filas = lista.map((p) => {
    const h = de(hitos, p.id).map((x) => ({ ...x, peso: Number(x.peso) || 0 }));
    return {
      p,
      salud: saludProyecto(p, h),
      avance: avanceCronograma(h),
      tiempo: avanceTiempo(p),
      agenda: agendaProyecto(p, h, de(pagos, p.id).map((x) => ({ ...x, valor: Number(x.valor) })), de(bitacora, p.id), 7).map((e) => ({ ...e, cliente: p.cliente as string, id: p.id as string })),
    };
  });
  const agenda = filas.flatMap((f) => f.agenda).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 6);

  return (
    <section className="card p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-secundario">🗂️ Mis proyectos</h2>
        <Link href="/proyectos" className="inline-flex items-center gap-1 text-xs font-semibold text-marca-600 hover:underline">
          Ver portafolio <ArrowRight size={12} />
        </Link>
      </div>
      {filas.length === 0 ? (
        <p className="mt-2 text-sm text-marmol-500">
          No tienes proyectos activos.{' '}
          <Link href="/proyectos" className="font-semibold text-marca-600 hover:underline">
            Crea el primero
          </Link>{' '}
          con su cronograma, objetivos y KPIs.
        </p>
      ) : (
        <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <ul className="space-y-2">
            {filas.slice(0, 8).map((f) => (
              <li key={f.p.id}>
                <Link href={`/proyectos/${f.p.id}`} className="flex items-center gap-2 text-sm hover:text-secundario">
                  <span title={SALUD[f.salud].nombre}>{SALUD[f.salud].emoji}</span>
                  <span className="w-40 shrink-0 truncate">
                    <span className="font-medium text-marmol-800">{f.p.cliente}</span>
                    <span className="block truncate text-[11px] text-marmol-400">{f.p.nombre}</span>
                  </span>
                  <BarraAvance valor={f.avance} esperado={f.tiempo} tono={f.salud === 'atrasado' ? 'bg-bajo' : f.salud === 'en_riesgo' ? 'bg-acento' : 'bg-marca-500'} alto="h-2" />
                  <span className="w-10 text-right text-xs font-semibold text-marmol-700">{pct(f.avance)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-marmol-400">Esta semana</p>
            {agenda.length === 0 ? (
              <p className="mt-1 text-sm text-alto">✓ Nada vence en los próximos 7 días.</p>
            ) : (
              <ol className="mt-1 space-y-1">
                {agenda.map((e, i) => {
                  const d = diasHasta(e.fecha);
                  return (
                    <li key={i}>
                      <Link href={`/proyectos/${e.id}`} className={cn('flex items-center gap-2 rounded-lg px-2 py-1 text-xs', e.vencido ? 'bg-red-50' : 'bg-marmol-50')}>
                        <span>{ICONO_AGENDA[e.tipo]}</span>
                        <span className="min-w-0 flex-1 truncate text-marmol-700">
                          {e.titulo} <span className="text-marmol-400">· {e.cliente}</span>
                        </span>
                        <span className={cn('shrink-0 font-semibold', e.vencido ? 'text-bajo' : 'text-marmol-500')}>
                          {e.vencido ? `vencido ${-d} d` : d === 0 ? 'hoy' : formatearFecha(e.fecha).replace(/ de \d{4}$/, '')}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
