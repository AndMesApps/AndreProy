'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { guardarParametros } from '@/app/finanzas/actions';
import { PARAMETROS_DEFECTO, TARIFAS_ARL, pesos, type Parametros } from '@/lib/finanzas';
import { leerNumero } from '@/lib/proyectos';
import { Settings } from 'lucide-react';

/** Parámetros financieros del consultor: valores de ley (editables) y metas. */
export function FormularioParametros({ parametros, guardados }: { parametros: Parametros; guardados: boolean }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(!guardados);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const t = (n: number | null) => (n == null ? '' : String(n));
  const [d, setD] = useState({
    anio: t(parametros.anio),
    smmlv: t(parametros.smmlv),
    uvt: t(parametros.uvt),
    ibc_pct: t(parametros.ibc_pct),
    salud_pct: t(parametros.salud_pct),
    pension_pct: t(parametros.pension_pct),
    clase_arl: String(parametros.clase_arl),
    retefuente_pct: t(parametros.retefuente_pct),
    reteica_por_mil: t(parametros.reteica_por_mil),
    provision_renta_pct: t(parametros.provision_renta_pct),
    gmf: parametros.gmf,
    meta_ingreso_mensual: t(parametros.meta_ingreso_mensual),
    margen_objetivo_pct: t(parametros.margen_objetivo_pct),
  });
  const set = (k: keyof typeof d) => (e: { target: { value: string } }) => {
    setOk(false);
    setD((x) => ({ ...x, [k]: e.target.value }));
  };

  function guardar() {
    setError(null);
    const n = (v: string) => leerNumero(v);
    const req = ['anio', 'smmlv', 'uvt', 'ibc_pct', 'salud_pct', 'pension_pct', 'retefuente_pct', 'reteica_por_mil', 'provision_renta_pct', 'margen_objetivo_pct'] as const;
    if (req.some((k) => n(d[k]) == null)) return setError('Revisa los valores: todos deben ser números.');
    startTransition(async () => {
      const res = await guardarParametros({
        anio: Math.round(n(d.anio)!),
        smmlv: n(d.smmlv)!,
        uvt: n(d.uvt)!,
        ibc_pct: n(d.ibc_pct)!,
        salud_pct: n(d.salud_pct)!,
        pension_pct: n(d.pension_pct)!,
        clase_arl: Number(d.clase_arl),
        retefuente_pct: n(d.retefuente_pct)!,
        reteica_por_mil: n(d.reteica_por_mil)!,
        provision_renta_pct: n(d.provision_renta_pct)!,
        gmf: d.gmf,
        meta_ingreso_mensual: d.meta_ingreso_mensual.trim() ? n(d.meta_ingreso_mensual) : null,
        margen_objetivo_pct: n(d.margen_objetivo_pct)!,
      });
      if (!res.ok) return setError(res.error);
      setOk(true);
      router.refresh();
    });
  }

  const campo = (k: keyof typeof d, etiqueta: string, ayuda?: string) => (
    <label className="block text-xs font-medium text-marmol-500">
      {etiqueta}
      <input inputMode="decimal" value={d[k] as string} onChange={set(k)} className="campo mt-1" />
      {ayuda && <span className="mt-0.5 block text-[10px] font-normal text-marmol-400">{ayuda}</span>}
    </label>
  );

  return (
    <section className="card p-4">
      <button type="button" onClick={() => setAbierto((a) => !a)} className="flex w-full items-center gap-2 text-left">
        <Settings size={16} className="text-secundario" />
        <span className="font-display font-semibold text-secundario">Mis parámetros</span>
        <span className="text-xs text-marmol-500">
          salario mínimo {pesos(parametros.smmlv)} · ARL {TARIFAS_ARL[parametros.clase_arl]?.nombre} · margen objetivo {parametros.margen_objetivo_pct} %
        </span>
        <span className="ml-auto text-xs font-semibold text-marca-600">{abierto ? 'Cerrar' : 'Editar'}</span>
      </button>
      {!guardados && (
        <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-medio">
          Estás viendo valores de referencia de {PARAMETROS_DEFECTO.anio}. Confírmalos con tu contador (sobre todo el salario mínimo, la UVT, tu tarifa de retención y el
          reteICA de tu municipio) y guárdalos.
        </p>
      )}
      {abierto && (
        <div className="mt-4 space-y-4">
          <fieldset className="rounded-xl border border-marmol-200 p-3">
            <legend className="px-1 text-sm font-semibold text-marmol-700">📜 Valores de ley</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {campo('anio', 'Año')}
              {campo('smmlv', 'Salario mínimo mensual (COP)', 'Base mínima de cotización.')}
              {campo('uvt', 'UVT (COP)', 'Unidad de valor tributario del año.')}
            </div>
          </fieldset>
          <fieldset className="rounded-xl border border-marmol-200 p-3">
            <legend className="px-1 text-sm font-semibold text-marmol-700">🏥 Seguridad social</legend>
            <div className="grid gap-3 sm:grid-cols-4">
              {campo('ibc_pct', 'Base de cotización (% del ingreso)', 'Para contratistas: 40 %.')}
              {campo('salud_pct', 'Salud (%)', 'Independiente: 12,5 %.')}
              {campo('pension_pct', 'Pensión (%)', 'Independiente: 16 %.')}
              <label className="block text-xs font-medium text-marmol-500">
                Clase de riesgo ARL
                <select value={d.clase_arl} onChange={set('clase_arl')} className="campo mt-1">
                  {Object.entries(TARIFAS_ARL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.nombre} · {v.pct} %
                    </option>
                  ))}
                </select>
                <span className="mt-0.5 block text-[10px] font-normal text-marmol-400">{TARIFAS_ARL[Number(d.clase_arl)]?.ejemplo}</span>
              </label>
            </div>
          </fieldset>
          <fieldset className="rounded-xl border border-marmol-200 p-3">
            <legend className="px-1 text-sm font-semibold text-marmol-700">🧾 Impuestos y deducciones (valores por defecto de tus proyectos)</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {campo('retefuente_pct', 'Retención en la fuente (%)', 'Honorarios: 10 % (no declarante) u 11 % (declarante). Servicios: 4 % o 6 %.')}
              {campo('reteica_por_mil', 'ReteICA (por mil)', 'Depende del municipio y la actividad. Bogotá consultoría ≈ 9,66.')}
              {campo('provision_renta_pct', 'Provisión para impuesto de renta (%)', 'Tu tasa efectiva estimada. Pregúntale a tu contador.')}
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-marmol-700">
              <input type="checkbox" checked={d.gmf} onChange={(e) => setD((x) => ({ ...x, gmf: e.target.checked }))} />
              Descontar el 4x1000 (si tu cuenta no está marcada como exenta)
            </label>
          </fieldset>
          <fieldset className="rounded-xl border border-marmol-200 p-3">
            <legend className="px-1 text-sm font-semibold text-marmol-700">🎯 Mis metas</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {campo('meta_ingreso_mensual', 'Meta de ingreso mensual (COP)', 'Cuánto quieres facturar cada mes. Opcional.')}
              {campo('margen_objetivo_pct', 'Margen objetivo (%)', 'Qué porcentaje de lo que cobras quieres que te quede libre.')}
            </div>
          </fieldset>
          {error && <p className="text-sm text-bajo">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="button" disabled={pending} onClick={guardar} className="boton">
              {pending ? 'Guardando…' : 'Guardar mis parámetros'}
            </button>
            {ok && <span className="text-sm text-alto">✓ Guardados</span>}
          </div>
        </div>
      )}
    </section>
  );
}
