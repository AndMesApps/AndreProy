'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SEXOS, type AccionesEquipos, type Sexo } from '@/lib/juego';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Copy, Crown, Download, Pencil, Plus, Trash2, X } from 'lucide-react';

export interface EquipoPanel {
  id: string;
  nombre: string;
  emoji: string;
}

export interface JugadorPanel {
  id: string;
  nombre: string;
  equipo_id: string;
  cargo: string;
  es_lider: boolean;
  sexo: Sexo;
}

/**
 * Panel del facilitador: código y QR para unirse, apertura de la
 * inscripción, y los equipos con sus jugadores (crear, renombrar, mover,
 * eliminar, exportar).
 */
export function PanelEquipos({
  retoId,
  codigo,
  enlace,
  qrSvg,
  registroAbierto,
  equipos,
  jugadores,
  acciones,
  rutaCsv,
  avisoEliminar = 'Eliminar jugador (con sus cazas y propuestas)',
  abiertoInicial = true,
}: {
  retoId: string;
  codigo: string;
  enlace: string;
  qrSvg: string;
  registroAbierto: boolean;
  equipos: EquipoPanel[];
  jugadores: JugadorPanel[];
  /** Server actions del juego para equipos y jugadores. */
  acciones: AccionesEquipos;
  /** Enlace para descargar los jugadores en CSV. */
  rutaCsv: string;
  avisoEliminar?: string;
  /** Si el panel arranca desplegado. */
  abiertoInicial?: boolean;
}) {
  const { cambiarRegistroAbierto, crearEquipo, eliminarEquipo, eliminarJugador, moverJugador, renombrarEquipo } = acciones;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(abiertoInicial);
  const [copiado, setCopiado] = useState(false);
  const [nuevoEquipo, setNuevoEquipo] = useState('');
  const [editando, setEditando] = useState<{ id: string; nombre: string } | null>(null);
  const [confirmarBorrar, setConfirmarBorrar] = useState<string | null>(null);

  const ejecutar = (fn: () => Promise<{ ok: boolean; error?: string }>, despues?: () => void) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? 'Error');
      despues?.();
      router.refresh();
    });
  };

  const porSexo = (Object.keys(SEXOS) as Sexo[])
    .map((s) => ({ s, n: jugadores.filter((j) => j.sexo === s).length }))
    .filter((x) => x.n > 0);

  return (
    <div className="card overflow-hidden">
      <button type="button" onClick={() => setAbierto((a) => !a)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="font-display font-semibold text-secundario">👥 Equipos y jugadores</span>
        <span className="text-xs text-marmol-500">
          {equipos.length} {equipos.length === 1 ? 'equipo' : 'equipos'} · {jugadores.length} {jugadores.length === 1 ? 'jugador' : 'jugadores'}
        </span>
        <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold', registroAbierto ? 'bg-marca-100 text-marca-700' : 'bg-marmol-100 text-marmol-500')}>
          {registroAbierto ? 'Inscripción abierta' : 'Inscripción cerrada'}
        </span>
        <ChevronDown size={16} className={cn('text-marmol-400 transition', abierto && 'rotate-180')} />
      </button>

      {abierto && (
        <div className="grid gap-5 border-t border-marmol-100 p-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Cómo unirse */}
          <div className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-marmol-400">Para unirse</p>
            <p className="font-display text-4xl font-bold tracking-[0.25em] text-secundario">{codigo}</p>
            <div className="mx-auto w-44 rounded-xl border border-marmol-200 bg-white p-2" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <p className="break-all text-[11px] text-marmol-400">{enlace}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(enlace);
                    setCopiado(true);
                    setTimeout(() => setCopiado(false), 2000);
                  } catch {
                    // Sin permiso de portapapeles: el enlace sigue visible arriba.
                  }
                }}
                className="boton-secundario px-3 py-1.5 text-xs"
              >
                {copiado ? <Check size={13} /> : <Copy size={13} />} {copiado ? 'Copiado' : 'Copiar enlace'}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => ejecutar(() => cambiarRegistroAbierto(retoId, !registroAbierto))}
                className="boton-secundario px-3 py-1.5 text-xs"
              >
                {registroAbierto ? 'Cerrar inscripción' : 'Abrir inscripción'}
              </button>
            </div>
          </div>

          {/* Equipos */}
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={nuevoEquipo}
                onChange={(e) => setNuevoEquipo(e.target.value)}
                maxLength={40}
                placeholder="Nombre de un equipo nuevo"
                className="campo max-w-xs flex-1 py-1.5"
              />
              <button
                type="button"
                disabled={pending || nuevoEquipo.trim().length < 2}
                onClick={() => ejecutar(() => crearEquipo(retoId, nuevoEquipo), () => setNuevoEquipo(''))}
                className="boton px-3 py-1.5"
              >
                <Plus size={14} /> Crear equipo
              </button>
              {jugadores.length > 0 && (
                <a href={rutaCsv} className="boton-secundario ml-auto px-3 py-1.5 text-xs">
                  <Download size={13} /> Descargar jugadores (Excel)
                </a>
              )}
            </div>
            {porSexo.length > 0 && (
              <p className="text-xs text-marmol-500">
                {porSexo.map((x) => `${SEXOS[x.s]}: ${x.n}`).join(' · ')} · Líderes: {jugadores.filter((j) => j.es_lider).length}
              </p>
            )}
            {error && <p className="text-sm text-bajo">{error}</p>}

            {equipos.length === 0 ? (
              <p className="rounded-lg bg-marmol-50 p-4 text-sm text-marmol-500">
                Aún no hay equipos. Puedes crearlos aquí, o dejar que el primer jugador de cada equipo lo cree al inscribirse.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {equipos.map((e) => {
                  const miembros = jugadores.filter((j) => j.equipo_id === e.id);
                  return (
                    <div key={e.id} className="rounded-xl border border-marmol-200 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{e.emoji}</span>
                        {editando?.id === e.id ? (
                          <>
                            <input
                              autoFocus
                              value={editando.nombre}
                              onChange={(ev) => setEditando({ id: e.id, nombre: ev.target.value })}
                              maxLength={40}
                              className="campo flex-1 px-2 py-1"
                            />
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => ejecutar(() => renombrarEquipo(retoId, e.id, editando.nombre), () => setEditando(null))}
                              className="text-marca-600"
                              title="Guardar"
                            >
                              <Check size={15} />
                            </button>
                            <button type="button" onClick={() => setEditando(null)} className="text-marmol-400" title="Cancelar">
                              <X size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="min-w-0 flex-1 truncate font-semibold text-marmol-800">{e.nombre}</span>
                            <span className="text-xs text-marmol-400">{miembros.length}</span>
                            <button type="button" onClick={() => setEditando({ id: e.id, nombre: e.nombre })} className="text-marmol-300 hover:text-secundario" title="Renombrar">
                              <Pencil size={13} />
                            </button>
                            {miembros.length === 0 && (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => ejecutar(() => eliminarEquipo(retoId, e.id))}
                                className="text-marmol-300 hover:text-bajo"
                                title="Eliminar equipo vacío"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      <ul className="mt-2 space-y-1">
                        {miembros.length === 0 && <li className="text-xs text-marmol-400">Sin jugadores todavía.</li>}
                        {miembros.map((j) => (
                          <li key={j.id} className="group flex items-center gap-1.5 text-xs">
                            {j.es_lider ? <Crown size={12} className="shrink-0 text-acento" aria-label="Líder" /> : <span className="w-3" />}
                            <span className="min-w-0 flex-1 truncate text-marmol-700" title={j.cargo}>
                              {j.nombre} <span className="text-marmol-400">· {j.cargo}</span>
                            </span>
                            {confirmarBorrar === j.id ? (
                              <>
                                <button type="button" disabled={pending} onClick={() => ejecutar(() => eliminarJugador(retoId, j.id), () => setConfirmarBorrar(null))} className="font-semibold text-bajo">
                                  Eliminar
                                </button>
                                <button type="button" onClick={() => setConfirmarBorrar(null)} className="text-marmol-400">
                                  No
                                </button>
                              </>
                            ) : (
                              <>
                                {equipos.length > 1 && (
                                  <select
                                    value=""
                                    disabled={pending}
                                    onChange={(ev) => ev.target.value && ejecutar(() => moverJugador(retoId, j.id, ev.target.value))}
                                    className="w-5 cursor-pointer appearance-none bg-transparent text-marmol-300 hover:text-secundario"
                                    title="Mover a otro equipo"
                                    aria-label="Mover a otro equipo"
                                  >
                                    <option value="">⇄</option>
                                    {equipos
                                      .filter((o) => o.id !== e.id)
                                      .map((o) => (
                                        <option key={o.id} value={o.id}>
                                          {o.emoji} {o.nombre}
                                        </option>
                                      ))}
                                  </select>
                                )}
                                <button type="button" onClick={() => setConfirmarBorrar(j.id)} className="text-marmol-300 hover:text-bajo" title={avisoEliminar}>
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
