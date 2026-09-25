'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/supabase/server';
import { getFacilitador } from '@/lib/auth';

const num = (min: number, max: number) => z.number().finite().min(min).max(max);

const ParametrosSchema = z.object({
  anio: z.number().int().min(2024).max(2100),
  smmlv: num(100000, 100000000),
  uvt: num(1000, 10000000),
  ibc_pct: num(1, 100),
  salud_pct: num(0, 100),
  pension_pct: num(0, 100),
  clase_arl: z.number().int().min(1).max(5),
  retefuente_pct: num(0, 100),
  reteica_por_mil: num(0, 100),
  provision_renta_pct: num(0, 100),
  gmf: z.boolean(),
  meta_ingreso_mensual: num(0, 10000000000).nullable(),
  margen_objetivo_pct: num(0, 95),
});

export type DatosParametros = z.infer<typeof ParametrosSchema>;

/** Guarda los parámetros financieros de quien inició sesión. */
export async function guardarParametros(input: DatosParametros) {
  const yo = await getFacilitador();
  if (!yo) return { ok: false as const, error: 'No autorizado' };
  const parsed = ParametrosSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { error } = await db()
    .from('fn_parametros')
    .upsert({ usuario_id: yo.id, ...parsed.data, updated_at: new Date().toISOString() });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/finanzas');
  revalidatePath('/proyectos', 'layout');
  return { ok: true as const };
}
