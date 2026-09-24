import 'server-only';
import { db } from '@/lib/supabase/server';
import type { Facilitador } from '@/lib/auth';

/** Procesos activos que el facilitador puede usar: el Administrador, todos; el Líder, los suyos. */
export async function procesosDe(facilitador: Facilitador) {
  let consulta = db().from('pc_procesos').select('id, nombre, cliente').eq('activo', true).order('nombre');
  if (facilitador.rol !== 'admin') consulta = consulta.eq('creado_por', facilitador.id);
  const { data } = await consulta;
  return (data ?? []) as { id: string; nombre: string; cliente: string | null }[];
}

/** Recomendaciones de un juego que ya se enviaron al plan del proceso (sin el prefijo del juego). */
export async function refsEnviadas(procesoId: string | null, juegoId: string) {
  if (!procesoId) return [];
  const { data } = await db().from('pc_acciones').select('origen_ref').eq('proceso_id', procesoId).eq('origen_id', juegoId);
  return ((data ?? []) as { origen_ref: string | null }[]).map((a) => (a.origen_ref ?? '').replace(`${juegoId}:`, '')).filter(Boolean);
}
