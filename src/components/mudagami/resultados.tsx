import {
  INSIGNIAS,
  calcularPuntosEquipo,
  calcularTabla1,
  compararCorridas,
  formatearPesos,
  minimoTraslados,
  type EstadisticasEquipo,
  type Layout,
  type Tabla1,
  type TrasladoMinimo,
} from '@/lib/mudagami';
import { cn } from '@/lib/utils';
import { EditorLayout } from './editor-layout';
import type { EquipoVista, JugadorVista, TrasladoVista } from './tipos';

const MEDALLAS = ['🥇', '🥈', '🥉'];

function Barra({ etiqueta, valor, max, clase, sufijo = '' }: { etiqueta: string; valor: number; max: number; clase: string; sufijo?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[11px] font-medium text-marmol-500">{etiqueta}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-marmol-100">
        <div className={`${clase} h-full rounded-full transition-all duration-700 ease-out`} style={{ width: `${max > 0 ? Math.max(2, (valor / max) * 100) : 0}%` }} />
      </div>
      <span className="w-20 shrink-0 text-right text-xs font-semibold text-marmol-700">
        {valor}
        {sufijo}
      </span>
    </div>
  );
}

/**
 * Resultados del reto: por equipo, la Tabla 1 de la corrida 1 vs. la corrida
 * 2 (traslados, tiempo, costo) y su propio diseño de planta; luego el
 * ranking de equipos por cuánto mejoraron y el de jugadores por puntos.
 */
export function Resultados({
  layoutInicial,
  equipos,
  jugadores,
  layouts,
  traslados,
}: {
  layoutInicial: Layout;
  equipos: EquipoVista[];
  jugadores: JugadorVista[];
  layouts: Map<string, Layout>;
  traslados: TrasladoVista[];
}) {
  const porEquipo = equipos.map((e) => {
    const layout2 = layouts.get(e.id) ?? layoutInicial;
    const t1: TrasladoMinimo[] = traslados.filter((t) => t.equipo_id === e.id && t.corrida === 1);
    const t2: TrasladoMinimo[] = traslados.filter((t) => t.equipo_id === e.id && t.corrida === 2);
    const corrida1 = calcularTabla1(t1);
    const corrida2: Tabla1 | null = t2.length > 0 ? calcularTabla1(t2) : null;
    const comparacion = corrida2 ? compararCorridas(corrida1, corrida2) : null;
    const stats: EstadisticasEquipo = {
      corrida1,
      corrida2,
      minimoTeorico2: minimoTraslados(layout2),
      jugadoresConCorrida1: new Set(traslados.filter((t) => t.equipo_id === e.id && t.corrida === 1 && t.jugador_id).map((t) => t.jugador_id!)),
      jugadoresConCorrida2: new Set(traslados.filter((t) => t.equipo_id === e.id && t.corrida === 2 && t.jugador_id).map((t) => t.jugador_id!)),
    };
    return { equipo: e, layout2, corrida1, corrida2, comparacion, stats };
  });

  const rankingEquipos = [...porEquipo].sort((a, b) => (b.comparacion?.reduccionTiempoPct ?? -999) - (a.comparacion?.reduccionTiempoPct ?? -999));

  const filasJugadores = jugadores
    .map((j) => {
      const info = porEquipo.find((p) => p.equipo.id === j.equipo_id);
      const puntos = info ? calcularPuntosEquipo(info.stats, j.id) : 0;
      const insignias = info ? INSIGNIAS.filter((i) => i.logrado(info.stats, j.id)) : [];
      return { jugador: j, equipo: info?.equipo, puntos, insignias };
    })
    .filter((f) => f.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos);

  const maxTiempo = Math.max(1, ...porEquipo.flatMap((p) => [p.corrida1.tiempoMin, p.corrida2?.tiempoMin ?? 0]));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        {porEquipo.map(({ equipo, layout2, corrida1, corrida2, comparacion }) => (
          <div key={equipo.id} className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-secundario">
                {equipo.emoji} {equipo.nombre}
              </h3>
              {comparacion && (
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', comparacion.reduccionTiempoPct >= 0 ? 'bg-marca-100 text-marca-700' : 'bg-red-100 text-bajo')}>
                  {comparacion.reduccionTiempoPct >= 0 ? '−' : '+'}
                  {Math.abs(Math.round(comparacion.reduccionTiempoPct))}% tiempo
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              <Barra etiqueta="C1 tiempo" valor={corrida1.tiempoMin} max={maxTiempo} clase="bg-red-400" sufijo=" min" />
              {corrida2 && <Barra etiqueta="C2 tiempo" valor={corrida2.tiempoMin} max={maxTiempo} clase="bg-marca-500" sufijo=" min" />}
            </div>
            <p className="text-xs text-marmol-500">
              Costo: {formatearPesos(corrida1.costo)} {corrida2 && <>→ <strong className="text-marca-700">{formatearPesos(corrida2.costo)}</strong></>}
            </p>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-marmol-400">Diseño de la corrida 2</p>
              <EditorLayout layout={layout2} mostrarMinimo={false} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-display font-semibold text-secundario">🏆 Equipos que más redujeron el transporte</h2>
          {rankingEquipos.length === 0 ? (
            <p className="text-sm text-marmol-400">Todavía no hay equipos.</p>
          ) : (
            <ol className="space-y-2">
              {rankingEquipos.map((r, i) => (
                <li key={r.equipo.id} className={cn('flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm', i < 3 && 'bg-marmol-50')}>
                  <span className="w-6 text-center">{MEDALLAS[i] ?? <span className="text-xs text-marmol-400">{i + 1}</span>}</span>
                  <span className="text-lg leading-none">{r.equipo.emoji}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-marmol-800">{r.equipo.nombre}</span>
                  <span className="w-20 text-right font-display font-semibold text-marca-700">
                    {r.comparacion ? `-${Math.round(r.comparacion.reduccionTiempoPct)}%` : 'sin C2'}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-display font-semibold text-secundario">🚚 Ranking individual</h2>
          {filasJugadores.length === 0 ? (
            <p className="text-sm text-marmol-400">Nadie ha registrado traslados todavía.</p>
          ) : (
            <ol className="space-y-1.5">
              {filasJugadores.slice(0, 10).map((f, i) => (
                <li key={f.jugador.id} className={cn('flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm', i < 3 && 'bg-marmol-50')}>
                  <span className="w-6 text-center">{MEDALLAS[i] ?? <span className="text-xs text-marmol-400">{i + 1}</span>}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-marmol-800">
                    {f.equipo && (
                      <span className="mr-1" title={f.equipo.nombre}>
                        {f.equipo.emoji}
                      </span>
                    )}
                    {f.jugador.nombre}
                    {f.insignias.map((ins) => (
                      <span key={ins.id} className="ml-1" title={`${ins.nombre}: ${ins.descripcion}`}>
                        {ins.emoji}
                      </span>
                    ))}
                  </span>
                  <span className="w-14 text-right font-display font-semibold text-marca-700">{f.puntos} pts</span>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-4 grid grid-cols-2 gap-1.5 border-t border-marmol-100 pt-3">
            {INSIGNIAS.map((ins) => (
              <div key={ins.id} className="flex items-start gap-1.5 text-[11px] text-marmol-500">
                <span className="text-base leading-none">{ins.emoji}</span>
                <span>
                  <strong className="text-marmol-700">{ins.nombre}</strong> · {ins.descripcion}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
