/**
 * Proyectos de consultoría — catálogos, definición de los registros de cada
 * proyecto (una sola fuente para formularios y validación), cálculos de
 * avance y salud, plantillas de cronograma y alertas del consultor.
 * Funciones puras: sirven en el servidor y en el navegador.
 */
import { avanceMeta, diasHasta, type ProcesoMinimo } from '@/lib/procesos';
import type { Recomendacion } from '@/lib/recomendaciones';

// ----------------------------------------------------------------------------
// Catálogos
// ----------------------------------------------------------------------------

export const TIPOS_PROYECTO = {
  consultoria: '🧭 Consultoría en procesos',
  programa: '🏛️ Programa con plan de trabajo',
  aplicativo: '💻 Aplicativo',
  capacitacion: '🎓 Capacitación',
  acompanamiento: '🤝 Acompañamiento',
  tarea_personal: '📌 Tarea personal',
} as const;
export type TipoProyecto = keyof typeof TIPOS_PROYECTO;

export const ESTADOS_PROYECTO = {
  por_iniciar: { nombre: 'Por iniciar', clase: 'bg-marmol-100 text-marmol-600' },
  en_curso: { nombre: 'En curso', clase: 'bg-blue-100 text-deber' },
  pausado: { nombre: 'Pausado', clase: 'bg-amber-100 text-medio' },
  finalizado: { nombre: 'Finalizado', clase: 'bg-marca-100 text-marca-700' },
  cancelado: { nombre: 'Cancelado', clase: 'bg-marmol-100 text-marmol-400' },
} as const;
export type EstadoProyecto = keyof typeof ESTADOS_PROYECTO;

/** Estados de un hito: los mismos del control de hitos del Excel. */
export const ESTADOS_HITO = {
  pendiente: { nombre: 'Pendiente', clase: 'bg-marmol-100 text-marmol-600', barra: '#cfc8ba' },
  en_curso: { nombre: 'En curso', clase: 'bg-blue-100 text-deber', barra: '#2a78d6' },
  en_aprobacion: { nombre: 'En aprobación', clase: 'bg-violet-100 text-violet-700', barra: '#7c6fd6' },
  rechazado: { nombre: 'Rechazado – subsanar', clase: 'bg-red-100 text-bajo', barra: '#e34948' },
  bloqueado: { nombre: 'Bloqueado', clase: 'bg-orange-100 text-orange-700', barra: '#eb6834' },
  cumplido: { nombre: 'Cumplido', clase: 'bg-green-100 text-alto', barra: '#1baf7a' },
  no_aplica: { nombre: 'No aplica', clase: 'bg-marmol-50 text-marmol-400', barra: '#e4e0d8' },
} as const;
export type EstadoHito = keyof typeof ESTADOS_HITO;

export const ESTADOS_INTERVENCION = {
  al_dia: 'Al día',
  pendiente: 'Pendiente',
  atrasado: 'Atrasado',
  pausado: 'Pausado',
  finalizado: 'Finalizado',
} as const;

export type Salud = 'al_dia' | 'en_riesgo' | 'atrasado' | 'sin_datos' | 'cerrado';
export const SALUD: Record<Salud, { nombre: string; emoji: string; clase: string }> = {
  al_dia: { nombre: 'Al día', emoji: '🟢', clase: 'bg-green-100 text-alto' },
  en_riesgo: { nombre: 'En riesgo', emoji: '🟡', clase: 'bg-amber-100 text-medio' },
  atrasado: { nombre: 'Atrasado', emoji: '🔴', clase: 'bg-red-100 text-bajo' },
  sin_datos: { nombre: 'Sin cronograma', emoji: '⚪', clase: 'bg-marmol-100 text-marmol-500' },
  cerrado: { nombre: 'Cerrado', emoji: '🏁', clase: 'bg-marca-100 text-marca-700' },
};

// ----------------------------------------------------------------------------
// Definición de los registros del proyecto (formularios + validación)
// ----------------------------------------------------------------------------

export type TipoCampo = 'texto' | 'area' | 'fecha' | 'numero' | 'opcion' | 'url' | 'referencia';

export interface Campo {
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido?: boolean;
  opciones?: Record<string, string>;
  /** Para 'referencia': de qué lista del proyecto salen las opciones. */
  referencia?: 'hitos' | 'objetivos' | 'kpis';
  placeholder?: string;
  /** Ocupa toda la fila del formulario. */
  ancho?: boolean;
  valorInicial?: string;
}

export const ENTIDADES = {
  hitos: {
    tabla: 'pr_hitos',
    singular: 'hito',
    campos: [
      { clave: 'fase', etiqueta: 'Fase', tipo: 'texto', placeholder: 'Ej. Diagnóstico' },
      { clave: 'nombre', etiqueta: 'Hito / entregable', tipo: 'texto', requerido: true, placeholder: 'Ej. Informe de diagnóstico' },
      { clave: 'que_cumplir', etiqueta: 'Qué hay que cumplir', tipo: 'area', ancho: true },
      { clave: 'insumos', etiqueta: 'Información o insumos que se necesitan', tipo: 'area', ancho: true },
      { clave: 'responsable', etiqueta: 'Responsable', tipo: 'texto' },
      { clave: 'estado', etiqueta: 'Estado', tipo: 'opcion', requerido: true, valorInicial: 'pendiente', opciones: Object.fromEntries(Object.entries(ESTADOS_HITO).map(([k, v]) => [k, v.nombre])) },
      { clave: 'fecha_inicio', etiqueta: 'Fecha de inicio', tipo: 'fecha' },
      { clave: 'fecha_limite', etiqueta: 'Fecha límite', tipo: 'fecha' },
      { clave: 'fecha_real', etiqueta: 'Fecha real de entrega', tipo: 'fecha' },
      { clave: 'peso', etiqueta: 'Peso en el avance', tipo: 'numero', valorInicial: '1' },
      { clave: 'horas_estimadas', etiqueta: 'Horas estimadas', tipo: 'numero' },
      { clave: 'situacion', etiqueta: 'Situación actual / observaciones', tipo: 'area', ancho: true },
      { clave: 'proximo_paso', etiqueta: 'Próximo paso', tipo: 'texto', ancho: true },
      { clave: 'soporte', etiqueta: 'Fuente / soporte (enlace o nombre)', tipo: 'texto', ancho: true },
    ],
  },
  objetivos: {
    tabla: 'pr_objetivos',
    singular: 'objetivo',
    campos: [
      { clave: 'descripcion', etiqueta: 'Objetivo', tipo: 'area', requerido: true, ancho: true, placeholder: 'Ej. Reducir el tiempo de compra de 12 a 6 días' },
      { clave: 'criterio', etiqueta: '¿Cómo sabremos que se cumplió?', tipo: 'area', ancho: true },
      { clave: 'responsable', etiqueta: 'Responsable', tipo: 'texto' },
      { clave: 'fecha_meta', etiqueta: 'Fecha meta', tipo: 'fecha' },
      { clave: 'estado', etiqueta: 'Estado', tipo: 'opcion', requerido: true, valorInicial: 'pendiente', opciones: { pendiente: 'Pendiente', en_curso: 'En curso', cumplido: 'Cumplido', no_cumplido: 'No cumplido' } },
      { clave: 'avance', etiqueta: 'Avance manual (%) si no tiene KPI', tipo: 'numero' },
      { clave: 'peso', etiqueta: 'Peso', tipo: 'numero', valorInicial: '1' },
    ],
  },
  kpis: {
    tabla: 'pr_kpis',
    singular: 'KPI',
    campos: [
      { clave: 'nombre', etiqueta: 'Indicador (KPI)', tipo: 'texto', requerido: true, placeholder: 'Ej. Tiempo de ciclo de compras' },
      { clave: 'objetivo_id', etiqueta: 'Objetivo al que aporta', tipo: 'referencia', referencia: 'objetivos' },
      { clave: 'formula', etiqueta: 'Cómo se calcula', tipo: 'area', ancho: true },
      { clave: 'unidad', etiqueta: 'Unidad', tipo: 'texto', requerido: true, valorInicial: '%' },
      { clave: 'sentido', etiqueta: 'Mejorar es que…', tipo: 'opcion', requerido: true, valorInicial: 'subir', opciones: { subir: 'suba ⬆️', bajar: 'baje ⬇️' } },
      { clave: 'linea_base', etiqueta: 'Línea base', tipo: 'numero' },
      { clave: 'meta', etiqueta: 'Meta', tipo: 'numero' },
      { clave: 'fuente', etiqueta: 'Fuente del dato', tipo: 'texto' },
    ],
  },
  mediciones: {
    tabla: 'pr_mediciones',
    singular: 'medición',
    campos: [
      { clave: 'kpi_id', etiqueta: 'KPI', tipo: 'referencia', referencia: 'kpis', requerido: true },
      { clave: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true },
      { clave: 'valor', etiqueta: 'Valor medido', tipo: 'numero', requerido: true },
      { clave: 'nota', etiqueta: 'Nota', tipo: 'texto' },
    ],
  },
  bitacora: {
    tabla: 'pr_bitacora',
    singular: 'intervención',
    campos: [
      { clave: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true },
      { clave: 'tiempo_min', etiqueta: 'Tiempo (minutos)', tipo: 'numero', placeholder: 'Ej. 60' },
      { clave: 'actividad', etiqueta: 'Actividad realizada', tipo: 'area', requerido: true, ancho: true },
      { clave: 'hito_id', etiqueta: 'Hito relacionado', tipo: 'referencia', referencia: 'hitos' },
      { clave: 'estado_tras', etiqueta: 'Estado tras la intervención', tipo: 'opcion', opciones: ESTADOS_INTERVENCION },
      { clave: 'proximo_paso', etiqueta: 'Próximo paso / qué queda pendiente', tipo: 'texto', ancho: true },
      { clave: 'fecha_proximo', etiqueta: 'Fecha del próximo paso', tipo: 'fecha' },
    ],
  },
  pagos: {
    tabla: 'pr_pagos',
    singular: 'pago',
    campos: [
      { clave: 'concepto', etiqueta: 'Concepto', tipo: 'texto', requerido: true, placeholder: 'Ej. Anticipo 50 %' },
      { clave: 'tipo', etiqueta: 'Tipo', tipo: 'opcion', requerido: true, valorInicial: 'cobro', opciones: { cobro: 'Cobro al cliente', contrapartida: 'Aporte o cofinanciación', gasto: 'Gasto' } },
      { clave: 'valor', etiqueta: 'Valor (COP)', tipo: 'numero', requerido: true },
      { clave: 'estado', etiqueta: 'Estado', tipo: 'opcion', requerido: true, valorInicial: 'pendiente', opciones: { pendiente: 'Pendiente', facturado: 'Facturado', pagado: 'Pagado', anulado: 'Anulado' } },
      { clave: 'fecha_limite', etiqueta: 'Fecha límite', tipo: 'fecha' },
      { clave: 'fecha_pago', etiqueta: 'Fecha de pago', tipo: 'fecha' },
      { clave: 'soporte', etiqueta: 'Soporte (enlace o nombre del archivo)', tipo: 'texto', ancho: true },
    ],
  },
  riesgos: {
    tabla: 'pr_riesgos',
    singular: 'riesgo',
    campos: [
      { clave: 'descripcion', etiqueta: 'Riesgo', tipo: 'area', requerido: true, ancho: true, placeholder: 'Ej. El cliente no entrega los datos de la línea base a tiempo' },
      { clave: 'probabilidad', etiqueta: 'Probabilidad', tipo: 'opcion', requerido: true, valorInicial: 'media', opciones: { baja: 'Baja', media: 'Media', alta: 'Alta' } },
      { clave: 'impacto', etiqueta: 'Impacto', tipo: 'opcion', requerido: true, valorInicial: 'medio', opciones: { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' } },
      { clave: 'mitigacion', etiqueta: 'Qué haremos para evitarlo o reducirlo', tipo: 'area', ancho: true },
      { clave: 'responsable', etiqueta: 'Responsable', tipo: 'texto' },
      { clave: 'estado', etiqueta: 'Estado', tipo: 'opcion', requerido: true, valorInicial: 'abierto', opciones: { abierto: 'Abierto', controlado: 'Controlado', cerrado: 'Cerrado' } },
    ],
  },
  documentos: {
    tabla: 'pr_documentos',
    singular: 'documento',
    campos: [
      { clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, placeholder: 'Ej. Acta de inicio firmada' },
      { clave: 'tipo', etiqueta: 'Tipo', tipo: 'opcion', requerido: true, valorInicial: 'entregable', opciones: { contrato: 'Contrato', acta: 'Acta', informe: 'Informe', entregable: 'Entregable', evidencia: 'Evidencia', otro: 'Otro' } },
      { clave: 'url', etiqueta: 'Enlace (Drive, OneDrive, SharePoint…)', tipo: 'url', ancho: true },
      { clave: 'fecha', etiqueta: 'Fecha', tipo: 'fecha' },
      { clave: 'notas', etiqueta: 'Notas', tipo: 'texto' },
    ],
  },
} as const satisfies Record<string, { tabla: string; singular: string; campos: readonly Campo[] }>;

export type Entidad = keyof typeof ENTIDADES;

// ----------------------------------------------------------------------------
// Tipos mínimos para los cálculos
// ----------------------------------------------------------------------------

export interface ProyectoMinimo {
  tipo?: TipoProyecto;
  estado: EstadoProyecto;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  fecha_cierre_limite: string | null;
  horas_contratadas: number | null;
  valor_contrato: number | null;
  frecuencia_dias: number | null;
}

export interface HitoMinimo {
  id: string;
  fase: string | null;
  nombre: string;
  estado: EstadoHito;
  peso: number;
  fecha_inicio: string | null;
  fecha_limite: string | null;
  fecha_real: string | null;
  responsable: string | null;
  proximo_paso: string | null;
  situacion: string | null;
}

export interface ObjetivoMinimo {
  id: string;
  descripcion: string;
  estado: 'pendiente' | 'en_curso' | 'cumplido' | 'no_cumplido';
  avance: number | null;
  peso: number;
  fecha_meta: string | null;
}

export interface KpiMinimo {
  id: string;
  objetivo_id: string | null;
  nombre: string;
  unidad: string;
  sentido: 'bajar' | 'subir';
  linea_base: number | null;
  meta: number | null;
}

export interface MedicionMinima {
  kpi_id: string;
  fecha: string;
  valor: number;
}

export interface BitacoraMinima {
  fecha: string;
  tiempo_min: number | null;
  proximo_paso: string | null;
  fecha_proximo: string | null;
}

export interface PagoMinimo {
  id: string;
  concepto: string;
  tipo: 'cobro' | 'contrapartida' | 'gasto';
  valor: number;
  estado: 'pendiente' | 'facturado' | 'pagado' | 'anulado';
  fecha_limite: string | null;
}

export interface RiesgoMinimo {
  id: string;
  descripcion: string;
  probabilidad: 'baja' | 'media' | 'alta';
  impacto: 'bajo' | 'medio' | 'alto';
  mitigacion: string | null;
  estado: 'abierto' | 'controlado' | 'cerrado';
}

// ----------------------------------------------------------------------------
// Cálculos
// ----------------------------------------------------------------------------

const acotar = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

export function hoyISO() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

export function hitoAbierto(h: Pick<HitoMinimo, 'estado'>) {
  return h.estado !== 'cumplido' && h.estado !== 'no_aplica';
}

/** Días para vencer (negativo = vencido); null si ya se cumplió o no tiene fecha. */
export function diasParaVencer(h: Pick<HitoMinimo, 'estado' | 'fecha_limite'>) {
  if (!hitoAbierto(h) || !h.fecha_limite) return null;
  return diasHasta(h.fecha_limite);
}

/** % del cronograma cumplido, ponderado por el peso de cada hito (sin contar los "No aplica"). */
export function avanceCronograma(hitos: HitoMinimo[]) {
  const vigentes = hitos.filter((h) => h.estado !== 'no_aplica');
  const total = vigentes.reduce((s, h) => s + (Number(h.peso) || 0), 0);
  if (total <= 0) return null;
  // Lo que está en aprobación ya se entregó: cuenta la mitad.
  const hecho = vigentes.reduce((s, h) => s + (Number(h.peso) || 0) * (h.estado === 'cumplido' ? 1 : h.estado === 'en_aprobacion' ? 0.5 : 0), 0);
  return hecho / total;
}

/** % del tiempo del proyecto que ya pasó (0 a 1). */
export function avanceTiempo(p: Pick<ProyectoMinimo, 'fecha_inicio' | 'fecha_fin'>, hoy = hoyISO()) {
  if (!p.fecha_inicio || !p.fecha_fin) return null;
  const ini = new Date(p.fecha_inicio).getTime();
  const fin = new Date(p.fecha_fin).getTime();
  if (fin <= ini) return null;
  return acotar((new Date(hoy).getTime() - ini) / (fin - ini));
}

/** Avance hacia la meta de un KPI (0 a 1) con su última medición. */
export function avanceKpi(k: KpiMinimo, mediciones: MedicionMinima[]) {
  const ultima = ultimaDe(k.id, mediciones);
  if (!ultima) return null;
  const proc: ProcesoMinimo = { nombre: k.nombre, indicador: k.nombre, unidad: k.unidad, sentido: k.sentido, linea_base: k.linea_base, meta: k.meta, frecuencia: 'mensual' };
  const a = avanceMeta(proc, ultima.valor);
  return a == null ? null : acotar(a);
}

export function ultimaDe(kpiId: string, mediciones: MedicionMinima[]) {
  return mediciones.filter((m) => m.kpi_id === kpiId).sort((a, b) => a.fecha.localeCompare(b.fecha)).at(-1) ?? null;
}

/** Cumplimiento de un objetivo: por su estado, por sus KPIs o por el avance manual. */
export function avanceObjetivo(o: ObjetivoMinimo, kpis: KpiMinimo[], mediciones: MedicionMinima[]) {
  if (o.estado === 'cumplido') return 1;
  const suyos = kpis.filter((k) => k.objetivo_id === o.id).map((k) => avanceKpi(k, mediciones)).filter((a): a is number => a != null);
  if (suyos.length) return suyos.reduce((s, a) => s + a, 0) / suyos.length;
  return o.avance != null ? acotar(Number(o.avance) / 100) : 0;
}

export function cumplimientoObjetivos(objetivos: ObjetivoMinimo[], kpis: KpiMinimo[], mediciones: MedicionMinima[]) {
  const total = objetivos.reduce((s, o) => s + (Number(o.peso) || 0), 0);
  if (total <= 0) return null;
  return objetivos.reduce((s, o) => s + (Number(o.peso) || 0) * avanceObjetivo(o, kpis, mediciones), 0) / total;
}

export function horasEjecutadas(bitacora: BitacoraMinima[]) {
  return bitacora.reduce((s, b) => s + (Number(b.tiempo_min) || 0), 0) / 60;
}

export function ultimaIntervencion(bitacora: BitacoraMinima[]) {
  return [...bitacora].sort((a, b) => a.fecha.localeCompare(b.fecha)).at(-1) ?? null;
}

/**
 * Salud del proyecto: compara el avance del cronograma con el tiempo que ya
 * pasó y mira si hay hitos vencidos.
 */
export function saludProyecto(p: ProyectoMinimo, hitos: HitoMinimo[]): Salud {
  if (p.estado === 'finalizado' || p.estado === 'cancelado') return 'cerrado';
  const avance = avanceCronograma(hitos);
  if (avance == null) return 'sin_datos';
  const vencidos = hitos.filter((h) => (diasParaVencer(h) ?? 1) < 0).length;
  const tiempo = avanceTiempo(p);
  const brecha = tiempo == null ? 0 : avance - tiempo;
  if (brecha < -0.25 || vencidos >= 3) return 'atrasado';
  if (brecha < -0.1 || vencidos > 0) return 'en_riesgo';
  return 'al_dia';
}

export const NIVEL_RIESGO = { baja: 1, media: 2, alta: 3, bajo: 1, medio: 2, alto: 3 } as const;
export function nivelRiesgo(r: Pick<RiesgoMinimo, 'probabilidad' | 'impacto'>) {
  return NIVEL_RIESGO[r.probabilidad] * NIVEL_RIESGO[r.impacto];
}

export function formatearPesos(n: number | null | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

export function formatearHoras(h: number | null | undefined) {
  if (h == null) return '—';
  return `${(Math.round(h * 10) / 10).toLocaleString('es-CO')} h`;
}

/**
 * Lee un número escrito como en Colombia: "1.410.000", "12,4" o "12.4".
 * Devuelve null si no es un número.
 */
export function leerNumero(texto: string) {
  let t = texto.trim().replace(/\s|\$/g, '');
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Porcentaje con espacio que no se parte ("29 %" nunca queda en dos líneas). */
export const pct = (n: number | null | undefined) => (n == null ? '—' : `${Math.round(n * 100)} %`);

// ----------------------------------------------------------------------------
// Biblioteca de KPIs sugeridos (indicadores típicos de consultoría en procesos)
// ----------------------------------------------------------------------------

export interface KpiSugerido {
  nombre: string;
  formula: string;
  unidad: string;
  sentido: 'subir' | 'bajar';
  categoria: string;
}

export const KPIS_SUGERIDOS: KpiSugerido[] = [
  { categoria: '⏱ Tiempo', nombre: 'Tiempo de ciclo del proceso', formula: 'Días calendario desde que llega la solicitud hasta que se entrega el resultado (promedio del periodo).', unidad: 'días', sentido: 'bajar' },
  { categoria: '⏱ Tiempo', nombre: 'Tiempo de respuesta', formula: 'Horas entre la solicitud y la primera respuesta al cliente interno o externo.', unidad: 'horas', sentido: 'bajar' },
  { categoria: '⏱ Tiempo', nombre: 'Entregas a tiempo', formula: 'Entregas dentro del plazo acordado / total de entregas × 100.', unidad: '%', sentido: 'subir' },
  { categoria: '⚙️ Productividad', nombre: 'Productividad por persona', formula: 'Unidades (o casos) terminados / personas / días trabajados.', unidad: 'unidades por persona al día', sentido: 'subir' },
  { categoria: '⚙️ Productividad', nombre: 'Cumplimiento del plan de producción', formula: 'Unidades producidas / unidades programadas × 100.', unidad: '%', sentido: 'subir' },
  { categoria: '⚙️ Productividad', nombre: 'Eficiencia global de los equipos (OEE)', formula: 'Disponibilidad × rendimiento × calidad.', unidad: '%', sentido: 'subir' },
  { categoria: '⚙️ Productividad', nombre: 'Horas extra', formula: 'Horas extra pagadas en el mes.', unidad: 'horas al mes', sentido: 'bajar' },
  { categoria: '✅ Calidad', nombre: 'Errores o reprocesos', formula: 'Casos devueltos o rehechos / total de casos × 100.', unidad: '%', sentido: 'bajar' },
  { categoria: '✅ Calidad', nombre: 'Quejas o reclamos', formula: 'Número de quejas o reclamos recibidos en el mes.', unidad: 'quejas al mes', sentido: 'bajar' },
  { categoria: '✅ Calidad', nombre: 'Satisfacción del cliente', formula: 'Promedio de la encuesta de satisfacción (1 = muy mala, 5 = excelente).', unidad: 'puntos (1 a 5)', sentido: 'subir' },
  { categoria: '💵 Costo', nombre: 'Costo por unidad o por caso', formula: 'Costo total del proceso en el mes / unidades o casos atendidos.', unidad: 'COP', sentido: 'bajar' },
  { categoria: '💵 Costo', nombre: 'Ahorro logrado', formula: 'Ahorro anual estimado de las mejoras implementadas.', unidad: 'COP', sentido: 'subir' },
  { categoria: '📦 Inventario', nombre: 'Trabajo acumulado en proceso', formula: 'Casos o unidades esperando en el proceso al cierre de la semana.', unidad: 'unidades', sentido: 'bajar' },
  { categoria: '📦 Inventario', nombre: 'Rotación de inventario', formula: 'Costo de lo vendido / inventario promedio.', unidad: 'veces al año', sentido: 'subir' },
  { categoria: '🧠 Personas', nombre: 'Personas capacitadas', formula: 'Personas que completaron la formación y aprobaron la evaluación.', unidad: 'personas', sentido: 'subir' },
  { categoria: '🧠 Personas', nombre: 'Ideas de mejora implementadas', formula: 'Ideas del equipo puestas en práctica en el mes.', unidad: 'ideas al mes', sentido: 'subir' },
  { categoria: '🧠 Personas', nombre: 'Procesos documentados y estandarizados', formula: 'Procesos con procedimiento vigente y equipo entrenado.', unidad: 'procesos', sentido: 'subir' },
  { categoria: '💻 Digital', nombre: 'Adopción de la herramienta', formula: 'Usuarios que la usan cada semana / usuarios previstos × 100.', unidad: '%', sentido: 'subir' },
  { categoria: '💻 Digital', nombre: 'Registros hechos en papel', formula: 'Registros que todavía se llevan en papel o Excel suelto / total × 100.', unidad: '%', sentido: 'bajar' },
];

export function kpiSugerido(nombre: string) {
  return KPIS_SUGERIDOS.find((k) => k.nombre === nombre);
}

/** Objetivos de ejemplo que trae cada plantilla, con los KPIs sugeridos que los miden. */
export interface ObjetivoPlantilla {
  descripcion: string;
  criterio: string;
  kpis: string[];
}

// ----------------------------------------------------------------------------
// Plantillas de cronograma
// ----------------------------------------------------------------------------

export interface HitoPlantilla {
  fase: string;
  nombre: string;
  que_cumplir?: string;
  insumos?: string;
  /** Momento del proyecto (0 = inicio, 1 = fin) en que vence. */
  vence: number;
  /** Momento en que empieza (si se omite, es un hito puntual). */
  empieza?: number;
  peso?: number;
}

export const PLANTILLAS: Record<string, { nombre: string; descripcion: string; hitos: HitoPlantilla[]; objetivos?: ObjetivoPlantilla[]; seguimientos?: boolean }> = {
  consultoria: {
    nombre: 'Consultoría en procesos',
    descripcion: 'Arranque → Diagnóstico (Makigami) → Diseño → Implementación (Kaizen) → Control → Cierre.',
    objetivos: [
      { descripcion: 'Reducir el tiempo del proceso intervenido', criterio: 'El tiempo de ciclo promedio del último mes llega a la meta acordada.', kpis: ['Tiempo de ciclo del proceso'] },
      { descripcion: 'Disminuir los errores y reprocesos', criterio: 'El % de casos devueltos o rehechos llega a la meta.', kpis: ['Errores o reprocesos'] },
      { descripcion: 'Dejar al equipo del cliente preparado para sostener las mejoras', criterio: 'Procesos documentados y personas capacitadas según lo acordado.', kpis: ['Personas capacitadas', 'Procesos documentados y estandarizados'] },
    ],
    hitos: [
      { fase: 'Arranque', nombre: 'Reunión de arranque y acta de inicio', que_cumplir: 'Alcance, cronograma, responsables y canales acordados y firmados.', vence: 0.03, peso: 1 },
      { fase: 'Arranque', nombre: 'Levantamiento de información', insumos: 'Procedimientos, formatos, datos históricos, organigrama.', empieza: 0.02, vence: 0.12, peso: 2 },
      { fase: 'Diagnóstico', nombre: 'Mapeo del proceso actual (Cacería Makigami)', que_cumplir: 'Proceso AS-IS mapeado con tiempos y desperdicios identificados con el equipo.', empieza: 0.1, vence: 0.22, peso: 3 },
      { fase: 'Diagnóstico', nombre: 'Línea base de indicadores', que_cumplir: 'Valor inicial de cada KPI con su fórmula y fuente.', empieza: 0.12, vence: 0.25, peso: 2 },
      { fase: 'Diagnóstico', nombre: 'Informe de diagnóstico', que_cumplir: 'Hallazgos, causas raíz y oportunidades priorizadas, presentados al cliente.', vence: 0.3, peso: 2 },
      { fase: 'Diseño', nombre: 'Rediseño del proceso (TO-BE) y plan de mejora', empieza: 0.3, vence: 0.4, peso: 3 },
      { fase: 'Diseño', nombre: 'Aprobación del plan por el cliente', vence: 0.45, peso: 1 },
      { fase: 'Implementación', nombre: 'Piloto de las mejoras', empieza: 0.45, vence: 0.62, peso: 4 },
      { fase: 'Implementación', nombre: 'Estandarización y capacitación (Carrera Kaizen)', que_cumplir: 'Procedimientos actualizados y equipo entrenado.', empieza: 0.6, vence: 0.78, peso: 3 },
      { fase: 'Control', nombre: 'Medición de resultados', que_cumplir: 'KPIs medidos contra la línea base y la meta.', empieza: 0.78, vence: 0.9, peso: 2 },
      { fase: 'Cierre', nombre: 'Informe final y acta de cierre', que_cumplir: 'Resultados, lecciones aprendidas y plan de sostenimiento.', vence: 0.98, peso: 2 },
      { fase: 'Cierre', nombre: 'Encuesta de satisfacción del cliente', vence: 1, peso: 1 },
    ],
  },
  programa: {
    nombre: 'Plan de trabajo con seguimientos',
    descripcion: 'Acta de inicio, plan de trabajo aprobado, línea base de indicadores, un seguimiento por cada mes, medición intermedia, medición final e informe de cierre.',
    objetivos: [
      { descripcion: 'Aumentar la productividad del área intervenida', criterio: 'La productividad por persona sube al menos lo acordado frente a la línea base.', kpis: ['Productividad por persona'] },
      { descripcion: 'Cumplir las entregas a tiempo', criterio: 'El % de entregas a tiempo llega a la meta.', kpis: ['Entregas a tiempo'] },
      { descripcion: 'Reducir el costo del proceso', criterio: 'El costo por unidad baja hasta la meta.', kpis: ['Costo por unidad o por caso'] },
    ],
    seguimientos: true,
    hitos: [
      { fase: 'Inicio', nombre: 'Acta de inicio y acuerdos', que_cumplir: 'Fechas, horas, alcance, responsables y reglas de trabajo firmados por las partes.', vence: 0.03, peso: 1 },
      { fase: 'Planeación', nombre: 'Plan de trabajo', que_cumplir: 'Hallazgos iniciales, objetivos, actividades por fase, cronograma e indicadores.', insumos: 'Diagnóstico y visita al cliente.', vence: 0.1, peso: 2 },
      { fase: 'Planeación', nombre: 'Aprobación del plan de trabajo', que_cumplir: 'El cliente revisa y aprueba el plan.', vence: 0.14, peso: 1 },
      { fase: 'Planeación', nombre: 'Línea base de indicadores', que_cumplir: 'Valor inicial de cada indicador y su meta, con soportes.', insumos: 'Datos del periodo base entregados por el cliente.', vence: 0.2, peso: 3 },
      { fase: 'Ejecución', nombre: 'Medición intermedia', que_cumplir: 'Medir los indicadores a mitad de camino y ajustar el plan si hace falta.', vence: 0.55, peso: 1 },
      { fase: 'Cierre', nombre: 'Medición final', que_cumplir: 'Medir los indicadores con los mismos cálculos de la línea base.', vence: 0.95, peso: 2 },
      { fase: 'Cierre', nombre: 'Informe final y acta de cierre', que_cumplir: 'Resultados contra la meta, entregables, lecciones aprendidas y encuesta de satisfacción.', vence: 1, peso: 2 },
    ],
  },
  aplicativo: {
    nombre: 'Desarrollo de aplicativo',
    descripcion: 'Requisitos → Prototipo → Sprints → Pruebas → Capacitación → Producción.',
    objetivos: [
      { descripcion: 'Que el equipo use la nueva herramienta en su día a día', criterio: 'Al menos la meta de usuarios la usa cada semana.', kpis: ['Adopción de la herramienta'] },
      { descripcion: 'Eliminar los registros en papel y Excel sueltos', criterio: 'Los registros del proceso se hacen en la app.', kpis: ['Registros hechos en papel'] },
      { descripcion: 'Que los usuarios queden satisfechos con la herramienta', criterio: 'Encuesta de satisfacción al cierre.', kpis: ['Satisfacción del cliente'] },
    ],
    hitos: [
      { fase: 'Descubrimiento', nombre: 'Levantamiento de requisitos', empieza: 0, vence: 0.1, peso: 2 },
      { fase: 'Descubrimiento', nombre: 'Prototipo aprobado por el cliente', empieza: 0.1, vence: 0.2, peso: 2 },
      { fase: 'Construcción', nombre: 'Sprint 1', empieza: 0.2, vence: 0.4, peso: 3 },
      { fase: 'Construcción', nombre: 'Sprint 2', empieza: 0.4, vence: 0.6, peso: 3 },
      { fase: 'Construcción', nombre: 'Sprint 3', empieza: 0.6, vence: 0.75, peso: 3 },
      { fase: 'Validación', nombre: 'Pruebas con usuarios', empieza: 0.75, vence: 0.85, peso: 2 },
      { fase: 'Entrega', nombre: 'Capacitación a usuarios', vence: 0.92, peso: 1 },
      { fase: 'Entrega', nombre: 'Puesta en producción y acta de entrega', vence: 1, peso: 2 },
    ],
  },
  capacitacion: {
    nombre: 'Capacitación',
    descripcion: 'Necesidades → Diseño → Sesiones → Evaluación → Informe.',
    objetivos: [
      { descripcion: 'Formar a los participantes previstos', criterio: 'Personas que completan y aprueban la formación.', kpis: ['Personas capacitadas'] },
      { descripcion: 'Que apliquen lo aprendido en su trabajo', criterio: 'Ideas de mejora puestas en práctica después de la formación.', kpis: ['Ideas de mejora implementadas'] },
      { descripcion: 'Lograr una formación bien valorada', criterio: 'Promedio de la encuesta de satisfacción.', kpis: ['Satisfacción del cliente'] },
    ],
    hitos: [
      { fase: 'Preparación', nombre: 'Diagnóstico de necesidades', vence: 0.1, peso: 1 },
      { fase: 'Preparación', nombre: 'Diseño del contenido y materiales', empieza: 0.1, vence: 0.3, peso: 2 },
      { fase: 'Ejecución', nombre: 'Sesiones de formación', empieza: 0.3, vence: 0.8, peso: 4 },
      { fase: 'Evaluación', nombre: 'Evaluación de aprendizaje y aplicación', vence: 0.9, peso: 2 },
      { fase: 'Cierre', nombre: 'Informe final y certificados', vence: 1, peso: 1 },
    ],
  },
};

function sumarDias(fecha: string, dias: number) {
  const d = new Date(`${fecha}T12:00:00`);
  d.setDate(d.getDate() + Math.round(dias));
  return d.toISOString().slice(0, 10);
}

/** Hitos de una plantilla con fechas reales según el inicio y el fin del proyecto. */
export function hitosDePlantilla(clave: string, inicio: string, fin: string) {
  const plantilla = PLANTILLAS[clave];
  if (!plantilla) return [];
  const dias = Math.max(1, (new Date(fin).getTime() - new Date(inicio).getTime()) / 86400000);
  return plantilla.hitos.map((h, i) => ({
    fase: h.fase,
    nombre: h.nombre,
    que_cumplir: h.que_cumplir ?? null,
    insumos: h.insumos ?? null,
    fecha_inicio: h.empieza != null ? sumarDias(inicio, h.empieza * dias) : null,
    fecha_limite: sumarDias(inicio, h.vence * dias),
    peso: h.peso ?? 1,
    orden: (i + 1) * 10,
  }));
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** N-ésimo día hábil (lunes a viernes) de un mes. */
function diaHabil(anio: number, mes: number, n: number) {
  const d = new Date(anio, mes, 1, 12);
  let cuenta = 0;
  while (true) {
    const dia = d.getDay();
    if (dia !== 0 && dia !== 6) cuenta++;
    if (cuenta >= n) return d.toISOString().slice(0, 10);
    d.setDate(d.getDate() + 1);
  }
}

/** Un seguimiento por cada mes del proyecto, que vence el día hábil N del mes siguiente. */
export function seguimientosMensuales(inicio: string, fin: string, diaHabilLimite = 3) {
  const res: { fase: string; nombre: string; que_cumplir: string; fecha_inicio: string; fecha_limite: string; peso: number }[] = [];
  const [ai, mi] = inicio.split('-').map(Number) as [number, number];
  const [af, mf] = fin.split('-').map(Number) as [number, number];
  let anio = ai;
  let mes = mi - 1;
  while (anio < af || (anio === af && mes <= mf - 1)) {
    const siguiente = new Date(anio, mes + 1, 1);
    res.push({
      fase: 'Seguimientos',
      nombre: `Seguimiento ${MESES[mes]} ${anio}`,
      que_cumplir: `Reportar actividades, horas reales y evidencias de ${MESES[mes]}.`,
      fecha_inicio: new Date(anio, mes, 1, 12).toISOString().slice(0, 10),
      fecha_limite: diaHabil(siguiente.getFullYear(), siguiente.getMonth(), diaHabilLimite),
      peso: 1,
    });
    mes++;
    if (mes > 11) {
      mes = 0;
      anio++;
    }
  }
  return res;
}

// ----------------------------------------------------------------------------
// Alertas y recomendaciones del consultor
// ----------------------------------------------------------------------------

export interface DatosDiagnostico {
  proyecto: ProyectoMinimo;
  hitos: HitoMinimo[];
  objetivos: ObjetivoMinimo[];
  kpis: KpiMinimo[];
  mediciones: MedicionMinima[];
  bitacora: BitacoraMinima[];
  pagos: PagoMinimo[];
  riesgos: RiesgoMinimo[];
  procesos: number;
}

export function diagnosticoProyecto(d: DatosDiagnostico): Recomendacion[] {
  const r: Recomendacion[] = [];
  const { proyecto: p } = d;
  if (p.estado === 'finalizado' || p.estado === 'cancelado') return r;

  const abiertos = d.hitos.filter(hitoAbierto);
  const vencidos = abiertos.filter((h) => (diasParaVencer(h) ?? 1) < 0).sort((a, b) => (a.fecha_limite ?? '').localeCompare(b.fecha_limite ?? ''));
  const proximos = abiertos.filter((h) => {
    const dv = diasParaVencer(h);
    return dv != null && dv >= 0 && dv <= 7;
  });
  const avance = avanceCronograma(d.hitos);
  const tiempo = avanceTiempo(p);

  if (d.hitos.length === 0) {
    r.push({
      ref: 'pr-cronograma',
      prioridad: 'alta',
      titulo: 'Armar el cronograma del proyecto',
      detalle: 'Sin hitos no se puede medir el avance. Usa una plantilla (consultoría, programa, aplicativo o capacitación) y ajusta las fechas.',
    });
  }
  if (vencidos.length) {
    r.push({
      ref: 'pr-vencidos',
      prioridad: 'alta',
      titulo: `${vencidos.length} ${vencidos.length === 1 ? 'hito vencido' : 'hitos vencidos'}`,
      detalle: vencidos
        .slice(0, 5)
        .map((h) => `«${h.nombre}» (${-(diasParaVencer(h) ?? 0)} días${h.responsable ? `, ${h.responsable}` : ''})`)
        .join('; ') + '. Acuerda una fecha nueva realista o escala el bloqueo.',
    });
  }
  const rechazados = abiertos.filter((h) => h.estado === 'rechazado');
  if (rechazados.length) {
    r.push({
      ref: 'pr-rechazados',
      prioridad: 'alta',
      titulo: `Subsanar ${rechazados.length === 1 ? 'el entregable rechazado' : `${rechazados.length} entregables rechazados`}`,
      detalle: rechazados.map((h) => `«${h.nombre}»${h.situacion ? `: ${h.situacion}` : ''}`).join('; '),
    });
  }
  const bloqueados = abiertos.filter((h) => h.estado === 'bloqueado');
  if (bloqueados.length) {
    r.push({
      ref: 'pr-bloqueados',
      prioridad: 'alta',
      titulo: `${bloqueados.length} ${bloqueados.length === 1 ? 'hito bloqueado' : 'hitos bloqueados'}`,
      detalle: `${bloqueados.map((h) => `«${h.nombre}»`).join(', ')}. Identifica de quién depende el desbloqueo y agenda la gestión.`,
    });
  }
  if (avance != null && tiempo != null && avance - tiempo < -0.1) {
    r.push({
      ref: 'pr-brecha',
      prioridad: avance - tiempo < -0.25 ? 'alta' : 'media',
      titulo: `El avance (${pct(avance)}) va detrás del tiempo transcurrido (${pct(tiempo)})`,
      detalle: 'Revisa la ruta crítica: qué hitos pesan más y cuáles dependen del cliente. Considera replanificar con el cliente antes de que se acerque la fecha de fin.',
      herramienta: 'Replanificación del cronograma',
    });
  }
  if (proximos.length) {
    r.push({
      ref: 'pr-proximos',
      prioridad: 'media',
      titulo: `${proximos.length} ${proximos.length === 1 ? 'hito vence' : 'hitos vencen'} en los próximos 7 días`,
      detalle: proximos.map((h) => `«${h.nombre}» (${diasParaVencer(h) === 0 ? 'hoy' : `en ${diasParaVencer(h)} días`})`).join('; '),
    });
  }
  const sinResponsable = abiertos.filter((h) => !h.responsable?.trim());
  if (sinResponsable.length >= 2) {
    r.push({ ref: 'pr-responsables', prioridad: 'media', titulo: `${sinResponsable.length} hitos sin responsable`, detalle: 'Cada hito necesita una persona con nombre propio.' });
  }

  // Horas.
  const horas = horasEjecutadas(d.bitacora);
  if (p.horas_contratadas && p.horas_contratadas > 0) {
    const consumo = horas / p.horas_contratadas;
    if (consumo >= 1) {
      r.push({ ref: 'pr-horas-agotadas', prioridad: 'alta', titulo: `Horas agotadas: ${formatearHoras(horas)} de ${formatearHoras(p.horas_contratadas)}`, detalle: 'Negocia horas adicionales o acota el alcance con el cliente antes de seguir.' });
    } else if (avance != null && consumo - avance > 0.15) {
      r.push({
        ref: 'pr-horas-consumo',
        prioridad: 'media',
        titulo: `Se ha usado el ${pct(consumo)} de las horas con un ${pct(avance)} de avance`,
        detalle: 'Las horas se consumen más rápido que el avance: revisa en qué se van las intervenciones y protege las horas de los entregables grandes.',
      });
    }
  }

  // Frecuencia de intervención (como "días sin intervenir" del Excel).
  const ultima = ultimaIntervencion(d.bitacora);
  if (p.estado === 'en_curso' && p.frecuencia_dias) {
    const dias = ultima ? -diasHasta(ultima.fecha) : null;
    if (dias == null || dias > p.frecuencia_dias) {
      r.push({
        ref: 'pr-sin-intervenir',
        prioridad: dias == null || dias > p.frecuencia_dias * 2 ? 'alta' : 'media',
        titulo: dias == null ? 'Aún no hay intervenciones registradas' : `${dias} días sin intervenir (la meta es cada ${p.frecuencia_dias})`,
        detalle: 'Agenda un contacto con el cliente y registra la intervención en la bitácora.',
      });
    }
  }
  if (ultima?.fecha_proximo && diasHasta(ultima.fecha_proximo) < 0) {
    r.push({ ref: 'pr-proximo-paso', prioridad: 'media', titulo: 'El próximo paso de la última intervención ya venció', detalle: `«${ultima.proximo_paso ?? 'Sin descripción'}», previsto para ${ultima.fecha_proximo}.` });
  }

  // Objetivos y KPIs.
  if (d.objetivos.length === 0) {
    r.push({ ref: 'pr-objetivos', prioridad: 'media', titulo: 'Definir los objetivos del proyecto', detalle: 'Escribe 2 a 4 objetivos medibles, acordados con el cliente, y cómo sabrán que se cumplieron.', herramienta: 'Objetivos SMART' });
  } else if (d.kpis.length === 0) {
    r.push({ ref: 'pr-kpis', prioridad: 'media', titulo: 'Los objetivos no tienen KPIs', detalle: 'Asocia al menos un indicador con línea base y meta a cada objetivo para demostrar resultados.' });
  }
  const sinMedir = d.kpis.filter((k) => !d.mediciones.some((m) => m.kpi_id === k.id));
  if (sinMedir.length) {
    r.push({ ref: 'pr-kpis-sin-medir', prioridad: 'media', titulo: `${sinMedir.length} ${sinMedir.length === 1 ? 'KPI sin mediciones' : 'KPIs sin mediciones'}`, detalle: sinMedir.map((k) => k.nombre).join(', ') });
  }
  const sinBase = d.kpis.filter((k) => k.linea_base == null || k.meta == null);
  if (sinBase.length) {
    r.push({ ref: 'pr-kpis-base', prioridad: 'media', titulo: `${sinBase.length} ${sinBase.length === 1 ? 'KPI sin línea base o meta' : 'KPIs sin línea base o meta'}`, detalle: sinBase.map((k) => k.nombre).join(', ') });
  }

  // Pagos.
  const pagosVencidos = d.pagos.filter((x) => (x.estado === 'pendiente' || x.estado === 'facturado') && x.fecha_limite && diasHasta(x.fecha_limite) < 0);
  if (pagosVencidos.length) {
    r.push({
      ref: 'pr-pagos',
      prioridad: 'alta',
      titulo: `${pagosVencidos.length} ${pagosVencidos.length === 1 ? 'pago vencido' : 'pagos vencidos'}`,
      detalle: pagosVencidos.map((x) => `${x.concepto} (${formatearPesos(x.valor)})`).join('; ') + '. Confirma con el cliente y sube el soporte.',
    });
  }

  // Riesgos.
  const riesgosAltos = d.riesgos.filter((x) => x.estado === 'abierto' && nivelRiesgo(x) >= 6);
  if (riesgosAltos.length) {
    r.push({
      ref: 'pr-riesgos',
      prioridad: riesgosAltos.some((x) => !x.mitigacion?.trim()) ? 'alta' : 'media',
      titulo: `${riesgosAltos.length} ${riesgosAltos.length === 1 ? 'riesgo alto abierto' : 'riesgos altos abiertos'}`,
      detalle: riesgosAltos.map((x) => `«${x.descripcion}»${x.mitigacion?.trim() ? '' : ' (sin plan de mitigación)'}`).join('; '),
      herramienta: 'Matriz de riesgos',
    });
  } else if (d.riesgos.length === 0 && d.hitos.length > 0) {
    r.push({ ref: 'pr-sin-riesgos', prioridad: 'baja', titulo: 'Identificar los riesgos del proyecto', detalle: 'Piensa en qué puede frenar el proyecto: datos que no llegan, aprobaciones lentas, cambios de personal. Anótalos con su plan.' });
  }

  // Procesos.
  if (d.procesos === 0 && p.tipo !== 'aplicativo' && p.tipo !== 'tarea_personal') {
    r.push({
      ref: 'pr-procesos',
      prioridad: 'baja',
      titulo: 'Unir los procesos del cliente al proyecto',
      detalle: 'Crea en el Control de procesos los procesos que se van a mejorar y únelos aquí: así sus indicadores y planes de acción quedan en el informe del proyecto.',
    });
  }

  // Cierre.
  if (p.fecha_fin && diasHasta(p.fecha_fin) <= 15 && diasHasta(p.fecha_fin) >= 0 && (avance ?? 0) < 0.8) {
    r.push({ ref: 'pr-cierre', prioridad: 'alta', titulo: `Faltan ${diasHasta(p.fecha_fin)} días para el fin y el avance es ${pct(avance)}`, detalle: 'Prioriza los entregables de cierre (mediciones de salida, acta, informe final) y acuerda con el cliente qué queda fuera.' });
  }

  const orden: Record<string, number> = { alta: 0, media: 1, baja: 2 };
  return r.sort((a, b) => orden[a.prioridad]! - orden[b.prioridad]!);
}

// ----------------------------------------------------------------------------
// Resumen ejecutivo y agenda
// ----------------------------------------------------------------------------

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * Resumen ejecutivo escrito a partir de los datos, en párrafos cortos, para
 * contarle al cliente (o a la consultora) cómo va el proyecto.
 */
export function resumenEjecutivo(d: DatosDiagnostico & { nombre: string; cliente: string }): string[] {
  const p = d.proyecto;
  const out: string[] = [];
  const avance = avanceCronograma(d.hitos);
  const tiempo = avanceTiempo(p);

  if (p.estado === 'finalizado') out.push(`El proyecto «${d.nombre}» con ${d.cliente} está finalizado.`);
  else if (p.fecha_inicio && p.fecha_fin && tiempo != null) {
    const total = Math.round((new Date(p.fecha_fin).getTime() - new Date(p.fecha_inicio).getTime()) / 86400000);
    const dia = Math.max(0, Math.min(total, total - diasHasta(p.fecha_fin)));
    let frase = `El proyecto «${d.nombre}» con ${d.cliente} va en el día ${dia} de ${total} (${pct(tiempo)} del tiempo)`;
    if (avance != null) {
      const brecha = Math.round((avance - tiempo) * 100);
      const vencidos = d.hitos.filter((h) => (diasParaVencer(h) ?? 1) < 0).length;
      frase += ` y lleva ${pct(avance)} del cronograma cumplido: ${brecha >= 5 ? `va adelantado ${brecha} puntos` : brecha >= -10 ? 'va al día' : `va atrasado ${-brecha} puntos`}${brecha >= -10 && vencidos ? `, aunque ${vencidos === 1 ? 'tiene 1 hito vencido que lo pone en riesgo' : `tiene ${vencidos} hitos vencidos que lo ponen en riesgo`}` : ''}.`;
    } else frase += ', pero aún no tiene cronograma para medir el avance.';
    out.push(frase);
  } else out.push(`El proyecto «${d.nombre}» con ${d.cliente} no tiene fechas de inicio y fin: ponlas para medir el avance contra el tiempo.`);

  if (d.hitos.length) {
    const cumplidos = d.hitos.filter((h) => h.estado === 'cumplido').length;
    const vigentes = d.hitos.filter((h) => h.estado !== 'no_aplica').length;
    const vencidos = d.hitos.filter((h) => (diasParaVencer(h) ?? 1) < 0).length;
    const proximos = d.hitos.filter((h) => {
      const x = diasParaVencer(h);
      return x != null && x >= 0 && x <= 7;
    }).length;
    const partes = [`Se han cumplido ${cumplidos} de ${vigentes} hitos`];
    if (vencidos) partes.push(plural(vencidos, 'está vencido', 'están vencidos'));
    if (proximos) partes.push(`${plural(proximos, 'vence', 'vencen')} en los próximos 7 días`);
    out.push(partes.join('; ') + '.');
  }

  if (d.objetivos.length) {
    const c = cumplimientoObjetivos(d.objetivos, d.kpis, d.mediciones);
    let frase = d.objetivos.length === 1 ? `El objetivo lleva ${pct(c)} de cumplimiento` : `Los ${d.objetivos.length} objetivos llevan ${pct(c)} de cumplimiento`;
    const conAvance = d.kpis.map((k) => ({ k, a: avanceKpi(k, d.mediciones) })).filter((x) => x.a != null) as { k: KpiMinimo; a: number }[];
    if (conAvance.length) {
      const mejor = conAvance.sort((a, b) => b.a - a.a)[0]!;
      frase += `; el indicador que más avanza es «${mejor.k.nombre}» (${pct(mejor.a)} del camino a la meta)`;
    }
    out.push(frase + '.');
  }

  const horas = horasEjecutadas(d.bitacora);
  const dinero: string[] = [];
  if (p.horas_contratadas) dinero.push(`se han ejecutado ${formatearHoras(horas)} de ${formatearHoras(p.horas_contratadas)} contratadas (${pct(horas / p.horas_contratadas)})`);
  else if (horas) dinero.push(`se han ejecutado ${formatearHoras(horas)}`);
  const porCobrar = d.pagos.filter((x) => x.tipo !== 'gasto' && (x.estado === 'pendiente' || x.estado === 'facturado'));
  const vencidos = porCobrar.filter((x) => x.fecha_limite && diasHasta(x.fecha_limite) < 0);
  if (porCobrar.length) dinero.push(`hay ${formatearPesos(porCobrar.reduce((s, x) => s + Number(x.valor), 0))} por cobrar${vencidos.length ? ` (${formatearPesos(vencidos.reduce((s, x) => s + Number(x.valor), 0))} vencidos)` : ''}`);
  if (dinero.length) out.push(dinero.join(' y ').replace(/^./, (c) => c.toUpperCase()) + '.');

  const abiertos = d.riesgos.filter((x) => x.estado === 'abierto');
  if (abiertos.length) out.push(`Hay ${plural(abiertos.length, 'riesgo abierto', 'riesgos abiertos')}${abiertos.some((x) => nivelRiesgo(x) >= 6) ? `, ${abiertos.filter((x) => nivelRiesgo(x) >= 6).length} de nivel alto` : ''}.`);

  const ultima = ultimaIntervencion(d.bitacora);
  if (ultima?.proximo_paso) out.push(`Próximo paso: ${ultima.proximo_paso}${ultima.fecha_proximo ? ` (para el ${ultima.fecha_proximo.split('-').reverse().join('/')})` : ''}.`);
  if (p.fecha_fin && p.estado !== 'finalizado') {
    const dias = diasHasta(p.fecha_fin);
    out.push(dias >= 0 ? `Faltan ${plural(dias, 'día', 'días')} para la fecha límite de finalización.` : `La fecha límite de finalización pasó hace ${plural(-dias, 'día', 'días')}.`);
  }
  return out;
}

export interface EventoAgenda {
  fecha: string;
  tipo: 'hito' | 'pago' | 'paso' | 'cierre';
  titulo: string;
  detalle?: string;
  vencido: boolean;
}

/** Lo que viene (y lo vencido) de un proyecto: hitos abiertos, pagos, próximo paso y fechas de cierre. */
export function agendaProyecto(
  p: Pick<ProyectoMinimo, 'fecha_fin' | 'fecha_cierre_limite' | 'estado'>,
  hitos: HitoMinimo[],
  pagos: PagoMinimo[],
  bitacora: BitacoraMinima[],
  dias = 14,
): EventoAgenda[] {
  if (p.estado === 'finalizado' || p.estado === 'cancelado') return [];
  const dentro = (f: string | null) => f != null && diasHasta(f) <= dias;
  const ev: EventoAgenda[] = [];
  for (const h of hitos) {
    if (hitoAbierto(h) && dentro(h.fecha_limite)) ev.push({ fecha: h.fecha_limite!, tipo: 'hito', titulo: h.nombre, detalle: h.responsable ?? undefined, vencido: diasHasta(h.fecha_limite!) < 0 });
  }
  for (const x of pagos) {
    if ((x.estado === 'pendiente' || x.estado === 'facturado') && dentro(x.fecha_limite)) ev.push({ fecha: x.fecha_limite!, tipo: 'pago', titulo: x.concepto, detalle: formatearPesos(Number(x.valor)), vencido: diasHasta(x.fecha_limite!) < 0 });
  }
  const ultima = ultimaIntervencion(bitacora);
  if (ultima?.proximo_paso && dentro(ultima.fecha_proximo)) ev.push({ fecha: ultima.fecha_proximo!, tipo: 'paso', titulo: ultima.proximo_paso, vencido: diasHasta(ultima.fecha_proximo!) < 0 });
  if (dentro(p.fecha_fin) && diasHasta(p.fecha_fin!) >= 0) ev.push({ fecha: p.fecha_fin!, tipo: 'cierre', titulo: 'Fecha límite de finalización', vencido: false });
  if (dentro(p.fecha_cierre_limite) && diasHasta(p.fecha_cierre_limite!) >= 0) ev.push({ fecha: p.fecha_cierre_limite!, tipo: 'cierre', titulo: 'Límite del acta de cierre', vencido: false });
  return ev.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export const ICONO_AGENDA: Record<EventoAgenda['tipo'], string> = { hito: '🚩', pago: '💰', paso: '👣', cierre: '🏁' };
