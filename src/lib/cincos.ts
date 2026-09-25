/**
 * Reto 5S — Del caos al flujo. Contenido de las misiones (dos escenarios),
 * roles que rotan y puntuación. Funciones puras: sirven en el servidor y en
 * el navegador. El puntaje premia calidad, comprensión (causas y decisiones),
 * colaboración, aplicación real y sostenibilidad; la velocidad suma poco.
 */

export const ESTADOS_SESION_5S = ['preparacion', 'jugando', 'cerrado'] as const;
export type EstadoSesion5S = (typeof ESTADOS_SESION_5S)[number];

// ----------------------------------------------------------------------------
// Misiones (la historia)
// ----------------------------------------------------------------------------

export interface Mision {
  numero: number;
  s: string;
  japones: string;
  emoji: string;
  titulo: string;
  historia: string;
  reto: string;
  revelacion: string;
  cuidado: string;
  segundos: number | null;
}

export const MISIONES: Mision[] = [
  {
    numero: 1,
    s: 'Clasificar',
    japones: 'Seiri',
    emoji: '🔴',
    titulo: 'El caos',
    historia: 'El puesto está lleno de cosas. Se pierde tiempo, se tropieza, nadie sabe qué sirve.',
    reto: 'Tienen 90 segundos. Decidan qué se queda (🟢 necesario), qué sale (🔴 innecesario) y qué va a la zona de dudas con tarjeta roja (🟡 dudoso).',
    revelacion: '¡Misión cumplida! Acaban de descubrir SEIRI — CLASIFICAR.',
    cuidado: 'Clasificar no es botar todo: es quedarse solo con lo que se usa, y decidir con criterio lo dudoso.',
    segundos: 90,
  },
  {
    numero: 2,
    s: 'Ordenar',
    japones: 'Seiton',
    emoji: '🟠',
    titulo: 'Donde debe estar',
    historia: 'Ya solo quedan las cosas necesarias. Pero mañana llega alguien que nunca ha usado este puesto.',
    reto: 'Ubiquen cada elemento según qué tan seguido se usa. Después, el sistema les pedirá encontrar elementos: cada uno en menos de 10 segundos.',
    revelacion: '¡Misión cumplida! Acaban de descubrir SEITON — ORDENAR.',
    cuidado: 'Ordenar no es acomodar bonito: es que cualquiera encuentre lo que necesita en segundos.',
    segundos: null,
  },
  {
    numero: 3,
    s: 'Limpiar',
    japones: 'Seiso',
    emoji: '🟡',
    titulo: 'Algo está fallando',
    historia: 'El área parece limpia. Pero hay un problema que se repite y nadie sabe por qué.',
    reto: 'Tienen 2 minutos para encontrar las 10 anomalías escondidas. Luego decidan qué hacer con cada una.',
    revelacion: '¡Misión cumplida! Acaban de descubrir SEISO — LIMPIAR.',
    cuidado: 'Limpiar no es el objetivo: encontrar y eliminar la causa del problema sí. Limpiar es inspeccionar.',
    segundos: 120,
  },
  {
    numero: 4,
    s: 'Estandarizar',
    japones: 'Seiketsu',
    emoji: '🟢',
    titulo: 'Que no dependa de ti',
    historia: 'El puesto quedó impecable. ¿Y si mañana no estás? ¿Cómo sabrá otra persona cómo debe quedar?',
    reto: 'Armen el estándar: elijan las frases del checklist que cualquiera podría verificar sin preguntar, y asignen el control visual correcto a cada problema.',
    revelacion: '¡Misión cumplida! Acaban de descubrir SEIKETSU — ESTANDARIZAR.',
    cuidado: 'Un estándar sirve si otra persona lo entiende y lo puede verificar sin preguntarte.',
    segundos: null,
  },
  {
    numero: 5,
    s: 'Sostener',
    japones: 'Shitsuke',
    emoji: '🔵',
    titulo: 'La prueba del hábito',
    historia: 'Pasaron tres días. Llegan la presión, las personas nuevas y los cambios de turno.',
    reto: 'Resuelvan tres eventos sorpresa: una urgencia, un colaborador nuevo que busca elementos en el orden que ustedes definieron y un cambio de turno que deben auditar.',
    revelacion: '¡Misión cumplida! Acaban de descubrir SHITSUKE — SOSTENER.',
    cuidado: 'La mayoría de las 5S fracasan aquí. Sostener es convertirlo en hábito, incluso con prisa.',
    segundos: null,
  },
  {
    numero: 6,
    s: 'Misión real',
    japones: '',
    emoji: '🚀',
    titulo: 'Ahora en su trabajo',
    historia: 'Ya lo vivieron en la simulación. Ahora elijan un espacio real de su empresa y transfórmenlo.',
    reto: 'Auditoría antes, evidencia inicial, hallazgos, una acción por cada S, evidencia final, resultados y auditoría después.',
    revelacion: '¡Misión real enviada! La facilitadora la revisará.',
    cuidado: 'Las 5S no son un día de limpieza: son la forma en que el equipo cuida su espacio todos los días.',
    segundos: null,
  },
];

export function mision(n: number) {
  return MISIONES.find((m) => m.numero === n)!;
}

// ----------------------------------------------------------------------------
// Roles que rotan
// ----------------------------------------------------------------------------

export const ROLES_5S = [
  { emoji: '🔎', nombre: 'Explorador', tarea: 'Busca: recorre la pantalla y señala lo que ve.' },
  { emoji: '🧠', nombre: 'Analista', tarea: 'Interpreta: pregunta «¿por qué?» antes de decidir.' },
  { emoji: '🎯', nombre: 'Estratega', tarea: 'Decide: cierra la discusión cuando hay dudas.' },
  { emoji: '🛠️', nombre: 'Ejecutor', tarea: 'Hace: es quien toca los botones en el celular.' },
] as const;

/** Rol de un integrante en una misión: se corre un puesto en cada misión. */
export function rolDe(indice: number, misionNumero: number) {
  return ROLES_5S[(indice + misionNumero - 1) % ROLES_5S.length]!;
}

// ----------------------------------------------------------------------------
// Escenarios
// ----------------------------------------------------------------------------

export type Clasificacion = 'necesario' | 'innecesario' | 'dudoso';
export type Frecuencia = 'diario' | 'semanal' | 'eventual';

export interface Objeto {
  id: string;
  emoji: string;
  nombre: string;
  tipo: Clasificacion;
  frecuencia?: Frecuencia;
  porque: string;
}

export interface Anomalia {
  id: string;
  emoji: string;
  nombre: string;
  anomalia: boolean;
  detalle: string;
  /** Qué hacer: limpiar la consecuencia o eliminar la causa. */
  superficial?: string;
  raiz?: string;
}

export interface FraseEstandar {
  id: string;
  texto: string;
  verificable: boolean;
}

export interface ControlVisual {
  id: string;
  problema: string;
  correcto: string;
}

export interface Evento {
  id: string;
  emoji: string;
  titulo: string;
  situacion: string;
  opciones: { id: string; texto: string; puntos: number; retro: string }[];
}

export interface Observacion {
  id: string;
  texto: string;
  cumple: boolean;
}

export interface Escenario {
  nombre: string;
  emoji: string;
  descripcion: string;
  objetos: Objeto[];
  anomalias: Anomalia[];
  frases: FraseEstandar[];
  controles: ControlVisual[];
  urgencia: Evento;
  observaciones: Observacion[];
}

export const ZONAS: Record<Frecuencia, { nombre: string; ayuda: string; emoji: string }> = {
  diario: { nombre: 'Al alcance de la mano', ayuda: 'Se usa todos los días', emoji: '✋' },
  semanal: { nombre: 'En el mueble cercano', ayuda: 'Se usa cada semana', emoji: '🗄️' },
  eventual: { nombre: 'En el archivo o almacén', ayuda: 'Se usa de vez en cuando', emoji: '📦' },
};

export const OPCIONES_CONTROL = [
  'Etiqueta con nombre',
  'Silueta dibujada (tablero de sombras)',
  'Código de colores',
  'Marca o línea en el piso',
  'Nivel mínimo y máximo marcado',
  'Tarjeta roja',
];

const OFICINA: Escenario = {
  nombre: 'Oficina administrativa',
  emoji: '🏢',
  descripcion: 'El puesto de trabajo del área de compras: escritorio, cajones, archivo y carpetas compartidas.',
  objetos: [
    { id: 'o1', emoji: '💻', nombre: 'Computador', tipo: 'necesario', frecuencia: 'diario', porque: 'Herramienta principal del trabajo.' },
    { id: 'o2', emoji: '📞', nombre: 'Teléfono', tipo: 'necesario', frecuencia: 'diario', porque: 'Se usa todo el día con proveedores.' },
    { id: 'o3', emoji: '🖊️', nombre: 'Esfero', tipo: 'necesario', frecuencia: 'diario', porque: 'Para firmas y notas diarias.' },
    { id: 'o4', emoji: '📒', nombre: 'Cuaderno de pendientes', tipo: 'necesario', frecuencia: 'diario', porque: 'Registro diario de tareas.' },
    { id: 'o5', emoji: '🔢', nombre: 'Calculadora', tipo: 'necesario', frecuencia: 'semanal', porque: 'Se usa en los cierres semanales.' },
    { id: 'o6', emoji: '📎', nombre: 'Grapadora', tipo: 'necesario', frecuencia: 'semanal', porque: 'Para armar los paquetes de facturas.' },
    { id: 'o7', emoji: '🗂️', nombre: 'Carpeta de órdenes de compra del mes', tipo: 'necesario', frecuencia: 'semanal', porque: 'Se consulta cada semana.' },
    { id: 'o8', emoji: '📕', nombre: 'Manual de procedimientos vigente', tipo: 'necesario', frecuencia: 'eventual', porque: 'Se consulta cuando hay dudas.' },
    { id: 'o9', emoji: '🔐', nombre: 'Sello de la empresa', tipo: 'necesario', frecuencia: 'eventual', porque: 'Solo para documentos oficiales.' },
    { id: 'o10', emoji: '🖨️', nombre: 'Cartucho de tinta de repuesto', tipo: 'necesario', frecuencia: 'eventual', porque: 'Se cambia cada tanto.' },
    { id: 'o11', emoji: '☕', nombre: 'Tres tazas sucias', tipo: 'innecesario', porque: 'No hacen parte del trabajo: van a la cocina.' },
    { id: 'o12', emoji: '🖊️', nombre: 'Siete esferos sin tinta', tipo: 'innecesario', porque: 'No sirven: se botan.' },
    { id: 'o13', emoji: '📄', nombre: 'Formatos de solicitud de la versión anterior', tipo: 'innecesario', porque: 'Obsoletos: usarlos genera errores.' },
    { id: 'o14', emoji: '📦', nombre: 'Caja de un monitor que ya se instaló', tipo: 'innecesario', porque: 'Ocupa espacio y no se usa.' },
    { id: 'o15', emoji: '📰', nombre: 'Revistas y volantes viejos', tipo: 'innecesario', porque: 'No tienen uso en el trabajo.' },
    { id: 'o16', emoji: '🔌', nombre: 'Cargador de un celular que ya nadie tiene', tipo: 'innecesario', porque: 'No sirve a nadie.' },
    { id: 'o17', emoji: '🗃️', nombre: 'Contratos de proveedores de hace 6 años', tipo: 'dudoso', porque: 'Pueden tener valor legal: tarjeta roja y consultar con jurídica.' },
    { id: 'o18', emoji: '🖱️', nombre: 'Mouse que a veces falla', tipo: 'dudoso', porque: 'Se decide si se repara o se reemplaza: tarjeta roja.' },
    { id: 'o19', emoji: '📚', nombre: 'Catálogos de proveedores de este año', tipo: 'dudoso', porque: 'Pueden servir: tarjeta roja y ver si alguien los usa.' },
    { id: 'o20', emoji: '🧾', nombre: 'Facturas sin archivar del mes pasado', tipo: 'necesario', frecuencia: 'semanal', porque: 'Hay que archivarlas: son necesarias.' },
  ],
  anomalias: [
    { id: 'a1', emoji: '🔌', nombre: 'Cable del computador atravesado en el paso', anomalia: true, detalle: 'Riesgo de caída.', superficial: 'Empujarlo con el pie a un lado', raiz: 'Canalizarlo por debajo del escritorio' },
    { id: 'a2', emoji: '📄', nombre: 'Formato de solicitud vencido en la bandeja', anomalia: true, detalle: 'Genera errores y reprocesos.', superficial: 'Botar las copias que se vean', raiz: 'Retirar la versión vieja de la carpeta compartida y dejar una sola vigente' },
    { id: 'a3', emoji: '🧯', nombre: 'Extintor con la carga vencida', anomalia: true, detalle: 'No funcionaría en una emergencia.', superficial: 'Limpiarle el polvo', raiz: 'Recargarlo y poner control de vencimiento' },
    { id: 'a4', emoji: '🪟', nombre: 'Gotera sobre el archivo', anomalia: true, detalle: 'Puede dañar documentos.', superficial: 'Poner un balde', raiz: 'Reportar y reparar la cubierta' },
    { id: 'a5', emoji: '🧴', nombre: 'Frasco sin etiqueta en el mueble', anomalia: true, detalle: 'Nadie sabe qué contiene.', superficial: 'Moverlo a otro cajón', raiz: 'Identificarlo y etiquetarlo o eliminarlo' },
    { id: 'a6', emoji: '🌫️', nombre: 'Polvo acumulado detrás de la impresora', anomalia: true, detalle: 'Recalienta el equipo.', superficial: 'Sacudirlo una vez', raiz: 'Incluirlo en la rutina semanal de limpieza' },
    { id: 'a7', emoji: '📦', nombre: 'Cajas bloqueando la salida de emergencia', anomalia: true, detalle: 'Riesgo en una evacuación.', superficial: 'Correrlas un poco', raiz: 'Retirarlas y marcar la zona que debe estar libre' },
    { id: 'a8', emoji: '🖥️', nombre: 'Pantalla con la imagen parpadeando', anomalia: true, detalle: 'Cansa la vista; puede fallar.', superficial: 'Bajarle el brillo', raiz: 'Reportarla a soporte para revisar el cable' },
    { id: 'a9', emoji: '🗂️', nombre: 'Carpeta de otra área en el escritorio', anomalia: true, detalle: 'Alguien la está buscando.', superficial: 'Guardarla en un cajón', raiz: 'Devolverla y acordar dónde se entregan los documentos' },
    { id: 'a10', emoji: '🔋', nombre: 'Regleta con demasiados enchufes conectados', anomalia: true, detalle: 'Riesgo eléctrico.', superficial: 'Desconectar algo por un rato', raiz: 'Pedir un punto eléctrico adecuado' },
    { id: 'n1', emoji: '💻', nombre: 'Computador encendido y funcionando', anomalia: false, detalle: 'Está bien.' },
    { id: 'n2', emoji: '📞', nombre: 'Teléfono en su base', anomalia: false, detalle: 'Está bien.' },
    { id: 'n3', emoji: '🪴', nombre: 'Planta con buena apariencia', anomalia: false, detalle: 'Está bien.' },
    { id: 'n4', emoji: '🗑️', nombre: 'Caneca vacía con su bolsa', anomalia: false, detalle: 'Está bien.' },
    { id: 'n5', emoji: '🪑', nombre: 'Silla ajustada a la altura del escritorio', anomalia: false, detalle: 'Está bien.' },
    { id: 'n6', emoji: '📋', nombre: 'Tablero de pendientes al día', anomalia: false, detalle: 'Está bien.' },
  ],
  frases: [
    { id: 'f1', texto: 'Al cerrar, el escritorio queda solo con computador, teléfono y cuaderno.', verificable: true },
    { id: 'f2', texto: 'Las facturas recibidas se archivan en la carpeta del mes antes de las 5 p. m.', verificable: true },
    { id: 'f3', texto: 'En la carpeta compartida solo existe la versión vigente de cada formato.', verificable: true },
    { id: 'f4', texto: 'Cada cajón tiene una etiqueta con lo que contiene.', verificable: true },
    { id: 'f5', texto: 'La zona frente a la salida de emergencia está libre (sin objetos sobre la línea amarilla).', verificable: true },
    { id: 'f6', texto: 'El viernes se revisa la zona de tarjetas rojas y se decide qué sale.', verificable: true },
    { id: 'f7', texto: 'Mantener el puesto ordenado.', verificable: false },
    { id: 'f8', texto: 'Tener buena actitud con el orden.', verificable: false },
    { id: 'f9', texto: 'Limpiar cuando se vea sucio.', verificable: false },
    { id: 'f10', texto: 'Ser responsables con los documentos.', verificable: false },
    { id: 'f11', texto: 'Tratar de no acumular cosas.', verificable: false },
    { id: 'f12', texto: 'Organizar las carpetas de la mejor manera posible.', verificable: false },
  ],
  controles: [
    { id: 'c1', problema: 'Nadie sabe qué hay en cada cajón', correcto: 'Etiqueta con nombre' },
    { id: 'c2', problema: 'La grapadora y la calculadora nunca vuelven a su lugar', correcto: 'Silueta dibujada (tablero de sombras)' },
    { id: 'c3', problema: 'Se confunden las carpetas de cada proceso', correcto: 'Código de colores' },
    { id: 'c4', problema: 'Ponen cajas frente a la salida de emergencia', correcto: 'Marca o línea en el piso' },
    { id: 'c5', problema: 'Se acaban las resmas de papel sin aviso', correcto: 'Nivel mínimo y máximo marcado' },
  ],
  urgencia: {
    id: 'e1',
    emoji: '🚨',
    titulo: 'Día 3 — Urgencia',
    situacion: 'Hoy hay cierre de mes y el equipo tiene 5 minutos menos para terminar. La rutina de cierre del puesto toma 3 minutos.',
    opciones: [
      { id: 'a', texto: 'Hacer la rutina de 3 minutos igual: el puesto queda listo para mañana.', puntos: 20, retro: '¡Eso es sostener! El hábito se nota justamente cuando hay presión.' },
      { id: 'b', texto: 'Hacer solo lo más visible (guardar documentos) y dejar el resto para mañana.', puntos: 10, retro: 'Mejor que nada, pero así empieza a perderse el estándar.' },
      { id: 'c', texto: 'Saltarse la rutina hoy: mañana se pone al día.', puntos: 0, retro: 'Un día sin rutina lleva a otro. Así se pierden la mayoría de las 5S.' },
    ],
  },
  observaciones: [
    { id: 'v1', texto: 'El escritorio tiene el computador, el teléfono, el cuaderno y dos tazas.', cumple: false },
    { id: 'v2', texto: 'Las facturas del día están en la carpeta del mes.', cumple: true },
    { id: 'v3', texto: 'Hay un formato viejo impreso junto a la impresora.', cumple: false },
    { id: 'v4', texto: 'Todos los cajones tienen su etiqueta.', cumple: true },
    { id: 'v5', texto: 'La línea amarilla frente a la salida está despejada.', cumple: true },
    { id: 'v6', texto: 'La calculadora está sobre el escritorio del compañero.', cumple: false },
  ],
};

const TALLER: Escenario = {
  nombre: 'Taller de mantenimiento',
  emoji: '🔧',
  descripcion: 'El banco de trabajo del taller: herramientas, repuestos, insumos y el área alrededor.',
  objetos: [
    { id: 'o1', emoji: '🔧', nombre: 'Juego de llaves', tipo: 'necesario', frecuencia: 'diario', porque: 'Se usa en cada reparación.' },
    { id: 'o2', emoji: '🪛', nombre: 'Destornilladores', tipo: 'necesario', frecuencia: 'diario', porque: 'Uso diario.' },
    { id: 'o3', emoji: '🥽', nombre: 'Gafas de seguridad', tipo: 'necesario', frecuencia: 'diario', porque: 'Obligatorias en cada tarea.' },
    { id: 'o4', emoji: '🧤', nombre: 'Guantes', tipo: 'necesario', frecuencia: 'diario', porque: 'Protección diaria.' },
    { id: 'o5', emoji: '📏', nombre: 'Flexómetro', tipo: 'necesario', frecuencia: 'semanal', porque: 'Se usa algunas veces por semana.' },
    { id: 'o6', emoji: '🔩', nombre: 'Caja de tornillos surtidos', tipo: 'necesario', frecuencia: 'semanal', porque: 'Repuestos frecuentes.' },
    { id: 'o7', emoji: '🛢️', nombre: 'Aceitera', tipo: 'necesario', frecuencia: 'semanal', porque: 'Lubricación semanal de equipos.' },
    { id: 'o8', emoji: '🔌', nombre: 'Multímetro', tipo: 'necesario', frecuencia: 'eventual', porque: 'Solo en fallas eléctricas.' },
    { id: 'o9', emoji: '📘', nombre: 'Manual de la máquina principal', tipo: 'necesario', frecuencia: 'eventual', porque: 'Se consulta en mantenimientos mayores.' },
    { id: 'o10', emoji: '🪜', nombre: 'Escalera', tipo: 'necesario', frecuencia: 'eventual', porque: 'Uso ocasional.' },
    { id: 'o11', emoji: '🥫', nombre: 'Latas de pintura secas', tipo: 'innecesario', porque: 'Ya no sirven: se disponen como residuo.' },
    { id: 'o12', emoji: '🪚', nombre: 'Segueta con la hoja partida', tipo: 'innecesario', porque: 'Dañada y sin repuesto.' },
    { id: 'o13', emoji: '📦', nombre: 'Cajas de cartón vacías', tipo: 'innecesario', porque: 'Ocupan espacio y son riesgo de incendio.' },
    { id: 'o14', emoji: '🧻', nombre: 'Trapos con aceite usados', tipo: 'innecesario', porque: 'Residuo peligroso: van al punto de residuos.' },
    { id: 'o15', emoji: '⚙️', nombre: 'Piñones de una máquina que ya se vendió', tipo: 'innecesario', porque: 'No hay dónde usarlos.' },
    { id: 'o16', emoji: '📄', nombre: 'Órdenes de trabajo de hace 3 años', tipo: 'innecesario', porque: 'Ya están en el sistema.' },
    { id: 'o17', emoji: '🔋', nombre: 'Taladro que a veces falla', tipo: 'dudoso', porque: 'Tarjeta roja: reparar o dar de baja.' },
    { id: 'o18', emoji: '🧰', nombre: 'Caja de repuestos sin identificar', tipo: 'dudoso', porque: 'Tarjeta roja: revisar qué contiene.' },
    { id: 'o19', emoji: '🔗', nombre: 'Cadenas de repuesto de otra línea', tipo: 'dudoso', porque: 'Pueden servir en otra área: tarjeta roja.' },
    { id: 'o20', emoji: '🧪', nombre: 'Grasa para rodamientos', tipo: 'necesario', frecuencia: 'semanal', porque: 'Lubricación semanal.' },
  ],
  anomalias: [
    { id: 'a1', emoji: '💧', nombre: 'Charco de aceite bajo la máquina', anomalia: true, detalle: 'Hay una fuga.', superficial: 'Secar el charco con un trapo', raiz: 'Encontrar la fuga y cambiar el empaque' },
    { id: 'a2', emoji: '🔧', nombre: 'Llave con la boca desgastada', anomalia: true, detalle: 'Daña los tornillos y puede lastimar.', superficial: 'Usarla con cuidado', raiz: 'Darla de baja y reponerla' },
    { id: 'a3', emoji: '🔌', nombre: 'Cable de la pulidora pelado', anomalia: true, detalle: 'Riesgo eléctrico.', superficial: 'Cubrirlo con cinta', raiz: 'Cambiar el cable y revisar dónde se maltrata' },
    { id: 'a4', emoji: '🧯', nombre: 'Extintor tapado por repuestos', anomalia: true, detalle: 'No se alcanza en una emergencia.', superficial: 'Mover los repuestos un poco', raiz: 'Despejar y marcar en el piso el área del extintor' },
    { id: 'a5', emoji: '🧴', nombre: 'Envase de químico sin etiqueta', anomalia: true, detalle: 'Nadie sabe qué contiene.', superficial: 'Ponerlo en un estante alto', raiz: 'Identificarlo con su hoja de seguridad o eliminarlo' },
    { id: 'a6', emoji: '🌫️', nombre: 'Viruta acumulada en el motor', anomalia: true, detalle: 'Recalienta el motor.', superficial: 'Soplarla con aire', raiz: 'Instalar una guarda y limpieza al final del turno' },
    { id: 'a7', emoji: '🚧', nombre: 'Pasillo bloqueado con una estiba', anomalia: true, detalle: 'Riesgo de accidente.', superficial: 'Pasar por un lado', raiz: 'Ubicar la estiba en su zona marcada' },
    { id: 'a8', emoji: '💡', nombre: 'Lámpara del banco que titila', anomalia: true, detalle: 'Poca luz, más errores.', superficial: 'Trabajar con la linterna del celular', raiz: 'Cambiar la lámpara o el balasto' },
    { id: 'a9', emoji: '🔩', nombre: 'Tornillo suelto en la guarda de la máquina', anomalia: true, detalle: 'La guarda puede caerse.', superficial: 'Apretarlo con la mano', raiz: 'Ajustarlo y agregarlo a la inspección diaria' },
    { id: 'a10', emoji: '📋', nombre: 'Hoja de inspección sin diligenciar hace una semana', anomalia: true, detalle: 'No se están haciendo las revisiones.', superficial: 'Llenarla de una vez hoy', raiz: 'Asignar responsable y hora fija para la inspección' },
    { id: 'n1', emoji: '🥽', nombre: 'Gafas colgadas en su gancho', anomalia: false, detalle: 'Está bien.' },
    { id: 'n2', emoji: '🧰', nombre: 'Caja de herramientas cerrada', anomalia: false, detalle: 'Está bien.' },
    { id: 'n3', emoji: '🗑️', nombre: 'Canecas por colores con sus bolsas', anomalia: false, detalle: 'Está bien.' },
    { id: 'n4', emoji: '🪜', nombre: 'Escalera en su lugar marcado', anomalia: false, detalle: 'Está bien.' },
    { id: 'n5', emoji: '🧤', nombre: 'Guantes nuevos en el dispensador', anomalia: false, detalle: 'Está bien.' },
    { id: 'n6', emoji: '📏', nombre: 'Flexómetro en su silueta', anomalia: false, detalle: 'Está bien.' },
  ],
  frases: [
    { id: 'f1', texto: 'Al final del turno cada herramienta está en su silueta del tablero.', verificable: true },
    { id: 'f2', texto: 'El piso alrededor de la máquina queda sin viruta ni aceite.', verificable: true },
    { id: 'f3', texto: 'Todo envase tiene etiqueta con su contenido y hoja de seguridad.', verificable: true },
    { id: 'f4', texto: 'El área marcada del extintor está despejada.', verificable: true },
    { id: 'f5', texto: 'La hoja de inspección diaria está firmada antes de las 7 a. m.', verificable: true },
    { id: 'f6', texto: 'Los repuestos están entre la marca de mínimo y la de máximo.', verificable: true },
    { id: 'f7', texto: 'Mantener el taller limpio.', verificable: false },
    { id: 'f8', texto: 'Cuidar las herramientas.', verificable: false },
    { id: 'f9', texto: 'Ser ordenados con los repuestos.', verificable: false },
    { id: 'f10', texto: 'Limpiar cuando haya tiempo.', verificable: false },
    { id: 'f11', texto: 'No dejar cosas tiradas.', verificable: false },
    { id: 'f12', texto: 'Tener conciencia de seguridad.', verificable: false },
  ],
  controles: [
    { id: 'c1', problema: 'Las herramientas nunca vuelven a su lugar', correcto: 'Silueta dibujada (tablero de sombras)' },
    { id: 'c2', problema: 'Nadie sabe qué hay en las cajas de repuestos', correcto: 'Etiqueta con nombre' },
    { id: 'c3', problema: 'Se mezclan los residuos', correcto: 'Código de colores' },
    { id: 'c4', problema: 'Dejan estibas en el pasillo', correcto: 'Marca o línea en el piso' },
    { id: 'c5', problema: 'Se acaba la grasa sin que nadie avise', correcto: 'Nivel mínimo y máximo marcado' },
  ],
  urgencia: {
    id: 'e1',
    emoji: '🚨',
    titulo: 'Día 3 — Urgencia',
    situacion: 'Una máquina se varó y producción presiona. Terminan la reparación con 5 minutos de retraso. La limpieza de cierre toma 4 minutos.',
    opciones: [
      { id: 'a', texto: 'Hacer la limpieza e inspección de cierre de 4 minutos igual.', puntos: 20, retro: '¡Eso es sostener! Además, la inspección puede evitar la próxima varada.' },
      { id: 'b', texto: 'Guardar solo las herramientas y dejar la viruta para mañana.', puntos: 10, retro: 'Las herramientas en su lugar ayudan, pero la viruta es la causa de futuras fallas.' },
      { id: 'c', texto: 'Irse: el turno siguiente limpia.', puntos: 0, retro: 'Pasarle el problema al otro turno rompe el estándar para todos.' },
    ],
  },
  observaciones: [
    { id: 'v1', texto: 'Falta la llave de 13 en el tablero de siluetas.', cumple: false },
    { id: 'v2', texto: 'El piso alrededor de la máquina está limpio.', cumple: true },
    { id: 'v3', texto: 'Hay un envase sin etiqueta junto al lavamanos.', cumple: false },
    { id: 'v4', texto: 'El área del extintor está despejada.', cumple: true },
    { id: 'v5', texto: 'La hoja de inspección de hoy está firmada.', cumple: true },
    { id: 'v6', texto: 'Hay grasa por debajo de la marca de mínimo y nadie ha pedido más.', cumple: false },
  ],
};

export const ESCENARIOS = { oficina: OFICINA, taller: TALLER } as const;
export type ClaveEscenario = keyof typeof ESCENARIOS;

/** Los 5 elementos que busca el «nuevo colaborador» (siempre los mismos por escenario). */
export function elementosBusqueda(esc: Escenario) {
  const necesarios = esc.objetos.filter((o) => o.tipo === 'necesario');
  return [necesarios[0]!, necesarios[4]!, necesarios[7]!, necesarios[2]!, necesarios[6]!].filter(Boolean);
}

// ----------------------------------------------------------------------------
// Puntuación de cada misión (el servidor la calcula con las respuestas)
// ----------------------------------------------------------------------------

export interface Resultado5S {
  aciertos: number;
  errores: number;
  puntos: number;
  detalle: string[];
}

const bonoTiempo = (segundos: number | null, limite: number | null, max: number) =>
  limite && segundos != null && segundos <= limite ? Math.round(((limite - segundos) / limite) * max) : 0;

/**
 * Respuestas por misión:
 *  1: { clasificacion: { idObjeto: 'necesario' | 'innecesario' | 'dudoso' } }
 *  2: { ubicacion: { idObjeto: frecuencia }, busqueda: { idObjeto: { zona, segundos } } }
 *  3: { marcadas: string[], acciones: { idAnomalia: 'raiz' | 'superficial' } }
 *  4: { frases: string[], controles: { idProblema: control } }
 *  5: { urgencia: idOpcion, colaborador: { idObjeto: { zona, segundos } }, turno: { idObs: boolean } }
 * `ubicacionM2` es el orden que el equipo definió en la misión 2 (para el nuevo colaborador).
 */
export function puntuar(numero: number, esc: Escenario, r: any, segundos: number | null, ubicacionM2?: Record<string, Frecuencia>): Resultado5S {
  const res: Resultado5S = { aciertos: 0, errores: 0, puntos: 0, detalle: [] };
  const ok = (p: number) => {
    res.aciertos++;
    res.puntos += p;
  };
  const mal = (p = 0) => {
    res.errores++;
    res.puntos -= p;
  };

  if (numero === 1) {
    const c = (r?.clasificacion ?? {}) as Record<string, Clasificacion>;
    for (const o of esc.objetos) (c[o.id] === o.tipo ? ok(10) : mal(c[o.id] ? 5 : 0));
    const bono = bonoTiempo(segundos, 90, 30);
    res.puntos += bono;
    res.detalle.push(`${res.aciertos} de ${esc.objetos.length} bien clasificados`, bono ? `+${bono} por tiempo` : 'sin bono de tiempo');
  }

  if (numero === 2) {
    const u = (r?.ubicacion ?? {}) as Record<string, Frecuencia>;
    const necesarios = esc.objetos.filter((o) => o.tipo === 'necesario');
    let bienUbicados = 0;
    for (const o of necesarios) {
      if (u[o.id] === o.frecuencia) {
        ok(10);
        bienUbicados++;
      } else mal();
    }
    const b = (r?.busqueda ?? {}) as Record<string, { zona: Frecuencia; segundos: number }>;
    let encontrados = 0;
    for (const [id, x] of Object.entries(b)) {
      if (x && u[id] && x.zona === u[id]) {
        encontrados++;
        ok(x.segundos <= 10 ? 15 : 8);
      } else mal();
    }
    res.detalle.push(`${bienUbicados} de ${necesarios.length} en la zona correcta`, `${encontrados} de ${Object.keys(b).length} encontrados`);
  }

  if (numero === 3) {
    const marcadas = new Set<string>((r?.marcadas ?? []) as string[]);
    const acciones = (r?.acciones ?? {}) as Record<string, 'raiz' | 'superficial'>;
    let encontradas = 0;
    let raices = 0;
    for (const a of esc.anomalias) {
      if (a.anomalia && marcadas.has(a.id)) {
        encontradas++;
        ok(10);
        if (acciones[a.id] === 'raiz') {
          raices++;
          res.puntos += 10;
        } else if (acciones[a.id] === 'superficial') res.puntos += 2;
      } else if (a.anomalia) res.errores++;
      else if (marcadas.has(a.id)) mal(5);
    }
    const bono = bonoTiempo(segundos, 120, 20);
    res.puntos += bono;
    res.detalle.push(`${encontradas} de 10 anomalías`, `${raices} atacadas en la causa`);
  }

  if (numero === 4) {
    const frases = new Set<string>((r?.frases ?? []) as string[]);
    let buenas = 0;
    for (const f of esc.frases) {
      if (!frases.has(f.id)) continue;
      if (f.verificable) {
        buenas++;
        ok(10);
      } else mal(8);
    }
    const controles = (r?.controles ?? {}) as Record<string, string>;
    let pares = 0;
    for (const c of esc.controles) {
      if (controles[c.id] === c.correcto) {
        pares++;
        ok(10);
      } else mal();
    }
    res.detalle.push(`${buenas} frases verificables`, `${pares} de ${esc.controles.length} controles visuales correctos`);
  }

  if (numero === 5) {
    const op = esc.urgencia.opciones.find((o) => o.id === r?.urgencia);
    if (op) {
      res.puntos += op.puntos;
      if (op.puntos >= 20) res.aciertos++;
      else res.errores++;
    }
    // El nuevo colaborador busca según el orden que el equipo dejó en la misión 2 (o el ideal si no la jugó).
    const b = (r?.colaborador ?? {}) as Record<string, { zona: Frecuencia; segundos: number }>;
    let hallados = 0;
    for (const o of elementosBusqueda(esc)) {
      const esperado = ubicacionM2?.[o.id] ?? o.frecuencia;
      const x = b[o.id];
      if (x && x.zona === esperado) {
        hallados++;
        ok(x.segundos <= 10 ? 12 : 6);
      } else mal();
    }
    const t = (r?.turno ?? {}) as Record<string, boolean>;
    let auditadas = 0;
    for (const v of esc.observaciones) {
      if (t[v.id] === v.cumple) {
        auditadas++;
        ok(10);
      } else mal();
    }
    res.detalle.push(op ? `Urgencia: ${op.puntos} puntos` : 'Urgencia sin responder', `${hallados} de 5 encontrados por el nuevo colaborador`, `${auditadas} de ${esc.observaciones.length} bien auditadas`);
  }

  res.puntos = Math.max(0, Math.round(res.puntos));
  return res;
}

// ----------------------------------------------------------------------------
// Misión real: auditoría, evidencias y puntos
// ----------------------------------------------------------------------------

export const AUDITORIA = [
  { s: 'Clasificar', pregunta: '¿En el espacio solo hay lo necesario?' },
  { s: 'Ordenar', pregunta: '¿Cada cosa tiene un lugar identificado y se encuentra en segundos?' },
  { s: 'Limpiar', pregunta: '¿Está limpio y se inspecciona para detectar fallas?' },
  { s: 'Estandarizar', pregunta: '¿Hay un estándar visible (foto, checklist, controles visuales)?' },
  { s: 'Sostener', pregunta: '¿Se cumple todos los días, sin que nadie lo recuerde?' },
];

export const ESCALA = ['0 · Nada', '1 · Muy poco', '2 · A medias', '3 · Casi siempre', '4 · Totalmente'];

export const TIPOS_AREA = ['Área', 'Proceso', 'Puesto de trabajo', 'Oficina', 'Archivo', 'Herramientas', 'Información digital'];

export const HALLAZGOS = [
  { clave: 'innecesarios', nombre: 'Elementos innecesarios' },
  { clave: 'desorden', nombre: 'Cosas sin lugar definido' },
  { clave: 'suciedad', nombre: 'Focos de suciedad' },
  { clave: 'problemas', nombre: 'Fallas o anomalías' },
  { clave: 'riesgos', nombre: 'Riesgos de seguridad' },
  { clave: 'obsoleta', nombre: 'Información obsoleta' },
];

export const RESULTADOS_REALES = [
  { clave: 'minutos_ahorrados', nombre: 'Minutos ahorrados al día', unidad: 'min/día' },
  { clave: 'busqueda_antes', nombre: 'Tiempo de búsqueda antes', unidad: 'segundos' },
  { clave: 'busqueda_despues', nombre: 'Tiempo de búsqueda después', unidad: 'segundos' },
  { clave: 'espacio_liberado', nombre: 'Espacio liberado', unidad: 'm²' },
  { clave: 'elementos_eliminados', nombre: 'Elementos eliminados', unidad: 'elementos' },
  { clave: 'riesgos_eliminados', nombre: 'Riesgos eliminados', unidad: 'riesgos' },
  { clave: 'errores_reducidos', nombre: 'Errores reducidos al mes', unidad: 'errores' },
];

export interface MisionRealMinima {
  tipo_area: string | null;
  area: string | null;
  problema: string | null;
  foto_antes: string | null;
  foto_despues: string | null;
  hallazgos: Record<string, number>;
  acciones: Record<string, string>;
  resultados: Record<string, number>;
  auditoria_antes: Record<string, number>;
  auditoria_despues: Record<string, number>;
  estado: 'borrador' | 'enviada' | 'validada' | 'corregir';
  puntos_bono: number;
}

/** % 5S de una auditoría (0 a 100). */
export function porcentaje5S(a: Record<string, number> | null | undefined) {
  if (!a) return null;
  const valores = AUDITORIA.map((_, i) => a[String(i)]).filter((v) => v != null);
  if (valores.length < AUDITORIA.length) return null;
  return (valores.reduce((s, v) => s + Number(v), 0) / (AUDITORIA.length * 4)) * 100;
}

/** Evidencias completas de 10. */
export function evidencias(m: MisionRealMinima | null | undefined) {
  if (!m) return 0;
  const lleno = (v: unknown) => v != null && String(v).trim() !== '';
  const acciones = AUDITORIA.filter((a) => lleno(m.acciones?.[a.s])).length;
  return (
    Number(lleno(m.area)) +
    Number(lleno(m.foto_antes)) +
    Number(Object.values(m.hallazgos ?? {}).some((v) => Number(v) > 0)) +
    acciones +
    Number(lleno(m.foto_despues)) +
    Number(Object.values(m.resultados ?? {}).some((v) => Number(v) > 0))
  );
}

export function puntosMisionReal(m: MisionRealMinima | null | undefined) {
  if (!m || m.estado === 'borrador') return 0;
  const antes = porcentaje5S(m.auditoria_antes) ?? 0;
  const despues = porcentaje5S(m.auditoria_despues) ?? 0;
  const mejora = Math.max(0, Math.min(100, Math.round((despues - antes) * 2)));
  const base = m.estado === 'validada' ? 250 : 100;
  return base + evidencias(m) * 10 + mejora + (m.estado === 'validada' ? Number(m.puntos_bono) || 0 : 0);
}

// ----------------------------------------------------------------------------
// Marcador por equipo
// ----------------------------------------------------------------------------

export interface IntentoMinimo {
  equipo_id: string;
  mision: number;
  jugador_id: string | null;
  inicio: string;
  fin: string | null;
  aciertos: number;
  errores: number;
  puntos: number;
}

export interface Marcador5S {
  equipoId: string;
  porMision: Record<number, IntentoMinimo | undefined>;
  puntosMisiones: number;
  colaboracion: number;
  participantes: number;
  puntosReal: number;
  total: number;
  errores: number;
  segundos: number;
  cincoS: number | null;
  cincoSAntes: number | null;
  evidencias: number;
}

export const BONO_COLABORACION = { porPersona: 15, max: 60 };

export function marcador5S(equipoId: string, intentos: IntentoMinimo[], real: MisionRealMinima | null | undefined): Marcador5S {
  const suyos = intentos.filter((i) => i.equipo_id === equipoId && i.fin);
  const porMision: Record<number, IntentoMinimo | undefined> = {};
  for (const i of suyos) porMision[i.mision] = i;
  const participantes = new Set(suyos.map((i) => i.jugador_id).filter(Boolean)).size;
  const colaboracion = participantes > 1 ? Math.min(BONO_COLABORACION.max, (participantes - 1) * BONO_COLABORACION.porPersona) : 0;
  const puntosMisiones = suyos.reduce((s, i) => s + i.puntos, 0);
  const puntosReal = puntosMisionReal(real);
  return {
    equipoId,
    porMision,
    puntosMisiones,
    colaboracion,
    participantes,
    puntosReal,
    total: puntosMisiones + colaboracion + puntosReal,
    errores: suyos.reduce((s, i) => s + i.errores, 0),
    segundos: suyos.reduce((s, i) => s + Math.max(0, (new Date(i.fin!).getTime() - new Date(i.inicio).getTime()) / 1000), 0),
    cincoS: porcentaje5S(real?.auditoria_despues),
    cincoSAntes: porcentaje5S(real?.auditoria_antes),
    evidencias: evidencias(real),
  };
}

export function formatearTiempo(segundos: number) {
  const s = Math.round(segundos);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ----------------------------------------------------------------------------
// Opciones de mejora del informe
// ----------------------------------------------------------------------------

export interface Recomendacion5S {
  ref: string;
  prioridad: 'alta' | 'media' | 'baja';
  titulo: string;
  detalle: string;
  herramienta?: string;
}

const HERRAMIENTA_S: Record<string, string> = {
  Clasificar: 'Tarjeta roja y zona de cuarentena',
  Ordenar: 'Mapa de ubicación, etiquetas y tablero de siluetas',
  Limpiar: 'Rutina de limpieza-inspección y análisis de fuentes de suciedad',
  Estandarizar: 'Foto estándar, checklist verificable y controles visuales',
  Sostener: 'Auditoría 5S semanal y rutina de 5 minutos al cierre',
};

/** Recomendaciones a partir del juego: la S más débil, los equipos sin misión real y lo que funcionó. */
export function recomendaciones5S(equipos: { id: string; nombre: string; emoji: string }[], intentos: IntentoMinimo[], reales: Record<string, MisionRealMinima>): Recomendacion5S[] {
  const r: Recomendacion5S[] = [];
  const conReal = equipos.filter((e) => reales[e.id] && reales[e.id]!.estado !== 'borrador');

  // La S más débil según la auditoría «después» de las misiones reales.
  if (conReal.length) {
    const promedios = AUDITORIA.map((a, i) => ({
      s: a.s,
      v: conReal.reduce((acc, e) => acc + Number(reales[e.id]!.auditoria_despues?.[String(i)] ?? 0), 0) / conReal.length,
    })).sort((a, b) => a.v - b.v);
    const debil = promedios[0]!;
    if (debil.v < 3.5) {
      r.push({
        ref: `s5-debil-${debil.s}`,
        prioridad: debil.v < 2.5 ? 'alta' : 'media',
        titulo: `Reforzar ${debil.s}: es la S más débil (${debil.v.toLocaleString('es-CO', { maximumFractionDigits: 1 })} de 4)`,
        detalle: `En las auditorías finales de los espacios reales, «${debil.s}» obtuvo el puntaje más bajo. Programen una jornada corta enfocada en esa S.`,
        herramienta: HERRAMIENTA_S[debil.s],
      });
    }
    // Replicar lo que funcionó.
    for (const e of conReal) {
      const m = reales[e.id]!;
      const antes = porcentaje5S(m.auditoria_antes);
      const despues = porcentaje5S(m.auditoria_despues);
      if (antes != null && despues != null && despues - antes >= 20) {
        r.push({
          ref: `s5-replicar-${e.id}`,
          prioridad: 'media',
          titulo: `Replicar la mejora de ${e.emoji} ${e.nombre} en «${m.area ?? 'su espacio'}» (${Math.round(antes)} % → ${Math.round(despues)} %)`,
          detalle: `Acciones: ${AUDITORIA.filter((a) => m.acciones?.[a.s]).map((a) => `${a.s}: ${m.acciones[a.s]}`).join('; ') || 'ver misión real'}. Llévenlas a espacios parecidos.`,
          herramienta: 'Yokoten (replicar lo que funciona)',
        });
      }
    }
  }

  const sinReal = equipos.filter((e) => !reales[e.id] || reales[e.id]!.estado === 'borrador');
  if (sinReal.length) {
    r.push({
      ref: 's5-sin-real',
      prioridad: 'alta',
      titulo: `${sinReal.length} ${sinReal.length === 1 ? 'equipo no completó' : 'equipos no completaron'} la misión real`,
      detalle: `${sinReal.map((e) => `${e.emoji} ${e.nombre}`).join(', ')}. Sin aplicación real, el aprendizaje se queda en el juego: acuerden una fecha y un espacio.`,
    });
  }

  // Misiones simuladas con bajo desempeño (Limpiar = causas; Estandarizar = frases vagas).
  const promedioMision = (n: number) => {
    const xs = intentos.filter((i) => i.mision === n && i.fin);
    return xs.length ? xs.reduce((s, i) => s + i.puntos, 0) / xs.length : null;
  };
  const m3 = promedioMision(3);
  if (m3 != null && m3 < 150) {
    r.push({
      ref: 's5-causas',
      prioridad: 'media',
      titulo: 'Los equipos limpian la consecuencia, no la causa',
      detalle: 'En la misión Limpiar varias decisiones fueron de «limpiar» en vez de eliminar la fuente. Entrenen el análisis de fuentes de suciedad y los 5 porqués.',
      herramienta: '5 porqués y mapa de fuentes de suciedad',
    });
  }
  const m4 = promedioMision(4);
  if (m4 != null && m4 < 80) {
    r.push({
      ref: 's5-estandar',
      prioridad: 'media',
      titulo: 'Los estándares salen vagos',
      detalle: 'En Estandarizar se eligieron frases como «mantener ordenado». Un estándar debe poder verificarse con solo mirar: foto, cantidad, lugar, hora.',
      herramienta: 'Foto estándar y checklist verificable',
    });
  }

  r.push({
    ref: 's5-sostener',
    prioridad: 'baja',
    titulo: 'Programar auditorías 5S cada semana durante 2 meses',
    detalle: 'Usen la misma auditoría de 5 preguntas y registren el % 5S en el Control de procesos para ver si el hábito se sostiene.',
    herramienta: 'Auditoría 5S y Control de procesos',
  });
  const orden = { alta: 0, media: 1, baja: 2 };
  return r.sort((a, b) => orden[a.prioridad] - orden[b.prioridad]);
}
