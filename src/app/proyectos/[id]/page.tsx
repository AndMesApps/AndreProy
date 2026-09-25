import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getFacilitador } from '@/lib/auth';
import { cargarProyecto } from '@/lib/proyectos-servidor';
import { nombreFacilitador } from '@/lib/usuarios';
import {
  ESTADOS_HITO,
  ESTADOS_PROYECTO,
  ICONO_AGENDA,
  SALUD,
  TIPOS_PROYECTO,
  agendaProyecto,
  avanceCronograma,
  avanceTiempo,
  cumplimientoObjetivos,
  diagnosticoProyecto,
  formatearHoras,
  formatearPesos,
  horasEjecutadas,
  hitoAbierto,
  resumenEjecutivo,
  saludProyecto,
  ultimaIntervencion,
  type DatosDiagnostico,
} from '@/lib/proyectos';
import { diasHasta } from '@/lib/procesos';
import { PRIORIDADES } from '@/lib/recomendaciones';
import { cn, formatearFecha } from '@/lib/utils';
import { Anillo } from '@/components/proyectos/anillo';
import { AccionesProyecto } from '@/components/proyectos/acciones-proyecto';
import { BarraAvance } from '@/components/proyectos/registro';
import { Cronograma } from '@/components/proyectos/cronograma';
import { ObjetivosKpis } from '@/components/proyectos/objetivos-kpis';
import { Bitacora } from '@/components/proyectos/bitacora';
import { Documentos, Finanzas, Riesgos } from '@/components/proyectos/finanzas-riesgos-documentos';
import { ProcesosProyecto } from '@/components/proyectos/procesos-proyecto';
import { FormularioProyecto } from '@/components/proyectos/formulario-proyecto';
import { ArrowLeft, FileText } from 'lucide-react';

export const metadata = { title: 'Proyecto' };

const VISTAS = [
  ['resumen', '🧭 Resumen'],
  ['cronograma', '🗓️ Cronograma'],
  ['objetivos', '🎯 Objetivos y KPIs'],
  ['bitacora', '📝 Bitácora'],
  ['finanzas', '💵 Horas y pagos'],
  ['riesgos', '⚠️ Riesgos'],
  ['procesos', '🔄 Procesos'],
  ['documentos', '📎 Documentos'],
] as const;
type Vista = (typeof VISTAS)[number][0];

/** Convierte las URLs de un texto en enlaces. */
function ConEnlaces({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/(https?:\/\/\S+)/g).map((parte, i) =>
        /^https?:\/\//.test(parte) ? (
          <a key={i} href={parte} target="_blank" rel="noreferrer" className="break-all text-marca-700 underline">
            {parte}
          </a>
        ) : (
          <span key={i}>{parte}</span>
        ),
      )}
    </>
  );
}

export default async function ProyectoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ vista?: string }> }) {
  const [{ id }, { vista: v }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const facilitador = await getFacilitador();
  if (!facilitador) redirect('/ingresar');
  const datos = await cargarProyecto(id, facilitador);
  if (!datos) notFound();
  const vista: Vista = (VISTAS.find(([k]) => k === v)?.[0] ?? 'resumen') as Vista;

  const { proyecto: p, hitos, objetivos, kpis, mediciones, bitacora, pagos, riesgos, documentos, procesos, referencias } = datos;
  const consultora = await nombreFacilitador(p.creado_por);
  const diag: DatosDiagnostico = { proyecto: p, hitos, objetivos, kpis, mediciones, bitacora, pagos, riesgos, procesos: procesos.length };
  const avance = avanceCronograma(hitos);
  const tiempo = avanceTiempo(p);
  const objetivosPct = cumplimientoObjetivos(objetivos, kpis, mediciones);
  const horas = horasEjecutadas(bitacora);
  const consumoHoras = p.horas_contratadas ? horas / p.horas_contratadas : null;
  const salud = SALUD[saludProyecto(p, hitos)];
  const alertas = diagnosticoProyecto(diag);
  const agenda = agendaProyecto(p, hitos, pagos, bitacora, 14);
  const resumen = resumenEjecutivo({ ...diag, nombre: p.nombre, cliente: p.cliente });
  const ultima = ultimaIntervencion(bitacora);

  // Contadores y avisos de cada pestaña.
  const vencidos = hitos.filter((h) => hitoAbierto(h) && h.fecha_limite && diasHasta(h.fecha_limite) < 0).length;
  const insignias: Partial<Record<Vista, { n: number; alerta?: boolean }>> = {
    cronograma: { n: hitos.length, alerta: vencidos > 0 },
    objetivos: { n: objetivos.length },
    bitacora: { n: bitacora.length },
    finanzas: { n: pagos.length, alerta: alertas.some((a) => a.ref === 'pr-pagos' || a.ref.startsWith('pr-horas')) },
    riesgos: { n: riesgos.filter((r) => r.estado !== 'cerrado').length, alerta: alertas.some((a) => a.ref === 'pr-riesgos') },
    procesos: { n: procesos.length },
    documentos: { n: documentos.length },
  };

  // Avance por fase.
  const fases = new Map<string, { total: number; hecho: number }>();
  for (const h of hitos.filter((x) => x.estado !== 'no_aplica')) {
    const k = h.fase?.trim() || 'Sin fase';
    const f = fases.get(k) ?? { total: 0, hecho: 0 };
    f.total += h.peso;
    f.hecho += h.estado === 'cumplido' ? h.peso : h.estado === 'en_aprobacion' ? h.peso / 2 : 0;
    fases.set(k, f);
  }

  return (
    <div className="space-y-5">
      <div className="no-imprimir flex flex-wrap items-center justify-between gap-2">
        <Link href="/proyectos" className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
          <ArrowLeft size={12} /> Proyectos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <AccionesProyecto proyectoId={p.id} estado={p.estado} />
          <Link href={`/proyectos/${p.id}/informe`} className="boton py-1.5">
            <FileText size={14} /> Informe de avance
          </Link>
        </div>
      </div>

      {/* Encabezado */}
      <div className="relative overflow-hidden rounded-2xl bg-degradado px-6 py-6 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-acento">
          {p.cliente}
          {p.grupo && ` · ${p.grupo}`} · {TIPOS_PROYECTO[p.tipo]}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{p.nombre}</h1>
        {p.programa && <p className="text-sm text-white/80">{p.programa}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className={cn('rounded-full px-2.5 py-0.5 font-semibold', salud.clase)}>
            {salud.emoji} {salud.nombre}
          </span>
          <span className="rounded-full bg-white/15 px-2.5 py-0.5">{ESTADOS_PROYECTO[p.estado].nombre}</span>
          {p.fecha_inicio && p.fecha_fin && (
            <span className="rounded-full bg-white/15 px-2.5 py-0.5">
              📅 {formatearFecha(p.fecha_inicio)} → {formatearFecha(p.fecha_fin)}
            </span>
          )}
          {consultora && <span className="rounded-full bg-white/15 px-2.5 py-0.5">🧑‍🏫 {consultora}</span>}
        </div>
      </div>

      {/* Pestañas */}
      <nav className="no-imprimir -mx-4 flex gap-1 overflow-x-auto px-4 pb-1">
        {VISTAS.map(([k, nombre]) => {
          const ins = insignias[k];
          return (
            <Link
              key={k}
              href={k === 'resumen' ? `/proyectos/${p.id}` : `/proyectos/${p.id}?vista=${k}`}
              className={cn(
                'relative shrink-0 rounded-lg px-3 py-1.5 text-sm transition',
                vista === k ? 'bg-secundario font-semibold text-white' : 'bg-white text-marmol-600 ring-1 ring-marmol-200 hover:text-secundario',
              )}
            >
              {nombre}
              {ins && ins.n > 0 && <span className={cn('ml-1 text-[11px]', vista === k ? 'text-white/70' : 'text-marmol-400')}>{ins.n}</span>}
              {ins?.alerta && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-bajo ring-2 ring-white" aria-label="Requiere atención" />}
            </Link>
          );
        })}
      </nav>

      {vista === 'resumen' && (
        <div className="space-y-5">
          <div className="card grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
            <Anillo valor={avance} titulo="Cronograma" nota={tiempo != null ? 'la muesca es lo esperado hoy' : undefined} esperado={tiempo} />
            <Anillo valor={objetivosPct} titulo="Objetivos" nota={`${objetivos.length} objetivos · ${kpis.length} KPIs`} color="#1baf7a" />
            <Anillo valor={tiempo} titulo="Tiempo transcurrido" nota={p.fecha_fin ? (diasHasta(p.fecha_fin) >= 0 ? `faltan ${diasHasta(p.fecha_fin)} días` : 'fecha límite pasada') : 'sin fechas'} color="#7c6fd6" />
            <Anillo
              valor={consumoHoras}
              titulo="Horas usadas"
              nota={p.horas_contratadas ? `${formatearHoras(horas)} de ${formatearHoras(p.horas_contratadas)}` : `${formatearHoras(horas)} (sin tope)`}
              color={consumoHoras != null && consumoHoras > 1 ? '#e34948' : '#eda100'}
              esperado={avance}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <section className="card p-5">
              <h2 className="font-display text-lg font-semibold text-secundario">📰 Resumen ejecutivo</h2>
              <p className="text-[11px] text-marmol-400">Escrito automáticamente con los datos de hoy.</p>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-marmol-700">
                {resumen.map((parrafo, i) => (
                  <p key={i}>{parrafo}</p>
                ))}
              </div>
              {fases.size > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-marmol-400">Avance por fase</p>
                  {[...fases.entries()].map(([fase, f]) => (
                    <div key={fase} className="flex items-center gap-3 text-xs">
                      <span className="w-32 shrink-0 truncate text-marmol-600">{fase}</span>
                      <BarraAvance valor={f.total ? f.hecho / f.total : 0} tono={f.total && f.hecho >= f.total ? 'bg-alto' : 'bg-marca-500'} alto="h-2" />
                      <span className="w-10 text-right font-semibold text-marmol-700">{f.total ? Math.round((f.hecho / f.total) * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card p-5">
              <h2 className="font-display text-lg font-semibold text-secundario">📆 Próximos 14 días</h2>
              {agenda.length === 0 ? (
                <p className="mt-2 text-sm text-marmol-500">Nada vence en los próximos 14 días.</p>
              ) : (
                <ol className="mt-2 space-y-1.5">
                  {agenda.map((e, i) => {
                    const d = diasHasta(e.fecha);
                    return (
                      <li key={i} className={cn('flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm', e.vencido ? 'bg-red-50' : d <= 2 ? 'bg-amber-50' : 'bg-marmol-50')}>
                        <span>{ICONO_AGENDA[e.tipo]}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-marmol-800">{e.titulo}</span>
                          {e.detalle && <span className="text-[11px] text-marmol-500">{e.detalle}</span>}
                        </span>
                        <span className={cn('shrink-0 text-right text-[11px] font-semibold', e.vencido ? 'text-bajo' : d <= 2 ? 'text-medio' : 'text-marmol-500')}>
                          {e.vencido ? `vencido ${-d} d` : d === 0 ? 'hoy' : d === 1 ? 'mañana' : formatearFecha(e.fecha).replace(/ de \d{4}$/, '')}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
              {ultima && (
                <p className="mt-3 border-t border-marmol-100 pt-2 text-xs text-marmol-500">
                  Última intervención: <strong className="text-marmol-700">{formatearFecha(ultima.fecha)}</strong>
                  {' · '}
                  <Link href={`/proyectos/${p.id}?vista=bitacora`} className="font-semibold text-marca-600 hover:underline">
                    registrar otra
                  </Link>
                </p>
              )}
            </section>
          </div>

          <section className="card p-5">
            <h2 className="font-display text-lg font-semibold text-secundario">💡 Alertas y opciones de mejora</h2>
            {alertas.length === 0 ? (
              <p className="mt-2 text-sm text-alto">✓ Todo en orden: el cronograma avanza, no hay vencimientos ni riesgos altos.</p>
            ) : (
              <ul className="mt-3 grid gap-2 md:grid-cols-2">
                {alertas.map((a) => (
                  <li key={a.ref} className="rounded-xl border border-marmol-200 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-marmol-800">{a.titulo}</p>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', PRIORIDADES[a.prioridad].clase)}>{PRIORIDADES[a.prioridad].nombre}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-marmol-600">{a.detalle}</p>
                    {a.herramienta && <p className="mt-1 text-[11px] text-marca-700">🧰 {a.herramienta}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card grid gap-5 p-5 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-secundario">🗂️ Ficha</h2>
                <FormularioProyecto
                  proyectoId={p.id}
                  datosIniciales={{
                    nombre: p.nombre,
                    cliente: p.cliente,
                    grupo: p.grupo ?? '',
                    tipo: p.tipo,
                    programa: p.programa ?? '',
                    descripcion: p.descripcion ?? '',
                    objetivoGeneral: p.objetivo_general ?? '',
                    contactoNombre: p.contacto_nombre ?? '',
                    contactoCargo: p.contacto_cargo ?? '',
                    contactoCorreo: p.contacto_correo ?? '',
                    contactoCelular: p.contacto_celular ?? '',
                    gestorExterno: p.gestor_externo ?? '',
                    fechaInicio: p.fecha_inicio ?? '',
                    fechaFin: p.fecha_fin ?? '',
                    fechaCierreLimite: p.fecha_cierre_limite ?? '',
                    horasContratadas: p.horas_contratadas == null ? '' : String(p.horas_contratadas),
                    valorContrato: p.valor_contrato == null ? '' : String(p.valor_contrato),
                    frecuenciaDias: p.frecuencia_dias == null ? '' : String(p.frecuencia_dias),
                    estado: p.estado,
                    reglas: p.reglas ?? '',
                    enlaces: p.enlaces ?? '',
                  }}
                />
              </div>
              {p.objetivo_general && (
                <p className="rounded-lg bg-marca-50 p-2 text-marmol-700">
                  🎯 <strong>Objetivo general:</strong> {p.objetivo_general}
                </p>
              )}
              {p.descripcion && <p className="whitespace-pre-line text-marmol-600">{p.descripcion}</p>}
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                {(
                  [
                    ['Inicio', p.fecha_inicio && formatearFecha(p.fecha_inicio)],
                    ['Fin', p.fecha_fin && formatearFecha(p.fecha_fin)],
                    ['Acta de cierre', p.fecha_cierre_limite && formatearFecha(p.fecha_cierre_limite)],
                    ['Horas contratadas', p.horas_contratadas != null && formatearHoras(p.horas_contratadas)],
                    ['Valor del contrato', p.valor_contrato != null && formatearPesos(p.valor_contrato)],
                    ['Intervenir cada', p.frecuencia_dias && `${p.frecuencia_dias} días`],
                  ] as [string, string | false | null][]
                )
                  .filter(([, x]) => x)
                  .map(([k, x]) => (
                    <div key={k} className="contents">
                      <dt className="text-marmol-400">{k}</dt>
                      <dd className="font-medium text-marmol-800">{x}</dd>
                    </div>
                  ))}
              </dl>
            </div>
            <div className="space-y-3 text-sm">
              {(p.contacto_nombre || p.gestor_externo) && (
                <div className="rounded-xl bg-marmol-50 p-3 text-xs">
                  {p.contacto_nombre && (
                    <p>
                      👤 <strong className="text-marmol-800">{p.contacto_nombre}</strong>
                      {p.contacto_cargo && ` · ${p.contacto_cargo}`}
                      {p.contacto_correo && (
                        <>
                          {' · '}
                          <a href={`mailto:${p.contacto_correo}`} className="text-marca-700 underline">
                            {p.contacto_correo}
                          </a>
                        </>
                      )}
                      {p.contacto_celular && (
                        <>
                          {' · '}
                          <a href={`https://wa.me/${p.contacto_celular.replace(/\D/g, '').replace(/^(?!57)(\d{10})$/, '57$1')}`} target="_blank" rel="noreferrer" className="text-marca-700 underline">
                            💬 {p.contacto_celular}
                          </a>
                        </>
                      )}
                    </p>
                  )}
                  {p.gestor_externo && <p className="mt-1">🏛️ Gestor(a) externo: {p.gestor_externo}</p>}
                </div>
              )}
              {p.reglas && (
                <details className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs" open>
                  <summary className="cursor-pointer font-semibold text-medio">📜 Reglas clave</summary>
                  <p className="mt-2 whitespace-pre-line text-marmol-700">{p.reglas}</p>
                </details>
              )}
              {p.enlaces && (
                <div className="rounded-xl border border-marmol-200 p-3 text-xs">
                  <p className="font-semibold text-marmol-700">🔗 Enlaces y especificaciones</p>
                  <p className="mt-1 whitespace-pre-line text-marmol-600">
                    <ConEnlaces texto={p.enlaces} />
                  </p>
                </div>
              )}
              {hitos.length > 0 && (
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {(Object.keys(ESTADOS_HITO) as (keyof typeof ESTADOS_HITO)[])
                    .map((e) => [e, hitos.filter((h) => h.estado === e).length] as const)
                    .filter(([, n]) => n > 0)
                    .map(([e, n]) => (
                      <span key={e} className={cn('rounded-full px-2 py-0.5 font-semibold', ESTADOS_HITO[e].clase)}>
                        {n} {ESTADOS_HITO[e].nombre.toLowerCase()}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {vista === 'cronograma' && (
        <section className="card p-4">
          <Cronograma proyectoId={p.id} inicio={p.fecha_inicio} fin={p.fecha_fin} hitos={hitos} referencias={referencias} />
        </section>
      )}
      {vista === 'objetivos' && (
        <section className="card p-4">
          <ObjetivosKpis proyectoId={p.id} objetivos={objetivos} kpis={kpis} mediciones={mediciones} referencias={referencias} />
        </section>
      )}
      {vista === 'bitacora' && (
        <section className="card p-4">
          <Bitacora proyectoId={p.id} registros={bitacora} referencias={referencias} frecuenciaDias={p.frecuencia_dias} />
        </section>
      )}
      {vista === 'finanzas' && (
        <section className="card p-4">
          <Finanzas proyectoId={p.id} pagos={pagos} horasContratadas={p.horas_contratadas} horasEjecutadas={horas} valorContrato={p.valor_contrato} avance={avance} />
        </section>
      )}
      {vista === 'riesgos' && (
        <section className="card p-4">
          <Riesgos proyectoId={p.id} riesgos={riesgos} />
        </section>
      )}
      {vista === 'procesos' && (
        <section className="card p-4">
          <ProcesosProyecto proyectoId={p.id} cliente={p.cliente} procesos={procesos} libres={datos.procesosLibres} />
        </section>
      )}
      {vista === 'documentos' && (
        <section className="card p-4">
          <Documentos proyectoId={p.id} documentos={documentos} />
        </section>
      )}
    </div>
  );
}
