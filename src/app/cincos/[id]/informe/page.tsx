import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { procesosDe, refsEnviadas } from '@/lib/procesos-servidor';
import { nombreFacilitador } from '@/lib/usuarios';
import { AUDITORIA, ESCENARIOS, MISIONES, RESULTADOS_REALES, formatearTiempo, marcador5S, porcentaje5S, recomendaciones5S, type ClaveEscenario, type IntentoMinimo, type MisionRealMinima } from '@/lib/cincos';
import { cn } from '@/lib/utils';
import { EncabezadoInforme, Kpi, SeccionInforme } from '@/components/informes/partes';
import { OpcionesMejora } from '@/components/informes/opciones-mejora';

export const metadata = { title: 'Informe · Reto 5S' };

export default async function Informe5S({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = db();
  const { data: s } = await sb.from('s5_sesiones').select('*').eq('id', id).maybeSingle();
  if (!s) notFound();
  const facilitador = await getFacilitador();
  if (!puedeAdministrarReto(facilitador, s)) redirect(`/cincos/${s.id}`);

  const [{ data: equipos }, { data: jugadores }, { data: intentos }, { data: reales }, procesos, enviadas, facilita] = await Promise.all([
    sb.from('s5_equipos').select('id, nombre, emoji').eq('sesion_id', s.id).order('created_at'),
    sb.from('s5_jugadores').select('id').eq('sesion_id', s.id),
    sb.from('s5_intentos').select('equipo_id, mision, jugador_id, inicio, fin, aciertos, errores, puntos').eq('sesion_id', s.id),
    sb.from('s5_misiones_reales').select('*').eq('sesion_id', s.id),
    procesosDe(facilitador!),
    refsEnviadas(s.proceso_id, s.id),
    nombreFacilitador(s.creado_por),
  ]);
  const eqs = (equipos ?? []) as { id: string; nombre: string; emoji: string }[];
  const ints = (intentos ?? []) as IntentoMinimo[];
  const rs: Record<string, MisionRealMinima> = {};
  for (const r of (reales ?? []) as any[]) rs[r.equipo_id] = r;
  const ranking = eqs.map((e) => ({ e, m: marcador5S(e.id, ints, rs[e.id]) })).sort((a, b) => b.m.total - a.m.total);
  const conReal = eqs.filter((e) => rs[e.id] && rs[e.id]!.estado !== 'borrador');
  const prom = (f: (m: MisionRealMinima) => number | null) => {
    const v = conReal.map((e) => f(rs[e.id]!)).filter((x): x is number => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const antes = prom((m) => porcentaje5S(m.auditoria_antes));
  const despues = prom((m) => porcentaje5S(m.auditoria_despues));
  const totalRes = (clave: string) => conReal.reduce((a, e) => a + (Number(rs[e.id]!.resultados?.[clave]) || 0), 0);
  const recs = recomendaciones5S(eqs, ints, rs);
  const esc = ESCENARIOS[s.escenario as ClaveEscenario];

  return (
    <div className="space-y-5">
      <EncabezadoInforme
        volver={`/cincos/${s.id}`}
        textoVolver="Volver al reto"
        tipo="Informe de Reto 5S"
        titulo={s.titulo}
        subtitulo={s.descripcion}
        datos={[
          ['Facilitó', facilita ?? '—'],
          ['Escenario', `${esc.emoji} ${esc.nombre}`],
          ['Equipos', String(eqs.length)],
          ['Participantes', String((jugadores ?? []).length)],
          ['Misiones reales', `${conReal.length} de ${eqs.length}`],
        ]}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi titulo="% 5S de los espacios reales" valor={despues == null ? '—' : `${Math.round(despues)} %`} nota={antes == null ? undefined : `antes ${Math.round(antes)} %`} tono="text-alto" />
        <Kpi titulo="Minutos ahorrados al día" valor={String(totalRes('minutos_ahorrados'))} nota="suma de los equipos" />
        <Kpi titulo="Elementos eliminados" valor={String(totalRes('elementos_eliminados'))} nota={`${totalRes('espacio_liberado')} m² liberados`} />
        <Kpi titulo="Riesgos eliminados" valor={String(totalRes('riesgos_eliminados'))} tono="text-bajo" />
      </div>

      <SeccionInforme titulo="🏆 Resultados por equipo">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="text-right text-xs text-marmol-400">
              <tr>
                <th className="py-1 text-left font-medium">Equipo</th>
                {MISIONES.slice(0, 5).map((m) => (
                  <th key={m.numero} className="font-medium">
                    {m.emoji} {m.s}
                  </th>
                ))}
                <th className="font-medium">Real</th>
                <th className="font-medium">5S</th>
                <th className="font-medium">Tiempo</th>
                <th className="font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(({ e, m }) => (
                <tr key={e.id} className="border-t border-marmol-100 text-right">
                  <td className="py-1.5 text-left font-medium text-marmol-800">
                    {e.emoji} {e.nombre}
                  </td>
                  {MISIONES.slice(0, 5).map((x) => (
                    <td key={x.numero} className="text-marmol-600">
                      {m.porMision[x.numero]?.puntos ?? '—'}
                    </td>
                  ))}
                  <td className="text-marmol-600">{m.puntosReal}</td>
                  <td className={cn('font-semibold', (m.cincoS ?? 0) >= 80 ? 'text-alto' : 'text-medio')}>{m.cincoS == null ? '—' : `${Math.round(m.cincoS)} %`}</td>
                  <td className="text-marmol-600">{m.segundos ? formatearTiempo(m.segundos) : '—'}</td>
                  <td className="font-display font-bold text-secundario">{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SeccionInforme>

      <SeccionInforme titulo="💡 Opciones de mejora" descripcion="Generadas con las misiones y las auditorías. Marca las que quieras llevar al plan de acción de un proceso.">
        <OpcionesMejora recomendaciones={recs} juego="cincos" juegoId={s.id} procesos={procesos} procesoActualId={s.proceso_id} enviadas={enviadas} />
      </SeccionInforme>

      {conReal.length > 0 && (
        <SeccionInforme titulo="🚀 Misiones reales">
          <div className="grid gap-3 md:grid-cols-2">
            {conReal.map((e) => {
              const m = rs[e.id]!;
              return (
                <div key={e.id} className="rounded-xl border border-marmol-200 p-3 text-sm">
                  <p className="font-semibold text-marmol-800">
                    {e.emoji} {e.nombre} · {m.area ?? '—'}
                  </p>
                  <p className="text-xs text-marmol-500">
                    % 5S {Math.round(porcentaje5S(m.auditoria_antes) ?? 0)} % → <strong className="text-alto">{Math.round(porcentaje5S(m.auditoria_despues) ?? 0)} %</strong> · {m.estado}
                  </p>
                  <ul className="mt-1 ml-4 list-disc text-xs text-marmol-600">
                    {AUDITORIA.filter((a) => m.acciones?.[a.s]).map((a) => (
                      <li key={a.s}>
                        <strong>{a.s}:</strong> {m.acciones[a.s]}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-xs text-marmol-500">
                    {RESULTADOS_REALES.filter((r) => Number(m.resultados?.[r.clave]) > 0)
                      .map((r) => `${r.nombre}: ${m.resultados[r.clave]} ${r.unidad}`)
                      .join(' · ')}
                  </p>
                </div>
              );
            })}
          </div>
        </SeccionInforme>
      )}
    </div>
  );
}
