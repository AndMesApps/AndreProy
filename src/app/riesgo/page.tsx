import Link from 'next/link';
import { getFacilitador } from '@/lib/auth';
import { getMisRetosComoJugador } from '@/lib/jugador';
import { db } from '@/lib/supabase/server';
import { nombresCreadores } from '@/lib/usuarios';
import { CARTAS, COMPETENCIAS, CLAVES_COMPETENCIA, EMPRESA, MARCOS, PERFILES, RETOS, ROLES_RR, TABLA_PUNTOS, type Marco } from '@/lib/riesgo';
import { cn } from '@/lib/utils';
import { FormularioSesion } from '@/components/riesgo/formulario-sesion';
import { TableroRuta } from '@/components/riesgo/juego-riesgo';
import { UnirseCodigo } from '@/components/juego/unirse-codigo';
import { EnlaceAyuda } from '@/components/manual/enlace-ayuda';

export const metadata = { title: 'La Ruta del Riesgo' };

const ESTADO = {
  preparacion: { t: 'Preparación', c: 'bg-marmol-100 text-marmol-600' },
  jugando: { t: 'En juego', c: 'bg-orange-100 text-orange-700' },
  cerrado: { t: '🛡️ Cerrada', c: 'bg-marca-100 text-marca-700' },
} as const;

export default async function RutaDelRiesgo() {
  const facilitador = await getFacilitador();
  const sb = db();
  let consulta = sb.from('rr_sesiones').select('id, codigo, titulo, estado, reto_actual, marco, creado_por, created_at').order('created_at', { ascending: false });
  if (facilitador?.rol === 'lider') consulta = consulta.eq('creado_por', facilitador.id);
  else if (!facilitador) {
    const mias = (await getMisRetosComoJugador('riesgo')).map((r) => r.reto_id);
    consulta = consulta.in('id', mias.length ? mias : ['00000000-0000-0000-0000-000000000000']);
  }
  const { data: sesiones } = await consulta;
  const lista = (sesiones ?? []) as any[];
  const ids = lista.map((s) => s.id as string);
  const { data: equipos } = ids.length ? await sb.from('rr_equipos').select('sesion_id').in('sesion_id', ids) : { data: [] };
  const esAdmin = facilitador?.rol === 'admin';
  const creadores = esAdmin ? await nombresCreadores(lista.map((s) => s.creado_por)) : new Map<string, string>();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-degradado px-6 py-7 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-6 -top-8 select-none text-[9rem] leading-none opacity-15" aria-hidden>
          🗺️
        </div>
        <div className="relative max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-acento">Juego por equipos o individual · SAGRILAFT y SARLAFT</p>
            <EnlaceAyuda seccion="riesgo" claro />
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold">La Ruta del Riesgo</h1>
          <p className="mt-2 text-sm text-white/85">
            Un juego para aprender a detectar, prevenir y reportar riesgos de lavado de activos y financiación del terrorismo (LA/FT). No se memorizan normas: se
            reconocen señales, se hacen buenas preguntas y se activa la ruta correcta.
          </p>
          <p className="mt-2 text-sm italic text-white/90">{EMPRESA.lema}</p>
          <div className="mt-5">
            <p className="mb-1.5 text-xs font-semibold text-white/80">¿Te dieron un código? Escríbelo aquí:</p>
            <UnirseCodigo rutaJuego="/riesgo" />
          </div>
          {facilitador && (
            <div className="mt-4">
              <FormularioSesion />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display font-semibold text-secundario">{esAdmin ? 'Todas las sesiones' : facilitador ? 'Mis sesiones' : 'Sesiones en las que juego'}</h2>
        {lista.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-3xl">🗺️</p>
            <p className="mt-2 text-sm font-medium text-marmol-700">{facilitador ? 'Todavía no hay sesiones de La Ruta del Riesgo' : 'Aún no te has unido a ninguna sesión'}</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {lista.map((s) => (
              <Link key={s.id} href={`/riesgo/${s.id}`} className="card group p-4 transition hover:-translate-y-0.5 hover:border-marca-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', ESTADO[s.estado as keyof typeof ESTADO].c)}>
                    {s.estado === 'jugando' ? `Hasta el reto ${s.reto_actual}` : ESTADO[s.estado as keyof typeof ESTADO].t}
                  </span>
                  {facilitador && <span className="font-mono text-xs font-semibold tracking-widest text-marmol-500">{s.codigo}</span>}
                </div>
                <h3 className="mt-2 font-medium text-marmol-900 group-hover:text-secundario">{s.titulo}</h3>
                <p className="text-xs text-marmol-500">
                  {MARCOS[s.marco as Marco]?.nombre ?? s.marco} · {((equipos ?? []) as any[]).filter((e) => e.sesion_id === s.id).length} equipos
                </p>
                {esAdmin && <p className="text-[11px] text-marmol-400">Creada por {creadores.get(s.creado_por) ?? '—'}</p>}
                <div className="mt-3 flex gap-1">
                  {RETOS.map((r) => (
                    <div key={r.numero} className={cn('h-1.5 flex-1 rounded-full', s.estado === 'cerrado' || r.numero <= s.reto_actual ? 'bg-marca-500' : 'bg-marmol-200')} />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="card space-y-4 p-5">
        <h2 className="font-display font-semibold text-secundario">📚 Cómo se juega</h2>
        <p className="text-sm text-marmol-600">{EMPRESA.historia}</p>
        <TableroRuta hechos={[]} abiertos={8} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RETOS.map((r) => (
            <div key={r.numero} className="rounded-xl border border-marmol-200 bg-marmol-50/60 p-3">
              <p className="text-sm font-semibold text-marmol-800">
                {r.emoji} Reto {r.numero} · {r.titulo}
              </p>
              <p className="mt-1 text-xs text-marmol-600">{r.reto}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-marmol-800">🎯 Sistema de puntos</p>
            <table className="mt-1 w-full text-xs">
              <tbody>
                {TABLA_PUNTOS.map(([t, p]) => (
                  <tr key={t} className="border-t border-marmol-100">
                    <td className="py-0.5 text-marmol-600">{t}</td>
                    <td className={cn('text-right font-semibold', p > 0 ? 'text-alto' : 'text-bajo')}>{p > 0 ? `+${p}` : p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <p className="text-sm font-semibold text-marmol-800">🧩 Competencias que se evalúan</p>
            <ul className="mt-1 space-y-0.5 text-xs text-marmol-600">
              {CLAVES_COMPETENCIA.map((k) => (
                <li key={k}>
                  {COMPETENCIAS[k].emoji} <strong>{COMPETENCIAS[k].nombre}:</strong> {COMPETENCIAS[k].ayuda}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm font-semibold text-marmol-800">🏅 Perfiles</p>
            <ul className="mt-1 space-y-0.5 text-xs text-marmol-600">
              {Object.values(PERFILES).map((p) => (
                <li key={p.nombre}>
                  {p.emoji} <strong>{p.nombre}:</strong> {p.ayuda}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-marmol-800">🃏 Cartas de evento</p>
            <p className="mt-1 text-xs text-marmol-600">{CARTAS.map((c) => `${c.emoji} ${c.titulo}`).join(' · ')}</p>
            <p className="mt-2 text-sm font-semibold text-marmol-800">👥 Roles que rotan en cada reto</p>
            <div className="mt-1 space-y-1">
              {ROLES_RR.map((r) => (
                <p key={r.nombre} className="text-xs text-marmol-600">
                  {r.emoji} <strong>{r.nombre}:</strong> {r.tarea}
                </p>
              ))}
            </div>
          </div>
        </div>
        <p className="rounded-lg bg-marca-50 p-3 text-xs text-marmol-600">
          🛡️ <strong>Certificación Guardián del Riesgo:</strong> se entrega por dominio de competencias, no solo por puntos. Este diseño es un concepto de gamificación: las
          reglas, responsables, umbrales y rutas de reporte deben adaptarse a la normativa vigente, al tipo de entidad y al procedimiento interno de cada empresa.
        </p>
      </div>
    </div>
  );
}
