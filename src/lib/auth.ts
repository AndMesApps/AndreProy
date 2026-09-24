import 'server-only';
import { createAuthClient, db } from '@/lib/supabase/server';

export type Rol = 'admin' | 'lider';

export const ROLES: Record<Rol, string> = {
  admin: 'Administrador',
  lider: 'Líder',
};

/**
 * Quien administra retos: un Administrador (todo) o un Líder (solo sus retos).
 * Los jugadores no son facilitadores: entran con el código (ver jugador.ts).
 */
export interface Facilitador {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  /** Correo listado en ADMIN_EMAILS: administrador fijo, no se edita desde la app. */
  principal: boolean;
}

export function correosAdmin() {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Rol de un usuario de Supabase Auth. Los correos de ADMIN_EMAILS siempre son
 * administradores; los demás necesitan una fila activa en mk_usuarios. Sin
 * ninguna de las dos cosas, el usuario no tiene acceso de facilitador.
 */
export async function resolverFacilitador(user: { id: string; email?: string | null }): Promise<Facilitador | null> {
  const email = user.email?.toLowerCase();
  if (!email) return null;

  // Si la tabla aún no existe (migración 0002 sin correr), da error → sin perfil.
  const { data: perfil } = await db().from('mk_usuarios').select('nombre, rol, activo').eq('id', user.id).maybeSingle();

  if (correosAdmin().includes(email)) {
    return { id: user.id, email, nombre: perfil?.nombre ?? email, rol: 'admin', principal: true };
  }
  if (!perfil || !perfil.activo) return null;
  return { id: user.id, email, nombre: perfil.nombre, rol: perfil.rol as Rol, principal: false };
}

export async function getFacilitador(): Promise<Facilitador | null> {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? resolverFacilitador(user) : null;
}

/** El Administrador administra cualquier reto; el Líder, solo los que creó. */
export function puedeAdministrarReto(facilitador: Facilitador | null, reto: { creado_por: string | null }) {
  if (!facilitador) return false;
  return facilitador.rol === 'admin' || reto.creado_por === facilitador.id;
}
