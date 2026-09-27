import Link from 'next/link';
import { getFacilitador } from '@/lib/auth';
import { nombresCreadores } from '@/lib/usuarios';
import { getMisRetosComoJugador } from '@/lib/jugador';
import { db } from '@/lib/supabase/server';
import { FormularioReto } from '@/components/mudagami/formulario-reto';
import { UnirseCodigo } from '@/components/juego/unirse-codigo';
import { EstacionIcono, PortadaMudaGami } from '@/components/mudagami/iconos';
import { CLAVES_ESTACION, ESTACIONES, ETAPAS_RETO, formatearPesos, calcularTabla1, type EstadoReto } from '@/lib/mudagami';
import { cn, formatearFecha } from '@/lib/utils';

export const metadata = { title: 'MudaGami · Kayou' };

const TONO_ESTADO: Record<EstadoReto, string> = {
  espera: 'bg-marmol-100 text-marmol-600',
  corrida_1: 'bg-orange-100 text-orange-700',
  rediseno: 'bg-blue-100 text-deber',
  corrida_2: 'bg-amber-100 text-medio',
  cerrado: 'bg-marca-100 text-marca-700',
};

const ETIQUETA_ESTADO: Record<EstadoReto, string> = {
  espera: '⏳ Por empezar',
  corrida_1: '🚚 Corrida 1',
  rediseno: '🔧 Rediseño',
  corrida_2: '🚚 Corrida 2',
  cerrado: '🎉 Cerrado',
};

export default async function MudaGamiPage() {
  const facilitador = await getFacilitador();
  const sb = db();

  let consulta = sb.from('mg_retos').select('id, codigo, titulo, estado, fecha_limite, created_at, creado_por').order('created_at', { ascending: false });
  if (facilitador?.rol === 'lider') {
    consulta = consulta.eq('creado_por', facilitador.id);
  } else if (!facilitador) {
    const misRetos = (await getMisRetosComoJugador('mudagami')).map((r) => r.reto_id);
    consulta = consulta.in('id', misRetos.length ? misRetos : ['00000000-0000-0000-0000-000000000000']);
  }
  const { data: retos } = await consulta;

  const ids: string[] = (retos ?? []).map((r: any) => r.id);
  const [{ data: equipos }, { data: jugadores }, { data: traslados }] = ids.length
    ? await Promise.all([
        sb.from('mg_equipos').select('reto_id').in('reto_id', ids),
        sb.from('mg_jugadores').select('reto_id').in('reto_id', ids),
        sb.from('mg_traslados').select('reto_id, medio, articulos').in('reto_id', ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const contar = (lista: any[] | null, retoId: string) => (lista ?? []).filter((x) => x.reto_id === retoId).length;

  const esAdmin = facilitador?.rol === 'admin';
  const creadores = esAdmin ? await nombresCreadores((retos ?? []).map((r: any) => r.creado_por)) : new Map<string, string>();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-degradado px-6 py-7 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-4 -top-4 hidden select-none opacity-20 sm:block" aria-hidden>
          <PortadaMudaGami className="h-32 w-52" />
        </div>
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-acento">Juego por equipos · Lean · la muda de transporte</p>
          <h1 className="mt-1 font-display text-3xl font-bold">MudaGami · Kayou</h1>
          <p className="mt-2 text-sm text-white/85">
            Cada equipo produce un lote de 15 piezas en una planta con 6 estaciones fijas. Cada vez que mueven algo entre estaciones que no quedan una al lado
            de la otra, usan el montacargas o la carretilla: eso es la muda de transporte. Miden, rediseñan su planta en 4 minutos y vuelven a producir para
            ver cuánto mejoraron.
          </p>
          <div className="mt-5">
            <p className="mb-1.5 text-xs font-semibold text-white/80">¿Te dieron un código? Escríbelo aquí:</p>
            <UnirseCodigo rutaJuego="/mudagami" />
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
            <p className="text-3xl">🚚</p>
            <p className="mt-2 text-sm font-medium text-marmol-700">{esAdmin ? 'Todavía no hay retos' : facilitador ? 'Todavía no has creado retos' : 'Aún no te has unido a ningún reto'}</p>
            <p className="mt-1 text-xs text-marmol-400">
              {facilitador ? 'Crea el primero con “Nuevo reto” y prepara los materiales físicos del taller.' : 'Escribe arriba el código que te dio el facilitador.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {retos.map((r: any) => {
              const idxEtapa = ETAPAS_RETO.findIndex((e) => e.estado === r.estado);
              const tabla = calcularTabla1((traslados ?? []).filter((t: any) => t.reto_id === r.id));
              const cifras: [number, string, string][] = [
                [contar(equipos, r.id), 'equipos', 'text-secundario'],
                [contar(jugadores, r.id), 'jugadores', 'text-secundario'],
                [tabla.traslados.montacargas + tabla.traslados.carretilla, 'traslados', 'text-bajo'],
              ];
              return (
                <Link key={r.id} href={`/mudagami/${r.id}`} className="card group p-4 transition hover:-translate-y-0.5 hover:border-marca-300 hover:shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', TONO_ESTADO[r.estado as EstadoReto])}>{ETIQUETA_ESTADO[r.estado as EstadoReto]}</span>
                    {facilitador && <span className="font-mono text-xs font-semibold tracking-widest text-marmol-500">{r.codigo}</span>}
                  </div>
                  <h3 className="mt-2 font-medium text-marmol-900 group-hover:text-secundario">{r.titulo}</h3>
                  {esAdmin && <p className="text-[11px] text-marmol-400">Creado por {creadores.get(r.creado_por) ?? '—'}</p>}
                  {r.fecha_limite && <p className="text-[11px] text-marmol-400">Hasta el {formatearFecha(r.fecha_limite)}</p>}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {cifras.map(([n, etiqueta, tono]) => (
                      <div key={etiqueta}>
                        <p className={cn('font-display font-semibold', tono)}>{n}</p>
                        <p className="text-[10px] text-marmol-400">{etiqueta}</p>
                      </div>
                    ))}
                  </div>
                  {tabla.costo > 0 && <p className="mt-2 text-xs text-marmol-500">💸 {formatearPesos(tabla.costo)} en transportes hasta ahora</p>}
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
        <h2 className="font-display font-semibold text-secundario">📚 Las 6 estaciones de la planta</h2>
        <p className="mt-1 text-sm text-marmol-500">
          La materia prima entra por un único punto y recorre estas estaciones fijas. Cuando dos pasos seguidos quedan lejos, hay que transportar — y eso
          cuesta tiempo y dinero.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CLAVES_ESTACION.map((e) => (
            <div key={e} className="flex items-center gap-3 rounded-xl border border-marmol-200 bg-marmol-50/60 p-3">
              <EstacionIcono estacion={e} size={36} />
              <p className="text-sm font-semibold text-marmol-800">{ESTACIONES[e].nombre}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
