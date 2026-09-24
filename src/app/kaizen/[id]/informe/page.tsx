import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { procesosDe, refsEnviadas } from '@/lib/procesos-servidor';
import { calcularMarcador, describirMomento, errorPrediccion, formatearPct, type MarcadorEquipo } from '@/lib/kaizen';
import { recomendacionesKaizen } from '@/lib/recomendaciones';
import { cn } from '@/lib/utils';
import { EncabezadoInforme, Kpi, SeccionInforme } from '@/components/informes/partes';
import { OpcionesMejora } from '@/components/informes/opciones-mejora';
import { GraficaMejora } from '@/components/kaizen/grafica-mejora';
import { ResumenTarjeta } from '@/components/kaizen/tarjeta-kaizen';
import { COLORES_EQUIPO, type EquipoVista, type TarjetaVista } from '@/components/kaizen/tipos';

export const metadata = { title: 'Informe · Carrera Kaizen' };

const MEDALLAS = ['🥇', '🥈', '🥉'];

export default async function InformeKaizenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const sb = db();
  const { data: s } = await sb
    .from('kz_sesiones')
    .select('id, codigo, titulo, descripcion, producto, unidad, criterio_calidad, total_rondas, duracion_ronda_seg, estado, ronda_actual, fase, creado_por, proceso_id, cerrado_en, created_at')
    .eq('id', id)
    .maybeSingle();
  if (!s) notFound();
  const facilitador = await getFacilitador();
  if (!puedeAdministrarReto(facilitador, s)) redirect(`/kaizen/${s.id}`);

  const [{ data: equipos }, { data: jugadores }, { data: tarjetas }, { data: resultados }, procesos, enviadas] = await Promise.all([
    sb.from('kz_equipos').select('id, nombre, emoji').eq('sesion_id', s.id).order('created_at'),
    sb.from('kz_jugadores').select('equipo_id').eq('sesion_id', s.id),
    sb.from('kz_tarjetas').select('id, equipo_id, ronda, problema, porques, idea, prediccion, decision').eq('sesion_id', s.id),
    sb.from('kz_resultados').select('equipo_id, ronda, unidades_buenas, defectos').eq('sesion_id', s.id),
    procesosDe(facilitador!),
    refsEnviadas(s.proceso_id, s.id),
  ]);

  const vistaEquipos: EquipoVista[] = ((equipos ?? []) as { id: string; nombre: string; emoji: string }[]).map((e, i) => ({
    ...e,
    color: COLORES_EQUIPO[i] ?? '#8a7f70',
    miembros: ((jugadores ?? []) as { equipo_id: string }[]).filter((j) => j.equipo_id === e.id).length,
  }));
  const vistaTarjetas = ((tarjetas ?? []) as TarjetaVista[]).map((t) => ({ ...t, porques: t.porques ?? [] }));
  const lista = (resultados ?? []) as { equipo_id: string; ronda: number; unidades_buenas: number; defectos: number }[];
  const marcadores = new Map<string, MarcadorEquipo>(vistaEquipos.map((e) => [e.id, calcularMarcador(e.id, s.total_rondas, vistaTarjetas, lista)]));
  const ranking = vistaEquipos.map((e) => ({ e, m: marcadores.get(e.id)! })).sort((a, b) => b.m.total - a.m.total);

  // Indicadores globales de la carrera.
  const conMejora = [...marcadores.values()].filter((m) => m.mejoraTotalPct != null);
  const mejoraPromedio = conMejora.length ? conMejora.reduce((acc, m) => acc + m.mejoraTotalPct!, 0) / conMejora.length : null;
  const buenas = lista.reduce((acc, r) => acc + r.unidades_buenas, 0);
  const defectos = lista.reduce((acc, r) => acc + r.defectos, 0);
  const estandares = [...marcadores.values()].reduce((acc, m) => acc + m.estandares.length, 0);
  const predicciones = [...marcadores.values()].flatMap((m) => m.rondas).filter((r) => r.tarjeta?.prediccion != null && r.resultado);
  const aciertos = predicciones.filter((r) => errorPrediccion(r.tarjeta!.prediccion!, r.resultado!.unidades_buenas) <= 0.25).length;

  const recomendaciones = recomendacionesKaizen({ unidad: s.unidad, equipos: vistaEquipos, marcadores, tarjetas: vistaTarjetas });

  return (
    <div className="space-y-5">
      <EncabezadoInforme
        volver={`/kaizen/${s.id}`}
        textoVolver="Volver a la carrera"
        tipo="Informe de Carrera Kaizen"
        titulo={s.titulo}
        subtitulo={s.descripcion}
        datos={[
          ['Producto', s.producto],
          ['Equipos', String(vistaEquipos.length)],
          ['Participantes', String((jugadores ?? []).length)],
          ['Rondas', `${s.total_rondas} de ${Math.round(s.duracion_ronda_seg / 60 * 10) / 10} min`],
          ['Estado', describirMomento({ estado: s.estado, ronda: s.ronda_actual, fase: s.fase }, s.total_rondas)],
        ]}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi titulo="Mejora promedio frente a la línea base" valor={formatearPct(mejoraPromedio)} tono={(mejoraPromedio ?? 0) > 0 ? 'text-alto' : 'text-bajo'} nota="última ronda vs. ronda 1" />
        <Kpi titulo="Estándares adoptados" valor={String(estandares)} nota="ideas que se volvieron la nueva forma de trabajar" />
        <Kpi
          titulo="Unidades con defecto"
          valor={buenas + defectos ? `${Math.round((defectos / (buenas + defectos)) * 100)} %` : '—'}
          tono={buenas + defectos && defectos / (buenas + defectos) >= 0.1 ? 'text-bajo' : 'text-alto'}
          nota={`${defectos} de ${buenas + defectos} producidas`}
        />
        <Kpi titulo="Predicciones acertadas" valor={predicciones.length ? `${aciertos} de ${predicciones.length}` : '—'} nota="a menos del 25 % del resultado" />
      </div>

      <SeccionInforme titulo="📈 Curva de mejora" descripcion={`Unidades con calidad (${s.unidad}) por ronda y por equipo.`}>
        <GraficaMejora equipos={vistaEquipos} marcadores={marcadores} totalRondas={s.total_rondas} unidad={s.unidad} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-sm">
            <thead className="text-left text-xs text-marmol-400">
              <tr>
                <th className="py-1.5 font-medium">Equipo</th>
                {Array.from({ length: s.total_rondas }, (_, i) => (
                  <th key={i} className="text-center font-medium">
                    R{i + 1}
                  </th>
                ))}
                <th className="text-right font-medium">Mejora</th>
                <th className="text-right font-medium">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(({ e, m }, i) => (
                <tr key={e.id} className="border-t border-marmol-100">
                  <td className="py-1.5 font-medium text-marmol-800">
                    {m.total > 0 ? MEDALLAS[i] ?? '' : ''} {e.emoji} {e.nombre}
                  </td>
                  {m.rondas.map((r) => (
                    <td key={r.ronda} className="text-center text-marmol-600">
                      {r.resultado ? (
                        <>
                          {r.resultado.unidades_buenas}
                          {r.resultado.defectos > 0 && <span className="text-[10px] text-bajo"> ({r.resultado.defectos}✗)</span>}
                          {r.tarjeta?.decision === 'estandar' && <span title="Idea adoptada como estándar"> ⭐</span>}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  ))}
                  <td className={cn('text-right font-semibold', (m.mejoraTotalPct ?? 0) > 0 ? 'text-alto' : (m.mejoraTotalPct ?? 0) < 0 ? 'text-bajo' : 'text-marmol-400')}>
                    {formatearPct(m.mejoraTotalPct)}
                  </td>
                  <td className="text-right font-display font-bold text-secundario">{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-[11px] text-marmol-400">Entre paréntesis, unidades con defecto. ⭐ = la idea de esa ronda se volvió estándar.</p>
        </div>
      </SeccionInforme>

      <SeccionInforme titulo="💡 Opciones de mejora" descripcion="Generadas a partir de los resultados de la carrera. Marca las que quieras llevar al plan de acción de un proceso.">
        <OpcionesMejora recomendaciones={recomendaciones} juego="kaizen" juegoId={s.id} procesos={procesos} procesoActualId={s.proceso_id} enviadas={enviadas} />
      </SeccionInforme>

      <SeccionInforme titulo="⭐ Estándares de cada equipo" descripcion="Las ideas que funcionaron y el equipo decidió adoptar.">
        <div className="grid gap-3 md:grid-cols-2">
          {ranking.map(({ e, m }) => (
            <div key={e.id} className="rounded-xl border border-marmol-200 p-3">
              <p className="font-semibold text-marmol-800">
                {e.emoji} {e.nombre}
              </p>
              {m.estandares.length === 0 ? (
                <p className="mt-1 text-sm text-marmol-400">No adoptó estándares.</p>
              ) : (
                <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-marmol-700">
                  {m.estandares.map((t) => {
                    const r = m.rondas.find((x) => x.ronda === t.ronda);
                    return (
                      <li key={t.ronda}>
                        {t.idea} <span className="text-xs text-marmol-400">(R{t.ronda}, {formatearPct(r?.mejoraPct ?? null)})</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          ))}
        </div>
      </SeccionInforme>

      <SeccionInforme titulo="📖 Tarjetas Kaizen por ronda" descripcion="El análisis de cada equipo: problema, causa, idea, predicción y resultado.">
        <div className="space-y-4">
          {ranking.map(({ e, m }) => {
            const rondas = m.rondas.filter((r) => r.tarjeta);
            if (rondas.length === 0) return null;
            return (
              <div key={e.id}>
                <p className="font-semibold text-marmol-800">
                  {e.emoji} {e.nombre}
                </p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {rondas.map((r) => (
                    <div key={r.ronda} className="rounded-lg bg-marmol-50 p-3 text-xs">
                      <p className="mb-1 font-semibold text-marmol-700">
                        Ronda {r.ronda} · resultado {r.resultado?.unidades_buenas ?? '—'} ({formatearPct(r.mejoraPct)})
                        {r.tarjeta?.decision === 'estandar' ? ' · ⭐ estándar' : r.tarjeta?.decision === 'descartada' ? ' · descartada' : ''}
                      </p>
                      <ResumenTarjeta tarjeta={r.tarjeta as TarjetaVista} unidad={s.unidad} compacto />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SeccionInforme>
    </div>
  );
}
