'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { decidirTarjeta } from '@/app/kaizen/actions';
import { INFO_FASE, REGLAS_PUNTOS, calcularMarcador, describirMomento, errorPrediccion, fasesDeRonda, formatearPct, type MarcadorEquipo } from '@/lib/kaizen';
import { cn } from '@/lib/utils';
import { ControlFacilitador } from './control-facilitador';
import { Cronometro } from './cronometro';
import { FormularioResultado } from './formulario-resultado';
import { GraficaMejora } from './grafica-mejora';
import { Marcador } from './marcador';
import { ResumenTarjeta, TarjetaKaizen } from './tarjeta-kaizen';
import type { EquipoVista, ResultadoVista, SesionVista, TarjetaVista } from './tipos';

/** En un taller todos juegan a la vez: se refresca seguido para ver los cambios de fase. */
const REFRESCO_MS = 4000;

export function CarreraKaizen({
  sesion,
  equipos,
  tarjetas,
  resultados,
  miEquipoId,
  esFacilitador,
  ahoraServidor,
}: {
  sesion: SesionVista;
  equipos: EquipoVista[];
  tarjetas: TarjetaVista[];
  resultados: ResultadoVista[];
  miEquipoId: string | null;
  esFacilitador: boolean;
  ahoraServidor: number;
}) {
  const router = useRouter();
  const [desfaseMs] = useState(() => ahoraServidor - Date.now());

  useEffect(() => {
    if (sesion.estado === 'cerrado') return;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, REFRESCO_MS);
    // Al volver a la pantalla (celular desbloqueado, otra pestaña) se pone al día de inmediato.
    const alVolver = () => document.visibilityState === 'visible' && router.refresh();
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [sesion.estado, router]);

  const marcadores = useMemo(
    () => new Map<string, MarcadorEquipo>(equipos.map((e) => [e.id, calcularMarcador(e.id, sesion.totalRondas, tarjetas, resultados)])),
    [equipos, sesion.totalRondas, tarjetas, resultados],
  );
  const miEquipo = equipos.find((e) => e.id === miEquipoId);
  const fase = sesion.estado === 'jugando' ? sesion.fase : null;
  const info = fase ? INFO_FASE[fase] : null;

  return (
    <div className="space-y-5">
      <BarraRondas sesion={sesion} />

      {/* La fase en curso, con su instrucción y (en Hacer) el cronómetro para todos. */}
      <div className={cn('rounded-2xl px-5 py-4 text-center shadow-sm', sesion.estado === 'cerrado' ? 'bg-degradado text-white' : 'border border-marmol-200 bg-white')}>
        {sesion.estado === 'preparacion' && (
          <>
            <p className="text-3xl">🏁</p>
            <p className="mt-1 font-display text-xl font-semibold text-secundario">Preparando la carrera</p>
            <p className="mx-auto mt-1 max-w-xl text-sm text-marmol-600">
              {esFacilitador
                ? 'Comparte el código o el QR para que los equipos se inscriban. Cuando estén listos, empieza la ronda 1.'
                : 'Ya estás inscrito. Cuando el facilitador empiece, en la ronda 1 trabajen como sepan: esa es su línea base.'}
            </p>
          </>
        )}
        {info && (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-marca-600">{describirMomento({ estado: sesion.estado, ronda: sesion.rondaActual, fase }, sesion.totalRondas)}</p>
            <p className="mt-1 font-display text-2xl font-bold text-secundario">
              {info.emoji} {info.nombre}
            </p>
            <p className="mx-auto mt-1 max-w-xl text-sm text-marmol-600">
              {fase === 'hacer' && sesion.rondaActual === 1 && !esFacilitador ? 'Ronda de línea base: produzcan como sepan, sin mejoras todavía. ' : ''}
              {esFacilitador ? info.facilitador : info.jugador}
            </p>
            {fase === 'hacer' && (
              <div className="mt-3">
                <Cronometro key={sesion.cronometroInicio ?? 'parado'} inicio={sesion.cronometroInicio} duracionSeg={sesion.duracionRondaSeg} desfaseMs={desfaseMs} grande />
              </div>
            )}
          </>
        )}
        {sesion.estado === 'cerrado' && (
          <>
            <p className="text-3xl">🏆</p>
            <p className="mt-1 font-display text-2xl font-bold">¡Carrera terminada!</p>
            <p className="mx-auto mt-1 max-w-xl text-sm text-white/85">
              Miren la curva: así se ve la mejora continua. Cada estándar que adoptaron es una forma mejor de trabajar que ya no se pierde.
            </p>
          </>
        )}
      </div>

      {esFacilitador && <ControlFacilitador sesion={sesion} equipos={equipos} tarjetas={tarjetas} marcadores={marcadores} />}

      {miEquipo && <ZonaEquipo sesion={sesion} equipo={miEquipo} marcador={marcadores.get(miEquipo.id)!} />}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="card p-4">
          <h2 className="mb-3 font-display font-semibold text-secundario">🏆 Marcador</h2>
          <Marcador equipos={equipos} marcadores={marcadores} miEquipoId={miEquipoId} final={sesion.estado === 'cerrado'} />
        </section>
        <section className="card p-4">
          <h2 className="mb-3 font-display font-semibold text-secundario">📈 Curva de mejora</h2>
          <GraficaMejora equipos={equipos} marcadores={marcadores} totalRondas={sesion.totalRondas} unidad={sesion.unidad} destacadoId={miEquipoId} />
        </section>
      </div>

      {(sesion.estado === 'cerrado' || esFacilitador) && sesion.rondaActual > 1 && <HistoriaEquipos sesion={sesion} equipos={equipos} marcadores={marcadores} />}

      <details className="card p-4">
        <summary className="cursor-pointer font-display font-semibold text-secundario">🎲 Cómo se ganan puntos</summary>
        <ul className="mt-3 space-y-1.5 text-sm text-marmol-600">
          {REGLAS_PUNTOS.map((r) => (
            <li key={r.texto} className="flex gap-2">
              <span>{r.emoji}</span>
              <span>{r.texto}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

/** Rondas y fases de un vistazo: ✔ hechas, resaltada la actual. */
function BarraRondas({ sesion }: { sesion: SesionVista }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {Array.from({ length: sesion.totalRondas }, (_, i) => i + 1).map((r) => {
        const hecha = sesion.estado === 'cerrado' || r < sesion.rondaActual;
        const actual = sesion.estado === 'jugando' && r === sesion.rondaActual;
        return (
          <div
            key={r}
            className={cn(
              'min-w-[4.5rem] flex-1 rounded-xl border px-2 py-1.5 text-center',
              actual ? 'border-acento bg-amber-50' : hecha ? 'border-marca-200 bg-marca-50' : 'border-marmol-200 bg-white',
            )}
          >
            <p className={cn('text-[11px] font-semibold', actual ? 'text-secundario' : hecha ? 'text-marca-700' : 'text-marmol-400')}>
              {hecha ? '✔ ' : ''}Ronda {r}
            </p>
            <div className="mt-1 flex justify-center gap-0.5">
              {fasesDeRonda(r).map((f) => {
                const idx = fasesDeRonda(r).indexOf(f);
                const idxActual = actual && sesion.fase ? fasesDeRonda(r).indexOf(sesion.fase) : -1;
                return (
                  <span
                    key={f}
                    title={INFO_FASE[f].nombre}
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold',
                      hecha || (actual && idx < idxActual) ? 'bg-marca-500 text-white' : actual && idx === idxActual ? 'bg-acento text-secundario' : 'bg-marmol-100 text-marmol-400',
                    )}
                  >
                    {INFO_FASE[f].letra}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Lo que hace el jugador ahora mismo, según la fase de la carrera. */
function ZonaEquipo({ sesion, equipo, marcador }: { sesion: SesionVista; equipo: EquipoVista; marcador: MarcadorEquipo }) {
  const ronda = sesion.rondaActual;
  const r = marcador.rondas.find((x) => x.ronda === ronda);
  const anterior = marcador.rondas.find((x) => x.ronda === ronda - 1)?.resultado;
  const fase = sesion.estado === 'jugando' ? sesion.fase : null;

  return (
    <section className="card border-2 border-marca-200 p-4">
      <h2 className="font-display font-semibold text-secundario">
        {equipo.emoji} Mi equipo: {equipo.nombre}
      </h2>

      <div className="mt-3">
        {sesion.estado === 'preparacion' && (
          <p className="text-sm text-marmol-600">
            Producto: <strong>{sesion.producto}</strong>.{' '}
            {sesion.criterioCalidad && (
              <>
                Una unidad cuenta como buena si: <em>{sesion.criterioCalidad}</em>
              </>
            )}
          </p>
        )}

        {fase === 'planear' && (
          <TarjetaKaizen
            key={`${equipo.id}-${ronda}`}
            sesionId={sesion.id}
            equipoId={equipo.id}
            ronda={ronda}
            tarjeta={r?.tarjeta as TarjetaVista | undefined}
            anterior={anterior}
            unidad={sesion.unidad}
            editable
          />
        )}

        {fase === 'hacer' &&
          (ronda === 1 ? (
            <p className="text-sm text-marmol-600">Trabajen como sepan hacerlo. Al final cuentan cuántos {sesion.unidad} salen con calidad.</p>
          ) : r?.tarjeta ? (
            <div className="rounded-lg bg-marca-50/60 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-marca-700">En esta ronda prueban</p>
              <ResumenTarjeta tarjeta={r.tarjeta as TarjetaVista} unidad={sesion.unidad} compacto />
            </div>
          ) : (
            <p className="text-sm text-marmol-500">No llenaron tarjeta Kaizen: trabajen como en la ronda anterior.</p>
          ))}

        {fase === 'verificar' && (
          <div className="space-y-2">
            {sesion.criterioCalidad && (
              <p className="text-xs text-marmol-500">
                Cuenta como buena si: <em>{sesion.criterioCalidad}</em>
              </p>
            )}
            <FormularioResultado key={`${equipo.id}-${ronda}`} sesionId={sesion.id} equipoId={equipo.id} ronda={ronda} resultado={r?.resultado} unidad={sesion.unidad} />
            {r?.resultado && ronda > 1 && <ComparacionRonda ronda={r} anterior={anterior} unidad={sesion.unidad} />}
          </div>
        )}

        {fase === 'actuar' && (
          <div className="space-y-3">
            <ComparacionRonda ronda={r} anterior={anterior} unidad={sesion.unidad} />
            {r?.tarjeta ? (
              <Decision sesionId={sesion.id} equipoId={equipo.id} ronda={ronda} tarjeta={r.tarjeta as TarjetaVista} mejoraPct={r.mejoraPct} />
            ) : (
              <p className="text-sm text-marmol-500">No llenaron tarjeta Kaizen en esta ronda: no hay idea que estandarizar. ¡En la próxima sí!</p>
            )}
          </div>
        )}

        {sesion.estado === 'cerrado' && (
          <p className="text-sm text-marmol-600">
            Terminaron con <strong className="text-secundario">{marcador.total} puntos</strong>
            {marcador.mejoraTotalPct != null && (
              <>
                {' '}
                y una mejora de <strong className={marcador.mejoraTotalPct > 0 ? 'text-alto' : 'text-bajo'}>{formatearPct(marcador.mejoraTotalPct)}</strong> frente a su línea base
              </>
            )}
            .
          </p>
        )}
      </div>

      {marcador.estandares.length > 0 && (
        <div className="mt-4 rounded-xl bg-amber-50/70 p-3 ring-1 ring-amber-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-medio">⭐ Nuestros estándares: así trabajamos ahora</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-marmol-700">
            {marcador.estandares.map((t) => (
              <li key={t.ronda}>
                {t.idea} <span className="text-xs text-marmol-400">(R{t.ronda})</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

/** Resultado de la ronda frente a la anterior y frente a la predicción del equipo. */
function ComparacionRonda({
  ronda,
  anterior,
  unidad,
}: {
  ronda: MarcadorEquipo['rondas'][number] | undefined;
  anterior: ResultadoVista | undefined;
  unidad: string;
}) {
  if (!ronda?.resultado) return <p className="text-sm text-marmol-500">Todavía no registran el resultado de esta ronda.</p>;
  const { resultado, tarjeta, mejoraPct } = ronda;
  const error = tarjeta?.prediccion != null ? errorPrediccion(tarjeta.prediccion, resultado.unidades_buenas) : null;
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <Cifra titulo="Ronda anterior" valor={anterior ? String(anterior.unidades_buenas) : '—'} nota={unidad} />
      <Cifra titulo="Esta ronda" valor={String(resultado.unidades_buenas)} nota={`${resultado.defectos} con defecto`} tono="text-secundario" />
      <Cifra
        titulo="Cambio"
        valor={formatearPct(mejoraPct)}
        nota={error == null ? 'sin predicción' : error <= 0.1 ? `🎯 predijeron ${tarjeta!.prediccion}: ¡exacto!` : `predijeron ${tarjeta!.prediccion}`}
        tono={(mejoraPct ?? 0) > 0 ? 'text-alto' : (mejoraPct ?? 0) < 0 ? 'text-bajo' : 'text-marmol-500'}
      />
    </div>
  );
}

function Cifra({ titulo, valor, nota, tono = 'text-marmol-700' }: { titulo: string; valor: string; nota: string; tono?: string }) {
  return (
    <div className="rounded-xl bg-marmol-50 px-2 py-2">
      <p className="text-[10px] uppercase tracking-wide text-marmol-400">{titulo}</p>
      <p className={cn('font-display text-2xl font-bold', tono)}>{valor}</p>
      <p className="text-[10px] text-marmol-500">{nota}</p>
    </div>
  );
}

/** Fase Actuar: estandarizar o descartar la idea, con una sugerencia según los datos. */
function Decision({ sesionId, equipoId, ronda, tarjeta, mejoraPct }: { sesionId: string; equipoId: string; ronda: number; tarjeta: TarjetaVista; mejoraPct: number | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const decidir = (d: 'estandar' | 'descartada') =>
    startTransition(async () => {
      setError(null);
      const res = await decidirTarjeta(sesionId, equipoId, ronda, tarjeta.decision === d ? null : d);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });

  const sugerencia =
    mejoraPct == null
      ? 'Registren el resultado para saber si la idea funcionó.'
      : mejoraPct > 0
        ? 'Los datos dicen que mejoraron: lo coherente es volver la idea estándar.'
        : 'Los datos dicen que no mejoraron: lo coherente es descartarla (o ajustarla en la próxima ronda).';

  return (
    <div className="rounded-xl border border-marmol-200 p-3">
      <p className="text-sm">
        <span className="font-semibold text-marmol-700">💡 Su idea:</span> {tarjeta.idea || <em className="text-marmol-400">sin idea escrita</em>}
      </p>
      <p className="mt-1 text-xs text-marmol-500">{sugerencia}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => decidir('estandar')}
          className={cn('boton', tarjeta.decision === 'estandar' ? 'bg-acento text-secundario hover:bg-amber-300' : 'border border-amber-300 bg-white text-medio hover:bg-amber-50')}
        >
          ⭐ Volverla estándar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => decidir('descartada')}
          className={cn('boton', tarjeta.decision === 'descartada' ? 'bg-marmol-600 hover:bg-marmol-700' : 'border border-marmol-200 bg-white text-marmol-600 hover:bg-marmol-50')}
        >
          🗑️ Descartarla
        </button>
      </div>
      {tarjeta.decision && <p className="mt-2 text-xs text-alto">Decisión guardada. Pueden cambiarla mientras el facilitador no pase de fase.</p>}
      {error && <p className="mt-2 text-sm text-bajo">{error}</p>}
    </div>
  );
}

/** Todas las tarjetas de cada equipo, ronda por ronda: la historia de su mejora. */
function HistoriaEquipos({ sesion, equipos, marcadores }: { sesion: SesionVista; equipos: EquipoVista[]; marcadores: Map<string, MarcadorEquipo> }) {
  return (
    <section className="card p-4">
      <h2 className="font-display font-semibold text-secundario">📖 La historia de cada equipo</h2>
      <p className="text-xs text-marmol-500">Qué problema vio cada equipo, qué probó y qué pasó.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {equipos.map((e) => {
          const m = marcadores.get(e.id)!;
          const rondas = m.rondas.filter((r) => r.ronda > 1 && (r.tarjeta || r.resultado));
          return (
            <details key={e.id} className="rounded-xl border border-marmol-200 p-3" open={sesion.estado === 'cerrado' && equipos.length <= 2}>
              <summary className="cursor-pointer text-sm font-semibold text-marmol-800">
                {e.emoji} {e.nombre}{' '}
                <span className="font-normal text-marmol-400">
                  · {rondas.filter((r) => r.tarjeta).length} {rondas.filter((r) => r.tarjeta).length === 1 ? 'tarjeta Kaizen' : 'tarjetas Kaizen'}
                </span>
              </summary>
              <ol className="mt-2 space-y-2">
                {rondas.map((r) => (
                  <li key={r.ronda} className="rounded-lg bg-marmol-50 p-2 text-xs">
                    <p className="mb-1 flex flex-wrap items-center gap-2 font-semibold text-marmol-700">
                      Ronda {r.ronda}
                      <span className={cn((r.mejoraPct ?? 0) > 0 ? 'text-alto' : (r.mejoraPct ?? 0) < 0 ? 'text-bajo' : 'text-marmol-400')}>{formatearPct(r.mejoraPct)}</span>
                      {r.tarjeta?.decision === 'estandar' && <span className="rounded-full bg-amber-100 px-1.5 text-[10px] text-medio">⭐ estándar</span>}
                      {r.tarjeta?.decision === 'descartada' && <span className="rounded-full bg-marmol-200 px-1.5 text-[10px] text-marmol-600">descartada</span>}
                    </p>
                    {r.tarjeta ? <ResumenTarjeta tarjeta={r.tarjeta as TarjetaVista} unidad={sesion.unidad} compacto /> : <p className="text-marmol-400">Sin tarjeta.</p>}
                  </li>
                ))}
                {rondas.length === 0 && <li className="text-xs text-marmol-400">Aún sin rondas de mejora.</li>}
              </ol>
            </details>
          );
        })}
      </div>
    </section>
  );
}
