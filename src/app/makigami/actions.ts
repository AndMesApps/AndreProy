'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { borrarCookieJugador, generarCodigo, getJugador, guardarCookieJugador, hashToken, nuevoToken } from '@/lib/jugador';
import { NombreEquipo, RegistroSchema, filaJugador, type DatosRegistro, type ResultadoRegistro } from '@/lib/juego';
import { ACCIONES_PROPUESTA, EMOJIS_EQUIPO, ESTADOS_RETO, TIPOS_DESPERDICIO, type EstadoReto } from '@/lib/makigami';

const RUTA = '/makigami';

function rutaReto(retoId: string) {
  return `${RUTA}/${retoId}`;
}

type Resultado = { ok: true } | { ok: false; error: string };

/** El Administrador administra cualquier reto; el Líder, solo los que creó. */
async function requerirFacilitador(retoId: string) {
  const facilitador = await getFacilitador();
  if (!facilitador) return null;
  const { data: reto } = await db().from('mk_retos').select('id, titulo, estado, creado_por').eq('id', retoId).maybeSingle();
  if (!reto || !puedeAdministrarReto(facilitador, reto)) return null;
  return { facilitador, reto: reto as { id: string; titulo: string; estado: EstadoReto; creado_por: string | null } };
}

/** El jugador registrado en este navegador para el reto, con el estado del reto. */
async function requerirJugador(retoId: string) {
  const jugador = await getJugador(retoId);
  if (!jugador) return null;
  const { data: reto } = await db().from('mk_retos').select('id, estado').eq('id', retoId).maybeSingle();
  return reto ? { jugador, reto: reto as { id: string; estado: EstadoReto } } : null;
}

// ----------------------------------------------------------------------------
// Retos (facilitador)
// ----------------------------------------------------------------------------

const RetoSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es requerido'),
  descripcion: z.string().trim().optional(),
  inicioProceso: z.string().trim().optional(),
  finProceso: z.string().trim().optional(),
  fechaLimite: z.string().trim().optional(),
});

export async function crearReto(input: z.infer<typeof RetoSchema>) {
  const facilitador = await getFacilitador();
  if (!facilitador) return { ok: false as const, error: 'No autorizado' };

  const parsed = RetoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  // El código es único: si choca con uno existente (muy raro), se intenta otro.
  for (let intento = 0; intento < 5; intento++) {
    const { data, error } = await db()
      .from('mk_retos')
      .insert({
        codigo: generarCodigo(),
        titulo: d.titulo,
        descripcion: d.descripcion || null,
        inicio_proceso: d.inicioProceso || null,
        fin_proceso: d.finProceso || null,
        fecha_limite: d.fechaLimite || null,
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
    .from('mk_retos')
    .update({
      titulo: d.titulo,
      descripcion: d.descripcion || null,
      inicio_proceso: d.inicioProceso || null,
      fin_proceso: d.finProceso || null,
      fecha_limite: d.fechaLimite || null,
    })
    .eq('id', retoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

/** Elimina el reto con todo: mapa, equipos, jugadores, cazas y propuestas. */
export async function eliminarReto(retoId: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  // Los jugadores se borran antes que los equipos (equipo_id es "on delete restrict").
  const sb = db();
  await sb.from('mk_jugadores').delete().eq('reto_id', retoId);
  const { error } = await sb.from('mk_retos').delete().eq('id', retoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  return { ok: true };
}

export async function cambiarEstadoReto(retoId: string, estado: EstadoReto): Promise<Resultado> {
  if (!ESTADOS_RETO.includes(estado)) return { ok: false, error: 'Estado inválido' };
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  if (ctx.reto.estado === estado) return { ok: true };

  const sb = db();
  if (estado !== 'mapeo') {
    const { count } = await sb.from('mk_pasos').select('id', { count: 'exact', head: true }).eq('reto_id', retoId);
    if ((count ?? 0) < 2) return { ok: false, error: 'Dibuja al menos 2 pasos del proceso antes de abrir la cacería.' };
  }

  const { error } = await sb
    .from('mk_retos')
    .update({ estado, cerrado_en: estado === 'cerrado' ? new Date().toISOString() : null })
    .eq('id', retoId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(RUTA);
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

/** Abre o cierra la inscripción de nuevos jugadores y equipos. */
export async function cambiarRegistroAbierto(retoId: string, abierto: boolean): Promise<Resultado> {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('mk_retos').update({ registro_abierto: abierto }).eq('id', retoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Equipos y jugadores
// ----------------------------------------------------------------------------

/** Crea un equipo y le asigna el siguiente emoji libre. Devuelve su id. */
async function insertarEquipo(retoId: string, nombre: string) {
  const sb = db();
  const { data: existentes } = await sb.from('mk_equipos').select('emoji').eq('reto_id', retoId);
  const usados = new Set(((existentes ?? []) as { emoji: string }[]).map((e) => e.emoji));
  const emoji = EMOJIS_EQUIPO.find((e) => !usados.has(e)) ?? EMOJIS_EQUIPO[(existentes?.length ?? 0) % EMOJIS_EQUIPO.length]!;
  const { data, error } = await sb.from('mk_equipos').insert({ reto_id: retoId, nombre, emoji }).select('id').single();
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
  const { error } = await db().from('mk_equipos').update({ nombre: parsed.data }).eq('id', equipoId).eq('reto_id', retoId);
  if (error) return { ok: false, error: error.code === '23505' ? 'Ya existe un equipo con ese nombre.' : error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

/** Solo se pueden eliminar equipos vacíos (para no borrar jugadores por accidente). */
export async function eliminarEquipo(retoId: string, equipoId: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const sb = db();
  const { count } = await sb.from('mk_jugadores').select('id', { count: 'exact', head: true }).eq('equipo_id', equipoId);
  if ((count ?? 0) > 0) return { ok: false, error: 'El equipo tiene jugadores. Muévelos o elimínalos primero.' };
  const { error } = await sb.from('mk_equipos').delete().eq('id', equipoId).eq('reto_id', retoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

export async function moverJugador(retoId: string, jugadorId: string, equipoId: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const sb = db();
  const { data: equipo } = await sb.from('mk_equipos').select('id').eq('id', equipoId).eq('reto_id', retoId).maybeSingle();
  if (!equipo) return { ok: false, error: 'Equipo no encontrado' };
  const { error } = await sb.from('mk_jugadores').update({ equipo_id: equipoId, es_lider: false }).eq('id', jugadorId).eq('reto_id', retoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

/** Elimina a un jugador con sus cazas, propuestas y votos. */
export async function eliminarJugador(retoId: string, jugadorId: string): Promise<Resultado> {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  const { error } = await db().from('mk_jugadores').delete().eq('id', jugadorId).eq('reto_id', retoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

/**
 * Inscribe a un jugador en el reto del código (creando su equipo si es
 * nuevo) y deja su identidad en una cookie de este navegador.
 */
export async function registrarJugador(input: DatosRegistro): Promise<ResultadoRegistro> {
  const parsed = RegistroSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const sb = db();
  const { data: reto } = await sb.from('mk_retos').select('id, estado, registro_abierto').eq('codigo', d.codigo).maybeSingle();
  if (!reto) return { ok: false as const, error: 'No encontramos un reto con ese código.' };

  const yaRegistrado = await getJugador(reto.id);
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
    const { data: equipo } = await sb.from('mk_equipos').select('id').eq('id', equipoId).eq('reto_id', reto.id).maybeSingle();
    if (!equipo) return { ok: false as const, error: 'Ese equipo ya no existe. Recarga la página.' };
  }

  if (d.esLider) {
    const { data: lider } = await sb.from('mk_jugadores').select('nombres, apellidos').eq('equipo_id', equipoId).eq('es_lider', true).maybeSingle();
    if (lider) return { ok: false as const, error: `Tu equipo ya tiene líder: ${lider.nombres} ${lider.apellidos}.` };
  }

  const token = nuevoToken();
  const { error } = await sb.from('mk_jugadores').insert({
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

/** Olvida al jugador en este navegador (sus datos y cazas se conservan). */
export async function salirDelReto(retoId: string): Promise<Resultado> {
  await borrarCookieJugador(retoId);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Mapa: carriles y pasos (facilitador, solo en fase de mapeo)
// ----------------------------------------------------------------------------

async function requerirMapeo(retoId: string): Promise<{ error: string } | { ctx: NonNullable<Awaited<ReturnType<typeof requerirFacilitador>>> }> {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { error: 'No autorizado' };
  if (ctx.reto.estado !== 'mapeo') return { error: 'El mapa solo se edita en la fase de Mapeo. Regresa el reto a Mapeo para cambiarlo.' };
  return { ctx };
}

const CarrilSchema = z.object({
  retoId: z.string().uuid(),
  id: z.string().uuid().optional(),
  nombre: z.string().trim().min(1, 'El nombre del carril es requerido'),
});

export async function guardarCarril(input: z.infer<typeof CarrilSchema>): Promise<Resultado> {
  const parsed = CarrilSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  const r = await requerirMapeo(d.retoId);
  if ('error' in r) return { ok: false, error: r.error };

  const sb = db();
  if (d.id) {
    const { error } = await sb.from('mk_carriles').update({ nombre: d.nombre }).eq('id', d.id).eq('reto_id', d.retoId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data: ultimo } = await sb.from('mk_carriles').select('orden').eq('reto_id', d.retoId).order('orden', { ascending: false }).limit(1).maybeSingle();
    const { error } = await sb.from('mk_carriles').insert({ reto_id: d.retoId, nombre: d.nombre, orden: (ultimo?.orden ?? 0) + 1 });
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(rutaReto(d.retoId));
  return { ok: true };
}

export async function eliminarCarril(retoId: string, carrilId: string): Promise<Resultado> {
  const r = await requerirMapeo(retoId);
  if ('error' in r) return { ok: false, error: r.error };
  const { error } = await db().from('mk_carriles').delete().eq('id', carrilId).eq('reto_id', retoId);
  if (error) return { ok: false, error: error.message };
  await renumerarPasos(retoId);
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

/** Intercambia el orden de un carril con su vecino de arriba (-1) o de abajo (+1). */
export async function moverCarril(retoId: string, carrilId: string, direccion: -1 | 1): Promise<Resultado> {
  const r = await requerirMapeo(retoId);
  if ('error' in r) return { ok: false, error: r.error };
  const sb = db();
  const { data } = await sb.from('mk_carriles').select('id, orden').eq('reto_id', retoId).order('orden');
  const lista = (data ?? []) as { id: string; orden: number }[];
  const i = lista.findIndex((c) => c.id === carrilId);
  const j = i + direccion;
  if (i < 0 || j < 0 || j >= lista.length) return { ok: true };
  [lista[i], lista[j]] = [lista[j]!, lista[i]!];
  await Promise.all(lista.map((c, idx) => sb.from('mk_carriles').update({ orden: idx + 1 }).eq('id', c.id)));
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

/** Deja el orden de los pasos como 1..n sin huecos. */
async function renumerarPasos(retoId: string) {
  const sb = db();
  const { data } = await sb.from('mk_pasos').select('id, orden').eq('reto_id', retoId).order('orden').order('created_at');
  const lista = (data ?? []) as { id: string; orden: number }[];
  await Promise.all(lista.map((p, idx) => (p.orden === idx + 1 ? null : sb.from('mk_pasos').update({ orden: idx + 1 }).eq('id', p.id))));
}

const PasoSchema = z.object({
  retoId: z.string().uuid(),
  id: z.string().uuid().optional(),
  carrilId: z.string().uuid({ message: 'Elige quién hace el paso' }),
  descripcion: z.string().trim().min(1, 'Describe el paso'),
  tiempoTrabajoMin: z.number().min(0),
  tiempoEsperaMin: z.number().min(0),
  documentoSistema: z.string().trim().optional(),
  clasificacion: z.enum(['agrega_valor', 'necesaria', 'desperdicio']).nullable().optional(),
  /** Posición donde insertarlo (1..n+1). Sin valor = al final. */
  posicion: z.number().int().min(1).optional(),
});

export async function guardarPaso(input: z.infer<typeof PasoSchema>): Promise<Resultado> {
  const parsed = PasoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  const r = await requerirMapeo(d.retoId);
  if ('error' in r) return { ok: false, error: r.error };

  const sb = db();
  const { data: carril } = await sb.from('mk_carriles').select('id').eq('id', d.carrilId).eq('reto_id', d.retoId).maybeSingle();
  if (!carril) return { ok: false, error: 'Carril no encontrado' };

  const valores = {
    carril_id: d.carrilId,
    descripcion: d.descripcion,
    tiempo_trabajo_min: d.tiempoTrabajoMin,
    tiempo_espera_min: d.tiempoEsperaMin,
    documento_sistema: d.documentoSistema || null,
    clasificacion: d.clasificacion ?? null,
  };

  if (d.id) {
    const { error } = await sb.from('mk_pasos').update(valores).eq('id', d.id).eq('reto_id', d.retoId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data: existentes } = await sb.from('mk_pasos').select('id, orden').eq('reto_id', d.retoId).order('orden');
    const lista = (existentes ?? []) as { id: string; orden: number }[];
    const posicion = Math.min(d.posicion ?? lista.length + 1, lista.length + 1);
    // Abre el hueco corriendo una posición los pasos que quedan después.
    await Promise.all(lista.filter((p) => p.orden >= posicion).map((p) => sb.from('mk_pasos').update({ orden: p.orden + 1 }).eq('id', p.id)));
    const { error } = await sb.from('mk_pasos').insert({ ...valores, reto_id: d.retoId, orden: posicion });
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(rutaReto(d.retoId));
  return { ok: true };
}

export async function eliminarPaso(retoId: string, pasoId: string): Promise<Resultado> {
  const r = await requerirMapeo(retoId);
  if ('error' in r) return { ok: false, error: r.error };
  const { error } = await db().from('mk_pasos').delete().eq('id', pasoId).eq('reto_id', retoId);
  if (error) return { ok: false, error: error.message };
  await renumerarPasos(retoId);
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

/** Mueve un paso una posición antes (-1) o después (+1) en la secuencia. */
export async function moverPaso(retoId: string, pasoId: string, direccion: -1 | 1): Promise<Resultado> {
  const r = await requerirMapeo(retoId);
  if ('error' in r) return { ok: false, error: r.error };
  const sb = db();
  const { data } = await sb.from('mk_pasos').select('id, orden').eq('reto_id', retoId).order('orden');
  const lista = (data ?? []) as { id: string; orden: number }[];
  const i = lista.findIndex((p) => p.id === pasoId);
  const j = i + direccion;
  if (i < 0 || j < 0 || j >= lista.length) return { ok: true };
  [lista[i], lista[j]] = [lista[j]!, lista[i]!];
  await Promise.all(lista.map((p, idx) => sb.from('mk_pasos').update({ orden: idx + 1 }).eq('id', p.id)));
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Cacería (jugadores, fase de cacería)
// ----------------------------------------------------------------------------

const CazaSchema = z.object({
  retoId: z.string().uuid(),
  pasoId: z.string().uuid(),
  tipo: z.enum(TIPOS_DESPERDICIO as [string, ...string[]]),
  comentario: z.string().trim().max(500).optional(),
});

/** Marca (o desmarca, si ya estaba) un desperdicio en un paso. */
export async function alternarCaza(input: z.infer<typeof CazaSchema>) {
  const parsed = CazaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos' };
  const d = parsed.data;

  const ctx = await requerirJugador(d.retoId);
  if (!ctx) return { ok: false as const, error: 'Regístrate en el reto para poder cazar.' };
  if (ctx.reto.estado !== 'caceria') return { ok: false as const, error: 'La cacería no está abierta.' };
  const jugadorId = ctx.jugador.id;

  const sb = db();
  const { data: paso } = await sb.from('mk_pasos').select('id').eq('id', d.pasoId).eq('reto_id', d.retoId).maybeSingle();
  if (!paso) return { ok: false as const, error: 'Paso no encontrado' };

  const { data: existente } = await sb
    .from('mk_cazas')
    .select('id')
    .eq('paso_id', d.pasoId)
    .eq('jugador_id', jugadorId)
    .eq('tipo_desperdicio', d.tipo)
    .maybeSingle();

  if (existente) {
    const { error } = await sb.from('mk_cazas').delete().eq('id', existente.id);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await sb.from('mk_cazas').insert({
      reto_id: d.retoId,
      paso_id: d.pasoId,
      jugador_id: jugadorId,
      tipo_desperdicio: d.tipo,
      comentario: d.comentario || null,
    });
    if (error) return { ok: false as const, error: error.message };
  }
  revalidatePath(rutaReto(d.retoId));
  return { ok: true as const, marcado: !existente };
}

// ----------------------------------------------------------------------------
// Rediseño: propuestas y votos
// ----------------------------------------------------------------------------

const PropuestaSchema = z.object({
  retoId: z.string().uuid(),
  pasoId: z.string().uuid().optional(),
  accion: z.enum(Object.keys(ACCIONES_PROPUESTA) as [string, ...string[]]),
  descripcion: z.string().trim().min(1, 'Describe tu propuesta').max(1000),
  ahorroEstimadoMin: z.number().min(0),
});

export async function proponerMejora(input: z.infer<typeof PropuestaSchema>): Promise<Resultado> {
  const parsed = PropuestaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const ctx = await requerirJugador(d.retoId);
  if (!ctx) return { ok: false, error: 'Regístrate en el reto para poder proponer.' };
  if (ctx.reto.estado !== 'rediseno') return { ok: false, error: 'Las propuestas se reciben en la fase de Rediseño.' };

  const { error } = await db().from('mk_propuestas').insert({
    reto_id: d.retoId,
    paso_id: d.pasoId || null,
    jugador_id: ctx.jugador.id,
    accion: d.accion,
    descripcion: d.descripcion,
    ahorro_estimado_min: d.ahorroEstimadoMin,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaReto(d.retoId));
  return { ok: true };
}

/** El autor la retira mientras siga en "propuesta" (y en Rediseño); el facilitador, siempre. */
export async function eliminarPropuesta(retoId: string, propuestaId: string): Promise<Resultado> {
  const sb = db();
  const { data: propuesta } = await sb.from('mk_propuestas').select('jugador_id, estado').eq('id', propuestaId).eq('reto_id', retoId).maybeSingle();
  if (!propuesta) return { ok: false, error: 'Propuesta no encontrada' };

  const facilitador = await requerirFacilitador(retoId);
  if (!facilitador) {
    const ctx = await requerirJugador(retoId);
    const esAutor = ctx && ctx.jugador.id === propuesta.jugador_id && propuesta.estado === 'propuesta' && ctx.reto.estado === 'rediseno';
    if (!esAutor) return { ok: false, error: 'No autorizado' };
  }

  const { error } = await sb.from('mk_propuestas').delete().eq('id', propuestaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

export async function alternarVoto(retoId: string, propuestaId: string): Promise<Resultado> {
  const ctx = await requerirJugador(retoId);
  if (!ctx) return { ok: false, error: 'Regístrate en el reto para poder votar.' };
  if (ctx.reto.estado !== 'rediseno') return { ok: false, error: 'La votación está cerrada.' };
  const jugadorId = ctx.jugador.id;

  const sb = db();
  const { data: propuesta } = await sb.from('mk_propuestas').select('jugador_id').eq('id', propuestaId).eq('reto_id', retoId).maybeSingle();
  if (!propuesta) return { ok: false, error: 'Propuesta no encontrada' };
  if (propuesta.jugador_id === jugadorId) return { ok: false, error: 'No puedes votar tu propia propuesta.' };

  const { data: voto } = await sb.from('mk_votos').select('propuesta_id').eq('propuesta_id', propuestaId).eq('jugador_id', jugadorId).maybeSingle();
  const { error } = voto
    ? await sb.from('mk_votos').delete().eq('propuesta_id', propuestaId).eq('jugador_id', jugadorId)
    : await sb.from('mk_votos').insert({ propuesta_id: propuestaId, jugador_id: jugadorId });
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}

/** Aprueba, descarta o devuelve a "propuesta" una mejora (facilitador). */
export async function resolverPropuesta(retoId: string, propuestaId: string, estado: 'propuesta' | 'aprobada' | 'descartada'): Promise<Resultado> {
  const ctx = await requerirFacilitador(retoId);
  if (!ctx) return { ok: false, error: 'No autorizado' };
  if (ctx.reto.estado === 'mapeo') return { ok: false, error: 'El reto todavía está en Mapeo.' };
  if (!['propuesta', 'aprobada', 'descartada'].includes(estado)) return { ok: false, error: 'Estado inválido' };

  const { error } = await db().from('mk_propuestas').update({ estado }).eq('id', propuestaId).eq('reto_id', retoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(rutaReto(retoId));
  return { ok: true };
}
