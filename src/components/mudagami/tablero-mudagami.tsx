'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { guardarLayout } from '@/app/mudagami/actions';
import { Cronometro } from '@/components/kaizen/cronometro';
import { LAYOUT_INICIAL, layoutValido, type Layout } from '@/lib/mudagami';
import { ControlFacilitador } from './control-facilitador';
import { EditorLayout } from './editor-layout';
import { PanelTraslados } from './panel-traslados';
import { PortadaMudaGami } from './iconos';
import { Resultados } from './resultados';
import type { EquipoVista, JugadorVista, LayoutVista, RetoVista, TrasladoVista } from './tipos';

const REFRESCO_MS = 8000;

export function TableroMudaGami({
  reto,
  equipos,
  jugadores,
  layouts,
  traslados,
  miEquipoId,
  esFacilitador,
  ahoraServidor,
}: {
  reto: RetoVista;
  equipos: EquipoVista[];
  jugadores: JugadorVista[];
  layouts: LayoutVista[];
  traslados: TrasladoVista[];
  miEquipoId: string | null;
  esFacilitador: boolean;
  ahoraServidor: number;
}) {
  const router = useRouter();
  const [desfaseMs] = useState(() => ahoraServidor - Date.now());

  const enVivo = reto.estado === 'corrida_1' || reto.estado === 'rediseno' || reto.estado === 'corrida_2';
  useEffect(() => {
    if (!enVivo) return;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, REFRESCO_MS);
    return () => clearInterval(t);
  }, [enVivo, router]);

  const layoutPorEquipo = new Map(layouts.filter((l) => l.corrida === 2).map((l) => [l.equipo_id, l.posiciones]));
  const miEquipo = equipos.find((e) => e.id === miEquipoId) ?? null;

  return (
    <div className="space-y-5">
      {esFacilitador && <ControlFacilitador reto={reto} equipos={equipos} layouts={layoutPorEquipo} traslados={agruparTraslados(traslados)} />}

      {reto.estado === 'espera' && (
        <div className="card overflow-hidden">
          <div className="flex flex-col items-center gap-3 bg-degradado px-6 py-8 text-center text-white sm:flex-row sm:text-left">
            <PortadaMudaGami className="h-28 w-44 shrink-0 rounded-xl" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-acento">Antes de empezar</p>
              <p className="mt-1 text-sm text-white/85">
                Van a producir 15 piezas (triángulos, cuadrados y circunferencias) pasando por 6 estaciones. Cada vez que muevan algo entre estaciones que no
                quedan una al lado de la otra, usarán el montacargas o la carretilla — eso es lo que vamos a medir.
              </p>
            </div>
          </div>
        </div>
      )}

      {!esFacilitador && !miEquipo && reto.estado !== 'espera' && (
        <div className="card p-4 text-sm text-marmol-600">Únete con el código del facilitador para participar en tu equipo.</div>
      )}

      {(reto.estado === 'corrida_1' || reto.estado === 'rediseno' || reto.estado === 'corrida_2') && (
        <div className="rounded-xl border border-marmol-200 bg-white px-4 py-3">
          <Cronometro
            key={reto.cronometroInicio ?? 'parado'}
            inicio={reto.cronometroInicio}
            duracionSeg={reto.estado === 'rediseno' ? reto.duracionRedisenoSeg : reto.duracionCorridaSeg}
            desfaseMs={desfaseMs}
            grande
          />
        </div>
      )}

      {miEquipo && reto.estado === 'corrida_1' && (
        <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] items-start">
          <div className="card p-4">
            <h3 className="mb-2 font-display font-semibold text-secundario">🗺️ Diseño de planta (igual para todos)</h3>
            <EditorLayout layout={LAYOUT_INICIAL} editable={false} />
          </div>
          <PanelTraslados retoId={reto.id} equipoId={miEquipo.id} traslados={traslados.filter((t) => t.equipo_id === miEquipo.id && t.corrida === 1)} puedeRegistrar />
        </div>
      )}

      {miEquipo && reto.estado === 'rediseno' && (
        <EditorLayoutEquipo retoId={reto.id} equipoId={miEquipo.id} layoutGuardado={layoutPorEquipo.get(miEquipo.id) ?? null} />
      )}

      {miEquipo && reto.estado === 'corrida_2' && (
        <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] items-start">
          <div className="card p-4">
            <h3 className="mb-2 font-display font-semibold text-secundario">🗺️ Su diseño de planta</h3>
            <EditorLayout layout={layoutPorEquipo.get(miEquipo.id) ?? LAYOUT_INICIAL} editable={false} />
          </div>
          <PanelTraslados retoId={reto.id} equipoId={miEquipo.id} traslados={traslados.filter((t) => t.equipo_id === miEquipo.id && t.corrida === 2)} puedeRegistrar />
        </div>
      )}

      {reto.estado === 'cerrado' && (
        <Resultados layoutInicial={LAYOUT_INICIAL} equipos={equipos} jugadores={jugadores} layouts={layoutPorEquipo} traslados={traslados} />
      )}
    </div>
  );
}

function EditorLayoutEquipo({ retoId, equipoId, layoutGuardado }: { retoId: string; equipoId: string; layoutGuardado: Layout | null }) {
  const router = useRouter();
  const [layout, setLayout] = useState<Layout>(layoutGuardado ?? LAYOUT_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(Boolean(layoutGuardado));
  const [error, setError] = useState<string | null>(null);

  async function guardar(nuevo: Layout) {
    setLayout(nuevo);
    setGuardado(false);
    if (!layoutValido(nuevo)) return;
    setGuardando(true);
    setError(null);
    const res = await guardarLayout({ retoId, equipoId, posiciones: nuevo });
    setGuardando(false);
    if (!res.ok) return setError(res.error);
    setGuardado(true);
    router.refresh();
  }

  return (
    <div className="card p-4">
      <h3 className="mb-1 font-display font-semibold text-secundario">🔧 Rediseñen su planta</h3>
      <p className="mb-3 text-sm text-marmol-500">Reorganicen las 6 estaciones para que las que van seguidas en el proceso queden lo más cerca posible.</p>
      <EditorLayout layout={layout} editable onChange={guardar} />
      <p className="mt-2 text-xs">
        {guardando ? <span className="text-marmol-400">Guardando…</span> : guardado ? <span className="text-marca-700">✓ Diseño guardado</span> : <span className="text-marmol-400">Sin guardar todavía</span>}
      </p>
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}

function agruparTraslados(traslados: TrasladoVista[]) {
  const m = new Map<string, TrasladoVista[]>();
  for (const t of traslados) {
    const clave = `${t.equipo_id}-${t.corrida}`;
    const lista = m.get(clave);
    if (lista) lista.push(t);
    else m.set(clave, [t]);
  }
  return m;
}
