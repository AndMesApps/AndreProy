import 'server-only';
import { createAuthClient } from '@/lib/supabase/server';

export interface Facilitador {
  id: string;
  email: string;
}

function correosAdmin() {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * El facilitador es un usuario de Supabase Auth cuyo correo está en
 * ADMIN_EMAILS. Cualquier otra sesión se ignora.
 */
export async function getFacilitador(): Promise<Facilitador | null> {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  if (!user || !email || !correosAdmin().includes(email)) return null;
  return { id: user.id, email };
}
