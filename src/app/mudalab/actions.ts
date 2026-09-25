'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { generarCodigo, getJugador, guardarCookieJugador, hashToken, nuevoToken } from '@/lib/jugador';
import { EMOJIS_EQUIPO, NombreEquipo, RegistroSchema, filaJugador, type DatosRegistro, type ResultadoRegistro } from '@/lib/juego';
import { CLAVES_MUDA, puntuar, type ClaveMuda, type ResumenMl } from '@/lib/mudalab';

const RUTA = '/mudalab';
const ruta = (id: string) => `${RUTA}/${id}`;

type Resultado = { ok: true } | { ok: false; error: string };

interface SesionCtx {
  id: string;
  estado: 'preparacion' | 'jugando' | 'cerrado';
  mision_actual: number;
  creado_por: string | null;
}
const COLS = 'id, estado, mision_actual, creado_por';

async function requerirFacilitador(sesionId: string) {
  const facilitador = await getFacilitador();
  if (!facilitador) return null;
  const { data } = await db().from('ml_sesiones').select(COLS).eq('id', sesionId).maybeSingle();
  if (!data || !puedeAdministrarReto(facilitador, data)) return null;
  return { facilitador, sesion: data as SesionCtx };
}

async function requerirJugador(sesionId: string) {
  const jugador = await getJugador(sesionId, 'mudalab');
  if (!jugador) return null;
  const { data } = await db().from('ml_sesiones').select(COLS).eq('id', sesionId).maybeSingle();
  return data ? { jugador, sesion: data as SesionCtx } : null;
}

// ----------------------------------------------------------------------------
// Casos (facilitador)
// ----------------------------------------------------------------------------

const SesionSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es requerido').max(120),
  descripcion: z.string().trim().max(1000).optional(),
});
export type DatosSesionMl = z.infer<typeof SesionSchema>;

export async function crearSesion(input: DatosSesionMl) {
  const facilitador = await getFacilitador();
  if (!facilitador) return { ok: false as const, error: 'No autorizado' };
  const parsed = SesionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  for (let intento = 0; intento < 5; intento++) {
    const { data, error } = await db()
      .from('ml_sesiones')
      .insert({ titulo: parsed.data.titulo, descripcion: parsed.data.descripcion || null, codigo: generarCodigo(), creado_por: facilitador.id })
      .select('id')
      .single();
    if (!error) {
      revalidatePath(RUTA);
      return { ok: true as const, id: data.id as string };
    }
    if (error.code !== '23505') return { ok: false as const, error: error.message };
  }
  return { ok: false as const, error: 'No se pudo generar un código único. Intenta de nuevo.' };
}

export async function actualizarSesion(sesionId: string, input: DatosSesionMl): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const parsed = SesionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { error } = await db().from('ml_sesiones').update({ titulo: parsed.data.titulo, descripcion: parsed.data.descripcion || null }).eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function eliminarSesion(sesionId: string): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const sb = db();
  await sb.from('ml_oportunidades').delete().eq('sesion_id', sesionId);
  await sb.from('ml_intentos').delete().eq('sesion_id', sesionId);
  await sb.from('ml_jugadores').delete().eq('sesion_id', sesionId);
  const { error } = await sb.from('ml_sesiones').delete().eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  return { ok: true };
}

/** Abre la siguiente misión (1 a 5, y 6 = Mi proceso) o, desde la 6, cierra el caso. `direccion` -1 regresa. */
export async function moverMision(sesionId: string, direccion: 1 | -1): Promise<Resultado> {
  const ctx = await requerirFacilitador(sesionId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const { sesion } = ctx;
  let cambios: Record<string, unknown>;
  if (direccion === 1) {
    if (sesion.estado === 'cerrado') return { ok: false, error: 'El caso ya está cerrado.' };
    if (sesion.mision_actual === 0) {
      const { count } = await db().from('ml_equipos').select('id', { count: 'exact', head: true }).eq('sesion_id', sesionId);
      if ((count ?? 0) < 1) return { ok: false, error: 'Crea al menos un equipo (o deja que los jugadores se inscriban) antes de empezar.' };
    }
    cambios = sesion.mision_actual >= 6 ? { estado: 'cerrado', cerrado_en: new Date().toISOString() } : { estado: 'jugando', mision_actual: sesion.mision_actual + 1 };
  } else {
    if (sesion.estado === 'cerrado') cambios = { estado: 'jugando', cerrado_en: null };
    else if (sesion.mision_actual <= 1) cambios = { estado: 'preparacion', mision_actual: 0 };
    else cambios = { mision_actual: sesion.mision_actual - 1 };
  }
  const { error } = await db().from('ml_sesiones').update(cambios).eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function cambiarRegistroAbierto(sesionId: string, abierto: boolean): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('ml_sesiones').update({ registro_abierto: abierto }).eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

/** Borra la jugada de un equipo en una misión para que la repita. */
export async function reiniciarMision(sesionId: string, equipoId: string, mision: number): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('ml_intentos').delete().eq('sesion_id', sesionId).eq('equipo_id', equipoId).eq('mision', mision);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Equipos y jugadores
// ----------------------------------------------------------------------------

async function insertarEquipo(sesionId: string, nombre: string) {
  const sb = db();
  const { data: existentes } = await sb.from('ml_equipos').select('emoji').eq('sesion_id', sesionId);
  const usados = new Set(((existentes ?? []) as { emoji: string }[]).map((e) => e.emoji));
  const emoji = EMOJIS_EQUIPO.find((e) => !usados.has(e)) ?? EMOJIS_EQUIPO[(existentes?.length ?? 0) % EMOJIS_EQUIPO.length]!;
  const { data, error } = await sb.from('ml_equipos').insert({ sesion_id: sesionId, nombre, emoji }).select('id').single();
  if (error) return { error: error.code === '23505' ? `Ya existe un equipo llamado «${nombre}». Elígelo de la lista o usa otro nombre.` : error.message };
  return { id: data.id as string };
}

export async function crearEquipo(sesionId: string, nombre: string): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const parsed = NombreEquipo.safeParse(nombre);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Nombre inválido' };
  const r = await insertarEquipo(sesionId, parsed.data);
  if ('error' in r) return { ok: false, error: r.error! };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function renombrarEquipo(sesionId: string, equipoId: string, nombre: string): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const parsed = NombreEquipo.safeParse(nombre);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Nombre inválido' };
  const { error } = await db().from('ml_equipos').update({ nombre: parsed.data }).eq('id', equipoId).eq('sesion_id', sesionId);
  if (error) return { ok: false, error: error.code === '23505' ? 'Ya existe un equipo con ese nombre.' : error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function eliminarEquipo(sesionId: string, equipoId: string): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const sb = db();
  const { count } = await sb.from('ml_jugadores').select('id', { count: 'exact', head: true }).eq('equipo_id', equipoId);
  if ((count ?? 0) > 0) return { ok: false, error: 'El equipo tiene jugadores. Muévelos o elimínalos primero.' };
  const { error } = await sb.from('ml_equipos').delete().eq('id', equipoId).eq('sesion_id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function moverJugador(sesionId: string, jugadorId: string, equipoId: string): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const sb = db();
  const { data: equipo } = await sb.from('ml_equipos').select('id').eq('id', equipoId).eq('sesion_id', sesionId).maybeSingle();
  if (!equipo) return { ok: false, error: 'Equipo no encontrado' };
  const { error } = await sb.from('ml_jugadores').update({ equipo_id: equipoId, es_lider: false }).eq('id', jugadorId).eq('sesion_id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function eliminarJugador(sesionId: string, jugadorId: string): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('ml_jugadores').delete().eq('id', jugadorId).eq('sesion_id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function registrarJugador(input: DatosRegistro): Promise<ResultadoRegistro> {
  const parsed = RegistroSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  const sb = db();
  const { data: sesion } = await sb.from('ml_sesiones').select('id, estado, registro_abierto').eq('codigo', d.codigo).maybeSingle();
  if (!sesion) return { ok: false, error: 'No encontramos un caso con ese código.' };
  if (await getJugador(sesion.id, 'mudalab')) return { ok: true, retoId: sesion.id as string };
  if (!sesion.registro_abierto || sesion.estado === 'cerrado') return { ok: false, error: 'La inscripción de este caso está cerrada. Pídele a la facilitadora que la abra.' };

  let equipoId = d.equipoId;
  if (!equipoId) {
    const nombre = NombreEquipo.safeParse(d.nuevoEquipo);
    if (!nombre.success) return { ok: false, error: nombre.error.issues[0]?.message ?? 'Nombre de equipo inválido' };
    const r = await insertarEquipo(sesion.id, nombre.data);
    if ('error' in r) return { ok: false, error: r.error! };
    equipoId = r.id;
  } else {
    const { data: equipo } = await sb.from('ml_equipos').select('id').eq('id', equipoId).eq('sesion_id', sesion.id).maybeSingle();
    if (!equipo) return { ok: false, error: 'Ese equipo ya no existe. Recarga la página.' };
  }
  if (d.esLider) {
    const { data: lider } = await sb.from('ml_jugadores').select('nombres, apellidos').eq('equipo_id', equipoId).eq('es_lider', true).maybeSingle();
    if (lider) return { ok: false, error: `Tu equipo ya tiene líder: ${lider.nombres} ${lider.apellidos}.` };
  }
  const token = nuevoToken();
  const { error } = await sb.from('ml_jugadores').insert({ sesion_id: sesion.id, equipo_id: equipoId, ...filaJugador(d), token_hash: hashToken(token) });
  if (error) return { ok: false, error: error.message };
  await guardarCookieJugador(sesion.id, token);
  revalidatePath(ruta(sesion.id));
  return { ok: true, retoId: sesion.id as string };
}

// ----------------------------------------------------------------------------
// Jugar las misiones (1 a 5)
// ----------------------------------------------------------------------------

async function requerirMisionAbierta(sesionId: string, mision: number) {
  const ctx = await requerirJugador(sesionId);
  if (!ctx) return { error: 'Inscríbete en el caso para jugar.' };
  if (ctx.sesion.estado !== 'jugando' || mision > ctx.sesion.mision_actual) return { error: 'Esta misión todavía no está abierta.' };
  if (mision < 1 || mision > 5) return { error: 'Misión inválida' };
  return { ctx };
}

/** Empieza la misión del equipo (arranca el reloj). Si ya empezó, no cambia nada. */
export async function iniciarMision(sesionId: string, mision: number) {
  const r = await requerirMisionAbierta(sesionId, mision);
  if ('error' in r) return { ok: false as const, error: r.error };
  const { jugador } = r.ctx;
  const sb = db();
  const { data: existente } = await sb.from('ml_intentos').select('inicio, fin').eq('equipo_id', jugador.equipo_id).eq('mision', mision).maybeSingle();
  if (existente) return { ok: true as const, inicio: existente.inicio as string, terminado: Boolean(existente.fin) };
  const { data, error } = await sb.from('ml_intentos').insert({ sesion_id: sesionId, equipo_id: jugador.equipo_id, mision, jugador_id: jugador.id }).select('inicio').single();
  if (error) {
    // Otro integrante del equipo la empezó al mismo tiempo.
    if (error.code === '23505') {
      const { data: otro } = await sb.from('ml_intentos').select('inicio, fin').eq('equipo_id', jugador.equipo_id).eq('mision', mision).maybeSingle();
      return { ok: true as const, inicio: (otro?.inicio as string) ?? new Date().toISOString(), terminado: Boolean(otro?.fin) };
    }
    return { ok: false as const, error: error.message };
  }
  revalidatePath(ruta(sesionId));
  return { ok: true as const, inicio: data.inicio as string, terminado: false };
}

/** Entrega la misión: el servidor calcula los puntos. Una sola entrega por equipo. */
export async function entregarMision(sesionId: string, mision: number, respuestas: unknown) {
  const r = await requerirMisionAbierta(sesionId, mision);
  if ('error' in r) return { ok: false as const, error: r.error };
  const { jugador } = r.ctx;
  const sb = db();
  const { data: intento } = await sb.from('ml_intentos').select('id, fin').eq('equipo_id', jugador.equipo_id).eq('mision', mision).maybeSingle();
  if (!intento) return { ok: false as const, error: 'Primero empiecen la misión.' };
  if (intento.fin) return { ok: false as const, error: 'Su equipo ya entregó esta misión.' };

  // La misión 5 usa el plan que el equipo entregó en la 4.
  let plan: string[] = [];
  let dias: number | null = null;
  if (mision === 5) {
    const { data: m4 } = await sb.from('ml_intentos').select('resumen').eq('equipo_id', jugador.equipo_id).eq('mision', 4).maybeSingle();
    const res4 = (m4?.resumen ?? {}) as ResumenMl;
    plan = res4.valido ? (res4.plan ?? []) : [];
    dias = res4.valido ? (res4.dias ?? null) : null;
  }
  const res = puntuar(mision, respuestas, plan, dias);
  const { error } = await sb
    .from('ml_intentos')
    .update({ fin: new Date().toISOString(), respuestas: respuestas ?? {}, aciertos: res.aciertos, errores: res.errores, puntos: res.puntos, resumen: res.resumen, jugador_id: jugador.id })
    .eq('id', intento.id)
    .is('fin', null);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true as const, resultado: res };
}

// ----------------------------------------------------------------------------
// Mundo 2 — Banco de oportunidades
// ----------------------------------------------------------------------------

const texto = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

const OportunidadSchema = z.object({
  proceso: z.string().trim().min(2, 'Escribe el proceso o la tarea').max(150),
  problema: z.string().trim().min(5, 'Cuenta el problema en una frase').max(500),
  muda: z.enum(CLAVES_MUDA as [ClaveMuda, ...ClaveMuda[]], { errorMap: () => ({ message: 'Elige el tipo de Muda' }) }),
  evidencia: texto(1000),
  causa: texto(1000),
  idea: texto(1000),
  estado: z.enum(['idea', 'probando', 'implementada']),
  resultado: texto(1000),
  minutos_semana: z.number().finite().min(0).max(100000).nullable().optional(),
});
export type DatosOportunidad = z.input<typeof OportunidadSchema>;

export async function guardarOportunidad(sesionId: string, oportunidadId: string | null, input: DatosOportunidad): Promise<Resultado> {
  const ctx = await requerirJugador(sesionId);
  if (!ctx) return { ok: false, error: 'Inscríbete en el caso para participar.' };
  if (ctx.sesion.mision_actual < 6) return { ok: false, error: 'El Mundo 2 todavía no está abierto.' };
  const parsed = OportunidadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const fila = { ...parsed.data, minutos_semana: parsed.data.minutos_semana ?? null };
  const sb = db();
  if (oportunidadId) {
    const { error } = await sb.from('ml_oportunidades').update(fila).eq('id', oportunidadId).eq('sesion_id', sesionId).eq('equipo_id', ctx.jugador.equipo_id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { count } = await sb.from('ml_oportunidades').select('id', { count: 'exact', head: true }).eq('sesion_id', sesionId).eq('jugador_id', ctx.jugador.id);
    if ((count ?? 0) >= 10) return { ok: false, error: 'Ya registraste 10 oportunidades. ¡Gracias! Deja espacio para las de tus compañeros.' };
    const { error } = await sb.from('ml_oportunidades').insert({ ...fila, sesion_id: sesionId, equipo_id: ctx.jugador.equipo_id, jugador_id: ctx.jugador.id });
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

/** Borra una oportunidad: la puede borrar su equipo o la facilitadora. */
export async function eliminarOportunidad(sesionId: string, oportunidadId: string): Promise<Resultado> {
  const sb = db();
  let consulta = sb.from('ml_oportunidades').delete().eq('id', oportunidadId).eq('sesion_id', sesionId);
  if (!(await requerirFacilitador(sesionId))) {
    const ctx = await requerirJugador(sesionId);
    if (!ctx) return { ok: false, error: 'No autorizado' };
    consulta = consulta.eq('equipo_id', ctx.jugador.equipo_id);
  }
  const { error } = await consulta;
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

/** 👍 a la oportunidad de otro equipo (tocar otra vez quita el voto). */
export async function votarOportunidad(sesionId: string, oportunidadId: string): Promise<Resultado> {
  const ctx = await requerirJugador(sesionId);
  if (!ctx) return { ok: false, error: 'Inscríbete en el caso para votar.' };
  const sb = db();
  const { data: op } = await sb.from('ml_oportunidades').select('id, equipo_id, votos').eq('id', oportunidadId).eq('sesion_id', sesionId).maybeSingle();
  if (!op) return { ok: false, error: 'Esa oportunidad ya no existe.' };
  if (op.equipo_id === ctx.jugador.equipo_id) return { ok: false, error: 'Solo se votan las oportunidades de otros equipos.' };
  const votos = new Set((op.votos ?? []) as string[]);
  if (votos.has(ctx.jugador.id)) votos.delete(ctx.jugador.id);
  else votos.add(ctx.jugador.id);
  const { error } = await sb.from('ml_oportunidades').update({ votos: [...votos] }).eq('id', oportunidadId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}
