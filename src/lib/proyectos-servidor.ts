import 'server-only';
import { db } from '@/lib/supabase/server';
import { puedeAdministrarReto, type Facilitador } from '@/lib/auth';
import { semaforo, ultimaMedicion, type Frecuencia, type ProcesoMinimo } from '@/lib/procesos';
import type { HitoVista } from '@/components/proyectos/cronograma';
import type { IntervencionVista } from '@/components/proyectos/bitacora';
import type { KpiVista, MedicionVista, ObjetivoVista } from '@/components/proyectos/objetivos-kpis';
import type { DocumentoVista, RiesgoVista } from '@/components/proyectos/finanzas-riesgos-documentos';
import type { MovimientoVista, PresupuestoVista } from '@/components/proyectos/finanzas';
import type { ProcesoDelProyecto } from '@/components/proyectos/procesos-proyecto';
import type { Referencias } from '@/components/proyectos/registro';
import type { EstadoProyecto, TipoProyecto } from '@/lib/proyectos';

export interface ProyectoCompleto {
  id: string;
  nombre: string;
  cliente: string;
  grupo: string | null;
  tipo: TipoProyecto;
  programa: string | null;
  descripcion: string | null;
  objetivo_general: string | null;
  contacto_nombre: string | null;
  contacto_cargo: string | null;
  contacto_correo: string | null;
  contacto_celular: string | null;
  gestor_externo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  fecha_cierre_limite: string | null;
  horas_contratadas: number | null;
  valor_contrato: number | null;
  frecuencia_dias: number | null;
  estado: EstadoProyecto;
  reglas: string | null;
  enlaces: string | null;
  creado_por: string | null;
  modalidad_cobro: 'valor_fijo' | 'por_horas' | 'mixto';
  valor_hora: number | null;
  cobra_iva: boolean;
  retefuente_pct: number | null;
  reteica_por_mil: number | null;
  otras_retenciones_pct: number;
  participacion_aliado_pct: number;
  viaticos_pactados: number | null;
  requisitos_cobro: string | null;
}

const num = (v: unknown) => (v == null ? null : Number(v));

/** Todo lo de un proyecto, si el facilitador puede verlo; null si no existe o no es suyo. */
export async function cargarProyecto(id: string, facilitador: Facilitador) {
  const sb = db();
  const { data: p } = await sb.from('pr_proyectos').select('*').eq('id', id).maybeSingle();
  if (!p || !puedeAdministrarReto(facilitador, p)) return null;

  let consultaLibres = sb.from('pc_procesos').select('id, nombre, cliente, proyecto_id').eq('activo', true).order('nombre');
  if (facilitador.rol !== 'admin') consultaLibres = consultaLibres.eq('creado_por', facilitador.id);

  const [hitos, objetivos, kpis, mediciones, bitacora, pagos, riesgos, documentos, procesos, libres, presupuesto] = await Promise.all([
    sb.from('pr_hitos').select('*').eq('proyecto_id', id).order('orden'),
    sb.from('pr_objetivos').select('*').eq('proyecto_id', id).order('created_at'),
    sb.from('pr_kpis').select('*').eq('proyecto_id', id).order('created_at'),
    sb.from('pr_mediciones').select('*').eq('proyecto_id', id).order('fecha'),
    sb.from('pr_bitacora').select('*').eq('proyecto_id', id).order('fecha', { ascending: false }),
    sb.from('pr_pagos').select('*').eq('proyecto_id', id),
    sb.from('pr_riesgos').select('*').eq('proyecto_id', id).order('created_at'),
    sb.from('pr_documentos').select('*').eq('proyecto_id', id),
    sb.from('pc_procesos').select('id, nombre, indicador, unidad, sentido, linea_base, meta, frecuencia').eq('proyecto_id', id),
    consultaLibres,
    sb.from('pr_presupuesto').select('*').eq('proyecto_id', id).order('created_at'),
  ]);

  const listaProcesos = (procesos.data ?? []) as any[];
  const idsProcesos = listaProcesos.map((x) => x.id as string);
  const [medProc, accProc, retos, carreras, retos5s] = idsProcesos.length
    ? await Promise.all([
        sb.from('pc_mediciones').select('proceso_id, fecha, valor').in('proceso_id', idsProcesos),
        sb.from('pc_acciones').select('proceso_id, estado').in('proceso_id', idsProcesos),
        sb.from('mk_retos').select('proceso_id').in('proceso_id', idsProcesos),
        sb.from('kz_sesiones').select('proceso_id').in('proceso_id', idsProcesos),
        sb.from('s5_sesiones').select('proceso_id').in('proceso_id', idsProcesos),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const vistaProcesos: ProcesoDelProyecto[] = listaProcesos.map((x) => {
    const proc: ProcesoMinimo = { ...x, linea_base: num(x.linea_base), meta: num(x.meta), frecuencia: x.frecuencia as Frecuencia };
    const meds = ((medProc.data ?? []) as any[]).filter((m) => m.proceso_id === x.id).map((m) => ({ fecha: m.fecha as string, valor: Number(m.valor) }));
    return {
      id: x.id,
      nombre: x.nombre,
      indicador: x.indicador,
      unidad: x.unidad,
      meta: proc.meta,
      ultima: ultimaMedicion(meds)?.valor ?? null,
      semaforo: semaforo(proc, meds),
      accionesAbiertas: ((accProc.data ?? []) as any[]).filter((a) => a.proceso_id === x.id && (a.estado === 'pendiente' || a.estado === 'en_curso')).length,
      juegos: [...((retos.data ?? []) as any[]), ...((carreras.data ?? []) as any[]), ...((retos5s.data ?? []) as any[])].filter((j) => j.proceso_id === x.id).length,
    };
  });

  const vHitos = ((hitos.data ?? []) as any[]).map((h) => ({ ...h, peso: Number(h.peso) || 0, horas_estimadas: num(h.horas_estimadas) })) as HitoVista[];
  const vObjetivos = ((objetivos.data ?? []) as any[]).map((o) => ({ ...o, avance: num(o.avance), peso: Number(o.peso) || 0 })) as ObjetivoVista[];
  const vKpis = ((kpis.data ?? []) as any[]).map((k) => ({ ...k, linea_base: num(k.linea_base), meta: num(k.meta) })) as KpiVista[];
  const vMediciones = ((mediciones.data ?? []) as any[]).map((m) => ({ ...m, valor: Number(m.valor) })) as MedicionVista[];
  const vBitacora = (bitacora.data ?? []) as IntervencionVista[];
  const vPagos = ((pagos.data ?? []) as any[]).map((x) => ({ ...x, valor: Number(x.valor), horas: num(x.horas), requisitos_cumplidos: x.requisitos_cumplidos ?? [] })) as MovimientoVista[];
  const vPresupuesto = ((presupuesto.data ?? []) as any[]).map((x) => ({ ...x, valor_planeado: Number(x.valor_planeado) })) as PresupuestoVista[];

  const referencias: Referencias = {
    hitos: vHitos.map((h) => ({ id: h.id, etiqueta: `${h.fase ? `${h.fase} · ` : ''}${h.nombre}` })),
    objetivos: vObjetivos.map((o, i) => ({ id: o.id, etiqueta: `${i + 1}. ${o.descripcion.slice(0, 80)}` })),
    kpis: vKpis.map((k) => ({ id: k.id, etiqueta: k.nombre })),
  };

  return {
    proyecto: {
      ...p,
      horas_contratadas: num(p.horas_contratadas),
      valor_contrato: num(p.valor_contrato),
      valor_hora: num(p.valor_hora),
      retefuente_pct: num(p.retefuente_pct),
      reteica_por_mil: num(p.reteica_por_mil),
      otras_retenciones_pct: Number(p.otras_retenciones_pct) || 0,
      participacion_aliado_pct: Number(p.participacion_aliado_pct) || 0,
      viaticos_pactados: num(p.viaticos_pactados),
      modalidad_cobro: p.modalidad_cobro ?? 'valor_fijo',
      cobra_iva: Boolean(p.cobra_iva),
    } as ProyectoCompleto,
    hitos: vHitos,
    objetivos: vObjetivos,
    kpis: vKpis,
    mediciones: vMediciones,
    bitacora: vBitacora,
    pagos: vPagos,
    presupuesto: vPresupuesto,
    riesgos: (riesgos.data ?? []) as RiesgoVista[],
    documentos: (documentos.data ?? []) as DocumentoVista[],
    procesos: vistaProcesos,
    procesosLibres: ((libres.data ?? []) as any[]).filter((x) => x.proyecto_id !== id).map((x) => ({ id: x.id as string, nombre: x.nombre as string, cliente: x.cliente as string | null })),
    referencias,
  };
}

export type DatosProyectoCompleto = NonNullable<Awaited<ReturnType<typeof cargarProyecto>>>;
