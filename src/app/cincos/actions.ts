'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { generarCodigo, getJugador, guardarCookieJugador, hashToken, nuevoToken } from '@/lib/jugador';
import { EMOJIS_EQUIPO, NombreEquipo, RegistroSchema, filaJugador, type DatosRegistro, type ResultadoRegistro } from '@/lib/juego';
import { AUDITORIA, ESCENARIOS, HALLAZGOS, RESULTADOS_REALES, puntuar, type ClaveEscenario, type Frecuencia } from '@/lib/cincos';

const RUTA = '/cincos';
const ruta = (id: string) => `${RUTA}/${id}`;

type Resultado = { ok: true } | { ok: false; error: string };

interface SesionCtx {
  id: string;
  estado: 'preparacion' | 'jugando' | 'cerrado';
  mision_actual: number;
  escenario: ClaveEscenario;
  creado_por: string | null;
}
const COLS = 'id, estado, mision_actual, escenario, creado_por';

async function requerirFacilitador(sesionId: string) {
  const facilitador = await getFacilitador();
  if (!facilitador) return null;
  const { data } = await db().from('s5_sesiones').select(COLS).eq('id', sesionId).maybeSingle();
  if (!data || !puedeAdministrarReto(facilitador, data)) return null;
  return { facilitador, sesion: data as SesionCtx };
}

async function requerirJugador(sesionId: string) {
  const jugador = await getJugador(sesionId, 'cincos');
  if (!jugador) return null;
  const { data } = await db().from('s5_sesiones').select(COLS).eq('id', sesionId).maybeSingle();
  return data ? { jugador, sesion: data as SesionCtx } : null;
}

// ----------------------------------------------------------------------------
// Retos (facilitador)
// ----------------------------------------------------------------------------

const SesionSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es requerido').max(120),
  descripcion: z.string().trim().max(1000).optional(),
  escenario: z.enum(['oficina', 'taller']),
});
export type DatosSesion5S = z.infer<typeof SesionSchema>;

export async function crearSesion(input: DatosSesion5S) {
  const facilitador = await getFacilitador();
  if (!facilitador) return { ok: false as const, error: 'No autorizado' };
  const parsed = SesionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  for (let intento = 0; intento < 5; intento++) {
    const { data, error } = await db()
      .from('s5_sesiones')
      .insert({ titulo: parsed.data.titulo, descripcion: parsed.data.descripcion || null, escenario: parsed.data.escenario, codigo: generarCodigo(), creado_por: facilitador.id })
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

export async function actualizarSesion(sesionId: string, input: DatosSesion5S): Promise<Resultado> {
  const ctx = await requerirFacilitador(sesionId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const parsed = SesionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  if (parsed.data.escenario !== ctx.sesion.escenario && ctx.sesion.mision_actual > 0) {
    return { ok: false, error: 'El escenario solo se puede cambiar antes de abrir la primera misión.' };
  }
  const { error } = await db()
    .from('s5_sesiones')
    .update({ titulo: parsed.data.titulo, descripcion: parsed.data.descripcion || null, escenario: parsed.data.escenario })
    .eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function eliminarSesion(sesionId: string): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const sb = db();
  await sb.from('s5_jugadores').delete().eq('sesion_id', sesionId);
  const { error } = await sb.from('s5_sesiones').delete().eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  return { ok: true };
}

/** Abre la siguiente misión (1 a 6) o, desde la 6, cierra el reto. `direccion` -1 regresa. */
export async function moverMision(sesionId: string, direccion: 1 | -1): Promise<Resultado> {
  const ctx = await requerirFacilitador(sesionId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const { sesion } = ctx;
  let cambios: Record<string, unknown>;
  if (direccion === 1) {
    if (sesion.estado === 'cerrado') return { ok: false, error: 'El reto ya está cerrado.' };
    if (sesion.mision_actual === 0) {
      const { count } = await db().from('s5_equipos').select('id', { count: 'exact', head: true }).eq('sesion_id', sesionId);
      if ((count ?? 0) < 1) return { ok: false, error: 'Crea al menos un equipo (o deja que los jugadores se inscriban) antes de empezar.' };
    }
    cambios =
      sesion.mision_actual >= 6
        ? { estado: 'cerrado', cerrado_en: new Date().toISOString() }
        : { estado: 'jugando', mision_actual: sesion.mision_actual + 1 };
  } else {
    if (sesion.estado === 'cerrado') cambios = { estado: 'jugando', cerrado_en: null };
    else if (sesion.mision_actual <= 1) cambios = { estado: 'preparacion', mision_actual: 0 };
    else cambios = { mision_actual: sesion.mision_actual - 1 };
  }
  const { error } = await db().from('s5_sesiones').update(cambios).eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function cambiarRegistroAbierto(sesionId: string, abierto: boolean): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('s5_sesiones').update({ registro_abierto: abierto }).eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

/** Borra la jugada de un equipo en una misión para que la repita. */
export async function reiniciarMision(sesionId: string, equipoId: string, mision: number): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('s5_intentos').delete().eq('sesion_id', sesionId).eq('equipo_id', equipoId).eq('mision', mision);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Equipos y jugadores
// ----------------------------------------------------------------------------

async function insertarEquipo(sesionId: string, nombre: string) {
  const sb = db();
  const { data: existentes } = await sb.from('s5_equipos').select('emoji').eq('sesion_id', sesionId);
  const usados = new Set(((existentes ?? []) as { emoji: string }[]).map((e) => e.emoji));
  const emoji = EMOJIS_EQUIPO.find((e) => !usados.has(e)) ?? EMOJIS_EQUIPO[(existentes?.length ?? 0) % EMOJIS_EQUIPO.length]!;
  const { data, error } = await sb.from('s5_equipos').insert({ sesion_id: sesionId, nombre, emoji }).select('id').single();
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
  const { error } = await db().from('s5_equipos').update({ nombre: parsed.data }).eq('id', equipoId).eq('sesion_id', sesionId);
  if (error) return { ok: false, error: error.code === '23505' ? 'Ya existe un equipo con ese nombre.' : error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function eliminarEquipo(sesionId: string, equipoId: string): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const sb = db();
  const { count } = await sb.from('s5_jugadores').select('id', { count: 'exact', head: true }).eq('equipo_id', equipoId);
  if ((count ?? 0) > 0) return { ok: false, error: 'El equipo tiene jugadores. Muévelos o elimínalos primero.' };
  const { error } = await sb.from('s5_equipos').delete().eq('id', equipoId).eq('sesion_id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function moverJugador(sesionId: string, jugadorId: string, equipoId: string): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const sb = db();
  const { data: equipo } = await sb.from('s5_equipos').select('id').eq('id', equipoId).eq('sesion_id', sesionId).maybeSingle();
  if (!equipo) return { ok: false, error: 'Equipo no encontrado' };
  const { error } = await sb.from('s5_jugadores').update({ equipo_id: equipoId, es_lider: false }).eq('id', jugadorId).eq('sesion_id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function eliminarJugador(sesionId: string, jugadorId: string): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('s5_jugadores').delete().eq('id', jugadorId).eq('sesion_id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

export async function registrarJugador(input: DatosRegistro): Promise<ResultadoRegistro> {
  const parsed = RegistroSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  const sb = db();
  const { data: sesion } = await sb.from('s5_sesiones').select('id, estado, registro_abierto').eq('codigo', d.codigo).maybeSingle();
  if (!sesion) return { ok: false, error: 'No encontramos un reto con ese código.' };
  if (await getJugador(sesion.id, 'cincos')) return { ok: true, retoId: sesion.id as string };
  if (!sesion.registro_abierto || sesion.estado === 'cerrado') return { ok: false, error: 'La inscripción de este reto está cerrada. Pídele a la facilitadora que la abra.' };

  let equipoId = d.equipoId;
  if (!equipoId) {
    const nombre = NombreEquipo.safeParse(d.nuevoEquipo);
    if (!nombre.success) return { ok: false, error: nombre.error.issues[0]?.message ?? 'Nombre de equipo inválido' };
    const r = await insertarEquipo(sesion.id, nombre.data);
    if ('error' in r) return { ok: false, error: r.error! };
    equipoId = r.id;
  } else {
    const { data: equipo } = await sb.from('s5_equipos').select('id').eq('id', equipoId).eq('sesion_id', sesion.id).maybeSingle();
    if (!equipo) return { ok: false, error: 'Ese equipo ya no existe. Recarga la página.' };
  }
  if (d.esLider) {
    const { data: lider } = await sb.from('s5_jugadores').select('nombres, apellidos').eq('equipo_id', equipoId).eq('es_lider', true).maybeSingle();
    if (lider) return { ok: false, error: `Tu equipo ya tiene líder: ${lider.nombres} ${lider.apellidos}.` };
  }
  const token = nuevoToken();
  const { error } = await sb.from('s5_jugadores').insert({ sesion_id: sesion.id, equipo_id: equipoId, ...filaJugador(d), token_hash: hashToken(token) });
  if (error) return { ok: false, error: error.message };
  await guardarCookieJugador(sesion.id, token);
  revalidatePath(ruta(sesion.id));
  return { ok: true, retoId: sesion.id as string };
}

// ----------------------------------------------------------------------------
// Jugar las misiones simuladas
// ----------------------------------------------------------------------------

async function requerirMisionAbierta(sesionId: string, mision: number) {
  const ctx = await requerirJugador(sesionId);
  if (!ctx) return { error: 'Inscríbete en el reto para jugar.' };
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
  const { data: existente } = await sb.from('s5_intentos').select('inicio, fin').eq('equipo_id', jugador.equipo_id).eq('mision', mision).maybeSingle();
  if (existente) return { ok: true as const, inicio: existente.inicio as string, terminado: Boolean(existente.fin) };
  const { data, error } = await sb
    .from('s5_intentos')
    .insert({ sesion_id: sesionId, equipo_id: jugador.equipo_id, mision, jugador_id: jugador.id })
    .select('inicio')
    .single();
  if (error) {
    // Otro integrante del equipo la empezó al mismo tiempo.
    if (error.code === '23505') {
      const { data: otro } = await sb.from('s5_intentos').select('inicio, fin').eq('equipo_id', jugador.equipo_id).eq('mision', mision).maybeSingle();
      return { ok: true as const, inicio: (otro?.inicio as string) ?? new Date().toISOString(), terminado: Boolean(otro?.fin) };
    }
    return { ok: false as const, error: error.message };
  }
  revalidatePath(ruta(sesionId));
  return { ok: true as const, inicio: data.inicio as string, terminado: false };
}

/** Entrega la misión: el servidor calcula el tiempo y los puntos. Una sola entrega por equipo. */
export async function entregarMision(sesionId: string, mision: number, respuestas: unknown) {
  const r = await requerirMisionAbierta(sesionId, mision);
  if ('error' in r) return { ok: false as const, error: r.error };
  const { jugador, sesion } = r.ctx;
  const sb = db();
  const { data: intento } = await sb.from('s5_intentos').select('id, inicio, fin').eq('equipo_id', jugador.equipo_id).eq('mision', mision).maybeSingle();
  if (!intento) return { ok: false as const, error: 'Primero empiecen la misión.' };
  if (intento.fin) return { ok: false as const, error: 'Su equipo ya entregó esta misión.' };

  const esc = ESCENARIOS[sesion.escenario];
  const segundos = (Date.now() - new Date(intento.inicio as string).getTime()) / 1000;
  let ubicacionM2: Record<string, Frecuencia> | undefined;
  if (mision === 5) {
    const { data: m2 } = await sb.from('s5_intentos').select('respuestas').eq('equipo_id', jugador.equipo_id).eq('mision', 2).maybeSingle();
    ubicacionM2 = (m2?.respuestas as { ubicacion?: Record<string, Frecuencia> } | null)?.ubicacion;
  }
  const res = puntuar(mision, esc, respuestas, segundos, ubicacionM2);
  const { error } = await sb
    .from('s5_intentos')
    .update({ fin: new Date().toISOString(), respuestas: respuestas ?? {}, aciertos: res.aciertos, errores: res.errores, puntos: res.puntos, jugador_id: jugador.id })
    .eq('id', intento.id)
    .is('fin', null);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true as const, resultado: res };
}

// ----------------------------------------------------------------------------
// Misión real
// ----------------------------------------------------------------------------

const nota = z.number().int().min(0).max(4);
const texto = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);
const MisionRealSchema = z.object({
  tipo_area: texto(60),
  area: texto(200),
  problema: texto(1500),
  foto_antes: texto(1000),
  foto_despues: texto(1000),
  hallazgos: z.record(z.number().int().min(0).max(100000)),
  acciones: z.record(z.string().trim().max(1000)),
  resultados: z.record(z.number().finite().min(0).max(10000000)),
  auditoria_antes: z.record(nota),
  auditoria_despues: z.record(nota),
});
export type DatosMisionReal = z.input<typeof MisionRealSchema>;

function filtrar<T>(obj: Record<string, T>, claves: string[]) {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => claves.includes(k)));
}

export async function guardarMisionReal(sesionId: string, input: DatosMisionReal, enviar: boolean): Promise<Resultado> {
  const ctx = await requerirJugador(sesionId);
  if (!ctx) return { ok: false, error: 'Inscríbete en el reto para participar.' };
  if (ctx.sesion.estado !== 'jugando' || ctx.sesion.mision_actual < 6) return { ok: false, error: 'La misión real todavía no está abierta.' };
  const parsed = MisionRealSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  const indices = AUDITORIA.map((_, i) => String(i));
  const fila = {
    ...d,
    hallazgos: filtrar(d.hallazgos, HALLAZGOS.map((h) => h.clave)),
    acciones: filtrar(d.acciones, AUDITORIA.map((a) => a.s)),
    resultados: filtrar(d.resultados, RESULTADOS_REALES.map((r) => r.clave)),
    auditoria_antes: filtrar(d.auditoria_antes, indices),
    auditoria_despues: filtrar(d.auditoria_despues, indices),
    updated_at: new Date().toISOString(),
  };
  if (enviar && (!fila.area || Object.keys(fila.auditoria_antes).length < 5 || Object.keys(fila.auditoria_despues).length < 5)) {
    return { ok: false, error: 'Para enviar, escriban el espacio que mejoraron y completen la auditoría antes y después.' };
  }
  const sb = db();
  const { data: actual } = await sb.from('s5_misiones_reales').select('estado').eq('equipo_id', ctx.jugador.equipo_id).maybeSingle();
  if (actual?.estado === 'validada') return { ok: false, error: 'La facilitadora ya validó su misión real.' };
  const estado = enviar ? 'enviada' : (actual?.estado ?? 'borrador');
  const { error } = await sb
    .from('s5_misiones_reales')
    .upsert({ ...fila, sesion_id: sesionId, equipo_id: ctx.jugador.equipo_id, estado }, { onConflict: 'equipo_id' });
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}

/** La facilitadora valida la misión real (o la devuelve para corregir) con un comentario y puntos extra. */
export async function revisarMisionReal(sesionId: string, equipoId: string, estado: 'validada' | 'corregir', comentario: string, puntosBono: number): Promise<Resultado> {
  if (!(await requerirFacilitador(sesionId))) return { ok: false, error: 'No autorizado' };
  const bono = Math.max(0, Math.min(100, Math.round(puntosBono) || 0));
  const { error } = await db()
    .from('s5_misiones_reales')
    .update({ estado, comentario: comentario.trim().slice(0, 1000) || null, puntos_bono: estado === 'validada' ? bono : 0 })
    .eq('sesion_id', sesionId)
    .eq('equipo_id', equipoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(ruta(sesionId));
  return { ok: true };
}
