/**
 * Finanzas del consultor independiente en Colombia (persona natural con
 * contratos de prestación de servicios). Funciones puras: sirven en el
 * servidor y en el navegador.
 *
 * Reglas usadas (valores editables en los parámetros de cada consultor):
 *  - Seguridad social: base de cotización (IBC) = 40 % del ingreso mensual
 *    sin IVA, mínimo 1 y máximo 25 salarios mínimos; salud 12,5 %, pensión
 *    16 %, ARL según la clase de riesgo y Fondo de Solidaridad Pensional
 *    desde 4 salarios mínimos de IBC. Se paga mes vencido en la planilla PILA
 *    sumando todos los contratos del mes.
 *  - Retención en la fuente, reteICA y reteIVA: el cliente las descuenta al
 *    pagar. Son anticipos de impuestos (no plata perdida), pero sí reducen lo
 *    que entra a la cuenta.
 *  - IVA: si se cobra, no es ingreso: se declara y se paga a la DIAN.
 * No reemplaza la asesoría de un contador: es para planear y decidir.
 */
import { diasHasta } from '@/lib/procesos';

// ----------------------------------------------------------------------------
// Parámetros
// ----------------------------------------------------------------------------

export interface Parametros {
  anio: number;
  smmlv: number;
  uvt: number;
  ibc_pct: number;
  salud_pct: number;
  pension_pct: number;
  clase_arl: number;
  retefuente_pct: number;
  reteica_por_mil: number;
  provision_renta_pct: number;
  gmf: boolean;
  meta_ingreso_mensual: number | null;
  margen_objetivo_pct: number;
}

/** Valores de referencia 2026: confírmalos con tu contador o en la DIAN y ajústalos en «Mis finanzas». */
export const PARAMETROS_DEFECTO: Parametros = {
  anio: 2026,
  smmlv: 1750905,
  uvt: 52374,
  ibc_pct: 40,
  salud_pct: 12.5,
  pension_pct: 16,
  clase_arl: 1,
  retefuente_pct: 10,
  reteica_por_mil: 9.66,
  provision_renta_pct: 8,
  gmf: true,
  meta_ingreso_mensual: null,
  margen_objetivo_pct: 40,
};

/** Tarifas ARL por clase de riesgo (Decreto 1772 de 1994). */
export const TARIFAS_ARL: Record<number, { pct: number; nombre: string; ejemplo: string }> = {
  1: { pct: 0.522, nombre: 'Riesgo I (mínimo)', ejemplo: 'Trabajo de oficina, consultoría, capacitación.' },
  2: { pct: 1.044, nombre: 'Riesgo II (bajo)', ejemplo: 'Visitas frecuentes a plantas o bodegas.' },
  3: { pct: 2.436, nombre: 'Riesgo III (medio)', ejemplo: 'Trabajo en planta con máquinas.' },
  4: { pct: 4.35, nombre: 'Riesgo IV (alto)', ejemplo: 'Conducción, trabajos en altura. La paga el contratante.' },
  5: { pct: 6.96, nombre: 'Riesgo V (máximo)', ejemplo: 'Minería, explosivos. La paga el contratante.' },
};

export const IVA_PCT = 19;
export const RETEIVA_PCT = 15;
export const GMF_POR_MIL = 4;

/** Fondo de Solidaridad Pensional según el IBC en salarios mínimos. */
export function fspPct(ibcEnSmmlv: number) {
  if (ibcEnSmmlv < 4) return 0;
  if (ibcEnSmmlv < 16) return 1;
  if (ibcEnSmmlv < 17) return 1.2;
  if (ibcEnSmmlv < 18) return 1.4;
  if (ibcEnSmmlv < 19) return 1.6;
  if (ibcEnSmmlv < 20) return 1.8;
  return 2;
}

// ----------------------------------------------------------------------------
// Seguridad social de un mes
// ----------------------------------------------------------------------------

export interface Aportes {
  ingreso: number;
  ibc: number;
  salud: number;
  pension: number;
  fsp: number;
  arl: number;
  total: number;
  nota: string | null;
}

/** Aportes de un mes a partir del ingreso total del mes (todos los contratos, sin IVA). */
export function aportesDelMes(ingresoMes: number, par: Parametros): Aportes {
  const vacio = { ingreso: ingresoMes, ibc: 0, salud: 0, pension: 0, fsp: 0, arl: 0, total: 0 };
  if (ingresoMes <= 0) return { ...vacio, nota: null };
  if (ingresoMes < par.smmlv) {
    return { ...vacio, nota: 'Con ingresos del mes menores a 1 salario mínimo no estás obligada a cotizar como independiente (puedes hacerlo si quieres).' };
  }
  const calculado = (ingresoMes * par.ibc_pct) / 100;
  const ibc = Math.min(25 * par.smmlv, Math.max(par.smmlv, calculado));
  const redondeo = (n: number) => Math.round(n / 100) * 100; // la PILA redondea al múltiplo de 100
  const salud = redondeo((ibc * par.salud_pct) / 100);
  const pension = redondeo((ibc * par.pension_pct) / 100);
  const fsp = redondeo((ibc * fspPct(ibc / par.smmlv)) / 100);
  const arl = par.clase_arl >= 4 ? 0 : redondeo((ibc * (TARIFAS_ARL[par.clase_arl]?.pct ?? 0.522)) / 100);
  let nota: string | null = null;
  if (calculado < par.smmlv) nota = 'El 40 % de tu ingreso es menor a un salario mínimo: se cotiza sobre 1 salario mínimo.';
  else if (calculado > 25 * par.smmlv) nota = 'Tu base se limita a 25 salarios mínimos (el tope de ley).';
  if (par.clase_arl >= 4) nota = [nota, 'Con riesgo IV o V la ARL la paga el contratante.'].filter(Boolean).join(' ');
  return { ingreso: ingresoMes, ibc, salud, pension, fsp, arl, total: salud + pension + fsp + arl, nota };
}

/** Porcentaje efectivo de seguridad social sobre el ingreso (para estimar por proyecto). */
export function tasaSeguridadSocial(par: Parametros) {
  const arl = par.clase_arl >= 4 ? 0 : (TARIFAS_ARL[par.clase_arl]?.pct ?? 0.522);
  return (par.ibc_pct / 100) * ((par.salud_pct + par.pension_pct + arl) / 100);
}

// ----------------------------------------------------------------------------
// Proyecto: cobro, deducciones y rentabilidad
// ----------------------------------------------------------------------------

export const MODALIDADES = {
  valor_fijo: { nombre: 'Valor fijo', ayuda: 'Un valor total por el proyecto, pagado en cuotas o contra entregables.' },
  por_horas: { nombre: 'Por horas', ayuda: 'Cada hora tiene un valor: se cobra horas × valor hora.' },
  mixto: { nombre: 'Mixto', ayuda: 'Un valor fijo por lo contratado y las horas adicionales se cobran aparte.' },
} as const;
export type Modalidad = keyof typeof MODALIDADES;

export const CATEGORIAS_GASTO = {
  transporte: '🚕 Transporte',
  alimentacion: '🍽️ Alimentación',
  alojamiento: '🏨 Alojamiento',
  materiales: '📦 Insumos y materiales',
  apoyo: '🤝 Apoyo profesional (subcontratos)',
  software: '💻 Software y herramientas',
  comunicaciones: '📱 Comunicaciones',
  polizas: '🛡️ Pólizas y garantías',
  otros: '🧾 Otros',
} as const;
export type CategoriaGasto = keyof typeof CATEGORIAS_GASTO;

export const REQUISITOS_SUGERIDOS = [
  'Factura electrónica (o cuenta de cobro)',
  'Planilla de seguridad social (PILA) pagada del mes',
  'Informe de actividades del periodo',
  'Aprobación del supervisor o del cliente',
  'RUT actualizado',
  'Certificación bancaria',
];

export interface ProyectoFinanzas {
  modalidad_cobro: Modalidad;
  valor_contrato: number | null;
  valor_hora: number | null;
  horas_contratadas: number | null;
  cobra_iva: boolean;
  retefuente_pct: number | null;
  reteica_por_mil: number | null;
  otras_retenciones_pct: number;
  participacion_aliado_pct: number;
  viaticos_pactados: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

export interface PresupuestoMinimo {
  categoria: string;
  valor_planeado: number;
  reembolsable: boolean;
}

export interface MovimientoMinimo {
  tipo: 'cobro' | 'contrapartida' | 'gasto' | 'viatico';
  valor: number;
  estado: 'pendiente' | 'facturado' | 'pagado' | 'anulado';
  categoria: string | null;
  reembolsable: boolean;
  horas: number | null;
  fecha_limite: string | null;
  fecha_pago: string | null;
}

/** Ingreso del proyecto (sin IVA) con unas horas dadas. */
export function ingresoConHoras(p: ProyectoFinanzas, horas: number) {
  const vh = Number(p.valor_hora) || 0;
  if (p.modalidad_cobro === 'por_horas') return horas * vh;
  const fijo = Number(p.valor_contrato) || 0;
  if (p.modalidad_cobro === 'mixto') return fijo + Math.max(0, horas - (Number(p.horas_contratadas) || 0)) * vh;
  return fijo;
}

export interface Rentabilidad {
  ingreso: number;
  iva: number;
  retefuente: number;
  reteica: number;
  reteiva: number;
  otras: number;
  aliado: number;
  netoRecibido: number;
  costos: number;
  viaticos: number;
  costosNetos: number;
  seguridadSocial: number;
  ica: number;
  renta: number;
  gmf: number;
  utilidad: number;
  margen: number | null;
  horas: number;
  valorHoraNeto: number | null;
  /** Lo máximo que se puede gastar para no bajar del margen objetivo. */
  topeGastos: number;
}

/**
 * Cuentas de un proyecto. Se usa dos veces: con lo planeado (horas
 * contratadas, presupuesto, viáticos pactados) y con lo real (horas
 * ejecutadas, gastos y viáticos registrados).
 */
export function rentabilidad(p: ProyectoFinanzas, par: Parametros, entrada: { horas: number; ingreso?: number; costos: number; viaticos: number }): Rentabilidad {
  const ingreso = entrada.ingreso ?? ingresoConHoras(p, entrada.horas);
  const iva = p.cobra_iva ? (ingreso * IVA_PCT) / 100 : 0;
  const retefuente = (ingreso * (p.retefuente_pct ?? par.retefuente_pct)) / 100;
  const icaPorMil = p.reteica_por_mil ?? par.reteica_por_mil;
  const reteica = (ingreso * icaPorMil) / 1000;
  const reteiva = (iva * RETEIVA_PCT) / 100;
  const otras = (ingreso * (Number(p.otras_retenciones_pct) || 0)) / 100;
  const aliado = (ingreso * (Number(p.participacion_aliado_pct) || 0)) / 100;
  const netoRecibido = ingreso + iva - retefuente - reteica - reteiva - otras;

  const costosNetos = Math.max(0, entrada.costos - entrada.viaticos);
  const seguridadSocial = ingreso * tasaSeguridadSocial(par);
  const ica = reteica; // el ICA del periodo es, en la práctica, lo que el cliente ya retuvo
  const baseRenta = Math.max(0, ingreso - aliado - otras - costosNetos - seguridadSocial);
  const renta = (baseRenta * par.provision_renta_pct) / 100;
  const gmf = par.gmf ? ((netoRecibido - iva + reteiva) * GMF_POR_MIL) / 1000 : 0;
  const utilidad = ingreso - aliado - otras - costosNetos - seguridadSocial - ica - renta - gmf;
  // Tope de gastos: utilidad = A − gastosNetos·(1 − r) − r·B, con A = ingreso menos todo lo que
  // no es gasto, B = base de renta sin gastos y r = tasa de renta. Se despeja utilidad ≥ margen objetivo.
  const r = par.provision_renta_pct / 100;
  const A = ingreso - aliado - otras - seguridadSocial - ica - gmf;
  const B = ingreso - aliado - otras - seguridadSocial;
  const M = (ingreso * par.margen_objetivo_pct) / 100;
  const topeGastos = Math.max(0, (A - r * B - M) / (1 - r) + entrada.viaticos);

  return {
    ingreso,
    iva,
    retefuente,
    reteica,
    reteiva,
    otras,
    aliado,
    netoRecibido,
    costos: entrada.costos,
    viaticos: entrada.viaticos,
    costosNetos,
    seguridadSocial,
    ica,
    renta,
    gmf,
    utilidad,
    margen: ingreso > 0 ? utilidad / ingreso : null,
    horas: entrada.horas,
    valorHoraNeto: entrada.horas > 0 ? utilidad / entrada.horas : null,
    topeGastos,
  };
}

/** Resume los movimientos reales del proyecto. */
export function totalesMovimientos(movs: MovimientoMinimo[]) {
  const vigentes = movs.filter((m) => m.estado !== 'anulado');
  const suma = (f: (m: MovimientoMinimo) => boolean) => vigentes.filter(f).reduce((s, m) => s + Number(m.valor), 0);
  return {
    cobrado: suma((m) => (m.tipo === 'cobro' || m.tipo === 'contrapartida') && m.estado === 'pagado'),
    facturado: suma((m) => (m.tipo === 'cobro' || m.tipo === 'contrapartida') && (m.estado === 'facturado' || m.estado === 'pagado')),
    porCobrar: suma((m) => (m.tipo === 'cobro' || m.tipo === 'contrapartida') && m.estado !== 'pagado'),
    vencido: suma((m) => (m.tipo === 'cobro' || m.tipo === 'contrapartida') && m.estado !== 'pagado' && m.fecha_limite != null && diasHasta(m.fecha_limite) < 0),
    gastos: suma((m) => m.tipo === 'gasto'),
    viaticos: suma((m) => m.tipo === 'viatico'),
    reembolsables: suma((m) => m.tipo === 'gasto' && m.reembolsable),
    horasFacturadas: vigentes.filter((m) => m.tipo === 'cobro').reduce((s, m) => s + (Number(m.horas) || 0), 0),
  };
}

export function gastoPorCategoria(presupuesto: PresupuestoMinimo[], movs: MovimientoMinimo[]) {
  const cats = new Map<string, { planeado: number; real: number }>();
  for (const b of presupuesto) {
    const c = cats.get(b.categoria) ?? { planeado: 0, real: 0 };
    c.planeado += Number(b.valor_planeado) || 0;
    cats.set(b.categoria, c);
  }
  for (const m of movs.filter((x) => x.tipo === 'gasto' && x.estado !== 'anulado')) {
    const k = m.categoria || 'otros';
    const c = cats.get(k) ?? { planeado: 0, real: 0 };
    c.real += Number(m.valor) || 0;
    cats.set(k, c);
  }
  return [...cats.entries()].map(([categoria, v]) => ({ categoria, ...v }));
}

// ----------------------------------------------------------------------------
// Proyección mes a mes (varios proyectos)
// ----------------------------------------------------------------------------

/** Meses (YYYY-MM) entre dos fechas, con cuántos días del proyecto caen en cada uno. */
export function mesesDelProyecto(inicio: string, fin: string) {
  const res: { mes: string; dias: number }[] = [];
  const a = new Date(`${inicio}T12:00:00`);
  const b = new Date(`${fin}T12:00:00`);
  if (b < a) return res;
  const d = new Date(a);
  while (d <= b) {
    const mes = d.toISOString().slice(0, 7);
    const ultimo = res.at(-1);
    if (ultimo?.mes === mes) ultimo.dias++;
    else res.push({ mes, dias: 1 });
    d.setDate(d.getDate() + 1);
  }
  return res;
}

/**
 * Ingreso de un proyecto repartido por mes: lo planeado se reparte según los
 * días del proyecto que caen en cada mes; en los meses que ya pasaron, si se
 * cobra por horas, se usan las horas reales de la bitácora.
 */
export function ingresoPorMes(p: ProyectoFinanzas, horasRealesPorMes: Map<string, number>, mesActual: string) {
  const res = new Map<string, number>();
  if (!p.fecha_inicio || !p.fecha_fin) return res;
  const meses = mesesDelProyecto(p.fecha_inicio, p.fecha_fin);
  const total = meses.reduce((s, m) => s + m.dias, 0);
  const planeado = ingresoConHoras(p, Number(p.horas_contratadas) || 0);
  for (const m of meses) {
    let v = (planeado * m.dias) / total;
    if (p.modalidad_cobro === 'por_horas' && m.mes < mesActual) v = (horasRealesPorMes.get(m.mes) ?? 0) * (Number(p.valor_hora) || 0);
    res.set(m.mes, v);
  }
  return res;
}

export function formatoMes(mes: string) {
  const [a, m] = mes.split('-').map(Number);
  const t = new Date(a!, m! - 1, 15).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export const pesos = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(n));

// ----------------------------------------------------------------------------
// Consolidado de todos los proyectos
// ----------------------------------------------------------------------------

export interface ProyectoConsolidado {
  id: string;
  nombre: string;
  cliente: string;
  finanzas: ProyectoFinanzas;
  gastosPlaneados: number;
  horasRealesPorMes: Map<string, number>;
}

export interface MesConsolidado {
  mes: string;
  ingreso: number;
  retenciones: number;
  gastos: number;
  aliadoYOtras: number;
  ica: number;
  gmf: number;
  aportes: Aportes;
  renta: number;
  utilidad: number;
  porProyecto: { id: string; nombre: string; cliente: string; ingreso: number }[];
}

/**
 * Proyección mes a mes de todos los proyectos. La seguridad social se calcula
 * sobre la suma del mes (como se liquida la planilla PILA); lo demás se
 * reparte de cada proyecto según su ingreso del mes.
 */
export function proyeccionMensual(proyectos: ProyectoConsolidado[], par: Parametros, mesActual: string): MesConsolidado[] {
  const meses = new Map<string, MesConsolidado>();
  for (const pr of proyectos) {
    const plan = rentabilidad(pr.finanzas, par, {
      horas: Number(pr.finanzas.horas_contratadas) || 0,
      costos: pr.gastosPlaneados,
      viaticos: Number(pr.finanzas.viaticos_pactados) || 0,
    });
    for (const [mes, ingreso] of ingresoPorMes(pr.finanzas, pr.horasRealesPorMes, mesActual)) {
      const parte = plan.ingreso > 0 ? ingreso / plan.ingreso : 0;
      const m =
        meses.get(mes) ??
        ({ mes, ingreso: 0, retenciones: 0, gastos: 0, aliadoYOtras: 0, ica: 0, gmf: 0, aportes: aportesDelMes(0, par), renta: 0, utilidad: 0, porProyecto: [] } as MesConsolidado);
      m.ingreso += ingreso;
      m.retenciones += (plan.retefuente + plan.reteica + plan.reteiva + plan.otras) * parte;
      m.gastos += plan.costosNetos * parte;
      m.aliadoYOtras += (plan.aliado + plan.otras) * parte;
      m.ica += plan.ica * parte;
      m.gmf += plan.gmf * parte;
      if (ingreso > 0) m.porProyecto.push({ id: pr.id, nombre: pr.nombre, cliente: pr.cliente, ingreso });
      meses.set(mes, m);
    }
  }
  return [...meses.values()]
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map((m) => {
      const aportes = aportesDelMes(m.ingreso, par);
      const renta = (Math.max(0, m.ingreso - m.aliadoYOtras - m.gastos - aportes.total) * par.provision_renta_pct) / 100;
      return { ...m, aportes, renta, utilidad: m.ingreso - m.aliadoYOtras - m.gastos - aportes.total - m.ica - renta - m.gmf };
    });
}

/** Mes siguiente (YYYY-MM): la planilla de un mes se paga en el mes siguiente. */
export function mesSiguiente(mes: string) {
  const [a, m] = mes.split('-').map(Number);
  const d = new Date(a!, m!, 15);
  return d.toISOString().slice(0, 7);
}
