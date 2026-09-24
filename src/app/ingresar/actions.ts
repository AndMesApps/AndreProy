'use server';

import { createAuthClient } from '@/lib/supabase/server';

/** Inicia la sesión del facilitador en el servidor (la sesión queda en cookies). */
export async function ingresar(email: string, password: string) {
  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return { ok: false as const, error: error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error.message };
  return { ok: true as const };
}
