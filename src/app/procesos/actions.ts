'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { ESTADOS_ACCION, FRECUENCIAS, type EstadoAccion } from '@/lib/procesos';

const RUTA = '/procesos';

function rutaProceso(id: string) {
  return `${RUTA}/${id}`;
}

type Resultado = { ok: true } | { ok: false; error: string };

/** El Administrador administra cualquier proceso; el Líder, solo los que creó. */
async function requerirProceso(procesoId: string) {
  const facilitador = await getFacilitador();
  if (!facilitador) return null;
  const { data: proceso } = await db().from('pc_procesos').select('id, creado_por').eq('id', procesoId).maybeSingle();
  if (!proceso || !puedeAdministrarReto(facilitador, proceso)) return null;
  return { facilitador, proceso };
}

const numeroOpcional = z.number().finite().nullable().optional();

const ProcesoSchema = z.object({
  nombre: z.string().trim().min(1, 'Escribe el nombre del proceso').max(120),
  cliente: z.string().trim().max(120).optional(),
  area: z.string().trim().max(120).optional(),
  responsable: z.string().trim().max(120).optional(),
  objetivo: z.string().trim().max(1000).optional(),
  indicador: z.string().trim().min(1, 'Escribe qué indicador vas a medir').max(120),
  unidad: z.string().trim().min(1, 'Escribe la unidad del indicador').max(40),
  sentido: z.enum(['bajar', 'subir']),
  lineaBase: numeroOpcional,
  meta: numeroOpcional,
  frecuencia: z.enum(Object.keys(FRECUENCIAS) as [string, ...string[]]),
});

export type DatosProceso = z.infer<typeof ProcesoSchema>;

function filaProceso(d: DatosProceso) {
  return {
    nombre: d.nombre,
    cliente: d.cliente || null,
    area: d.area || null,
    responsable: d.responsable || null,
    objetivo: d.objetivo || null,
    indicador: d.indicador,
    unidad: d.unidad,
    sentido: d.sentido,
    linea_base: d.lineaBase ?? null,
    meta: d.meta ?? null,
    frecuencia: d.frecuencia,
  };
}

/** Crea un proceso; con proyectoId queda unido a ese proyecto de consultoría. */
export async function crearProceso(input: DatosProceso, proyectoId?: string) {
  const facilitador = await getFacilitador();
  if (!facilitador) return { ok: false as const, error: 'No autorizado' };
  const parsed = ProcesoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  let proyecto: string | null = null;
  if (proyectoId) {
    const { data: pr } = await db().from('pr_proyectos').select('id, creado_por').eq('id', proyectoId).maybeSingle();
    if (!pr || !puedeAdministrarReto(facilitador, pr)) return { ok: false as const, error: 'No puedes usar ese proyecto' };
    proyecto = pr.id as string;
  }
  const { data, error } = await db()
    .from('pc_procesos')
    .insert({ ...filaProceso(parsed.data), creado_por: facilitador.id, proyecto_id: proyecto })
    .select('id')
    .single();
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  revalidatePath('/panel');
  if (proyecto) revalidatePath(`/proyectos/${proyecto}`);
  return { ok: true as const, id: data.id as string };
}

export async function actualizarProceso(procesoId: string, input: DatosProceso): Promise<Resultado> {
  if (!(await requerirProceso(procesoId))) return { ok: false, error: 'No autorizado' };
  const parsed = ProcesoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { error } = await db().from('pc_procesos').update(filaProceso(parsed.data)).eq('id', procesoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(rutaProceso(procesoId));
  return { ok: true };
}

/** Archivar saca el proceso de la lista activa sin perder su historia. */
export async function archivarProceso(procesoId: string, activo: boolean): Promise<Resultado> {
  if (!(await requerirProceso(procesoId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('pc_procesos').update({ activo }).eq('id', procesoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(rutaProceso(procesoId));
  revalidatePath('/panel');
  return { ok: true };
}

/** Borra el proceso con sus mediciones y acciones. Los juegos unidos quedan sin proceso. */
export async function eliminarProceso(procesoId: string): Promise<Resultado> {
  if (!(await requerirProceso(procesoId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('pc_procesos').delete().eq('id', procesoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  revalidatePath('/panel');
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Mediciones
// ----------------------------------------------------------------------------

const MedicionSchema = z.object({
  procesoId: z.string().uuid(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige la fecha de la medición'),
  valor: z.number({ invalid_type_error: 'Escribe el valor medido' }).finite('Escribe el valor medido'),
  nota: z.string().trim().max(300).optional(),
});

export async function registrarMedicion(input: z.infer<typeof MedicionSchema>): Promise<Resultado> {
  const parsed = MedicionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  if (!(await requerirProceso(d.procesoId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('pc_mediciones').insert({ proceso_id: d.procesoId, fecha: d.fecha, valor: d.valor, nota: d.nota || null });
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaProceso(d.procesoId));
  revalidatePath(RUTA);
  return { ok: true };
}

export async function eliminarMedicion(procesoId: string, medicionId: string): Promise<Resultado> {
  if (!(await requerirProceso(procesoId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('pc_mediciones').delete().eq('id', medicionId).eq('proceso_id', procesoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaProceso(procesoId));
  revalidatePath(RUTA);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Plan de acción
// ----------------------------------------------------------------------------

const AccionSchema = z.object({
  procesoId: z.string().uuid(),
  id: z.string().uuid().optional(),
  titulo: z.string().trim().min(1, 'Escribe la acción').max(200),
  detalle: z.string().trim().max(2000).optional(),
  responsable: z.string().trim().max(120).optional(),
  fechaCompromiso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
});

export async function guardarAccion(input: z.infer<typeof AccionSchema>): Promise<Resultado> {
  const parsed = AccionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  if (!(await requerirProceso(d.procesoId))) return { ok: false, error: 'No autorizado' };
  const valores = { titulo: d.titulo, detalle: d.detalle || null, responsable: d.responsable || null, fecha_compromiso: d.fechaCompromiso || null };
  const sb = db();
  const { error } = d.id
    ? await sb.from('pc_acciones').update(valores).eq('id', d.id).eq('proceso_id', d.procesoId)
    : await sb.from('pc_acciones').insert({ ...valores, proceso_id: d.procesoId });
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaProceso(d.procesoId));
  revalidatePath('/panel');
  return { ok: true };
}

export async function cambiarEstadoAccion(procesoId: string, accionId: string, estado: EstadoAccion): Promise<Resultado> {
  if (!(estado in ESTADOS_ACCION)) return { ok: false, error: 'Estado inválido' };
  if (!(await requerirProceso(procesoId))) return { ok: false, error: 'No autorizado' };
  const cerrada = estado === 'hecha' || estado === 'descartada';
  const { error } = await db()
    .from('pc_acciones')
    .update({ estado, cerrada_en: cerrada ? new Date().toISOString() : null })
    .eq('id', accionId)
    .eq('proceso_id', procesoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaProceso(procesoId));
  revalidatePath('/panel');
  return { ok: true };
}

export async function eliminarAccion(procesoId: string, accionId: string): Promise<Resultado> {
  if (!(await requerirProceso(procesoId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('pc_acciones').delete().eq('id', accionId).eq('proceso_id', procesoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaProceso(procesoId));
  revalidatePath('/panel');
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Juegos → proceso
// ----------------------------------------------------------------------------

const TABLA_JUEGO = { makigami: 'mk_retos', kaizen: 'kz_sesiones', cincos: 's5_sesiones', mudalab: 'ml_sesiones', riesgo: 'rr_sesiones' } as const;
type JuegoProceso = keyof typeof TABLA_JUEGO;

async function requerirJuego(juego: JuegoProceso, juegoId: string) {
  const facilitador = await getFacilitador();
  if (!facilitador || !(juego in TABLA_JUEGO)) return null;
  const { data } = await db().from(TABLA_JUEGO[juego]).select('id, creado_por').eq('id', juegoId).maybeSingle();
  return data && puedeAdministrarReto(facilitador, data) ? data : null;
}

/** Une un reto o una carrera a un proceso (o lo suelta con procesoId null). */
export async function vincularJuego(juego: JuegoProceso, juegoId: string, procesoId: string | null): Promise<Resultado> {
  if (!(await requerirJuego(juego, juegoId))) return { ok: false, error: 'No autorizado' };
  if (procesoId && !(await requerirProceso(procesoId))) return { ok: false, error: 'No puedes usar ese proceso' };
  const { error } = await db().from(TABLA_JUEGO[juego]).update({ proceso_id: procesoId }).eq('id', juegoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${juego}/${juegoId}/informe`);
  if (procesoId) revalidatePath(rutaProceso(procesoId));
  return { ok: true };
}

const EnvioSchema = z.object({
  procesoId: z.string().uuid({ message: 'Elige el proceso' }),
  juego: z.enum(['makigami', 'kaizen', 'cincos', 'mudalab', 'riesgo']),
  juegoId: z.string().uuid(),
  items: z
    .array(z.object({ ref: z.string().min(1).max(200), titulo: z.string().trim().min(1).max(200), detalle: z.string().trim().max(2000).optional() }))
    .min(1, 'Elige al menos una opción de mejora')
    .max(50),
});

/**
 * Lleva opciones de mejora de un informe al plan de acción del proceso (y
 * une el juego a ese proceso). Las que ya se habían enviado no se repiten.
 */
export async function enviarAlPlan(input: z.infer<typeof EnvioSchema>) {
  const parsed = EnvioSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  if (!(await requerirJuego(d.juego, d.juegoId))) return { ok: false as const, error: 'No autorizado' };
  if (!(await requerirProceso(d.procesoId))) return { ok: false as const, error: 'No puedes usar ese proceso' };

  const sb = db();
  const refs = d.items.map((i) => `${d.juegoId}:${i.ref}`);
  const { data: existentes } = await sb.from('pc_acciones').select('origen_ref').eq('proceso_id', d.procesoId).in('origen_ref', refs);
  const ya = new Set(((existentes ?? []) as { origen_ref: string }[]).map((e) => e.origen_ref));
  const nuevas = d.items
    .filter((i) => !ya.has(`${d.juegoId}:${i.ref}`))
    .map((i) => ({
      proceso_id: d.procesoId,
      titulo: i.titulo,
      detalle: i.detalle || null,
      origen: d.juego,
      origen_id: d.juegoId,
      origen_ref: `${d.juegoId}:${i.ref}`,
    }));
  if (nuevas.length) {
    const { error } = await sb.from('pc_acciones').insert(nuevas);
    if (error) return { ok: false as const, error: error.message };
  }
  await sb.from(TABLA_JUEGO[d.juego]).update({ proceso_id: d.procesoId }).eq('id', d.juegoId);

  revalidatePath(rutaProceso(d.procesoId));
  revalidatePath(`/${d.juego}/${d.juegoId}/informe`);
  revalidatePath('/panel');
  return { ok: true as const, agregadas: nuevas.length, repetidas: d.items.length - nuevas.length };
}
