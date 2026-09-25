/**
 * MUDALAB — La misión de recuperar el flujo.
 *
 * Juego de detectives por equipos. Cada equipo es una agencia que recibe un
 * expediente (un proceso real con 8 Mudas escondidas) y lo resuelve con la
 * estructura DMAIC: Definir, Medir (Gemba), Analizar (5 porqués e Ishikawa),
 * Mejorar (laboratorio con presupuesto y simulación) y Controlar (la Muda
 * regresa). Después, en el Mundo 2 «Mi proceso», cada persona registra una
 * Muda de su propio trabajo en el Banco de oportunidades.
 *
 * Aquí está todo el contenido del caso y el puntaje. El puntaje se calcula
 * SIEMPRE en el servidor con `puntuar` (el navegador solo lo muestra).
 */

// ----------------------------------------------------------------------------
// Las 8 Mudas (los «enemigos» del flujo)
// ----------------------------------------------------------------------------

export const MUDAS = {
  transporte: { emoji: '🚚', nombre: 'Transporte', enemigo: 'El Mensajero Perdido', que: 'Mover papeles, información o materiales de un lado a otro sin necesidad.' },
  inventario: { emoji: '📦', nombre: 'Inventario', enemigo: 'El Acumulador', que: 'Guardar más de lo que se necesita: materiales, papeles o solicitudes en cola.' },
  movimiento: { emoji: '🚶', nombre: 'Movimiento', enemigo: 'El Caminante', que: 'Personas que caminan, buscan o se estiran más de lo necesario para hacer su trabajo.' },
  espera: { emoji: '⏳', nombre: 'Espera', enemigo: 'La Fila Eterna', que: 'Trabajo detenido esperando una firma, una respuesta, un dato o a alguien.' },
  sobreproduccion: { emoji: '🖨️', nombre: 'Sobreproducción', enemigo: 'El Copión', que: 'Hacer más, o antes, de lo que alguien necesita: copias, informes, reportes «por si acaso».' },
  sobreprocesamiento: { emoji: '🔁', nombre: 'Sobreprocesamiento', enemigo: 'El Perfeccionista', que: 'Hacer trabajo que el cliente no valora: datos de más, revisiones dobles, transcribir.' },
  defectos: { emoji: '❌', nombre: 'Defectos', enemigo: 'El Reprocesador', que: 'Errores que obligan a devolver, corregir o repetir el trabajo.' },
  talento: { emoji: '🧠', nombre: 'Talento no aprovechado', enemigo: 'El Talento Dormido', que: 'Personas capaces haciendo tareas que no usan lo que saben, o ideas que nadie escucha.' },
} as const;
export type ClaveMuda = keyof typeof MUDAS;
export const CLAVES_MUDA = Object.keys(MUDAS) as ClaveMuda[];

// ----------------------------------------------------------------------------
// Misiones
// ----------------------------------------------------------------------------

export interface MisionMl {
  numero: number;
  fase: string;
  emoji: string;
  titulo: string;
  historia: string;
  reto: string;
  /** Tiempo sugerido (solo se muestra; la velocidad no da puntos). */
  segundos: number | null;
  revelacion: string;
  aprendizaje: string;
}

export const MISIONES_ML: MisionMl[] = [
  {
    numero: 1,
    fase: 'Definir',
    emoji: '🎯',
    titulo: 'Abrir el expediente',
    historia:
      'Llega una queja a la agencia: «Pedir un paquete de hojas tarda una semana». Antes de salir a investigar, todo buen detective define exactamente qué caso va a resolver.',
    reto: 'Definan el problema, a quién afecta, dónde empieza y termina el proceso, el indicador y la meta.',
    segundos: 5 * 60,
    revelacion: '📁 ¡Expediente abierto!',
    aprendizaje: 'Un problema bien definido se mide, no culpa a nadie y no trae la solución escondida.',
  },
  {
    numero: 2,
    fase: 'Medir',
    emoji: '🔎',
    titulo: 'Ir al Gemba',
    historia:
      'El manual dice que el proceso tiene 5 pasos. Pero los detectives no confían en el papel: van al lugar donde pasan las cosas (el Gemba) a ver con sus propios ojos.',
    reto: 'Usen sus 8 fichas de investigación con las lentes 📄 procedimiento, 📊 datos y 👀 observar. Encuentren las 8 Mudas escondidas, el cuello de botella y la eficiencia.',
    segundos: 10 * 60,
    revelacion: '🕵️ ¡El papel decía 5 pasos, la realidad tiene 12!',
    aprendizaje: 'El proceso real casi nunca es el del manual. Por eso se mide en el Gemba, con datos y observación.',
  },
  {
    numero: 3,
    fase: 'Analizar',
    emoji: '🧩',
    titulo: 'Interrogar al proceso',
    historia: 'Ya saben dónde está la Muda. Ahora hay que saber por qué existe. Ojo: hay pistas falsas que llevan a culpar a una persona.',
    reto: 'Lleguen a la causa raíz con los 5 porqués y ubiquen las causas de los defectos en el diagrama de Ishikawa.',
    segundos: 8 * 60,
    revelacion: '🔓 ¡CAUSA RAÍZ DESBLOQUEADA!',
    aprendizaje: 'Se ataca el proceso, no a la persona. Si la respuesta es «alguien es desordenado», falta preguntar otro porqué.',
  },
  {
    numero: 4,
    fase: 'Mejorar',
    emoji: '🧪',
    titulo: 'El laboratorio',
    historia:
      'El comité les da $500.000, 3 personas y 1 semana. Hay muchas ideas sobre la mesa; algunas brillan pero no caben, otras son baratas y atacan la causa.',
    reto: 'Armen su plan con tarjetas de solución, simúlenlo (hasta 3 experimentos) y entreguen el mejor. Meta: de 5,1 a 2 días y de 18 % a 5 % de devoluciones.',
    segundos: 10 * 60,
    revelacion: '✅ ¡MEJORA VALIDADA!',
    aprendizaje: 'Primero se experimenta en pequeño y con datos. La solución más cara no es la mejor: la mejor ataca la causa.',
  },
  {
    numero: 5,
    fase: 'Controlar',
    emoji: '🛡️',
    titulo: 'La Muda regresa',
    historia:
      '3 semanas después… 💥 Entraron 4 personas nuevas, un jefe volvió a pedir firmas «por si acaso» y ya hay solicitudes que dicen «ver adjunto». ¡La Muda está regresando!',
    reto: 'Elijan hasta 3 mecanismos para sostener la mejora y simulen las siguientes 12 semanas.',
    segundos: 5 * 60,
    revelacion: '🛡️ ¡La mejora se sostiene!',
    aprendizaje: 'Sin estándar, indicador y un mecanismo que avise, toda mejora se devuelve. Pedir «compromiso» no es un mecanismo.',
  },
  {
    numero: 6,
    fase: 'Mi proceso',
    emoji: '🏢',
    titulo: 'Mundo 2: Mi proceso',
    historia: 'Ahora el caso es real. Cada persona busca una Muda en su propio trabajo y la registra en el Banco de oportunidades del equipo.',
    reto: 'Registren al menos una Muda de su trabajo real con evidencia, causa e idea, y voten 👍 las mejores oportunidades de los demás.',
    segundos: null,
    revelacion: '🏦 Oportunidad guardada',
    aprendizaje: 'Una Muda que se ve, se mide y se registra ya empezó a desaparecer.',
  },
];

export function misionMl(n: number) {
  return MISIONES_ML.find((m) => m.numero === n) ?? MISIONES_ML[0]!;
}

/** Roles que rotan en cada misión (misma idea que el Reto 5S). */
export const ROLES_ML = [
  { emoji: '🕵️', nombre: 'Detective', tarea: 'Observa, lee las pistas en voz alta y dice qué ve.' },
  { emoji: '📊', nombre: 'Analista', tarea: 'Mira los datos y pregunta «¿por qué?» y «¿cuánto?».' },
  { emoji: '🧩', nombre: 'Estratega', tarea: 'Propone la decisión y cuida el presupuesto y la meta.' },
  { emoji: '✍️', nombre: 'Escriba', tarea: 'Toca los botones y entrega la misión.' },
] as const;

export function rolMl(indice: number, mision: number) {
  return ROLES_ML[(indice + mision - 1) % ROLES_ML.length]!;
}

// ----------------------------------------------------------------------------
// El caso: «La compra que tardaba 5 días»
// ----------------------------------------------------------------------------

export const CASO = {
  expediente: '#047',
  nombre: 'La compra que tardaba 5 días',
  empresa: 'Distribuidora El Faro (empresa inventada)',
  queja: '«Pedir un paquete de hojas o unos lapiceros tarda una semana. Y a veces me devuelven la solicitud.»',
  diasBase: 5.1,
  defectosBase: 18,
  metaDias: 2,
  metaDefectos: 5,
};

export interface PasoCaso {
  id: string;
  nombre: string;
  area: string;
  /** Aparece en el procedimiento escrito (5 de los 12). */
  documentado: boolean;
  /** Minutos de trabajo y horas de espera antes de este paso (lente 📊). */
  trabajoMin: number;
  esperaH: number;
  /** Minutos que de verdad agregan valor al cliente. */
  valorMin: number;
  /** Lo que se ve al observar (lente 👀). */
  pista: string;
  muda: ClaveMuda | null;
}

export const PASOS: PasoCaso[] = [
  { id: 'p1', nombre: 'Detectar la necesidad', area: 'Solicitante', documentado: false, trabajoMin: 10, esperaH: 0, valorMin: 10, pista: 'Ve que se acabaron las hojas y decide pedir. Es rápido y necesario.', muda: null },
  { id: 'p2', nombre: 'Llenar el formato de 3 páginas', area: 'Solicitante', documentado: true, trabajoMin: 25, esperaH: 0, valorMin: 0, pista: 'El formato pide 34 datos. Compras solo usa 9. Nadie sabe para qué son los otros 25.', muda: 'sobreprocesamiento' },
  { id: 'p3', nombre: 'Subir el formato impreso al 3.er piso', area: 'Solicitante', documentado: false, trabajoMin: 15, esperaH: 0, valorMin: 0, pista: 'Sube dos pisos con la hoja en la mano. Si el jefe no está, la deja en una bandeja.', muda: 'transporte' },
  { id: 'p4', nombre: 'Esperar la firma del jefe', area: 'Jefe de área', documentado: true, trabajoMin: 2, esperaH: 48, valorMin: 0, pista: 'La bandeja del jefe tiene 23 solicitudes. Firma los viernes. Firmar le toma 2 minutos; esperar, 2 días.', muda: 'espera' },
  { id: 'p5', nombre: 'Revisar los datos de la solicitud', area: 'Compras', documentado: false, trabajoMin: 10, esperaH: 6, valorMin: 0, pista: '18 de cada 100 solicitudes vuelven al solicitante: sin centro de costo, sin cantidad o con letra ilegible.', muda: 'defectos' },
  { id: 'p6', nombre: 'Imprimir 3 copias de la solicitud', area: 'Compras', documentado: false, trabajoMin: 5, esperaH: 0, valorMin: 0, pista: 'Una copia para archivo, otra para Contabilidad y otra «por si acaso». Contabilidad dice que nunca las mira.', muda: 'sobreproduccion' },
  { id: 'p7', nombre: 'Consultar existencias en el almacén', area: 'Almacén', documentado: false, trabajoMin: 10, esperaH: 4, valorMin: 0, pista: 'Hay papelería para 6 meses: 40 resmas y 300 lapiceros. Aun así, se vuelve a comprar porque nadie revisa primero.', muda: 'inventario' },
  { id: 'p8', nombre: 'Cotizar con 3 proveedores', area: 'Analista de compras', documentado: true, trabajoMin: 90, esperaH: 16, valorMin: 0, pista: 'Laura, especialista en negociación, pasa hora y media copiando precios de catálogos a mano, para compras de $30.000.', muda: 'talento' },
  { id: 'p9', nombre: 'Emitir la orden de compra', area: 'Compras', documentado: true, trabajoMin: 15, esperaH: 4, valorMin: 15, pista: 'Genera la orden en el sistema contable. Es necesaria y se hace bien.', muda: null },
  { id: 'p10', nombre: 'Recibir el pedido del proveedor', area: 'Almacén', documentado: false, trabajoMin: 20, esperaH: 24, valorMin: 20, pista: 'El proveedor entrega al día siguiente. El almacenista revisa cantidades. Todo en orden.', muda: null },
  { id: 'p11', nombre: 'Avisar al solicitante que llegó', area: 'Almacén', documentado: false, trabajoMin: 5, esperaH: 8, valorMin: 0, pista: 'Envía un correo corto. Funciona bien.', muda: null },
  { id: 'p12', nombre: 'Ir al almacén a recoger el pedido', area: 'Solicitante', documentado: true, trabajoMin: 20, esperaH: 8, valorMin: 0, pista: 'Camina 8 minutos de ida y 8 de vuelta. La mitad de las veces el almacenista no está y debe volver.', muda: 'movimiento' },
];

export const FICHAS_GEMBA = 8;

/** Tiempos totales del proceso actual. */
export function tiemposCaso() {
  const trabajo = PASOS.reduce((s, p) => s + p.trabajoMin, 0);
  const espera = PASOS.reduce((s, p) => s + p.esperaH * 60, 0);
  const valor = PASOS.reduce((s, p) => s + p.valorMin, 0);
  const total = trabajo + espera;
  return { trabajoMin: trabajo, esperaMin: espera, valorMin: valor, totalMin: total, dias: total / 60 / 24, eficiencia: (valor / total) * 100 };
}

export const OPCIONES_EFICIENCIA = [
  { id: 'e1', texto: 'Menos del 1 %: casi todo el tiempo es espera', correcta: true },
  { id: 'e2', texto: 'Cerca del 25 %', correcta: false },
  { id: 'e3', texto: 'Cerca del 60 %: la mayor parte agrega valor', correcta: false },
];

// ----------------------------------------------------------------------------
// Misión 1 — Definir
// ----------------------------------------------------------------------------

export interface Pregunta {
  id: string;
  pregunta: string;
  opciones: { id: string; texto: string; correcta?: boolean; porque: string }[];
}

export const DEFINIR: Pregunta[] = [
  {
    id: 'problema',
    pregunta: '¿Cuál es el problema bien definido?',
    opciones: [
      { id: 'a', texto: 'Las solicitudes de papelería tardan en promedio 5 días desde que se piden hasta que llegan al solicitante.', correcta: true, porque: 'Dice qué pasa, dónde y cuánto. Se puede medir.' },
      { id: 'b', texto: 'Compras es muy lento.', porque: 'Es vago y culpa a un área. No dice cuánto ni desde dónde.' },
      { id: 'c', texto: 'El jefe no firma a tiempo.', porque: 'Culpa a una persona antes de investigar.' },
      { id: 'd', texto: 'Necesitamos un software de compras.', porque: 'Es una solución disfrazada de problema.' },
    ],
  },
  {
    id: 'afectados',
    pregunta: '¿A quién afecta?',
    opciones: [
      { id: 'a', texto: 'A todas las áreas que piden papelería e insumos: el cliente interno.', correcta: true, porque: 'El cliente del proceso es quien espera el producto.' },
      { id: 'b', texto: 'Solo a Compras.', porque: 'Compras lo sufre, pero quien espera es el solicitante.' },
      { id: 'c', texto: 'A los proveedores.', porque: 'Ellos entregan al día siguiente; la demora es interna.' },
    ],
  },
  {
    id: 'inicio',
    pregunta: '¿Dónde empieza el proceso?',
    opciones: [
      { id: 'a', texto: 'Cuando Compras recibe la solicitud.', porque: 'Deja por fuera el formato, el traslado y la firma: justo donde se pierde tiempo.' },
      { id: 'b', texto: 'Cuando alguien detecta que necesita algo.', correcta: true, porque: 'El reloj del cliente empieza cuando nace la necesidad.' },
      { id: 'c', texto: 'Cuando el jefe firma.', porque: 'Se pierden los 2 días de espera antes de la firma.' },
    ],
  },
  {
    id: 'fin',
    pregunta: '¿Dónde termina?',
    opciones: [
      { id: 'a', texto: 'Cuando se emite la orden de compra.', porque: 'Faltan la entrega y la recogida: el cliente aún no tiene nada.' },
      { id: 'b', texto: 'Cuando el proveedor factura.', porque: 'La factura no le sirve al solicitante.' },
      { id: 'c', texto: 'Cuando el solicitante tiene el producto en sus manos.', correcta: true, porque: 'El proceso termina cuando el cliente recibe lo que pidió.' },
    ],
  },
  {
    id: 'indicador',
    pregunta: '¿Qué indicador usarán?',
    opciones: [
      { id: 'a', texto: 'Número de órdenes emitidas al mes.', porque: 'Mide cuánto trabaja Compras, no cuánto espera el cliente.' },
      { id: 'b', texto: 'Días desde la necesidad hasta la entrega, y % de solicitudes devueltas.', correcta: true, porque: 'Mide el tiempo que vive el cliente y la calidad.' },
      { id: 'c', texto: 'Qué tan contento está el jefe de Compras.', porque: 'Es una opinión, no un dato del proceso.' },
    ],
  },
  {
    id: 'meta',
    pregunta: '¿Cuál es una buena meta?',
    opciones: [
      { id: 'a', texto: 'Mejorar lo más posible.', porque: 'No se sabe cuándo se logró.' },
      { id: 'b', texto: 'Cero días desde mañana.', porque: 'Imposible: desanima al equipo.' },
      { id: 'c', texto: 'Bajar de 5 a 2 días y de 18 % a 5 % de devoluciones en 2 meses.', correcta: true, porque: 'Específica, medible, retadora, alcanzable y con fecha.' },
    ],
  },
];

// ----------------------------------------------------------------------------
// Misión 3 — Analizar
// ----------------------------------------------------------------------------

export type TipoRespuesta = 'correcta' | 'superficial' | 'culpa';

export interface NivelPorque {
  pregunta: string;
  opciones: { id: string; texto: string; tipo: TipoRespuesta }[];
}

export const PORQUES: NivelPorque[] = [
  {
    pregunta: '¿Por qué una compra de papelería tarda 5 días?',
    opciones: [
      { id: 'a', texto: 'Porque hay mucho trabajo en la empresa.', tipo: 'superficial' },
      { id: 'b', texto: 'Porque la solicitud espera 2 días la firma del jefe y casi 1 de cada 5 se devuelve.', tipo: 'correcta' },
      { id: 'c', texto: 'Porque el jefe es desorganizado.', tipo: 'culpa' },
    ],
  },
  {
    pregunta: '¿Por qué la solicitud espera la firma del jefe?',
    opciones: [
      { id: 'a', texto: 'Porque toda compra, incluso un lapicero, necesita su firma en papel.', tipo: 'correcta' },
      { id: 'b', texto: 'Porque la gente pide a última hora.', tipo: 'culpa' },
      { id: 'c', texto: 'Porque el jefe viaja mucho.', tipo: 'superficial' },
    ],
  },
  {
    pregunta: '¿Por qué toda compra necesita firma en papel?',
    opciones: [
      { id: 'a', texto: 'Porque el jefe no confía en su equipo.', tipo: 'culpa' },
      { id: 'b', texto: 'Porque así lo exige la ley.', tipo: 'superficial' },
      { id: 'c', texto: 'Porque no hay montos de aprobación: se trata igual una resma que un computador.', tipo: 'correcta' },
    ],
  },
  {
    pregunta: '¿Por qué no hay montos ni datos obligatorios definidos?',
    opciones: [
      { id: 'a', texto: 'Porque las reglas de compra nunca se escribieron: cada quien pide como cree.', tipo: 'correcta' },
      { id: 'b', texto: 'Porque nadie ha tenido tiempo.', tipo: 'superficial' },
      { id: 'c', texto: 'Porque Compras no hace bien su trabajo.', tipo: 'culpa' },
    ],
  },
  {
    pregunta: '¿Por qué las reglas nunca se escribieron?',
    opciones: [
      { id: 'a', texto: 'Porque la gerente anterior era descuidada.', tipo: 'culpa' },
      { id: 'b', texto: 'Porque nunca se definió un flujo estándar de solicitudes, con dueño, montos de aprobación y datos obligatorios.', tipo: 'correcta' },
      { id: 'c', texto: 'Porque la empresa es pequeña.', tipo: 'superficial' },
    ],
  },
];

export const CAUSA_RAIZ = 'Nunca se definió un flujo estándar de solicitudes (con dueño, montos de aprobación y datos obligatorios).';

export const CATEGORIAS_ISHIKAWA = {
  personas: { emoji: '👥', nombre: 'Personas' },
  metodo: { emoji: '📋', nombre: 'Método' },
  tecnologia: { emoji: '💻', nombre: 'Tecnología' },
  materiales: { emoji: '📄', nombre: 'Materiales' },
  medicion: { emoji: '📏', nombre: 'Medición' },
  entorno: { emoji: '🏢', nombre: 'Entorno' },
} as const;
export type CategoriaIshikawa = keyof typeof CATEGORIAS_ISHIKAWA;

export const EFECTO_ISHIKAWA = '18 % de las solicitudes se devuelven por datos incompletos';

export const CAUSAS_ISHIKAWA: { id: string; texto: string; categoria: CategoriaIshikawa }[] = [
  { id: 'c1', texto: 'A las personas nuevas nadie les explica cómo llenar el formato', categoria: 'personas' },
  { id: 'c2', texto: 'En temporada alta rota mucho el personal', categoria: 'personas' },
  { id: 'c3', texto: 'No hay datos obligatorios definidos', categoria: 'metodo' },
  { id: 'c4', texto: 'Cada jefe pide cosas distintas en la solicitud', categoria: 'metodo' },
  { id: 'c5', texto: 'El formato en papel no avisa si falta un dato', categoria: 'tecnologia' },
  { id: 'c6', texto: 'El formato de 3 páginas tiene 34 casillas confusas', categoria: 'materiales' },
  { id: 'c7', texto: 'Nadie cuenta cuántas solicitudes se devuelven ni por qué', categoria: 'medicion' },
  { id: 'c8', texto: 'Se llena de afán, de pie en el pasillo o en la cafetería', categoria: 'entorno' },
];

// ----------------------------------------------------------------------------
// Misión 4 — Mejorar (laboratorio)
// ----------------------------------------------------------------------------

export const RESTRICCIONES = { presupuesto: 500_000, personas: 3, semanas: 1 };
export const MAX_EXPERIMENTOS = 3;

export interface Solucion {
  id: string;
  emoji: string;
  nombre: string;
  detalle: string;
  costo: number;
  personas: number;
  semanas: number;
  /** Días que le quita al proceso y puntos de % de devoluciones que quita. */
  dias: number;
  defectos: number;
  /** Ataca la causa raíz (flujo estándar). */
  raiz: boolean;
  riesgo: string;
}

export const SOLUCIONES: Solucion[] = [
  { id: 'A', emoji: '💻', nombre: 'Comprar un software de compras', detalle: 'Sistema completo con flujos, aprobaciones e integración contable.', costo: 12_000_000, personas: 2, semanas: 12, dias: 2, defectos: 10, raiz: true, riesgo: 'Caro y lento. Si el proceso sigue desordenado, se automatiza el desorden.' },
  { id: 'B', emoji: '✍️', nombre: 'Firma del jefe solo para compras de más de $500.000', detalle: 'Lo pequeño se aprueba solo con presupuesto del área.', costo: 0, personas: 1, semanas: 1, dias: 1.8, defectos: 0, raiz: true, riesgo: 'Necesita reglas claras escritas para que nadie abuse.' },
  { id: 'C', emoji: '📥', nombre: 'Bandeja digital única con datos obligatorios', detalle: 'Formulario en línea gratuito de 9 campos: no deja enviar si falta un dato.', costo: 200_000, personas: 1, semanas: 1, dias: 0.8, defectos: 11, raiz: true, riesgo: 'Hay que enseñar a usarlo el primer día.' },
  { id: 'D', emoji: '🎓', nombre: 'Capacitar a todos en el formato', detalle: 'Taller de una hora para cada área.', costo: 300_000, personas: 1, semanas: 1, dias: 0.2, defectos: 4, raiz: false, riesgo: 'Se olvida con el tiempo y con el personal nuevo.' },
  { id: 'E', emoji: '📚', nombre: 'Catálogo de proveedores y precios preaprobados', detalle: 'Laura negocia precios fijos por 6 meses; ya no se cotiza cada lapicero.', costo: 250_000, personas: 1, semanas: 1, dias: 0.7, defectos: 0, raiz: false, riesgo: 'Hay que actualizarlo cada semestre.' },
  { id: 'F', emoji: '👤', nombre: 'Contratar un auxiliar de compras', detalle: 'Una persona más para mover las solicitudes.', costo: 2_500_000, personas: 0, semanas: 4, dias: 0.5, defectos: 1, raiz: false, riesgo: 'Más gente en un proceso roto solo mueve el desorden más rápido.' },
  { id: 'G', emoji: '🚚', nombre: 'Ruta diaria: entregar en el puesto', detalle: 'El almacén reparte los pedidos una vez al día.', costo: 100_000, personas: 1, semanas: 1, dias: 0.3, defectos: 0, raiz: false, riesgo: 'Si la ruta falla, vuelve la caminata.' },
  { id: 'H', emoji: '🗑️', nombre: 'Dejar de imprimir las 3 copias', detalle: 'Archivo digital en una carpeta compartida.', costo: 0, personas: 0, semanas: 1, dias: 0.1, defectos: 0, raiz: false, riesgo: 'Ninguno: es una victoria rápida.' },
];

export interface Simulacion {
  costo: number;
  personas: number;
  semanas: number;
  dias: number;
  defectos: number;
  violaciones: string[];
  valido: boolean;
  atacaRaiz: boolean;
}

export function simular(ids: string[]): Simulacion {
  const elegidas = SOLUCIONES.filter((s) => ids.includes(s.id));
  const costo = elegidas.reduce((a, s) => a + s.costo, 0);
  const personas = elegidas.reduce((a, s) => a + s.personas, 0);
  const semanas = elegidas.reduce((a, s) => Math.max(a, s.semanas), 0);
  const dias = Math.max(1, Math.round((CASO.diasBase - elegidas.reduce((a, s) => a + s.dias, 0)) * 10) / 10);
  const defectos = Math.max(2, CASO.defectosBase - elegidas.reduce((a, s) => a + s.defectos, 0));
  const violaciones: string[] = [];
  if (costo > RESTRICCIONES.presupuesto) violaciones.push(`Cuesta ${pesosMl(costo)} y el presupuesto es ${pesosMl(RESTRICCIONES.presupuesto)}.`);
  if (personas > RESTRICCIONES.personas) violaciones.push(`Necesita ${personas} personas y solo hay ${RESTRICCIONES.personas}.`);
  if (semanas > RESTRICCIONES.semanas) violaciones.push(`Toma ${semanas} semanas y solo hay ${RESTRICCIONES.semanas}.`);
  return { costo, personas, semanas, dias, defectos, violaciones, valido: elegidas.length > 0 && violaciones.length === 0, atacaRaiz: elegidas.some((s) => s.raiz) };
}

export function pesosMl(v: number) {
  return `$${Math.round(v).toLocaleString('es-CO')}`;
}

/** Días con coma decimal: 5,1 días. */
export function diasTexto(d: number) {
  return `${d.toLocaleString('es-CO', { maximumFractionDigits: 1 })} ${d === 1 ? 'día' : 'días'}`;
}

// ----------------------------------------------------------------------------
// Misión 5 — Controlar
// ----------------------------------------------------------------------------

export const MECANISMOS = [
  { id: 'estandar', emoji: '📋', nombre: 'Estándar de una página', detalle: 'El flujo nuevo, los montos y los 9 datos, pegado junto a cada impresora y en la bandeja digital.', puntos: 30 },
  { id: 'indicador', emoji: '📈', nombre: 'Indicador semanal', detalle: 'Días promedio y % devueltas, medido cada lunes.', puntos: 25 },
  { id: 'tablero', emoji: '🗂️', nombre: 'Tablero visual en la oficina', detalle: 'Las solicitudes de la semana en verde, amarillo o rojo.', puntos: 20 },
  { id: 'capacitacion', emoji: '🎓', nombre: 'Inducción para personas nuevas', detalle: '15 minutos el primer día sobre cómo pedir.', puntos: 15 },
  { id: 'alerta', emoji: '🔔', nombre: 'Alerta automática', detalle: 'Aviso si una solicitud lleva más de 24 horas quieta. Solo funciona si hay un sistema digital.', puntos: 20 },
  { id: 'auditoria', emoji: '🔍', nombre: 'Auditoría mensual', detalle: 'Revisar 10 solicitudes al azar contra el estándar.', puntos: 15 },
  { id: 'compromiso', emoji: '🙏', nombre: 'Pedir a todos que se comprometan', detalle: 'Un correo de la gerencia pidiendo cumplir.', puntos: 0 },
] as const;
export type ClaveMecanismo = (typeof MECANISMOS)[number]['id'];
export const MAX_MECANISMOS = 3;

export function sostenibilidad(ids: string[], planM4: string[]) {
  const digital = planM4.includes('C') || planM4.includes('A');
  let s = 10;
  const notas: string[] = [];
  for (const m of MECANISMOS) {
    if (!ids.includes(m.id)) continue;
    if (m.id === 'alerta' && !digital) {
      notas.push('🔔 La alerta no funcionó: su plan no tiene un sistema digital donde ponerla.');
      continue;
    }
    if (m.id === 'compromiso') notas.push('🙏 El compromiso sin mecanismo duró dos semanas.');
    s += m.puntos;
  }
  const tiene = (id: string) => ids.includes(id) && (id !== 'alerta' || digital);
  const sistema = tiene('estandar') && (tiene('indicador') || tiene('tablero')) && (tiene('capacitacion') || tiene('auditoria') || tiene('alerta'));
  if (sistema) {
    s += 10;
    notas.push('⭐ Sistema completo: estándar + medición + un mecanismo que avisa o refuerza.');
  }
  if (!tiene('estandar')) notas.push('📋 Sin estándar escrito, cada persona nueva vuelve a pedir «como cree».');
  return { porcentaje: Math.min(100, s), notas };
}

/** Días de la semana 0 a 12 después de la mejora, según la sostenibilidad. */
export function derivaSemanas(diasMejorados: number, sost: number) {
  const perdida = (CASO.diasBase - diasMejorados) * (1 - sost / 100);
  return Array.from({ length: 13 }, (_, w) => Math.round((diasMejorados + perdida * (w / 12)) * 10) / 10);
}

// ----------------------------------------------------------------------------
// Puntaje (servidor)
// ----------------------------------------------------------------------------

export const PUNTOS = {
  definir: 20,
  detectar: 15,
  evidencia: 5,
  tipo: 15,
  falsoPositivo: -10,
  cuello: 50,
  eficiencia: 50,
  porque: 20,
  raiz: 70,
  culpa: -20,
  ishikawa: 10,
  proponerRaiz: 150,
  proponer: 75,
  indicador: 300,
  defectos: 300,
  experimentar: 50,
  sostener: 400,
  oportunidad: 100,
  maxOportunidades: 3,
  voto: 10,
  maxVotos: 100,
};

export const COLABORACION_ML = { porPersona: 15, max: 60 };

export interface ResultadoMl {
  puntos: number;
  aciertos: number;
  errores: number;
  detalle: string[];
  /** Datos para el tablero y la escalera de madurez. */
  resumen: ResumenMl;
}

export interface ResumenMl {
  mudasDetectadas?: number;
  mudasClasificadas?: number;
  tiposEncontrados?: ClaveMuda[];
  cuello?: boolean;
  eficiencia?: boolean;
  raiz?: boolean;
  culpas?: number;
  plan?: string[];
  dias?: number;
  defectos?: number;
  valido?: boolean;
  atacaRaiz?: boolean;
  experimentos?: number;
  sostenibilidad?: number;
  mecanismos?: string[];
}

const obj = (v: unknown): Record<string, any> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : {});
const lista = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/**
 * Calcula los puntos de una misión. `planM4` es el plan entregado en la
 * misión 4 (lo usa la misión 5).
 */
export function puntuar(numero: number, respuestas: unknown, planM4: string[] = [], diasM4: number | null = null): ResultadoMl {
  const r = obj(respuestas);
  let puntos = 0;
  let aciertos = 0;
  let errores = 0;
  const detalle: string[] = [];
  const resumen: ResumenMl = {};

  if (numero === 1) {
    for (const p of DEFINIR) {
      const elegida = p.opciones.find((o) => o.id === r[p.id]);
      if (elegida?.correcta) {
        puntos += PUNTOS.definir;
        aciertos++;
      } else errores++;
    }
    detalle.push(`${aciertos} de ${DEFINIR.length} definiciones correctas`);
  }

  if (numero === 2) {
    const marcas = obj(r.marcas); // pasoId -> muda
    // Las fichas son limitadas: no se cuentan más observaciones de las que alcanzan.
    const observados = new Set(lista(r.observados).slice(0, FICHAS_GEMBA - (r.datos ? 1 : 0)));
    let detectadas = 0;
    let clasificadas = 0;
    const tipos = new Set<ClaveMuda>();
    for (const paso of PASOS) {
      const marca = marcas[paso.id] as string | undefined;
      if (!marca) continue;
      if (!paso.muda) {
        puntos += PUNTOS.falsoPositivo;
        errores++;
        continue;
      }
      detectadas++;
      aciertos++;
      puntos += PUNTOS.detectar + (observados.has(paso.id) ? PUNTOS.evidencia : 0);
      if (marca === paso.muda) {
        clasificadas++;
        tipos.add(paso.muda);
        puntos += PUNTOS.tipo;
      } else errores++;
    }
    const cuello = r.cuello === 'p4';
    const eficiencia = OPCIONES_EFICIENCIA.find((o) => o.id === r.eficiencia)?.correcta === true;
    if (cuello) puntos += PUNTOS.cuello;
    else errores++;
    if (eficiencia) puntos += PUNTOS.eficiencia;
    else errores++;
    detalle.push(`${detectadas} de 8 Mudas encontradas`, `${clasificadas} bien clasificadas`, cuello ? 'cuello de botella ✓' : 'cuello de botella ✗', eficiencia ? 'eficiencia ✓' : 'eficiencia ✗');
    Object.assign(resumen, { mudasDetectadas: detectadas, mudasClasificadas: clasificadas, tiposEncontrados: [...tipos], cuello, eficiencia });
  }

  if (numero === 3) {
    // elecciones[i] = opciones que el equipo tocó en el nivel i, en orden (puede reintentar).
    const elecciones = (Array.isArray(r.elecciones) ? r.elecciones : []).map(lista);
    let culpas = 0;
    let cadena = 0;
    let alPrimer = 0;
    PORQUES.forEach((nivel, i) => {
      const picks = (elecciones[i] ?? []).map((id) => nivel.opciones.find((x) => x.id === id)).filter(Boolean);
      culpas += picks.filter((o) => o!.tipo === 'culpa').length;
      if (cadena === i && picks.some((o) => o!.tipo === 'correcta')) {
        cadena++;
        if (picks[0]!.tipo === 'correcta') {
          alPrimer++;
          puntos += i === PORQUES.length - 1 ? PUNTOS.raiz : PUNTOS.porque;
        } else if (i === PORQUES.length - 1) puntos += Math.round(PUNTOS.raiz / 2);
      }
    });
    const raiz = cadena === PORQUES.length;
    puntos += culpas * PUNTOS.culpa;
    if (raiz) detalle.push(`${alPrimer} de 5 porqués al primer intento`);
    const ish = obj(r.ishikawa);
    let bien = 0;
    for (const c of CAUSAS_ISHIKAWA) if (ish[c.id] === c.categoria) bien++;
    puntos += bien * PUNTOS.ishikawa;
    aciertos = cadena + bien;
    errores = culpas + (CAUSAS_ISHIKAWA.length - bien);
    detalle.push(raiz ? '🔓 causa raíz encontrada' : `llegaron al porqué ${cadena} de 5`, `${bien} de ${CAUSAS_ISHIKAWA.length} causas bien ubicadas`);
    if (culpas) detalle.push(`${culpas} ${culpas === 1 ? 'vez culparon' : 'veces culparon'} a una persona`);
    Object.assign(resumen, { raiz, culpas });
  }

  if (numero === 4) {
    const experimentos = (Array.isArray(r.experimentos) ? r.experimentos : []).slice(0, MAX_EXPERIMENTOS).map(lista);
    const plan = lista(r.plan).filter((id) => SOLUCIONES.some((s) => s.id === id));
    const sim = simular(plan);
    if (sim.valido) {
      const proponer = sim.atacaRaiz && plan.includes('C') ? PUNTOS.proponerRaiz : sim.atacaRaiz ? Math.round((PUNTOS.proponerRaiz + PUNTOS.proponer) / 2) : PUNTOS.proponer;
      const avanceDias = Math.max(0, Math.min(1, (CASO.diasBase - sim.dias) / (CASO.diasBase - CASO.metaDias)));
      const avanceDef = Math.max(0, Math.min(1, (CASO.defectosBase - sim.defectos) / (CASO.defectosBase - CASO.metaDefectos)));
      puntos += proponer + Math.round(PUNTOS.indicador * avanceDias) + Math.round(PUNTOS.defectos * avanceDef);
      aciertos = plan.length;
      detalle.push(`${diasTexto(CASO.diasBase)} → ${diasTexto(sim.dias)}`, `devoluciones ${CASO.defectosBase} % → ${sim.defectos} %`);
    } else {
      errores = Math.max(1, sim.violaciones.length);
      detalle.push('🚫 El comité no aprobó el plan: ' + (sim.violaciones.join(' ') || 'no eligieron ninguna solución.'));
    }
    if (experimentos.length >= 2) {
      puntos += PUNTOS.experimentar;
      detalle.push(`${experimentos.length} experimentos`);
    }
    Object.assign(resumen, { plan, dias: sim.dias, defectos: sim.defectos, valido: sim.valido, atacaRaiz: sim.atacaRaiz, experimentos: experimentos.length });
  }

  if (numero === 5) {
    const mecanismos = lista(r.mecanismos).filter((id) => MECANISMOS.some((m) => m.id === id)).slice(0, MAX_MECANISMOS);
    const { porcentaje, notas } = sostenibilidad(mecanismos, planM4);
    puntos += Math.round((PUNTOS.sostener * porcentaje) / 100);
    aciertos = mecanismos.length;
    const semanas = derivaSemanas(diasM4 ?? CASO.diasBase, porcentaje);
    detalle.push(`sostenibilidad ${porcentaje} %`, `semana 12: ${diasTexto(semanas[12]!)}`, ...notas);
    Object.assign(resumen, { sostenibilidad: porcentaje, mecanismos });
  }

  return { puntos: Math.max(0, puntos), aciertos, errores, detalle, resumen };
}

/** Puntaje máximo de cada misión (para mostrar «x de y»). */
export const MAXIMOS: Record<number, number> = {
  1: DEFINIR.length * PUNTOS.definir,
  2: 8 * (PUNTOS.detectar + PUNTOS.evidencia + PUNTOS.tipo) + PUNTOS.cuello + PUNTOS.eficiencia,
  3: (PORQUES.length - 1) * PUNTOS.porque + PUNTOS.raiz + CAUSAS_ISHIKAWA.length * PUNTOS.ishikawa,
  4: PUNTOS.proponerRaiz + PUNTOS.indicador + PUNTOS.defectos + PUNTOS.experimentar,
  5: PUNTOS.sostener,
};

// ----------------------------------------------------------------------------
// Mundo 2 — Banco de oportunidades
// ----------------------------------------------------------------------------

export const ESTADOS_OPORTUNIDAD = {
  idea: { emoji: '💡', nombre: 'Idea' },
  probando: { emoji: '🧪', nombre: 'Probando' },
  implementada: { emoji: '✅', nombre: 'Implementada' },
} as const;
export type EstadoOportunidad = keyof typeof ESTADOS_OPORTUNIDAD;

export interface OportunidadMinima {
  id: string;
  equipo_id: string;
  jugador_id: string | null;
  proceso: string;
  problema: string;
  muda: ClaveMuda;
  evidencia: string | null;
  causa: string | null;
  idea: string | null;
  estado: EstadoOportunidad;
  resultado: string | null;
  minutos_semana: number | null;
  votos: string[];
  created_at: string;
}

// ----------------------------------------------------------------------------
// Tablero, madurez e insignias
// ----------------------------------------------------------------------------

export interface IntentoMl {
  equipo_id: string;
  mision: number;
  jugador_id: string | null;
  inicio: string;
  fin: string | null;
  aciertos: number;
  errores: number;
  puntos: number;
  resumen: ResumenMl | null;
}

export const NIVELES_MADUREZ = [
  { nivel: 1, emoji: '👀', nombre: 'La vio', ayuda: 'Encontró al menos una Muda en el Gemba.' },
  { nivel: 2, emoji: '🏷️', nombre: 'La clasificó', ayuda: 'Clasificó bien 5 o más Mudas.' },
  { nivel: 3, emoji: '📏', nombre: 'La midió', ayuda: 'Encontró el cuello de botella y la eficiencia real.' },
  { nivel: 4, emoji: '🔓', nombre: 'Encontró la causa', ayuda: 'Llegó a la causa raíz con los 5 porqués.' },
  { nivel: 5, emoji: '💡', nombre: 'Propuso', ayuda: 'Su plan aprobado ataca la causa raíz.' },
  { nivel: 6, emoji: '🧪', nombre: 'Experimentó', ayuda: 'Probó 2 o más experimentos antes de decidir.' },
  { nivel: 7, emoji: '📉', nombre: 'Demostró', ayuda: 'Llegó a 2,5 días o menos y 10 % o menos de devoluciones.' },
  { nivel: 8, emoji: '🛡️', nombre: 'La sostuvo', ayuda: 'Sostenibilidad del 80 % o más.' },
] as const;

export const INSIGNIAS = {
  detective: { emoji: '🕵️', nombre: 'Detective', ayuda: 'Clasificó bien las 8 Mudas' },
  rompecausas: { emoji: '🔓', nombre: 'Rompecausas', ayuda: 'Causa raíz sin culpar a nadie' },
  ahorrador: { emoji: '💰', nombre: 'Ahorrador', ayuda: 'Llegó a la meta de días gastando $300.000 o menos' },
  guardian: { emoji: '🛡️', nombre: 'Guardián', ayuda: 'Sostenibilidad del 90 % o más' },
  cazador: { emoji: '🏹', nombre: 'Cazador real', ayuda: '3 o más Mudas reales en el Banco' },
} as const;
export type ClaveInsignia = keyof typeof INSIGNIAS;

export interface MarcadorMl {
  equipoId: string;
  porMision: Record<number, IntentoMl | undefined>;
  puntosMisiones: number;
  colaboracion: number;
  participantes: number;
  puntosBanco: number;
  oportunidades: number;
  votos: number;
  total: number;
  madurez: boolean[];
  nivel: number;
  insignias: ClaveInsignia[];
  mudas: number;
  dias: number | null;
  defectos: number | null;
  sostenibilidad: number | null;
}

export function marcadorMl(equipoId: string, intentos: IntentoMl[], oportunidades: OportunidadMinima[]): MarcadorMl {
  const suyos = intentos.filter((i) => i.equipo_id === equipoId && i.fin);
  const porMision: Record<number, IntentoMl | undefined> = {};
  for (const i of suyos) porMision[i.mision] = i;
  const participantes = new Set(suyos.map((i) => i.jugador_id).filter(Boolean)).size;
  const colaboracion = participantes > 1 ? Math.min(COLABORACION_ML.max, (participantes - 1) * COLABORACION_ML.porPersona) : 0;
  const puntosMisiones = suyos.reduce((s, i) => s + i.puntos, 0);

  const ops = oportunidades.filter((o) => o.equipo_id === equipoId);
  const votos = ops.reduce((s, o) => s + (o.votos?.length ?? 0), 0);
  const puntosBanco = Math.min(PUNTOS.maxOportunidades, ops.length) * PUNTOS.oportunidad + Math.min(PUNTOS.maxVotos, votos * PUNTOS.voto);

  const m2 = porMision[2]?.resumen ?? {};
  const m3 = porMision[3]?.resumen ?? {};
  const m4 = porMision[4]?.resumen ?? {};
  const m5 = porMision[5]?.resumen ?? {};
  const madurez = [
    (m2.mudasDetectadas ?? 0) >= 1,
    (m2.mudasClasificadas ?? 0) >= 5,
    Boolean(m2.cuello && m2.eficiencia),
    Boolean(m3.raiz),
    Boolean(m4.valido && m4.atacaRaiz),
    (m4.experimentos ?? 0) >= 2,
    Boolean(m4.valido && (m4.dias ?? 99) <= 2.5 && (m4.defectos ?? 99) <= 10),
    (m5.sostenibilidad ?? 0) >= 80,
  ];
  const insignias: ClaveInsignia[] = [];
  if ((m2.mudasClasificadas ?? 0) >= 8) insignias.push('detective');
  if (m3.raiz && !m3.culpas) insignias.push('rompecausas');
  if (m4.valido && (m4.dias ?? 99) <= CASO.metaDias && simular(m4.plan ?? []).costo <= 300_000) insignias.push('ahorrador');
  if ((m5.sostenibilidad ?? 0) >= 90) insignias.push('guardian');
  if (ops.length >= 3) insignias.push('cazador');

  return {
    equipoId,
    porMision,
    puntosMisiones,
    colaboracion,
    participantes,
    puntosBanco,
    oportunidades: ops.length,
    votos,
    total: puntosMisiones + colaboracion + puntosBanco,
    madurez,
    nivel: madurez.filter(Boolean).length,
    insignias,
    mudas: m2.mudasClasificadas ?? 0,
    dias: m4.valido ? (m4.dias ?? null) : null,
    defectos: m4.valido ? (m4.defectos ?? null) : null,
    sostenibilidad: m5.sostenibilidad ?? null,
  };
}

// ----------------------------------------------------------------------------
// Opciones de mejora del informe
// ----------------------------------------------------------------------------

export interface RecomendacionMl {
  ref: string;
  prioridad: 'alta' | 'media' | 'baja';
  titulo: string;
  detalle: string;
  herramienta?: string;
}

export function recomendacionesMl(equipos: { id: string; nombre: string; emoji: string }[], intentos: IntentoMl[], oportunidades: OportunidadMinima[]): RecomendacionMl[] {
  const r: RecomendacionMl[] = [];
  const fin = (n: number) => intentos.filter((i) => i.mision === n && i.fin);

  // Mudas que más se escaparon en el Gemba.
  const m2 = fin(2);
  if (m2.length) {
    const vistas = new Map<ClaveMuda, number>();
    for (const i of m2) for (const t of i.resumen?.tiposEncontrados ?? []) vistas.set(t, (vistas.get(t) ?? 0) + 1);
    const escapadas = CLAVES_MUDA.filter((k) => (vistas.get(k) ?? 0) / m2.length < 0.5);
    if (escapadas.length) {
      r.push({
        ref: 'ml-mudas-ocultas',
        prioridad: escapadas.length >= 3 ? 'alta' : 'media',
        titulo: `Entrenar la mirada en las Mudas que más se escapan: ${escapadas.map((k) => `${MUDAS[k].emoji} ${MUDAS[k].nombre}`).join(', ')}`,
        detalle: 'Menos de la mitad de los equipos las reconoció en el Gemba. Hagan una caminata corta al proceso real buscando solo esas Mudas, con una lista de chequeo.',
        herramienta: 'Caminata Gemba con lista de las 8 Mudas',
      });
    }
  }

  // Culpar a personas.
  const culpas = fin(3).reduce((s, i) => s + (i.resumen?.culpas ?? 0), 0);
  if (culpas > 0) {
    r.push({
      ref: 'ml-culpa',
      prioridad: 'alta',
      titulo: `En el análisis se culpó a personas ${culpas} ${culpas === 1 ? 'vez' : 'veces'}`,
      detalle: 'Cuando la respuesta es «alguien es desordenado», el análisis se detiene y la causa sigue viva. Acuerden como regla del equipo: se pregunta por el proceso, no por la persona.',
      herramienta: '5 porqués sin culpables',
    });
  }

  // Soluciones caras o que no caben.
  const m4 = fin(4);
  const invalidos = m4.filter((i) => !i.resumen?.valido);
  const costosas = m4.filter((i) => (i.resumen?.plan ?? []).some((id) => id === 'A' || id === 'F'));
  if (invalidos.length || costosas.length) {
    r.push({
      ref: 'ml-soluciones-caras',
      prioridad: 'media',
      titulo: 'Probar primero soluciones baratas y rápidas antes de comprar software o contratar',
      detalle: `${costosas.length} ${costosas.length === 1 ? 'equipo eligió' : 'equipos eligieron'} software o más personal y ${invalidos.length} ${invalidos.length === 1 ? 'plan fue rechazado' : 'planes fueron rechazados'} por presupuesto o tiempo. Primero se estandariza y se experimenta; después se automatiza.`,
      herramienta: 'Ciclo PDCA con experimentos pequeños',
    });
  }

  // Sostenibilidad.
  const m5 = fin(5);
  if (m5.length) {
    const prom = m5.reduce((s, i) => s + (i.resumen?.sostenibilidad ?? 0), 0) / m5.length;
    const sinEstandar = m5.filter((i) => !(i.resumen?.mecanismos ?? []).includes('estandar')).length;
    if (prom < 80 || sinEstandar) {
      r.push({
        ref: 'ml-sostener',
        prioridad: prom < 60 ? 'alta' : 'media',
        titulo: `Diseñar el sistema de control desde el principio (sostenibilidad promedio ${Math.round(prom)} %)`,
        detalle: 'Toda mejora necesita estándar escrito, indicador visible y un mecanismo que avise cuando se devuelve. Sin eso, la Muda regresa en semanas.',
        herramienta: 'Estándar de una página + indicador semanal',
      });
    }
  }

  // Oportunidades reales más votadas.
  const top = [...oportunidades].sort((a, b) => (b.votos?.length ?? 0) - (a.votos?.length ?? 0)).slice(0, 3);
  for (const o of top) {
    const e = equipos.find((x) => x.id === o.equipo_id);
    r.push({
      ref: `ml-op-${o.id}`,
      prioridad: (o.votos?.length ?? 0) >= 3 ? 'alta' : 'media',
      titulo: `${MUDAS[o.muda].emoji} ${o.proceso}: ${o.problema}`.slice(0, 190),
      detalle: [o.causa && `Causa: ${o.causa}.`, o.idea && `Idea: ${o.idea}.`, `Propuesta de ${e ? `${e.emoji} ${e.nombre}` : 'un equipo'} con ${o.votos?.length ?? 0} 👍.`].filter(Boolean).join(' '),
      herramienta: `Muda de ${MUDAS[o.muda].nombre}`,
    });
  }

  if (!oportunidades.length) {
    r.push({
      ref: 'ml-sin-banco',
      prioridad: 'alta',
      titulo: 'Llenar el Banco de oportunidades con Mudas reales',
      detalle: 'Nadie registró todavía una Muda de su propio trabajo. Sin el Mundo 2, el aprendizaje se queda en el juego: pidan al menos una por persona esta semana.',
    });
  }

  r.push({
    ref: 'ml-dmaic',
    prioridad: 'baja',
    titulo: 'Elegir una oportunidad del Banco y llevarla por las 5 fases (Definir, Medir, Analizar, Mejorar, Controlar)',
    detalle: 'Midan la línea base en el Control de procesos, hagan un experimento pequeño y registren el resultado antes de ampliarlo.',
    herramienta: 'DMAIC y Control de procesos',
  });

  const orden = { alta: 0, media: 1, baja: 2 };
  return r.sort((a, b) => orden[a.prioridad] - orden[b.prioridad]);
}
