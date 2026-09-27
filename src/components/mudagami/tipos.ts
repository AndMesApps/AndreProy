import type { EstadoReto, Layout, MedioTransporte } from '@/lib/mudagami';

export interface RetoVista {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoReto;
  fechaLimite: string | null;
  duracionCorridaSeg: number;
  duracionRedisenoSeg: number;
  cronometroInicio: string | null;
}

export interface EquipoVista {
  id: string;
  nombre: string;
  emoji: string;
}

export interface JugadorVista {
  id: string;
  nombre: string;
  equipo_id: string;
  cargo: string;
  es_lider: boolean;
}

export interface TrasladoVista {
  id: string;
  equipo_id: string;
  corrida: 1 | 2;
  medio: MedioTransporte;
  articulos: number;
  jugador_id: string | null;
  jugador_nombre: string;
}

export interface LayoutVista {
  equipo_id: string;
  corrida: 1 | 2;
  posiciones: Layout;
}
