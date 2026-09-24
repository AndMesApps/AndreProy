import 'server-only';
import { db } from '@/lib/supabase/server';
import { correosAdmin, type Rol } from '@/lib/auth';

export interface UsuarioVista {
  id: string;
  email: string;
  nombre: string;
  rol: Rol | null;
  activo: boolean;
  /** Correo de ADMIN_EMAILS: administrador fijo, no se edita desde la app. */
  principal: boolean;
  ultimoIngreso: string | null;
}

/** Todas las cuentas de Supabase Auth (paginadas de a 1000). */
async function cuentasAuth() {
  const cuentas: { id: string; email: string; ultimoIngreso: string | null }[] = [];
  for (let pagina = 1; pagina <= 20; pagina++) {
    const { data, error } = await db().auth.admin.listUsers({ page: pagina, perPage: 1000 });
    if (error) break;
    for (const u of data.users) cuentas.push({ id: u.id, email: (u.email ?? '').toLowerCase(), ultimoIngreso: u.last_sign_in_at ?? null });
    if (data.users.length < 1000) break;
  }
  return cuentas;
}

export async function buscarCuentaPorCorreo(email: string) {
  const correo = email.trim().toLowerCase();
  return (await cuentasAuth()).find((c) => c.email === correo) ?? null;
}

/**
 * Cuentas de Auth con su rol. Una cuenta sin fila en mk_usuarios ni correo en
 * ADMIN_EMAILS aparece con rol null ("sin acceso"): el Administrador puede
 * asignárselo desde /usuarios.
 */
export async function listarUsuarios(): Promise<UsuarioVista[]> {
  const [cuentas, { data: perfiles }] = await Promise.all([cuentasAuth(), db().from('mk_usuarios').select('id, nombre, rol, activo')]);
  const perfilDe = new Map(((perfiles ?? []) as { id: string; nombre: string; rol: Rol; activo: boolean }[]).map((p) => [p.id, p]));
  const admins = correosAdmin();

  const orden: Record<string, number> = { admin: 0, lider: 1, sin: 2 };
  return cuentas
    .map((c) => {
      const perfil = perfilDe.get(c.id);
      const principal = admins.includes(c.email);
      return {
        id: c.id,
        email: c.email,
        nombre: perfil?.nombre ?? '',
        rol: principal ? 'admin' : (perfil?.rol ?? null),
        activo: principal || (perfil?.activo ?? false),
        principal,
        ultimoIngreso: c.ultimoIngreso,
      } satisfies UsuarioVista;
    })
    .sort((a, b) => orden[a.rol ?? 'sin']! - orden[b.rol ?? 'sin']! || (a.nombre || a.email).localeCompare(b.nombre || b.email, 'es'));
}

/** Nombre (o correo) de quien creó cada reto, para la vista del Administrador. */
export async function nombresCreadores(ids: (string | null)[]): Promise<Map<string, string>> {
  const unicos = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const nombres = new Map<string, string>();
  if (!unicos.length) return nombres;

  const { data: perfiles } = await db().from('mk_usuarios').select('id, nombre').in('id', unicos);
  for (const p of (perfiles ?? []) as { id: string; nombre: string }[]) nombres.set(p.id, p.nombre);

  const faltan = unicos.filter((id) => !nombres.has(id));
  await Promise.all(
    faltan.map(async (id) => {
      const { data } = await db().auth.admin.getUserById(id);
      if (data.user?.email) nombres.set(id, data.user.email);
    }),
  );
  return nombres;
}
