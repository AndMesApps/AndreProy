'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import {
  ENTIDADES,
  ESTADOS_HITO,
  ESTADOS_PROYECTO,
  PLANTILLAS,
  TIPOS_PROYECTO,
  hitosDePlantilla,
  kpiSugerido,
  hoyISO,
  leerNumero,
  seguimientosMensuales,
  type Campo,
  type Entidad,
  type EstadoHito,
  type EstadoProyecto,
} from '@/lib/proyectos';

const RUTA = '/proyectos';
const ruta = (id: string) => `${RUTA}/${id}`;

type Resultado = { ok: true; aviso?: string } | { ok: false; error: string };

/** El Administrador administra cualquier proyecto; el Líder, solo los que creó. */
async function requerirProyecto(proyectoId: string) {
  const facilitador = await getFacilitador();
  if (!facilitador) return null;
  const { data: proyecto } = await db().from('pr_proyectos').select('id, creado_por, fecha_inicio, fecha_fin').eq('id', proyectoId).maybeSingle();
  if (!proyecto || !puedeAdministrarReto(facilitador, proyecto)) return null;
  return { facilitador, proyecto: proyecto as { id: string; creado_por: string | null; fecha_inicio: string | null; fecha_fin: string | null } };
}

function refrescar(proyectoId?: string) {
  revalidatePath(RUTA);
  revalidatePath('/panel');
  if (proyectoId) {
    revalidatePath(ruta(proyectoId));
    revalidatePath(`${ruta(proyectoId)}/informe`);
  }
}

// ----------------------------------------------------------------------------
// Proyecto
// ----------------------------------------------------------------------------

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .or(z.literal(''))
  .transform((v) => v || null);
const numero = z.number().finite().nonnegative().nullable().optional();
const texto = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

const ProyectoSchema = z
  .object({
    nombre: z.string().trim().min(2, 'Escribe el nombre del proyecto').max(160),
    cliente: z.string().trim().min(2, 'Escribe el cliente').max(160),
    grupo: texto(120),
    tipo: z.enum(Object.keys(TIPOS_PROYECTO) as [string, ...string[]]),
    programa: texto(160),
    descripcion: texto(3000),
    objetivoGeneral: texto(1000),
    contactoNombre: texto(160),
    contactoCargo: texto(160),
    contactoCorreo: texto(160),
    contactoCelular: texto(60),
    gestorExterno: texto(160),
    fechaInicio: fecha,
    fechaFin: fecha,
    fechaCierreLimite: fecha,
    horasContratadas: numero,
    valorContrato: numero,
    frecuenciaDias: z.number().int().min(1).max(365).nullable().optional(),
    estado: z.enum(Object.keys(ESTADOS_PROYECTO) as [string, ...string[]]),
    reglas: texto(5000),
    enlaces: texto(5000),
  })
  .refine((d) => !d.fechaInicio || !d.fechaFin || d.fechaFin >= d.fechaInicio, { message: 'La fecha de finalización debe ser posterior al inicio.' });

export type DatosProyecto = z.input<typeof ProyectoSchema>;

function filaProyecto(d: z.output<typeof ProyectoSchema>) {
  return {
    nombre: d.nombre,
    cliente: d.cliente,
    grupo: d.grupo,
    tipo: d.tipo,
    programa: d.programa,
    descripcion: d.descripcion,
    objetivo_general: d.objetivoGeneral,
    contacto_nombre: d.contactoNombre,
    contacto_cargo: d.contactoCargo,
    contacto_correo: d.contactoCorreo,
    contacto_celular: d.contactoCelular,
    gestor_externo: d.gestorExterno,
    fecha_inicio: d.fechaInicio,
    fecha_fin: d.fechaFin,
    fecha_cierre_limite: d.fechaCierreLimite,
    horas_contratadas: d.horasContratadas ?? null,
    valor_contrato: d.valorContrato ?? null,
    frecuencia_dias: d.frecuenciaDias ?? null,
    estado: d.estado,
    reglas: d.reglas,
    enlaces: d.enlaces,
  };
}

/** Crea el proyecto y, si se pide, su cronograma desde una plantilla (con seguimientos mensuales). */
export async function crearProyecto(input: DatosProyecto, plantilla?: string, diaSeguimiento?: number) {
  const facilitador = await getFacilitador();
  if (!facilitador) return { ok: false as const, error: 'No autorizado' };
  const parsed = ProyectoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const sb = db();
  const { data, error } = await sb
    .from('pr_proyectos')
    .insert({ ...filaProyecto(d), creado_por: facilitador.id })
    .select('id')
    .single();
  if (error) return { ok: false as const, error: error.message };
  const id = data.id as string;

  if (plantilla && PLANTILLAS[plantilla] && d.fechaInicio && d.fechaFin) {
    const r = await insertarPlantilla(id, plantilla, d.fechaInicio, d.fechaFin, diaSeguimiento);
    if (!r.ok) return { ok: true as const, id, aviso: r.error };
  }
  refrescar(id);
  return { ok: true as const, id };
}

export async function actualizarProyecto(proyectoId: string, input: DatosProyecto): Promise<Resultado> {
  if (!(await requerirProyecto(proyectoId))) return { ok: false, error: 'No autorizado' };
  const parsed = ProyectoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { error } = await db().from('pr_proyectos').update(filaProyecto(parsed.data)).eq('id', proyectoId);
  if (error) return { ok: false, error: error.message };
  refrescar(proyectoId);
  return { ok: true };
}

export async function cambiarEstadoProyecto(proyectoId: string, estado: EstadoProyecto): Promise<Resultado> {
  if (!(estado in ESTADOS_PROYECTO)) return { ok: false, error: 'Estado inválido' };
  if (!(await requerirProyecto(proyectoId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('pr_proyectos').update({ estado }).eq('id', proyectoId);
  if (error) return { ok: false, error: error.message };
  refrescar(proyectoId);
  return { ok: true };
}

/** Borra el proyecto con todos sus registros. Los procesos unidos se conservan (quedan sin proyecto). */
export async function eliminarProyecto(proyectoId: string): Promise<Resultado> {
  if (!(await requerirProyecto(proyectoId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('pr_proyectos').delete().eq('id', proyectoId);
  if (error) return { ok: false, error: error.message };
  refrescar();
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Cronograma: plantillas y seguimientos
// ----------------------------------------------------------------------------

async function insertarPlantilla(proyectoId: string, clave: string, inicio: string, fin: string, diaSeguimiento?: number): Promise<Resultado> {
  const sb = db();
  const { data: ultimo } = await sb.from('pr_hitos').select('orden').eq('proyecto_id', proyectoId).order('orden', { ascending: false }).limit(1).maybeSingle();
  const base = (ultimo?.orden as number | undefined) ?? 0;
  const filas: Record<string, unknown>[] = hitosDePlantilla(clave, inicio, fin).map((h) => ({ ...h, orden: base + h.orden, proyecto_id: proyectoId }));
  if (PLANTILLAS[clave]?.seguimientos) {
    const seg = seguimientosMensuales(inicio, fin, diaSeguimiento ?? 3);
    filas.push(...seg.map((h, i) => ({ ...h, orden: base + 1000 + i * 10, proyecto_id: proyectoId })));
  }
  if (filas.length) {
    const { error } = await sb.from('pr_hitos').insert(filas);
    if (error) return { ok: false, error: `El proyecto se creó, pero no el cronograma: ${error.message}` };
  }
  await insertarObjetivosSugeridos(proyectoId, clave);
  return { ok: true };
}

/** Objetivos y KPIs de ejemplo de la plantilla (solo si el proyecto aún no tiene objetivos). */
async function insertarObjetivosSugeridos(proyectoId: string, clave: string) {
  const sugeridos = PLANTILLAS[clave]?.objetivos;
  if (!sugeridos?.length) return;
  const sb = db();
  const { count } = await sb.from('pr_objetivos').select('id', { count: 'exact', head: true }).eq('proyecto_id', proyectoId);
  if ((count ?? 0) > 0) return;
  for (const o of sugeridos) {
    const { data } = await sb
      .from('pr_objetivos')
      .insert({ proyecto_id: proyectoId, descripcion: o.descripcion, criterio: o.criterio, estado: 'pendiente', peso: 1 })
      .select('id')
      .single();
    if (!data) continue;
    const kpis = o.kpis.map(kpiSugerido).filter((k): k is NonNullable<typeof k> => Boolean(k));
    if (kpis.length) {
      await sb.from('pr_kpis').insert(kpis.map((k) => ({ proyecto_id: proyectoId, objetivo_id: data.id, nombre: k.nombre, formula: k.formula, unidad: k.unidad, sentido: k.sentido })));
    }
  }
}

export async function aplicarPlantilla(proyectoId: string, clave: string, diaSeguimiento?: number): Promise<Resultado> {
  const ctx = await requerirProyecto(proyectoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  if (!PLANTILLAS[clave]) return { ok: false, error: 'Plantilla no encontrada' };
  const { fecha_inicio, fecha_fin } = ctx.proyecto;
  if (!fecha_inicio || !fecha_fin) return { ok: false, error: 'Primero pon la fecha de inicio y la fecha límite de finalización del proyecto.' };
  const r = await insertarPlantilla(proyectoId, clave, fecha_inicio, fecha_fin, diaSeguimiento);
  if (!r.ok) return r;
  refrescar(proyectoId);
  return { ok: true, aviso: `Se agregaron los hitos de «${PLANTILLAS[clave]!.nombre}». Ajusta fechas y responsables.` };
}

/** Agrega un seguimiento por mes (los que aún no existan con el mismo nombre). */
export async function generarSeguimientos(proyectoId: string, diaHabil: number): Promise<Resultado> {
  const ctx = await requerirProyecto(proyectoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const { fecha_inicio, fecha_fin } = ctx.proyecto;
  if (!fecha_inicio || !fecha_fin) return { ok: false, error: 'Primero pon la fecha de inicio y la fecha límite de finalización del proyecto.' };
  const n = Math.min(20, Math.max(1, Math.round(diaHabil) || 3));
  const sb = db();
  const { data: existentes } = await sb.from('pr_hitos').select('nombre').eq('proyecto_id', proyectoId);
  const ya = new Set(((existentes ?? []) as { nombre: string }[]).map((h) => h.nombre.toLowerCase()));
  const nuevos = seguimientosMensuales(fecha_inicio, fecha_fin, n).filter((h) => !ya.has(h.nombre.toLowerCase()));
  if (!nuevos.length) return { ok: true, aviso: 'Los seguimientos mensuales ya estaban creados.' };
  const { error } = await sb.from('pr_hitos').insert(nuevos.map((h, i) => ({ ...h, proyecto_id: proyectoId, orden: 1000 + i * 10 })));
  if (error) return { ok: false, error: error.message };
  refrescar(proyectoId);
  return { ok: true, aviso: `Se crearon ${nuevos.length} seguimientos mensuales.` };
}

/** Cambio rápido de estado de un hito; al cumplirlo, anota la fecha real si no la tenía. */
export async function cambiarEstadoHito(proyectoId: string, hitoId: string, estado: EstadoHito): Promise<Resultado> {
  if (!(estado in ESTADOS_HITO)) return { ok: false, error: 'Estado inválido' };
  if (!(await requerirProyecto(proyectoId))) return { ok: false, error: 'No autorizado' };
  const sb = db();
  const cambios: Record<string, unknown> = { estado, updated_at: new Date().toISOString() };
  if (estado === 'cumplido') {
    const { data: h } = await sb.from('pr_hitos').select('fecha_real').eq('id', hitoId).maybeSingle();
    if (h && !h.fecha_real) cambios.fecha_real = hoyISO();
  }
  const { error } = await sb.from('pr_hitos').update(cambios).eq('id', hitoId).eq('proyecto_id', proyectoId);
  if (error) return { ok: false, error: error.message };
  refrescar(proyectoId);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Registros del proyecto (hitos, objetivos, KPIs, mediciones, bitácora, pagos, riesgos, documentos)
// ----------------------------------------------------------------------------

const TABLA_REFERENCIA = { hitos: 'pr_hitos', objetivos: 'pr_objetivos', kpis: 'pr_kpis' } as const;

function convertir(campo: Campo, crudo: unknown): { valor: unknown } | { error: string } {
  const t = typeof crudo === 'string' ? crudo.trim() : crudo == null ? '' : String(crudo);
  if (t === '') return campo.requerido ? { error: `Falta: ${campo.etiqueta}` } : { valor: null };
  switch (campo.tipo) {
    case 'texto':
    case 'area':
      return t.length > 5000 ? { error: `${campo.etiqueta}: texto muy largo` } : { valor: t };
    case 'url':
      return /^https?:\/\/\S+$/i.test(t) ? { valor: t } : { error: `${campo.etiqueta}: escribe un enlace que empiece por https://` };
    case 'fecha':
      return /^\d{4}-\d{2}-\d{2}$/.test(t) ? { valor: t } : { error: `${campo.etiqueta}: fecha inválida` };
    case 'numero': {
      const n = leerNumero(t);
      return n != null ? { valor: n } : { error: `${campo.etiqueta}: escribe un número` };
    }
    case 'opcion':
      return campo.opciones && t in campo.opciones ? { valor: t } : { error: `${campo.etiqueta}: opción inválida` };
    case 'referencia':
      return /^[0-9a-f-]{36}$/i.test(t) ? { valor: t } : { error: `${campo.etiqueta}: opción inválida` };
  }
}

/** Crea (id null) o actualiza un registro del proyecto, validando cada campo según su definición. */
export async function guardarRegistro(entidad: Entidad, proyectoId: string, id: string | null, valores: Record<string, string>): Promise<Resultado> {
  const def = ENTIDADES[entidad];
  if (!def) return { ok: false, error: 'Registro inválido' };
  const ctx = await requerirProyecto(proyectoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };

  const fila: Record<string, unknown> = {};
  const sb = db();
  for (const campo of def.campos as readonly Campo[]) {
    const r = convertir(campo, valores[campo.clave]);
    if ('error' in r) return { ok: false, error: r.error };
    // Las referencias deben ser del mismo proyecto.
    if (campo.tipo === 'referencia' && r.valor && campo.referencia) {
      const { data } = await sb.from(TABLA_REFERENCIA[campo.referencia]).select('id').eq('id', r.valor as string).eq('proyecto_id', proyectoId).maybeSingle();
      if (!data) return { ok: false, error: `${campo.etiqueta}: no pertenece a este proyecto` };
    }
    fila[campo.clave] = r.valor;
  }
  if (entidad === 'hitos') fila.updated_at = new Date().toISOString();
  if (entidad === 'bitacora' && !id) fila.registrado_por = ctx.facilitador.id;
  if (entidad === 'hitos' && fila.estado === 'cumplido' && !fila.fecha_real) fila.fecha_real = hoyISO();

  let error;
  if (id) {
    ({ error } = await sb.from(def.tabla).update(fila).eq('id', id).eq('proyecto_id', proyectoId));
  } else {
    if (entidad === 'hitos') {
      const { data: ultimo } = await sb.from('pr_hitos').select('orden').eq('proyecto_id', proyectoId).order('orden', { ascending: false }).limit(1).maybeSingle();
      fila.orden = ((ultimo?.orden as number | undefined) ?? 0) + 10;
    }
    ({ error } = await sb.from(def.tabla).insert({ ...fila, proyecto_id: proyectoId }));
  }
  if (error) return { ok: false, error: error.message };
  refrescar(proyectoId);
  return { ok: true };
}

export async function eliminarRegistro(entidad: Entidad, proyectoId: string, id: string): Promise<Resultado> {
  const def = ENTIDADES[entidad];
  if (!def) return { ok: false, error: 'Registro inválido' };
  if (!(await requerirProyecto(proyectoId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from(def.tabla).delete().eq('id', id).eq('proyecto_id', proyectoId);
  if (error) return { ok: false, error: error.message };
  refrescar(proyectoId);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Procesos del proyecto
// ----------------------------------------------------------------------------

/** Une un proceso del Control de procesos al proyecto (o lo suelta con unir=false). */
export async function vincularProceso(proyectoId: string, procesoId: string, unir: boolean): Promise<Resultado> {
  const ctx = await requerirProyecto(proyectoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const sb = db();
  const { data: proceso } = await sb.from('pc_procesos').select('id, creado_por').eq('id', procesoId).maybeSingle();
  if (!proceso || !puedeAdministrarReto(ctx.facilitador, proceso)) return { ok: false, error: 'No puedes usar ese proceso' };
  const { error } = await sb.from('pc_procesos').update({ proyecto_id: unir ? proyectoId : null }).eq('id', procesoId);
  if (error) return { ok: false, error: error.message };
  refrescar(proyectoId);
  revalidatePath(`/procesos/${procesoId}`);
  return { ok: true };
}
