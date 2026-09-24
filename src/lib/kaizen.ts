/**
 * Carrera Kaizen — rondas PDCA, puntos y sugerencias de simulación.
 * Funciones puras: se usan tanto en Server Components como en el tablero
 * cliente. Los puntos no se guardan: se calculan en vivo a partir de las
 * tarjetas y los resultados de cada equipo.
 */

export const ESTADOS_SESION = ['preparacion', 'jugando', 'cerrado'] as const;
export type EstadoSesion = (typeof ESTADOS_SESION)[number];

export const FASES = ['planear', 'hacer', 'verificar', 'actuar'] as const;
export type Fase = (typeof FASES)[number];

export const INFO_FASE: Record<Fase, { nombre: string; emoji: string; letra: string; jugador: string; facilitador: string }> = {
  planear: {
    nombre: 'Planear',
    emoji: '🧠',
    letra: 'P',
    jugador: 'Miren qué les salió mal en la ronda anterior, busquen la causa con los 5 porqués, elijan UNA idea y predigan cuántas unidades buenas harán.',
    facilitador: 'Los equipos llenan su tarjeta Kaizen. Recuérdales: una sola idea por ronda, para poder medir si funcionó.',
  },
  hacer: {
    nombre: 'Hacer',
    emoji: '⚙️',
    letra: 'D',
    jugador: '¡A producir! Apliquen su idea y trabajen hasta que suene el cronómetro.',
    facilitador: 'Cuando todos estén listos, inicia el cronómetro. Al terminar el tiempo, nadie sigue produciendo.',
  },
  verificar: {
    nombre: 'Verificar',
    emoji: '📏',
    letra: 'C',
    jugador: 'Cuenten las unidades buenas y las defectuosas con el criterio de calidad y regístrenlas.',
    facilitador: 'Revisa el conteo de cada equipo con el criterio de calidad. Puedes corregir los números en la tabla.',
  },
  actuar: {
    nombre: 'Actuar',
    emoji: '✅',
    letra: 'A',
    jugador: '¿Funcionó su idea? Si mejoró, vuélvanla estándar: así trabajarán de ahora en adelante. Si no, descártenla.',
    facilitador: 'Cada equipo decide si su idea se vuelve estándar. Pregunta en voz alta qué aprendieron.',
  },
};

/** La ronda 1 es la línea base (se trabaja como se sabe); desde la 2 hay ciclo PDCA completo. */
export function fasesDeRonda(ronda: number): Fase[] {
  return ronda <= 1 ? ['hacer', 'verificar'] : [...FASES];
}

export interface Momento {
  estado: EstadoSesion;
  ronda: number;
  fase: Fase | null;
}

/** El siguiente momento de la carrera, o null si ya terminó. */
export function momentoSiguiente(m: Momento, totalRondas: number): Momento | null {
  if (m.estado === 'cerrado') return null;
  if (m.estado === 'preparacion' || !m.fase) return { estado: 'jugando', ronda: 1, fase: 'hacer' };
  const fases = fasesDeRonda(m.ronda);
  const i = fases.indexOf(m.fase);
  if (i >= 0 && i < fases.length - 1) return { estado: 'jugando', ronda: m.ronda, fase: fases[i + 1]! };
  if (m.ronda < totalRondas) return { estado: 'jugando', ronda: m.ronda + 1, fase: 'planear' };
  return { estado: 'cerrado', ronda: m.ronda, fase: null };
}

/** El momento anterior (para corregir si el facilitador avanzó por error), o null al inicio. */
export function momentoAnterior(m: Momento, totalRondas: number): Momento | null {
  if (m.estado === 'preparacion') return null;
  if (m.estado === 'cerrado') {
    const ronda = Math.min(Math.max(m.ronda, 1), totalRondas);
    const fases = fasesDeRonda(ronda);
    return { estado: 'jugando', ronda, fase: fases[fases.length - 1]! };
  }
  const fases = fasesDeRonda(m.ronda);
  const i = m.fase ? fases.indexOf(m.fase) : 0;
  if (i > 0) return { estado: 'jugando', ronda: m.ronda, fase: fases[i - 1]! };
  if (m.ronda <= 1) return { estado: 'preparacion', ronda: 0, fase: null };
  const previas = fasesDeRonda(m.ronda - 1);
  return { estado: 'jugando', ronda: m.ronda - 1, fase: previas[previas.length - 1]! };
}

export function describirMomento(m: Momento, totalRondas: number) {
  if (m.estado === 'preparacion') return 'Preparación';
  if (m.estado === 'cerrado') return 'Carrera terminada';
  const fase = m.fase ? INFO_FASE[m.fase] : null;
  return `Ronda ${m.ronda} de ${totalRondas}${m.ronda === 1 ? ' (línea base)' : ''} · ${fase ? `${fase.emoji} ${fase.nombre}` : ''}`;
}

// ----------------------------------------------------------------------------
// Puntos
// ----------------------------------------------------------------------------

export const PUNTOS_KAIZEN = {
  /** 1 punto por cada 1 % que suben las unidades buenas frente a la ronda anterior. */
  porPorcentajeMejora: 1,
  /** Tope de puntos por mejora en una sola ronda. */
  maxMejoraPorRonda: 100,
  /** Predicción a menos del 10 % del resultado real. */
  prediccionExacta: 30,
  /** Predicción a menos del 25 % del resultado real. */
  prediccionCercana: 15,
  /** Tarjeta con problema, al menos 3 porqués, idea y predicción. */
  tarjetaCompleta: 10,
  /** Estandarizar una idea que mejoró, o descartar una que no mejoró. */
  decisionCoherente: 20,
  /** Ronda con producción y cero defectos. */
  ceroDefectos: 10,
} as const;

export const REGLAS_PUNTOS: { emoji: string; texto: string }[] = [
  { emoji: '📈', texto: `1 punto por cada 1 % que mejoren las unidades buenas frente a la ronda anterior (hasta ${PUNTOS_KAIZEN.maxMejoraPorRonda} por ronda).` },
  { emoji: '🎯', texto: `+${PUNTOS_KAIZEN.prediccionExacta} si su predicción queda a menos del 10 % del resultado real; +${PUNTOS_KAIZEN.prediccionCercana} si queda a menos del 25 %.` },
  { emoji: '🧠', texto: `+${PUNTOS_KAIZEN.tarjetaCompleta} por tarjeta Kaizen completa: problema, al menos 3 porqués, idea y predicción.` },
  { emoji: '✅', texto: `+${PUNTOS_KAIZEN.decisionCoherente} por decidir bien: estandarizar lo que mejoró o descartar lo que no.` },
  { emoji: '💎', texto: `+${PUNTOS_KAIZEN.ceroDefectos} por cada ronda con cero defectos.` },
];

export interface TarjetaMinima {
  equipo_id: string;
  ronda: number;
  problema: string;
  porques: string[];
  idea: string;
  prediccion: number | null;
  decision: 'estandar' | 'descartada' | null;
}

export interface ResultadoMinimo {
  equipo_id: string;
  ronda: number;
  unidades_buenas: number;
  defectos: number;
}

export function tarjetaCompleta(t: Pick<TarjetaMinima, 'problema' | 'porques' | 'idea' | 'prediccion'> | undefined) {
  if (!t) return false;
  return Boolean(t.problema.trim()) && t.porques.filter((p) => p.trim()).length >= 3 && Boolean(t.idea.trim()) && t.prediccion != null;
}

/** % de cambio de las unidades buenas frente a la ronda anterior (null sin datos para comparar). */
export function porcentajeMejora(anterior: number | undefined, actual: number | undefined): number | null {
  if (anterior == null || actual == null) return null;
  if (anterior === 0) return actual > 0 ? 100 : 0;
  return ((actual - anterior) / anterior) * 100;
}

/** Qué tan lejos quedó la predicción del resultado real (0 = exacta). */
export function errorPrediccion(prediccion: number, real: number) {
  return Math.abs(prediccion - real) / Math.max(real, 1);
}

export interface PuntosRonda {
  ronda: number;
  resultado: ResultadoMinimo | undefined;
  tarjeta: TarjetaMinima | undefined;
  mejoraPct: number | null;
  mejora: number;
  prediccion: number;
  tarjetaCompleta: number;
  decision: number;
  calidad: number;
  total: number;
}

export interface MarcadorEquipo {
  equipoId: string;
  rondas: PuntosRonda[];
  total: number;
  /** Unidades buenas en la ronda 1 (línea base) y en la última ronda con resultado. */
  lineaBase: number | null;
  ultima: number | null;
  /** % de mejora de la última ronda con resultado frente a la línea base. */
  mejoraTotalPct: number | null;
  estandares: TarjetaMinima[];
}

export function calcularMarcador(equipoId: string, totalRondas: number, tarjetas: TarjetaMinima[], resultados: ResultadoMinimo[]): MarcadorEquipo {
  const P = PUNTOS_KAIZEN;
  const resDe = new Map(resultados.filter((r) => r.equipo_id === equipoId).map((r) => [r.ronda, r]));
  const tarDe = new Map(tarjetas.filter((t) => t.equipo_id === equipoId).map((t) => [t.ronda, t]));

  const rondas: PuntosRonda[] = [];
  for (let ronda = 1; ronda <= totalRondas; ronda++) {
    const resultado = resDe.get(ronda);
    const tarjeta = ronda > 1 ? tarDe.get(ronda) : undefined;
    const mejoraPct = ronda > 1 ? porcentajeMejora(resDe.get(ronda - 1)?.unidades_buenas, resultado?.unidades_buenas) : null;

    const mejora = mejoraPct != null && mejoraPct > 0 ? Math.min(P.maxMejoraPorRonda, Math.round(mejoraPct * P.porPorcentajeMejora)) : 0;
    let prediccion = 0;
    if (tarjeta?.prediccion != null && resultado) {
      const e = errorPrediccion(tarjeta.prediccion, resultado.unidades_buenas);
      prediccion = e <= 0.1 ? P.prediccionExacta : e <= 0.25 ? P.prediccionCercana : 0;
    }
    const completa = tarjetaCompleta(tarjeta) ? P.tarjetaCompleta : 0;
    let decision = 0;
    if (tarjeta?.decision && mejoraPct != null) {
      const coherente = (tarjeta.decision === 'estandar' && mejoraPct > 0) || (tarjeta.decision === 'descartada' && mejoraPct <= 0);
      decision = coherente ? P.decisionCoherente : 0;
    }
    const calidad = resultado && resultado.unidades_buenas > 0 && resultado.defectos === 0 ? P.ceroDefectos : 0;

    rondas.push({ ronda, resultado, tarjeta, mejoraPct, mejora, prediccion, tarjetaCompleta: completa, decision, calidad, total: mejora + prediccion + completa + decision + calidad });
  }

  const conResultado = rondas.filter((r) => r.resultado);
  const lineaBase = resDe.get(1)?.unidades_buenas ?? null;
  const ultima = conResultado.length ? conResultado[conResultado.length - 1]!.resultado!.unidades_buenas : null;
  return {
    equipoId,
    rondas,
    total: rondas.reduce((s, r) => s + r.total, 0),
    lineaBase,
    ultima,
    mejoraTotalPct: conResultado.length > 1 ? porcentajeMejora(lineaBase ?? undefined, ultima ?? undefined) : null,
    estandares: [...tarDe.values()].filter((t) => t.decision === 'estandar').sort((a, b) => a.ronda - b.ronda),
  };
}

export function formatearPct(pct: number | null) {
  if (pct == null) return '—';
  const r = Math.round(pct);
  return `${r > 0 ? '+' : ''}${r} %`;
}

export function formatearReloj(segundos: number) {
  const s = Math.max(0, Math.ceil(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ----------------------------------------------------------------------------
// Simulaciones sugeridas para el taller
// ----------------------------------------------------------------------------

export interface Simulacion {
  nombre: string;
  emoji: string;
  producto: string;
  unidad: string;
  criterio: string;
  materiales: string;
  duracionSeg: number;
}

export const SIMULACIONES: Simulacion[] = [
  {
    nombre: 'Aviones de papel',
    emoji: '✈️',
    producto: 'Aviones de papel',
    unidad: 'aviones',
    criterio: 'Tiene el modelo indicado, alas simétricas y vuela al menos 3 metros.',
    materiales: 'Hojas tamaño carta recicladas, una hoja con el modelo del avión y cinta para marcar los 3 metros.',
    duracionSeg: 180,
  },
  {
    nombre: 'Cartas para enviar',
    emoji: '✉️',
    producto: 'Cartas listas para enviar',
    unidad: 'cartas',
    criterio: 'Hoja doblada en tres, dentro del sobre, sobre sellado, con destinatario escrito completo y legible.',
    materiales: 'Hojas, sobres, pegante en barra, esferos y una lista de destinatarios.',
    duracionSeg: 180,
  },
  {
    nombre: 'Ensamble de fichas',
    emoji: '🧱',
    producto: 'Figuras armadas con fichas',
    unidad: 'figuras',
    criterio: 'Igual al modelo: mismas fichas, mismos colores y en la misma posición.',
    materiales: 'Fichas tipo Lego revueltas en una caja y una foto del modelo por equipo.',
    duracionSeg: 180,
  },
  {
    nombre: 'Solicitudes de oficina',
    emoji: '📝',
    producto: 'Solicitudes de compra diligenciadas',
    unidad: 'solicitudes',
    criterio: 'Todos los campos llenos, cálculos correctos, firma de quien aprueba y sin tachones.',
    materiales: 'Formatos impresos de solicitud, calculadora, esferos y una lista de pedidos para diligenciar.',
    duracionSeg: 240,
  },
];
