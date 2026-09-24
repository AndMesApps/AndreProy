'use server';

import { createAuthClient } from '@/lib/supabase/server';
import { resolverFacilitador } from '@/lib/auth';

/** Inicia la sesión de un Administrador o Líder en el servidor (la sesión queda en cookies). */
export async function ingresar(email: string, password: string) {
  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    if (error.message === 'Invalid login credentials') return { ok: false as const, error: 'Correo o contraseña incorrectos.' };
    if (/banned/i.test(error.message)) return { ok: false as const, error: 'Esta cuenta está desactivada. Habla con el administrador.' };
    return { ok: false as const, error: error.message };
  }

  // La clave es correcta, pero la cuenta necesita un rol para administrar retos.
  if (!(await resolverFacilitador(data.user))) {
    await supabase.auth.signOut();
    return {
      ok: false as const,
      error: 'Tu cuenta existe pero todavía no tiene rol de Administrador ni de Líder. Pídele al administrador que te dé acceso en “Usuarios”.',
    };
  }
  return { ok: true as const };
}
