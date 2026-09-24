import { INSIGNIAS, calcularEstadisticas, calcularPuntos, type EstadisticasCazador } from '@/lib/makigami';
import { cn } from '@/lib/utils';
import type { CazaVista, EquipoVista, JugadorVista, PropuestaVista } from './tipos';

const MEDALLAS = ['🥇', '🥈', '🥉'];

/**
 * Ranking del reto: primero por equipos (suma de los puntos de sus
 * jugadores) y luego individual. Los puntos se calculan en vivo: están en
 * juego mientras el reto siga abierto y quedan finales al cerrarlo.
 */
export function RankingReto({
  cazas,
  propuestas,
  jugadores,
  equipos,
  miJugadorId,
  puntosEntregados,
  enColumnas = false,
}: {
  cazas: CazaVista[];
  propuestas: PropuestaVista[];
  jugadores: JugadorVista[];
  equipos: EquipoVista[];
  miJugadorId: string | null;
  puntosEntregados: boolean;
  /** Pone el ranking de equipos y el individual lado a lado (pantallas anchas). */
  enColumnas?: boolean;
}) {
  const stats = calcularEstadisticas(cazas, propuestas);
  const propuestasVigentes = new Map<string, number>();
  for (const p of propuestas) if (p.estado !== 'descartada') propuestasVigentes.set(p.jugador_id, (propuestasVigentes.get(p.jugador_id) ?? 0) + 1);

  const vacio: EstadisticasCazador = { cazas: 0, pionerosValidados: 0, propuestasAprobadas: 0, ahorroAprobadoMin: 0 };
  const equipoPorId = new Map(equipos.map((e) => [e.id, e]));
  const miEquipoId = jugadores.find((j) => j.id === miJugadorId)?.equipo_id ?? null;

  const filas = jugadores
    .map((j) => {
      const s = stats.get(j.id) ?? vacio;
      return {
        id: j.id,
        nombre: j.nombre,
        equipo: equipoPorId.get(j.equipo_id),
        stats: s,
        puntos: calcularPuntos(s, propuestasVigentes.get(j.id) ?? 0),
        insignias: INSIGNIAS.filter((i) => i.logrado(s)),
      };
    })
    .filter((f) => f.puntos > 0 || f.stats.cazas > 0)
    .sort((a, b) => b.puntos - a.puntos || b.stats.cazas - a.stats.cazas);

  const filasEquipo = equipos
    .map((e) => {
      const deEquipo = filas.filter((f) => f.equipo?.id === e.id);
      return {
        ...e,
        miembros: jugadores.filter((j) => j.equipo_id === e.id).length,
        puntos: deEquipo.reduce((s, f) => s + f.puntos, 0),
        cazas: deEquipo.reduce((s, f) => s + f.stats.cazas, 0),
        validados: deEquipo.reduce((s, f) => s + f.stats.pionerosValidados, 0),
      };
    })
    .sort((a, b) => b.puntos - a.puntos || b.cazas - a.cazas);
  const maxPuntosEquipo = Math.max(1, ...filasEquipo.map((e) => e.puntos));

  return (
    <div className={enColumnas ? 'grid items-start gap-4 md:grid-cols-2' : 'space-y-4'}>
      <div className="card p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display font-semibold text-secundario">🏆 Ranking de equipos</h2>
          <span className="text-[11px] text-marmol-400">{puntosEntregados ? 'Puntos finales' : 'Puntos en juego'}</span>
        </div>
        {filasEquipo.length === 0 ? (
          <p className="text-sm text-marmol-400">Todavía no hay equipos registrados.</p>
        ) : (
          <ol className="space-y-2">
            {filasEquipo.map((e, i) => (
              <li key={e.id} className={cn('rounded-lg px-2 py-1.5', e.id === miEquipoId ? 'bg-marca-50 ring-1 ring-marca-200' : i < 3 && 'bg-marmol-50')}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-center">{MEDALLAS[i] ?? <span className="text-xs text-marmol-400">{i + 1}</span>}</span>
                  <span className="text-lg leading-none">{e.emoji}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-marmol-800">{e.nombre}</span>
                  <span className="text-xs text-marmol-400" title="Jugadores · cazas · hallazgos validados como pionero">
                    👥{e.miembros} · 🎯{e.cazas}
                    {e.validados > 0 && ` · 🦅${e.validados}`}
                  </span>
                  <span className="w-16 text-right font-display font-semibold text-marca-700">{e.puntos} pts</span>
                </div>
                <div className="ml-8 mt-1 h-1.5 overflow-hidden rounded-full bg-marmol-100">
                  <div className="h-full rounded-full bg-degradado transition-all duration-700" style={{ width: `${(e.puntos / maxPuntosEquipo) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-display font-semibold text-secundario">🎯 Mejores cazadores</h2>
        {filas.length === 0 ? (
          <p className="text-sm text-marmol-400">Nadie ha cazado todavía. ¡El primero se lleva el título de pionero!</p>
        ) : (
          <ol className="space-y-1.5">
            {filas.slice(0, 10).map((f, i) => (
              <li
                key={f.id}
                className={cn('flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm', f.id === miJugadorId ? 'bg-marca-50 ring-1 ring-marca-200' : i < 3 && 'bg-marmol-50')}
              >
                <span className="w-6 text-center">{MEDALLAS[i] ?? <span className="text-xs text-marmol-400">{i + 1}</span>}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-marmol-800">
                  {f.equipo && (
                    <span className="mr-1" title={f.equipo.nombre}>
                      {f.equipo.emoji}
                    </span>
                  )}
                  {f.nombre}
                  {f.insignias.map((ins) => (
                    <span key={ins.id} className="ml-1" title={`${ins.nombre}: ${ins.descripcion}`}>
                      {ins.emoji}
                    </span>
                  ))}
                </span>
                <span className="text-xs text-marmol-400" title="Cazas · pionero validado">
                  🎯{f.stats.cazas}
                  {f.stats.pionerosValidados > 0 && ` · 🦅${f.stats.pionerosValidados}`}
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
  );
}
