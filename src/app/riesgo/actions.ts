'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { generarCodigo, getJugador, guardarCookieJugador, hashToken, nuevoToken } from '@/lib/jugador';
import { EMOJIS_EQUIPO, NombreEquipo, RegistroSchema, filaJugador, type DatosRegistro, type ResultadoRegistro } from '@/lib/juego';
import { RETOS, puntuar } from '@/lib/riesgo';

const RUTA = '/riesgo';
const ruta = (id: string) => `${RUTA}/${id}`;
const ULTIMO = RETOS.length;

type Resultado = { ok: true } | { ok: false; error: string };

interface SesionCtx {
  id: string;
  estado: 'preparacion' | 'jugando' | 'cerrado';
  reto_actual: number;
  creado_por: string | null;
}
const COLS = 'id, estado, reto_actual, creado_por';

async function requerirFacilitador(sesionId: string) {
  const facilitador = await getFacilitador();
  if (!facilitador) return null;
  const { data } = await db().from('rr_sesiones').select(COLS).eq('id', sesionId).maybeSingle();
  if (!data || !puedeAdministrarReto(facilitador, data)) return null;
  return { facilitador, sesion: data as SesionCtx };
}

async function requerirJugador(sesionId: string) {
  const jugador = await getJugador(sesionId, 'riesgo');
  if (!jugador) return null;
  const { data } = await db().from('rr_sesiones').select(COLS).eq('id', sesionId).maybeSingle();
  return data ? { jugador, sesion: data as SesionCtx } : null;
}

// ----------------------------------------------------------------------------
// Sesiones (facilitador)
// ----------------------------------------------------------------------------

const SesionSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es requerido').max(120),
  descripcion: z.string().trim().max(1000).optional(),
  marco: z.enum(['sagrilaft', 'sarlaft', 'ambos']),
  responsable: z.string().trim().min(2, 'Escribe a quién se escala (ej. Oficial de Cumplimiento)').max(120),
  canal: z.string().trim().min(2, 'Escribe por qué canal se escala').max(200),
  umbral: z.number().int().min(50, 'El umbral va de 50 % a 100 %').max(100, 'El umbral va de 50 % a 100 %'),
});
export type DatosSesionRr = z.infer<typeof SesionSchema>;

function filaSesion(d: DatosSesionRr) {
  return { titulo: d.titulo, descripcion: d.descripcion || null, marco: d.marco, responsable: d.responsable, canal: d.canal, umbral: d.umbral };
}

export async function crearSesion(input: DatosSesionRr) {
  const facilitador = await getFacilitador();
  if (!facilitador) return { ok: false as const, error: 'No autorizado' };
  const parsed = SesionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  for (let intento = 0; intento < 5; intento++) {
    const { data, error } = await db()
      .from('rr_sesiones')
      .insert({ ...filaSesion(parsed.data), codigo: generarCodigo(), creado_por: facilitador.id })
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

export async function actualizarSesion(sesionId: string, input: DatosSesionRr): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const parsed = SesionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { error } = await db().from('rr_sesiones').update(filaSesion(parsed.data)).eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function eliminarSesion(sesionId: string): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const sb = db();
  await sb.from('rr_intentos').delete().eq('sesion_id', sesionId);
  await sb.from('rr_jugadores').delete().eq('sesion_id', sesionId);
  const { error } = await sb.from('rr_sesiones').delete().eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  return { ok: true };
}

/** Abre el siguiente reto (1 a 8) o, desde el 8, cierra la sesión. `direccion` -1 regresa. */
export async function moverReto(sesionId: string, direccion: 1 | -1): Promise<Resultado> {
  const ctx = await requerirFacilitador(sesionId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const { sesion } = ctx;
  let cambios: Record<string, unknown>;
  if (direccion === 1) {
    if (sesion.estado === 'cerrado') return { ok: false, error: 'La sesión ya está cerrada.' };
    if (sesion.reto_actual === 0) {
      const { count } = await db().from('rr_equipos').select('id', { count: 'exact', head: true }).eq('sesion_id', sesionId);
      if ((count ?? 0) < 1) return { ok: false, error: 'Crea al menos un equipo (o deja que los jugadores se inscriban) antes de empezar.' };
    }
    cambios = sesion.reto_actual >= ULTIMO ? { estado: 'cerrado', cerrado_en: new Date().toISOString() } : { estado: 'jugando', reto_actual: sesion.reto_actual + 1 };
  } else {
    if (sesion.estado === 'cerrado') cambios = { estado: 'jugando', cerrado_en: null };
    else if (sesion.reto_actual <= 1) cambios = { estado: 'preparacion', reto_actual: 0 };
    else cambios = { reto_actual: sesion.reto_actual - 1 };
  }
  const { error } = await db().from('rr_sesiones').update(cambios).eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

/** Abre de una vez todos los retos (para jugar a su ritmo, por ejemplo en modo individual). */
export async function abrirTodos(sesionId: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(sesionId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const { count } = await db().from('rr_equipos').select('id', { count: 'exact', head: true }).eq('sesion_id', sesionId);
  if ((count ?? 0) < 1) return { ok: false, error: 'Crea al menos un equipo (o deja que los jugadores se inscriban) antes de empezar.' };
  const { error } = await db().from('rr_sesiones').update({ estado: 'jugando', reto_actual: ULTIMO, cerrado_en: null }).eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function cambiarRegistroAbierto(sesionId: string, abierto: boolean): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('rr_sesiones').update({ registro_abierto: abierto }).eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

/** Borra la jugada de un equipo en un reto para que lo repita. */
export async function reiniciarReto(sesionId: string, equipoId: string, reto: number): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('rr_intentos').delete().eq('sesion_id', sesionId).eq('equipo_id', equipoId).eq('reto', reto);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Equipos y jugadores
// ----------------------------------------------------------------------------

async function insertarEquipo(sesionId: string, nombre: string) {
  const sb = db();
  const { data: existentes } = await sb.from('rr_equipos').select('emoji').eq('sesion_id', sesionId);
  const usados = new Set(((existentes ?? []) as { emoji: string }[]).map((e) => e.emoji));
  const emoji = EMOJIS_EQUIPO.find((e) => !usados.has(e)) ?? EMOJIS_EQUIPO[(existentes?.length ?? 0) % EMOJIS_EQUIPO.length]!;
  const { data, error } = await sb.from('rr_equipos').insert({ sesion_id: sesionId, nombre, emoji }).select('id').single();
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
  const { error } = await db().from('rr_equipos').update({ nombre: parsed.data }).eq('id', equipoId).eq('sesion_id', sesionId);
  if (error) return { ok: false, error: error.code === '23505' ? 'Ya existe un equipo con ese nombre.' : error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function eliminarEquipo(sesionId: string, equipoId: string): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const sb = db();
  const { count } = await sb.from('rr_jugadores').select('id', { count: 'exact', head: true }).eq('equipo_id', equipoId);
  if ((count ?? 0) > 0) return { ok: false, error: 'El equipo tiene jugadores. Muévelos o elimínalos primero.' };
  const { error } = await sb.from('rr_equipos').delete().eq('id', equipoId).eq('sesion_id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function moverJugador(sesionId: string, jugadorId: string, equipoId: string): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const sb = db();
  const { data: equipo } = await sb.from('rr_equipos').select('id').eq('id', equipoId).eq('sesion_id', sesionId).maybeSingle();
  if (!equipo) return { ok: false, error: 'Equipo no encontrado' };
  const { error } = await sb.from('rr_jugadores').update({ equipo_id: equipoId, es_lider: false }).eq('id', jugadorId).eq('sesion_id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function eliminarJugador(sesionId: string, jugadorId: string): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('rr_jugadores').delete().eq('id', jugadorId).eq('sesion_id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function registrarJugador(input: DatosRegistro): Promise<ResultadoRegistro> {
  const parsed = RegistroSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  const sb = db();
  const { data: sesion } = await sb.from('rr_sesiones').select('id, estado, registro_abierto').eq('codigo', d.codigo).maybeSingle();
  if (!sesion) return { ok: false, error: 'No encontramos una sesión con ese código.' };
  if (await getJugador(sesion.id, 'riesgo')) return { ok: true, retoId: sesion.id as string };
  if (!sesion.registro_abierto || sesion.estado === 'cerrado') return { ok: false, error: 'La inscripción de esta sesión está cerrada. Pídele a la facilitadora que la abra.' };

  let equipoId = d.equipoId;
  if (!equipoId) {
    const nombre = NombreEquipo.safeParse(d.nuevoEquipo);
    if (!nombre.success) return { ok: false, error: nombre.error.issues[0]?.message ?? 'Nombre de equipo inválido' };
    const r = await insertarEquipo(sesion.id, nombre.data);
    if ('error' in r) return { ok: false, error: r.error! };
    equipoId = r.id;
  } else {
    const { data: equipo } = await sb.from('rr_equipos').select('id').eq('id', equipoId).eq('sesion_id', sesion.id).maybeSingle();
    if (!equipo) return { ok: false, error: 'Ese equipo ya no existe. Recarga la página.' };
  }
  if (d.esLider) {
    const { data: lider } = await sb.from('rr_jugadores').select('nombres, apellidos').eq('equipo_id', equipoId).eq('es_lider', true).maybeSingle();
    if (lider) return { ok: false, error: `Tu equipo ya tiene líder: ${lider.nombres} ${lider.apellidos}.` };
  }
  const token = nuevoToken();
  const { error } = await sb.from('rr_jugadores').insert({ sesion_id: sesion.id, equipo_id: equipoId, ...filaJugador(d), token_hash: hashToken(token) });
  if (error) return { ok: false, error: error.message };
  await guardarCookieJugador(sesion.id, token);
  revalidatePath(ruta(sesion.id));
  return { ok: true, retoId: sesion.id as string };
}

// ----------------------------------------------------------------------------
// Jugar los retos (1 a 8)
// ----------------------------------------------------------------------------

async function requerirRetoAbierto(sesionId: string, reto: number) {
  const ctx = await requerirJugador(sesionId);
  if (!ctx) return { error: 'Inscríbete en la sesión para jugar.' };
  if (ctx.sesion.estado !== 'jugando' || reto > ctx.sesion.reto_actual) return { error: 'Este reto todavía no está abierto.' };
  if (reto < 1 || reto > ULTIMO) return { error: 'Reto inválido' };
  return { ctx };
}

/** Empieza el reto del equipo (arranca el reloj). Si ya empezó, no cambia nada. */
export async function iniciarReto(sesionId: string, reto: number) {
  const r = await requerirRetoAbierto(sesionId, reto);
  if ('error' in r) return { ok: false as const, error: r.error };
  const { jugador } = r.ctx;
  const sb = db();
  const { data: existente } = await sb.from('rr_intentos').select('inicio, fin').eq('equipo_id', jugador.equipo_id).eq('reto', reto).maybeSingle();
  if (existente) return { ok: true as const, inicio: existente.inicio as string, terminado: Boolean(existente.fin) };
  const { data, error } = await sb.from('rr_intentos').insert({ sesion_id: sesionId, equipo_id: jugador.equipo_id, reto, jugador_id: jugador.id }).select('inicio').single();
  if (error) {
    // Otro integrante del equipo lo empezó al mismo tiempo.
    if (error.code === '23505') {
      const { data: otro } = await sb.from('rr_intentos').select('inicio, fin').eq('equipo_id', jugador.equipo_id).eq('reto', reto).maybeSingle();
      return { ok: true as const, inicio: (otro?.inicio as string) ?? new Date().toISOString(), terminado: Boolean(otro?.fin) };
    }
    return { ok: false as const, error: error.message };
  }
  revalidatePath(ruta(sesionId));
  return { ok: true as const, inicio: data.inicio as string, terminado: false };
}

/** Entrega el reto: el servidor calcula los puntos. Una sola entrega por equipo. */
export async function entregarReto(sesionId: string, reto: number, respuestas: unknown) {
  const r = await requerirRetoAbierto(sesionId, reto);
  if ('error' in r) return { ok: false as const, error: r.error };
  const { jugador } = r.ctx;
  const sb = db();
  const { data: intento } = await sb.from('rr_intentos').select('id, fin').eq('equipo_id', jugador.equipo_id).eq('reto', reto).maybeSingle();
  if (!intento) return { ok: false as const, error: 'Primero empiecen el reto.' };
  if (intento.fin) return { ok: false as const, error: 'Su equipo ya entregó este reto.' };

  const res = puntuar(reto, respuestas);
  const { error } = await sb
    .from('rr_intentos')
    .update({ fin: new Date().toISOString(), respuestas: respuestas ?? {}, aciertos: res.aciertos, errores: res.errores, puntos: res.puntos, resumen: res.resumen, jugador_id: jugador.id })
    .eq('id', intento.id)
    .is('fin', null);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true as const, resultado: res };
}
