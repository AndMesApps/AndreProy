import Link from 'next/link';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { getFacilitador, ROLES } from '@/lib/auth';
import { urlBase } from '@/lib/compartir';
import { db } from '@/lib/supabase/server';
import { ETAPAS_RETO, type EstadoReto } from '@/lib/makigami';
import { describirMomento } from '@/lib/kaizen';
import { SEMAFOROS, accionVencida, formatearValor, semaforo, ultimaMedicion, type AccionMinima, type ProcesoMinimo, type Semaforo } from '@/lib/procesos';
import { MiNombre } from '@/components/panel/mi-nombre';
import { ResumenProyectosPanel } from '@/components/proyectos/resumen-panel';
import { TarjetaCompartir } from '@/components/panel/tarjeta-compartir';
import { cn, formatearFecha } from '@/lib/utils';
import { ArrowRight, FileText } from 'lucide-react';

export const metadata = { title: 'Mi panel' };

/**
 * El "súper menú" del facilitador: lo que está en juego ahora (con códigos y
 * enlaces para compartir), sus juegos, el control de sus procesos, los
 * informes y la administración.
 */
export default async function PanelPage() {
  const facilitador = await getFacilitador();
  if (!facilitador) redirect('/ingresar');
  const esAdmin = facilitador.rol === 'admin';
  const sb = db();

  let consultaRetos = sb.from('mk_retos').select('id, codigo, titulo, estado, created_at, cerrado_en').order('created_at', { ascending: false }).limit(50);
  let consultaCarreras = sb
    .from('kz_sesiones')
    .select('id, codigo, titulo, estado, ronda_actual, fase, total_rondas, created_at, cerrado_en')
    .order('created_at', { ascending: false })
    .limit(50);
  let consultaProcesos = sb.from('pc_procesos').select('id, nombre, cliente, indicador, unidad, sentido, linea_base, meta, frecuencia').eq('activo', true).order('nombre');
  // El Administrador ve todo; el Líder, solo lo que creó.
  if (!esAdmin) {
    consultaRetos = consultaRetos.eq('creado_por', facilitador.id);
    consultaCarreras = consultaCarreras.eq('creado_por', facilitador.id);
    consultaProcesos = consultaProcesos.eq('creado_por', facilitador.id);
  }
  const [{ data: retos }, { data: carreras }, { data: procesos }] = await Promise.all([consultaRetos, consultaCarreras, consultaProcesos]);

  const idsProcesos = ((procesos ?? []) as any[]).map((p) => p.id as string);
  const [{ data: mediciones }, { data: acciones }] = idsProcesos.length
    ? await Promise.all([
        sb.from('pc_mediciones').select('proceso_id, fecha, valor').in('proceso_id', idsProcesos),
        sb.from('pc_acciones').select('id, proceso_id, titulo, estado, fecha_compromiso, responsable').in('proceso_id', idsProcesos),
      ])
    : [{ data: [] }, { data: [] }];

  // Juegos abiertos: los que hay que compartir.
  const base = await urlBase();
  const abiertos = [
    ...((retos ?? []) as any[])
      .filter((r) => r.estado !== 'cerrado')
      .map((r) => ({
        juego: '🎯 Cacería Makigami',
        id: r.id as string,
        titulo: r.titulo as string,
        codigo: r.codigo as string,
        estado: ETAPAS_RETO.find((e) => e.estado === (r.estado as EstadoReto))?.titulo ?? r.estado,
        ruta: `/makigami/${r.id}`,
        enlace: `${base}/makigami/unirse/${r.codigo}`,
        fecha: r.created_at as string,
      })),
    ...((carreras ?? []) as any[])
      .filter((s) => s.estado !== 'cerrado')
      .map((s) => ({
        juego: '🔁 Carrera Kaizen',
        id: s.id as string,
        titulo: s.titulo as string,
        codigo: s.codigo as string,
        estado: describirMomento({ estado: s.estado, ronda: s.ronda_actual, fase: s.fase }, s.total_rondas),
        ruta: `/kaizen/${s.id}`,
        enlace: `${base}/kaizen/unirse/${s.codigo}`,
        fecha: s.created_at as string,
      })),
  ]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 12);
  const compartibles = await Promise.all(
    abiertos.map(async (a) => ({ ...a, qrSvg: await QRCode.toString(a.enlace, { type: 'svg', margin: 1, color: { dark: '#312E81', light: '#ffffff' } }) })),
  );

  // Informes: los juegos más recientes (cerrados primero).
  const informes = [
    ...((retos ?? []) as any[]).map((r) => ({ juego: '🎯', id: r.id, titulo: r.titulo, ruta: `/makigami/${r.id}/informe`, cerrado: r.estado === 'cerrado', fecha: (r.cerrado_en ?? r.created_at) as string })),
    ...((carreras ?? []) as any[]).map((s) => ({ juego: '🔁', id: s.id, titulo: s.titulo, ruta: `/kaizen/${s.id}/informe`, cerrado: s.estado === 'cerrado', fecha: (s.cerrado_en ?? s.created_at) as string })),
  ]
    .sort((a, b) => Number(b.cerrado) - Number(a.cerrado) || b.fecha.localeCompare(a.fecha))
    .slice(0, 8);

  // Procesos con su semáforo y acciones vencidas.
  const filasProcesos = ((procesos ?? []) as any[]).map((p) => {
    const proc: ProcesoMinimo = { ...p, linea_base: p.linea_base == null ? null : Number(p.linea_base), meta: p.meta == null ? null : Number(p.meta) };
    const meds = ((mediciones ?? []) as any[]).filter((m) => m.proceso_id === p.id).map((m) => ({ fecha: m.fecha, valor: Number(m.valor) }));
    const acc = ((acciones ?? []) as any[]).filter((a) => a.proceso_id === p.id) as AccionMinima[];
    return {
      id: p.id as string,
      nombre: p.nombre as string,
      cliente: p.cliente as string | null,
      unidad: p.unidad as string,
      meta: proc.meta,
      sem: semaforo(proc, meds),
      ultima: ultimaMedicion(meds)?.valor ?? null,
      abiertas: acc.filter((a) => a.estado === 'pendiente' || a.estado === 'en_curso').length,
      vencidas: acc.filter((a) => accionVencida(a)),
    };
  });
  const conteoSemaforo = (s: Semaforo) => filasProcesos.filter((p) => p.sem === s).length;
  const vencidas = filasProcesos.flatMap((p) => p.vencidas.map((a) => ({ ...a, proceso: p.nombre, procesoId: p.id })));

  const kpis: [string, string | number, string, string?][] = [
    ['Juegos abiertos', abiertos.length, 'text-secundario', 'para compartir hoy'],
    ['Procesos activos', filasProcesos.length, 'text-secundario', `${conteoSemaforo('verde')} en meta`],
    ['Acciones abiertas', filasProcesos.reduce((s, p) => s + p.abiertas, 0), 'text-medio'],
    ['Acciones vencidas', vencidas.length, vencidas.length ? 'text-bajo' : 'text-alto'],
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-degradado px-6 py-6 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-acento">
          Mi panel · {ROLES[facilitador.rol]}
        </p>
        <MiNombre nombre={facilitador.nombre} sinNombre={facilitador.nombre === facilitador.email} />
        <p className="mt-1 text-sm text-white/85">Juegos para diagnosticar y entrenar, control para sostener. Todo lo de tus clientes en un solo lugar.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/proyectos" className="rounded-lg bg-acento px-3 py-2 text-sm font-semibold text-secundario shadow hover:brightness-105">
            🗂️ Mis proyectos
          </Link>
          <Link href="/makigami" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-secundario shadow hover:bg-marca-50">
            🎯 Nueva Cacería Makigami
          </Link>
          <Link href="/kaizen" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-secundario shadow hover:bg-marca-50">
            🔁 Nueva Carrera Kaizen
          </Link>
          <Link href="/procesos" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-secundario shadow hover:bg-marca-50">
            📊 Control de procesos
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map(([titulo, valor, tono, nota]) => (
          <div key={titulo} className="card p-3">
            <p className="text-[11px] font-medium text-marmol-500">{titulo}</p>
            <p className={cn('font-display text-2xl font-bold', tono)}>{valor}</p>
            {nota && <p className="text-[11px] text-marmol-400">{nota}</p>}
          </div>
        ))}
      </div>

      <ResumenProyectosPanel facilitador={facilitador} />

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-secundario">🔗 Para compartir</h2>
          <p className="text-xs text-marmol-400">Juegos abiertos: envía la invitación o proyecta el QR.</p>
        </div>
        {compartibles.length === 0 ? (
          <div className="card p-6 text-center text-sm text-marmol-500">
            No tienes juegos abiertos. Crea una <Link href="/makigami" className="font-semibold text-marca-600 hover:underline">Cacería Makigami</Link> o una{' '}
            <Link href="/kaizen" className="font-semibold text-marca-600 hover:underline">Carrera Kaizen</Link> y aquí aparecerán su código y su enlace.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {compartibles.map((a) => (
              <TarjetaCompartir key={a.id} juego={a.juego} titulo={a.titulo} estado={a.estado} codigo={a.codigo} enlace={a.enlace} qrSvg={a.qrSvg} ruta={a.ruta} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold text-secundario">📊 Mis procesos</h2>
            <Link href="/procesos" className="inline-flex items-center gap-1 text-xs font-semibold text-marca-600 hover:underline">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {filasProcesos.length > 0 && (
            <p className="mt-1 text-xs text-marmol-500">
              {(['verde', 'amarillo', 'rojo', 'gris'] as Semaforo[])
                .filter((s) => conteoSemaforo(s))
                .map((s) => `${SEMAFOROS[s].emoji} ${conteoSemaforo(s)} ${SEMAFOROS[s].nombre.toLowerCase()}`)
                .join(' · ')}
            </p>
          )}
          {filasProcesos.length === 0 ? (
            <p className="mt-3 text-sm text-marmol-500">
              Aún no tienes procesos. <Link href="/procesos" className="font-semibold text-marca-600 hover:underline">Crea el primero</Link> con su indicador y su meta.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-marmol-100">
              {filasProcesos.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <Link href={`/procesos/${p.id}`} className="flex items-center gap-2 py-2 text-sm hover:text-secundario">
                    <span title={SEMAFOROS[p.sem].nombre}>{SEMAFOROS[p.sem].emoji}</span>
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium text-marmol-800">{p.nombre}</span>
                      {p.cliente && <span className="text-xs text-marmol-400"> · {p.cliente}</span>}
                    </span>
                    <span className="text-xs text-marmol-500">
                      {formatearValor(p.ultima, p.unidad)}
                      {p.meta != null && <span className="text-marmol-400"> / {formatearValor(p.meta)}</span>}
                    </span>
                    {p.vencidas.length > 0 && <span className="rounded-full bg-red-100 px-1.5 text-[10px] font-semibold text-bajo">{p.vencidas.length} vencidas</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {vencidas.length > 0 && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-bajo ring-1 ring-red-200">
              <p className="font-semibold">⏰ Acciones vencidas</p>
              <ul className="mt-1 space-y-0.5">
                {vencidas.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link href={`/procesos/${a.procesoId}`} className="hover:underline">
                      {a.titulo} <span className="text-marmol-500">· {a.proceso}{a.fecha_compromiso && ` · ${formatearFecha(a.fecha_compromiso)}`}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-display text-lg font-semibold text-secundario">📄 Informes y opciones de mejora</h2>
          <p className="mt-0.5 text-xs text-marmol-500">Cada juego genera su informe para imprimir o guardar en PDF, y sus mejoras se envían al plan de acción.</p>
          {informes.length === 0 ? (
            <p className="mt-3 text-sm text-marmol-500">Aún no hay juegos.</p>
          ) : (
            <ul className="mt-3 divide-y divide-marmol-100">
              {informes.map((i) => (
                <li key={i.id}>
                  <Link href={i.ruta} className="flex items-center gap-2 py-2 text-sm hover:text-secundario">
                    <span>{i.juego}</span>
                    <span className="min-w-0 flex-1 truncate font-medium text-marmol-800">{i.titulo}</span>
                    <span className="text-[11px] text-marmol-400">{i.cerrado ? `cerrado ${formatearFecha(i.fecha)}` : 'en curso'}</span>
                    <FileText size={13} className="text-marca-600" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-secundario">🎲 Juegos</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <TarjetaJuego
            ruta="/makigami"
            emoji="🎯"
            nombre="Cacería Makigami"
            uso="Diagnosticar un proceso"
            descripcion="Mapea el proceso real, los equipos cazan los 8 desperdicios y proponen el rediseño. Sale con tiempo antes vs. después y mejoras aprobadas."
            total={(retos ?? []).length}
          />
          <TarjetaJuego
            ruta="/kaizen"
            emoji="🔁"
            nombre="Carrera Kaizen"
            uso="Entrenar la mejora continua"
            descripcion="Rondas PDCA cronometradas con una simulación en el salón: 5 porqués, una idea, predicción y estándar. Gana quien mejora con datos."
            total={(carreras ?? []).length}
          />
        </div>
        <p className="text-xs text-marmol-400">
          Para configurar un juego (proceso, rondas, tiempos, producto, criterio de calidad) ábrelo y usa “Editar datos”. Los equipos, la inscripción y los
          enlaces se manejan dentro de cada juego.
        </p>
      </section>

      {esAdmin && (
        <section className="card flex flex-wrap items-center gap-3 p-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-secundario">⚙️ Administración</h2>
            <p className="text-sm text-marmol-500">Crea las cuentas de Administradores y Líderes, y activa o desactiva su acceso.</p>
          </div>
          <Link href="/usuarios" className="boton">
            👥 Usuarios
          </Link>
        </section>
      )}
    </div>
  );
}

function TarjetaJuego({ ruta, emoji, nombre, uso, descripcion, total }: { ruta: string; emoji: string; nombre: string; uso: string; descripcion: string; total: number }) {
  return (
    <Link href={ruta} className="card group flex gap-3 p-4 transition hover:-translate-y-0.5 hover:border-marca-300 hover:shadow-md">
      <span className="text-4xl">{emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-marca-600">{uso}</span>
        <span className="block font-display text-lg font-semibold text-secundario group-hover:text-marca-600">{nombre}</span>
        <span className="mt-0.5 block text-sm text-marmol-500">{descripcion}</span>
        <span className="mt-2 block text-xs font-semibold text-marca-600">
          {total} {total === 1 ? 'juego' : 'juegos'} · Crear o ver →
        </span>
      </span>
    </Link>
  );
}
