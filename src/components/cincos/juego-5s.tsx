'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { entregarMision, iniciarMision, moverMision, reiniciarMision } from '@/app/cincos/actions';
import {
  ESCENARIOS,
  MISIONES,
  formatearTiempo,
  marcador5S,
  puntuar,
  rolDe,
  type ClaveEscenario,
  type Frecuencia,
  type IntentoMinimo,
  type Resultado5S,
} from '@/lib/cincos';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { M1Clasificar, M2Ordenar, M3Limpiar, M4Estandarizar, M5Sostener, Reloj } from './misiones';
import { FormularioMisionReal, RevisionMisionReal, type MisionRealVista } from './mision-real';

export interface Sesion5SVista {
  id: string;
  titulo: string;
  escenario: ClaveEscenario;
  estado: 'preparacion' | 'jugando' | 'cerrado';
  mision_actual: number;
}

export interface Equipo5SVista {
  id: string;
  nombre: string;
  emoji: string;
  miembros: { id: string; nombre: string }[];
}

export type Intento5SVista = IntentoMinimo & { respuestas: unknown };

const REFRESCO_MS = 6000;
const MEDALLAS = ['🥇', '🥈', '🥉'];

export function Juego5S({
  sesion,
  equipos,
  intentos,
  reales,
  miEquipoId,
  esFacilitador,
}: {
  sesion: Sesion5SVista;
  equipos: Equipo5SVista[];
  intentos: Intento5SVista[];
  reales: Record<string, MisionRealVista>;
  miEquipoId: string | null;
  esFacilitador: boolean;
}) {
  const router = useRouter();
  const esc = ESCENARIOS[sesion.escenario];
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmarCierre, setConfirmarCierre] = useState(false);

  useEffect(() => {
    if (sesion.estado === 'cerrado') return;
    const t = setInterval(() => document.visibilityState === 'visible' && router.refresh(), REFRESCO_MS);
    const alVolver = () => document.visibilityState === 'visible' && router.refresh();
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [sesion.estado, router]);

  const marcadores = useMemo(() => equipos.map((e) => ({ e, m: marcador5S(e.id, intentos, reales[e.id]) })).sort((a, b) => b.m.total - a.m.total), [equipos, intentos, reales]);
  const miEquipo = equipos.find((e) => e.id === miEquipoId);

  const ejecutar = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? 'Error');
      router.refresh();
    });
  };

  const siguiente = sesion.mision_actual >= 6 ? null : MISIONES[sesion.mision_actual];

  return (
    <div className="space-y-5">
      {/* Camino de misiones */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {MISIONES.map((m) => {
          const abierta = sesion.estado !== 'preparacion' && m.numero <= sesion.mision_actual;
          const hecha = miEquipoId ? (m.numero <= 5 ? intentos.some((i) => i.equipo_id === miEquipoId && i.mision === m.numero && i.fin) : reales[miEquipoId]?.estado && reales[miEquipoId]!.estado !== 'borrador') : false;
          const cuantos = m.numero <= 5 ? intentos.filter((i) => i.mision === m.numero && i.fin).length : Object.values(reales).filter((r) => r.estado !== 'borrador').length;
          return (
            <div
              key={m.numero}
              className={cn(
                'rounded-xl border p-2 text-center',
                !abierta ? 'border-marmol-200 bg-marmol-100/60 opacity-60' : hecha ? 'border-marca-300 bg-marca-50' : m.numero === sesion.mision_actual ? 'border-acento bg-amber-50' : 'border-marmol-200 bg-white',
              )}
            >
              <p className="text-2xl">{abierta ? m.emoji : '🔒'}</p>
              <p className="text-[11px] font-bold text-secundario">
                {m.numero <= 5 ? `Misión ${m.numero}` : 'Misión real'}
                {hecha ? ' ✓' : ''}
              </p>
              <p className="text-[10px] text-marmol-500">{m.numero <= 5 ? m.s : '🚀'}</p>
              {esFacilitador && abierta && (
                <p className="mt-0.5 text-[10px] font-semibold text-marca-700">
                  {cuantos}/{equipos.length} equipos
                </p>
              )}
            </div>
          );
        })}
      </div>

      {sesion.estado === 'preparacion' && (
        <div className="card p-5 text-center">
          <p className="text-3xl">🧹</p>
          <p className="font-display text-xl font-semibold text-secundario">Preparando el reto</p>
          <p className="mx-auto mt-1 max-w-xl text-sm text-marmol-600">
            {esFacilitador
              ? 'Comparte el código o el QR. Cuando los equipos estén listos, abre la misión 1.'
              : `Escenario: ${esc.emoji} ${esc.nombre}. ${esc.descripcion} Espera a que la facilitadora abra la misión 1.`}
          </p>
        </div>
      )}

      {sesion.estado === 'cerrado' && (
        <div className="rounded-2xl bg-degradado p-5 text-center text-white shadow">
          <p className="text-3xl">🏆</p>
          <p className="font-display text-2xl font-bold">¡Reto 5S terminado!</p>
          <p className="text-sm text-white/85">Del caos al flujo. Lo importante empieza ahora: sostenerlo cada día.</p>
        </div>
      )}

      {/* Mando de la facilitadora */}
      {esFacilitador && (
        <section className="card space-y-3 p-4">
          <p className="font-display font-semibold text-secundario">🎛️ Mando de la facilitadora</p>
          <div className="flex flex-wrap items-center gap-2">
            {(sesion.estado !== 'preparacion' || sesion.mision_actual > 0) && (
              <button type="button" disabled={pending} onClick={() => ejecutar(() => moverMision(sesion.id, -1))} className="boton-secundario px-3 py-2 text-xs">
                <ChevronLeft size={14} /> Atrás
              </button>
            )}
            {sesion.estado !== 'cerrado' &&
              (siguiente ? (
                <button type="button" disabled={pending} onClick={() => ejecutar(() => moverMision(sesion.id, 1))} className="boton">
                  Abrir {siguiente.numero <= 5 ? `misión ${siguiente.numero}: ${siguiente.emoji} ${siguiente.s}` : '🚀 la misión real'} <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => (confirmarCierre ? ejecutar(() => moverMision(sesion.id, 1)) : setConfirmarCierre(true))}
                  className={cn('boton', confirmarCierre && 'bg-bajo hover:bg-red-800')}
                >
                  {confirmarCierre ? '¿Seguro? Toca otra vez para cerrar' : '🏁 Cerrar el reto y ver resultados'}
                </button>
              ))}
          </div>
          <p className="text-[11px] text-marmol-500">Las misiones abiertas quedan disponibles: cada equipo avanza a su ritmo. Un celular por equipo juega; los demás aportan desde su rol.</p>
          {error && <p className="text-sm text-bajo">{error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-xs">
              <thead className="text-center text-marmol-400">
                <tr>
                  <th className="py-1 text-left font-medium">Equipo</th>
                  {MISIONES.slice(0, 5).map((m) => (
                    <th key={m.numero} className="font-medium">
                      {m.emoji} {m.numero}
                    </th>
                  ))}
                  <th className="font-medium">🚀 Real</th>
                </tr>
              </thead>
              <tbody>
                {equipos.map((e) => (
                  <tr key={e.id} className="border-t border-marmol-100 text-center">
                    <td className="py-1.5 text-left font-medium text-marmol-800">
                      {e.emoji} {e.nombre} <span className="text-[10px] text-marmol-400">({e.miembros.length})</span>
                    </td>
                    {MISIONES.slice(0, 5).map((m) => {
                      const i = intentos.find((x) => x.equipo_id === e.id && x.mision === m.numero);
                      return (
                        <td key={m.numero}>
                          {!i ? (
                            <span className="text-marmol-300">—</span>
                          ) : !i.fin ? (
                            <span className="text-medio">jugando…</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-marmol-800">
                              {i.puntos}
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => ejecutar(() => reiniciarMision(sesion.id, e.id, m.numero))}
                                className="text-marmol-300 hover:text-bajo"
                                title="Borrar esta jugada para que el equipo la repita"
                              >
                                <RotateCcw size={11} />
                              </button>
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-[11px]">{reales[e.id] ? reales[e.id]!.estado : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {Object.entries(reales).filter(([, r]) => r.estado !== 'borrador').length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-marmol-800">🚀 Misiones reales para revisar</p>
              {Object.entries(reales)
                .filter(([, r]) => r.estado !== 'borrador')
                .map(([equipoId, r]) => {
                  const e = equipos.find((x) => x.id === equipoId);
                  return (
                    <details key={equipoId} className="rounded-xl border border-marmol-200 p-3" open={r.estado === 'enviada'}>
                      <summary className="cursor-pointer text-sm font-semibold text-marmol-800">
                        {e?.emoji} {e?.nombre} · <span className="font-normal text-marmol-500">{r.estado}</span>
                      </summary>
                      <div className="mt-2">
                        <RevisionMisionReal sesionId={sesion.id} equipoId={equipoId} mision={r} />
                      </div>
                    </details>
                  );
                })}
            </div>
          )}
        </section>
      )}

      {/* El equipo juega */}
      {miEquipo && sesion.estado === 'jugando' && <ZonaEquipo sesion={sesion} equipo={miEquipo} intentos={intentos} real={reales[miEquipo.id] ?? null} />}

      {/* Marcador */}
      <section className="card p-4">
        <h2 className="font-display text-lg font-semibold text-secundario">🏆 Tablero de equipos</h2>
        <p className="text-[11px] text-marmol-400">
          El puntaje premia calidad, comprensión (causas y decisiones), colaboración (que jueguen distintas personas), aplicación real y sostenibilidad. La velocidad suma poco.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="text-right text-xs text-marmol-400">
              <tr>
                <th className="py-1 text-left font-medium">Equipo</th>
                <th className="font-medium">5S</th>
                <th className="font-medium">Tiempo</th>
                <th className="font-medium">Errores</th>
                <th className="font-medium">Evidencias</th>
                <th className="font-medium">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {marcadores.map(({ e, m }, i) => (
                <tr key={e.id} className={cn('border-t border-marmol-100 text-right', e.id === miEquipoId && 'bg-marca-50/60')}>
                  <td className="py-2 text-left font-medium text-marmol-800">
                    <span className="mr-1">{m.total > 0 ? (MEDALLAS[i] ?? `${i + 1}.`) : `${i + 1}.`}</span>
                    {e.emoji} {e.nombre}
                    <span className="block text-[10px] font-normal text-marmol-400">
                      misiones {m.puntosMisiones} · colaboración +{m.colaboracion} ({m.participantes} {m.participantes === 1 ? 'persona' : 'personas'}) · real {m.puntosReal}
                    </span>
                  </td>
                  <td className={cn('font-semibold', m.cincoS == null ? 'text-marmol-300' : m.cincoS >= 80 ? 'text-alto' : 'text-medio')}>
                    {m.cincoS == null ? '—' : `${Math.round(m.cincoS)} %`}
                  </td>
                  <td className="text-marmol-600">{m.segundos ? formatearTiempo(m.segundos) : '—'}</td>
                  <td className="text-marmol-600">{m.errores}</td>
                  <td className="text-marmol-600">{m.evidencias}/10</td>
                  <td className="font-display text-lg font-bold text-secundario">{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-[10px] text-marmol-400">5S = resultado de la auditoría «después» de la misión real.</p>
      </section>
    </div>
  );
}

/** Lo que ve y juega un equipo. */
function ZonaEquipo({ sesion, equipo, intentos, real }: { sesion: Sesion5SVista; equipo: Equipo5SVista; intentos: Intento5SVista[]; real: MisionRealVista | null }) {
  const router = useRouter();
  const esc = ESCENARIOS[sesion.escenario];
  const suyos = intentos.filter((i) => i.equipo_id === equipo.id);
  const pendienteMin = MISIONES.slice(0, Math.min(5, sesion.mision_actual)).find((m) => !suyos.some((i) => i.mision === m.numero && i.fin));
  const [elegida, setElegida] = useState<number>(pendienteMin?.numero ?? Math.min(sesion.mision_actual, 6));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [recien, setRecien] = useState<Record<number, Resultado5S>>({});

  const m = MISIONES.find((x) => x.numero === elegida)!;
  const intento = suyos.find((i) => i.mision === elegida);
  const ubicacionM2 = (suyos.find((i) => i.mision === 2)?.respuestas as { ubicacion?: Record<string, Frecuencia> } | undefined)?.ubicacion;
  const tieneRespuestas = Boolean(intento?.respuestas && Object.keys(intento.respuestas as object).length);
  const resultado =
    recien[elegida] ??
    (intento?.fin ? (tieneRespuestas ? puntuar(elegida, esc, intento.respuestas, null, ubicacionM2) : { aciertos: intento.aciertos, errores: intento.errores, puntos: intento.puntos, detalle: [`${intento.aciertos} aciertos · ${intento.errores} errores`] }) : null);

  const empezar = () =>
    startTransition(async () => {
      setError(null);
      const r = await iniciarMision(sesion.id, elegida);
      if (!r.ok) setError(r.error ?? 'Error');
      router.refresh();
    });
  const entregar = (respuestas: unknown) =>
    startTransition(async () => {
      setError(null);
      const r = await entregarMision(sesion.id, elegida, respuestas);
      if (!r.ok) return setError(r.error ?? 'Error');
      setRecien((x) => ({ ...x, [elegida]: { ...r.resultado } }));
      router.refresh();
    });

  const props = { esc, semilla: sesion.id, onEntregar: entregar, pendiente: pending };

  return (
    <section className="card border-2 border-marca-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-secundario">
          {equipo.emoji} {equipo.nombre}
        </h2>
        <div className="ml-auto flex flex-wrap gap-1">
          {MISIONES.filter((x) => x.numero <= sesion.mision_actual).map((x) => (
            <button
              key={x.numero}
              type="button"
              onClick={() => setElegida(x.numero)}
              className={cn('rounded-full px-2.5 py-1 text-xs', elegida === x.numero ? 'bg-secundario font-semibold text-white' : 'bg-marmol-100 text-marmol-600')}
            >
              {x.emoji} {x.numero <= 5 ? x.numero : 'Real'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-degradado p-4 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-acento">
          {m.numero <= 5 ? `🚨 Misión 0${m.numero}` : '🚀 Misión real'} · {m.titulo}
        </p>
        <p className="mt-1 text-sm">{m.historia}</p>
        <p className="mt-2 text-sm font-semibold">{m.reto}</p>
      </div>

      {m.numero <= 5 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {equipo.miembros.map((p, i) => {
            const rol = rolDe(i, m.numero);
            return (
              <div key={p.id} className="rounded-lg bg-marmol-50 p-2 text-xs">
                <p className="font-semibold text-marmol-800">
                  {rol.emoji} {rol.nombre}
                </p>
                <p className="truncate text-marmol-600">{p.nombre}</p>
                <p className="text-[10px] text-marmol-400">{rol.tarea}</p>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-bajo">{error}</p>}

      <div className="mt-4">
        {m.numero === 6 ? (
          <FormularioMisionReal sesionId={sesion.id} inicial={real} />
        ) : resultado ? (
          <div className="space-y-2 rounded-xl border-2 border-marca-300 bg-marca-50 p-4 text-center">
            <p className="text-3xl">🎯</p>
            <p className="font-display text-xl font-bold text-secundario">{m.revelacion}</p>
            <p className="text-sm text-marmol-700">⚠️ Pero cuidado… {m.cuidado}</p>
            <p className="font-display text-3xl font-bold text-marca-700">{intento?.puntos ?? recien[elegida]?.puntos} puntos</p>
            <p className="text-xs text-marmol-600">{resultado.detalle.join(' · ')}</p>
          </div>
        ) : !intento ? (
          <div className="text-center">
            <button type="button" disabled={pending} onClick={empezar} className="boton px-6 py-3 text-base">
              ▶ Empezar la misión {m.numero}
            </button>
            <p className="mt-1 text-[11px] text-marmol-400">El reloj arranca para todo el equipo. Un solo celular juega: el del Ejecutor.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Reloj inicio={intento.inicio} segundos={m.segundos} />
            </div>
            {elegida === 1 && <M1Clasificar {...props} />}
            {elegida === 2 && <M2Ordenar {...props} />}
            {elegida === 3 && <M3Limpiar {...props} />}
            {elegida === 4 && <M4Estandarizar {...props} />}
            {elegida === 5 && <M5Sostener {...props} ubicacionM2={ubicacionM2} />}
          </div>
        )}
      </div>
    </section>
  );
}
