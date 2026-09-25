import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getFacilitador } from '@/lib/auth';
import { cargarProyecto } from '@/lib/proyectos-servidor';
import { nombreFacilitador } from '@/lib/usuarios';
import {
  ESTADOS_HITO,
  ESTADOS_PROYECTO,
  SALUD,
  avanceCronograma,
  avanceKpi,
  avanceObjetivo,
  avanceTiempo,
  cumplimientoObjetivos,
  diagnosticoProyecto,
  formatearHoras,
  formatearPesos,
  horasEjecutadas,
  nivelRiesgo,
  pct,
  resumenEjecutivo,
  saludProyecto,
  ultimaDe,
} from '@/lib/proyectos';
import { SEMAFOROS, formatearValor } from '@/lib/procesos';
import { cn, formatearFecha } from '@/lib/utils';
import { EncabezadoInforme, SeccionInforme } from '@/components/informes/partes';
import { Anillo } from '@/components/proyectos/anillo';
import { Cronograma, Vence } from '@/components/proyectos/cronograma';
import { BarraAvance } from '@/components/proyectos/registro';

export const metadata = { title: 'Informe de avance' };

export default async function InformeProyectoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ finanzas?: string }> }) {
  const [{ id }, { finanzas }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const facilitador = await getFacilitador();
  if (!facilitador) redirect('/ingresar');
  const datos = await cargarProyecto(id, facilitador);
  if (!datos) notFound();
  const conFinanzas = finanzas !== '0';

  const { proyecto: p, hitos, objetivos, kpis, mediciones, bitacora, pagos, riesgos, procesos } = datos;
  const consultora = await nombreFacilitador(p.creado_por);
  const diag = { proyecto: p, hitos, objetivos, kpis, mediciones, bitacora, pagos, riesgos, procesos: procesos.length };
  const avance = avanceCronograma(hitos);
  const tiempo = avanceTiempo(p);
  const horas = horasEjecutadas(bitacora);
  const salud = SALUD[saludProyecto(p, hitos)];
  // Para el cliente: sin frases de dinero cuando se ocultan las finanzas.
  const resumen = resumenEjecutivo({ ...diag, nombre: p.nombre, cliente: p.cliente }).filter((x) => conFinanzas || !/por cobrar|horas/.test(x));
  const alertas = diagnosticoProyecto(diag).filter((a) => conFinanzas || !/^pr-(pagos|horas)/.test(a.ref));
  const hitosOrden = [...hitos].sort((a, b) => (a.fecha_limite ?? '9999').localeCompare(b.fecha_limite ?? '9999'));

  return (
    <div className="space-y-5">
      <EncabezadoInforme
        volver={`/proyectos/${p.id}`}
        textoVolver="Volver al proyecto"
        tipo="Informe de avance"
        titulo={p.nombre}
        subtitulo={p.objetivo_general ? `Objetivo: ${p.objetivo_general}` : p.descripcion}
        datos={[
          ['Cliente', p.cliente],
          ['Consultora', consultora ?? '—'],
          ['Periodo', p.fecha_inicio && p.fecha_fin ? `${formatearFecha(p.fecha_inicio)} – ${formatearFecha(p.fecha_fin)}` : '—'],
          ['Estado', `${ESTADOS_PROYECTO[p.estado].nombre} · ${salud.emoji} ${salud.nombre}`],
        ]}
      />
      <div className="no-imprimir flex justify-end">
        <Link href={conFinanzas ? `/proyectos/${p.id}/informe?finanzas=0` : `/proyectos/${p.id}/informe`} className="text-xs font-semibold text-marca-600 hover:underline">
          {conFinanzas ? '🙈 Ocultar horas y dinero (versión para el cliente)' : '👁️ Mostrar horas y dinero'}
        </Link>
      </div>

      <div className={cn('card grid gap-4 p-5', conFinanzas && p.horas_contratadas ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3')}>
        <Anillo valor={avance} titulo="Avance del cronograma" esperado={tiempo} nota="la muesca es lo esperado hoy" />
        <Anillo valor={cumplimientoObjetivos(objetivos, kpis, mediciones)} titulo="Cumplimiento de objetivos" color="#1baf7a" />
        <Anillo valor={tiempo} titulo="Tiempo transcurrido" color="#7c6fd6" />
        {conFinanzas && p.horas_contratadas ? <Anillo valor={horas / p.horas_contratadas} titulo="Horas usadas" nota={`${formatearHoras(horas)} de ${formatearHoras(p.horas_contratadas)}`} color="#eda100" /> : null}
      </div>

      <SeccionInforme titulo="📰 Resumen ejecutivo">
        <div className="space-y-2 text-sm leading-relaxed text-marmol-700">
          {resumen.map((x, i) => (
            <p key={i}>{x}</p>
          ))}
        </div>
      </SeccionInforme>

      {objetivos.length + kpis.length > 0 && (
        <SeccionInforme titulo="🎯 Objetivos e indicadores">
          <div className="space-y-4">
            {objetivos.map((o, i) => {
              const a = avanceObjetivo(o, kpis, mediciones);
              return (
                <div key={o.id} className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <p className="min-w-0 flex-1 text-sm font-semibold text-marmol-800">
                      {i + 1}. {o.descripcion}
                    </p>
                    <span className="w-12 text-right font-display font-bold text-secundario">{pct(a)}</span>
                  </div>
                  <BarraAvance valor={a} tono={a >= 1 ? 'bg-alto' : 'bg-marca-500'} alto="h-2" />
                  {kpis
                    .filter((k) => k.objetivo_id === o.id)
                    .map((k) => {
                      const u = ultimaDe(k.id, mediciones);
                      return (
                        <p key={k.id} className="pl-4 text-xs text-marmol-600">
                          📏 {k.nombre}: base {formatearValor(k.linea_base, k.unidad)} → hoy <strong>{formatearValor(u?.valor, k.unidad)}</strong> → meta {formatearValor(k.meta, k.unidad)} ({pct(avanceKpi(k, mediciones))} del camino)
                        </p>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </SeccionInforme>
      )}

      {hitos.length > 0 && (
        <SeccionInforme titulo="🗓️ Cronograma">
          <Cronograma proyectoId={p.id} inicio={p.fecha_inicio} fin={p.fecha_fin} hitos={hitos} referencias={{}} soloLectura />
          <table className="mt-4 w-full text-xs">
            <thead className="text-left text-marmol-400">
              <tr>
                <th className="py-1 font-medium">Hito</th>
                <th className="font-medium">Responsable</th>
                <th className="font-medium">Fecha límite</th>
                <th className="font-medium">Estado</th>
                <th className="font-medium">Vence</th>
              </tr>
            </thead>
            <tbody>
              {hitosOrden.map((h) => (
                <tr key={h.id} className="border-t border-marmol-100">
                  <td className="py-1 pr-2 text-marmol-800">
                    {h.nombre}
                    {h.situacion && <span className="block text-[10px] text-marmol-500">{h.situacion}</span>}
                  </td>
                  <td className="pr-2 text-marmol-600">{h.responsable ?? '—'}</td>
                  <td className="whitespace-nowrap pr-2 text-marmol-600">{h.fecha_limite ? formatearFecha(h.fecha_limite) : '—'}</td>
                  <td className="pr-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', ESTADOS_HITO[h.estado].clase)}>{ESTADOS_HITO[h.estado].nombre}</span>
                  </td>
                  <td className="whitespace-nowrap">
                    <Vence hito={h} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SeccionInforme>
      )}

      {procesos.length > 0 && (
        <SeccionInforme titulo="🔄 Procesos intervenidos">
          <ul className="space-y-1.5 text-sm">
            {procesos.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center gap-2">
                <span>{SEMAFOROS[x.semaforo].emoji}</span>
                <strong className="text-marmol-800">{x.nombre}</strong>
                <span className="text-xs text-marmol-500">
                  {x.indicador}: {formatearValor(x.ultima, x.unidad)}
                  {x.meta != null && ` (meta ${formatearValor(x.meta, x.unidad)})`} · {x.accionesAbiertas} acciones abiertas
                </span>
              </li>
            ))}
          </ul>
        </SeccionInforme>
      )}

      {conFinanzas && (pagos.length > 0 || p.valor_contrato) && (
        <SeccionInforme titulo="💵 Horas y pagos">
          <p className="text-sm text-marmol-700">
            Valor del contrato: <strong>{formatearPesos(p.valor_contrato)}</strong> · horas ejecutadas: <strong>{formatearHoras(horas)}</strong>
            {p.horas_contratadas ? ` de ${formatearHoras(p.horas_contratadas)}` : ''}.
          </p>
          {pagos.length > 0 && (
            <table className="mt-2 w-full text-xs">
              <tbody>
                {pagos.map((x) => (
                  <tr key={x.id} className="border-t border-marmol-100">
                    <td className="py-1 text-marmol-800">{x.concepto}</td>
                    <td className="text-right font-semibold">{formatearPesos(Number(x.valor))}</td>
                    <td className="pl-3 text-marmol-500">{x.estado}</td>
                    <td className="text-marmol-500">{x.fecha_limite ? formatearFecha(x.fecha_limite) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SeccionInforme>
      )}

      {riesgos.filter((r) => r.estado !== 'cerrado').length > 0 && (
        <SeccionInforme titulo="⚠️ Riesgos abiertos">
          <ul className="space-y-1.5 text-sm">
            {riesgos
              .filter((r) => r.estado !== 'cerrado')
              .sort((a, b) => nivelRiesgo(b) - nivelRiesgo(a))
              .map((r) => (
                <li key={r.id}>
                  <strong className={cn(nivelRiesgo(r) >= 6 ? 'text-bajo' : nivelRiesgo(r) >= 3 ? 'text-medio' : 'text-alto')}>Nivel {nivelRiesgo(r)}</strong> · {r.descripcion}
                  {r.mitigacion && <span className="block text-xs text-marca-700">🛡️ {r.mitigacion}</span>}
                </li>
              ))}
          </ul>
        </SeccionInforme>
      )}

      {bitacora.length > 0 && (
        <SeccionInforme titulo="📝 Últimas intervenciones">
          <ul className="space-y-2 text-sm">
            {bitacora.slice(0, 6).map((b) => (
              <li key={b.id}>
                <strong className="text-marmol-800">{formatearFecha(b.fecha)}</strong>
                {conFinanzas && b.tiempo_min != null && <span className="text-xs text-marmol-400"> · {b.tiempo_min} min</span>}
                <p className="text-marmol-700">{b.actividad}</p>
                {b.proximo_paso && <p className="text-xs text-marca-700">→ {b.proximo_paso}</p>}
              </li>
            ))}
          </ul>
        </SeccionInforme>
      )}

      {alertas.length > 0 && (
        <SeccionInforme titulo="💡 Puntos de atención y recomendaciones">
          <ul className="space-y-2 text-sm">
            {alertas.map((a) => (
              <li key={a.ref}>
                <strong className="text-marmol-800">{a.titulo}.</strong> <span className="text-marmol-600">{a.detalle}</span>
              </li>
            ))}
          </ul>
        </SeccionInforme>
      )}
    </div>
  );
}
