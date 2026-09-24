/**
 * Cacería Makigami — catálogo de desperdicios, métricas del proceso,
 * puntos e insignias. Funciones puras: se usan tanto en Server Components
 * como en el tablero cliente. Los puntos no se guardan: se calculan en vivo
 * a partir de las cazas y propuestas.
 */

export const ESTADOS_RETO = ['mapeo', 'caceria', 'rediseno', 'cerrado'] as const;
export type EstadoReto = (typeof ESTADOS_RETO)[number];

export const ETAPAS_RETO: { estado: EstadoReto; titulo: string; descripcion: string }[] = [
  { estado: 'mapeo', titulo: 'Mapeo', descripcion: 'El facilitador dibuja el proceso tal como ocurre hoy.' },
  { estado: 'caceria', titulo: 'Cacería', descripcion: 'Los equipos cazan desperdicios en los pasos.' },
  { estado: 'rediseno', titulo: 'Rediseño', descripcion: 'Se proponen y votan mejoras.' },
  { estado: 'cerrado', titulo: 'Resultados', descripcion: 'Antes vs. después del proceso.' },
];

/**
 * Los 8 desperdicios Lean, traducidos al lenguaje de un proceso de oficina.
 * `emoji` es el ícono del juego; `color` es una clase Tailwind de fondo.
 */
export const DESPERDICIOS = {
  esperas: {
    nombre: 'Esperas',
    emoji: '⏳',
    ejemplo: 'Firmas, aprobaciones o respuestas que tardan días; el trabajo queda quieto en una bandeja.',
  },
  traspasos: {
    nombre: 'Traspasos innecesarios',
    emoji: '🔀',
    ejemplo: 'El trabajo pasa de un área a otra y vuelve, o pasa por manos que no le agregan nada.',
  },
  sobreprocesamiento: {
    nombre: 'Sobreprocesamiento',
    emoji: '✍️',
    ejemplo: 'Doble digitación, aprobaciones redundantes, revisar lo que otro ya revisó.',
  },
  defectos: {
    nombre: 'Errores y reprocesos',
    emoji: '🔁',
    ejemplo: 'Datos incompletos o equivocados que obligan a devolver y rehacer.',
  },
  movimiento: {
    nombre: 'Búsqueda de información',
    emoji: '🔍',
    ejemplo: 'Buscar archivos entre correos y carpetas, preguntar por un dato que debería estar a mano.',
  },
  inventario: {
    nombre: 'Trabajo acumulado',
    emoji: '📥',
    ejemplo: 'Solicitudes que se represan y se atienden "por lotes" en vez de a medida que llegan.',
  },
  sobreproduccion: {
    nombre: 'Sobreproducción',
    emoji: '📄',
    ejemplo: 'Informes, copias o reportes que nadie lee ni usa.',
  },
  talento: {
    nombre: 'Talento no aprovechado',
    emoji: '💡',
    ejemplo: 'Personas haciendo tareas mecánicas que podrían automatizarse, o ideas que nadie escucha.',
  },
} as const;

export type TipoDesperdicio = keyof typeof DESPERDICIOS;
export const TIPOS_DESPERDICIO = Object.keys(DESPERDICIOS) as TipoDesperdicio[];

export const ACCIONES_PROPUESTA = {
  eliminar: 'Eliminar el paso',
  simplificar: 'Simplificar',
  automatizar: 'Automatizar',
  combinar: 'Combinar pasos',
  otro: 'Otra mejora',
} as const;
export type AccionPropuesta = keyof typeof ACCIONES_PROPUESTA;

export const CLASIFICACIONES = {
  agrega_valor: { nombre: 'Agrega valor', corto: 'AV' },
  necesaria: { nombre: 'Necesaria, no agrega valor', corto: 'NAV-N' },
  desperdicio: { nombre: 'Desperdicio', corto: 'NAV' },
} as const;
export type Clasificacion = keyof typeof CLASIFICACIONES;

/**
 * Puntos del juego. Se calculan en vivo (ver calcularPuntos): marcar y
 * desmarcar no suma de más porque solo cuenta lo que está marcado.
 */
export const PUNTOS_MAKIGAMI = {
  /** Por caza, hasta MAX_CAZAS_CON_PUNTOS por persona y reto. */
  cazarDesperdicio: 3,
  /** Al pionero de un hallazgo que llegó a CAZADORES_PARA_VALIDAR cazadores. */
  hallazgoValidado: 15,
  proponerMejora: 10,
  propuestaAprobada: 40,
} as const;

/** Cantidad de cazadores con la que un hallazgo (paso + tipo) queda validado por el equipo. */
export const CAZADORES_PARA_VALIDAR = 3;

/** Tope de cazas que suman puntos por persona en un mismo reto (evita marcar todo por puntos). */
export const MAX_CAZAS_CON_PUNTOS = 12;

export interface PasoMetricas {
  id: string;
  tiempo_trabajo_min: number;
  tiempo_espera_min: number;
  clasificacion: Clasificacion | null;
}

export interface MetricasProceso {
  tiempoTotal: number;
  trabajo: number;
  espera: number;
  valorAgregado: number;
  necesario: number;
  desperdicio: number;
  /** % del tiempo total que agrega valor (Process Cycle Efficiency). */
  eficiencia: number;
}

/** Métricas Makigami clásicas: el proceso se asume secuencial (tiempo total = suma de pasos). */
export function calcularMetricas(pasos: PasoMetricas[]): MetricasProceso {
  let trabajo = 0;
  let espera = 0;
  let valorAgregado = 0;
  let necesario = 0;
  let desperdicioTrabajo = 0;
  for (const p of pasos) {
    const t = Number(p.tiempo_trabajo_min) || 0;
    const e = Number(p.tiempo_espera_min) || 0;
    trabajo += t;
    espera += e;
    if (p.clasificacion === 'agrega_valor') valorAgregado += t;
    else if (p.clasificacion === 'desperdicio') desperdicioTrabajo += t;
    else necesario += t;
  }
  const tiempoTotal = trabajo + espera;
  return {
    tiempoTotal,
    trabajo,
    espera,
    valorAgregado,
    necesario,
    desperdicio: desperdicioTrabajo + espera,
    eficiencia: tiempoTotal > 0 ? (valorAgregado / tiempoTotal) * 100 : 0,
  };
}

/**
 * Tiempo del proceso rediseñado: el actual menos el ahorro de las mejoras
 * elegidas, sin bajar del tiempo que sí agrega valor (ese no se elimina).
 */
export function calcularTiempoFuturo(metricas: MetricasProceso, ahorroMin: number) {
  return Math.max(metricas.tiempoTotal - Math.max(0, ahorroMin), metricas.valorAgregado);
}

/** Cuenta los traspasos: cada vez que el paso siguiente cae en otro carril. */
export function contarTraspasos(pasosOrdenados: { carril_id: string }[]) {
  let n = 0;
  for (let i = 1; i < pasosOrdenados.length; i++) {
    if (pasosOrdenados[i]!.carril_id !== pasosOrdenados[i - 1]!.carril_id) n++;
  }
  return n;
}

/**
 * Formatea minutos en la unidad más legible. Los días son de calendario
 * (24 h), que es como se viven las esperas de un proceso.
 */
export function formatearDuracion(min: number) {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} min`;
  if (m < 1440) {
    const h = m / 60;
    return `${Number.isInteger(h) ? h : h.toFixed(1)} h`;
  }
  const d = m / 1440;
  return `${Number.isInteger(d) ? d : d.toFixed(1)} ${d === 1 ? 'día' : 'días'}`;
}

export const UNIDADES_TIEMPO = { min: 1, h: 60, d: 1440 } as const;
export type UnidadTiempo = keyof typeof UNIDADES_TIEMPO;

/** Devuelve el valor en la unidad más natural para precargar un formulario. */
export function descomponerMinutos(min: number): { valor: string; unidad: UnidadTiempo } {
  const m = Number(min) || 0;
  if (m > 0 && m % 1440 === 0) return { valor: String(m / 1440), unidad: 'd' };
  if (m > 0 && m % 60 === 0) return { valor: String(m / 60), unidad: 'h' };
  return { valor: m ? String(m) : '', unidad: 'min' };
}

// ----------------------------------------------------------------------------
// Insignias (se calculan, no se guardan)
// ----------------------------------------------------------------------------

export interface EstadisticasCazador {
  cazas: number;
  pionerosValidados: number;
  propuestasAprobadas: number;
  ahorroAprobadoMin: number;
}

export const INSIGNIAS = [
  {
    id: 'cazador',
    emoji: '🎯',
    nombre: 'Cazador',
    descripcion: 'Cazó 10 desperdicios o más.',
    logrado: (e: EstadisticasCazador) => e.cazas >= 10,
  },
  {
    id: 'ojo_halcon',
    emoji: '🦅',
    nombre: 'Ojo de Halcón',
    descripcion: `Fue el primero en ver 3 desperdicios que luego el equipo validó.`,
    logrado: (e: EstadisticasCazador) => e.pionerosValidados >= 3,
  },
  {
    id: 'arquitecto',
    emoji: '🧠',
    nombre: 'Arquitecto del Proceso',
    descripcion: 'Una de sus propuestas de mejora fue aprobada.',
    logrado: (e: EstadisticasCazador) => e.propuestasAprobadas >= 1,
  },
  {
    id: 'ahorrador',
    emoji: '⚡',
    nombre: 'Ahorrador de Tiempo',
    descripcion: 'Sus mejoras aprobadas ahorran 1 día o más al proceso.',
    logrado: (e: EstadisticasCazador) => e.ahorroAprobadoMin >= 1440,
  },
] as const;

export interface CazaMinima {
  paso_id: string;
  jugador_id: string;
  tipo_desperdicio: string;
  created_at: string;
}

/**
 * Agrupa las cazas por hallazgo (paso + tipo). El pionero es quien lo cazó
 * primero; el hallazgo está validado con CAZADORES_PARA_VALIDAR cazadores.
 */
export function agruparHallazgos<T extends CazaMinima>(cazas: T[]) {
  const mapa = new Map<string, T[]>();
  for (const c of cazas) {
    const k = `${c.paso_id}|${c.tipo_desperdicio}`;
    const lista = mapa.get(k);
    if (lista) lista.push(c);
    else mapa.set(k, [c]);
  }
  return Array.from(mapa.values()).map((lista) => {
    const ordenadas = [...lista].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const pionero = ordenadas[0]!;
    return {
      pasoId: pionero.paso_id,
      tipo: pionero.tipo_desperdicio as TipoDesperdicio,
      cazas: ordenadas,
      pioneroId: pionero.jugador_id,
      validado: ordenadas.length >= CAZADORES_PARA_VALIDAR,
    };
  });
}

export function calcularEstadisticas(
  cazas: CazaMinima[],
  propuestas: { jugador_id: string; estado: string; ahorro_estimado_min: number }[]
) {
  const stats = new Map<string, EstadisticasCazador>();
  const obtener = (id: string) => {
    let s = stats.get(id);
    if (!s) {
      s = { cazas: 0, pionerosValidados: 0, propuestasAprobadas: 0, ahorroAprobadoMin: 0 };
      stats.set(id, s);
    }
    return s;
  };
  for (const c of cazas) obtener(c.jugador_id).cazas++;
  for (const h of agruparHallazgos(cazas)) if (h.validado) obtener(h.pioneroId).pionerosValidados++;
  for (const p of propuestas) {
    if (p.estado !== 'aprobada') continue;
    const s = obtener(p.jugador_id);
    s.propuestasAprobadas++;
    s.ahorroAprobadoMin += Number(p.ahorro_estimado_min) || 0;
  }
  return stats;
}

/** Puntos de un jugador en un reto, con la misma regla del ranking. */
export function calcularPuntos(s: EstadisticasCazador, propuestasVigentes: number) {
  return (
    Math.min(s.cazas, MAX_CAZAS_CON_PUNTOS) * PUNTOS_MAKIGAMI.cazarDesperdicio +
    s.pionerosValidados * PUNTOS_MAKIGAMI.hallazgoValidado +
    propuestasVigentes * PUNTOS_MAKIGAMI.proponerMejora +
    s.propuestasAprobadas * PUNTOS_MAKIGAMI.propuestaAprobada
  );
}

/** Emojis para identificar equipos (se asignan en orden al crearlos). */
export const EMOJIS_EQUIPO = ['🦊', '🦉', '🐺', '🦅', '🐬', '🦁', '🐝', '🐢', '🦄', '🐙', '🐯', '🐧'] as const;

export const SEXOS = {
  femenino: 'Femenino',
  masculino: 'Masculino',
  otro: 'Otro',
  prefiero_no_decir: 'Prefiero no decirlo',
} as const;
export type Sexo = keyof typeof SEXOS;

export const RANGOS_EDAD = ['18 a 24', '25 a 34', '35 a 44', '45 a 54', '55 o más'] as const;
export const ANTIGUEDADES = ['Menos de 1 año', '1 a 3 años', '3 a 5 años', '5 a 10 años', 'Más de 10 años'] as const;
