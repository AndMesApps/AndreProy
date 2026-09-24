import Link from 'next/link';
import { getFacilitador } from '@/lib/auth';
import { nombresCreadores } from '@/lib/usuarios';
import { getMisRetosComoJugador } from '@/lib/jugador';
import { db } from '@/lib/supabase/server';
import { FormularioSesion } from '@/components/kaizen/formulario-sesion';
import { UnirseCodigo } from '@/components/juego/unirse-codigo';
import { FASES, INFO_FASE, REGLAS_PUNTOS, SIMULACIONES, describirMomento, formatearReloj, type EstadoSesion, type Fase } from '@/lib/kaizen';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Carrera Kaizen' };

const TONO_ESTADO: Record<EstadoSesion, string> = {
  preparacion: 'bg-marmol-100 text-marmol-600',
  jugando: 'bg-orange-100 text-orange-700',
  cerrado: 'bg-marca-100 text-marca-700',
};

export default async function KaizenPage() {
  const facilitador = await getFacilitador();
  const sb = db();

  // El Administrador ve todas las carreras; el Líder, las que creó; un jugador, solo en las que se registró desde este navegador.
  let consulta = sb
    .from('kz_sesiones')
    .select('id, codigo, titulo, producto, estado, ronda_actual, fase, total_rondas, created_at, creado_por')
    .order('created_at', { ascending: false });
  if (facilitador?.rol === 'lider') {
    consulta = consulta.eq('creado_por', facilitador.id);
  } else if (!facilitador) {
    const mias = (await getMisRetosComoJugador('kaizen')).map((r) => r.reto_id);
    consulta = consulta.in('id', mias.length ? mias : ['00000000-0000-0000-0000-000000000000']);
  }
  const { data: sesiones } = await consulta;

  const ids: string[] = (sesiones ?? []).map((s: any) => s.id);
  const [{ data: equipos }, { data: jugadores }] = ids.length
    ? await Promise.all([sb.from('kz_equipos').select('sesion_id').in('sesion_id', ids), sb.from('kz_jugadores').select('sesion_id').in('sesion_id', ids)])
    : [{ data: [] }, { data: [] }];
  const contar = (lista: any[] | null, id: string) => (lista ?? []).filter((x) => x.sesion_id === id).length;

  const esAdmin = facilitador?.rol === 'admin';
  const creadores = esAdmin ? await nombresCreadores((sesiones ?? []).map((s: any) => s.creado_por)) : new Map<string, string>();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-degradado px-6 py-7 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-6 -top-8 select-none text-[9rem] leading-none opacity-15" aria-hidden>
          🔁
        </div>
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-acento">Juego por equipos · Kaizen</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Carrera Kaizen</h1>
          <p className="mt-2 text-sm text-white/85">
            Los equipos producen en rondas cronometradas. Antes de cada ronda buscan la causa de sus problemas, eligen una mejora y predicen el resultado.
            Gana el equipo que mejora de verdad, medido con datos, no el que tiene más ideas.
          </p>
          <div className="mt-5">
            <p className="mb-1.5 text-xs font-semibold text-white/80">¿Te dieron un código? Escríbelo aquí:</p>
            <UnirseCodigo rutaJuego="/kaizen" />
          </div>
          {facilitador && (
            <div className="mt-4">
              <FormularioSesion />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display font-semibold text-secundario">{esAdmin ? 'Todas las carreras' : facilitador ? 'Mis carreras' : 'Carreras en las que juego'}</h2>
        {!sesiones || sesiones.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-3xl">🏁</p>
            <p className="mt-2 text-sm font-medium text-marmol-700">{facilitador ? 'Todavía no hay carreras' : 'Aún no te has unido a ninguna carrera'}</p>
            <p className="mt-1 text-xs text-marmol-400">
              {facilitador ? 'Crea la primera con “Nueva carrera” y elige una de las simulaciones sugeridas.' : 'Escribe arriba el código que te dio el facilitador.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sesiones.map((s: any) => (
              <Link key={s.id} href={`/kaizen/${s.id}`} className="card group p-4 transition hover:-translate-y-0.5 hover:border-marca-300 hover:shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', TONO_ESTADO[s.estado as EstadoSesion])}>
                    {describirMomento({ estado: s.estado, ronda: s.ronda_actual, fase: s.fase }, s.total_rondas)}
                  </span>
                  {facilitador && <span className="font-mono text-xs font-semibold tracking-widest text-marmol-500">{s.codigo}</span>}
                </div>
                <h3 className="mt-2 font-medium text-marmol-900 group-hover:text-secundario">{s.titulo}</h3>
                <p className="text-xs text-marmol-500">{s.producto}</p>
                {esAdmin && <p className="text-[11px] text-marmol-400">Creada por {creadores.get(s.creado_por) ?? '—'}</p>}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {(
                    [
                      [contar(equipos, s.id), 'equipos'],
                      [contar(jugadores, s.id), 'jugadores'],
                      [s.total_rondas, 'rondas'],
                    ] as [number, string][]
                  ).map(([n, etiqueta]) => (
                    <div key={etiqueta}>
                      <p className="font-display font-semibold text-secundario">{n}</p>
                      <p className="text-[10px] text-marmol-400">{etiqueta}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: s.total_rondas }, (_, i) => (
                    <div
                      key={i}
                      className={cn('h-1 flex-1 rounded-full', s.estado === 'cerrado' || i + 1 < s.ronda_actual ? 'bg-marca-500' : i + 1 === s.ronda_actual ? 'bg-acento' : 'bg-marmol-200')}
                    />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario">📚 Cómo se juega: cada ronda es un ciclo PDCA</h2>
        <p className="mt-1 text-sm text-marmol-500">
          Kaizen significa “cambio para mejor”: mejoras pequeñas, una a la vez, comprobadas con datos. La ronda 1 es la línea base: cada equipo trabaja como
          sabe. Desde la ronda 2, cada ronda recorre las cuatro fases:
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FASES.map((f: Fase) => (
            <div key={f} className="rounded-xl border border-marmol-200 bg-marmol-50/60 p-3">
              <p className="text-2xl">{INFO_FASE[f].emoji}</p>
              <p className="mt-1 text-sm font-semibold text-marmol-800">
                {INFO_FASE[f].letra} · {INFO_FASE[f].nombre}
              </p>
              <p className="mt-0.5 text-xs text-marmol-500">{INFO_FASE[f].jugador}</p>
            </div>
          ))}
        </div>
        <h3 className="mt-5 text-sm font-semibold text-marmol-800">🏆 Cómo se ganan puntos</h3>
        <ul className="mt-2 grid gap-1.5 text-xs text-marmol-600 sm:grid-cols-2">
          {REGLAS_PUNTOS.map((r) => (
            <li key={r.texto} className="flex gap-2">
              <span>{r.emoji}</span>
              <span>{r.texto}</span>
            </li>
          ))}
        </ul>
        {facilitador && (
          <>
            <h3 className="mt-5 text-sm font-semibold text-marmol-800">🧰 Simulaciones sugeridas para el taller</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {SIMULACIONES.map((s) => (
                <div key={s.nombre} className="rounded-xl border border-marmol-200 p-3 text-xs text-marmol-600">
                  <p className="text-sm font-semibold text-marmol-800">
                    {s.emoji} {s.nombre} <span className="font-normal text-marmol-400">· {formatearReloj(s.duracionSeg)} min por ronda</span>
                  </p>
                  <p className="mt-1">
                    <strong>Unidad buena:</strong> {s.criterio}
                  </p>
                  <p className="mt-0.5">
                    <strong>Materiales:</strong> {s.materiales}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
