import type { AccionPropuesta, Clasificacion, EstadoReto, TipoDesperdicio } from '@/lib/makigami';

export interface RetoVista {
  id: string;
  titulo: string;
  descripcion: string | null;
  inicioProceso: string | null;
  finProceso: string | null;
  estado: EstadoReto;
  fechaLimite: string | null;
}

export interface CarrilVista {
  id: string;
  nombre: string;
  orden: number;
}

export interface PasoVista {
  id: string;
  carril_id: string;
  orden: number;
  descripcion: string;
  tiempo_trabajo_min: number;
  tiempo_espera_min: number;
  documento_sistema: string | null;
  clasificacion: Clasificacion | null;
}

export interface CazaVista {
  id: string;
  paso_id: string;
  jugador_id: string;
  jugador_nombre: string;
  tipo_desperdicio: TipoDesperdicio;
  comentario: string | null;
  created_at: string;
}

export interface PropuestaVista {
  id: string;
  paso_id: string | null;
  jugador_id: string;
  jugador_nombre: string;
  accion: AccionPropuesta;
  descripcion: string;
  ahorro_estimado_min: number;
  estado: 'propuesta' | 'aprobada' | 'descartada';
  votos: string[];
}

export interface Hallazgo {
  pasoId: string;
  tipo: TipoDesperdicio;
  cazas: CazaVista[];
  pioneroId: string;
  validado: boolean;
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
