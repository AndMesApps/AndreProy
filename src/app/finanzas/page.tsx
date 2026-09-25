import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getFacilitador } from '@/lib/auth';
import { db } from '@/lib/supabase/server';
import { parametrosDe } from '@/lib/finanzas-servidor';
import {
  MODALIDADES,
  formatoMes,
  mesSiguiente,
  pesos,
  proyeccionMensual,
  rentabilidad,
  totalesMovimientos,
  type ProyectoConsolidado,
  type ProyectoFinanzas,
} from '@/lib/finanzas';
import { hoyISO, pct } from '@/lib/proyectos';
import { cn } from '@/lib/utils';
import { FormularioParametros } from '@/components/finanzas/formulario-parametros';
import { EnlaceAyuda } from '@/components/manual/enlace-ayuda';

export const metadata = { title: 'Mis finanzas' };

const n = (v: unknown) => (v == null ? null : Number(v));

/**
 * Mis finanzas: lo que ganas de verdad con todos tus proyectos, cuánto pagas
 * de seguridad social cada mes y qué proyectos son más rentables.
 */
export default async function FinanzasPage() {
  const facilitador = await getFacilitador();
  if (!facilitador) redirect('/ingresar');
  const { parametros, guardados } = await parametrosDe(facilitador.id);

  const sb = db();
  // Son tus finanzas personales: solo los proyectos que tú creaste.
  const { data: proyectos } = await sb
    .from('pr_proyectos')
    .select('*')
    .eq('creado_por', facilitador.id)
    .in('estado', ['por_iniciar', 'en_curso', 'pausado', 'finalizado']);
  const lista = (proyectos ?? []) as any[];
  const ids = lista.map((p) => p.id as string);
  const [bitacora, presupuesto, pagos] = ids.length
    ? await Promise.all([
        sb.from('pr_bitacora').select('proyecto_id, fecha, tiempo_min').in('proyecto_id', ids),
        sb.from('pr_presupuesto').select('proyecto_id, valor_planeado').in('proyecto_id', ids),
        sb.from('pr_pagos').select('proyecto_id, tipo, valor, estado, categoria, reembolsable, horas, fecha_limite, fecha_pago').in('proyecto_id', ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const finanzasDe = (p: any): ProyectoFinanzas => ({
    modalidad_cobro: p.modalidad_cobro ?? 'valor_fijo',
    valor_contrato: n(p.valor_contrato),
    valor_hora: n(p.valor_hora),
    horas_contratadas: n(p.horas_contratadas),
    cobra_iva: Boolean(p.cobra_iva),
    retefuente_pct: n(p.retefuente_pct),
    reteica_por_mil: n(p.reteica_por_mil),
    otras_retenciones_pct: Number(p.otras_retenciones_pct) || 0,
    participacion_aliado_pct: Number(p.participacion_aliado_pct) || 0,
    viaticos_pactados: n(p.viaticos_pactados),
    fecha_inicio: p.fecha_inicio,
    fecha_fin: p.fecha_fin,
  });

  const consolidados: (ProyectoConsolidado & { estado: string; horasReales: number; movs: any[] })[] = lista.map((p) => {
    const horasPorMes = new Map<string, number>();
    let horasReales = 0;
    for (const b of ((bitacora.data ?? []) as any[]).filter((x) => x.proyecto_id === p.id)) {
      const h = (Number(b.tiempo_min) || 0) / 60;
      horasReales += h;
      horasPorMes.set(b.fecha.slice(0, 7), (horasPorMes.get(b.fecha.slice(0, 7)) ?? 0) + h);
    }
    return {
      id: p.id,
      nombre: p.nombre,
      cliente: p.cliente,
      estado: p.estado,
      finanzas: finanzasDe(p),
      gastosPlaneados: ((presupuesto.data ?? []) as any[]).filter((x) => x.proyecto_id === p.id).reduce((s, x) => s + Number(x.valor_planeado), 0),
      horasRealesPorMes: horasPorMes,
      horasReales,
      movs: ((pagos.data ?? []) as any[]).filter((x) => x.proyecto_id === p.id).map((x) => ({ ...x, valor: Number(x.valor) })),
    };
  });

  const mesActual = hoyISO().slice(0, 7);
  const meses = proyeccionMensual(
    consolidados.filter((c) => c.estado !== 'finalizado' || c.finanzas.fecha_fin == null || c.finanzas.fecha_fin.slice(0, 7) >= mesActual),
    parametros,
    mesActual,
  ).filter((m) => m.mes >= mesActual.slice(0, 4) + '-01');
  const este = meses.find((m) => m.mes === mesActual);
  const anterior = meses.find((m) => mesSiguiente(m.mes) === mesActual);
  const maxIngreso = Math.max(1, ...meses.map((m) => m.ingreso), parametros.meta_ingreso_mensual ?? 0);

  const ranking = consolidados
    .map((c) => {
      const plan = rentabilidad(c.finanzas, parametros, { horas: Number(c.finanzas.horas_contratadas) || 0, costos: c.gastosPlaneados, viaticos: Number(c.finanzas.viaticos_pactados) || 0 });
      const t = totalesMovimientos(c.movs);
      return { c, plan, t };
    })
    .filter((x) => x.plan.ingreso > 0)
    .sort((a, b) => (b.plan.margen ?? 0) - (a.plan.margen ?? 0));

  const anio = meses.filter((m) => m.mes.startsWith(mesActual.slice(0, 4)));
  const suma = (f: (m: (typeof meses)[number]) => number) => anio.reduce((s, m) => s + f(m), 0);
  const porCobrar = ranking.reduce((s, x) => s + x.t.porCobrar, 0);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-degradado px-6 py-7 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-6 -top-8 select-none text-[9rem] leading-none opacity-15" aria-hidden>
          💰
        </div>
        <div className="relative max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-acento">Consultora independiente · Colombia</p>
            <EnlaceAyuda seccion="finanzas" claro />
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold">Mis finanzas</h1>
          <p className="mt-2 text-sm text-white/85">
            Cuánto te queda de verdad después de retenciones, seguridad social, gastos e impuestos; cuánto pagar en la planilla cada mes y qué proyectos son más rentables.
          </p>
        </div>
      </div>

      <FormularioParametros parametros={parametros} guardados={guardados} />

      {/* Este mes */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Cifra titulo={`Ingresos de ${formatoMes(mesActual)}`} valor={pesos(este?.ingreso ?? 0)} nota={parametros.meta_ingreso_mensual ? `meta ${pesos(parametros.meta_ingreso_mensual)}` : 'sin meta definida'} />
        <Cifra titulo="Te queda libre este mes" valor={pesos(este?.utilidad ?? 0)} nota={este?.ingreso ? `${pct((este.utilidad ?? 0) / este.ingreso)} de lo que facturas` : undefined} tono="text-alto" />
        <Cifra
          titulo={`Planilla PILA a pagar en ${formatoMes(mesActual).split(' ')[0]}`}
          valor={pesos(anterior?.aportes.total ?? 0)}
          nota={anterior ? `corresponde a ${formatoMes(anterior.mes)} (mes vencido)` : 'sin ingresos el mes pasado'}
          tono="text-medio"
        />
        <Cifra titulo="Por cobrar (todos los proyectos)" valor={pesos(porCobrar)} tono="text-secundario" />
      </div>

      {/* Proyección mensual */}
      <section className="card p-4">
        <h2 className="font-display text-lg font-semibold text-secundario">📅 Mes a mes</h2>
        <p className="text-[11px] text-marmol-400">
          Ingresos de todos tus proyectos repartidos por mes (lo pasado de los proyectos por horas, con las horas reales de la bitácora). La seguridad social se calcula sobre la
          suma del mes, como la planilla. La barra verde es lo que te queda libre; la gris, el resto de lo facturado.
        </p>
        {meses.length === 0 ? (
          <p className="mt-3 text-sm text-marmol-500">
            Aún no hay ingresos para proyectar. Configura cómo se cobra cada proyecto en su pestaña <strong>💰 Finanzas</strong> (y ponle fechas de inicio y fin).
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[46rem] text-xs">
              <thead className="text-right text-marmol-400">
                <tr>
                  <th className="py-1.5 text-left font-medium">Mes</th>
                  <th className="w-[22%] font-medium" />
                  <th className="font-medium">Ingresos</th>
                  <th className="font-medium">Retenciones</th>
                  <th className="font-medium">Seg. social</th>
                  <th className="font-medium">Gastos</th>
                  <th className="font-medium">Renta (prov.)</th>
                  <th className="font-medium">Te queda</th>
                </tr>
              </thead>
              <tbody>
                {meses.map((m) => (
                  <tr key={m.mes} className={cn('border-t border-marmol-100 text-right align-top', m.mes === mesActual && 'bg-marca-50/60')}>
                    <td className="py-1.5 text-left text-marmol-700">
                      {formatoMes(m.mes)}
                      {m.mes === mesActual && <span className="ml-1 rounded bg-marca-500 px-1 text-[9px] font-semibold uppercase text-white">hoy</span>}
                      <span className="block text-[10px] normal-case text-marmol-400">{m.porProyecto.map((x) => x.cliente).join(' · ')}</span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="relative h-3 rounded-full bg-marmol-100" title={`${pesos(m.ingreso)} facturado, ${pesos(m.utilidad)} libre`}>
                        <div className="absolute inset-y-0 left-0 rounded-full bg-marmol-300" style={{ width: `${(m.ingreso / maxIngreso) * 100}%` }} />
                        <div className="absolute inset-y-0 left-0 rounded-full bg-alto" style={{ width: `${(Math.max(0, m.utilidad) / maxIngreso) * 100}%` }} />
                        {parametros.meta_ingreso_mensual ? (
                          <div className="absolute -top-0.5 h-4 w-0.5 bg-secundario" style={{ left: `${(parametros.meta_ingreso_mensual / maxIngreso) * 100}%` }} title="Meta de ingreso" />
                        ) : null}
                      </div>
                    </td>
                    <td className="font-semibold text-marmol-900">{pesos(m.ingreso)}</td>
                    <td className="text-marmol-600">{pesos(m.retenciones)}</td>
                    <td className="text-medio" title={m.aportes.nota ?? undefined}>
                      {pesos(m.aportes.total)}
                      {m.aportes.nota && <span className="text-marmol-400"> *</span>}
                    </td>
                    <td className="text-marmol-600">{pesos(m.gastos)}</td>
                    <td className="text-marmol-600">{pesos(m.renta)}</td>
                    <td className={cn('font-semibold', m.utilidad >= 0 ? 'text-alto' : 'text-bajo')}>{pesos(m.utilidad)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-marmol-300 text-right font-semibold">
                  <td className="py-1.5 text-left">Total {mesActual.slice(0, 4)}</td>
                  <td />
                  <td>{pesos(suma((m) => m.ingreso))}</td>
                  <td>{pesos(suma((m) => m.retenciones))}</td>
                  <td>{pesos(suma((m) => m.aportes.total))}</td>
                  <td>{pesos(suma((m) => m.gastos))}</td>
                  <td>{pesos(suma((m) => m.renta))}</td>
                  <td className="text-alto">{pesos(suma((m) => m.utilidad))}</td>
                </tr>
              </tfoot>
            </table>
            <p className="mt-1 text-[10px] text-marmol-400">* Pasa el mouse sobre la cifra para ver la nota (base mínima o tope de cotización).</p>
          </div>
        )}
      </section>

      {/* Detalle de la planilla */}
      {meses.length > 0 && (
        <section className="card p-4">
          <h2 className="font-display text-lg font-semibold text-secundario">🏥 Tu planilla de seguridad social</h2>
          <p className="text-[11px] text-marmol-400">
            Se paga mes vencido (la de un mes, en el siguiente), en la fecha que te toca según los últimos dígitos de tu cédula. Muchos clientes piden la planilla pagada para
            hacerte el pago.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[38rem] text-xs">
              <thead className="text-right text-marmol-400">
                <tr>
                  <th className="py-1.5 text-left font-medium">Periodo</th>
                  <th className="font-medium">Se paga en</th>
                  <th className="font-medium">Base (IBC)</th>
                  <th className="font-medium">Salud</th>
                  <th className="font-medium">Pensión</th>
                  <th className="font-medium">Solidaridad</th>
                  <th className="font-medium">ARL</th>
                  <th className="font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {meses.map((m) => (
                  <tr key={m.mes} className="border-t border-marmol-100 text-right">
                    <td className="py-1.5 text-left text-marmol-700">{formatoMes(m.mes)}</td>
                    <td className="text-marmol-500">{formatoMes(mesSiguiente(m.mes))}</td>
                    <td>{pesos(m.aportes.ibc)}</td>
                    <td>{pesos(m.aportes.salud)}</td>
                    <td>{pesos(m.aportes.pension)}</td>
                    <td>{pesos(m.aportes.fsp)}</td>
                    <td>{pesos(m.aportes.arl)}</td>
                    <td className="font-semibold text-marmol-900">{pesos(m.aportes.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Rentabilidad por proyecto */}
      <section className="card p-4">
        <h2 className="font-display text-lg font-semibold text-secundario">🏆 ¿Qué proyectos te dejan más?</h2>
        <p className="text-[11px] text-marmol-400">Con lo planeado de cada proyecto: horas contratadas, presupuesto de gastos y viáticos pactados.</p>
        {ranking.length === 0 ? (
          <p className="mt-3 text-sm text-marmol-500">Configura el cobro de tus proyectos para comparar su rentabilidad.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-xs">
              <thead className="text-right text-marmol-400">
                <tr>
                  <th className="py-1.5 text-left font-medium">Proyecto</th>
                  <th className="font-medium">Cobro</th>
                  <th className="font-medium">Ingreso</th>
                  <th className="font-medium">Te queda</th>
                  <th className="font-medium">Margen</th>
                  <th className="font-medium">Valor real de la hora</th>
                  <th className="font-medium">Por cobrar</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map(({ c, plan, t }) => (
                  <tr key={c.id} className="border-t border-marmol-100 text-right">
                    <td className="py-1.5 text-left">
                      <Link href={`/proyectos/${c.id}?vista=finanzas`} className="font-medium text-marmol-800 hover:text-secundario">
                        {c.cliente}
                      </Link>
                      <span className="block text-[10px] text-marmol-400">{c.nombre}</span>
                    </td>
                    <td className="text-marmol-500">{MODALIDADES[c.finanzas.modalidad_cobro].nombre}</td>
                    <td>{pesos(plan.ingreso)}</td>
                    <td className="font-semibold text-alto">{pesos(plan.utilidad)}</td>
                    <td className={cn('font-semibold', (plan.margen ?? 0) * 100 >= parametros.margen_objetivo_pct ? 'text-alto' : 'text-bajo')}>{pct(plan.margen)}</td>
                    <td>{pesos(plan.valorHoraNeto)}</td>
                    <td className={cn(t.vencido > 0 ? 'font-semibold text-bajo' : 'text-marmol-600')}>{pesos(t.porCobrar)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-center text-[11px] text-marmol-400">
        Estos cálculos son para planear y decidir. No reemplazan la asesoría de tu contador ni la liquidación oficial de la planilla y los impuestos.
      </p>
    </div>
  );
}

function Cifra({ titulo, valor, nota, tono = 'text-secundario' }: { titulo: string; valor: string; nota?: string; tono?: string }) {
  return (
    <div className="card p-3">
      <p className="text-[11px] font-medium text-marmol-500">{titulo}</p>
      <p className={cn('font-display text-xl font-bold', tono)}>{valor}</p>
      {nota && <p className="text-[11px] text-marmol-400">{nota}</p>}
    </div>
  );
}
