'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { eliminarOportunidad, guardarOportunidad, votarOportunidad, type DatosOportunidad } from '@/app/mudalab/actions';
import { CLAVES_MUDA, ESTADOS_OPORTUNIDAD, MUDAS, PUNTOS, type ClaveMuda, type EstadoOportunidad, type OportunidadMinima } from '@/lib/mudalab';
import { leerNumero } from '@/lib/proyectos';
import { cn } from '@/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';

interface EquipoMin {
  id: string;
  nombre: string;
  emoji: string;
}

const VACIA = { proceso: '', problema: '', muda: '' as ClaveMuda | '', evidencia: '', causa: '', idea: '', estado: 'idea' as EstadoOportunidad, resultado: '', minutos: '' };

/** Mundo 2: cada persona registra Mudas reales de su trabajo y vota las de otros equipos. */
export function BancoOportunidades({
  sesionId,
  oportunidades,
  equipos,
  miEquipoId,
  miJugadorId,
  esFacilitador,
  abierto,
}: {
  sesionId: string;
  oportunidades: OportunidadMinima[];
  equipos: EquipoMin[];
  miEquipoId: string | null;
  miJugadorId: string | null;
  esFacilitador: boolean;
  abierto: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState(VACIA);
  const [editando, setEditando] = useState<string | null>(null);
  const [formulario, setFormulario] = useState(false);
  const [filtro, setFiltro] = useState<ClaveMuda | ''>('');
  const [orden, setOrden] = useState<'votos' | 'recientes'>('votos');

  const lista = oportunidades
    .filter((o) => !filtro || o.muda === filtro)
    .sort((a, b) => (orden === 'votos' ? (b.votos?.length ?? 0) - (a.votos?.length ?? 0) : 0) || b.created_at.localeCompare(a.created_at));
  const conteo = CLAVES_MUDA.map((k) => ({ k, n: oportunidades.filter((o) => o.muda === k).length }));
  const minutos = oportunidades.reduce((s, o) => s + (Number(o.minutos_semana) || 0), 0);

  const ejecutar = (fn: () => Promise<{ ok: boolean; error?: string }>, despues?: () => void) => {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) return setError(r.error ?? 'Error');
      despues?.();
      router.refresh();
    });
  };

  const guardar = () => {
    const input: DatosOportunidad = {
      proceso: f.proceso,
      problema: f.problema,
      muda: f.muda as ClaveMuda,
      evidencia: f.evidencia,
      causa: f.causa,
      idea: f.idea,
      estado: f.estado,
      resultado: f.resultado,
      minutos_semana: f.minutos.trim() ? leerNumero(f.minutos) : null,
    };
    ejecutar(
      () => guardarOportunidad(sesionId, editando, input),
      () => {
        setF(VACIA);
        setEditando(null);
        setFormulario(false);
      },
    );
  };

  const editar = (o: OportunidadMinima) => {
    setF({
      proceso: o.proceso,
      problema: o.problema,
      muda: o.muda,
      evidencia: o.evidencia ?? '',
      causa: o.causa ?? '',
      idea: o.idea ?? '',
      estado: o.estado,
      resultado: o.resultado ?? '',
      minutos: o.minutos_semana == null ? '' : String(o.minutos_semana),
    });
    setEditando(o.id);
    setFormulario(true);
  };

  return (
    <section className="card space-y-4 p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1">
          <h2 className="font-display text-lg font-semibold text-secundario">🏦 Banco de oportunidades de mejora</h2>
          <p className="text-xs text-marmol-500">
            Mudas reales del trabajo de cada persona. +{PUNTOS.oportunidad} puntos por oportunidad (hasta {PUNTOS.maxOportunidades} por equipo) y +{PUNTOS.voto} por cada 👍 que reciban.
          </p>
        </div>
        {miEquipoId && abierto && !formulario && (
          <button type="button" onClick={() => setFormulario(true)} className="boton">
            + Registrar una Muda de mi trabajo
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg bg-marmol-50 p-2 text-center">
          <p className="font-display text-2xl font-bold text-secundario">{oportunidades.length}</p>
          <p className="text-[11px] text-marmol-500">oportunidades</p>
        </div>
        <div className="rounded-lg bg-marmol-50 p-2 text-center">
          <p className="font-display text-2xl font-bold text-secundario">{oportunidades.filter((o) => o.estado === 'implementada').length}</p>
          <p className="text-[11px] text-marmol-500">implementadas</p>
        </div>
        <div className="rounded-lg bg-marmol-50 p-2 text-center">
          <p className="font-display text-2xl font-bold text-secundario">{Math.round(minutos)}</p>
          <p className="text-[11px] text-marmol-500">minutos por semana que se pueden ahorrar</p>
        </div>
        <div className="rounded-lg bg-marmol-50 p-2 text-center">
          <p className="font-display text-2xl font-bold text-secundario">{oportunidades.reduce((s, o) => s + (o.votos?.length ?? 0), 0)}</p>
          <p className="text-[11px] text-marmol-500">votos 👍</p>
        </div>
      </div>

      {formulario && (
        <div className="space-y-3 rounded-xl border-2 border-secundario/30 bg-secundario/5 p-3">
          <p className="text-sm font-semibold text-secundario">{editando ? '✏️ Editar oportunidad' : '🏢 Mi proceso: registrar una Muda real'}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-medium text-marmol-600">
              Proceso o tarea *
              <input value={f.proceso} onChange={(e) => setF({ ...f, proceso: e.target.value })} placeholder="Ej. Legalizar viáticos" className="campo mt-1" />
            </label>
            <label className="text-xs font-medium text-marmol-600">
              Minutos por semana que se perderían (opcional)
              <input value={f.minutos} onChange={(e) => setF({ ...f, minutos: e.target.value })} inputMode="decimal" placeholder="Ej. 90" className="campo mt-1" />
            </label>
          </div>
          <label className="block text-xs font-medium text-marmol-600">
            ¿Qué problema ves? *
            <textarea value={f.problema} onChange={(e) => setF({ ...f, problema: e.target.value })} rows={2} placeholder="Ej. Cada mes imprimo los soportes, los escaneo y los vuelvo a enviar por correo." className="campo mt-1" />
          </label>
          <div>
            <p className="text-xs font-medium text-marmol-600">¿Qué Muda es? *</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {CLAVES_MUDA.map((k) => (
                <button key={k} type="button" title={MUDAS[k].que} onClick={() => setF({ ...f, muda: k })} className={cn('rounded-full px-2.5 py-1 text-xs', f.muda === k ? 'bg-secundario font-semibold text-white' : 'bg-white text-marmol-600 ring-1 ring-marmol-200')}>
                  {MUDAS[k].emoji} {MUDAS[k].nombre}
                </button>
              ))}
            </div>
            {f.muda && <p className="mt-1 text-[11px] text-marmol-500">{MUDAS[f.muda].que}</p>}
          </div>
          <label className="block text-xs font-medium text-marmol-600">
            Evidencia: enlace a la foto o al dato (Drive, OneDrive, WhatsApp)
            <input value={f.evidencia} onChange={(e) => setF({ ...f, evidencia: e.target.value })} placeholder="https://…" className="campo mt-1" />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-medium text-marmol-600">
              ¿Por qué pasa? (causa, pregunta varios porqués)
              <textarea value={f.causa} onChange={(e) => setF({ ...f, causa: e.target.value })} rows={2} className="campo mt-1" />
            </label>
            <label className="text-xs font-medium text-marmol-600">
              Idea de mejora
              <textarea value={f.idea} onChange={(e) => setF({ ...f, idea: e.target.value })} rows={2} className="campo mt-1" />
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-marmol-600">Estado</p>
              <div className="mt-1 flex gap-1">
                {(Object.keys(ESTADOS_OPORTUNIDAD) as EstadoOportunidad[]).map((k) => (
                  <button key={k} type="button" onClick={() => setF({ ...f, estado: k })} className={cn('rounded-full px-2.5 py-1 text-xs', f.estado === k ? 'bg-secundario font-semibold text-white' : 'bg-white text-marmol-600 ring-1 ring-marmol-200')}>
                    {ESTADOS_OPORTUNIDAD[k].emoji} {ESTADOS_OPORTUNIDAD[k].nombre}
                  </button>
                ))}
              </div>
            </div>
            {f.estado !== 'idea' && (
              <label className="text-xs font-medium text-marmol-600">
                Resultado
                <input value={f.resultado} onChange={(e) => setF({ ...f, resultado: e.target.value })} placeholder="Ej. Pasó de 40 a 10 minutos" className="campo mt-1" />
              </label>
            )}
          </div>
          {error && <p className="text-sm text-bajo">{error}</p>}
          <div className="flex gap-2">
            <button type="button" disabled={pending || !f.proceso.trim() || !f.problema.trim() || !f.muda} onClick={guardar} className="boton">
              {pending ? 'Guardando…' : '🏦 Guardar en el Banco'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormulario(false);
                setEditando(null);
                setF(VACIA);
              }}
              className="boton-secundario"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1">
        <button type="button" onClick={() => setFiltro('')} className={cn('rounded-full px-2.5 py-1 text-xs', !filtro ? 'bg-secundario font-semibold text-white' : 'bg-marmol-100 text-marmol-600')}>
          Todas
        </button>
        {conteo
          .filter((c) => c.n > 0)
          .map(({ k, n }) => (
            <button key={k} type="button" onClick={() => setFiltro(k)} className={cn('rounded-full px-2.5 py-1 text-xs', filtro === k ? 'bg-secundario font-semibold text-white' : 'bg-marmol-100 text-marmol-600')}>
              {MUDAS[k].emoji} {MUDAS[k].nombre} ({n})
            </button>
          ))}
        <select value={orden} onChange={(e) => setOrden(e.target.value as 'votos' | 'recientes')} className="campo ml-auto w-auto py-1 text-xs">
          <option value="votos">Más votadas</option>
          <option value="recientes">Más recientes</option>
        </select>
      </div>

      {error && !formulario && <p className="text-sm text-bajo">{error}</p>}

      {lista.length === 0 ? (
        <p className="rounded-xl bg-marmol-50 p-6 text-center text-sm text-marmol-500">🕵️ Todavía no hay Mudas registradas. ¡Sean los primeros!</p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {lista.map((o) => {
            const e = equipos.find((x) => x.id === o.equipo_id);
            const mio = o.equipo_id === miEquipoId;
            const vote = miJugadorId ? o.votos?.includes(miJugadorId) : false;
            return (
              <article key={o.id} className="rounded-xl border border-marmol-200 bg-white p-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-2xl leading-none" title={MUDAS[o.muda].nombre}>
                    {MUDAS[o.muda].emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-marmol-800">{o.proceso}</p>
                    <p className="text-[11px] text-marmol-500">
                      {MUDAS[o.muda].nombre} · {e ? `${e.emoji} ${e.nombre}` : ''} · {ESTADOS_OPORTUNIDAD[o.estado].emoji} {ESTADOS_OPORTUNIDAD[o.estado].nombre}
                    </p>
                  </div>
                  {miEquipoId && !mio && abierto ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => ejecutar(() => votarOportunidad(sesionId, o.id))}
                      className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', vote ? 'bg-marca-600 text-white' : 'bg-marmol-100 text-marmol-600 hover:bg-marca-50')}
                      title={vote ? 'Quitar mi voto' : 'Votar esta oportunidad'}
                    >
                      👍 {o.votos?.length ?? 0}
                    </button>
                  ) : (
                    <span className="rounded-full bg-marmol-50 px-2.5 py-1 text-xs text-marmol-500">👍 {o.votos?.length ?? 0}</span>
                  )}
                </div>
                <p className="mt-2 text-marmol-700">{o.problema}</p>
                {o.causa && <p className="mt-1 text-xs text-marmol-600">🧩 <strong>Causa:</strong> {o.causa}</p>}
                {o.idea && <p className="mt-0.5 text-xs text-marmol-600">💡 <strong>Idea:</strong> {o.idea}</p>}
                {o.resultado && <p className="mt-0.5 text-xs text-alto">📈 {o.resultado}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-marmol-500">
                  {o.minutos_semana != null && Number(o.minutos_semana) > 0 && <span>⏱ {Number(o.minutos_semana)} min/semana</span>}
                  {o.evidencia && /^https?:\/\//.test(o.evidencia) && (
                    <a href={o.evidencia} target="_blank" rel="noopener noreferrer" className="text-marca-600 hover:underline">
                      📎 Evidencia
                    </a>
                  )}
                  {((mio && abierto) || esFacilitador) && (
                    <span className="ml-auto flex gap-2">
                      {mio && abierto && (
                        <button type="button" onClick={() => editar(o)} className="inline-flex items-center gap-1 hover:text-marca-600">
                          <Pencil size={11} /> Editar
                        </button>
                      )}
                      <button type="button" disabled={pending} onClick={() => ejecutar(() => eliminarOportunidad(sesionId, o.id))} className="inline-flex items-center gap-1 hover:text-bajo">
                        <Trash2 size={11} /> Borrar
                      </button>
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
