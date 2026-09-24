'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { agruparHallazgos, calcularMetricas, contarTraspasos, DESPERDICIOS, TIPOS_DESPERDICIO } from '@/lib/makigami';
import { AnalisisProceso } from './analisis-proceso';
import { EditorCarriles } from './editor-carriles';
import { EtapasReto } from './etapas-reto';
import { FormularioPaso } from './formulario-paso';
import { MapaMakigami } from './mapa-makigami';
import { PanelCaceria } from './panel-caceria';
import { RankingReto } from './ranking-reto';
import { X } from 'lucide-react';
import { Rediseno } from './rediseno';
import type { CarrilVista, CazaVista, EquipoVista, Hallazgo, JugadorVista, PasoVista, PropuestaVista, RetoVista } from './tipos';

/** Cada cuánto se refresca el tablero para ver en vivo lo que hacen los demás equipos. */
const REFRESCO_MS = 8000;

export function TableroMakigami({
  reto,
  carriles,
  pasos,
  cazas,
  propuestas,
  equipos,
  jugadores,
  miJugadorId,
  esFacilitador,
  puntosEntregados,
  diasRestantes,
}: {
  reto: RetoVista;
  carriles: CarrilVista[];
  pasos: PasoVista[];
  cazas: CazaVista[];
  propuestas: PropuestaVista[];
  equipos: EquipoVista[];
  jugadores: JugadorVista[];
  miJugadorId: string | null;
  esFacilitador: boolean;
  puntosEntregados: boolean;
  diasRestantes: number | null;
}) {
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [nuevoPaso, setNuevoPaso] = useState<{ carrilId: string } | null>(null);
  const [pasosAtenuados, setPasosAtenuados] = useState<Set<string>>(new Set());
  const [aviso, setAviso] = useState<string | null>(null);
  const [contadorNuevo, setContadorNuevo] = useState(0);
  const router = useRouter();

  // En un taller todos juegan a la vez: refresca el tablero cada pocos
  // segundos (solo con la pestaña visible y fuera del mapeo del facilitador).
  const enVivo = reto.estado === 'caceria' || reto.estado === 'rediseno' || (reto.estado === 'mapeo' && !esFacilitador);
  useEffect(() => {
    if (!enVivo) return;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, REFRESCO_MS);
    return () => clearInterval(t);
  }, [enVivo, router]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  const editandoMapa = reto.estado === 'mapeo' && esFacilitador;
  const hallazgosPorPaso = useMemo(() => {
    const m = new Map<string, Hallazgo[]>();
    for (const h of agruparHallazgos(cazas)) {
      const lista = m.get(h.pasoId) ?? [];
      lista.push(h as Hallazgo);
      m.set(h.pasoId, lista);
    }
    return m;
  }, [cazas]);

  const metricas = useMemo(() => calcularMetricas(pasos), [pasos]);
  const traspasos = useMemo(() => contarTraspasos(pasos), [pasos]);
  const cazadores = new Set(cazas.map((c) => c.jugador_id)).size;
  const misCazas = miJugadorId ? cazas.filter((c) => c.jugador_id === miJugadorId).length : 0;
  const onSimulacion = useCallback((s: Set<string>) => setPasosAtenuados(s), []);

  const seleccionado = pasos.find((p) => p.id === seleccionadoId) ?? null;

  // Esc cierra el detalle del paso (fuera del mapeo, donde el formulario tiene su propio "Cancelar").
  useEffect(() => {
    if (!seleccionadoId || editandoMapa) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSeleccionadoId(null);
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [seleccionadoId, editandoMapa]);
  const numeroSeleccionado = seleccionado ? pasos.indexOf(seleccionado) + 1 : 0;

  // Resumen de la cacería: qué desperdicio se vio más
  const porTipo = TIPOS_DESPERDICIO.map((t) => ({ tipo: t, n: cazas.filter((c) => c.tipo_desperdicio === t).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);

  return (
    <div className="space-y-5">
      <EtapasReto retoId={reto.id} estado={reto.estado} esFacilitador={esFacilitador} />

      {reto.estado === 'caceria' && (
        <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 px-4 py-3 text-sm text-marmol-700 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-lg">🎯</span>
          <span className="flex-1 min-w-[16rem]">
            <strong className="text-secundario">¡La cacería está abierta!</strong> Toca cualquier paso del tablero y marca los desperdicios que veas. Si eres el primero en
            ver uno y el equipo lo confirma, ganas puntos extra.
          </span>
          {miJugadorId && <span className="font-semibold text-bajo">Llevas {misCazas} {misCazas === 1 ? 'caza' : 'cazas'}</span>}
          {diasRestantes !== null && (
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-medio shadow-sm">
              {diasRestantes > 1 ? `⏰ Quedan ${diasRestantes} días` : diasRestantes === 1 ? '⏰ ¡Último día!' : diasRestantes === 0 ? '⏰ ¡Cierra hoy!' : '⏰ Fecha límite vencida'}
            </span>
          )}
        </div>
      )}
      {reto.estado === 'mapeo' && !esFacilitador && (
        <div className="rounded-xl border border-marmol-200 bg-white px-4 py-3 text-sm text-marmol-600">
          ✏️ El facilitador está dibujando el proceso. Cuando abra la cacería, esta pantalla se actualizará sola y podrás empezar a cazar desperdicios.
        </div>
      )}

      {pasos.length > 0 && <AnalisisProceso metricas={metricas} traspasos={traspasos} totalCazas={cazas.length} cazadores={cazadores} />}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="min-w-0 space-y-2">
          <MapaMakigami
            carriles={carriles}
            pasos={pasos}
            hallazgosPorPaso={hallazgosPorPaso}
            seleccionadoId={seleccionadoId}
            onSeleccionar={(id) => {
              setNuevoPaso(null);
              // Tocar otra vez el paso abierto cierra su detalle.
              setSeleccionadoId((actual) => (actual === id && !editandoMapa ? null : id));
            }}
            pasosAtenuados={pasosAtenuados}
            mostrarCalor={reto.estado !== 'mapeo'}
            onAgregarPaso={
              editandoMapa
                ? (carrilId) => {
                    setSeleccionadoId(null);
                    setNuevoPaso({ carrilId });
                  }
                : undefined
            }
          />
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-[11px] text-marmol-400">
            <span>
              <span className="inline-block w-5 border-t-2 border-dashed border-amber-600 align-middle" /> Traspaso entre áreas
            </span>
            {reto.estado !== 'mapeo' && <span>🔥 Brillo rojo = más desperdicios cazados</span>}
            <span>AV agrega valor · NAV-N necesaria · NAV desperdicio</span>
            {pasosAtenuados.size > 0 && <span>Atenuado = se eliminaría con las mejoras simuladas</span>}
          </div>
        </div>

        <aside className="card p-4 lg:sticky lg:top-20">
          {editandoMapa ? (
            nuevoPaso || seleccionado ? (
              <FormularioPaso
                key={seleccionado?.id ?? `nuevo-${nuevoPaso?.carrilId}-${contadorNuevo}`}
                retoId={reto.id}
                carriles={carriles}
                paso={seleccionado ? { ...seleccionado, orden: numeroSeleccionado } : undefined}
                carrilInicial={nuevoPaso?.carrilId}
                totalPasos={pasos.length}
                onListo={(accion) => {
                  if (accion === 'guardado' && nuevoPaso) {
                    // Deja el formulario abierto (y limpio) para seguir agregando pasos.
                    setContadorNuevo((n) => n + 1);
                    return;
                  }
                  setNuevoPaso(null);
                  setSeleccionadoId(null);
                }}
              />
            ) : (
              <EditorCarriles retoId={reto.id} carriles={carriles} />
            )
          ) : seleccionado ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setSeleccionadoId(null)}
                className="absolute -right-1 -top-1 rounded-md p-1.5 text-marmol-400 hover:bg-marmol-100 hover:text-marmol-700"
                aria-label="Cerrar detalle del paso"
                title="Cerrar (Esc)"
              >
                <X size={18} />
              </button>
              <div className="pr-7">
                <PanelCaceria
                  key={seleccionado.id}
                  retoId={reto.id}
                  paso={seleccionado}
                  numero={numeroSeleccionado}
                  carril={carriles.find((c) => c.id === seleccionado.carril_id)}
                  hallazgos={hallazgosPorPaso.get(seleccionado.id) ?? []}
                  miJugadorId={miJugadorId}
                  puedeCazar={reto.estado === 'caceria'}
                  onFeedback={setAviso}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-marmol-600">
                {reto.estado === 'caceria' ? '👈 Toca un paso del tablero para cazar sus desperdicios.' : '👈 Toca un paso del tablero para ver su detalle.'}
              </p>
              {porTipo.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-marmol-400 mb-1.5">Lo más cazado</p>
                  <ul className="space-y-1">
                    {porTipo.slice(0, 5).map((x) => (
                      <li key={x.tipo} className="flex items-center gap-2 text-sm">
                        <span>{DESPERDICIOS[x.tipo].emoji}</span>
                        <span className="flex-1 text-marmol-700">{DESPERDICIOS[x.tipo].nombre}</span>
                        <span className="font-semibold text-bajo">{x.n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {(reto.estado === 'rediseno' || reto.estado === 'cerrado') && pasos.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] items-start [&>*]:min-w-0">
          <Rediseno
            retoId={reto.id}
            estado={reto.estado}
            pasos={pasos}
            propuestas={propuestas}
            metricas={metricas}
            miJugadorId={miJugadorId}
            esFacilitador={esFacilitador}
            pasoSugerido={seleccionadoId}
            onSimulacion={onSimulacion}
          />
          <RankingReto cazas={cazas} propuestas={propuestas} jugadores={jugadores} equipos={equipos} miJugadorId={miJugadorId} puntosEntregados={puntosEntregados} />
        </div>
      ) : (
        <RankingReto cazas={cazas} propuestas={propuestas} jugadores={jugadores} equipos={equipos} miJugadorId={miJugadorId} puntosEntregados={puntosEntregados} enColumnas />
      )}

      {aviso && (
        <div key={aviso} className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl bg-secundario px-4 py-3 text-sm text-white shadow-2xl animate-entrar" role="status">
          {aviso}
        </div>
      )}
    </div>
  );
}
