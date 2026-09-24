import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getFacilitador } from '@/lib/auth';
import { nombresCreadores } from '@/lib/usuarios';
import { db } from '@/lib/supabase/server';
import { FormularioProceso } from '@/components/procesos/formulario-proceso';
import { SEMAFOROS, accionVencida, avanceMeta, formatearValor, semaforo, ultimaMedicion, type AccionMinima, type ProcesoMinimo } from '@/lib/procesos';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Control de procesos' };

export default async function ProcesosPage({ searchParams }: { searchParams: Promise<{ archivados?: string }> }) {
  const facilitador = await getFacilitador();
  if (!facilitador) redirect('/ingresar');
  const { archivados } = await searchParams;
  const verArchivados = archivados === '1';

  const sb = db();
  let consulta = sb
    .from('pc_procesos')
    .select('id, nombre, cliente, area, responsable, indicador, unidad, sentido, linea_base, meta, frecuencia, activo, creado_por')
    .eq('activo', !verArchivados)
    .order('cliente')
    .order('nombre');
  if (facilitador.rol !== 'admin') consulta = consulta.eq('creado_por', facilitador.id);
  const { data: procesos, error } = await consulta;

  const ids = (procesos ?? []).map((p: any) => p.id as string);
  const [{ data: mediciones }, { data: acciones }] = ids.length
    ? await Promise.all([
        sb.from('pc_mediciones').select('proceso_id, fecha, valor').in('proceso_id', ids),
        sb.from('pc_acciones').select('id, proceso_id, titulo, estado, fecha_compromiso, responsable').in('proceso_id', ids),
      ])
    : [{ data: [] }, { data: [] }];
  const creadores = facilitador.rol === 'admin' ? await nombresCreadores((procesos ?? []).map((p: any) => p.creado_por)) : new Map<string, string>();

  // Agrupados por cliente: así trabaja una consultora.
  const porCliente = new Map<string, any[]>();
  for (const p of (procesos ?? []) as any[]) {
    const k = p.cliente || 'Sin cliente';
    porCliente.set(k, [...(porCliente.get(k) ?? []), p]);
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-degradado px-6 py-7 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-6 -top-8 select-none text-[9rem] leading-none opacity-15" aria-hidden>
          📊
        </div>
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-acento">Mejora continua · Sostener</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Control de procesos</h1>
          <p className="mt-2 text-sm text-white/85">
            Los procesos de tus clientes con su indicador, la meta, las mediciones y el plan de acción. Las mejoras que salen de los juegos llegan aquí para
            que no se queden en el taller.
          </p>
          <div className="mt-4">
            <FormularioProceso />
          </div>
        </div>
      </div>

      {error && (
        <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-medio">
          No se pudo leer el Control de procesos. Si es la primera vez, falta correr la migración <strong>0004_procesos.sql</strong> en Supabase.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-secundario">{verArchivados ? 'Procesos archivados' : facilitador.rol === 'admin' ? 'Todos los procesos' : 'Mis procesos'}</h2>
        <Link href={verArchivados ? '/procesos' : '/procesos?archivados=1'} className="text-xs text-marmol-500 hover:text-marca-600">
          {verArchivados ? '← Ver activos' : 'Ver archivados'}
        </Link>
      </div>

      {!procesos || procesos.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-3xl">📊</p>
          <p className="mt-2 text-sm font-medium text-marmol-700">{verArchivados ? 'No hay procesos archivados' : 'Todavía no hay procesos'}</p>
          {!verArchivados && <p className="mt-1 text-xs text-marmol-400">Crea el primero con “Nuevo proceso”: nombre, indicador, línea base y meta.</p>}
        </div>
      ) : (
        [...porCliente.entries()].map(([cliente, lista]) => (
          <div key={cliente} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-marmol-400">🏢 {cliente}</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {lista.map((p) => {
                const meds = ((mediciones ?? []) as any[]).filter((m) => m.proceso_id === p.id).map((m) => ({ fecha: m.fecha, valor: Number(m.valor) }));
                const acc = ((acciones ?? []) as any[]).filter((a) => a.proceso_id === p.id) as (AccionMinima & { proceso_id: string })[];
                const proc: ProcesoMinimo = { ...p, linea_base: p.linea_base == null ? null : Number(p.linea_base), meta: p.meta == null ? null : Number(p.meta) };
                const sem = SEMAFOROS[semaforo(proc, meds)];
                const ultima = ultimaMedicion(meds);
                const avance = avanceMeta(proc, ultima?.valor ?? null);
                const abiertas = acc.filter((a) => a.estado === 'pendiente' || a.estado === 'en_curso').length;
                const vencidas = acc.filter((a) => accionVencida(a)).length;
                return (
                  <Link key={p.id} href={`/procesos/${p.id}`} className="card group p-4 transition hover:-translate-y-0.5 hover:border-marca-300 hover:shadow-md">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', sem.clase)}>
                        {sem.emoji} {sem.nombre}
                      </span>
                      {p.area && <span className="text-[11px] text-marmol-400">{p.area}</span>}
                    </div>
                    <h4 className="mt-2 font-medium text-marmol-900 group-hover:text-secundario">{p.nombre}</h4>
                    {facilitador.rol === 'admin' && <p className="text-[11px] text-marmol-400">De {creadores.get(p.creado_por) ?? '—'}</p>}
                    <p className="mt-2 text-xs text-marmol-500">
                      {p.indicador}: <strong className="text-marmol-800">{formatearValor(ultima?.valor, p.unidad)}</strong>
                      {proc.meta != null && <> · meta {formatearValor(proc.meta, p.unidad)}</>}
                    </p>
                    {avance != null && (
                      <div className="mt-2 h-1.5 rounded-full bg-marmol-100">
                        <div className={cn('h-1.5 rounded-full', avance >= 1 ? 'bg-alto' : avance > 0 ? 'bg-acento' : 'bg-bajo')} style={{ width: `${Math.max(3, Math.min(100, avance * 100))}%` }} />
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-marmol-500">
                      📋 {abiertas} {abiertas === 1 ? 'acción abierta' : 'acciones abiertas'}
                      {vencidas > 0 && <span className="font-semibold text-bajo"> · {vencidas} vencidas</span>}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
