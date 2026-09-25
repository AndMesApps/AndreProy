'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { abrirTodos, entregarReto, iniciarReto, moverReto, reiniciarReto } from '@/app/riesgo/actions';
import {
  CLAVES_COMPETENCIA,
  COMPETENCIAS,
  EMPRESA,
  ESTACIONES,
  MAXIMOS,
  PERFILES,
  RETOS,
  conRuta,
  marcadorRr,
  nivelComprension,
  puntuar,
  rolRr,
  type ConfigRuta,
  type IntentoRr,
  type MarcadorRr,
  type ResultadoRr,
} from '@/lib/riesgo';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Reloj } from '@/components/cincos/misiones';
import { R1Senales, R2Contraparte, R3Beneficiario, R4Dinero, R5Semaforo, R6Cartas, R7Escalar, R8CasoFinal, RevisionReto } from './retos';

export interface SesionRrVista {
  id: string;
  titulo: string;
  estado: 'preparacion' | 'jugando' | 'cerrado';
  reto_actual: number;
}

export interface EquipoRrVista {
  id: string;
  nombre: string;
  emoji: string;
  miembros: { id: string; nombre: string }[];
}

export type IntentoRrVista = IntentoRr & { respuestas: unknown };

const REFRESCO_MS = 6000;
const MEDALLAS = ['🥇', '🥈', '🥉'];

/** Tablero visual de la ruta: Empresa → contrapartes → operación → analizar → normal/alerta → escalar. */
export function TableroRuta({ hechos, abiertos }: { hechos: number[]; abiertos: number }) {
  return (
    <div className="flex flex-col items-stretch gap-0.5 md:flex-row md:items-center">
      {ESTACIONES.map((e, i) => {
        const completa = e.retos.length === 0 ? hechos.length > 0 : e.retos.every((r) => hechos.includes(r));
        const abierta = e.retos.length === 0 || e.retos.some((r) => r <= abiertos);
        return (
          <div key={e.id} className="flex flex-col items-center md:flex-1 md:flex-row">
            <div
              className={cn(
                'w-full rounded-xl border-2 px-2 py-2 text-center transition',
                completa ? 'border-marca-400 bg-marca-50' : abierta ? 'border-acento bg-amber-50' : 'border-marmol-200 bg-marmol-50 opacity-60',
              )}
            >
              <p className="text-xl leading-none">{e.emoji}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase leading-tight tracking-wide text-secundario">{e.nombre}</p>
              {e.retos.length > 0 && <p className="text-[10px] text-marmol-500">Retos {e.retos.join(' y ')}{completa ? ' ✓' : ''}</p>}
            </div>
            {i < ESTACIONES.length - 1 && <span className="px-1 text-marmol-400 md:py-0">↓</span>}
          </div>
        );
      })}
    </div>
  );
}

/** Barras de las 5 competencias. */
export function BarrasCompetencias({ m, umbral, compacta = false }: { m: MarcadorRr; umbral: number; compacta?: boolean }) {
  return (
    <div className={cn('grid gap-1', !compacta && 'sm:grid-cols-2 lg:grid-cols-5')}>
      {CLAVES_COMPETENCIA.map((k) => {
        const v = m.competencias[k];
        return (
          <div key={k} title={COMPETENCIAS[k].ayuda}>
            <p className="flex justify-between text-[11px] text-marmol-600">
              <span>
                {COMPETENCIAS[k].emoji} {COMPETENCIAS[k].nombre}
              </span>
              <span className={cn('font-semibold', v == null ? 'text-marmol-300' : v >= umbral ? 'text-alto' : 'text-medio')}>{v == null ? '—' : `${v} %`}</span>
            </p>
            <div className="relative h-2 overflow-hidden rounded-full bg-marmol-100">
              <div className={cn('h-full rounded-full', v != null && v >= umbral ? 'bg-marca-500' : 'bg-acento')} style={{ width: `${v ?? 0}%` }} />
              <div className="absolute inset-y-0 w-0.5 bg-secundario/50" style={{ left: `${umbral}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function JuegoRiesgo({
  sesion,
  equipos,
  intentos,
  config,
  miEquipoId,
  esFacilitador,
}: {
  sesion: SesionRrVista;
  equipos: EquipoRrVista[];
  intentos: IntentoRrVista[];
  config: ConfigRuta;
  miEquipoId: string | null;
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

  const marcadores = useMemo(() => equipos.map((e) => ({ e, m: marcadorRr(e.id, intentos, config.umbral) })).sort((a, b) => b.m.total - a.m.total), [equipos, intentos, config.umbral]);
  const miEquipo = equipos.find((e) => e.id === miEquipoId);
  const hechosMios = miEquipoId ? intentos.filter((i) => i.equipo_id === miEquipoId && i.fin).map((i) => i.reto) : [];

  const ejecutar = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? 'Error');
      router.refresh();
    });
  };

  const siguiente = sesion.reto_actual >= RETOS.length ? null : RETOS[sesion.reto_actual];

  return (
    <div className="space-y-5">
      <section className="card space-y-3 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display font-semibold text-secundario">🗺️ La ruta del riesgo</h2>
          <p className="text-[11px] text-marmol-500">
            🏢 {EMPRESA.nombre} <span className="text-marmol-400">({EMPRESA.nota})</span>
          </p>
        </div>
        <TableroRuta hechos={esFacilitador ? [] : hechosMios} abiertos={sesion.estado === 'preparacion' ? 0 : sesion.reto_actual} />
        <p className="rounded-lg bg-marca-50 px-3 py-2 text-xs text-marmol-700">
          📣 <strong>La ruta de esta empresa:</strong> ante una señal se documenta y se escala a <strong>{config.responsable}</strong> por <strong>{config.canal}</strong>.
        </p>
      </section>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {RETOS.map((r) => {
          const abierta = sesion.estado !== 'preparacion' && r.numero <= sesion.reto_actual;
          const hecha = miEquipoId ? hechosMios.includes(r.numero) : false;
          const cuantos = intentos.filter((i) => i.reto === r.numero && i.fin).length;
          return (
            <div
              key={r.numero}
              className={cn(
                'rounded-xl border p-2 text-center',
                !abierta ? 'border-marmol-200 bg-marmol-100/60 opacity-60' : hecha ? 'border-marca-300 bg-marca-50' : r.numero === sesion.reto_actual ? 'border-acento bg-amber-50' : 'border-marmol-200 bg-white',
              )}
            >
              <p className="text-xl">{abierta ? r.emoji : '🔒'}</p>
              <p className="text-[10px] font-bold text-secundario">
                Reto {r.numero}
                {hecha ? ' ✓' : ''}
              </p>
              <p className="text-[10px] leading-tight text-marmol-500">{r.titulo}</p>
              {esFacilitador && abierta && (
                <p className="mt-0.5 text-[10px] font-semibold text-marca-700">
                  {cuantos}/{equipos.length}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {sesion.estado === 'preparacion' && (
        <div className="card p-5 text-center">
          <p className="text-3xl">🗺️</p>
          <p className="font-display text-xl font-semibold text-secundario">La ruta se está preparando</p>
          <p className="mx-auto mt-1 max-w-xl text-sm text-marmol-600">
            {esFacilitador ? 'Comparte el código o el QR. Cuando los equipos estén listos, abre el reto 1 (o todos a la vez si se juega a su ritmo).' : EMPRESA.lema + ' Espera a que la facilitadora abra el primer reto.'}
          </p>
        </div>
      )}

      {sesion.estado === 'cerrado' && (
        <div className="rounded-2xl bg-degradado p-5 text-center text-white shadow">
          <p className="text-3xl">🛡️</p>
          <p className="font-display text-2xl font-bold">¡Ruta completada!</p>
          <p className="text-sm text-white/85">Reconocer señales, no decidir con afán, proteger la información, documentar y activar la ruta.</p>
        </div>
      )}

      {esFacilitador && (
        <section className="card space-y-3 p-4">
          <p className="font-display font-semibold text-secundario">🎛️ Mando de la facilitadora</p>
          <div className="flex flex-wrap items-center gap-2">
            {(sesion.estado !== 'preparacion' || sesion.reto_actual > 0) && (
              <button type="button" disabled={pending} onClick={() => ejecutar(() => moverReto(sesion.id, -1))} className="boton-secundario px-3 py-2 text-xs">
                <ChevronLeft size={14} /> Atrás
              </button>
            )}
            {sesion.estado !== 'cerrado' &&
              (siguiente ? (
                <>
                  <button type="button" disabled={pending} onClick={() => ejecutar(() => moverReto(sesion.id, 1))} className="boton">
                    Abrir reto {siguiente.numero}: {siguiente.emoji} {siguiente.titulo} <ChevronRight size={15} />
                  </button>
                  <button type="button" disabled={pending} onClick={() => ejecutar(() => abrirTodos(sesion.id))} className="boton-secundario px-3 py-2 text-xs">
                    Abrir todos (a su ritmo)
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => (confirmarCierre ? ejecutar(() => moverReto(sesion.id, 1)) : setConfirmarCierre(true))}
                  className={cn('boton', confirmarCierre && 'bg-bajo hover:bg-red-800')}
                >
                  {confirmarCierre ? '¿Seguro? Toca otra vez para cerrar' : '🏁 Cerrar la sesión y ver resultados'}
                </button>
              ))}
          </div>
          <p className="text-[11px] text-marmol-500">
            Los retos abiertos quedan disponibles: cada equipo avanza a su ritmo. Después de cada uno, conecten la experiencia con el procedimiento real de la empresa: ahí está el aprendizaje.
          </p>
          {error && <p className="text-sm text-bajo">{error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-xs">
              <thead className="text-center text-marmol-400">
                <tr>
                  <th className="py-1 text-left font-medium">Equipo</th>
                  {RETOS.map((r) => (
                    <th key={r.numero} className="font-medium" title={r.titulo}>
                      {r.emoji} {r.numero}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equipos.map((e) => (
                  <tr key={e.id} className="border-t border-marmol-100 text-center">
                    <td className="py-1.5 text-left font-medium text-marmol-800">
                      {e.emoji} {e.nombre} <span className="text-[10px] text-marmol-400">({e.miembros.length})</span>
                    </td>
                    {RETOS.map((r) => {
                      const i = intentos.find((x) => x.equipo_id === e.id && x.reto === r.numero);
                      return (
                        <td key={r.numero}>
                          {!i ? (
                            <span className="text-marmol-300">—</span>
                          ) : !i.fin ? (
                            <span className="text-medio">…</span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 font-semibold text-marmol-800">
                              {i.puntos}
                              <button type="button" disabled={pending} onClick={() => ejecutar(() => reiniciarReto(sesion.id, e.id, r.numero))} className="text-marmol-300 hover:text-bajo" title="Borrar esta jugada para que el equipo la repita">
                                <RotateCcw size={10} />
                              </button>
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {miEquipo && sesion.estado === 'jugando' && <ZonaEquipo sesion={sesion} equipo={miEquipo} intentos={intentos} config={config} marcador={marcadores.find((x) => x.e.id === miEquipo.id)!.m} />}

      <section className="card p-4">
        <h2 className="font-display text-lg font-semibold text-secundario">🏆 Tablero de equipos</h2>
        <p className="text-[11px] text-marmol-400">
          No gana solo «quien sabe más»: se reconocen capacidades. 🛡️ Certificación Guardián del Riesgo = {config.umbral} % o más en las 5 competencias, caso final hecho y cero información reservada compartida.
        </p>
        <div className="mt-3 space-y-2">
          {marcadores.map(({ e, m }, i) => {
            const nivel = m.comprension == null ? null : nivelComprension(m.comprension);
            return (
              <div key={e.id} className={cn('rounded-xl border p-3', e.id === miEquipoId ? 'border-marca-300 bg-marca-50/50' : 'border-marmol-200')}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-marmol-800">
                    <span className="mr-1">{m.total > 0 ? (MEDALLAS[i] ?? `${i + 1}.`) : `${i + 1}.`}</span>
                    {e.emoji} {e.nombre}
                  </p>
                  {m.certificado && <span className="rounded-full bg-secundario px-2 py-0.5 text-[11px] font-bold text-acento">🛡️ Guardián del Riesgo</span>}
                  {m.perfiles.map((k) => (
                    <span key={k} className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-marmol-700" title={PERFILES[k].ayuda}>
                      {PERFILES[k].emoji} {PERFILES[k].nombre}
                    </span>
                  ))}
                  <p className="ml-auto text-right">
                    <span className="font-display text-xl font-bold text-secundario">{m.total}</span>
                    <span className="block text-[10px] text-marmol-400">
                      {m.retos}/8 retos · colaboración +{m.colaboracion}
                      {nivel && ` · ${nivel.emoji} ${nivel.nombre} (${m.comprension} %)`}
                    </span>
                  </p>
                </div>
                <div className="mt-2">
                  <BarrasCompetencias m={m} umbral={config.umbral} />
                </div>
              </div>
            );
          })}
          {marcadores.length === 0 && <p className="text-sm text-marmol-400">Todavía no hay equipos.</p>}
        </div>
        <p className="mt-2 text-[10px] text-marmol-400">Perfiles: {Object.values(PERFILES).map((x) => `${x.emoji} ${x.nombre} (${x.ayuda.toLowerCase()})`).join(' · ')}</p>
      </section>
    </div>
  );
}

/** Lo que ve y juega un equipo. */
function ZonaEquipo({ sesion, equipo, intentos, config, marcador }: { sesion: SesionRrVista; equipo: EquipoRrVista; intentos: IntentoRrVista[]; config: ConfigRuta; marcador: MarcadorRr }) {
  const router = useRouter();
  const suyos = intentos.filter((i) => i.equipo_id === equipo.id);
  const tope = Math.min(RETOS.length, sesion.reto_actual);
  const pendienteMin = RETOS.slice(0, tope).find((m) => !suyos.some((i) => i.reto === m.numero && i.fin));
  const [elegido, setElegido] = useState<number>(pendienteMin?.numero ?? tope);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [recien, setRecien] = useState<Record<number, ResultadoRr>>({});
  const [ultimasRespuestas, setUltimas] = useState<Record<number, unknown>>({});

  if (tope < 1) return null;
  const reto = RETOS.find((x) => x.numero === elegido)!;
  const intento = suyos.find((i) => i.reto === elegido);
  const tieneRespuestas = Boolean(intento?.respuestas && Object.keys(intento.respuestas as object).length);
  const resultado: ResultadoRr | null =
    recien[elegido] ??
    (intento?.fin
      ? tieneRespuestas
        ? { ...puntuar(elegido, intento.respuestas), puntos: intento.puntos }
        : { aciertos: intento.aciertos, errores: intento.errores, puntos: intento.puntos, detalle: [], resumen: intento.resumen ?? {} }
      : null);

  const empezar = () =>
    startTransition(async () => {
      setError(null);
      const r = await iniciarReto(sesion.id, elegido);
      if (!r.ok) setError(r.error ?? 'Error');
      router.refresh();
    });
  const entregar = (respuestas: unknown) =>
    startTransition(async () => {
      setError(null);
      const r = await entregarReto(sesion.id, elegido, respuestas);
      if (!r.ok) return setError(r.error ?? 'Error');
      setRecien((x) => ({ ...x, [elegido]: r.resultado }));
      router.refresh();
    });

  const props = { semilla: sesion.id, onEntregar: entregar, pendiente: pending, ruta: config };
  const entregarYGuardar = (respuestas: unknown) => {
    setUltimas((x) => ({ ...x, [elegido]: respuestas }));
    entregar(respuestas);
  };
  const respuestasVista = ultimasRespuestas[elegido] ?? intento?.respuestas;

  return (
    <section className="card border-2 border-marca-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-secundario">
          🗺️ Equipo {equipo.emoji} {equipo.nombre}
        </h2>
        <div className="ml-auto flex flex-wrap gap-1">
          {RETOS.filter((x) => x.numero <= tope).map((x) => {
            const hecho = suyos.some((i) => i.reto === x.numero && i.fin);
            return (
              <button key={x.numero} type="button" onClick={() => setElegido(x.numero)} className={cn('rounded-full px-2.5 py-1 text-xs', elegido === x.numero ? 'bg-secundario font-semibold text-white' : hecho ? 'bg-marca-100 text-marca-700' : 'bg-marmol-100 text-marmol-600')}>
                {x.emoji} {x.numero}
                {hecho ? ' ✓' : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <BarrasCompetencias m={marcador} umbral={config.umbral} />
      </div>

      <div className="mt-3 rounded-xl bg-degradado p-4 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-acento">
          Reto {reto.numero} de {RETOS.length} · {reto.titulo}
        </p>
        <p className="mt-1 text-sm">{reto.historia}</p>
        <p className="mt-2 text-sm font-semibold">{reto.reto}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {equipo.miembros.map((p, i) => {
          const rol = rolRr(i, reto.numero);
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
            <p className="font-display text-2xl font-bold text-secundario">{reto.revelacion}</p>
            <p className="font-display text-3xl font-bold text-marca-700">
              {resultado.puntos} <span className="text-base font-normal text-marmol-500">de {MAXIMOS[reto.numero]} puntos</span>
            </p>
            {resultado.detalle.length > 0 && <p className="text-xs text-marmol-600">{resultado.detalle.join(' · ')}</p>}
            <p className="text-sm text-marmol-700">💡 {reto.aprendizaje}</p>
            <div className="rounded-lg bg-white p-3 text-left text-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-secundario">📘 El concepto detrás de lo que acaban de vivir</p>
              <p className="mt-1 text-marmol-700">{conRuta(reto.concepto, config)}</p>
            </div>
            <details className="rounded-lg bg-white p-3 text-left" open={reto.numero <= 5}>
              <summary className="cursor-pointer text-sm font-semibold text-secundario">🔎 Revisar el reto: qué era lo correcto</summary>
              <div className="mt-2">
                <RevisionReto numero={reto.numero} respuestas={respuestasVista} ruta={config} />
              </div>
            </details>
          </div>
        ) : !intento ? (
          <div className="text-center">
            <button type="button" disabled={pending} onClick={empezar} className="boton px-6 py-3 text-base">
              ▶ Empezar el reto {reto.numero}: {reto.titulo}
            </button>
            <p className="mt-1 text-[11px] text-marmol-400">Un solo celular juega: el del Escriba. Los demás leen, preguntan y opinan desde su rol.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Reloj inicio={intento.inicio} segundos={reto.segundos} />
            </div>
            {elegido === 1 && <R1Senales {...props} onEntregar={entregarYGuardar} />}
            {elegido === 2 && <R2Contraparte {...props} onEntregar={entregarYGuardar} />}
            {elegido === 3 && <R3Beneficiario {...props} onEntregar={entregarYGuardar} />}
            {elegido === 4 && <R4Dinero {...props} onEntregar={entregarYGuardar} />}
            {elegido === 5 && <R5Semaforo {...props} onEntregar={entregarYGuardar} />}
            {elegido === 6 && <R6Cartas {...props} onEntregar={entregarYGuardar} />}
            {elegido === 7 && <R7Escalar {...props} onEntregar={entregarYGuardar} />}
            {elegido === 8 && <R8CasoFinal {...props} onEntregar={entregarYGuardar} />}
          </div>
        )}
      </div>
    </section>
  );
}
