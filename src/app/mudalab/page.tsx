import Link from 'next/link';
import { getFacilitador } from '@/lib/auth';
import { getMisRetosComoJugador } from '@/lib/jugador';
import { db } from '@/lib/supabase/server';
import { nombresCreadores } from '@/lib/usuarios';
import { CASO, CLAVES_MUDA, MISIONES_ML, MUDAS, NIVELES_MADUREZ, ROLES_ML } from '@/lib/mudalab';
import { cn } from '@/lib/utils';
import { FormularioCaso } from '@/components/mudalab/formulario-caso';
import { UnirseCodigo } from '@/components/juego/unirse-codigo';
import { EnlaceAyuda } from '@/components/manual/enlace-ayuda';

export const metadata = { title: 'MudaLab' };

const ESTADO = {
  preparacion: { t: 'Preparación', c: 'bg-marmol-100 text-marmol-600' },
  jugando: { t: 'En juego', c: 'bg-orange-100 text-orange-700' },
  cerrado: { t: '🏆 Cerrado', c: 'bg-marca-100 text-marca-700' },
} as const;

export default async function MudaLab() {
  const facilitador = await getFacilitador();
  const sb = db();
  let consulta = sb.from('ml_sesiones').select('id, codigo, titulo, estado, mision_actual, creado_por, created_at').order('created_at', { ascending: false });
  if (facilitador?.rol === 'lider') consulta = consulta.eq('creado_por', facilitador.id);
  else if (!facilitador) {
    const mias = (await getMisRetosComoJugador('mudalab')).map((r) => r.reto_id);
    consulta = consulta.in('id', mias.length ? mias : ['00000000-0000-0000-0000-000000000000']);
  }
  const { data: sesiones } = await consulta;
  const lista = (sesiones ?? []) as any[];
  const ids = lista.map((s) => s.id as string);
  const { data: equipos } = ids.length ? await sb.from('ml_equipos').select('sesion_id').in('sesion_id', ids) : { data: [] };
  const esAdmin = facilitador?.rol === 'admin';
  const creadores = esAdmin ? await nombresCreadores(lista.map((s) => s.creado_por)) : new Map<string, string>();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-degradado px-6 py-7 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-6 -top-8 select-none text-[9rem] leading-none opacity-15" aria-hidden>
          🕵️
        </div>
        <div className="relative max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-acento">Juego por equipos · Lean y DMAIC</p>
            <EnlaceAyuda seccion="mudalab" claro />
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold">MudaLab — La misión de recuperar el flujo</h1>
          <p className="mt-2 text-sm text-white/85">
            Cada equipo es una agencia de detectives. Reciben el expediente de un proceso enredado, van al Gemba, cazan las 8 Mudas, encuentran la causa raíz, experimentan
            soluciones con presupuesto y evitan que la Muda regrese. Y al final cazan las Mudas de su propio trabajo.
          </p>
          <div className="mt-5">
            <p className="mb-1.5 text-xs font-semibold text-white/80">¿Te dieron un código? Escríbelo aquí:</p>
            <UnirseCodigo rutaJuego="/mudalab" />
          </div>
          {facilitador && (
            <div className="mt-4">
              <FormularioCaso />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display font-semibold text-secundario">{esAdmin ? 'Todos los casos' : facilitador ? 'Mis casos' : 'Casos en los que juego'}</h2>
        {lista.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-3xl">🕵️</p>
            <p className="mt-2 text-sm font-medium text-marmol-700">{facilitador ? 'Todavía no hay casos MudaLab' : 'Aún no te has unido a ningún caso'}</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {lista.map((s) => (
              <Link key={s.id} href={`/mudalab/${s.id}`} className="card group p-4 transition hover:-translate-y-0.5 hover:border-marca-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', ESTADO[s.estado as keyof typeof ESTADO].c)}>
                    {s.estado === 'jugando' ? (s.mision_actual <= 5 ? `${MISIONES_ML[s.mision_actual - 1]?.fase} abierta` : '🏢 Mi proceso') : ESTADO[s.estado as keyof typeof ESTADO].t}
                  </span>
                  {facilitador && <span className="font-mono text-xs font-semibold tracking-widest text-marmol-500">{s.codigo}</span>}
                </div>
                <h3 className="mt-2 font-medium text-marmol-900 group-hover:text-secundario">{s.titulo}</h3>
                <p className="text-xs text-marmol-500">
                  📁 {CASO.nombre} · {((equipos ?? []) as any[]).filter((e) => e.sesion_id === s.id).length} equipos
                </p>
                {esAdmin && <p className="text-[11px] text-marmol-400">Creado por {creadores.get(s.creado_por) ?? '—'}</p>}
                <div className="mt-3 flex gap-1">
                  {MISIONES_ML.map((m) => (
                    <div key={m.numero} className={cn('h-1.5 flex-1 rounded-full', s.estado === 'cerrado' || m.numero <= s.mision_actual ? 'bg-marca-500' : 'bg-marmol-200')} />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="card space-y-4 p-5">
        <h2 className="font-display font-semibold text-secundario">📚 Cómo se juega</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MISIONES_ML.map((m) => (
            <div key={m.numero} className="rounded-xl border border-marmol-200 bg-marmol-50/60 p-3">
              <p className="text-sm font-semibold text-marmol-800">
                {m.emoji} {m.numero <= 5 ? `Misión ${m.numero} · ${m.fase}` : 'Mundo 2 · Mi proceso'} <span className="font-normal text-marmol-400">{m.titulo}</span>
              </p>
              <p className="mt-1 text-xs text-marmol-600">{m.reto}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-sm font-semibold text-marmol-800">👾 Los 8 enemigos del flujo</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CLAVES_MUDA.map((k) => (
              <div key={k} className="rounded-lg bg-marmol-50 p-2 text-xs">
                <p className="font-semibold text-marmol-800">
                  {MUDAS[k].emoji} {MUDAS[k].nombre}
                </p>
                <p className="italic text-marmol-500">{MUDAS[k].enemigo}</p>
                <p className="text-marmol-600">{MUDAS[k].que}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-marmol-800">🪜 Escalera de madurez</p>
            <ol className="mt-1 space-y-0.5 text-xs text-marmol-600">
              {NIVELES_MADUREZ.map((n) => (
                <li key={n.nivel}>
                  {n.emoji} <strong>{n.nivel}. {n.nombre}:</strong> {n.ayuda}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="text-sm font-semibold text-marmol-800">👥 Roles que rotan en cada misión</p>
            <div className="mt-1 space-y-1">
              {ROLES_ML.map((r) => (
                <p key={r.nombre} className="text-xs text-marmol-600">
                  {r.emoji} <strong>{r.nombre}:</strong> {r.tarea}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
