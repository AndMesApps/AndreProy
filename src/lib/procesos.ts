/**
 * Control de procesos — estado del indicador frente a la meta y opciones
 * de mejora del proceso. Funciones puras (servidor y navegador).
 */
import type { Recomendacion } from '@/lib/recomendaciones';

export const ESTADOS_ACCION = {
  pendiente: { nombre: 'Pendiente', clase: 'bg-marmol-100 text-marmol-600' },
  en_curso: { nombre: 'En curso', clase: 'bg-blue-100 text-deber' },
  hecha: { nombre: 'Hecha', clase: 'bg-marca-100 text-marca-700' },
  descartada: { nombre: 'Descartada', clase: 'bg-marmol-100 text-marmol-400 line-through' },
} as const;
export type EstadoAccion = keyof typeof ESTADOS_ACCION;

export const ORIGENES_ACCION = {
  manual: '✍️ Manual',
  makigami: '🎯 Cacería Makigami',
  kaizen: '🔁 Carrera Kaizen',
  cincos: '🧹 Reto 5S',
  mudalab: '🕵️ MudaLab',
  informe: '📄 Informe',
} as const;
export type OrigenAccion = keyof typeof ORIGENES_ACCION;

export const FRECUENCIAS = { diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual' } as const;
export type Frecuencia = keyof typeof FRECUENCIAS;

export const DIAS_FRECUENCIA: Record<Frecuencia, number> = { diaria: 1, semanal: 7, quincenal: 15, mensual: 30 };

export interface ProcesoMinimo {
  nombre: string;
  indicador: string;
  unidad: string;
  sentido: 'bajar' | 'subir';
  linea_base: number | null;
  meta: number | null;
  frecuencia: Frecuencia;
}

export interface MedicionMinima {
  fecha: string;
  valor: number;
}

export interface AccionMinima {
  id: string;
  titulo: string;
  estado: EstadoAccion;
  fecha_compromiso: string | null;
  responsable: string | null;
}

export type Semaforo = 'verde' | 'amarillo' | 'rojo' | 'gris';

export const SEMAFOROS: Record<Semaforo, { nombre: string; emoji: string; clase: string }> = {
  verde: { nombre: 'Meta cumplida', emoji: '🟢', clase: 'bg-green-100 text-alto' },
  amarillo: { nombre: 'Mejorando', emoji: '🟡', clase: 'bg-amber-100 text-medio' },
  rojo: { nombre: 'Lejos de la meta', emoji: '🔴', clase: 'bg-red-100 text-bajo' },
  gris: { nombre: 'Sin datos', emoji: '⚪', clase: 'bg-marmol-100 text-marmol-500' },
};

/** Avance hacia la meta: 0 = en la línea base, 1 = meta cumplida (puede pasarse o ser negativo). */
export function avanceMeta(p: ProcesoMinimo, valor: number | null) {
  if (valor == null || p.linea_base == null || p.meta == null || p.linea_base === p.meta) return null;
  return (p.linea_base - valor) / (p.linea_base - p.meta);
}

export function metaCumplida(p: ProcesoMinimo, valor: number) {
  if (p.meta == null) return false;
  return p.sentido === 'bajar' ? valor <= p.meta : valor >= p.meta;
}

export function ultimaMedicion(mediciones: MedicionMinima[]) {
  return [...mediciones].sort((a, b) => a.fecha.localeCompare(b.fecha)).at(-1) ?? null;
}

export function semaforo(p: ProcesoMinimo, mediciones: MedicionMinima[]): Semaforo {
  const ultima = ultimaMedicion(mediciones);
  if (!ultima) return 'gris';
  if (metaCumplida(p, ultima.valor)) return 'verde';
  const avance = avanceMeta(p, ultima.valor);
  return avance != null && avance > 0 ? 'amarillo' : 'rojo';
}

export function formatearValor(v: number | null | undefined, unidad = '') {
  if (v == null) return '—';
  const n = Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10;
  return `${n.toLocaleString('es-CO')}${unidad ? ` ${unidad}` : ''}`;
}

/** Días entre hoy (Colombia) y una fecha YYYY-MM-DD: negativo = ya pasó. */
export function diasHasta(fecha: string, hoy = new Date()) {
  const [a, m, d] = fecha.split('-').map(Number);
  const base = new Date(hoy.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }) + 'T00:00:00');
  return Math.round((new Date(a!, m! - 1, d!).getTime() - base.getTime()) / 86400000);
}

export function accionVencida(a: AccionMinima, hoy = new Date()) {
  return (a.estado === 'pendiente' || a.estado === 'en_curso') && a.fecha_compromiso != null && diasHasta(a.fecha_compromiso, hoy) < 0;
}

/** Opciones de mejora del proceso según su indicador y su plan de acción. */
export function recomendacionesProceso(p: ProcesoMinimo, mediciones: MedicionMinima[], acciones: AccionMinima[], juegos: number): Recomendacion[] {
  const r: Recomendacion[] = [];
  const orden = [...mediciones].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const ultima = orden.at(-1);
  const abiertas = acciones.filter((a) => a.estado === 'pendiente' || a.estado === 'en_curso');
  const vencidas = acciones.filter((a) => accionVencida(a));

  if (p.linea_base == null || p.meta == null) {
    r.push({
      ref: 'pc-meta',
      prioridad: 'alta',
      titulo: 'Definir línea base y meta del indicador',
      detalle: `Sin punto de partida y sin meta no se puede saber si el proceso mejora. Midan hoy «${p.indicador}» y acuerden con el dueño del proceso a dónde quieren llegar.`,
      herramienta: 'Indicadores SMART',
    });
  }

  if (!ultima) {
    r.push({
      ref: 'pc-medir',
      prioridad: 'alta',
      titulo: 'Registrar la primera medición',
      detalle: `Midan «${p.indicador}» con frecuencia ${FRECUENCIAS[p.frecuencia].toLowerCase()} y regístrenlo aquí.`,
    });
  } else {
    const dias = -diasHasta(ultima.fecha);
    if (dias > DIAS_FRECUENCIA[p.frecuencia] * 2) {
      r.push({
        ref: 'pc-medicion-atrasada',
        prioridad: 'media',
        titulo: `Hace ${dias} días que no se mide el indicador`,
        detalle: `La frecuencia acordada es ${FRECUENCIAS[p.frecuencia].toLowerCase()}. Sin medición no hay control: asignen a alguien para registrar el dato.`,
      });
    }
    // Tendencia de las últimas 3 mediciones.
    const tres = orden.slice(-3);
    if (tres.length === 3) {
      const empeora = p.sentido === 'bajar' ? tres[0]!.valor < tres[1]!.valor && tres[1]!.valor < tres[2]!.valor : tres[0]!.valor > tres[1]!.valor && tres[1]!.valor > tres[2]!.valor;
      if (empeora) {
        r.push({
          ref: 'pc-tendencia',
          prioridad: 'alta',
          titulo: 'El indicador empeora en las últimas 3 mediciones',
          detalle: 'Algo cambió en el proceso. Revisen si se dejó de cumplir algún estándar y busquen la causa con los 5 porqués antes de que se vuelva costumbre.',
          herramienta: '5 porqués y auditoría del estándar',
        });
      }
    }
    if (metaCumplida(p, ultima.valor)) {
      r.push({
        ref: 'pc-sostener',
        prioridad: 'baja',
        titulo: 'Meta cumplida: estandarizar y subir la vara',
        detalle: 'Documenten cómo se trabaja ahora (procedimiento, formatos, capacitación) para que no se pierda, y definan una nueva meta más exigente.',
        herramienta: 'Trabajo estandarizado y auditorías',
      });
    } else if (abiertas.length === 0) {
      r.push({
        ref: 'pc-sin-acciones',
        prioridad: 'alta',
        titulo: 'La meta no se ha cumplido y no hay acciones abiertas',
        detalle:
          juegos === 0
            ? 'Hagan una Cacería Makigami con las personas del proceso para encontrar dónde se pierde el tiempo, y lleven las mejoras aprobadas a este plan.'
            : 'Programen otro ciclo: una Carrera Kaizen o una nueva Cacería Makigami para encontrar la siguiente mejora.',
        herramienta: juegos === 0 ? 'Cacería Makigami' : 'Carrera Kaizen',
      });
    }
  }

  if (vencidas.length) {
    r.push({
      ref: 'pc-vencidas',
      prioridad: 'alta',
      titulo: `${vencidas.length} ${vencidas.length === 1 ? 'acción vencida' : 'acciones vencidas'}`,
      detalle: `${vencidas
        .slice(0, 5)
        .map((a) => `«${a.titulo}»${a.responsable ? ` (${a.responsable})` : ''}`)
        .join('; ')}. Revisen en la próxima reunión si siguen vigentes, qué las frena y pongan una fecha nueva realista.`,
    });
  }
  const sinResponsable = abiertas.filter((a) => !a.responsable?.trim());
  if (sinResponsable.length) {
    r.push({
      ref: 'pc-responsables',
      prioridad: 'media',
      titulo: `${sinResponsable.length} ${sinResponsable.length === 1 ? 'acción no tiene' : 'acciones no tienen'} responsable`,
      detalle: 'Lo que es de todos no es de nadie: cada acción necesita una persona con nombre propio y una fecha.',
    });
  }

  const orden2: Record<string, number> = { alta: 0, media: 1, baja: 2 };
  return r.sort((a, b) => orden2[a.prioridad]! - orden2[b.prioridad]!);
}
