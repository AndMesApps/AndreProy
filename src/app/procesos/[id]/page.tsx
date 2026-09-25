import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import {
  FRECUENCIAS,
  SEMAFOROS,
  avanceMeta,
  formatearValor,
  recomendacionesProceso,
  semaforo,
  ultimaMedicion,
  type Frecuencia,
  type ProcesoMinimo,
} from '@/lib/procesos';
import { nombreFacilitador } from '@/lib/usuarios';
import { EncabezadoInforme, Kpi, SeccionInforme } from '@/components/informes/partes';
import { FormularioProceso } from '@/components/procesos/formulario-proceso';
import { GraficaIndicador } from '@/components/procesos/grafica-indicador';
import { Mediciones } from '@/components/procesos/mediciones';
import { PlanAccion, SugerenciasProceso, type AccionVista } from '@/components/procesos/plan-accion';
import { JuegosProceso, OpcionesProceso, type JuegoVinculable } from '@/components/procesos/juegos-proceso';

export const metadata = { title: 'Proceso · Control de procesos' };

export default async function ProcesoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const facilitador = await getFacilitador();
  if (!facilitador) redirect('/ingresar');

  const sb = db();
  const { data: p } = await sb.from('pc_procesos').select('*').eq('id', id).maybeSingle();
  if (!p) notFound();
  if (!puedeAdministrarReto(facilitador, p)) redirect('/procesos');

  let consultaRetos = sb.from('mk_retos').select('id, titulo, estado, proceso_id').order('created_at', { ascending: false }).limit(100);
  let consultaCarreras = sb.from('kz_sesiones').select('id, titulo, estado, proceso_id').order('created_at', { ascending: false }).limit(100);
  let consulta5S = sb.from('s5_sesiones').select('id, titulo, estado, proceso_id').order('created_at', { ascending: false }).limit(100);
  if (facilitador.rol !== 'admin') {
    consultaRetos = consultaRetos.eq('creado_por', facilitador.id);
    consultaCarreras = consultaCarreras.eq('creado_por', facilitador.id);
    consulta5S = consulta5S.eq('creado_por', facilitador.id);
  }
  const [{ data: mediciones }, { data: acciones }, { data: retos }, { data: carreras }, { data: retos5s }] = await Promise.all([
    sb.from('pc_mediciones').select('id, fecha, valor, nota').eq('proceso_id', id).order('fecha'),
    sb.from('pc_acciones').select('id, titulo, detalle, responsable, fecha_compromiso, estado, origen, created_at').eq('proceso_id', id),
    consultaRetos,
    consultaCarreras,
    consulta5S,
  ]);

  const proceso: ProcesoMinimo = {
    nombre: p.nombre,
    indicador: p.indicador,
    unidad: p.unidad,
    sentido: p.sentido,
    linea_base: p.linea_base == null ? null : Number(p.linea_base),
    meta: p.meta == null ? null : Number(p.meta),
    frecuencia: p.frecuencia as Frecuencia,
  };
  const meds = ((mediciones ?? []) as any[]).map((m) => ({ id: m.id as string, fecha: m.fecha as string, valor: Number(m.valor), nota: m.nota as string | null }));
  const listaAcciones = (acciones ?? []) as AccionVista[];
  const juegos: JuegoVinculable[] = [
    ...((retos ?? []) as any[]).map((r) => ({ juego: 'makigami' as const, id: r.id, titulo: r.titulo, estado: r.estado, procesoId: r.proceso_id })),
    ...((carreras ?? []) as any[]).map((r) => ({ juego: 'kaizen' as const, id: r.id, titulo: r.titulo, estado: r.estado, procesoId: r.proceso_id })),
    ...((retos5s ?? []) as any[]).map((r) => ({ juego: 'cincos' as const, id: r.id, titulo: r.titulo, estado: r.estado, procesoId: r.proceso_id })),
  ];
  const juegosUnidos = juegos.filter((j) => j.procesoId === id).length;

  const consultor = await nombreFacilitador(p.creado_por);
  const { data: proyecto } = p.proyecto_id ? await sb.from('pr_proyectos').select('id, nombre').eq('id', p.proyecto_id).maybeSingle() : { data: null };
  const ultima = ultimaMedicion(meds);
  const avance = avanceMeta(proceso, ultima?.valor ?? null);
  const sem = SEMAFOROS[semaforo(proceso, meds)];
  const recomendaciones = recomendacionesProceso(proceso, meds, listaAcciones, juegosUnidos);
  const mejora = ultima && proceso.linea_base ? ((proceso.linea_base - ultima.valor) / proceso.linea_base) * (proceso.sentido === 'bajar' ? 100 : -100) : null;

  return (
    <div className="space-y-5">
      <EncabezadoInforme
        volver="/procesos"
        textoVolver="Control de procesos"
        tipo="Control de procesos"
        titulo={p.nombre}
        subtitulo={p.objetivo}
        datos={[
          ['Consultora', consultor ?? '—'],
          ...(proyecto ? ([['Proyecto', proyecto.nombre as string]] as [string, string][]) : []),
          ['Cliente', p.cliente || '—'],
          ['Área', p.area || '—'],
          ['Dueño del proceso', p.responsable || '—'],
          ['Se mide', FRECUENCIAS[proceso.frecuencia].toLowerCase()],
          ['Estado', `${sem.emoji} ${sem.nombre}`],
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FormularioProceso
          procesoId={p.id}
          datosIniciales={{
            nombre: p.nombre,
            cliente: p.cliente ?? '',
            area: p.area ?? '',
            responsable: p.responsable ?? '',
            objetivo: p.objetivo ?? '',
            indicador: p.indicador,
            unidad: p.unidad,
            sentido: p.sentido,
            lineaBase: proceso.linea_base == null ? '' : String(proceso.linea_base),
            meta: proceso.meta == null ? '' : String(proceso.meta),
            frecuencia: proceso.frecuencia,
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          {proyecto && (
            <Link href={`/proyectos/${proyecto.id}`} className="no-imprimir text-xs font-semibold text-marca-600 hover:underline">
              🗂️ Ir al proyecto
            </Link>
          )}
          <OpcionesProceso procesoId={p.id} activo={p.activo} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi titulo="Línea base" valor={formatearValor(proceso.linea_base, p.unidad)} tono="text-marmol-700" />
        <Kpi titulo="Meta" valor={formatearValor(proceso.meta, p.unidad)} tono="text-alto" nota={proceso.sentido === 'bajar' ? 'mejorar = bajar' : 'mejorar = subir'} />
        <Kpi titulo="Última medición" valor={formatearValor(ultima?.valor, p.unidad)} nota={mejora != null ? `${mejora > 0 ? 'mejoró' : 'empeoró'} ${Math.abs(Math.round(mejora))} % vs. la base` : undefined} />
        <Kpi
          titulo="Avance hacia la meta"
          valor={avance == null ? '—' : `${Math.round(avance * 100)} %`}
          tono={avance == null ? 'text-marmol-400' : avance >= 1 ? 'text-alto' : avance > 0 ? 'text-medio' : 'text-bajo'}
        />
      </div>

      <SeccionInforme titulo={`📈 ${p.indicador}`} descripcion={`En ${p.unidad}. La línea verde es la meta; la punteada gris, la línea base.`}>
        <GraficaIndicador proceso={proceso} mediciones={meds} />
        <div className="mt-4">
          <Mediciones procesoId={p.id} proceso={proceso} mediciones={meds} />
        </div>
      </SeccionInforme>

      <SeccionInforme titulo="💡 Opciones de mejora" descripcion="Según el indicador, las mediciones y el plan de acción.">
        <SugerenciasProceso procesoId={p.id} recomendaciones={recomendaciones} />
      </SeccionInforme>

      <SeccionInforme titulo="📋 Plan de acción" descripcion="Qué se va a hacer, quién lo hace, para cuándo y en qué va.">
        <PlanAccion procesoId={p.id} acciones={listaAcciones} />
      </SeccionInforme>

      <SeccionInforme titulo="🎲 Juegos sobre este proceso" descripcion="Los talleres que alimentan este proceso con hallazgos y mejoras.">
        <JuegosProceso procesoId={p.id} juegos={juegos} />
      </SeccionInforme>
    </div>
  );
}
