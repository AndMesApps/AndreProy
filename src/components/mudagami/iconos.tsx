import type { Estacion, Figura, MedioTransporte } from '@/lib/mudagami';

/**
 * Ilustraciones propias de MudaGami (coloridas, en el estilo del app: SVG en
 * línea, sin imágenes sueltas). Los materiales físicos originales (recursos/
 * InstruccionesMudaGami*.png) traían pictogramas en blanco y negro; aquí cada
 * estación tiene su propio color para reconocerla de un vistazo en el tablero.
 */
export const COLOR_ESTACION: Record<Estacion, string> = {
  bodega_prima: '#f59e0b',
  corte_recto: '#2563eb',
  corte_circular: '#0d9488',
  perforado: '#7c3aed',
  pintura: '#db2777',
  bodega_terminado: '#16a34a',
};

export const COLOR_FIGURA: Record<Figura, string> = {
  triangulo: '#f59e0b',
  cuadrado: '#2563eb',
  circunferencia: '#16a34a',
};

function Badge({ color, size, children }: { color: string; size: number; children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-hidden>
      <rect x={1} y={1} width={38} height={38} rx={10} fill={color} />
      <rect x={1} y={1} width={38} height={38} rx={10} fill="white" fillOpacity={0.08} />
      {children}
    </svg>
  );
}

const TRAZO = { fill: 'none', stroke: 'white', strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

/** Silueta de tijeras: dos hojas que se juntan en un pivote y bajan a los aros de los dedos. */
function Tijeras() {
  return (
    <>
      <path d="M11 9 L19 19 L27 9" {...TRAZO} />
      <path d="M19 19 L12 28" {...TRAZO} />
      <path d="M19 19 L23 23.5" {...TRAZO} />
      <circle cx={10.5} cy={30} r={3.4} {...TRAZO} />
      <circle cx={25.5} cy={26} r={3.4} {...TRAZO} />
    </>
  );
}

/** Ícono de cada una de las 6 estaciones fijas de la planta. */
export function EstacionIcono({ estacion, size = 32 }: { estacion: Estacion; size?: number }) {
  const color = COLOR_ESTACION[estacion];
  switch (estacion) {
    case 'bodega_prima':
      return (
        <Badge color={color} size={size}>
          <path d="M8 17 L20 10 L32 17 V30 H8 Z" {...TRAZO} />
          <path d="M8 17 L20 24 L32 17" {...TRAZO} />
          <path d="M20 24 V30" {...TRAZO} />
        </Badge>
      );
    case 'corte_recto':
      return (
        <Badge color={color} size={size}>
          <rect x={26} y={7} width={7} height={7} rx={1} fill="white" fillOpacity={0.9} />
          <Tijeras />
        </Badge>
      );
    case 'corte_circular':
      return (
        <Badge color={color} size={size}>
          <circle cx={29.5} cy={10.5} r={3.6} fill="white" fillOpacity={0.9} />
          <Tijeras />
        </Badge>
      );
    case 'perforado':
      return (
        <Badge color={color} size={size}>
          <circle cx={20} cy={13} r={4} {...TRAZO} />
          <path d="M20 17 V26" {...TRAZO} />
          <path d="M12 26 H28 L25 32 H15 Z" {...TRAZO} />
        </Badge>
      );
    case 'pintura':
      return (
        <Badge color={color} size={size}>
          <path d="M24 8 L31 15 L18 28 L11 28 L11 21 Z" {...TRAZO} />
          <path d="M11 28 C9 32 9 33 7 33" {...TRAZO} />
        </Badge>
      );
    case 'bodega_terminado':
      return (
        <Badge color={color} size={size}>
          <path d="M8 17 L20 10 L32 17 V30 H8 Z" {...TRAZO} />
          <path d="M8 17 L20 24 L32 17" {...TRAZO} />
          <path d="M15.5 20.5 L19 24 L25.5 17.5" stroke="white" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Badge>
      );
  }
}

/** Ícono del montacargas o la carretilla (Tabla 1 de traslados). */
export function MedioIcono({ medio, size = 32 }: { medio: MedioTransporte; size?: number }) {
  const color = medio === 'montacargas' ? '#b45309' : '#6b6153';
  if (medio === 'montacargas') {
    return (
      <Badge color={color} size={size}>
        <rect x={7} y={17} width={13} height={9} rx={1.5} {...TRAZO} />
        <path d="M20 20 H26 L29 24 V26 H20 Z" {...TRAZO} />
        <circle cx={13} cy={29} r={2.6} fill="white" />
        <circle cx={25} cy={29} r={2.6} fill="white" />
        <path d="M24 26 V13 H29" {...TRAZO} />
      </Badge>
    );
  }
  return (
    <Badge color={color} size={size}>
      <path d="M9 12 H13 L17 24 H29" {...TRAZO} />
      <path d="M17 24 H12 L10 16 H26" {...TRAZO} />
      <circle cx={18} cy={29} r={2.4} fill="white" />
      <circle cx={26} cy={29} r={2.4} fill="white" />
    </Badge>
  );
}

/** Las 3 figuras que se producen (triángulo, cuadrado, circunferencia). */
export function FiguraIcono({ figura, size = 24 }: { figura: Figura; size?: number }) {
  const color = COLOR_FIGURA[figura];
  if (figura === 'triangulo') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <path d="M12 3 L21 20 H3 Z" fill={color} />
      </svg>
    );
  }
  if (figura === 'cuadrado') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <rect x={3.5} y={3.5} width={17} height={17} rx={2} fill={color} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx={12} cy={12} r={9.5} fill={color} />
    </svg>
  );
}

/** Portada del juego: la planta con sus 6 estaciones alrededor del ingreso, a color. */
export function PortadaMudaGami({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} role="img" aria-label="Planta de MudaGami con sus estaciones">
      <rect x={0} y={0} width={200} height={120} rx={16} fill="#042f2e" />
      <path d="M92 10 V110 M108 10 V110" stroke="#134e4a" strokeWidth={3} strokeDasharray="7 6" />
      {(
        [
          ['bodega_prima', 20, 14],
          ['corte_circular', 116, 14],
          ['corte_recto', 20, 48],
          ['perforado', 116, 48],
          ['pintura', 20, 82],
          ['bodega_terminado', 116, 82],
        ] as [Estacion, number, number][]
      ).map(([estacion, x, y]) => (
        <g key={estacion} transform={`translate(${x} ${y})`}>
          <EstacionIcono estacion={estacion} size={26} />
        </g>
      ))}
      <text x={100} y={112} textAnchor="middle" fontSize={7} fill="#5eead4" fontWeight={700} letterSpacing={1}>
        INGRESO
      </text>
    </svg>
  );
}
