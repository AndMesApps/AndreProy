import 'server-only';
import { createHash, randomBytes, randomInt } from 'crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/supabase/server';

/**
 * Los jugadores no tienen usuario ni contraseña: al registrarse reciben un
 * token aleatorio que queda en una cookie httpOnly (una por reto). En la base
 * solo se guarda el hash del token.
 */
const DURACION_COOKIE_S = 60 * 60 * 24 * 60; // 60 días

function nombreCookie(retoId: string) {
  return `mk_${retoId.replace(/-/g, '')}`;
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function nuevoToken() {
  return randomBytes(32).toString('base64url');
}

// Sin caracteres que se confunden al dictarlos o leerlos en un proyector (0/O, 1/I/L).
const ALFABETO_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Código de 6 caracteres con el que los jugadores se unen a una sesión de juego. */
export function generarCodigo() {
  let c = '';
  for (let i = 0; i < 6; i++) c += ALFABETO_CODIGO[randomInt(ALFABETO_CODIGO.length)];
  return c;
}

export async function guardarCookieJugador(retoId: string, token: string) {
  const store = await cookies();
  store.set(nombreCookie(retoId), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACION_COOKIE_S,
  });
}

export async function borrarCookieJugador(retoId: string) {
  const store = await cookies();
  store.delete(nombreCookie(retoId));
}

export interface JugadorActual {
  id: string;
  reto_id: string;
  equipo_id: string;
  nombres: string;
  apellidos: string;
}

/** Tabla de jugadores de cada juego y la columna que la une a su sesión. */
const TABLAS = {
  makigami: { tabla: 'mk_jugadores', columna: 'reto_id' },
  kaizen: { tabla: 'kz_jugadores', columna: 'sesion_id' },
  cincos: { tabla: 's5_jugadores', columna: 'sesion_id' },
  mudalab: { tabla: 'ml_jugadores', columna: 'sesion_id' },
} as const;
export type Juego = keyof typeof TABLAS;

/**
 * Devuelve el jugador de este navegador en la sesión del juego, o null si no
 * se ha registrado. (`reto_id` es el id de la sesión, sea reto o carrera.)
 */
export async function getJugador(retoId: string, juego: Juego = 'makigami'): Promise<JugadorActual | null> {
  const store = await cookies();
  const token = store.get(nombreCookie(retoId))?.value;
  if (!token) return null;
  const { tabla, columna } = TABLAS[juego];
  const { data } = await db()
    .from(tabla)
    .select(`id, reto_id:${columna}, equipo_id, nombres, apellidos`)
    .eq(columna, retoId)
    .eq('token_hash', hashToken(token))
    .maybeSingle();
  return (data as JugadorActual | null) ?? null;
}

/** Sesiones del juego en las que este navegador tiene un jugador registrado (para "Mis retos"). */
export async function getMisRetosComoJugador(juego: Juego = 'makigami'): Promise<{ reto_id: string; jugador_id: string }[]> {
  const store = await cookies();
  const hashes = store
    .getAll()
    .filter((c) => /^mk_[0-9a-f]{32}$/.test(c.name))
    .map((c) => hashToken(c.value));
  if (hashes.length === 0) return [];
  const { tabla, columna } = TABLAS[juego];
  const { data } = await db().from(tabla).select(`id, reto_id:${columna}`).in('token_hash', hashes);
  return ((data ?? []) as unknown as { id: string; reto_id: string }[]).map((j) => ({ reto_id: j.reto_id, jugador_id: j.id }));
}
