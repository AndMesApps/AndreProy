'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { alternarRequisito, guardarModeloCobro } from '@/app/proyectos/actions';
import {
  CATEGORIAS_GASTO,
  IVA_PCT,
  MODALIDADES,
  REQUISITOS_SUGERIDOS,
  RETEIVA_PCT,
  TARIFAS_ARL,
  aportesDelMes,
  formatoMes,
  gastoPorCategoria,
  ingresoPorMes,
  pesos,
  rentabilidad,
  totalesMovimientos,
  type Modalidad,
  type Parametros,
  type ProyectoFinanzas,
  type Rentabilidad,
} from '@/lib/finanzas';
import { formatearHoras, hoyISO, leerNumero, pct } from '@/lib/proyectos';
import { diasHasta } from '@/lib/procesos';
import { cn, formatearFecha } from '@/lib/utils';
import { Check, Pencil, Plus } from 'lucide-react';
import { BarraAvance, FormularioRegistro, type Registro } from './registro';

export interface MovimientoVista extends Registro {
  id: string;
  concepto: string;
  tipo: 'cobro' | 'contrapartida' | 'gasto' | 'viatico';
  valor: number;
  estado: 'pendiente' | 'facturado' | 'pagado' | 'anulado';
  categoria: string | null;
  reembolsable: boolean;
  horas: number | null;
  fecha_limite: string | null;
  fecha_pago: string | null;
  soporte: string | null;
  requisitos_cumplidos: string[];
}

export interface PresupuestoVista extends Registro {
  id: string;
  categoria: string;
  descripcion: string;
  valor_planeado: number;
  reembolsable: boolean;
}

export type ProyectoConFinanzas = ProyectoFinanzas & { requisitos_cobro: string | null };

const TIPO_MOV = { cobro: '💰 Cobro', contrapartida: '🤝 Aporte', viatico: '🧳 Viáticos', gasto: '🧾 Gasto' } as const;
const ESTADO_MOV: Record<MovimientoVista['estado'], string> = {
  pendiente: 'bg-marmol-100 text-marmol-600',
  facturado: 'bg-blue-100 text-deber',
  pagado: 'bg-green-100 text-alto',
  anulado: 'bg-marmol-50 text-marmol-400 line-through',
};

export function Finanzas({
  proyectoId,
  proyecto,
  parametros,
  horasEjecutadas,
  horasPorMes,
  avance,
  movimientos,
  presupuesto,
}: {
  proyectoId: string;
  proyecto: ProyectoConFinanzas;
  parametros: Parametros;
  horasEjecutadas: number;
  horasPorMes: [string, number][];
  avance: number | null;
  movimientos: MovimientoVista[];
  presupuesto: PresupuestoVista[];
}) {
  const [editandoModelo, setEditandoModelo] = useState(false);
  const [formMov, setFormMov] = useState<MovimientoVista | 'nuevo' | null>(null);
  const [formPres, setFormPres] = useState<PresupuestoVista | 'nuevo' | null>(null);

  const t = totalesMovimientos(movimientos);
  const gastosPlaneados = presupuesto.reduce((s, b) => s + Number(b.valor_planeado), 0);
  const horasPlan = Number(proyecto.horas_contratadas) || 0;
  const plan = rentabilidad(proyecto, parametros, { horas: horasPlan, costos: gastosPlaneados, viaticos: Number(proyecto.viaticos_pactados) || 0 });
  // Lo real: por horas se cobra lo ejecutado; con valor fijo, lo facturado a la fecha.
  const ingresoReal = proyecto.modalidad_cobro === 'valor_fijo' ? t.facturado : undefined;
  const real = rentabilidad(proyecto, parametros, { horas: horasEjecutadas, ingreso: ingresoReal, costos: t.gastos, viaticos: t.viaticos });
  const requisitos = (proyecto.requisitos_cobro ?? '')
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean);
  const categorias = gastoPorCategoria(presupuesto, movimientos);
  const ordenMov = [...movimientos].sort((a, b) => (a.fecha_limite ?? '9999').localeCompare(b.fecha_limite ?? '9999'));

  // Seguridad social de este proyecto mes a mes (como si fuera el único contrato del mes).
  const mesActual = hoyISO().slice(0, 7);
  const porMes = [...ingresoPorMes(proyecto, new Map(horasPorMes), mesActual).entries()];
  const consumoHoras = horasPlan ? horasEjecutadas / horasPlan : null;
  const margenOk = plan.margen != null && plan.margen * 100 >= parametros.margen_objetivo_pct;

  return (
    <div className="space-y-5">
      {/* Modelo de cobro */}
      <section className="rounded-xl border border-marmol-200 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display font-semibold text-secundario">🧮 Cómo se cobra este proyecto</h3>
          {!editandoModelo && (
            <button type="button" onClick={() => setEditandoModelo(true)} className="no-imprimir ml-auto inline-flex items-center gap-1 text-xs font-semibold text-marca-600 hover:underline">
              <Pencil size={12} /> Configurar
            </button>
          )}
        </div>
        {editandoModelo ? (
          <ModeloCobro proyectoId={proyectoId} proyecto={proyecto} parametros={parametros} onListo={() => setEditandoModelo(false)} />
        ) : (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <Chip>{MODALIDADES[proyecto.modalidad_cobro].nombre}</Chip>
            {proyecto.modalidad_cobro !== 'valor_fijo' && <Chip>{pesos(proyecto.valor_hora)} por hora</Chip>}
            {proyecto.modalidad_cobro !== 'por_horas' && <Chip>Valor fijo {pesos(proyecto.valor_contrato)}</Chip>}
            {horasPlan > 0 && <Chip>{formatearHoras(horasPlan)} contratadas</Chip>}
            <Chip>{proyecto.cobra_iva ? `Cobra IVA ${IVA_PCT} %` : 'Sin IVA'}</Chip>
            <Chip>Retención {proyecto.retefuente_pct ?? parametros.retefuente_pct} %</Chip>
            <Chip>ReteICA {proyecto.reteica_por_mil ?? parametros.reteica_por_mil} por mil</Chip>
            {Number(proyecto.otras_retenciones_pct) > 0 && <Chip>Otras deducciones {proyecto.otras_retenciones_pct} %</Chip>}
            {Number(proyecto.participacion_aliado_pct) > 0 && <Chip>Aliado {proyecto.participacion_aliado_pct} %</Chip>}
            {proyecto.viaticos_pactados ? <Chip>Viáticos pactados {pesos(proyecto.viaticos_pactados)}</Chip> : null}
          </div>
        )}
      </section>

      {/* Cifras clave */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Cifra titulo="Te queda libre (planeado)" valor={pesos(plan.utilidad)} nota={`margen ${pct(plan.margen)} · objetivo ${parametros.margen_objetivo_pct} %`} tono={margenOk ? 'text-alto' : 'text-bajo'} />
        <Cifra titulo="Valor real de tu hora" valor={pesos(plan.valorHoraNeto)} nota={horasPlan ? `neto, sobre ${formatearHoras(horasPlan)}` : 'pon las horas del proyecto'} />
        <Cifra
          titulo="Puedes gastar hasta"
          valor={pesos(plan.topeGastos)}
          nota={`llevas ${pesos(t.gastos)} (${gastosPlaneados ? `planeaste ${pesos(gastosPlaneados)}` : 'sin presupuesto'})`}
          tono={t.gastos > plan.topeGastos ? 'text-bajo' : 'text-secundario'}
        />
        <Cifra titulo="Seguridad social del proyecto" valor={pesos(plan.seguridadSocial)} nota="estimada; el pago real es mensual" tono="text-medio" />
      </div>

      {/* Rentabilidad planeado vs real */}
      <section className="rounded-xl border border-marmol-200 p-4">
        <h3 className="font-display font-semibold text-secundario">📊 Rentabilidad: planeado contra real</h3>
        <p className="text-[11px] text-marmol-400">
          Planeado = horas contratadas, presupuesto y viáticos pactados. Real = {proyecto.modalidad_cobro === 'valor_fijo' ? 'lo facturado a la fecha' : 'horas de la bitácora × valor hora'}, gastos y
          viáticos registrados.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[26rem] text-sm">
            <thead className="text-right text-xs text-marmol-400">
              <tr>
                <th className="py-1 text-left font-medium">Concepto</th>
                <th className="font-medium">Planeado</th>
                <th className="font-medium">Real a la fecha</th>
              </tr>
            </thead>
            <tbody>
              <Fila nombre="Ingreso del proyecto (sin IVA)" a={plan.ingreso} b={real.ingreso} fuerte />
              {(plan.aliado > 0 || real.aliado > 0) && <Fila nombre="− Participación del aliado" a={-plan.aliado} b={-real.aliado} />}
              {(plan.otras > 0 || real.otras > 0) && <Fila nombre="− Otras deducciones (estampillas, contribuciones)" a={-plan.otras} b={-real.otras} />}
              <Fila nombre="− Gastos (menos viáticos que paga el cliente)" a={-plan.costosNetos} b={-real.costosNetos} />
              <Fila nombre="− Seguridad social (salud, pensión, ARL)" a={-plan.seguridadSocial} b={-real.seguridadSocial} />
              <Fila nombre="− Impuesto de industria y comercio (ICA)" a={-plan.ica} b={-real.ica} />
              <Fila nombre={`− Provisión impuesto de renta (${parametros.provision_renta_pct} %)`} a={-plan.renta} b={-real.renta} />
              {parametros.gmf && <Fila nombre="− 4x1000 (GMF)" a={-plan.gmf} b={-real.gmf} />}
              <Fila nombre="= Te queda libre" a={plan.utilidad} b={real.utilidad} fuerte total />
              <tr className="text-right text-xs text-marmol-500">
                <td className="py-1 text-left">Margen · valor real de la hora</td>
                <td>
                  {pct(plan.margen)} · {pesos(plan.valorHoraNeto)}
                </td>
                <td>
                  {pct(real.margen)} · {pesos(real.valorHoraNeto)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Flujo de caja */}
      <section className="grid gap-3 md:grid-cols-2">
        <FlujoCaja r={plan} titulo="💳 Lo que entra a tu cuenta (planeado)" />
        <div className="rounded-xl border border-marmol-200 p-4 text-sm">
          <h3 className="font-display font-semibold text-secundario">⏱ Horas</h3>
          <p className="mt-1 text-xs text-marmol-500">
            {formatearHoras(horasEjecutadas)} ejecutadas {horasPlan ? `de ${formatearHoras(horasPlan)} contratadas` : ''} · {formatearHoras(t.horasFacturadas)} facturadas
          </p>
          {consumoHoras != null && (
            <div className="mt-2 space-y-1">
              <BarraAvance valor={consumoHoras} esperado={avance} tono={consumoHoras > 1 ? 'bg-bajo' : avance != null && consumoHoras - avance > 0.15 ? 'bg-acento' : 'bg-marca-500'} />
              <p className="text-[11px] text-marmol-500">{pct(consumoHoras)} de las horas usadas · la marca oscura es el avance del cronograma ({pct(avance)}).</p>
            </div>
          )}
          {proyecto.modalidad_cobro !== 'valor_fijo' && horasEjecutadas > t.horasFacturadas && (
            <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-medio">
              Tienes {formatearHoras(horasEjecutadas - t.horasFacturadas)} trabajadas sin facturar ({pesos((horasEjecutadas - t.horasFacturadas) * (Number(proyecto.valor_hora) || 0))}).
            </p>
          )}
          <p className="mt-2 text-[11px] text-marmol-400">Las horas salen de la bitácora (tiempo de cada intervención).</p>
        </div>
      </section>

      {/* Presupuesto de gastos */}
      <section className="rounded-xl border border-marmol-200 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display font-semibold text-secundario">🧾 Presupuesto de gastos</h3>
          <button type="button" onClick={() => setFormPres('nuevo')} className="boton-secundario no-imprimir ml-auto py-1 text-xs">
            <Plus size={13} /> Gasto planeado
          </button>
        </div>
        {formPres === 'nuevo' && (
          <div className="mt-2">
            <FormularioRegistro entidad="presupuesto" proyectoId={proyectoId} onListo={() => setFormPres(null)} />
          </div>
        )}
        {categorias.length === 0 ? (
          <p className="mt-2 text-sm text-marmol-500">Planea cuánto vas a gastar en transporte, alimentación, alojamiento, insumos… Así sabes cuánto te queda libre.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {categorias.map((c) => (
              <div key={c.categoria} className="text-xs">
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-marmol-700">{CATEGORIAS_GASTO[c.categoria as keyof typeof CATEGORIAS_GASTO] ?? c.categoria}</span>
                  <span className={cn(c.real > c.planeado && c.planeado > 0 ? 'font-semibold text-bajo' : 'text-marmol-500')}>
                    {pesos(c.real)} de {pesos(c.planeado)}
                  </span>
                </div>
                <BarraAvance valor={c.planeado ? c.real / c.planeado : c.real ? 1 : 0} tono={c.real > c.planeado ? 'bg-bajo' : 'bg-marca-500'} alto="mt-0.5 h-1.5" />
              </div>
            ))}
          </div>
        )}
        {presupuesto.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-marmol-500">Ver los {presupuesto.length} gastos planeados</summary>
            <ul className="mt-2 space-y-1">
              {presupuesto.map((b) =>
                formPres !== 'nuevo' && formPres?.id === b.id ? (
                  <li key={b.id}>
                    <FormularioRegistro entidad="presupuesto" proyectoId={proyectoId} registro={b} onListo={() => setFormPres(null)} />
                  </li>
                ) : (
                  <li key={b.id} className="flex items-center gap-2 text-xs">
                    <span className="min-w-0 flex-1 text-marmol-700">
                      {CATEGORIAS_GASTO[b.categoria as keyof typeof CATEGORIAS_GASTO] ?? b.categoria} · {b.descripcion}
                      {b.reembolsable && <span className="text-marca-700"> · reembolsable</span>}
                    </span>
                    <span className="font-semibold text-marmol-800">{pesos(Number(b.valor_planeado))}</span>
                    <button type="button" onClick={() => setFormPres(b)} className="no-imprimir text-marmol-300 hover:text-secundario" title="Editar">
                      <Pencil size={11} />
                    </button>
                  </li>
                ),
              )}
            </ul>
          </details>
        )}
      </section>

      {/* Movimientos */}
      <section className="rounded-xl border border-marmol-200 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display font-semibold text-secundario">💵 Cobros, viáticos y gastos</h3>
          <span className="text-xs text-marmol-500">
            Cobrado {pesos(t.cobrado)} · por cobrar {pesos(t.porCobrar)}
            {t.vencido > 0 && <strong className="text-bajo"> · vencido {pesos(t.vencido)}</strong>}
          </span>
          <button type="button" onClick={() => setFormMov('nuevo')} className="boton no-imprimir ml-auto py-1 text-xs">
            <Plus size={13} /> Movimiento
          </button>
        </div>
        {formMov === 'nuevo' && (
          <div className="mt-2">
            <FormularioRegistro entidad="pagos" proyectoId={proyectoId} onListo={() => setFormMov(null)} />
          </div>
        )}
        {ordenMov.length === 0 ? (
          <p className="mt-2 text-sm text-marmol-500">Registra los cobros al cliente (con sus requisitos), los viáticos que te reconoce y tus gastos reales.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {ordenMov.map((m) =>
              formMov !== 'nuevo' && formMov?.id === m.id ? (
                <li key={m.id}>
                  <FormularioRegistro entidad="pagos" proyectoId={proyectoId} registro={m} onListo={() => setFormMov(null)} />
                </li>
              ) : (
                <li key={m.id} className="rounded-lg border border-marmol-100 p-2.5 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-marmol-500">{TIPO_MOV[m.tipo]}</span>
                    <span className="min-w-0 flex-1 font-medium text-marmol-800">
                      {m.concepto}
                      {m.categoria && m.tipo === 'gasto' && <span className="text-xs font-normal text-marmol-400"> · {CATEGORIAS_GASTO[m.categoria as keyof typeof CATEGORIAS_GASTO] ?? m.categoria}</span>}
                      {m.horas ? <span className="text-xs font-normal text-marmol-400"> · {formatearHoras(Number(m.horas))}</span> : null}
                    </span>
                    <span className="font-semibold text-marmol-900">{pesos(Number(m.valor))}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', ESTADO_MOV[m.estado])}>{m.estado[0]!.toUpperCase() + m.estado.slice(1)}</span>
                    <button type="button" onClick={() => setFormMov(m)} className="no-imprimir text-marmol-300 hover:text-secundario" title="Editar">
                      <Pencil size={12} />
                    </button>
                  </div>
                  <p className="mt-0.5 text-[11px] text-marmol-500">
                    {m.fecha_limite && (
                      <span className={cn(m.estado !== 'pagado' && diasHasta(m.fecha_limite) < 0 && 'font-semibold text-bajo')}>límite {formatearFecha(m.fecha_limite)}</span>
                    )}
                    {m.fecha_pago && <span className="text-alto"> · pagado {formatearFecha(m.fecha_pago)}</span>}
                    {m.reembolsable && <span className="text-marca-700"> · reembolsable</span>}
                    {m.soporte && <span> · 📎 {m.soporte}</span>}
                  </p>
                  {m.tipo === 'cobro' && requisitos.length > 0 && m.estado !== 'anulado' && (
                    <Requisitos proyectoId={proyectoId} pagoId={m.id} requisitos={requisitos} cumplidos={m.requisitos_cumplidos ?? []} />
                  )}
                </li>
              ),
            )}
          </ul>
        )}
      </section>

      {/* Seguridad social mes a mes */}
      {porMes.length > 0 && (
        <section className="rounded-xl border border-marmol-200 p-4">
          <h3 className="font-display font-semibold text-secundario">🏥 Seguridad social de este proyecto, mes a mes</h3>
          <p className="text-[11px] text-marmol-400">
            Calculada como si este fuera tu único contrato del mes. Si tienes varios, la planilla real suma todos: mírala en{' '}
            <Link href="/finanzas" className="font-semibold text-marca-600 hover:underline">
              💰 Mis finanzas
            </Link>
            . ARL: {TARIFAS_ARL[parametros.clase_arl]?.nombre}.
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[30rem] text-xs">
              <thead className="text-right text-marmol-400">
                <tr>
                  <th className="py-1 text-left font-medium">Mes</th>
                  <th className="font-medium">Ingreso</th>
                  <th className="font-medium">Base (IBC)</th>
                  <th className="font-medium">Salud</th>
                  <th className="font-medium">Pensión</th>
                  <th className="font-medium">ARL</th>
                  <th className="font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {porMes.map(([mes, ingreso]) => {
                  const a = aportesDelMes(ingreso, parametros);
                  return (
                    <tr key={mes} className="border-t border-marmol-100 text-right">
                      <td className="py-1 text-left text-marmol-700">{formatoMes(mes)}</td>
                      <td>{pesos(ingreso)}</td>
                      <td>{pesos(a.ibc)}</td>
                      <td>{pesos(a.salud)}</td>
                      <td>{pesos(a.pension + a.fsp)}</td>
                      <td>{pesos(a.arl)}</td>
                      <td className="font-semibold text-marmol-900">{pesos(a.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-marmol-100 px-2.5 py-0.5 font-medium text-marmol-700">{children}</span>;
}

function Cifra({ titulo, valor, nota, tono = 'text-secundario' }: { titulo: string; valor: string; nota?: string; tono?: string }) {
  return (
    <div className="rounded-xl bg-marmol-50 p-3">
      <p className="text-[11px] font-medium text-marmol-500">{titulo}</p>
      <p className={cn('font-display text-lg font-bold sm:text-xl', tono)}>{valor}</p>
      {nota && <p className="text-[10px] leading-tight text-marmol-400">{nota}</p>}
    </div>
  );
}

function Fila({ nombre, a, b, fuerte, total }: { nombre: string; a: number; b: number; fuerte?: boolean; total?: boolean }) {
  return (
    <tr className={cn('border-t text-right', total ? 'border-marmol-300' : 'border-marmol-100')}>
      <td className={cn('py-1.5 text-left', fuerte ? 'font-semibold text-marmol-900' : 'text-marmol-600')}>{nombre}</td>
      <td className={cn(fuerte && 'font-semibold', total && (a >= 0 ? 'text-alto' : 'text-bajo'))}>{pesos(a)}</td>
      <td className={cn(fuerte && 'font-semibold', total && (b >= 0 ? 'text-alto' : 'text-bajo'))}>{pesos(b)}</td>
    </tr>
  );
}

function FlujoCaja({ r, titulo }: { r: Rentabilidad; titulo: string }) {
  const filas: [string, number, string?][] = [
    ['Facturas (valor sin IVA)', r.ingreso],
    ...(r.iva ? ([['+ IVA que cobras', r.iva, 'No es tuyo: lo declaras y pagas a la DIAN.']] as [string, number, string][]) : []),
    ['− Retención en la fuente', -r.retefuente, 'Anticipo de tu impuesto de renta: la descuentas al declarar.'],
    ['− ReteICA', -r.reteica, 'Anticipo del impuesto de industria y comercio.'],
    ...(r.reteiva ? ([[`− ReteIVA (${RETEIVA_PCT} % del IVA)`, -r.reteiva]] as [string, number][]) : []),
    ...(r.otras ? ([['− Otras deducciones', -r.otras]] as [string, number][]) : []),
  ];
  return (
    <div className="rounded-xl border border-marmol-200 p-4 text-sm">
      <h3 className="font-display font-semibold text-secundario">{titulo}</h3>
      <table className="mt-2 w-full">
        <tbody>
          {filas.map(([n, v, ayuda]) => (
            <tr key={n} className="border-t border-marmol-100 text-right align-top">
              <td className="py-1 text-left text-marmol-600">
                {n}
                {ayuda && <span className="block text-[10px] text-marmol-400">{ayuda}</span>}
              </td>
              <td className="whitespace-nowrap">{pesos(v)}</td>
            </tr>
          ))}
          <tr className="border-t border-marmol-300 text-right font-semibold">
            <td className="py-1 text-left text-marmol-900">= Te consignan</td>
            <td className="text-secundario">{pesos(r.netoRecibido)}</td>
          </tr>
        </tbody>
      </table>
      {r.iva > 0 && <p className="mt-1 text-[11px] text-medio">IVA a pagar a la DIAN: {pesos(r.iva - r.reteiva)} (apártalo, no lo gastes).</p>}
    </div>
  );
}

/** Lista de chequeo de requisitos para un cobro. */
function Requisitos({ proyectoId, pagoId, requisitos, cumplidos }: { proyectoId: string; pagoId: string; requisitos: string[]; cumplidos: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const listos = requisitos.filter((r) => cumplidos.includes(r)).length;
  return (
    <div className="mt-2">
      <p className={cn('text-[11px] font-semibold', listos === requisitos.length ? 'text-alto' : 'text-medio')}>
        Requisitos para cobrar: {listos} de {requisitos.length}
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        {requisitos.map((r) => {
          const ok = cumplidos.includes(r);
          return (
            <button
              key={r}
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await alternarRequisito(proyectoId, pagoId, r);
                  router.refresh();
                })
              }
              className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]', ok ? 'border-green-300 bg-green-50 text-alto' : 'border-marmol-200 bg-white text-marmol-500')}
            >
              {ok ? <Check size={11} /> : <span className="h-2.5 w-2.5 rounded-full border border-marmol-300" />} {r}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Formulario del modelo de cobro del proyecto. */
function ModeloCobro({ proyectoId, proyecto, parametros, onListo }: { proyectoId: string; proyecto: ProyectoConFinanzas; parametros: Parametros; onListo: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const txt = (n: number | null | undefined) => (n == null ? '' : String(n));
  const [d, setD] = useState({
    modalidad: proyecto.modalidad_cobro as Modalidad,
    valorContrato: txt(proyecto.valor_contrato),
    valorHora: txt(proyecto.valor_hora),
    horas: txt(proyecto.horas_contratadas),
    cobraIva: proyecto.cobra_iva,
    retefuente: txt(proyecto.retefuente_pct),
    reteica: txt(proyecto.reteica_por_mil),
    otras: txt(proyecto.otras_retenciones_pct || null),
    aliado: txt(proyecto.participacion_aliado_pct || null),
    viaticos: txt(proyecto.viaticos_pactados),
    requisitos: proyecto.requisitos_cobro ?? '',
  });
  const set = (k: keyof typeof d) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));
  const n = (v: string) => (v.trim() === '' ? null : leerNumero(v));
  const total = d.modalidad === 'por_horas' ? (n(d.valorHora) ?? 0) * (n(d.horas) ?? 0) : null;

  function guardar() {
    setError(null);
    const campos = [d.valorContrato, d.valorHora, d.horas, d.retefuente, d.reteica, d.otras, d.aliado, d.viaticos];
    if (campos.some((c) => c.trim() !== '' && n(c) == null)) return setError('Revisa los valores: deben ser números.');
    startTransition(async () => {
      const res = await guardarModeloCobro(proyectoId, {
        modalidadCobro: d.modalidad,
        valorContrato: n(d.valorContrato),
        valorHora: n(d.valorHora),
        horasContratadas: n(d.horas),
        cobraIva: d.cobraIva,
        retefuentePct: n(d.retefuente),
        reteicaPorMil: n(d.reteica),
        otrasRetencionesPct: n(d.otras) ?? 0,
        participacionAliadoPct: n(d.aliado) ?? 0,
        viaticosPactados: n(d.viaticos),
        requisitosCobro: d.requisitos,
      });
      if (!res.ok) return setError(res.error);
      onListo();
      router.refresh();
    });
  }

  const campo = (etiqueta: string, k: keyof typeof d, ayuda?: string, placeholder?: string) => (
    <label className="block text-xs font-medium text-marmol-500">
      {etiqueta}
      <input inputMode="decimal" value={d[k] as string} onChange={set(k)} placeholder={placeholder} className="campo mt-1" />
      {ayuda && <span className="mt-0.5 block text-[10px] font-normal text-marmol-400">{ayuda}</span>}
    </label>
  );

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {(Object.keys(MODALIDADES) as Modalidad[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setD((x) => ({ ...x, modalidad: m }))}
            className={cn('rounded-xl border-2 p-3 text-left text-xs', d.modalidad === m ? 'border-marca-500 bg-marca-50' : 'border-marmol-200 hover:border-marca-300')}
          >
            <span className="block text-sm font-semibold text-marmol-800">{MODALIDADES[m].nombre}</span>
            <span className="text-marmol-500">{MODALIDADES[m].ayuda}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {d.modalidad !== 'por_horas' && campo('Valor fijo del contrato (COP, sin IVA)', 'valorContrato', undefined, 'Ej. 18.000.000')}
        {d.modalidad !== 'valor_fijo' && campo('Valor de cada hora (COP, sin IVA)', 'valorHora', undefined, 'Ej. 235.000')}
        {campo('Horas contratadas', 'horas', d.modalidad === 'mixto' ? 'Las horas por encima de estas se cobran aparte.' : undefined, 'Ej. 60')}
      </div>
      {total != null && total > 0 && <p className="text-xs text-marmol-600">Valor total del contrato: <strong>{pesos(total)}</strong></p>}
      <label className="flex items-center gap-2 text-sm text-marmol-700">
        <input type="checkbox" checked={d.cobraIva} onChange={(e) => setD((x) => ({ ...x, cobraIva: e.target.checked }))} />
        Cobro IVA ({IVA_PCT} %) en mis facturas (soy responsable de IVA)
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        {campo('Retención en la fuente (%)', 'retefuente', `Vacío = ${parametros.retefuente_pct} % (tu valor por defecto). Honorarios suele ser 10 % u 11 %.`)}
        {campo('ReteICA (por mil)', 'reteica', `Vacío = ${parametros.reteica_por_mil} por mil. Depende del municipio del cliente.`)}
        {campo('Otras deducciones (%)', 'otras', 'Estampillas o contribuciones (común en contratos públicos).')}
        {campo('Participación de un aliado (%)', 'aliado', 'Si repartes el ingreso con un socio o intermediario.')}
        {campo('Viáticos que paga el cliente (COP)', 'viaticos', 'Lo que el cliente reconoce por viajes durante todo el proyecto.')}
      </div>
      <label className="block text-xs font-medium text-marmol-500">
        Requisitos para cobrar (uno por línea)
        <textarea value={d.requisitos} onChange={set('requisitos')} rows={4} className="campo mt-1" placeholder={REQUISITOS_SUGERIDOS.join('\n')} />
      </label>
      {!d.requisitos.trim() && (
        <button type="button" onClick={() => setD((x) => ({ ...x, requisitos: REQUISITOS_SUGERIDOS.join('\n') }))} className="text-xs font-semibold text-marca-600 hover:underline">
          Usar los requisitos sugeridos
        </button>
      )}
      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={pending} onClick={guardar} className="boton">
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={onListo} className="boton-secundario">
          Cancelar
        </button>
      </div>
    </div>
  );
}
