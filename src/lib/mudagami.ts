/**
 * MudaGami · Kayou — digitaliza el juego físico de la consultora sobre la
 * muda de transporte (ver recursos/InstruccionesMudaGami*.png). Un equipo
 * produce un lote de 15 piezas pasando por 6 estaciones fijas de una planta;
 * cada vez que mueven algo entre estaciones que no quedan una al lado de la
 * otra, usan el montacargas o la carretilla — eso es la muda que se mide.
 * Funciones puras: se usan en el servidor y en el navegador. Los puntos e
 * insignias no se guardan: se calculan en vivo, igual que en los demás juegos.
 */

export const ESTADOS_RETO = ['espera', 'corrida_1', 'rediseno', 'corrida_2', 'cerrado'] as const;
export type EstadoReto = (typeof ESTADOS_RETO)[number];

export const ETAPAS_RETO: { estado: EstadoReto; titulo: string; descripcion: string }[] = [
  { estado: 'espera', titulo: 'Antes de empezar', descripcion: 'El facilitador arma los equipos.' },
  { estado: 'corrida_1', titulo: 'Corrida 1', descripcion: 'Línea base: producen con el diseño de planta inicial.' },
  { estado: 'rediseno', titulo: 'Rediseño', descripcion: 'Cada equipo reorganiza su planta (4 minutos).' },
  { estado: 'corrida_2', titulo: 'Corrida 2', descripcion: 'Vuelven a producir con el diseño de cada equipo.' },
  { estado: 'cerrado', titulo: 'Resultados', descripcion: 'Traslados, tiempo y costo: antes vs. después.' },
];

// ----------------------------------------------------------------------------
// La planta: 6 estaciones fijas, 6 espacios del tablero y su adyacencia.
// ----------------------------------------------------------------------------

export const ESTACIONES = {
  bodega_prima: { nombre: 'Bodega de materia prima', corto: 'Bodega M.P.', emoji: '📦' },
  corte_recto: { nombre: 'Corte recto', corto: 'Corte recto', emoji: '✂️' },
  corte_circular: { nombre: 'Corte circular', corto: 'Corte circular', emoji: '🔵' },
  perforado: { nombre: 'Perforado', corto: 'Perforado', emoji: '📍' },
  pintura: { nombre: 'Pintura', corto: 'Pintura', emoji: '🖌️' },
  bodega_terminado: { nombre: 'Bodega de producto terminado', corto: 'Bodega P.T.', emoji: '🏭' },
} as const;
export type Estacion = keyof typeof ESTACIONES;
export const CLAVES_ESTACION = Object.keys(ESTACIONES) as Estacion[];

export const ESPACIOS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export type Espacio = (typeof ESPACIOS)[number];
type Nodo = Espacio | 'ingreso';

export type Layout = Record<Espacio, Estacion>;

/** Diseño inicial de la planta (igual para todos en la corrida 1), como en la Ilustración 1 del material original. */
export const LAYOUT_INICIAL: Layout = {
  D: 'bodega_prima',
  A: 'corte_circular',
  E: 'corte_recto',
  B: 'perforado',
  F: 'pintura',
  C: 'bodega_terminado',
};

/**
 * El tablero es un camino de dos carriles (como en el material físico):
 * columna derecha A-B-C, columna izquierda D-E-F, unidas por una "vía" fila
 * a fila, y el ingreso de la planta al fondo, junto a C y F. Dos espacios
 * son contiguos (movimiento libre) si están conectados aquí; si no, hay que
 * transportar con montacargas o carretilla.
 */
export const ADYACENCIAS: Record<Nodo, Nodo[]> = {
  A: ['B', 'D'],
  B: ['A', 'C', 'E'],
  C: ['B', 'F', 'ingreso'],
  D: ['A', 'E'],
  E: ['B', 'D', 'F'],
  F: ['C', 'E', 'ingreso'],
  ingreso: ['C', 'F'],
};

export function sonContiguos(a: Nodo, b: Nodo) {
  return a === b || ADYACENCIAS[a].includes(b);
}

// ----------------------------------------------------------------------------
// Las 15 piezas: 3 figuras, cada una con su propia ruta de estaciones.
// ----------------------------------------------------------------------------

export const FIGURAS = {
  triangulo: { nombre: 'Triángulos', emoji: '🔺', color: '#f59e0b' },
  cuadrado: { nombre: 'Cuadrados', emoji: '🟦', color: '#2563eb' },
  circunferencia: { nombre: 'Circunferencias', emoji: '⚪', color: '#16a34a' },
} as const;
export type Figura = keyof typeof FIGURAS;
export const CLAVES_FIGURA = Object.keys(FIGURAS) as Figura[];

/** Piezas por figura en cada corrida (15 artículos: 5 de cada una). */
export const PIEZAS_POR_FIGURA = 5;

/** Estaciones que visita cada figura, en orden, sin contar bodega de materia prima ni de terminado. */
export const RUTA_FIGURA: Record<Figura, Estacion[]> = {
  triangulo: ['corte_recto', 'perforado', 'pintura'],
  cuadrado: ['corte_recto', 'perforado', 'pintura'],
  circunferencia: ['corte_circular', 'pintura'],
};

const MEDIOS = {
  montacargas: { nombre: 'Montacargas', emoji: '🚛', capacidad: 3, minutosPorViaje: 10, costoPorViaje: 2000 },
  carretilla: { nombre: 'Carretilla', emoji: '🛒', capacidad: 1, minutosPorViaje: 5, costoPorViaje: 0 },
} as const;
export const MEDIOS_TRANSPORTE = MEDIOS;
export type MedioTransporte = keyof typeof MEDIOS;

/**
 * Traslados mínimos posibles con un diseño de planta dado, usando siempre el
 * montacargas al tope (3 artículos) en cada tramo no contiguo: entrada de
 * materia prima (15 artículos), la ruta de cada figura (5 artículos) y la
 * salida de producto terminado (15 artículos). Es solo una referencia para
 * que el equipo vea si su rediseño ya no puede mejorar más — el conteo real
 * lo hace el equipo con sus propios viajes.
 */
export function minimoTraslados(layout: Layout): number {
  const espacioDe = new Map<Estacion, Espacio>(ESPACIOS.map((e) => [layout[e], e]));
  const viajes = (cantidad: number, a: Nodo, b: Nodo) => (sonContiguos(a, b) ? 0 : Math.ceil(cantidad / MEDIOS.montacargas.capacidad));

  let total = 0;
  total += viajes(PIEZAS_POR_FIGURA * CLAVES_FIGURA.length, 'ingreso', espacioDe.get('bodega_prima')!);
  for (const figura of CLAVES_FIGURA) {
    const ruta: Nodo[] = ['bodega_prima', ...RUTA_FIGURA[figura], 'bodega_terminado'].map((e) => espacioDe.get(e as Estacion)!);
    for (let i = 1; i < ruta.length; i++) total += viajes(PIEZAS_POR_FIGURA, ruta[i - 1]!, ruta[i]!);
  }
  total += viajes(PIEZAS_POR_FIGURA * CLAVES_FIGURA.length, espacioDe.get('bodega_terminado')!, 'ingreso');
  return total;
}

/** Un layout es válido si usa las 6 estaciones, cada una una sola vez. */
export function layoutValido(layout: Partial<Record<Espacio, Estacion>>): layout is Layout {
  const valores = ESPACIOS.map((e) => layout[e]);
  if (valores.some((v) => !v)) return false;
  return new Set(valores).size === CLAVES_ESTACION.length;
}

// ----------------------------------------------------------------------------
// Tabla 1 — formato de medición de transportes: traslados, tiempo y costo.
// ----------------------------------------------------------------------------

export interface TrasladoMinimo {
  medio: MedioTransporte;
  articulos: number;
}

export interface Tabla1 {
  traslados: Record<MedioTransporte, number>;
  tiempoMin: number;
  costo: number;
}

export function calcularTabla1(traslados: TrasladoMinimo[]): Tabla1 {
  const n = { montacargas: 0, carretilla: 0 };
  for (const t of traslados) n[t.medio]++;
  return {
    traslados: n,
    tiempoMin: n.montacargas * MEDIOS.montacargas.minutosPorViaje + n.carretilla * MEDIOS.carretilla.minutosPorViaje,
    costo: n.montacargas * MEDIOS.montacargas.costoPorViaje + n.carretilla * MEDIOS.carretilla.costoPorViaje,
  };
}

export interface ComparacionCorridas {
  corrida1: Tabla1;
  corrida2: Tabla1;
  reduccionTiempoPct: number;
  reduccionCostoPct: number;
}

export function compararCorridas(corrida1: Tabla1, corrida2: Tabla1): ComparacionCorridas {
  const pct = (antes: number, despues: number) => (antes > 0 ? ((antes - despues) / antes) * 100 : 0);
  return {
    corrida1,
    corrida2,
    reduccionTiempoPct: pct(corrida1.tiempoMin, corrida2.tiempoMin),
    reduccionCostoPct: pct(corrida1.costo, corrida2.costo),
  };
}

export function formatearPesos(n: number) {
  return `$${Math.round(n).toLocaleString('es-CO')}`;
}

// ----------------------------------------------------------------------------
// Puntos e insignias (se calculan en vivo, no se guardan).
// ----------------------------------------------------------------------------

export const PUNTOS_MUDAGAMI = {
  /** Por corrida en la que el jugador registró al menos un traslado de su equipo. */
  participarCorrida: 15,
  /** Bono por jugador si el equipo redujo el tiempo de transporte 25 % o más (o 50 %: se toma el mayor). */
  equipoMejora25: 20,
  equipoMejora50: 40,
  /** Bono si el equipo llegó al mínimo teórico de traslados en la corrida 2. */
  disenoOptimo: 50,
} as const;

export interface EstadisticasEquipo {
  corrida1: Tabla1;
  corrida2: Tabla1 | null;
  minimoTeorico2: number | null;
  jugadoresConCorrida1: Set<string>;
  jugadoresConCorrida2: Set<string>;
}

export const INSIGNIAS = [
  {
    id: 'transportista',
    emoji: '🚚',
    nombre: 'Transportista',
    descripcion: 'Registró traslados en las dos corridas.',
    logrado: (e: EstadisticasEquipo, jugadorId: string) => e.jugadoresConCorrida1.has(jugadorId) && e.jugadoresConCorrida2.has(jugadorId),
  },
  {
    id: 'reductor',
    emoji: '📉',
    nombre: 'Reductor de mudas',
    descripcion: 'Su equipo redujo el tiempo de transporte 50 % o más.',
    logrado: (e: EstadisticasEquipo) => Boolean(e.corrida2) && compararCorridas(e.corrida1, e.corrida2!).reduccionTiempoPct >= 50,
  },
  {
    id: 'arquitecto_planta',
    emoji: '📐',
    nombre: 'Arquitecto de planta',
    descripcion: 'Su equipo llegó al mínimo teórico de traslados en la corrida 2.',
    logrado: (e: EstadisticasEquipo) =>
      Boolean(e.corrida2) && e.minimoTeorico2 != null && e.corrida2!.traslados.montacargas + e.corrida2!.traslados.carretilla <= e.minimoTeorico2,
  },
  {
    id: 'cero_costo',
    emoji: '💰',
    nombre: 'Cero desperdicio',
    descripcion: 'Su equipo bajó el costo de transporte a 0 en la corrida 2.',
    logrado: (e: EstadisticasEquipo) => Boolean(e.corrida2) && e.corrida1.costo > 0 && e.corrida2!.costo === 0,
  },
] as const;

export function calcularPuntosEquipo(e: EstadisticasEquipo, jugadorId: string) {
  let puntos = 0;
  if (e.jugadoresConCorrida1.has(jugadorId)) puntos += PUNTOS_MUDAGAMI.participarCorrida;
  if (e.jugadoresConCorrida2.has(jugadorId)) puntos += PUNTOS_MUDAGAMI.participarCorrida;
  if (e.corrida2) {
    const { reduccionTiempoPct } = compararCorridas(e.corrida1, e.corrida2);
    if (reduccionTiempoPct >= 50) puntos += PUNTOS_MUDAGAMI.equipoMejora50;
    else if (reduccionTiempoPct >= 25) puntos += PUNTOS_MUDAGAMI.equipoMejora25;
    if (e.minimoTeorico2 != null && e.corrida2.traslados.montacargas + e.corrida2.traslados.carretilla <= e.minimoTeorico2) {
      puntos += PUNTOS_MUDAGAMI.disenoOptimo;
    }
  }
  return puntos;
}

// Datos de equipos y jugadores comunes a todos los juegos (ver juego.ts).
export { ANTIGUEDADES, EMOJIS_EQUIPO, RANGOS_EDAD, SEXOS, type Sexo } from '@/lib/juego';
