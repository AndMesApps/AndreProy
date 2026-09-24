import Link from 'next/link';
import { getFacilitador } from '@/lib/auth';
import { nombresCreadores } from '@/lib/usuarios';
import { getMisRetosComoJugador } from '@/lib/jugador';
import { db } from '@/lib/supabase/server';
import { FormularioReto } from '@/components/makigami/formulario-reto';
import { UnirseCodigo } from '@/components/juego/unirse-codigo';
import { DESPERDICIOS, ETAPAS_RETO, TIPOS_DESPERDICIO, calcularMetricas, formatearDuracion, type Clasificacion, type EstadoReto } from '@/lib/makigami';
import { cn, formatearFecha } from '@/lib/utils';

export const metadata = { title: 'Cacería Makigami' };

const TONO_ESTADO: Record<EstadoReto, string> = {
  mapeo: 'bg-marmol-100 text-marmol-600',
  caceria: 'bg-orange-100 text-orange-700',
  rediseno: 'bg-blue-100 text-deber',
  cerrado: 'bg-marca-100 text-marca-700',
};

const ETIQUETA_ESTADO: Record<EstadoReto, string> = {
  mapeo: '✏️ En mapeo',
  caceria: '🎯 Cacería abierta',
  rediseno: '💡 En rediseño',
  cerrado: '🎉 Cerrado',
};

export default async function MakigamiPage() {
  const facilitador = await getFacilitador();
  const sb = db();

  // El Administrador ve todos los retos; el Líder, los que creó; un jugador, solo en los que se registró desde este navegador.
  let consulta = sb.from('mk_retos').select('id, codigo, titulo, estado, fecha_limite, created_at, creado_por').order('created_at', { ascending: false });
  if (facilitador?.rol === 'lider') {
    consulta = consulta.eq('creado_por', facilitador.id);
  } else if (!facilitador) {
    const misRetos = (await getMisRetosComoJugador()).map((r) => r.reto_id);
    consulta = consulta.in('id', misRetos.length ? misRetos : ['00000000-0000-0000-0000-000000000000']);
  }
  const { data: retos } = await consulta;

  const ids: string[] = (retos ?? []).map((r: any) => r.id);
  const [{ data: pasos }, { data: cazas }, { data: jugadores }, { data: equipos }] = ids.length
    ? await Promise.all([
        sb.from('mk_pasos').select('reto_id, id, tiempo_trabajo_min, tiempo_espera_min, clasificacion').in('reto_id', ids),
        sb.from('mk_cazas').select('reto_id').in('reto_id', ids),
        sb.from('mk_jugadores').select('reto_id').in('reto_id', ids),
        sb.from('mk_equipos').select('reto_id').in('reto_id', ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];
  const contar = (lista: any[] | null, retoId: string) => (lista ?? []).filter((x) => x.reto_id === retoId).length;

  // Al Administrador se le muestra quién creó cada reto.
  const esAdmin = facilitador?.rol === 'admin';
  const creadores = esAdmin ? await nombresCreadores((retos ?? []).map((r: any) => r.creado_por)) : new Map<string, string>();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-degradado px-6 py-7 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-6 -top-8 select-none text-[9rem] leading-none opacity-15" aria-hidden>
          🎯
        </div>
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-acento">Juego por equipos · Lean</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Cacería Makigami</h1>
          <p className="mt-2 text-sm text-white/85">
            Dibujamos un proceso real en un gran rollo de papel digital —quién hace qué, cuánto tarda, cuánto espera— y los equipos salen a cazar los
            desperdicios escondidos. Las mejores ideas se votan, se aprueban y muestran cuánto se puede encoger el proceso.
          </p>
          <div className="mt-5">
            <p className="mb-1.5 text-xs font-semibold text-white/80">¿Te dieron un código? Escríbelo aquí:</p>
            <UnirseCodigo rutaJuego="/makigami" />
          </div>
          {facilitador && (
            <div className="mt-4">
              <FormularioReto />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display font-semibold text-secundario">{esAdmin ? 'Todos los retos' : facilitador ? 'Mis retos' : 'Retos en los que juego'}</h2>
        {!retos || retos.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-3xl">🗺️</p>
            <p className="mt-2 text-sm font-medium text-marmol-700">{esAdmin ? 'Todavía no hay retos' : facilitador ? 'Todavía no has creado retos' : 'Aún no te has unido a ningún reto'}</p>
            <p className="mt-1 text-xs text-marmol-400">
              {facilitador ? 'Crea el primero con “Nuevo reto” y dibuja un proceso que todos conozcan.' : 'Escribe arriba el código que te dio el facilitador.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {retos.map((r: any) => {
              const pasosReto = (pasos ?? []).filter((p: any) => p.reto_id === r.id);
              const m = calcularMetricas(pasosReto.map((p: any) => ({ ...p, clasificacion: p.clasificacion as Clasificacion | null })));
              const idxEtapa = ETAPAS_RETO.findIndex((e) => e.estado === r.estado);
              const cifras: [number, string, string][] = [
                [contar(equipos, r.id), 'equipos', 'text-secundario'],
                [contar(jugadores, r.id), 'jugadores', 'text-secundario'],
                [pasosReto.length, 'pasos', 'text-marmol-700'],
                [contar(cazas, r.id), 'cazas', 'text-bajo'],
              ];
              return (
                <Link key={r.id} href={`/makigami/${r.id}`} className="card group p-4 transition hover:-translate-y-0.5 hover:border-marca-300 hover:shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', TONO_ESTADO[r.estado as EstadoReto])}>
                      {ETIQUETA_ESTADO[r.estado as EstadoReto]}
                    </span>
                    {facilitador && <span className="font-mono text-xs font-semibold tracking-widest text-marmol-500">{r.codigo}</span>}
                  </div>
                  <h3 className="mt-2 font-medium text-marmol-900 group-hover:text-secundario">{r.titulo}</h3>
                  {esAdmin && <p className="text-[11px] text-marmol-400">Creado por {creadores.get(r.creado_por) ?? '—'}</p>}
                  {r.fecha_limite && r.estado === 'caceria' && <p className="text-[11px] text-marmol-400">Cacería hasta el {formatearFecha(r.fecha_limite)}</p>}
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    {cifras.map(([n, etiqueta, tono]) => (
                      <div key={etiqueta}>
                        <p className={cn('font-display font-semibold', tono)}>{n}</p>
                        <p className="text-[10px] text-marmol-400">{etiqueta}</p>
                      </div>
                    ))}
                  </div>
                  {m.tiempoTotal > 0 && (
                    <p className="mt-2 text-xs text-marmol-500">
                      ⏱ {formatearDuracion(m.tiempoTotal)} de proceso · solo{' '}
                      <strong className="text-marca-700">{m.eficiencia < 1 ? '<1' : Math.round(m.eficiencia)}%</strong> agrega valor
                    </p>
                  )}
                  <div className="mt-3 flex gap-1">
                    {ETAPAS_RETO.map((e, i) => (
                      <div key={e.estado} className={cn('h-1 flex-1 rounded-full', i <= idxEtapa ? 'bg-marca-500' : 'bg-marmol-200')} />
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario">📚 Aprende a cazar: los 8 desperdicios en la oficina</h2>
        <p className="mt-1 text-sm text-marmol-500">
          Lean nació en la fábrica, pero los mismos desperdicios viven en los procesos administrativos. Un desperdicio es todo lo que consume tiempo o esfuerzo
          sin agregarle valor a quien recibe el resultado.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TIPOS_DESPERDICIO.map((t) => (
            <div key={t} className="rounded-xl border border-marmol-200 bg-marmol-50/60 p-3">
              <p className="text-2xl">{DESPERDICIOS[t].emoji}</p>
              <p className="mt-1 text-sm font-semibold text-marmol-800">{DESPERDICIOS[t].nombre}</p>
              <p className="mt-0.5 text-xs text-marmol-500">{DESPERDICIOS[t].ejemplo}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 text-xs text-marmol-600 sm:grid-cols-4">
          {ETAPAS_RETO.map((e, i) => (
            <div key={e.estado} className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secundario text-[11px] font-bold text-white">{i + 1}</span>
              <span>
                <strong className="text-marmol-800">{e.titulo}.</strong> {e.descripcion}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
