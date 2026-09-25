import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { procesosDe, refsEnviadas } from '@/lib/procesos-servidor';
import { nombreFacilitador } from '@/lib/usuarios';
import { CASO, CLAVES_MUDA, ESTADOS_OPORTUNIDAD, INSIGNIAS, MISIONES_ML, MUDAS, NIVELES_MADUREZ, diasTexto, marcadorMl, recomendacionesMl, type IntentoMl, type OportunidadMinima } from '@/lib/mudalab';
import { cn } from '@/lib/utils';
import { EncabezadoInforme, Kpi, SeccionInforme } from '@/components/informes/partes';
import { OpcionesMejora } from '@/components/informes/opciones-mejora';
import { EscaleraMadurez } from '@/components/mudalab/juego-mudalab';

export const metadata = { title: 'Informe · MudaLab' };

export default async function InformeMudaLab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = db();
  const { data: s } = await sb.from('ml_sesiones').select('*').eq('id', id).maybeSingle();
  if (!s) notFound();
  const facilitador = await getFacilitador();
  if (!puedeAdministrarReto(facilitador, s)) redirect(`/mudalab/${s.id}`);

  const [{ data: equipos }, { data: jugadores }, { data: intentos }, { data: oportunidades }, procesos, enviadas, facilita] = await Promise.all([
    sb.from('ml_equipos').select('id, nombre, emoji').eq('sesion_id', s.id).order('created_at'),
    sb.from('ml_jugadores').select('id').eq('sesion_id', s.id),
    sb.from('ml_intentos').select('equipo_id, mision, jugador_id, inicio, fin, aciertos, errores, puntos, resumen').eq('sesion_id', s.id),
    sb.from('ml_oportunidades').select('*').eq('sesion_id', s.id).order('created_at'),
    procesosDe(facilitador!),
    refsEnviadas(s.proceso_id, s.id),
    nombreFacilitador(s.creado_por),
  ]);
  const eqs = (equipos ?? []) as { id: string; nombre: string; emoji: string }[];
  const ints = (intentos ?? []) as IntentoMl[];
  const ops = (oportunidades ?? []) as OportunidadMinima[];
  const ranking = eqs.map((e) => ({ e, m: marcadorMl(e.id, ints, ops) })).sort((a, b) => b.m.total - a.m.total);
  const conDias = ranking.filter((x) => x.m.dias != null);
  const mejorDias = conDias.length ? Math.min(...conDias.map((x) => x.m.dias!)) : null;
  const sost = ranking.filter((x) => x.m.sostenibilidad != null);
  const promSost = sost.length ? sost.reduce((a, x) => a + x.m.sostenibilidad!, 0) / sost.length : null;
  const minutos = ops.reduce((a, o) => a + (Number(o.minutos_semana) || 0), 0);
  const recs = recomendacionesMl(eqs, ints, ops);
  const porMuda = CLAVES_MUDA.map((k) => ({ k, n: ops.filter((o) => o.muda === k).length })).sort((a, b) => b.n - a.n);
  const maxMuda = Math.max(1, ...porMuda.map((x) => x.n));

  return (
    <div className="space-y-5">
      <EncabezadoInforme
        volver={`/mudalab/${s.id}`}
        textoVolver="Volver al caso"
        tipo="Informe de MudaLab"
        titulo={s.titulo}
        subtitulo={s.descripcion}
        datos={[
          ['Facilitó', facilita ?? '—'],
          ['Expediente', `${CASO.expediente} · ${CASO.nombre}`],
          ['Equipos', String(eqs.length)],
          ['Participantes', String((jugadores ?? []).length)],
          ['Oportunidades reales', String(ops.length)],
        ]}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi titulo="Mejor resultado en el simulador" valor={mejorDias == null ? '—' : diasTexto(mejorDias)} nota={`antes ${diasTexto(CASO.diasBase)}`} tono="text-alto" />
        <Kpi titulo="Sostenibilidad promedio" valor={promSost == null ? '—' : `${Math.round(promSost)} %`} nota="misión Controlar" />
        <Kpi titulo="Mudas reales en el Banco" valor={String(ops.length)} nota={`${ops.filter((o) => o.estado === 'implementada').length} implementadas`} />
        <Kpi titulo="Minutos por semana a recuperar" valor={String(Math.round(minutos))} nota="según las oportunidades" tono="text-bajo" />
      </div>

      <SeccionInforme titulo="🏆 Resultados por agencia">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="text-right text-xs text-marmol-400">
              <tr>
                <th className="py-1 text-left font-medium">Equipo</th>
                {MISIONES_ML.slice(0, 5).map((m) => (
                  <th key={m.numero} className="font-medium">
                    {m.emoji} {m.fase}
                  </th>
                ))}
                <th className="font-medium">Banco</th>
                <th className="font-medium">Madurez</th>
                <th className="font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(({ e, m }) => (
                <tr key={e.id} className="border-t border-marmol-100 text-right">
                  <td className="py-1.5 text-left font-medium text-marmol-800">
                    {e.emoji} {e.nombre} <span title={m.insignias.map((k) => INSIGNIAS[k].nombre).join(', ')}>{m.insignias.map((k) => INSIGNIAS[k].emoji).join('')}</span>
                  </td>
                  {MISIONES_ML.slice(0, 5).map((x) => (
                    <td key={x.numero} className="text-marmol-600">
                      {m.porMision[x.numero]?.puntos ?? '—'}
                    </td>
                  ))}
                  <td className="text-marmol-600">{m.puntosBanco}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5">
                      <EscaleraMadurez madurez={m.madurez} compacta />
                      <span className="text-xs font-semibold">{m.nivel}/8</span>
                    </span>
                  </td>
                  <td className="font-display font-bold text-secundario">{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {NIVELES_MADUREZ.map((n, i) => {
            const cuantos = ranking.filter((x) => x.m.madurez[i]).length;
            return (
              <div key={n.nivel} className="rounded-lg bg-marmol-50 p-2 text-xs">
                <p className="font-semibold text-marmol-800">
                  {n.emoji} {n.nivel}. {n.nombre}
                </p>
                <p className="text-marmol-500">
                  {cuantos} de {eqs.length} equipos
                </p>
              </div>
            );
          })}
        </div>
      </SeccionInforme>

      <SeccionInforme titulo="💡 Opciones de mejora" descripcion="Generadas con las misiones y con las oportunidades más votadas del Banco. Marca las que quieras llevar al plan de acción de un proceso.">
        <OpcionesMejora recomendaciones={recs} juego="mudalab" juegoId={s.id} procesos={procesos} procesoActualId={s.proceso_id} enviadas={enviadas} />
      </SeccionInforme>

      {ops.length > 0 && (
        <SeccionInforme titulo="🏦 Banco de oportunidades" descripcion="Mudas reales que registraron los participantes en su propio trabajo.">
          <div className="mb-3 space-y-1">
            {porMuda
              .filter((x) => x.n > 0)
              .map(({ k, n }) => (
                <div key={k} className="grid grid-cols-[9rem_1fr_2rem] items-center gap-2 text-xs">
                  <span className="text-marmol-700">
                    {MUDAS[k].emoji} {MUDAS[k].nombre}
                  </span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-marmol-100">
                    <div className="h-full rounded-full bg-secundario" style={{ width: `${(n / maxMuda) * 100}%` }} />
                  </div>
                  <span className="text-right font-semibold text-marmol-700">{n}</span>
                </div>
              ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-xs">
              <thead className="text-marmol-400">
                <tr>
                  <th className="py-1 font-medium">Muda</th>
                  <th className="font-medium">Proceso y problema</th>
                  <th className="font-medium">Causa e idea</th>
                  <th className="font-medium">Estado</th>
                  <th className="text-right font-medium">👍</th>
                </tr>
              </thead>
              <tbody>
                {[...ops]
                  .sort((a, b) => (b.votos?.length ?? 0) - (a.votos?.length ?? 0))
                  .map((o) => (
                    <tr key={o.id} className="border-t border-marmol-100 align-top">
                      <td className="py-1.5 pr-2">{MUDAS[o.muda].emoji} {MUDAS[o.muda].nombre}</td>
                      <td className="pr-2">
                        <strong className="text-marmol-800">{o.proceso}</strong>
                        <span className="block text-marmol-600">{o.problema}</span>
                      </td>
                      <td className="pr-2 text-marmol-600">
                        {o.causa && <span className="block">🧩 {o.causa}</span>}
                        {o.idea && <span className="block">💡 {o.idea}</span>}
                      </td>
                      <td className={cn('whitespace-nowrap pr-2', o.estado === 'implementada' && 'text-alto')}>
                        {ESTADOS_OPORTUNIDAD[o.estado].emoji} {ESTADOS_OPORTUNIDAD[o.estado].nombre}
                        {o.resultado && <span className="block text-marmol-500">{o.resultado}</span>}
                      </td>
                      <td className="text-right font-semibold">{o.votos?.length ?? 0}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </SeccionInforme>
      )}
    </div>
  );
}
