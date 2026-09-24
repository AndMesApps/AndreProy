import type { EstadoSesion, Fase, ResultadoMinimo, TarjetaMinima } from '@/lib/kaizen';

export interface SesionVista {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string | null;
  producto: string;
  unidad: string;
  criterioCalidad: string | null;
  totalRondas: number;
  duracionRondaSeg: number;
  estado: EstadoSesion;
  rondaActual: number;
  fase: Fase | null;
  cronometroInicio: string | null;
}

export interface EquipoVista {
  id: string;
  nombre: string;
  emoji: string;
  /** Color fijo del equipo en la gráfica (según el orden en que se creó). */
  color: string;
  miembros: number;
}

export type TarjetaVista = TarjetaMinima & { id: string };
export type ResultadoVista = ResultadoMinimo;

/**
 * Colores categóricos de la gráfica, en orden fijo (paleta validada para
 * daltonismo en pares vecinos). El equipo N siempre usa el color N.
 */
export const COLORES_EQUIPO = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
