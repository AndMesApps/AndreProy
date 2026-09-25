import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { procesosDe, refsEnviadas } from '@/lib/procesos-servidor';
import { nombreFacilitador } from '@/lib/usuarios';
import {
  COMPETENCIAS,
  MARCOS,
  NIVELES_COMPRENSION,
  PERFILES,
  RETOS,
  SENALES,
  dificultadSenales,
  erroresFrecuentes,
  marcadorRr,
  nivelComprension,
  promedioCompetencias,
  recomendacionesRr,
  type ConfigRuta,
  type IntentoRr,
  type Marco,
} from '@/lib/riesgo';
import { cn } from '@/lib/utils';
import { EncabezadoInforme, Kpi, SeccionInforme } from '@/components/informes/partes';
import { OpcionesMejora } from '@/components/informes/opciones-mejora';
import { BarrasCompetencias } from '@/components/riesgo/juego-riesgo';

export const metadata = { title: 'Cierre y evaluación · La Ruta del Riesgo' };

function Barra({ pct, umbral }: { pct: number; umbral?: number }) {
  return (
    <div className="relative h-2.5 overflow-hidden rounded-full bg-marmol-100">
      <div className={cn('h-full rounded-full', umbral == null ? 'bg-secundario' : pct >= umbral ? 'bg-marca-500' : pct >= 50 ? 'bg-acento' : 'bg-bajo')} style={{ width: `${pct}%` }} />
      {umbral != null && <div className="absolute inset-y-0 w-0.5 bg-secundario/60" style={{ left: `${umbral}%` }} />}
    </div>
  );
}

export default async function InformeRiesgo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = db();
  const { data: s } = await sb.from('rr_sesiones').select('*').eq('id', id).maybeSingle();
  if (!s) notFound();
  const facilitador = await getFacilitador();
  if (!puedeAdministrarReto(facilitador, s)) redirect(`/riesgo/${s.id}`);

  const [{ data: equipos }, { data: jugadores }, { data: intentos }, procesos, enviadas, facilita] = await Promise.all([
    sb.from('rr_equipos').select('id, nombre, emoji').eq('sesion_id', s.id).order('created_at'),
    sb.from('rr_jugadores').select('id, equipo_id, nombres, apellidos, cargo, area').eq('sesion_id', s.id).order('apellidos'),
    sb.from('rr_intentos').select('equipo_id, reto, jugador_id, inicio, fin, aciertos, errores, puntos, resumen').eq('sesion_id', s.id),
    procesosDe(facilitador!),
    refsEnviadas(s.proceso_id, s.id),
    nombreFacilitador(s.creado_por),
  ]);
  const config: ConfigRuta = { marco: s.marco as Marco, responsable: s.responsable, canal: s.canal, umbral: s.umbral };
  const eqs = (equipos ?? []) as { id: string; nombre: string; emoji: string }[];
  const jugs = (jugadores ?? []) as { id: string; equipo_id: string; nombres: string; apellidos: string; cargo: string; area: string | null }[];
  const ints = (intentos ?? []) as IntentoRr[];
  const ranking = eqs.map((e) => ({ e, m: marcadorRr(e.id, ints, config.umbral) })).sort((a, b) => b.m.total - a.m.total);
  const conJuego = ranking.filter((x) => x.m.retos > 0);
  const certificados = conJuego.filter((x) => x.m.certificado);
  const comprensiones = conJuego.map((x) => x.m.comprension).filter((v): v is number => v != null);
  const promedio = comprensiones.length ? Math.round(comprensiones.reduce((a, b) => a + b, 0) / comprensiones.length) : null;
  const retosHechos = ints.filter((i) => i.fin).length;
  const ignoradas = conJuego.reduce((a, x) => a + x.m.ignoradas, 0);
  const confidencial = conJuego.reduce((a, x) => a + x.m.confidencial, 0);
  const competencias = promedioCompetencias(conJuego.map((x) => x.m)).sort((a, b) => (a.promedio ?? 101) - (b.promedio ?? 101));
  const senales = dificultadSenales(ints);
  const errores = erroresFrecuentes(ints, 10);
  const recs = recomendacionesRr(eqs, ints, config);
  const marcadorDe = new Map(ranking.map((x) => [x.e.id, x.m]));

  return (
    <div className="space-y-5">
      <EncabezadoInforme
        volver={`/riesgo/${s.id}`}
        textoVolver="Volver a la sesión"
        tipo="Cierre y evaluación · La Ruta del Riesgo"
        titulo={s.titulo}
        subtitulo={s.descripcion}
        datos={[
          ['Facilitó', facilita ?? '—'],
          ['Sistema', MARCOS[config.marco]?.nombre ?? '—'],
          ['Ruta de escalamiento', `${config.responsable} · ${config.canal}`],
          ['Equipos', String(eqs.length)],
          ['Participantes', String(jugs.length)],
        ]}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi titulo="Guardianes del Riesgo" valor={`${certificados.length} de ${conJuego.length}`} nota={`equipos certificados (mínimo ${config.umbral} %)`} tono="text-alto" />
        <Kpi titulo="Comprensión promedio" valor={promedio == null ? '—' : `${promedio} %`} nota={promedio == null ? '' : `${nivelComprension(promedio).emoji} ${nivelComprension(promedio).nombre}`} />
        <Kpi titulo="Retos completados" valor={String(retosHechos)} nota={`de ${eqs.length * RETOS.length} posibles`} />
        <Kpi titulo="Alertas ignoradas" valor={String(ignoradas)} nota={`${confidencial} veces se compartió información reservada`} tono={ignoradas + confidencial ? 'text-bajo' : 'text-alto'} />
      </div>

      <SeccionInforme titulo="🏆 Resultado por equipo" descripcion="Participación, retos completados, nivel de comprensión y certificación.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="text-right text-xs text-marmol-400">
              <tr>
                <th className="py-1 text-left font-medium">Equipo</th>
                {RETOS.map((r) => (
                  <th key={r.numero} className="font-medium" title={r.titulo}>
                    {r.emoji}
                  </th>
                ))}
                <th className="font-medium">Comprensión</th>
                <th className="font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(({ e, m }) => {
                const nivel = m.comprension == null ? null : nivelComprension(m.comprension);
                return (
                  <tr key={e.id} className="border-t border-marmol-100 text-right align-top">
                    <td className="py-1.5 text-left">
                      <span className="font-medium text-marmol-800">
                        {e.emoji} {e.nombre}
                      </span>
                      {m.certificado && <span className="ml-1 rounded-full bg-secundario px-1.5 py-0.5 text-[10px] font-bold text-acento">🛡️ Guardián</span>}
                      <span className="block text-[11px] text-marmol-500">
                        {m.perfiles.map((k) => `${PERFILES[k].emoji} ${PERFILES[k].nombre}`).join(' · ') || 'sin perfiles aún'} · {m.participantes} participantes
                      </span>
                      {!m.certificado && m.retos > 0 && <span className="block text-[11px] text-medio">Le falta: {m.faltas.slice(0, 3).join(' · ')}</span>}
                    </td>
                    {RETOS.map((r) => (
                      <td key={r.numero} className="text-marmol-600">
                        {m.porReto[r.numero]?.puntos ?? '—'}
                      </td>
                    ))}
                    <td className="whitespace-nowrap">{nivel ? `${nivel.emoji} ${m.comprension} %` : '—'}</td>
                    <td className="font-display font-bold text-secundario">{m.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 space-y-3">
          {conJuego.map(({ e, m }) => (
            <div key={e.id} className="rounded-lg bg-marmol-50 p-2">
              <p className="mb-1 text-xs font-semibold text-marmol-700">
                {e.emoji} {e.nombre}
              </p>
              <BarrasCompetencias m={m} umbral={config.umbral} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-marmol-500">
          Niveles de comprensión: {NIVELES_COMPRENSION.map((n) => `${n.emoji} ${n.nombre} (${n.desde} % o más: ${n.ayuda.toLowerCase()})`).join(' · ')}
        </p>
      </SeccionInforme>

      <div className="grid gap-5 lg:grid-cols-2">
        <SeccionInforme titulo="🧩 Conceptos que requieren refuerzo" descripcion={`Promedio de todos los equipos. La raya marca el mínimo para certificar (${config.umbral} %).`}>
          <div className="space-y-2">
            {competencias.map(({ competencia, promedio: p, equipos: n }) => (
              <div key={competencia} className="text-xs">
                <p className="flex justify-between text-marmol-700">
                  <span>
                    {COMPETENCIAS[competencia].emoji} {COMPETENCIAS[competencia].nombre}
                  </span>
                  <span className="font-semibold">{p == null ? 'sin datos' : `${p} % · ${n} equipos`}</span>
                </p>
                <Barra pct={p ?? 0} umbral={config.umbral} />
              </div>
            ))}
          </div>
        </SeccionInforme>

        <SeccionInforme titulo="🚩 Señales de alerta con mayor dificultad" descripcion="Qué tanto se reconoció cada tipo de señal (de la más difícil a la más fácil).">
          {senales.length === 0 ? (
            <p className="text-sm text-marmol-400">Todavía no hay retos entregados.</p>
          ) : (
            <div className="space-y-2">
              {senales.map((x) => (
                <div key={x.tipo} className="text-xs">
                  <p className="flex justify-between text-marmol-700">
                    <span>
                      {SENALES[x.tipo].emoji} {SENALES[x.tipo].nombre}
                    </span>
                    <span className={cn('font-semibold', x.pct < 60 ? 'text-bajo' : 'text-marmol-700')}>
                      {x.pct} % ({x.detectadas}/{x.total})
                    </span>
                  </p>
                  <Barra pct={x.pct} umbral={60} />
                </div>
              ))}
            </div>
          )}
        </SeccionInforme>
      </div>

      <SeccionInforme titulo="❗ Errores frecuentes" descripcion="Lo que más se repitió entre equipos. Úsenlo como guion para la conversación de cierre.">
        {errores.length === 0 ? (
          <p className="text-sm text-marmol-400">Sin errores registrados todavía.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {errores.map((x) => (
              <li key={x.texto} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 rounded-full bg-red-50 px-2 text-[11px] font-semibold text-bajo">
                  {x.equipos} {x.equipos === 1 ? 'equipo' : 'equipos'}
                </span>
                <span className="text-marmol-700">{x.texto}</span>
              </li>
            ))}
          </ul>
        )}
      </SeccionInforme>

      <SeccionInforme titulo="👥 Resultado por colaborador" descripcion="Cada persona con los retos que entregó y el resultado de su equipo.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-xs">
            <thead className="text-marmol-400">
              <tr>
                <th className="py-1 font-medium">Persona</th>
                <th className="font-medium">Equipo</th>
                <th className="text-right font-medium">Retos que entregó</th>
                <th className="text-right font-medium">Retos del equipo</th>
                <th className="font-medium">Comprensión</th>
                <th className="font-medium">Certificación</th>
              </tr>
            </thead>
            <tbody>
              {jugs.map((j) => {
                const m = marcadorDe.get(j.equipo_id);
                const e = eqs.find((x) => x.id === j.equipo_id);
                const propios = ints.filter((i) => i.jugador_id === j.id && i.fin).length;
                return (
                  <tr key={j.id} className="border-t border-marmol-100">
                    <td className="py-1.5">
                      <strong className="text-marmol-800">
                        {j.nombres} {j.apellidos}
                      </strong>
                      <span className="block text-marmol-500">
                        {j.cargo}
                        {j.area ? ` · ${j.area}` : ''}
                      </span>
                    </td>
                    <td>{e ? `${e.emoji} ${e.nombre}` : '—'}</td>
                    <td className="text-right">{propios}</td>
                    <td className="text-right">{m?.retos ?? 0}/8</td>
                    <td>{m?.comprension == null ? '—' : `${nivelComprension(m.comprension).emoji} ${m.comprension} %`}</td>
                    <td className={m?.certificado ? 'font-semibold text-alto' : 'text-marmol-500'}>{m?.certificado ? '🛡️ Guardián del Riesgo' : 'Refuerzo'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SeccionInforme>

      <SeccionInforme titulo="💡 Recomendaciones de refuerzo" descripcion="Generadas con los resultados. Marca las que quieras llevar al plan de acción de un proceso.">
        <OpcionesMejora recomendaciones={recs} juego="riesgo" juegoId={s.id} procesos={procesos} procesoActualId={s.proceso_id} enviadas={enviadas} />
      </SeccionInforme>

      <p className="text-[11px] text-marmol-400">
        Este juego es un concepto de gamificación. Las reglas concretas, los responsables, los umbrales y las rutas de reporte dependen del tipo de entidad, de la normativa
        vigente y del sistema de prevención de cada organización.
      </p>
    </div>
  );
}
