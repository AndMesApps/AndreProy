import { createBrowserClient } from '@supabase/ssr';

/** Cliente de navegador: solo para iniciar/cerrar sesión del facilitador. */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
