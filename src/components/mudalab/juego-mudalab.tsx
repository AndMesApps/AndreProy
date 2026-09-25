'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { entregarMision, iniciarMision, moverMision, reiniciarMision } from '@/app/mudalab/actions';
import { CASO, INSIGNIAS, MAXIMOS, MISIONES_ML, NIVELES_MADUREZ, diasTexto, marcadorMl, puntuar, rolMl, type IntentoMl, type OportunidadMinima, type ResultadoMl, type ResumenMl } from '@/lib/mudalab';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Reloj } from '@/components/cincos/misiones';
import { M1Definir, M2Gemba, M3Analizar, M4Laboratorio, M5Controlar, RevisionMision } from './misiones';
import { BancoOportunidades } from './banco';

export interface SesionMlVista {
  id: string;
  titulo: string;
  estado: 'preparacion' | 'jugando' | 'cerrado';
  mision_actual: number;
}

export interface EquipoMlVista {
  id: string;
  nombre: string;
  emoji: string;
  miembros: { id: string; nombre: string }[];
}

export type IntentoMlVista = IntentoMl & { respuestas: unknown };

const REFRESCO_MS = 6000;
const MEDALLAS = ['🥇', '🥈', '🥉'];

/** Escalera de madurez de 8 niveles (La vio → La sostuvo). */
export function EscaleraMadurez({ madurez, compacta = false }: { madurez: boolean[]; compacta?: boolean }) {
  if (compacta) {
    return (
      <span className="inline-flex gap-0.5" title={NIVELES_MADUREZ.map((n, i) => `${madurez[i] ? '✓' : '·'} ${n.nombre}`).join('\n')}>
        {NIVELES_MADUREZ.map((n, i) => (
          <span key={n.nivel} className={cn('inline-block h-2.5 w-2.5 rounded-sm', madurez[i] ? 'bg-marca-500' : 'bg-marmol-200')} />
        ))}
      </span>
    );
  }
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
      {NIVELES_MADUREZ.map((n, i) => (
        <div key={n.nivel} title={n.ayuda} className={cn('rounded-lg border p-1.5 text-center', madurez[i] ? 'border-marca-300 bg-marca-50' : 'border-marmol-200 bg-marmol-50 opacity-60')}>
          <p className="text-lg leading-none">{madurez[i] ? n.emoji : '🔒'}</p>
          <p className="mt-0.5 text-[10px] font-semibold leading-tight text-marmol-700">
            {n.nivel}. {n.nombre}
          </p>
        </div>
      ))}
    </div>
  );
}

export function JuegoMudaLab({
  sesion,
  equipos,
  intentos,
  oportunidades,
  miEquipoId,
  miJugadorId,
  esFacilitador,
}: {
  sesion: SesionMlVista;
  equipos: EquipoMlVista[];
  intentos: IntentoMlVista[];
  oportunidades: OportunidadMinima[];
  miEquipoId: string | null;
  miJugadorId: string | null;
  esFacilitador: boolean;
}) {
  const router = useRouter();
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

  const marcadores = useMemo(() => equipos.map((e) => ({ e, m: marcadorMl(e.id, intentos, oportunidades) })).sort((a, b) => b.m.total - a.m.total), [equipos, intentos, oportunidades]);
  const miEquipo = equipos.find((e) => e.id === miEquipoId);

  const ejecutar = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? 'Error');
      router.refresh();
    });
  };

  const siguiente = sesion.mision_actual >= 6 ? null : MISIONES_ML[sesion.mision_actual];

  return (
    <div className="space-y-5">
      {/* Camino DMAIC */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {MISIONES_ML.map((m) => {
          const abierta = sesion.estado !== 'preparacion' && m.numero <= sesion.mision_actual;
          const hecha = miEquipoId ? (m.numero <= 5 ? intentos.some((i) => i.equipo_id === miEquipoId && i.mision === m.numero && i.fin) : oportunidades.some((o) => o.equipo_id === miEquipoId)) : false;
          const cuantos = m.numero <= 5 ? intentos.filter((i) => i.mision === m.numero && i.fin).length : new Set(oportunidades.map((o) => o.equipo_id)).size;
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
                {m.numero <= 5 ? `${m.fase[0]} · ${m.fase}` : 'Mundo 2'}
                {hecha ? ' ✓' : ''}
              </p>
              <p className="text-[10px] text-marmol-500">{m.titulo}</p>
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
          <p className="text-3xl">🕵️</p>
          <p className="font-display text-xl font-semibold text-secundario">La agencia se está preparando</p>
          <p className="mx-auto mt-1 max-w-xl text-sm text-marmol-600">
            {esFacilitador
              ? 'Comparte el código o el QR. Cuando las agencias (equipos) estén listas, abre la misión 1: Definir.'
              : `Expediente ${CASO.expediente}: «${CASO.nombre}». Espera a que la facilitadora abra la primera misión.`}
          </p>
        </div>
      )}

      {sesion.estado === 'cerrado' && (
        <div className="rounded-2xl bg-degradado p-5 text-center text-white shadow">
          <p className="text-3xl">🏆</p>
          <p className="font-display text-2xl font-bold">¡Caso cerrado!</p>
          <p className="text-sm text-white/85">El flujo está recuperado. Ahora a cazar las Mudas del trabajo real.</p>
        </div>
      )}

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
                  Abrir {siguiente.numero <= 5 ? `misión ${siguiente.numero}: ${siguiente.emoji} ${siguiente.fase}` : '🏢 el Mundo 2: Mi proceso'} <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => (confirmarCierre ? ejecutar(() => moverMision(sesion.id, 1)) : setConfirmarCierre(true))}
                  className={cn('boton', confirmarCierre && 'bg-bajo hover:bg-red-800')}
                >
                  {confirmarCierre ? '¿Seguro? Toca otra vez para cerrar' : '🏁 Cerrar el caso y ver resultados'}
                </button>
              ))}
          </div>
          <p className="text-[11px] text-marmol-500">Las misiones abiertas quedan disponibles: cada equipo avanza a su ritmo. Después de cada una, haz 5 minutos de conversación: ahí está el aprendizaje.</p>
          {error && <p className="text-sm text-bajo">{error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-xs">
              <thead className="text-center text-marmol-400">
                <tr>
                  <th className="py-1 text-left font-medium">Equipo</th>
                  {MISIONES_ML.slice(0, 5).map((m) => (
                    <th key={m.numero} className="font-medium">
                      {m.emoji} {m.fase}
                    </th>
                  ))}
                  <th className="font-medium">🏢 Banco</th>
                </tr>
              </thead>
              <tbody>
                {equipos.map((e) => (
                  <tr key={e.id} className="border-t border-marmol-100 text-center">
                    <td className="py-1.5 text-left font-medium text-marmol-800">
                      {e.emoji} {e.nombre} <span className="text-[10px] text-marmol-400">({e.miembros.length})</span>
                    </td>
                    {MISIONES_ML.slice(0, 5).map((m) => {
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
                              <button type="button" disabled={pending} onClick={() => ejecutar(() => reiniciarMision(sesion.id, e.id, m.numero))} className="text-marmol-300 hover:text-bajo" title="Borrar esta jugada para que el equipo la repita">
                                <RotateCcw size={11} />
                              </button>
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="font-semibold text-marmol-700">{oportunidades.filter((o) => o.equipo_id === e.id).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {miEquipo && sesion.estado === 'jugando' && <ZonaEquipo sesion={sesion} equipo={miEquipo} intentos={intentos} madurez={marcadores.find((x) => x.e.id === miEquipo.id)?.m.madurez ?? []} />}

      {sesion.mision_actual >= 6 && (esFacilitador || miEquipo) && (
        <BancoOportunidades sesionId={sesion.id} oportunidades={oportunidades} equipos={equipos} miEquipoId={miEquipoId} miJugadorId={miJugadorId} esFacilitador={esFacilitador} abierto={sesion.estado === 'jugando'} />
      )}

      <section className="card p-4">
        <h2 className="font-display text-lg font-semibold text-secundario">🏆 Tablero de agencias</h2>
        <p className="text-[11px] text-marmol-400">Madurez = cuántos de los 8 niveles alcanzó el equipo: la vio, la clasificó, la midió, encontró la causa, propuso, experimentó, demostró y la sostuvo.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="text-right text-xs text-marmol-400">
              <tr>
                <th className="py-1 text-left font-medium">Equipo</th>
                <th className="font-medium">Madurez</th>
                <th className="font-medium">Mudas</th>
                <th className="font-medium">Días</th>
                <th className="font-medium">Devueltas</th>
                <th className="font-medium">Sostiene</th>
                <th className="font-medium">Banco</th>
                <th className="font-medium">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {marcadores.map(({ e, m }, i) => (
                <tr key={e.id} className={cn('border-t border-marmol-100 text-right', e.id === miEquipoId && 'bg-marca-50/60')}>
                  <td className="py-2 text-left font-medium text-marmol-800">
                    <span className="mr-1">{m.total > 0 ? (MEDALLAS[i] ?? `${i + 1}.`) : `${i + 1}.`}</span>
                    {e.emoji} {e.nombre}
                    {m.insignias.length > 0 && (
                      <span className="ml-1" title={m.insignias.map((k) => `${INSIGNIAS[k].nombre}: ${INSIGNIAS[k].ayuda}`).join('\n')}>
                        {m.insignias.map((k) => INSIGNIAS[k].emoji).join('')}
                      </span>
                    )}
                    <span className="block text-[10px] font-normal text-marmol-400">
                      misiones {m.puntosMisiones} · colaboración +{m.colaboracion} · banco {m.puntosBanco}
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex flex-col items-end gap-0.5">
                      <span className="text-xs font-semibold text-marmol-700">{m.nivel}/8</span>
                      <EscaleraMadurez madurez={m.madurez} compacta />
                    </span>
                  </td>
                  <td className="text-marmol-600">{m.porMision[2] ? `${m.mudas}/8` : '—'}</td>
                  <td className="whitespace-nowrap text-marmol-600">{m.dias == null ? '—' : diasTexto(m.dias)}</td>
                  <td className="whitespace-nowrap text-marmol-600">{m.defectos == null ? '—' : `${m.defectos} %`}</td>
                  <td className={cn('whitespace-nowrap', m.sostenibilidad == null ? 'text-marmol-300' : m.sostenibilidad >= 80 ? 'font-semibold text-alto' : 'text-medio')}>
                    {m.sostenibilidad == null ? '—' : `${m.sostenibilidad} %`}
                  </td>
                  <td className="text-marmol-600">
                    {m.oportunidades} · {m.votos}👍
                  </td>
                  <td className="font-display text-lg font-bold text-secundario">{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] text-marmol-400">
          Insignias: {Object.values(INSIGNIAS).map((x) => `${x.emoji} ${x.nombre} (${x.ayuda.toLowerCase()})`).join(' · ')}
        </p>
      </section>
    </div>
  );
}

/** Lo que ve y juega un equipo. */
function ZonaEquipo({ sesion, equipo, intentos, madurez }: { sesion: SesionMlVista; equipo: EquipoMlVista; intentos: IntentoMlVista[]; madurez: boolean[] }) {
  const router = useRouter();
  const suyos = intentos.filter((i) => i.equipo_id === equipo.id);
  const tope = Math.min(5, sesion.mision_actual);
  const pendienteMin = MISIONES_ML.slice(0, tope).find((m) => !suyos.some((i) => i.mision === m.numero && i.fin));
  const [elegida, setElegida] = useState<number>(pendienteMin?.numero ?? tope);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [recien, setRecien] = useState<Record<number, ResultadoMl>>({});

  if (tope < 1) return null;
  const m = MISIONES_ML.find((x) => x.numero === elegida)!;
  const intento = suyos.find((i) => i.mision === elegida);
  const resumenM4 = (suyos.find((i) => i.mision === 4 && i.fin)?.resumen ?? null) as ResumenMl | null;
  const tieneRespuestas = Boolean(intento?.respuestas && Object.keys(intento.respuestas as object).length);
  const resultado: ResultadoMl | null =
    recien[elegida] ??
    (intento?.fin
      ? tieneRespuestas
        ? { ...puntuar(elegida, intento.respuestas, resumenM4?.valido ? (resumenM4.plan ?? []) : [], resumenM4?.valido ? (resumenM4.dias ?? null) : null), puntos: intento.puntos }
        : { aciertos: intento.aciertos, errores: intento.errores, puntos: intento.puntos, detalle: [], resumen: intento.resumen ?? {} }
      : null);

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
      setRecien((x) => ({ ...x, [elegida]: r.resultado }));
      router.refresh();
    });

  const props = { semilla: sesion.id, onEntregar: entregar, pendiente: pending };
  const respuestasVista = recien[elegida] ? null : intento?.respuestas;

  return (
    <section className="card border-2 border-marca-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-secundario">
          🕵️ Agencia {equipo.emoji} {equipo.nombre}
        </h2>
        <div className="ml-auto flex flex-wrap gap-1">
          {MISIONES_ML.filter((x) => x.numero <= tope).map((x) => (
            <button key={x.numero} type="button" onClick={() => setElegida(x.numero)} className={cn('rounded-full px-2.5 py-1 text-xs', elegida === x.numero ? 'bg-secundario font-semibold text-white' : 'bg-marmol-100 text-marmol-600')}>
              {x.emoji} {x.fase}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <EscaleraMadurez madurez={madurez} />
      </div>

      <div className="mt-3 rounded-xl bg-degradado p-4 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-acento">
          📁 Expediente {CASO.expediente} · Misión {m.numero} · {m.fase}: {m.titulo}
        </p>
        <p className="mt-1 text-sm">{m.historia}</p>
        <p className="mt-2 text-sm font-semibold">{m.reto}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {equipo.miembros.map((p, i) => {
          const rol = rolMl(i, m.numero);
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

      {error && <p className="mt-2 text-sm text-bajo">{error}</p>}

      <div className="mt-4">
        {resultado ? (
          <div className="space-y-3 rounded-xl border-2 border-marca-300 bg-marca-50 p-4 text-center">
            <p className="font-display text-2xl font-bold text-secundario">{m.revelacion}</p>
            <p className="text-sm text-marmol-700">💡 {m.aprendizaje}</p>
            <p className="font-display text-3xl font-bold text-marca-700">
              {resultado.puntos} <span className="text-base font-normal text-marmol-500">de {MAXIMOS[m.numero]} puntos</span>
            </p>
            {resultado.detalle.length > 0 && <p className="text-xs text-marmol-600">{resultado.detalle.join(' · ')}</p>}
            <details className="rounded-lg bg-white p-3 text-left" open={m.numero >= 4}>
              <summary className="cursor-pointer text-sm font-semibold text-secundario">🔎 Revisar la misión: qué era lo correcto</summary>
              <div className="mt-2">
                <RevisionMision numero={m.numero} respuestas={respuestasVista ?? intento?.respuestas} resumen={resultado.resumen} resumenM4={resumenM4} />
              </div>
            </details>
          </div>
        ) : !intento ? (
          <div className="text-center">
            <button type="button" disabled={pending} onClick={empezar} className="boton px-6 py-3 text-base">
              ▶ Empezar la misión {m.numero}: {m.fase}
            </button>
            <p className="mt-1 text-[11px] text-marmol-400">Un solo celular juega: el del Escriba. Los demás investigan y opinan desde su rol.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Reloj inicio={intento.inicio} segundos={m.segundos} />
            </div>
            {elegida === 1 && <M1Definir {...props} />}
            {elegida === 2 && <M2Gemba {...props} />}
            {elegida === 3 && <M3Analizar {...props} />}
            {elegida === 4 && <M4Laboratorio {...props} />}
            {elegida === 5 && <M5Controlar {...props} resumenM4={resumenM4} />}
          </div>
        )}
      </div>
    </section>
  );
}
