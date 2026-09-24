import 'server-only';
import { createHash, randomBytes } from 'crypto';
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

/** Devuelve el jugador de este navegador en el reto, o null si no se ha registrado. */
export async function getJugador(retoId: string): Promise<JugadorActual | null> {
  const store = await cookies();
  const token = store.get(nombreCookie(retoId))?.value;
  if (!token) return null;
  const { data } = await db()
    .from('mk_jugadores')
    .select('id, reto_id, equipo_id, nombres, apellidos')
    .eq('reto_id', retoId)
    .eq('token_hash', hashToken(token))
    .maybeSingle();
  return (data as JugadorActual | null) ?? null;
}

/** Retos en los que este navegador tiene un jugador registrado (para "Mis retos"). */
export async function getMisRetosComoJugador(): Promise<{ reto_id: string; jugador_id: string }[]> {
  const store = await cookies();
  const hashes = store
    .getAll()
    .filter((c) => /^mk_[0-9a-f]{32}$/.test(c.name))
    .map((c) => hashToken(c.value));
  if (hashes.length === 0) return [];
  const { data } = await db().from('mk_jugadores').select('id, reto_id').in('token_hash', hashes);
  return ((data ?? []) as { id: string; reto_id: string }[]).map((j) => ({ reto_id: j.reto_id, jugador_id: j.id }));
}
