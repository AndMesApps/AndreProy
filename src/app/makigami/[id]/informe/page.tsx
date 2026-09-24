import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { procesosDe, refsEnviadas } from '@/lib/procesos-servidor';
import { nombreFacilitador } from '@/lib/usuarios';
import {
  CLASIFICACIONES,
  DESPERDICIOS,
  ETAPAS_RETO,
  calcularMetricas,
  calcularTiempoFuturo,
  contarTraspasos,
  formatearDuracion,
  type Clasificacion,
  type EstadoReto,
  type TipoDesperdicio,
} from '@/lib/makigami';
import { recomendacionesMakigami } from '@/lib/recomendaciones';
import { cn } from '@/lib/utils';
import { EncabezadoInforme, Kpi, SeccionInforme } from '@/components/informes/partes';
import { OpcionesMejora } from '@/components/informes/opciones-mejora';
import { RankingReto } from '@/components/makigami/ranking-reto';
import type { CazaVista, EquipoVista, JugadorVista, PropuestaVista } from '@/components/makigami/tipos';

export const metadata = { title: 'Informe · Cacería Makigami' };

export default async function InformeMakigamiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const sb = db();
  const { data: reto } = await sb
    .from('mk_retos')
    .select('id, codigo, titulo, descripcion, inicio_proceso, fin_proceso, estado, creado_por, proceso_id')
    .eq('id', id)
    .maybeSingle();
  if (!reto) notFound();
  const facilitador = await getFacilitador();
  if (!puedeAdministrarReto(facilitador, reto)) redirect(`/makigami/${reto.id}`);

  const [{ data: carriles }, { data: pasos }, { data: cazas }, { data: propuestas }, { data: equipos }, { data: jugadores }, procesos, enviadas, facilita] = await Promise.all([
    sb.from('mk_carriles').select('id, nombre').eq('reto_id', reto.id),
    sb.from('mk_pasos').select('id, carril_id, orden, descripcion, tiempo_trabajo_min, tiempo_espera_min, clasificacion').eq('reto_id', reto.id).order('orden'),
    sb.from('mk_cazas').select('id, paso_id, jugador_id, tipo_desperdicio, comentario, created_at').eq('reto_id', reto.id),
    sb.from('mk_propuestas').select('id, paso_id, jugador_id, accion, descripcion, ahorro_estimado_min, estado, votos:mk_votos(jugador_id)').eq('reto_id', reto.id),
    sb.from('mk_equipos').select('id, nombre, emoji').eq('reto_id', reto.id).order('created_at'),
    sb.from('mk_jugadores').select('id, equipo_id, nombres, apellidos, cargo, es_lider').eq('reto_id', reto.id),
    procesosDe(facilitador!),
    refsEnviadas(reto.proceso_id, reto.id),
    nombreFacilitador(reto.creado_por),
  ]);

  const carrilDe = new Map(((carriles ?? []) as { id: string; nombre: string }[]).map((c) => [c.id, c.nombre]));
  const listaPasos = ((pasos ?? []) as any[]).map((p) => ({
    id: p.id as string,
    carril_id: p.carril_id as string,
    orden: p.orden as number,
    descripcion: p.descripcion as string,
    tiempo_trabajo_min: Number(p.tiempo_trabajo_min) || 0,
    tiempo_espera_min: Number(p.tiempo_espera_min) || 0,
    clasificacion: p.clasificacion as Clasificacion | null,
    carril: carrilDe.get(p.carril_id) ?? '—',
  }));
  const pasoDe = new Map(listaPasos.map((p) => [p.id, p]));
  const metricas = calcularMetricas(listaPasos);
  const traspasos = contarTraspasos(listaPasos);

  const listaJugadores = (jugadores ?? []) as { id: string; equipo_id: string; nombres: string; apellidos: string; cargo: string; es_lider: boolean }[];
  const nombreDe = new Map(listaJugadores.map((j) => [j.id, `${j.nombres} ${j.apellidos}`]));
  const vistaCazas: CazaVista[] = ((cazas ?? []) as any[]).map((c) => ({ ...c, jugador_nombre: nombreDe.get(c.jugador_id) ?? '—' }));
  const vistaPropuestas: PropuestaVista[] = ((propuestas ?? []) as any[]).map((p) => ({
    id: p.id,
    paso_id: p.paso_id,
    jugador_id: p.jugador_id,
    jugador_nombre: nombreDe.get(p.jugador_id) ?? '—',
    accion: p.accion,
    descripcion: p.descripcion,
    ahorro_estimado_min: Number(p.ahorro_estimado_min) || 0,
    estado: p.estado,
    votos: (p.votos ?? []).map((v: any) => v.jugador_id),
  }));
  const vistaJugadores: JugadorVista[] = listaJugadores.map((j) => ({ id: j.id, nombre: `${j.nombres} ${j.apellidos}`, equipo_id: j.equipo_id, cargo: j.cargo, es_lider: j.es_lider }));

  const cazasPorTipo = new Map<TipoDesperdicio, number>();
  for (const c of vistaCazas) cazasPorTipo.set(c.tipo_desperdicio, (cazasPorTipo.get(c.tipo_desperdicio) ?? 0) + 1);
  const tiposOrdenados = [...cazasPorTipo.entries()].sort((a, b) => b[1] - a[1]);
  const maxTipo = Math.max(1, ...tiposOrdenados.map(([, n]) => n));

  const aprobadas = vistaPropuestas.filter((p) => p.estado === 'aprobada');
  const ahorro = aprobadas.reduce((s, p) => s + p.ahorro_estimado_min, 0);
  const futuro = calcularTiempoFuturo(metricas, ahorro);
  const reduccion = metricas.tiempoTotal > 0 ? ((metricas.tiempoTotal - futuro) / metricas.tiempoTotal) * 100 : 0;

  // Pasos que más cazas recibieron: los puntos calientes del proceso.
  const cazasPorPaso = new Map<string, number>();
  for (const c of vistaCazas) cazasPorPaso.set(c.paso_id, (cazasPorPaso.get(c.paso_id) ?? 0) + 1);
  const calientes = [...cazasPorPaso.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const recomendaciones = recomendacionesMakigami({
    metricas,
    traspasos,
    pasos: listaPasos,
    cazasPorTipo,
    propuestas: vistaPropuestas.map((p) => ({ ...p, votos: p.votos.length, paso: p.paso_id ? (pasoDe.get(p.paso_id)?.descripcion ?? null) : null })),
  });

  return (
    <div className="space-y-5">
      <EncabezadoInforme
        volver={`/makigami/${reto.id}`}
        textoVolver="Volver al reto"
        tipo="Informe de Cacería Makigami"
        titulo={reto.titulo}
        subtitulo={reto.descripcion}
        datos={[
          ['Facilitó', facilita ?? '—'],
          ['Proceso', `${reto.inicio_proceso || 'inicio'} → ${reto.fin_proceso || 'fin'}`],
          ['Pasos', String(listaPasos.length)],
          ['Equipos', String((equipos ?? []).length)],
          ['Participantes', String(listaJugadores.length)],
          ['Etapa', ETAPAS_RETO.find((e) => e.estado === (reto.estado as EstadoReto))?.titulo ?? reto.estado],
        ]}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi titulo="Tiempo total del proceso hoy" valor={formatearDuracion(metricas.tiempoTotal)} nota={`${formatearDuracion(metricas.espera)} son esperas`} />
        <Kpi
          titulo="Eficiencia (tiempo que agrega valor)"
          valor={`${metricas.eficiencia < 1 && metricas.eficiencia > 0 ? '<1' : Math.round(metricas.eficiencia)} %`}
          tono={metricas.eficiencia < 10 ? 'text-bajo' : metricas.eficiencia < 25 ? 'text-medio' : 'text-alto'}
        />
        <Kpi titulo="Tiempo con las mejoras aprobadas" valor={formatearDuracion(futuro)} tono="text-alto" nota={`${Math.round(reduccion)} % menos · ${aprobadas.length} mejoras`} />
        <Kpi titulo="Desperdicios cazados" valor={String(vistaCazas.length)} tono="text-bajo" nota={`${traspasos} traspasos entre áreas`} />
      </div>

      <SeccionInforme titulo="💡 Opciones de mejora" descripcion="Generadas a partir del mapa, la cacería y el rediseño. Marca las que quieras llevar al plan de acción de un proceso.">
        <OpcionesMejora recomendaciones={recomendaciones} juego="makigami" juegoId={reto.id} procesos={procesos} procesoActualId={reto.proceso_id} enviadas={enviadas} />
      </SeccionInforme>

      <div className="grid gap-5 lg:grid-cols-2">
        <SeccionInforme titulo="🎯 Desperdicios encontrados" descripcion="Cuántas veces los equipos marcaron cada tipo.">
          {tiposOrdenados.length === 0 ? (
            <p className="text-sm text-marmol-400">No hubo cazas.</p>
          ) : (
            <ul className="space-y-2">
              {tiposOrdenados.map(([t, n]) => (
                <li key={t} className="text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-marmol-700">
                      {DESPERDICIOS[t].emoji} {DESPERDICIOS[t].nombre}
                    </span>
                    <strong className="text-marmol-900">{n}</strong>
                  </div>
                  <div className="mt-0.5 h-2 rounded-full bg-marmol-100">
                    <div className="h-2 rounded-full bg-bajo/80" style={{ width: `${(n / maxTipo) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SeccionInforme>

        <SeccionInforme titulo="🔥 Pasos con más hallazgos" descripcion="Donde los equipos vieron más desperdicio.">
          {calientes.length === 0 ? (
            <p className="text-sm text-marmol-400">No hubo cazas.</p>
          ) : (
            <ol className="space-y-1.5 text-sm">
              {calientes.map(([pasoId, n]) => {
                const p = pasoDe.get(pasoId);
                return (
                  <li key={pasoId} className="flex gap-2">
                    <span className="w-8 shrink-0 font-semibold text-marmol-400">#{p?.orden}</span>
                    <span className="min-w-0 flex-1 text-marmol-700">
                      {p?.descripcion} <span className="text-xs text-marmol-400">· {p?.carril}</span>
                    </span>
                    <strong className="text-bajo">{n}</strong>
                  </li>
                );
              })}
            </ol>
          )}
        </SeccionInforme>
      </div>

      <SeccionInforme titulo="✅ Mejoras aprobadas en el rediseño">
        {aprobadas.length === 0 ? (
          <p className="text-sm text-marmol-400">Todavía no hay mejoras aprobadas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-marmol-400">
              <tr>
                <th className="py-1.5 font-medium">Mejora</th>
                <th className="font-medium">Propuso</th>
                <th className="text-right font-medium">Votos</th>
                <th className="text-right font-medium">Ahorro</th>
              </tr>
            </thead>
            <tbody>
              {aprobadas
                .sort((a, b) => b.ahorro_estimado_min - a.ahorro_estimado_min)
                .map((p) => (
                  <tr key={p.id} className="border-t border-marmol-100 align-top">
                    <td className="py-1.5 pr-2 text-marmol-800">
                      {p.descripcion}
                      {p.paso_id && <span className="block text-xs text-marmol-400">Paso #{pasoDe.get(p.paso_id)?.orden}: {pasoDe.get(p.paso_id)?.descripcion}</span>}
                    </td>
                    <td className="pr-2 text-xs text-marmol-500">{p.jugador_nombre}</td>
                    <td className="text-right text-marmol-600">{p.votos.length}</td>
                    <td className="text-right font-semibold text-alto">{formatearDuracion(p.ahorro_estimado_min)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </SeccionInforme>

      <SeccionInforme titulo="🗺️ El proceso paso a paso" descripcion="Tal como se mapeó (estado actual).">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="text-left text-xs text-marmol-400">
              <tr>
                <th className="py-1.5 font-medium">#</th>
                <th className="font-medium">Paso</th>
                <th className="font-medium">Quién</th>
                <th className="text-right font-medium">Trabajo</th>
                <th className="text-right font-medium">Espera</th>
                <th className="font-medium">&nbsp;Clasificación</th>
                <th className="text-right font-medium">Cazas</th>
              </tr>
            </thead>
            <tbody>
              {listaPasos.map((p) => (
                <tr key={p.id} className="border-t border-marmol-100">
                  <td className="py-1.5 text-marmol-400">{p.orden}</td>
                  <td className="pr-2 text-marmol-800">{p.descripcion}</td>
                  <td className="pr-2 text-xs text-marmol-500">{p.carril}</td>
                  <td className="text-right text-marmol-600">{formatearDuracion(p.tiempo_trabajo_min)}</td>
                  <td className={cn('text-right', p.tiempo_espera_min > p.tiempo_trabajo_min ? 'font-semibold text-bajo' : 'text-marmol-600')}>{formatearDuracion(p.tiempo_espera_min)}</td>
                  <td className="text-xs text-marmol-500">&nbsp;{p.clasificacion ? CLASIFICACIONES[p.clasificacion].nombre : '—'}</td>
                  <td className="text-right text-marmol-600">{cazasPorPaso.get(p.id) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SeccionInforme>

      <RankingReto
        cazas={vistaCazas}
        propuestas={vistaPropuestas}
        jugadores={vistaJugadores}
        equipos={(equipos ?? []) as EquipoVista[]}
        miJugadorId={null}
        puntosEntregados={reto.estado === 'cerrado'}
        enColumnas
      />
    </div>
  );
}
