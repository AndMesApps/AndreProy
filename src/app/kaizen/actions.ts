'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { generarCodigo, getJugador, guardarCookieJugador, hashToken, nuevoToken } from '@/lib/jugador';
import { EMOJIS_EQUIPO, NombreEquipo, RegistroSchema, filaJugador, type DatosRegistro, type ResultadoRegistro } from '@/lib/juego';
import { momentoAnterior, momentoSiguiente, type EstadoSesion, type Fase, type Momento } from '@/lib/kaizen';

const RUTA = '/kaizen';

function rutaSesion(sesionId: string) {
  return `${RUTA}/${sesionId}`;
}

type Resultado = { ok: true } | { ok: false; error: string };

interface SesionCtx {
  id: string;
  estado: EstadoSesion;
  ronda_actual: number;
  fase: Fase | null;
  total_rondas: number;
  creado_por: string | null;
}

const COLUMNAS_CTX = 'id, estado, ronda_actual, fase, total_rondas, creado_por';

/** El Administrador administra cualquier carrera; el Líder, solo las que creó. */
async function requerirFacilitador(sesionId: string) {
  const facilitador = await getFacilitador();
  if (!facilitador) return null;
  const { data: sesion } = await db().from('kz_sesiones').select(COLUMNAS_CTX).eq('id', sesionId).maybeSingle();
  if (!sesion || !puedeAdministrarReto(facilitador, sesion)) return null;
  return { facilitador, sesion: sesion as SesionCtx };
}

/** El jugador registrado en este navegador para la carrera, con el momento de la carrera. */
async function requerirJugador(sesionId: string) {
  const jugador = await getJugador(sesionId, 'kaizen');
  if (!jugador) return null;
  const { data: sesion } = await db().from('kz_sesiones').select(COLUMNAS_CTX).eq('id', sesionId).maybeSingle();
  return sesion ? { jugador, sesion: sesion as SesionCtx } : null;
}

// ----------------------------------------------------------------------------
// Carreras (facilitador)
// ----------------------------------------------------------------------------

const SesionSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es requerido').max(120),
  descripcion: z.string().trim().max(1000).optional(),
  producto: z.string().trim().min(1, 'Escribe qué van a producir los equipos').max(120),
  unidad: z.string().trim().min(1, 'Escribe cómo se cuentan (ej. aviones)').max(40),
  criterioCalidad: z.string().trim().max(500).optional(),
  totalRondas: z.number().int().min(2, 'Mínimo 2 rondas').max(10, 'Máximo 10 rondas'),
  duracionRondaSeg: z.number().int().min(30, 'Cada ronda dura al menos 30 segundos').max(3600, 'Cada ronda dura máximo 1 hora'),
});

export type DatosSesion = z.infer<typeof SesionSchema>;

function filaSesion(d: DatosSesion) {
  return {
    titulo: d.titulo,
    descripcion: d.descripcion || null,
    producto: d.producto,
    unidad: d.unidad,
    criterio_calidad: d.criterioCalidad || null,
    total_rondas: d.totalRondas,
    duracion_ronda_seg: d.duracionRondaSeg,
  };
}

export async function crearSesion(input: DatosSesion) {
  const facilitador = await getFacilitador();
  if (!facilitador) return { ok: false as const, error: 'No autorizado' };

  const parsed = SesionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  // El código es único: si choca con uno existente (muy raro), se intenta otro.
  for (let intento = 0; intento < 5; intento++) {
    const { data, error } = await db()
      .from('kz_sesiones')
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

export async function actualizarSesion(sesionId: string, input: DatosSesion): Promise<Resultado> {
  const ctx = await requerirFacilitador(sesionId);
  if (!ctx) return { ok: false, error: 'No autorizado' };

  const parsed = SesionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  if (parsed.data.totalRondas < ctx.sesion.ronda_actual) {
    return { ok: false, error: `Ya van en la ronda ${ctx.sesion.ronda_actual}: no puedes dejar menos rondas que esas.` };
  }

  const { error } = await db().from('kz_sesiones').update(filaSesion(parsed.data)).eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(rutaSesion(sesionId));
  return { ok: true };
}

/** Elimina la carrera con todo: equipos, jugadores, tarjetas y resultados. */
export async function eliminarSesion(sesionId: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(sesionId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  // Los jugadores se borran antes que los equipos (equipo_id es "on delete restrict").
  const sb = db();
  await sb.from('kz_jugadores').delete().eq('sesion_id', sesionId);
  const { error } = await sb.from('kz_sesiones').delete().eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  return { ok: true };
}

async function irA(sesionId: string, m: Momento): Promise<Resultado> {
  const { error } = await db()
    .from('kz_sesiones')
    .update({
      estado: m.estado,
      ronda_actual: m.ronda,
      fase: m.fase,
      cronometro_inicio: null,
      cerrado_en: m.estado === 'cerrado' ? new Date().toISOString() : null,
    })
    .eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(rutaSesion(sesionId));
  return { ok: true };
}

function momentoDe(s: SesionCtx): Momento {
  return { estado: s.estado, ronda: s.ronda_actual, fase: s.fase };
}

/** Pasa a la siguiente fase (o ronda). Desde la última fase de la última ronda, cierra la carrera. */
export async function avanzarFase(sesionId: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(sesionId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  if (ctx.sesion.estado === 'preparacion') {
    const { count } = await db().from('kz_equipos').select('id', { count: 'exact', head: true }).eq('sesion_id', sesionId);
    if ((count ?? 0) < 1) return { ok: false, error: 'Crea al menos un equipo (o deja que los jugadores se inscriban) antes de empezar.' };
  }
  const siguiente = momentoSiguiente(momentoDe(ctx.sesion), ctx.sesion.total_rondas);
  if (!siguiente) return { ok: false, error: 'La carrera ya terminó.' };
  return irA(sesionId, siguiente);
}

/** Regresa a la fase anterior, por si se avanzó por error. No borra lo que ya registraron los equipos. */
export async function retrocederFase(sesionId: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(sesionId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const anterior = momentoAnterior(momentoDe(ctx.sesion), ctx.sesion.total_rondas);
  if (!anterior) return { ok: false, error: 'La carrera no ha empezado.' };
  return irA(sesionId, anterior);
}

/** Arranca (o reinicia) el cronómetro de la fase Hacer; con `detener`, lo apaga. */
export async function controlarCronometro(sesionId: string, detener = false): Promise<Resultado> {
  const ctx = await requerirFacilitador(sesionId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  if (ctx.sesion.fase !== 'hacer') return { ok: false, error: 'El cronómetro se usa en la fase Hacer.' };
  const { error } = await db()
    .from('kz_sesiones')
    .update({ cronometro_inicio: detener ? null : new Date().toISOString() })
    .eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaSesion(sesionId));
  return { ok: true };
}

/** Abre o cierra la inscripción de nuevos jugadores y equipos. */
export async function cambiarRegistroAbierto(sesionId: string, abierto: boolean): Promise<Resultado> {
  const ctx = await requerirFacilitador(sesionId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('kz_sesiones').update({ registro_abierto: abierto }).eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaSesion(sesionId));
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Equipos y jugadores
// ----------------------------------------------------------------------------

/** Crea un equipo y le asigna el siguiente emoji libre. Devuelve su id. */
async function insertarEquipo(sesionId: string, nombre: string) {
  const sb = db();
  const { data: existentes } = await sb.from('kz_equipos').select('emoji').eq('sesion_id', sesionId);
  const usados = new Set(((existentes ?? []) as { emoji: string }[]).map((e) => e.emoji));
  const emoji = EMOJIS_EQUIPO.find((e) => !usados.has(e)) ?? EMOJIS_EQUIPO[(existentes?.length ?? 0) % EMOJIS_EQUIPO.length]!;
  const { data, error } = await sb.from('kz_equipos').insert({ sesion_id: sesionId, nombre, emoji }).select('id').single();
  if (error) {
    if (error.code === '23505') return { error: `Ya existe un equipo llamado «${nombre}». Elígelo de la lista o usa otro nombre.` };
    return { error: error.message };
  }
  return { id: data.id as string };
}

export async function crearEquipo(sesionId: string, nombre: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(sesionId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const parsed = NombreEquipo.safeParse(nombre);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Nombre inválido' };
  const r = await insertarEquipo(sesionId, parsed.data);
  if ('error' in r) return { ok: false, error: r.error! };
  revalidatePath(rutaSesion(sesionId));
  return { ok: true };
}

export async function renombrarEquipo(sesionId: string, equipoId: string, nombre: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(sesionId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const parsed = NombreEquipo.safeParse(nombre);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Nombre inválido' };
  const { error } = await db().from('kz_equipos').update({ nombre: parsed.data }).eq('id', equipoId).eq('sesion_id', sesionId);
  if (error) return { ok: false, error: error.code === '23505' ? 'Ya existe un equipo con ese nombre.' : error.message };
  revalidatePath(rutaSesion(sesionId));
  return { ok: true };
}

/** Solo se pueden eliminar equipos vacíos (para no borrar jugadores por accidente). */
export async function eliminarEquipo(sesionId: string, equipoId: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(sesionId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const sb = db();
  const { count } = await sb.from('kz_jugadores').select('id', { count: 'exact', head: true }).eq('equipo_id', equipoId);
  if ((count ?? 0) > 0) return { ok: false, error: 'El equipo tiene jugadores. Muévelos o elimínalos primero.' };
  const { error } = await sb.from('kz_equipos').delete().eq('id', equipoId).eq('sesion_id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaSesion(sesionId));
  return { ok: true };
}

export async function moverJugador(sesionId: string, jugadorId: string, equipoId: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(sesionId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const sb = db();
  const { data: equipo } = await sb.from('kz_equipos').select('id').eq('id', equipoId).eq('sesion_id', sesionId).maybeSingle();
  if (!equipo) return { ok: false, error: 'Equipo no encontrado' };
  const { error } = await sb.from('kz_jugadores').update({ equipo_id: equipoId, es_lider: false }).eq('id', jugadorId).eq('sesion_id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaSesion(sesionId));
  return { ok: true };
}

/** Elimina a un jugador. Las tarjetas y resultados son del equipo, así que se conservan. */
export async function eliminarJugador(sesionId: string, jugadorId: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(sesionId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('kz_jugadores').delete().eq('id', jugadorId).eq('sesion_id', sesionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaSesion(sesionId));
  return { ok: true };
}

/**
 * Inscribe a un jugador en la carrera del código (creando su equipo si es
 * nuevo) y deja su identidad en una cookie de este navegador.
 */
export async function registrarJugador(input: DatosRegistro): Promise<ResultadoRegistro> {
  const parsed = RegistroSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const sb = db();
  const { data: sesion } = await sb.from('kz_sesiones').select('id, estado, registro_abierto').eq('codigo', d.codigo).maybeSingle();
  if (!sesion) return { ok: false, error: 'No encontramos una carrera con ese código.' };

  const yaRegistrado = await getJugador(sesion.id, 'kaizen');
  if (yaRegistrado) return { ok: true, retoId: sesion.id as string };

  if (!sesion.registro_abierto || sesion.estado === 'cerrado') {
    return { ok: false, error: 'La inscripción de esta carrera está cerrada. Pídele al facilitador que la abra.' };
  }

  let equipoId = d.equipoId;
  if (!equipoId) {
    const nombre = NombreEquipo.safeParse(d.nuevoEquipo);
    if (!nombre.success) return { ok: false, error: nombre.error.issues[0]?.message ?? 'Nombre de equipo inválido' };
    const r = await insertarEquipo(sesion.id, nombre.data);
    if ('error' in r) return { ok: false, error: r.error! };
    equipoId = r.id;
  } else {
    const { data: equipo } = await sb.from('kz_equipos').select('id').eq('id', equipoId).eq('sesion_id', sesion.id).maybeSingle();
    if (!equipo) return { ok: false, error: 'Ese equipo ya no existe. Recarga la página.' };
  }

  if (d.esLider) {
    const { data: lider } = await sb.from('kz_jugadores').select('nombres, apellidos').eq('equipo_id', equipoId).eq('es_lider', true).maybeSingle();
    if (lider) return { ok: false, error: `Tu equipo ya tiene líder: ${lider.nombres} ${lider.apellidos}.` };
  }

  const token = nuevoToken();
  const { error } = await sb.from('kz_jugadores').insert({
    sesion_id: sesion.id,
    equipo_id: equipoId,
    ...filaJugador(d),
    token_hash: hashToken(token),
  });
  if (error) return { ok: false, error: error.message };

  await guardarCookieJugador(sesion.id, token);
  revalidatePath(rutaSesion(sesion.id));
  return { ok: true, retoId: sesion.id as string };
}

// ----------------------------------------------------------------------------
// Juego: tarjeta Kaizen, resultados y decisión
// ----------------------------------------------------------------------------

/**
 * Quién puede escribir por un equipo en una ronda: el facilitador siempre
 * (para corregir), y los jugadores del equipo solo en la ronda en curso y
 * en la fase que corresponde.
 */
async function autorizarEquipo(sesionId: string, equipoId: string, ronda: number, fase: Fase) {
  const fac = await requerirFacilitador(sesionId);
  if (fac) {
    const { data: equipo } = await db().from('kz_equipos').select('id').eq('id', equipoId).eq('sesion_id', sesionId).maybeSingle();
    if (!equipo) return { error: 'Equipo no encontrado' };
    if (ronda < 1 || ronda > fac.sesion.total_rondas) return { error: 'Ronda inválida' };
    return { jugadorId: null as string | null };
  }
  const ctx = await requerirJugador(sesionId);
  if (!ctx) return { error: 'Regístrate en la carrera para jugar.' };
  if (ctx.jugador.equipo_id !== equipoId) return { error: 'Solo puedes registrar lo de tu equipo.' };
  const { sesion } = ctx;
  if (sesion.estado !== 'jugando' || sesion.ronda_actual !== ronda || sesion.fase !== fase) {
    const nombres: Record<Fase, string> = { planear: 'Planear', hacer: 'Hacer', verificar: 'Verificar', actuar: 'Actuar' };
    return { error: `Esto se hace en la fase ${nombres[fase]} de la ronda ${ronda}. Espera a que el facilitador la abra.` };
  }
  return { jugadorId: ctx.jugador.id };
}

const TarjetaSchema = z.object({
  sesionId: z.string().uuid(),
  equipoId: z.string().uuid(),
  ronda: z.number().int().min(2, 'La ronda 1 es la línea base: no lleva tarjeta'),
  problema: z.string().trim().max(500),
  porques: z.array(z.string().trim().max(300)).max(5),
  idea: z.string().trim().max(500),
  prediccion: z.number().int().min(0).max(100000).nullable(),
});

export async function guardarTarjeta(input: z.infer<typeof TarjetaSchema>): Promise<Resultado> {
  const parsed = TarjetaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  const auth = await autorizarEquipo(d.sesionId, d.equipoId, d.ronda, 'planear');
  if ('error' in auth) return { ok: false, error: auth.error! };

  const { error } = await db()
    .from('kz_tarjetas')
    .upsert(
      {
        sesion_id: d.sesionId,
        equipo_id: d.equipoId,
        ronda: d.ronda,
        problema: d.problema,
        porques: d.porques,
        idea: d.idea,
        prediccion: d.prediccion,
        editado_por: auth.jugadorId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'equipo_id,ronda' },
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaSesion(d.sesionId));
  return { ok: true };
}

const ResultadoSchema = z.object({
  sesionId: z.string().uuid(),
  equipoId: z.string().uuid(),
  ronda: z.number().int().min(1),
  unidadesBuenas: z.number().int('Usa números enteros').min(0, 'No puede ser negativo').max(100000),
  defectos: z.number().int('Usa números enteros').min(0, 'No puede ser negativo').max(100000),
});

export async function guardarResultado(input: z.infer<typeof ResultadoSchema>): Promise<Resultado> {
  const parsed = ResultadoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  const auth = await autorizarEquipo(d.sesionId, d.equipoId, d.ronda, 'verificar');
  if ('error' in auth) return { ok: false, error: auth.error! };

  const { error } = await db()
    .from('kz_resultados')
    .upsert(
      {
        sesion_id: d.sesionId,
        equipo_id: d.equipoId,
        ronda: d.ronda,
        unidades_buenas: d.unidadesBuenas,
        defectos: d.defectos,
        registrado_por: auth.jugadorId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'equipo_id,ronda' },
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaSesion(d.sesionId));
  return { ok: true };
}

/** Fase Actuar: la idea de la ronda se vuelve estándar o se descarta (null = sin decidir). */
export async function decidirTarjeta(sesionId: string, equipoId: string, ronda: number, decision: 'estandar' | 'descartada' | null): Promise<Resultado> {
  if (decision !== null && decision !== 'estandar' && decision !== 'descartada') return { ok: false, error: 'Decisión inválida' };
  const auth = await autorizarEquipo(sesionId, equipoId, ronda, 'actuar');
  if ('error' in auth) return { ok: false, error: auth.error! };

  const sb = db();
  const { data: tarjeta } = await sb.from('kz_tarjetas').select('id').eq('equipo_id', equipoId).eq('ronda', ronda).maybeSingle();
  if (!tarjeta) return { ok: false, error: 'Este equipo no llenó tarjeta Kaizen en esta ronda: no hay idea que decidir.' };
  const { error } = await sb.from('kz_tarjetas').update({ decision }).eq('id', tarjeta.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaSesion(sesionId));
  return { ok: true };
}
