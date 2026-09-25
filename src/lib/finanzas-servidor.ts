import 'server-only';
import { db } from '@/lib/supabase/server';
import { PARAMETROS_DEFECTO, type Parametros } from '@/lib/finanzas';

/** Parámetros financieros del consultor (o los de referencia si aún no los ha guardado). */
export async function parametrosDe(usuarioId: string | null): Promise<{ parametros: Parametros; guardados: boolean }> {
  if (!usuarioId) return { parametros: PARAMETROS_DEFECTO, guardados: false };
  const { data } = await db().from('fn_parametros').select('*').eq('usuario_id', usuarioId).maybeSingle();
  if (!data) return { parametros: PARAMETROS_DEFECTO, guardados: false };
  const n = (v: unknown, d: number) => (v == null ? d : Number(v));
  return {
    guardados: true,
    parametros: {
      anio: n(data.anio, PARAMETROS_DEFECTO.anio),
      smmlv: n(data.smmlv, PARAMETROS_DEFECTO.smmlv),
      uvt: n(data.uvt, PARAMETROS_DEFECTO.uvt),
      ibc_pct: n(data.ibc_pct, 40),
      salud_pct: n(data.salud_pct, 12.5),
      pension_pct: n(data.pension_pct, 16),
      clase_arl: n(data.clase_arl, 1),
      retefuente_pct: n(data.retefuente_pct, 10),
      reteica_por_mil: n(data.reteica_por_mil, 9.66),
      provision_renta_pct: n(data.provision_renta_pct, 8),
      gmf: data.gmf ?? true,
      meta_ingreso_mensual: data.meta_ingreso_mensual == null ? null : Number(data.meta_ingreso_mensual),
      margen_objetivo_pct: n(data.margen_objetivo_pct, 40),
    },
  };
}
