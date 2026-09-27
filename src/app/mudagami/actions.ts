'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { borrarCookieJugador, generarCodigo, getJugador, guardarCookieJugador, hashToken, nuevoToken } from '@/lib/jugador';
import { NombreEquipo, RegistroSchema, filaJugador, type DatosRegistro, type ResultadoRegistro } from '@/lib/juego';
import { CLAVES_ESTACION, EMOJIS_EQUIPO, ESPACIOS, ESTADOS_RETO, layoutValido, type Espacio, type EstadoReto, type Estacion, type Layout, type MedioTransporte } from '@/lib/mudagami';

const RUTA = '/mudagami';

function rutaReto(retoId: string) {
  return `${RUTA}/${retoId}`;
}

type Resultado = { ok: true } | { ok: false; error: string };

async function requerirFacilitador(retoId: string) {
  const facilitador = await getFacilitador();
  if (!facilitador) return null;
  const { data: reto } = await db().from('mg_retos').select('id, titulo, estado, creado_por').eq('id', retoId).maybeSingle();
  if (!reto || !puedeAdministrarReto(facilitador, reto)) return null;
  return { facilitador, reto: reto as { id: string; titulo: string; estado: EstadoReto; creado_por: string | null } };
}

async function requerirJugador(retoId: string) {
  const jugador = await getJugador(retoId, 'mudagami');
  if (!jugador) return null;
  const { data: reto } = await db().from('mg_retos').select('id, estado').eq('id', retoId).maybeSingle();
  return reto ? { jugador, reto: reto as { id: string; estado: EstadoReto } } : null;
}

// ----------------------------------------------------------------------------
// Retos (facilitador)
// ----------------------------------------------------------------------------

const RetoSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es requerido'),
  descripcion: z.string().trim().optional(),
  fechaLimite: z.string().trim().optional(),
  duracionCorridaSeg: z.number().int().min(60).max(3600).optional(),
  duracionRedisenoSeg: z.number().int().min(60).max(1800).optional(),
});

export async function crearReto(input: z.infer<typeof RetoSchema>) {
  const facilitador = await getFacilitador();
  if (!facilitador) return { ok: false as const, error: 'No autorizado' };

  const parsed = RetoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  for (let intento = 0; intento < 5; intento++) {
    const { data, error } = await db()
      .from('mg_retos')
      .insert({
        codigo: generarCodigo(),
        titulo: d.titulo,
        descripcion: d.descripcion || null,
        fecha_limite: d.fechaLimite || null,
        duracion_corrida_seg: d.duracionCorridaSeg ?? 600,
        duracion_rediseno_seg: d.duracionRedisenoSeg ?? 240,
        creado_por: facilitador.id,
      })
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

export async function actualizarReto(retoId: string, input: z.infer<typeof RetoSchema>): Promise<Resultado> {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };

  const parsed = RetoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const { error } = await db()
    .from('mg_retos')
    .update({
      titulo: d.titulo,
      descripcion: d.descripcion || null,
      fecha_limite: d.fechaLimite || null,
      duracion_corrida_seg: d.duracionCorridaSeg ?? 600,
      duracion_rediseno_seg: d.duracionRedisenoSeg ?? 240,
    })
    .eq('id', retoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

/** Elimina el reto con todo: equipos, jugadores, layouts y traslados. */
export async function eliminarReto(retoId: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const sb = db();
  await sb.from('mg_jugadores').delete().eq('reto_id', retoId);
  const { error } = await sb.from('mg_retos').delete().eq('id', retoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  return { ok: true };
}

/** Mueve el reto a un estado (adelante o atrás); reinicia el cronómetro compartido. */
export async function cambiarEstadoReto(retoId: string, estado: EstadoReto): Promise<Resultado> {
  if (!ESTADOS_RETO.includes(estado)) return { ok: false, error: 'Estado inválido' };
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  if (ctx.reto.estado === estado) return { ok: true };

  if (estado !== 'espera') {
    const { count } = await db().from('mg_equipos').select('id', { count: 'exact', head: true }).eq('reto_id', retoId);
    if ((count ?? 0) < 1) return { ok: false, error: 'Crea al menos un equipo (o deja que los jugadores se inscriban) antes de empezar.' };
  }

  const { error } = await db()
    .from('mg_retos')
    .update({ estado, cronometro_inicio: null, cerrado_en: estado === 'cerrado' ? new Date().toISOString() : null })
    .eq('id', retoId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(RUTA);
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

/** Arranca (o reinicia) el cronómetro de la fase actual; con `detener`, lo apaga. Es el mismo para todos los equipos. */
export async function controlarCronometro(retoId: string, detener = false): Promise<Resultado> {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  if (!['corrida_1', 'rediseno', 'corrida_2'].includes(ctx.reto.estado)) return { ok: false, error: 'El cronómetro se usa en las corridas o el rediseño.' };
  const { error } = await db()
    .from('mg_retos')
    .update({ cronometro_inicio: detener ? null : new Date().toISOString() })
    .eq('id', retoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

export async function cambiarRegistroAbierto(retoId: string, abierto: boolean): Promise<Resultado> {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('mg_retos').update({ registro_abierto: abierto }).eq('id', retoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Equipos y jugadores
// ----------------------------------------------------------------------------

async function insertarEquipo(retoId: string, nombre: string) {
  const sb = db();
  const { data: existentes } = await sb.from('mg_equipos').select('emoji').eq('reto_id', retoId);
  const usados = new Set(((existentes ?? []) as { emoji: string }[]).map((e) => e.emoji));
  const emoji = EMOJIS_EQUIPO.find((e) => !usados.has(e)) ?? EMOJIS_EQUIPO[(existentes?.length ?? 0) % EMOJIS_EQUIPO.length]!;
  const { data, error } = await sb.from('mg_equipos').insert({ reto_id: retoId, nombre, emoji }).select('id').single();
  if (error) {
    if (error.code === '23505') return { error: `Ya existe un equipo llamado «${nombre}». Elígelo de la lista o usa otro nombre.` };
    return { error: error.message };
  }
  return { id: data.id as string };
}

export async function crearEquipo(retoId: string, nombre: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const parsed = NombreEquipo.safeParse(nombre);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Nombre inválido' };
  const r = await insertarEquipo(retoId, parsed.data);
  if ('error' in r) return { ok: false, error: r.error! };
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

export async function renombrarEquipo(retoId: string, equipoId: string, nombre: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const parsed = NombreEquipo.safeParse(nombre);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Nombre inválido' };
  const { error } = await db().from('mg_equipos').update({ nombre: parsed.data }).eq('id', equipoId).eq('reto_id', retoId);
  if (error) return { ok: false, error: error.code === '23505' ? 'Ya existe un equipo con ese nombre.' : error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

export async function eliminarEquipo(retoId: string, equipoId: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const sb = db();
  const { count } = await sb.from('mg_jugadores').select('id', { count: 'exact', head: true }).eq('equipo_id', equipoId);
  if ((count ?? 0) > 0) return { ok: false, error: 'El equipo tiene jugadores. Muévelos o elimínalos primero.' };
  const { error } = await sb.from('mg_equipos').delete().eq('id', equipoId).eq('reto_id', retoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

export async function moverJugador(retoId: string, jugadorId: string, equipoId: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const sb = db();
  const { data: equipo } = await sb.from('mg_equipos').select('id').eq('id', equipoId).eq('reto_id', retoId).maybeSingle();
  if (!equipo) return { ok: false, error: 'Equipo no encontrado' };
  const { error } = await sb.from('mg_jugadores').update({ equipo_id: equipoId, es_lider: false }).eq('id', jugadorId).eq('reto_id', retoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

export async function eliminarJugador(retoId: string, jugadorId: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('mg_jugadores').delete().eq('id', jugadorId).eq('reto_id', retoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

export async function registrarJugador(input: DatosRegistro): Promise<ResultadoRegistro> {
  const parsed = RegistroSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const sb = db();
  const { data: reto } = await sb.from('mg_retos').select('id, estado, registro_abierto').eq('codigo', d.codigo).maybeSingle();
  if (!reto) return { ok: false as const, error: 'No encontramos un reto con ese código.' };

  const yaRegistrado = await getJugador(reto.id, 'mudagami');
  if (yaRegistrado) return { ok: true as const, retoId: reto.id as string };

  if (!reto.registro_abierto || reto.estado === 'cerrado') {
    return { ok: false as const, error: 'La inscripción de este reto está cerrada. Pídele al facilitador que la abra.' };
  }

  let equipoId = d.equipoId;
  if (!equipoId) {
    const nombre = NombreEquipo.safeParse(d.nuevoEquipo);
    if (!nombre.success) return { ok: false as const, error: nombre.error.issues[0]?.message ?? 'Nombre de equipo inválido' };
    const r = await insertarEquipo(reto.id, nombre.data);
    if ('error' in r) return { ok: false as const, error: r.error! };
    equipoId = r.id;
  } else {
    const { data: equipo } = await sb.from('mg_equipos').select('id').eq('id', equipoId).eq('reto_id', reto.id).maybeSingle();
    if (!equipo) return { ok: false as const, error: 'Ese equipo ya no existe. Recarga la página.' };
  }

  if (d.esLider) {
    const { data: lider } = await sb.from('mg_jugadores').select('nombres, apellidos').eq('equipo_id', equipoId).eq('es_lider', true).maybeSingle();
    if (lider) return { ok: false as const, error: `Tu equipo ya tiene líder: ${lider.nombres} ${lider.apellidos}.` };
  }

  const token = nuevoToken();
  const { error } = await sb.from('mg_jugadores').insert({
    reto_id: reto.id,
    equipo_id: equipoId,
    ...filaJugador(d),
    token_hash: hashToken(token),
  });
  if (error) return { ok: false as const, error: error.message };

  await guardarCookieJugador(reto.id, token);
  revalidatePath(rutaReto(reto.id));
  return { ok: true as const, retoId: reto.id as string };
}

export async function salirDelReto(retoId: string): Promise<Resultado> {
  await borrarCookieJugador(retoId);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Diseño de planta (rediseño, por equipo) y traslados (corridas)
// ----------------------------------------------------------------------------

async function equipoDelQueSoy(retoId: string, equipoId: string) {
  const ctxFacilitador = await requerirFacilitador(retoId);
  if (ctxFacilitador) return { autorizado: true, reto: ctxFacilitador.reto };
  const ctxJugador = await requerirJugador(retoId);
  if (ctxJugador && ctxJugador.jugador.equipo_id === equipoId) return { autorizado: true, reto: ctxJugador.reto };
  return { autorizado: false, reto: null };
}

const LayoutSchema = z.object({
  retoId: z.string().uuid(),
  equipoId: z.string().uuid(),
  posiciones: z.record(z.string(), z.string()),
});

/** Guarda el diseño de planta del equipo para la corrida 2 (solo durante el Rediseño). */
export async function guardarLayout(input: z.infer<typeof LayoutSchema>): Promise<Resultado> {
  const parsed = LayoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Datos inválidos' };
  const d = parsed.data;

  const { autorizado, reto } = await equipoDelQueSoy(d.retoId, d.equipoId);
  if (!autorizado || !reto) return { ok: false, error: 'No autorizado' };
  if (reto.estado !== 'rediseno') return { ok: false, error: 'La planta solo se rediseña en la fase de Rediseño.' };

  const posiciones = d.posiciones as Partial<Record<Espacio, Estacion>>;
  const validas = ESPACIOS.every((e) => typeof posiciones[e] === 'string' && CLAVES_ESTACION.includes(posiciones[e] as Estacion));
  if (!validas || !layoutValido(posiciones)) return { ok: false, error: 'El diseño debe usar las 6 estaciones, cada una una sola vez.' };

  const { error } = await db()
    .from('mg_layouts')
    .upsert(
      { reto_id: d.retoId, equipo_id: d.equipoId, corrida: 2, posiciones: posiciones as Layout, updated_at: new Date().toISOString() },
      { onConflict: 'equipo_id,corrida' }
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaReto(d.retoId));
  return { ok: true };
}

const TrasladoSchema = z.object({
  retoId: z.string().uuid(),
  equipoId: z.string().uuid(),
  medio: z.enum(['montacargas', 'carretilla']),
  articulos: z.number().int().min(1).max(3),
});

/** Registra un viaje en el formato de medición de transportes de la corrida activa. */
export async function registrarTraslado(input: z.infer<typeof TrasladoSchema>): Promise<Resultado> {
  const parsed = TrasladoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Datos inválidos' };
  const d = parsed.data;
  if (d.medio === 'carretilla' && d.articulos !== 1) return { ok: false, error: 'La carretilla solo lleva 1 artículo por viaje.' };

  const ctxJugador = await requerirJugador(d.retoId);
  const ctxFacilitador = ctxJugador ? null : await requerirFacilitador(d.retoId);
  if (!ctxJugador && !ctxFacilitador) return { ok: false, error: 'Regístrate en el reto para registrar traslados.' };
  if (ctxJugador && ctxJugador.jugador.equipo_id !== d.equipoId) return { ok: false, error: 'Ese no es tu equipo.' };

  const estado = ctxJugador ? ctxJugador.reto.estado : ctxFacilitador!.reto.estado;
  const corrida = estado === 'corrida_1' ? 1 : estado === 'corrida_2' ? 2 : null;
  if (!corrida) return { ok: false, error: 'Los traslados se registran durante una corrida.' };

  const { error } = await db()
    .from('mg_traslados')
    .insert({ reto_id: d.retoId, equipo_id: d.equipoId, corrida, medio: d.medio as MedioTransporte, articulos: d.articulos, jugador_id: ctxJugador?.jugador.id ?? null });
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaReto(d.retoId));
  return { ok: true };
}

/** Deshace el último traslado del equipo en la corrida activa (por si se registró por error). */
export async function eliminarUltimoTraslado(retoId: string, equipoId: string): Promise<Resultado> {
  const { autorizado, reto } = await equipoDelQueSoy(retoId, equipoId);
  if (!autorizado || !reto) return { ok: false, error: 'No autorizado' };
  const corrida = reto.estado === 'corrida_1' ? 1 : reto.estado === 'corrida_2' ? 2 : null;
  if (!corrida) return { ok: false, error: 'Los traslados se editan durante una corrida.' };

  const sb = db();
  const { data: ultimo } = await sb
    .from('mg_traslados')
    .select('id')
    .eq('reto_id', retoId)
    .eq('equipo_id', equipoId)
    .eq('corrida', corrida)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!ultimo) return { ok: true };
  const { error } = await sb.from('mg_traslados').delete().eq('id', ultimo.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}
