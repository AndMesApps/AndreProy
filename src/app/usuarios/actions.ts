'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/supabase/server';
import { correosAdmin, getFacilitador } from '@/lib/auth';
import { buscarCuentaPorCorreo } from '@/lib/usuarios';

const RUTA = '/usuarios';

type Resultado = { ok: true; aviso?: string } | { ok: false; error: string };

/** Solo un Administrador gestiona cuentas. */
async function requerirAdmin() {
  const facilitador = await getFacilitador();
  return facilitador?.rol === 'admin' ? facilitador : null;
}

const Rol = z.enum(['admin', 'lider']);
const Clave = z.string().min(8, 'La clave debe tener al menos 8 caracteres');

const NuevoUsuarioSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  nombre: z.string().trim().min(2, 'Escribe el nombre'),
  rol: Rol,
  clave: z.string().optional(),
});

/**
 * Crea la cuenta (ya confirmada, sin correo de verificación) y le da el rol.
 * Si el correo ya existe en Supabase, solo le asigna el rol y conserva su clave.
 */
export async function crearUsuario(input: z.infer<typeof NuevoUsuarioSchema>): Promise<Resultado> {
  if (!(await requerirAdmin())) return { ok: false, error: 'No autorizado' };
  const parsed = NuevoUsuarioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  if (correosAdmin().includes(d.email)) return { ok: false, error: 'Ese correo ya es administrador principal (está en ADMIN_EMAILS).' };

  const sb = db();
  let id: string;
  let aviso: string | undefined;
  const existente = await buscarCuentaPorCorreo(d.email);
  if (existente) {
    id = existente.id;
    aviso = 'Esa cuenta ya existía: le asignamos el rol y conserva su clave actual.';
  } else {
    const clave = Clave.safeParse(d.clave ?? '');
    if (!clave.success) return { ok: false, error: clave.error.issues[0]?.message ?? 'Clave inválida' };
    const { data, error } = await sb.auth.admin.createUser({ email: d.email, password: clave.data, email_confirm: true });
    if (error || !data.user) return { ok: false, error: error?.message ?? 'No se pudo crear la cuenta' };
    id = data.user.id;
  }

  const { error } = await sb.from('mk_usuarios').upsert({ id, email: d.email, nombre: d.nombre, rol: d.rol, activo: true });
  if (error) return { ok: false, error: error.message };
  await sb.auth.admin.updateUserById(id, { ban_duration: 'none' });
  revalidatePath(RUTA);
  return { ok: true, aviso };
}

const CambiosSchema = z.object({
  nombre: z.string().trim().min(2, 'Escribe el nombre'),
  rol: Rol,
  activo: z.boolean(),
});

/** Cambia nombre, rol o estado. Una cuenta "sin acceso" se registra aquí mismo. */
export async function actualizarUsuario(id: string, input: z.infer<typeof CambiosSchema>): Promise<Resultado> {
  const admin = await requerirAdmin();
  if (!admin) return { ok: false, error: 'No autorizado' };
  const parsed = CambiosSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const sb = db();
  const { data: cuenta } = await sb.auth.admin.getUserById(id);
  const email = cuenta.user?.email?.toLowerCase();
  if (!email) return { ok: false, error: 'Cuenta no encontrada' };
  if (correosAdmin().includes(email)) return { ok: false, error: 'Los administradores principales se cambian en la variable ADMIN_EMAILS de Vercel.' };
  if (id === admin.id && (d.rol !== 'admin' || !d.activo)) return { ok: false, error: 'No puedes quitarte a ti mismo el rol de Administrador.' };

  const { error } = await sb.from('mk_usuarios').upsert({ id, email, nombre: d.nombre, rol: d.rol, activo: d.activo });
  if (error) return { ok: false, error: error.message };
  // Una cuenta desactivada tampoco puede iniciar sesión.
  await sb.auth.admin.updateUserById(id, { ban_duration: d.activo ? 'none' : '876000h' });
  revalidatePath(RUTA);
  return { ok: true };
}

export async function cambiarClave(id: string, clave: string): Promise<Resultado> {
  if (!(await requerirAdmin())) return { ok: false, error: 'No autorizado' };
  const parsed = Clave.safeParse(clave);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Clave inválida' };
  const { error } = await db().auth.admin.updateUserById(id, { password: parsed.data });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
