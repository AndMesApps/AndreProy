import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Cliente con la sesión de Supabase Auth del navegador (cookies). Solo se usa
 * para saber qué facilitador inició sesión.
 */
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Desde un Server Component no se pueden escribir cookies; el
          // middleware ya refresca la sesión.
        }
      },
    },
  });
}

/**
 * Cliente con service_role: se salta RLS. Todas las tablas del juego tienen
 * RLS sin políticas, así que SOLO el servidor lee y escribe, siempre después
 * de validar quién llama (facilitador o jugador con su cookie).
 */
export function db() {
  return createSupabaseClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
