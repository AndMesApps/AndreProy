import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { procesosDe, refsEnviadas } from '@/lib/procesos-servidor';
import { nombreFacilitador } from '@/lib/usuarios';
import { ETAPAS_RETO, LAYOUT_INICIAL, calcularTabla1, compararCorridas, formatearPesos, minimoTraslados, type EstadoReto, type Layout } from '@/lib/mudagami';
import { recomendacionesMudaGami } from '@/lib/recomendaciones';
import { EncabezadoInforme, Kpi, SeccionInforme } from '@/components/informes/partes';
import { OpcionesMejora } from '@/components/informes/opciones-mejora';
import { EditorLayout } from '@/components/mudagami/editor-layout';
import { Resultados } from '@/components/mudagami/resultados';
import type { EquipoVista, JugadorVista, TrasladoVista } from '@/components/mudagami/tipos';

export const metadata = { title: 'Informe · MudaGami' };

export default async function InformeMudaGamiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const sb = db();
  const { data: reto } = await sb.from('mg_retos').select('id, codigo, titulo, descripcion, estado, creado_por, proceso_id').eq('id', id).maybeSingle();
  if (!reto) notFound();
  const facilitador = await getFacilitador();
  if (!puedeAdministrarReto(facilitador, reto)) redirect(`/mudagami/${reto.id}`);

  const [{ data: equipos }, { data: jugadores }, { data: layouts }, { data: traslados }, procesos, enviadas, facilita] = await Promise.all([
    sb.from('mg_equipos').select('id, nombre, emoji').eq('reto_id', reto.id).order('created_at'),
    sb.from('mg_jugadores').select('id, equipo_id, nombres, apellidos, cargo, es_lider').eq('reto_id', reto.id),
    sb.from('mg_layouts').select('equipo_id, corrida, posiciones').eq('reto_id', reto.id),
    sb.from('mg_traslados').select('id, equipo_id, corrida, medio, articulos, jugador_id').eq('reto_id', reto.id),
    procesosDe(facilitador!),
    refsEnviadas(reto.proceso_id, reto.id),
    nombreFacilitador(reto.creado_por),
  ]);

  const vistaEquipos = (equipos ?? []) as EquipoVista[];
  const listaJugadores = (jugadores ?? []) as { id: string; equipo_id: string; nombres: string; apellidos: string; cargo: string; es_lider: boolean }[];
  const vistaJugadores: JugadorVista[] = listaJugadores.map((j) => ({ id: j.id, nombre: `${j.nombres} ${j.apellidos}`, equipo_id: j.equipo_id, cargo: j.cargo, es_lider: j.es_lider }));
  const layoutPorEquipo = new Map(((layouts ?? []) as any[]).filter((l) => l.corrida === 2).map((l) => [l.equipo_id as string, l.posiciones as Layout]));
  const nombreDe = new Map(listaJugadores.map((j) => [j.id, `${j.nombres} ${j.apellidos}`]));
  const vistaTraslados: TrasladoVista[] = ((traslados ?? []) as any[]).map((t) => ({
    id: t.id,
    equipo_id: t.equipo_id,
    corrida: t.corrida,
    medio: t.medio,
    articulos: t.articulos,
    jugador_id: t.jugador_id,
    jugador_nombre: t.jugador_id ? (nombreDe.get(t.jugador_id) ?? '—') : '—',
  }));

  const resumenEquipos = vistaEquipos.map((e) => {
    const t1 = vistaTraslados.filter((t) => t.equipo_id === e.id && t.corrida === 1);
    const t2 = vistaTraslados.filter((t) => t.equipo_id === e.id && t.corrida === 2);
    const corrida1 = calcularTabla1(t1);
    const corrida2 = t2.length ? calcularTabla1(t2) : null;
    return { id: e.id, nombre: e.nombre, corrida1, corrida2, minimoTeorico2: minimoTraslados(layoutPorEquipo.get(e.id) ?? LAYOUT_INICIAL) };
  });

  const costoTotal1 = resumenEquipos.reduce((s, e) => s + e.corrida1.costo, 0);
  const costoTotal2 = resumenEquipos.reduce((s, e) => s + (e.corrida2?.costo ?? e.corrida1.costo), 0);
  const tiempoTotal1 = resumenEquipos.reduce((s, e) => s + e.corrida1.tiempoMin, 0);
  const tiempoTotal2 = resumenEquipos.reduce((s, e) => s + (e.corrida2?.tiempoMin ?? e.corrida1.tiempoMin), 0);
  const comparacion = compararCorridas(calcularTabla1(vistaTraslados.filter((t) => t.corrida === 1)), calcularTabla1(vistaTraslados.filter((t) => t.corrida === 2)));

  const recomendaciones = recomendacionesMudaGami({ equipos: resumenEquipos });

  return (
    <div className="space-y-5">
      <EncabezadoInforme
        volver={`/mudagami/${reto.id}`}
        textoVolver="Volver al reto"
        tipo="Informe de MudaGami · Kayou"
        titulo={reto.titulo}
        subtitulo={reto.descripcion}
        datos={[
          ['Facilitó', facilita ?? '—'],
          ['Equipos', String(vistaEquipos.length)],
          ['Participantes', String(vistaJugadores.length)],
          ['Etapa', ETAPAS_RETO.find((e) => e.estado === (reto.estado as EstadoReto))?.titulo ?? reto.estado],
        ]}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi titulo="Tiempo de transporte · corrida 1" valor={`${tiempoTotal1} min`} nota={formatearPesos(costoTotal1)} />
        <Kpi titulo="Tiempo de transporte · corrida 2" valor={`${tiempoTotal2} min`} nota={formatearPesos(costoTotal2)} tono="text-alto" />
        <Kpi
          titulo="Reducción de tiempo"
          valor={`${comparacion.reduccionTiempoPct >= 0 ? '-' : '+'}${Math.abs(Math.round(comparacion.reduccionTiempoPct))} %`}
          tono={comparacion.reduccionTiempoPct >= 25 ? 'text-alto' : comparacion.reduccionTiempoPct >= 0 ? 'text-medio' : 'text-bajo'}
        />
        <Kpi titulo="Reducción de costo" valor={`${comparacion.reduccionCostoPct >= 0 ? '-' : '+'}${Math.abs(Math.round(comparacion.reduccionCostoPct))} %`} />
      </div>

      <SeccionInforme titulo="💡 Opciones de mejora" descripcion="Generadas a partir de los diseños y traslados de cada equipo. Marca las que quieras llevar al plan de acción de un proceso.">
        <OpcionesMejora recomendaciones={recomendaciones} juego="mudagami" juegoId={reto.id} procesos={procesos} procesoActualId={reto.proceso_id} enviadas={enviadas} />
      </SeccionInforme>

      <SeccionInforme titulo="🗺️ Diseño de planta inicial" descripcion="El mismo para todos los equipos en la corrida 1.">
        <EditorLayout layout={LAYOUT_INICIAL} mostrarMinimo />
      </SeccionInforme>

      <SeccionInforme titulo="🏆 Resultados por equipo">
        <Resultados layoutInicial={LAYOUT_INICIAL} equipos={vistaEquipos} jugadores={vistaJugadores} layouts={layoutPorEquipo} traslados={vistaTraslados} />
      </SeccionInforme>
    </div>
  );
}
