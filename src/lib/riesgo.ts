/**
 * LA RUTA DEL RIESGO — Un juego para aprender a detectar, prevenir y reportar
 * riesgos de LA/FT (lavado de activos y financiación del terrorismo), con la
 * lógica común de SAGRILAFT y SARLAFT.
 *
 * Una empresa inventada está creciendo: clientes, proveedores, socios y
 * operaciones nuevas. El equipo debe hacerla crecer sin dejar entrar
 * relaciones u operaciones riesgosas. No se memorizan normas: se reconocen
 * señales, se hacen buenas preguntas y se activa la ruta correcta.
 *
 * 8 retos: 1 ¿Detectas la señal? · 2 Conoce a tu contraparte · 3 Beneficiario
 * final · 4 Sigue el dinero · 5 Clasifica el riesgo (semáforo) · 6 ¿Qué harías?
 * (cartas de evento) · 7 Escala correctamente · 8 Caso final.
 *
 * El contenido y el puntaje viven aquí. El puntaje se calcula SIEMPRE en el
 * servidor con `puntuar` (el navegador solo lo muestra). Los textos con
 * {responsable} y {canal} se completan con la ruta que configuró la empresa.
 */

// ----------------------------------------------------------------------------
// Configuración de la ruta de cada empresa
// ----------------------------------------------------------------------------

export const MARCOS = {
  sagrilaft: { nombre: 'SAGRILAFT', detalle: 'Empresas del sector real vigiladas por la Superintendencia de Sociedades.' },
  sarlaft: { nombre: 'SARLAFT', detalle: 'Entidades vigiladas por la Superintendencia Financiera y otros supervisores.' },
  ambos: { nombre: 'SAGRILAFT y SARLAFT', detalle: 'Grupos o equipos que trabajan con los dos sistemas.' },
} as const;
export type Marco = keyof typeof MARCOS;

export interface ConfigRuta {
  marco: Marco;
  /** A quién se escala (ej. «Oficial de Cumplimiento»). */
  responsable: string;
  /** Por dónde se escala (ej. «el formato de operación inusual»). */
  canal: string;
  /** % mínimo en cada competencia para certificar. */
  umbral: number;
}

export const CONFIG_BASE: ConfigRuta = {
  marco: 'sagrilaft',
  responsable: 'Oficial de Cumplimiento',
  canal: 'el canal interno de reporte de operaciones inusuales',
  umbral: 70,
};

/** Completa {responsable} y {canal} con la ruta de la empresa. */
export function conRuta(texto: string, c: Pick<ConfigRuta, 'responsable' | 'canal'>) {
  return texto.replaceAll('{responsable}', c.responsable || CONFIG_BASE.responsable).replaceAll('{canal}', c.canal || CONFIG_BASE.canal);
}

// ----------------------------------------------------------------------------
// La historia, las competencias y el tablero de la ruta
// ----------------------------------------------------------------------------

export const EMPRESA = {
  nombre: 'Textiles Horizonte S.A.S.',
  nota: 'empresa inventada',
  historia:
    'Textiles Horizonte está creciendo rápido: tiene clientes nuevos, proveedores nuevos, contratos, compras, operaciones internacionales, nuevos socios e intermediarios. El reto del equipo es hacerla crecer sin dejar entrar operaciones o relaciones que puedan servir para lavar activos o financiar el terrorismo.',
  lema: '«La empresa está creciendo. Pero no todo lo que parece una oportunidad es una buena oportunidad.»',
};

export const COMPETENCIAS = {
  detectar: { emoji: '🔎', nombre: 'Detectar señales', ayuda: 'Reconocer qué llama la atención en una operación.' },
  conocer: { emoji: '🪪', nombre: 'Conocer a la contraparte', ayuda: 'Pedir la información pertinente y encontrar al beneficiario final.' },
  analizar: { emoji: '🚦', nombre: 'Analizar y clasificar', ayuda: 'Clasificar el riesgo y argumentar la decisión.' },
  trazar: { emoji: '💸', nombre: 'Seguir el dinero', ayuda: 'Reconstruir quién entrega, quién recibe y por qué.' },
  actuar: { emoji: '📣', nombre: 'Escalar y proteger', ayuda: 'Activar la ruta correcta, documentar y cuidar la información.' },
} as const;
export type Competencia = keyof typeof COMPETENCIAS;
export const CLAVES_COMPETENCIA = Object.keys(COMPETENCIAS) as Competencia[];

/** Tipos de señal de alerta (para ver cuáles cuestan más). */
export const SENALES = {
  perfil: { emoji: '📐', nombre: 'No corresponde al perfil (monto, actividad o capital)' },
  reciente: { emoji: '🆕', nombre: 'Empresa recién creada o con poca información' },
  tercero: { emoji: '🔀', nombre: 'Pagos de o para terceros sin relación' },
  efectivo: { emoji: '💵', nombre: 'Efectivo y fraccionamiento' },
  exterior: { emoji: '🌎', nombre: 'Cuentas o países sin razón comercial' },
  documentos: { emoji: '📄', nombre: 'Documentos incompletos o inconsistentes' },
  precio: { emoji: '🏷️', nombre: 'Precios o condiciones fuera de mercado' },
  urgencia: { emoji: '⏰', nombre: 'Presión o urgencia para saltarse controles' },
  listas: { emoji: '🚫', nombre: 'Listas restrictivas o personas expuestas (PEP)' },
  beneficiario: { emoji: '👤', nombre: 'Beneficiario final oculto o incompleto' },
} as const;
export type TipoSenal = keyof typeof SENALES;

export interface RetoRr {
  numero: number;
  emoji: string;
  titulo: string;
  competencia: Competencia | 'todas';
  historia: string;
  reto: string;
  segundos: number;
  revelacion: string;
  /** Lo que se aprende (se muestra después de decidir). */
  aprendizaje: string;
  /** El concepto que se conecta con la experiencia (al final, no al principio). */
  concepto: string;
}

export const RETOS: RetoRr[] = [
  {
    numero: 1,
    emoji: '🔎',
    titulo: '¿Detectas la señal?',
    competencia: 'detectar',
    historia: 'Llegan cuatro situaciones a Textiles Horizonte. Algunas esconden señales de alerta; otra es completamente normal.',
    reto: 'Toquen lo que les llama la atención en cada situación. Si no hay nada extraño, díganlo.',
    segundos: 6 * 60,
    revelacion: '🔎 ¡Ojo entrenado!',
    aprendizaje: 'Una señal sola no prueba nada, pero la combinación de varias señales sí pide detenerse. Y no todo es alerta: un cambio con explicación coherente es normal.',
    concepto: 'Señal de alerta: un hecho o comportamiento que no encaja con lo que se sabe de la contraparte o de la operación. No es una acusación: es una razón para mirar mejor.',
  },
  {
    numero: 2,
    emoji: '🪪',
    titulo: 'Conoce a tu contraparte',
    competencia: 'conocer',
    historia: 'Comercializadora XYZ quiere comprar $800 millones en telas. Es su primera compra. Tienen 5 fichas de consulta para pedir información antes de decidir.',
    reto: 'Elijan qué información pedir (cada consulta gasta una ficha) y decidan qué hacer con lo que encontraron.',
    segundos: 7 * 60,
    revelacion: '🪪 ¡Contraparte conocida!',
    aprendizaje: 'Conocer a la contraparte es comprenderla, no solo pedir una cédula: quién es, de dónde viene su dinero, quién está detrás y si la operación tiene sentido.',
    concepto: 'Debida diligencia: el conjunto de pasos para conocer a clientes, proveedores, socios y empleados antes de vincularlos y mientras dure la relación. Es más profunda (intensificada) cuando el riesgo es mayor.',
  },
  {
    numero: 3,
    emoji: '👤',
    titulo: 'Encuentra al beneficiario final',
    competencia: 'conocer',
    historia: 'El formulario de Comercializadora XYZ dice «dueño: Inversiones del Istmo Corp.». Pero una empresa no es una persona. ¿Quién está realmente detrás?',
    reto: 'Recorran la estructura de propiedad, multipliquen los porcentajes y marquen a las personas que son beneficiarias finales.',
    segundos: 6 * 60,
    revelacion: '👤 ¡Beneficiarios encontrados!',
    aprendizaje: 'Detrás de toda empresa hay personas naturales. El beneficiario final es quien realmente es dueño o controla, aunque su nombre no aparezca en el primer papel.',
    concepto:
      'Beneficiario final: la persona natural que finalmente posee o controla a la contraparte, o en cuyo nombre se hace la operación. Como referencia, se mira a quien tiene el 5 % o más del capital o de los votos, o a quien controla por otros medios (confirmen el criterio de su procedimiento).',
  },
  {
    numero: 4,
    emoji: '💸',
    titulo: 'Sigue el dinero',
    competencia: 'trazar',
    historia: 'Se hizo la venta a Confecciones Delta. El dinero se representa como fichas: cada ficha es un movimiento. Algunas cuentan una historia que no cuadra.',
    reto: 'Armen el recorrido del dinero con las fichas, marquen los movimientos que no cuadran y respondan quién entrega, quién recibe y por qué.',
    segundos: 7 * 60,
    revelacion: '💸 ¡Recorrido reconstruido!',
    aprendizaje: 'Seguir el dinero es preguntar en cada paso: ¿quién entrega?, ¿quién recibe?, ¿por qué?, ¿para qué? Cuando un pago pasa por terceros sin razón, la trazabilidad se rompe.',
    concepto: 'Trazabilidad: poder reconstruir el origen y el destino de los recursos. Los terceros sin relación, los giros inmediatos al exterior y las devoluciones a otras cuentas rompen la trazabilidad.',
  },
  {
    numero: 5,
    emoji: '🚦',
    titulo: 'Clasifica el riesgo',
    competencia: 'analizar',
    historia: 'Seis operaciones esperan en la bandeja. El semáforo ayuda a decidir: 🟢 sin señales relevantes, 🟡 señales que requieren análisis, 🔴 elementos que exigen escalar o aplicar el procedimiento.',
    reto: 'Pongan un color a cada operación y elijan la razón que lo justifica. La razón vale más que el color.',
    segundos: 7 * 60,
    revelacion: '🚦 ¡Semáforo calibrado!',
    aprendizaje: 'La puntuación no depende solo del color: se evalúa la calidad del razonamiento. «Es mucha plata» es una respuesta automática; explicar qué no encaja es un análisis.',
    concepto: 'Segmentación y matriz de riesgo: la empresa clasifica contrapartes y operaciones por su nivel de riesgo para aplicarles controles proporcionales.',
  },
  {
    numero: 6,
    emoji: '🃏',
    titulo: '¿Qué harías?',
    competencia: 'actuar',
    historia: 'Las cartas de evento traen presión, incertidumbre y situaciones del día a día. Nadie avisa que es un caso de LA/FT: simplemente pasa.',
    reto: 'Lean cada carta, decidan qué harían y lean la explicación antes de pasar a la siguiente.',
    segundos: 7 * 60,
    revelacion: '🃏 ¡Dilemas resueltos!',
    aprendizaje: 'La presión, la confianza personal y la urgencia son justo los momentos en que más se necesita el procedimiento.',
    concepto: 'Reserva de la información: lo que se analiza o se reporta no se comenta con la contraparte ni con personas que no lo necesitan. Avisarle al cliente que está siendo analizado puede dañar el proceso y es una falta grave.',
  },
  {
    numero: 7,
    emoji: '📣',
    titulo: 'Escala correctamente',
    competencia: 'actuar',
    historia: 'Llegan noticias nuevas sobre operaciones que ya estaban en marcha. «La operación que aprobaron hace 15 minutos presenta una nueva señal de alerta.»',
    reto: 'Para cada noticia elijan la respuesta correcta: ignorar, preguntar, documentar, escalar, reportar según el procedimiento… o investigar por su cuenta.',
    segundos: 6 * 60,
    revelacion: '📣 ¡Ruta activada!',
    aprendizaje: 'El objetivo no es investigar por cuenta propia, sino reconocer señales y activar correctamente el procedimiento establecido.',
    concepto: 'Operación inusual y operación sospechosa: quien la ve la reporta internamente ({responsable}, por {canal}); quien analiza decide si es sospechosa y, en ese caso, hace el reporte a la UIAF (ROS). El colaborador no necesita pruebas: necesita reportar a tiempo.',
  },
  {
    numero: 8,
    emoji: '🏁',
    titulo: 'Caso final',
    competencia: 'todas',
    historia: 'Andes Import Group quiere cerrar el pedido más grande del año. Todo lo aprendido se pone a prueba en una sola historia, de principio a fin.',
    reto: 'Recorran la ruta completa: detectar, conocer, encontrar al beneficiario, seguir el dinero, clasificar y actuar. Cada decisión trae su explicación.',
    segundos: 10 * 60,
    revelacion: '🛡️ ¡Ruta completa!',
    aprendizaje: 'La meta no es formar investigadores: es que cada persona sepa reconocer señales, evitar decisiones apresuradas, proteger la información, documentar lo pertinente y activar la ruta.',
    concepto: 'LA/FT → dónde puede aparecer → cómo se identifica → cómo se analiza → cómo se gestiona → cómo se monitorea → cómo se escala o reporta según el procedimiento de la empresa.',
  },
];

export function retoRr(n: number) {
  return RETOS.find((r) => r.numero === n) ?? RETOS[0]!;
}

/** Estaciones del tablero visual de la ruta y los retos que las encienden. */
export const ESTACIONES = [
  { id: 'empresa', emoji: '🏢', nombre: 'Empresa', retos: [] as number[] },
  { id: 'contraparte', emoji: '👥', nombre: 'Cliente · Proveedor · Socio', retos: [2, 3] },
  { id: 'operacion', emoji: '💼', nombre: 'Operación', retos: [1, 4] },
  { id: 'analizar', emoji: '🔍', nombre: 'Analizar', retos: [5] },
  { id: 'semaforo', emoji: '🚦', nombre: 'Normal o alerta', retos: [6] },
  { id: 'escalar', emoji: '📣', nombre: 'Escalar / actuar según procedimiento', retos: [7, 8] },
] as const;

/** Roles que rotan en cada reto. */
export const ROLES_RR = [
  { emoji: '🔎', nombre: 'Observador', tarea: 'Lee la situación en voz alta y dice qué le llama la atención.' },
  { emoji: '❓', nombre: 'Preguntador', tarea: 'Propone qué preguntar o qué información pedir.' },
  { emoji: '📖', nombre: 'Custodio', tarea: 'Recuerda la ruta de la empresa y cuida la información.' },
  { emoji: '✍️', nombre: 'Escriba', tarea: 'Toca los botones y entrega el reto.' },
] as const;

export function rolRr(indice: number, reto: number) {
  return ROLES_RR[(indice + reto - 1) % ROLES_RR.length]!;
}

// ----------------------------------------------------------------------------
// Puntos (tabla del juego)
// ----------------------------------------------------------------------------

export const PUNTOS = {
  senal: 10, // Detectar señal de alerta
  pregunta: 10, // Hacer una pregunta pertinente
  informacion: 15, // Solicitar información adecuada
  beneficiario: 15, // Identificar beneficiario final
  escalar: 20, // Escalar correctamente
  documentar: 10, // Documentar correctamente
  proteger: 10, // Proteger la información
  normal: 10, // Reconocer una situación normal
  color: 10, // Color correcto en el semáforo
  razon: 15, // Razón sólida en el semáforo
  ruta: 15, // Reconstruir el recorrido del dinero
  ignorar: -20, // Ignorar una alerta
  sinInformacion: -15, // Decidir sin información suficiente
  confidencial: -30, // Compartir información confidencial indebidamente
  falsaAlarma: -5, // Marcar como señal algo que no lo es
  impertinente: -10, // Pedir información que no corresponde
  porCuentaPropia: -10, // Investigar por cuenta propia
} as const;

/** La tabla que se muestra a los jugadores (las acciones del documento base). */
export const TABLA_PUNTOS: [string, number][] = [
  ['Detectar señal de alerta', PUNTOS.senal],
  ['Hacer una pregunta pertinente', PUNTOS.pregunta],
  ['Solicitar información adecuada', PUNTOS.informacion],
  ['Identificar beneficiario final', PUNTOS.beneficiario],
  ['Escalar correctamente', PUNTOS.escalar],
  ['Documentar correctamente', PUNTOS.documentar],
  ['Ignorar una alerta', PUNTOS.ignorar],
  ['Decidir sin información suficiente', PUNTOS.sinInformacion],
  ['Compartir información confidencial indebidamente', PUNTOS.confidencial],
];

/** Etiquetas de una decisión: cada una suma o resta según la tabla. */
export type Etiqueta = 'senal' | 'pregunta' | 'informacion' | 'beneficiario' | 'escalar' | 'documentar' | 'proteger' | 'normal' | 'ignorar' | 'sinInformacion' | 'confidencial' | 'porCuentaPropia';

export const NOMBRE_ETIQUETA: Record<Etiqueta, string> = {
  senal: '🔎 detectó la señal',
  pregunta: '❓ pregunta pertinente',
  informacion: '🪪 información adecuada',
  beneficiario: '👤 beneficiario final',
  escalar: '📣 escaló bien',
  documentar: '📝 documentó',
  proteger: '🔒 protegió la información',
  normal: '🟢 reconoció lo normal',
  ignorar: '🙈 ignoró una alerta',
  sinInformacion: '⚡ decidió sin información',
  confidencial: '🗣️ compartió información reservada',
  porCuentaPropia: '🕵️ investigó por su cuenta',
};

export function puntosDe(etiquetas: readonly Etiqueta[]) {
  return etiquetas.reduce((s, e) => s + PUNTOS[e], 0);
}

export interface Opcion {
  id: string;
  texto: string;
  etiquetas: Etiqueta[];
  porque: string;
}

// ----------------------------------------------------------------------------
// Reto 1 — ¿Detectas la señal?
// ----------------------------------------------------------------------------

export interface Elemento {
  id: string;
  texto: string;
  senal: TipoSenal | null;
  porque: string;
}

export interface SituacionSenal {
  id: string;
  emoji: string;
  titulo: string;
  texto: string;
  elementos: Elemento[];
  leccion: string;
}

export const SITUACIONES: SituacionSenal[] = [
  {
    id: 's1',
    emoji: '🛒',
    titulo: 'El cliente nuevo',
    texto: 'Un cliente nuevo quiere comprar $480 millones en telas. La empresa es reciente, tiene poca información pública y pide que el pago se haga desde la cuenta de un tercero.',
    elementos: [
      { id: 'a', texto: 'Compra de $480 millones siendo cliente nuevo', senal: 'perfil', porque: 'Es un monto muy alto para alguien sin historia con la empresa.' },
      { id: 'b', texto: 'La empresa fue creada hace poco', senal: 'reciente', porque: 'Una empresa reciente no tiene historia que respalde un pedido tan grande.' },
      { id: 'c', texto: 'Casi no hay información pública de ella', senal: 'reciente', porque: 'Sin información es difícil saber quién es y a qué se dedica.' },
      { id: 'd', texto: 'Paga desde la cuenta de un tercero', senal: 'tercero', porque: 'Si paga otro, hay que saber quién es y por qué. Puede esconder el origen del dinero.' },
      { id: 'e', texto: 'Pide factura electrónica', senal: null, porque: 'Es lo normal: toda venta se factura.' },
      { id: 'f', texto: 'Quiere la entrega en su bodega de Bogotá', senal: null, porque: 'Entregar en la bodega del propio cliente es coherente.' },
    ],
    leccion: 'Ninguna señal sola prueba nada. La combinación de monto alto + empresa nueva + pago de un tercero es la que pide detenerse.',
  },
  {
    id: 's2',
    emoji: '🧵',
    titulo: 'El proveedor barato',
    texto:
      'Un proveedor nuevo de algodón ofrece precios 30 % por debajo del mercado. Pide el pago anticipado del 100 % a una cuenta en un país donde no opera. En su RUT la actividad es «asesorías». Tiene certificado de Cámara de Comercio vigente y envió muestras.',
    elementos: [
      { id: 'a', texto: 'Precios 30 % por debajo del mercado', senal: 'precio', porque: 'Un precio demasiado bueno puede venir de mercancía de origen ilícito o de una operación simulada.' },
      { id: 'b', texto: 'Anticipo del 100 %', senal: 'urgencia', porque: 'Pagar todo antes de recibir deja a la empresa sin protección.' },
      { id: 'c', texto: 'Cuenta en un país donde no opera', senal: 'exterior', porque: 'El dinero debe ir a donde está el negocio. Si no, hay que entender por qué.' },
      { id: 'd', texto: 'Su RUT dice «asesorías», no algodón', senal: 'perfil', porque: 'La actividad registrada no corresponde a lo que vende.' },
      { id: 'e', texto: 'Certificado de Cámara de Comercio vigente', senal: null, porque: 'Es un requisito básico y está al día.' },
      { id: 'f', texto: 'Envió muestras del producto', senal: null, porque: 'Enviar muestras es una práctica comercial normal.' },
    ],
    leccion: 'Tener los papeles básicos al día no borra las otras señales: el precio, el anticipo, la cuenta y la actividad no cuadran.',
  },
  {
    id: 's3',
    emoji: '🎄',
    titulo: 'El pedido de temporada',
    texto:
      'Un cliente de hace 8 años, distribuidor en Medellín, compra cada mes unos $45 millones y paga por transferencia desde su propia cuenta. Este mes pidió $52 millones «por la temporada navideña», como hizo el año pasado.',
    elementos: [
      { id: 'a', texto: 'Subió el pedido de $45 a $52 millones', senal: null, porque: 'Es un aumento pequeño, con una razón coherente y que ya había pasado antes.' },
      { id: 'b', texto: 'Paga desde su propia cuenta', senal: null, porque: 'Quien compra es quien paga: así debe ser.' },
      { id: 'c', texto: 'Es cliente desde hace 8 años', senal: null, porque: 'Tiene historia conocida con la empresa.' },
      { id: 'd', texto: 'Dice que es por la temporada', senal: null, porque: 'La explicación coincide con su comportamiento del año anterior.' },
    ],
    leccion: 'No todo es alerta. Un cambio pequeño, explicado y coherente con la historia del cliente es normal. Ver señales donde no las hay también tiene un costo.',
  },
  {
    id: 's4',
    emoji: '✨',
    titulo: 'El cliente perfecto',
    texto:
      'Un cliente con documentos completos, buenas referencias y 3 años de relación. Todo parece normal, pero esta vez quiere pagar $90 millones en efectivo, con varias consignaciones de $9 millones en diferentes ciudades.',
    elementos: [
      { id: 'a', texto: 'Documentos completos', senal: null, porque: 'Está al día: eso es bueno.' },
      { id: 'b', texto: 'Buenas referencias y 3 años de relación', senal: null, porque: 'La historia es buena, pero no vuelve normal lo que no lo es.' },
      { id: 'c', texto: 'Pago de $90 millones en efectivo', senal: 'efectivo', porque: 'Un pago grande en efectivo dificulta saber de dónde viene el dinero.' },
      { id: 'd', texto: 'Dividido en consignaciones de $9 millones', senal: 'efectivo', porque: 'Partir un pago en montos pequeños (fraccionar) es una forma clásica de evitar los controles.' },
      { id: 'e', texto: 'Consignado desde diferentes ciudades', senal: 'exterior', porque: 'Mover el efectivo por varios lugares sin razón comercial complica la trazabilidad.' },
    ],
    leccion: 'Un buen cliente también puede presentar una señal. No se ignora porque «el resto parece normal»: se documenta y se consulta.',
  },
];

// ----------------------------------------------------------------------------
// Reto 2 — Conoce a tu contraparte
// ----------------------------------------------------------------------------

export const PERFIL_XYZ = [
  'Creada hace 4 meses',
  'Actividad: comercio',
  'Representante legal de 29 años',
  'Oficina virtual',
  'Referencias sin respuesta',
  'Beneficiario final incompleto',
  'Pide una operación por $800 millones',
];

export const FICHAS_CONSULTA = 5;

export interface Solicitud {
  id: string;
  emoji: string;
  nombre: string;
  pertinente: boolean;
  /** Clave: si no se pide, es un error frecuente. */
  clave: boolean;
  respuesta: string;
}

export const SOLICITUDES: Solicitud[] = [
  { id: 'identidad', emoji: '🏛️', nombre: 'Certificado de existencia y documento del representante', pertinente: true, clave: false, respuesta: 'Constituida hace 4 meses con un capital de $5 millones. El representante legal tiene 29 años y no tiene otras empresas registradas.' },
  { id: 'financiera', emoji: '📊', nombre: 'Información financiera', pertinente: true, clave: true, respuesta: 'No tiene estados financieros: «somos nuevos». Declara ingresos proyectados de $3.000 millones el primer año.' },
  { id: 'beneficiario', emoji: '👤', nombre: 'Beneficiario final', pertinente: true, clave: true, respuesta: 'El formulario dice «Inversiones del Istmo Corp. — 100 %». No aparece el nombre de ninguna persona.' },
  { id: 'origen', emoji: '💰', nombre: 'Origen de los recursos', pertinente: true, clave: true, respuesta: 'Dice que el dinero viene de «un inversionista extranjero». No adjunta ningún soporte.' },
  { id: 'referencias', emoji: '📞', nombre: 'Referencias comerciales y bancarias', pertinente: true, clave: false, respuesta: 'Ninguna de las dos referencias contesta. Una es un número de celular sin nombre.' },
  { id: 'soportes', emoji: '📑', nombre: 'Soportes de la operación', pertinente: true, clave: false, respuesta: 'Envía una orden de compra sin firma. Pide que la mercancía se entregue a otra empresa, Logística Norte.' },
  { id: 'tributaria', emoji: '🧾', nombre: 'Información tributaria (RUT)', pertinente: true, clave: false, respuesta: 'RUT actualizado hace un mes. Actividad: «comercio al por mayor de otros productos».' },
  { id: 'listas', emoji: '🚫', nombre: 'Consulta en listas restrictivas', pertinente: true, clave: false, respuesta: 'El representante legal no aparece en listas. Los socios no se pueden consultar porque no hay nombres de personas.' },
  { id: 'redes', emoji: '📸', nombre: 'Fotos personales del representante en redes sociales', pertinente: false, clave: false, respuesta: 'Aparecen fotos de sus vacaciones. No aporta nada al análisis y es información personal que no hace parte de la debida diligencia.' },
  { id: 'clave', emoji: '🔑', nombre: 'La clave de su banca en línea para ver el saldo', pertinente: false, clave: false, respuesta: 'El cliente se molesta, con razón: nunca se piden claves ni accesos. Esto no es debida diligencia y expone a la empresa.' },
];

export const DECISION_R2: Opcion[] = [
  { id: 'aprobar', texto: 'Aprobar la operación: es un cliente grande y la empresa necesita crecer.', etiquetas: ['sinInformacion'], porque: 'Con el beneficiario final y el origen de los recursos sin aclarar, aprobar es decidir sin información suficiente.' },
  { id: 'mitad', texto: 'Aprobar solo la mitad para «probar» al cliente.', etiquetas: ['sinInformacion'], porque: 'Una operación más pequeña con las mismas señales sigue siendo riesgosa.' },
  {
    id: 'escalar',
    texto: 'No vincularlo todavía: pedir lo que falta, dejar registro de lo encontrado y escalar a {responsable}.',
    etiquetas: ['escalar'],
    porque: 'Hay varias señales juntas y falta información clave. Se detiene, se documenta y se activa la ruta.',
  },
  { id: 'avisar', texto: 'Rechazarlo y decirle al cliente que parece lavado de activos.', etiquetas: ['confidencial'], porque: 'Nunca se le comunica a la contraparte una sospecha: la decisión se toma por la ruta interna y con reserva.' },
];

// ----------------------------------------------------------------------------
// Reto 3 — Beneficiario final
// ----------------------------------------------------------------------------

export interface NodoPropiedad {
  id: string;
  nombre: string;
  tipo: 'juridica' | 'natural';
  /** De quién es dueño y en qué %. null = la contraparte. */
  padre: string | null;
  pct: number;
  detalle: string;
}

export const ESTRUCTURA: NodoPropiedad[] = [
  { id: 'xyz', nombre: 'Comercializadora XYZ S.A.S.', tipo: 'juridica', padre: null, pct: 100, detalle: 'La contraparte (Colombia)' },
  { id: 'istmo', nombre: 'Inversiones del Istmo Corp.', tipo: 'juridica', padre: 'xyz', pct: 70, detalle: 'Sociedad en el exterior' },
  { id: 'marta', nombre: 'Marta Salcedo', tipo: 'natural', padre: 'istmo', pct: 60, detalle: 'Socia de Inversiones del Istmo' },
  { id: 'julian', nombre: 'Julián Ferro', tipo: 'natural', padre: 'istmo', pct: 40, detalle: 'Socio de Inversiones del Istmo' },
  { id: 'sur', nombre: 'Grupo Sur S.A.S.', tipo: 'juridica', padre: 'xyz', pct: 28, detalle: 'Sociedad colombiana' },
  { id: 'pedro', nombre: 'Pedro Lema', tipo: 'natural', padre: 'sur', pct: 50, detalle: 'Socio de Grupo Sur' },
  { id: 'lucia', nombre: 'Lucía Varón', tipo: 'natural', padre: 'sur', pct: 50, detalle: 'Socia de Grupo Sur' },
  { id: 'andres', nombre: 'Andrés Ruiz', tipo: 'natural', padre: 'xyz', pct: 2, detalle: 'Representante legal (29 años). Dice: «yo firmo lo que me mandan»' },
];

export const CONTROLADOR = {
  id: 'alvaro',
  nombre: 'Álvaro Quiroga',
  detalle: 'No aparece como socio. Pero Marta y Julián le firmaron un poder que le da la última palabra sobre todas las operaciones de XYZ.',
};

export const UMBRAL_BF = 5;

/** % que cada persona tiene de verdad en la contraparte (multiplicando la cadena). */
export function participacionIndirecta(id: string): number {
  let nodo = ESTRUCTURA.find((n) => n.id === id);
  let pct = 1;
  while (nodo && nodo.padre) {
    pct *= nodo.pct / 100;
    nodo = ESTRUCTURA.find((n) => n.id === nodo!.padre);
  }
  return Math.round(pct * 1000) / 10;
}

export interface CandidatoBf {
  id: string;
  nombre: string;
  esBf: boolean;
  porque: string;
}

export function candidatosBf(): CandidatoBf[] {
  const lista: CandidatoBf[] = ESTRUCTURA.filter((n) => n.padre).map((n) => {
    if (n.tipo === 'juridica') return { id: n.id, nombre: n.nombre, esBf: false, porque: 'Es una empresa: el beneficiario final siempre es una persona natural. Hay que mirar quién está detrás.' };
    const pct = participacionIndirecta(n.id);
    return pct >= UMBRAL_BF
      ? { id: n.id, nombre: n.nombre, esBf: true, porque: `Tiene de verdad el ${pct.toLocaleString('es-CO')} % de XYZ: supera el ${UMBRAL_BF} %.` }
      : { id: n.id, nombre: n.nombre, esBf: false, porque: `Solo tiene el ${pct.toLocaleString('es-CO')} % y no controla nada: firma lo que le mandan. Ojo: que el representante firme no lo vuelve dueño.` };
  });
  lista.push({ id: CONTROLADOR.id, nombre: CONTROLADOR.nombre, esBf: true, porque: 'No es socio, pero controla la empresa por medio de un poder. El control también hace beneficiario final.' });
  return lista;
}

export const DECISION_R3: Opcion[] = [
  { id: 'seguir', texto: 'Seguir con la operación: ya tenemos el nombre de la sociedad dueña.', etiquetas: ['ignorar'], porque: 'El nombre de una sociedad no dice quién está detrás. Seguir es ignorar la alerta.' },
  { id: 'buscar', texto: 'Buscar por nuestra cuenta a Álvaro Quiroga en redes y llamarlo para preguntarle.', etiquetas: ['porCuentaPropia'], porque: 'No es su rol investigar por su cuenta: además puede alertar a los involucrados.' },
  {
    id: 'escalar',
    texto: 'Pedir la identificación de todas las personas beneficiarias finales, no vincular hasta tenerla y escalar a {responsable} si el cliente se niega.',
    etiquetas: ['informacion', 'escalar'],
    porque: 'Se pide lo que falta por el canal formal y, si el cliente se niega a decir quién está detrás, esa negativa es en sí misma una señal para escalar.',
  },
];

// ----------------------------------------------------------------------------
// Reto 4 — Sigue el dinero
// ----------------------------------------------------------------------------

export interface Movimiento {
  id: string;
  de: string;
  a: string;
  monto: number;
  concepto: string;
  inconsistente: boolean;
  senal: TipoSenal | null;
  porque: string;
}

export const MOVIMIENTOS: Movimiento[] = [
  {
    id: 'm1',
    de: '🏦 Inversiones Omega S.A.S.',
    a: '🏢 Textiles Horizonte',
    monto: 300_000_000,
    concepto: '«Pago de la factura de Confecciones Delta»',
    inconsistente: true,
    senal: 'tercero',
    porque: 'Quien paga no es el cliente. Inversiones Omega no tiene ninguna relación conocida con la compra.',
  },
  {
    id: 'm2',
    de: '🏢 Textiles Horizonte',
    a: '🤝 Servicios Brava Ltda.',
    monto: 280_000_000,
    concepto: '«Anticipo del algodón de Algodones del Valle»: el proveedor pidió consignar a la cuenta de su «aliado»',
    inconsistente: true,
    senal: 'tercero',
    porque: 'Se le paga a alguien distinto de quien vende. El dinero sale hacia un tercero sin contrato con la empresa.',
  },
  {
    id: 'm3',
    de: '🤝 Servicios Brava Ltda.',
    a: '🌎 Global Trade Holdings (cuenta en el exterior)',
    monto: 275_000_000,
    concepto: 'Dos días después: «pago de asesorías»',
    inconsistente: true,
    senal: 'exterior',
    porque: 'El dinero sale casi completo al exterior de inmediato y con un concepto que no tiene que ver con algodón.',
  },
  {
    id: 'm4',
    de: '🏢 Textiles Horizonte',
    a: '🚚 Transportes La Ruta',
    monto: 8_000_000,
    concepto: 'Flete del despacho a Confecciones Delta, según el contrato firmado',
    inconsistente: false,
    senal: null,
    porque: 'Es un pago normal: hay contrato, el servicio se prestó y el valor es coherente.',
  },
];

/** El recorrido del dinero de la venta (el flete no hace parte). */
export const RUTA_DINERO = ['m1', 'm2', 'm3'];

export interface PreguntaUnica {
  id: string;
  pregunta: string;
  etiqueta: Etiqueta;
  opciones: { id: string; texto: string; correcta?: boolean; porque: string }[];
}

export const PREGUNTAS_R4: PreguntaUnica[] = [
  {
    id: 'entrega',
    pregunta: '¿Quién entrega realmente el dinero de la venta?',
    etiqueta: 'pregunta',
    opciones: [
      { id: 'a', texto: 'Confecciones Delta, el cliente', porque: 'La factura es de Delta, pero el dinero no salió de su cuenta.' },
      { id: 'b', texto: 'Inversiones Omega, un tercero sin relación conocida', correcta: true, porque: 'El dinero salió de Omega. Hay que saber quién es y por qué paga por otro.' },
      { id: 'c', texto: 'Textiles Horizonte', porque: 'Textiles Horizonte recibe, no entrega.' },
    ],
  },
  {
    id: 'recibe',
    pregunta: '¿Quién recibe el dinero al final del recorrido?',
    etiqueta: 'pregunta',
    opciones: [
      { id: 'a', texto: 'Algodones del Valle, el proveedor', porque: 'El proveedor nunca recibió el dinero en su cuenta.' },
      { id: 'b', texto: 'Servicios Brava', porque: 'Brava solo lo tuvo dos días: es un paso intermedio.' },
      { id: 'c', texto: 'Global Trade Holdings, en el exterior', correcta: true, porque: 'Ahí termina casi todo el dinero, lejos del negocio original.' },
    ],
  },
  {
    id: 'porque',
    pregunta: '¿Por qué el pago del algodón pasa por Servicios Brava?',
    etiqueta: 'pregunta',
    opciones: [
      { id: 'a', texto: 'No hay una razón comercial clara: es justo lo que hay que preguntar y documentar', correcta: true, porque: 'Cuando no se entiende el «por qué» de un paso, ese paso es la señal.' },
      { id: 'b', texto: 'Porque así el proveedor paga menos impuestos, y eso es normal', porque: 'Suponer una explicación no reemplaza preguntarla. Y evadir impuestos tampoco es normal.' },
      { id: 'c', texto: 'Da igual: lo importante es que el algodón llegue', porque: 'El dinero de la empresa terminó en el exterior: sí importa por dónde pasa.' },
    ],
  },
  {
    id: 'bf',
    pregunta: '¿A quién hay que identificar como beneficiario final para entender la operación?',
    etiqueta: 'beneficiario',
    opciones: [
      { id: 'a', texto: 'Solo a Confecciones Delta, porque es el cliente', porque: 'Delta figura, pero el dinero no es suyo.' },
      { id: 'b', texto: 'A las personas detrás de Inversiones Omega, Servicios Brava y Global Trade Holdings', correcta: true, porque: 'Las personas que pagan, intermedian y reciben son las que realmente se benefician.' },
      { id: 'c', texto: 'A nadie: las empresas están registradas', porque: 'Estar registrada no dice quién está detrás de una empresa.' },
    ],
  },
];

// ----------------------------------------------------------------------------
// Reto 5 — Clasifica el riesgo (semáforo)
// ----------------------------------------------------------------------------

export const COLORES = {
  verde: { emoji: '🟢', nombre: 'Verde', ayuda: 'Sin señales relevantes' },
  amarillo: { emoji: '🟡', nombre: 'Amarillo', ayuda: 'Señales que requieren análisis' },
  rojo: { emoji: '🔴', nombre: 'Rojo', ayuda: 'Escalar o aplicar el procedimiento' },
} as const;
export type Color = keyof typeof COLORES;

export interface OperacionSemaforo {
  id: string;
  texto: string;
  color: Color;
  senales: TipoSenal[];
  razones: { id: string; texto: string; calidad: 'solida' | 'automatica' | 'errada' }[];
  porque: string;
}

export const OPERACIONES: OperacionSemaforo[] = [
  {
    id: 'o1',
    texto: 'Un cliente de hace 5 años cambia la cuenta de pago a otra de su misma empresa en otro banco. Lo avisa por el canal oficial y adjunta el certificado bancario.',
    color: 'verde',
    senales: [],
    razones: [
      { id: 'a', texto: 'La cuenta es del mismo cliente, está certificada y llegó por el canal oficial.', calidad: 'solida' },
      { id: 'b', texto: 'Es un cliente antiguo, así que no hay que revisar nada.', calidad: 'automatica' },
      { id: 'c', texto: 'Todo cambio de cuenta es sospechoso.', calidad: 'errada' },
    ],
    porque: 'El cambio está verificado. La antigüedad sola no basta: lo que da tranquilidad es la verificación.',
  },
  {
    id: 'o2',
    texto: 'Un proveedor nuevo con sede en un país que el GAFI tiene bajo vigilancia especial. Los documentos están completos y los precios son de mercado.',
    color: 'amarillo',
    senales: ['exterior'],
    razones: [
      { id: 'a', texto: 'El país aumenta el riesgo: se aplica una debida diligencia más profunda antes de decidir.', calidad: 'solida' },
      { id: 'b', texto: 'Es de otro país, así que se rechaza.', calidad: 'automatica' },
      { id: 'c', texto: 'Si los documentos están completos, no hay nada más que mirar.', calidad: 'errada' },
    ],
    porque: 'No es prohibido, pero sí pide más análisis: debida diligencia intensificada.',
  },
  {
    id: 'o3',
    texto: 'El alcalde de un municipio quiere comprar telas para la empresa de su familia. Todo está documentado y el pago sale de la cuenta de la empresa.',
    color: 'amarillo',
    senales: ['listas'],
    razones: [
      { id: 'a', texto: 'Es una Persona Expuesta Políticamente (PEP): no es ilegal, pero pide debida diligencia intensificada y aprobación de un nivel superior.', calidad: 'solida' },
      { id: 'b', texto: 'Los políticos siempre son riesgosos: se rechaza.', calidad: 'automatica' },
      { id: 'c', texto: 'Es una autoridad, así que se aprueba rápido.', calidad: 'errada' },
    ],
    porque: 'Ser PEP no es una falta: significa que hay más riesgo y más controles.',
  },
  {
    id: 'o4',
    texto: 'Al revisar a un posible socio nuevo, su nombre coincide con una persona de la lista del Consejo de Seguridad de las Naciones Unidas.',
    color: 'rojo',
    senales: ['listas'],
    razones: [
      { id: 'a', texto: 'Es una lista vinculante: no se avanza y se reporta de inmediato por la ruta de la empresa.', calidad: 'solida' },
      { id: 'b', texto: 'Puede ser un homónimo: se sigue y se revisa después.', calidad: 'errada' },
      { id: 'c', texto: 'Suena peligroso, así que es rojo.', calidad: 'automatica' },
    ],
    porque: 'La coincidencia en una lista vinculante se escala de inmediato. Confirmar si es un homónimo le toca a quien analiza, no a quien sigue adelante.',
  },
  {
    id: 'o5',
    texto: 'Un cliente paga $150 millones en efectivo, en varias consignaciones pequeñas, y pide que la factura salga a nombre de otra persona.',
    color: 'rojo',
    senales: ['efectivo', 'tercero'],
    razones: [
      { id: 'a', texto: 'Es mucha plata.', calidad: 'automatica' },
      { id: 'b', texto: 'Efectivo fraccionado + factura a nombre de otro: esconde quién paga y quién compra.', calidad: 'solida' },
      { id: 'c', texto: 'Mientras pague, no importa a nombre de quién sale la factura.', calidad: 'errada' },
    ],
    porque: 'Dos señales fuertes juntas: fraccionamiento y un tercero que aparece en la factura.',
  },
  {
    id: 'o6',
    texto: 'Un cliente de 2 años aumenta sus compras un 10 % desde que abrió una segunda tienda, que se puede verificar en la Cámara de Comercio.',
    color: 'verde',
    senales: [],
    razones: [
      { id: 'a', texto: 'Cualquier aumento de compras es una señal.', calidad: 'errada' },
      { id: 'b', texto: 'El aumento es moderado y tiene una explicación que se puede verificar.', calidad: 'solida' },
      { id: 'c', texto: 'Se ve bien.', calidad: 'automatica' },
    ],
    porque: 'Un cambio explicado y verificable es normal. «Se ve bien» no es un argumento.',
  },
];

// ----------------------------------------------------------------------------
// Reto 6 — ¿Qué harías? (cartas de evento)
// ----------------------------------------------------------------------------

export interface Carta {
  id: string;
  emoji: string;
  titulo: string;
  texto: string;
  pregunta: string;
  opciones: Opcion[];
}

export const CARTAS: Carta[] = [
  {
    id: 'urgente',
    emoji: '⏰',
    titulo: 'El cliente urgente',
    texto: 'El cliente necesita que apruebes hoy una operación por $350 millones porque «si no, pierde el negocio».',
    pregunta: '¿Qué haces y qué información necesitas antes de continuar?',
    opciones: [
      { id: 'a', texto: 'La apruebo: el cliente es importante y la urgencia parece real.', etiquetas: ['sinInformacion'], porque: 'La urgencia no reemplaza la información. La presión para saltarse controles es en sí misma una señal.' },
      { id: 'b', texto: 'La apruebo y reviso los documentos la próxima semana.', etiquetas: ['sinInformacion'], porque: 'Revisar después de aprobar ya no protege a la empresa.' },
      {
        id: 'c',
        texto: 'Le explico que sin la información completa no se puede aprobar, le pido el origen de los recursos y los soportes, y dejo registro de la presión.',
        etiquetas: ['pregunta', 'documentar'],
        porque: 'Se pregunta lo pertinente y se documenta. Si el cliente insiste en saltarse el procedimiento, se escala.',
      },
      { id: 'd', texto: 'Le pido a un compañero que la apruebe él para no quedar yo como responsable.', etiquetas: ['ignorar'], porque: 'Pasarle el problema a otro es ignorar la alerta.' },
    ],
  },
  {
    id: 'favor',
    emoji: '🤝',
    titulo: 'El favor',
    texto: 'Un compañero te dice: «Conozco personalmente al proveedor. No necesitamos pedirle tanta información».',
    pregunta: '¿Qué haces?',
    opciones: [
      { id: 'a', texto: 'Le hago caso: él lo conoce desde hace años.', etiquetas: ['sinInformacion'], porque: 'La confianza personal no es un control. El procedimiento es igual para todos.' },
      { id: 'b', texto: 'Le pido al proveedor solo la mitad de los documentos, por la amistad.', etiquetas: ['sinInformacion'], porque: 'Una debida diligencia a medias deja huecos justo donde nadie mira.' },
      {
        id: 'c',
        texto: 'Aplico la misma debida diligencia que a todos: le explico al compañero que conocer a alguien no reemplaza el procedimiento.',
        etiquetas: ['informacion'],
        porque: 'Es justo y protege también al compañero: si algo sale mal, se hizo lo que correspondía.',
      },
    ],
  },
  {
    id: 'tercero',
    emoji: '🔀',
    titulo: 'El tercero',
    texto: 'El cliente dice: «Mi socio pagará por mí».',
    pregunta: '¿Qué deberías revisar?',
    opciones: [
      { id: 'a', texto: 'Nada: lo importante es que el pago llegue.', etiquetas: ['ignorar'], porque: 'El pago de un tercero puede esconder el verdadero origen del dinero.' },
      { id: 'b', texto: 'Solo pido la cédula del socio.', etiquetas: [], porque: 'Pedir una cédula no es conocer a alguien. Falta entender la relación y el origen del dinero.' },
      {
        id: 'c',
        texto: 'Quién es el socio, qué relación tiene con el cliente, de dónde viene el dinero y si el procedimiento permite pagos de terceros. Si no hay explicación, escalo.',
        etiquetas: ['pregunta', 'informacion'],
        porque: 'Esas son las preguntas pertinentes: quién, qué relación, de dónde y si está permitido.',
      },
    ],
  },
  {
    id: 'cambio',
    emoji: '🏦',
    titulo: 'El cambio',
    texto: 'Después de aprobar la operación, llega un correo pidiendo cambiar la cuenta bancaria del beneficiario del pago.',
    pregunta: '¿Qué haces antes de ejecutar el cambio?',
    opciones: [
      { id: 'a', texto: 'Hago el cambio: el correo viene del cliente.', etiquetas: ['ignorar'], porque: 'Un cambio de cuenta de última hora es una señal clásica, de LA/FT y también de fraude.' },
      { id: 'b', texto: 'Llamo al número que aparece en el mismo correo para confirmar.', etiquetas: [], porque: 'Si el correo es falso, el número también. Se confirma por un canal que ya estaba registrado.' },
      {
        id: 'c',
        texto: 'Confirmo por un canal registrado (no el del correo), pido la certificación bancaria a nombre del mismo beneficiario y lo documento. Si la cuenta es de un tercero, escalo.',
        etiquetas: ['pregunta', 'documentar', 'escalar'],
        porque: 'Verificar, documentar y escalar si aparece un tercero: la ruta completa.',
      },
    ],
  },
  {
    id: 'perfecto',
    emoji: '✨',
    titulo: 'El cliente perfecto',
    texto: 'Todo parece normal, pero aparece una pequeña señal de alerta.',
    pregunta: '¿La ignoras porque el resto de la operación parece normal? ¿Qué corresponde hacer?',
    opciones: [
      { id: 'a', texto: 'La ignoro: una señal pequeña en un buen cliente no significa nada.', etiquetas: ['ignorar'], porque: 'No le toca a usted decidir que no significa nada: le toca documentarla y consultarla.' },
      { id: 'b', texto: 'Le digo al cliente que vi algo raro y que lo vamos a revisar.', etiquetas: ['confidencial'], porque: 'Avisarle a la contraparte rompe la reserva de la información.' },
      {
        id: 'c',
        texto: 'La documento y la consulto con {responsable} por {canal}, sin acusar al cliente.',
        etiquetas: ['documentar', 'escalar'],
        porque: 'Usted reconoce y reporta; quien analiza decide. Así nadie es acusado sin razón y nada se pasa por alto.',
      },
    ],
  },
  {
    id: 'curioso',
    emoji: '👂',
    titulo: 'El curioso',
    texto: 'Un compañero de otra área te pregunta en el almuerzo: «¿Es verdad que reportaron a Confecciones Delta?».',
    pregunta: '¿Qué le respondes?',
    opciones: [
      { id: 'a', texto: 'Le cuento lo que sé: trabajamos en la misma empresa.', etiquetas: ['confidencial'], porque: 'Trabajar en la misma empresa no da derecho a conocer información reservada.' },
      { id: 'b', texto: '«No te puedo decir mucho, pero algo raro hay».', etiquetas: ['confidencial'], porque: 'Una insinuación también es compartir información reservada.' },
      { id: 'c', texto: 'Le digo que no puedo hablar de ese tema y cambio de conversación.', etiquetas: ['proteger'], porque: 'Proteger la información es parte de la ruta: se habla solo con quien lo necesita.' },
    ],
  },
];

// ----------------------------------------------------------------------------
// Reto 7 — Escala correctamente
// ----------------------------------------------------------------------------

export const ACCIONES = {
  ignorar: { emoji: '🙈', nombre: 'Ignorar', ayuda: 'No hacer nada.' },
  preguntar: { emoji: '❓', nombre: 'Preguntar', ayuda: 'Pedir una aclaración o un soporte a la contraparte, sin revelar sospechas.' },
  documentar: { emoji: '📝', nombre: 'Documentar', ayuda: 'Dejar registro en el expediente.' },
  escalar: { emoji: '📣', nombre: 'Escalar', ayuda: 'Avisar a {responsable} para que analice la operación inusual.' },
  reportar: { emoji: '🚨', nombre: 'Reportar según el procedimiento', ayuda: 'Detener y reportar de inmediato por {canal}.' },
  investigar: { emoji: '🕵️', nombre: 'Investigar por mi cuenta', ayuda: 'Averiguar por fuera del procedimiento.' },
} as const;
export type Accion = keyof typeof ACCIONES;
export const CLAVES_ACCION = Object.keys(ACCIONES) as Accion[];

export const ETIQUETAS_ACCION: Record<Accion, Etiqueta[]> = {
  ignorar: [],
  preguntar: ['pregunta'],
  documentar: ['documentar'],
  escalar: ['escalar'],
  reportar: ['escalar', 'documentar'],
  investigar: ['porCuentaPropia'],
};

export interface Alerta {
  id: string;
  texto: string;
  /** La mejor respuesta (puntos completos) y otra aceptable (la mitad). */
  mejor: Accion;
  aceptable?: Accion;
  /** Si hay una señal real, ignorarla resta. */
  hayAlerta: boolean;
  porque: string;
}

export const ALERTAS: Alerta[] = [
  {
    id: 'a1',
    texto: 'La operación que aprobaron hace 15 minutos: el cliente envía el soporte del origen de los recursos y es un contrato sin firmas, con fechas que no coinciden.',
    mejor: 'escalar',
    aceptable: 'preguntar',
    hayAlerta: true,
    porque: 'Un soporte inconsistente en una operación ya aprobada es una operación inusual: se escala para que {responsable} la analice.',
  },
  {
    id: 'a2',
    texto: 'Un cliente cambia la dirección de entrega a otra ciudad porque abrió una sede nueva. Lo informa por el canal oficial y la sede aparece en la Cámara de Comercio.',
    mejor: 'documentar',
    aceptable: 'preguntar',
    hayAlerta: false,
    porque: 'Es un cambio normal, explicado y verificable. Basta con dejarlo registrado. Escalar todo satura la ruta.',
  },
  {
    id: 'a3',
    texto: 'En la consulta periódica, el nuevo socio de un cliente aparece en la lista del Consejo de Seguridad de las Naciones Unidas.',
    mejor: 'reportar',
    aceptable: 'escalar',
    hayAlerta: true,
    porque: 'Una coincidencia en una lista vinculante no espera: se detiene y se reporta de inmediato por {canal}.',
  },
  {
    id: 'a4',
    texto: 'El proveedor envía la factura con un NIT que no coincide con el que está registrado, sin ninguna explicación.',
    mejor: 'preguntar',
    aceptable: 'escalar',
    hayAlerta: true,
    porque: 'Puede ser un error: primero se pregunta y se pide la corrección. Si no hay una explicación coherente, se escala.',
  },
  {
    id: 'a5',
    texto: 'Un cliente te ofrece «un detalle» de $5 millones si agilizas su operación sin tanto papeleo.',
    mejor: 'reportar',
    aceptable: 'escalar',
    hayAlerta: true,
    porque: 'Es un intento de saltarse los controles con un soborno: se rechaza y se reporta de inmediato según el procedimiento.',
  },
  {
    id: 'a6',
    texto: 'Un cliente antiguo hace 4 depósitos en efectivo de $9,5 millones en una semana, siempre un poco por debajo del monto que activa los controles.',
    mejor: 'escalar',
    aceptable: 'reportar',
    hayAlerta: true,
    porque: 'Es un patrón de fraccionamiento: no se necesitan pruebas para escalarlo, solo reconocerlo.',
  },
];

export function puntosAlerta(a: Alerta, accion: Accion | undefined) {
  if (!accion) return 0;
  const base = puntosDe(ETIQUETAS_ACCION[a.mejor]);
  if (accion === a.mejor) return base;
  if (accion === a.aceptable) return Math.round(base / 2);
  if (accion === 'ignorar') return a.hayAlerta ? PUNTOS.ignorar : 0;
  if (accion === 'investigar') return PUNTOS.porCuentaPropia;
  return 0;
}

// ----------------------------------------------------------------------------
// Reto 8 — Caso final: Andes Import Group
// ----------------------------------------------------------------------------

export interface PasoFinal {
  id: string;
  emoji: string;
  competencia: Competencia;
  titulo: string;
  texto: string;
  pregunta: string;
  opciones: Opcion[];
}

export const CASO_FINAL: PasoFinal[] = [
  {
    id: 'f1',
    emoji: '📥',
    competencia: 'detectar',
    titulo: 'Llega el pedido',
    texto:
      'Andes Import Group, cliente nuevo, quiere comprar $1.200 millones en telas: el pedido más grande del año. Fue creada hace 6 meses, tiene capital de $10 millones y pide cerrar el negocio esta semana. El gerente comercial está feliz.',
    pregunta: '¿Qué ven?',
    opciones: [
      { id: 'a', texto: 'Una gran oportunidad: hay que cerrarla antes de que se la lleve la competencia.', etiquetas: ['ignorar'], porque: 'La emoción del negocio no puede tapar las señales.' },
      { id: 'b', texto: 'Una combinación de señales: monto muy alto frente al capital, empresa reciente y afán por cerrar.', etiquetas: ['senal', 'senal'], porque: 'Tres señales juntas: el pedido es 120 veces su capital, es nueva y hay presión de tiempo.' },
      { id: 'c', texto: 'Solo el monto: lo demás es normal.', etiquetas: ['senal'], porque: 'El monto es una señal, pero no la única: la antigüedad y el afán también cuentan.' },
    ],
  },
  {
    id: 'f2',
    emoji: '🪪',
    competencia: 'conocer',
    titulo: 'Conocer al cliente',
    texto: 'Tienen tiempo para pedir una sola cosa antes de la reunión con el cliente.',
    pregunta: '¿Qué piden primero?',
    opciones: [
      { id: 'a', texto: 'El origen de los recursos y los estados financieros, para ver si el monto tiene sentido.', etiquetas: ['informacion'], porque: 'Es lo que responde la pregunta clave: ¿de dónde sale el dinero para un pedido tan grande?' },
      { id: 'b', texto: 'Fotos de la oficina para ver si es bonita.', etiquetas: [], porque: 'No dice nada sobre el riesgo.' },
      { id: 'c', texto: 'Nada: si paga por adelantado no hay riesgo.', etiquetas: ['sinInformacion'], porque: 'Pagar por adelantado no dice de dónde viene el dinero. Justamente así se mete dinero ilícito.' },
    ],
  },
  {
    id: 'f3',
    emoji: '👤',
    competencia: 'conocer',
    titulo: '¿Quién está detrás?',
    texto: 'Andes Import es 100 % de «Holding Pacífico Ltd.». Holding Pacífico es 90 % de Rosa Méndez y 10 % de Fernando Ibarra. El representante legal es Diego Rincón, sin acciones.',
    pregunta: '¿Quiénes son los beneficiarios finales?',
    opciones: [
      { id: 'a', texto: 'Holding Pacífico Ltd.', etiquetas: [], porque: 'Es una empresa: el beneficiario final es siempre una persona natural.' },
      { id: 'b', texto: 'Rosa Méndez (90 %) y Fernando Ibarra (10 %)', etiquetas: ['beneficiario'], porque: 'Los dos son personas naturales con más del 5 % a través de la holding.' },
      { id: 'c', texto: 'Diego Rincón, porque es quien firma', etiquetas: [], porque: 'Firmar no es ser dueño. Sin acciones ni control, no es el beneficiario final.' },
    ],
  },
  {
    id: 'f4',
    emoji: '💸',
    competencia: 'trazar',
    titulo: 'El dinero llega',
    texto: 'Llega el anticipo de $600 millones: la mitad desde la cuenta de Andes Import y la otra mitad desde una cuenta en el exterior de «Comercial Atlántida», que nadie conoce.',
    pregunta: '¿Qué preguntas hacen?',
    opciones: [
      { id: 'a', texto: '¿Quién es Comercial Atlántida, qué relación tiene con Andes Import y por qué paga por ella?', etiquetas: ['pregunta', 'senal'], porque: 'Es la pregunta pertinente: quién entrega, qué relación tiene y por qué.' },
      { id: 'b', texto: 'Ninguna: el dinero ya llegó completo.', etiquetas: ['ignorar'], porque: 'Que el dinero llegue no significa que su origen sea claro.' },
      { id: 'c', texto: '¿Nos pueden pagar el resto también desde el exterior?', etiquetas: [], porque: 'Es una pregunta comercial, no de riesgo.' },
    ],
  },
  {
    id: 'f5',
    emoji: '🚦',
    competencia: 'analizar',
    titulo: 'El semáforo',
    texto: 'Con todo lo que saben: pedido 120 veces el capital, empresa de 6 meses, afán, y la mitad del pago desde un tercero en el exterior.',
    pregunta: '¿Qué color le ponen y por qué?',
    opciones: [
      { id: 'a', texto: '🟢 Verde: ya pagó la mitad, el cliente es serio.', etiquetas: ['ignorar'], porque: 'Pagar no borra las señales.' },
      { id: 'b', texto: '🔴 Rojo: varias señales juntas y un tercero en el exterior sin explicación. Hay que escalar.', etiquetas: ['senal', 'documentar'], porque: 'El color está bien y, sobre todo, la razón explica qué no encaja.' },
      { id: 'c', texto: '🔴 Rojo: es mucha plata.', etiquetas: ['senal'], porque: 'El color es correcto, pero la razón es automática: el monto solo no explica el riesgo.' },
    ],
  },
  {
    id: 'f6',
    emoji: '😤',
    competencia: 'actuar',
    titulo: 'La presión',
    texto: 'El gerente comercial se entera y dice: «No me dañen el negocio del año. Despachen hoy y después revisamos».',
    pregunta: '¿Qué hacen?',
    opciones: [
      { id: 'a', texto: 'Despachar: él es el jefe y asume la responsabilidad.', etiquetas: ['ignorar'], porque: 'Una orden no quita la señal. El procedimiento aplica también para los jefes.' },
      { id: 'b', texto: 'No despachar todavía, documentar lo encontrado y escalar a {responsable} por {canal}.', etiquetas: ['escalar', 'documentar'], porque: 'Se activa la ruta. {responsable} tiene la autoridad y la independencia para decidir.' },
      { id: 'c', texto: 'Llamar a Comercial Atlántida para preguntarles si son lavadores.', etiquetas: ['porCuentaPropia', 'confidencial'], porque: 'Investigar por su cuenta y revelar la sospecha: dos errores en uno.' },
    ],
  },
  {
    id: 'f7',
    emoji: '🤐',
    competencia: 'actuar',
    titulo: 'La llamada',
    texto: 'El cliente llama molesto: «¿Por qué tanta demora? ¿Me están investigando?».',
    pregunta: '¿Qué le responden?',
    opciones: [
      { id: 'a', texto: '«Sí, es que su pago desde el exterior parece sospechoso».', etiquetas: ['confidencial'], porque: 'Nunca se le revela a la contraparte que está siendo analizada o reportada.' },
      { id: 'b', texto: '«Estamos completando la verificación que hacemos con todos los clientes. Le avisamos apenas terminemos».', etiquetas: ['proteger'], porque: 'Es verdad, es respetuoso y protege la reserva de la información.' },
      { id: 'c', texto: '«Tranquilo, ya se lo despacho hoy mismo».', etiquetas: ['sinInformacion'], porque: 'Prometer el despacho es decidir sin tener la respuesta de la ruta.' },
    ],
  },
];

// ----------------------------------------------------------------------------
// Puntaje (servidor)
// ----------------------------------------------------------------------------

export interface ResumenRr {
  /** Puntos ganados y posibles por competencia en este reto. */
  comp?: Partial<Record<Competencia, [number, number]>>;
  /** Señales detectadas y totales por tipo. */
  senales?: Partial<Record<TipoSenal, [number, number]>>;
  ignoradas?: number;
  sinInformacion?: number;
  confidencial?: number;
  porCuentaPropia?: number;
  falsasAlarmas?: number;
  /** Frases cortas de lo que se escapó (para «errores frecuentes»). */
  fallos?: string[];
}

export interface ResultadoRr {
  puntos: number;
  aciertos: number;
  errores: number;
  detalle: string[];
  resumen: ResumenRr;
}

const obj = (v: unknown): Record<string, any> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : {});
const lista = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

function mejorDe(opciones: Opcion[]) {
  return Math.max(0, ...opciones.map((o) => puntosDe(o.etiquetas)));
}

/** Suma de un reto en construcción. */
class Cuenta {
  puntos = 0;
  aciertos = 0;
  errores = 0;
  detalle: string[] = [];
  r: ResumenRr = { comp: {}, senales: {}, ignoradas: 0, sinInformacion: 0, confidencial: 0, porCuentaPropia: 0, falsasAlarmas: 0, fallos: [] };

  comp(c: Competencia, ganado: number, posible: number) {
    const [g, p] = this.r.comp![c] ?? [0, 0];
    this.r.comp![c] = [g + Math.max(0, ganado), p + posible];
  }
  senal(t: TipoSenal, detectada: boolean) {
    const [d, n] = this.r.senales![t] ?? [0, 0];
    this.r.senales![t] = [d + (detectada ? 1 : 0), n + 1];
  }
  /** Aplica las etiquetas de una decisión y cuenta los errores graves. */
  decision(etiquetas: readonly Etiqueta[], c: Competencia, posible: number) {
    const p = puntosDe(etiquetas);
    this.puntos += p;
    this.comp(c, p, posible);
    for (const e of etiquetas) {
      if (e === 'ignorar') this.r.ignoradas!++;
      if (e === 'sinInformacion') this.r.sinInformacion!++;
      if (e === 'confidencial') this.r.confidencial!++;
      if (e === 'porCuentaPropia') this.r.porCuentaPropia!++;
    }
    if (p >= posible && posible > 0) this.aciertos++;
    else this.errores++;
    return p;
  }
  fallo(texto: string) {
    this.r.fallos!.push(texto);
  }
}

/** Calcula los puntos de un reto a partir de las respuestas del equipo. */
export function puntuar(numero: number, respuestas: unknown): ResultadoRr {
  const r = obj(respuestas);
  const c = new Cuenta();

  if (numero === 1) {
    const marcas = obj(r.marcas); // situacionId -> ids de elementos
    const nada = obj(r.nada); // situacionId -> true
    let detectadas = 0;
    let total = 0;
    for (const s of SITUACIONES) {
      const reales = s.elementos.filter((e) => e.senal);
      const posible = reales.length ? reales.length * PUNTOS.senal : PUNTOS.normal;
      if (nada[s.id] === true) {
        if (reales.length) {
          c.puntos += PUNTOS.ignorar;
          c.r.ignoradas!++;
          c.errores++;
          c.comp('detectar', 0, posible);
          for (const e of reales) c.senal(e.senal!, false);
          total += reales.length;
          c.fallo(`Reto 1: «${s.titulo}» parecía normal y tenía ${reales.length} señales`);
        } else {
          c.puntos += PUNTOS.normal;
          c.aciertos++;
          c.comp('detectar', PUNTOS.normal, posible);
        }
        continue;
      }
      const elegidos = new Set(lista(marcas[s.id]));
      let ganado = 0;
      for (const e of s.elementos) {
        const marcado = elegidos.has(e.id);
        if (e.senal) {
          total++;
          c.senal(e.senal, marcado);
          if (marcado) {
            ganado += PUNTOS.senal;
            detectadas++;
            c.aciertos++;
          } else c.fallo(`Reto 1: se escapó «${e.texto}»`);
        } else if (marcado) {
          ganado += PUNTOS.falsaAlarma;
          c.r.falsasAlarmas!++;
          c.errores++;
        }
      }
      if (!reales.length && !elegidos.size) {
        // No marcaron nada, pero tampoco dijeron «nada extraño»: cuenta como normal reconocido.
        ganado += PUNTOS.normal;
        c.aciertos++;
      }
      c.puntos += ganado;
      c.comp('detectar', ganado, posible);
    }
    c.detalle.push(`${detectadas} de ${total} señales detectadas`);
    if (c.r.falsasAlarmas) c.detalle.push(`${c.r.falsasAlarmas} falsas alarmas`);
    if (c.r.ignoradas) c.detalle.push(`${c.r.ignoradas} situación con señales tomada como normal`);
  }

  if (numero === 2) {
    const pedidas = lista(r.pedidas)
      .filter((id) => SOLICITUDES.some((s) => s.id === id))
      .slice(0, FICHAS_CONSULTA);
    let pertinentes = 0;
    for (const id of pedidas) {
      const s = SOLICITUDES.find((x) => x.id === id)!;
      if (s.pertinente) {
        c.puntos += PUNTOS.informacion;
        pertinentes++;
        c.aciertos++;
      } else {
        c.puntos += PUNTOS.impertinente;
        c.errores++;
        c.fallo(`Reto 2: pidieron información que no corresponde («${s.nombre}»)`);
      }
    }
    c.comp('conocer', pertinentes * PUNTOS.informacion, FICHAS_CONSULTA * PUNTOS.informacion);
    for (const s of SOLICITUDES.filter((x) => x.clave && !pedidas.includes(x.id))) c.fallo(`Reto 2: no pidieron «${s.nombre}»`);
    const d = DECISION_R2.find((o) => o.id === r.decision);
    c.decision(d?.etiquetas ?? [], 'actuar', mejorDe(DECISION_R2));
    c.detalle.push(`${pertinentes} de ${FICHAS_CONSULTA} consultas pertinentes`, d ? `decisión: ${puntosDe(d.etiquetas) > 0 ? '✓' : '✗'}` : 'sin decisión');
  }

  if (numero === 3) {
    const marcados = new Set(lista(r.marcados));
    const cands = candidatosBf();
    let bien = 0;
    let ganado = 0;
    for (const k of cands) {
      const m = marcados.has(k.id);
      if (k.esBf && m) {
        ganado += PUNTOS.beneficiario;
        bien++;
        c.aciertos++;
      } else if (k.esBf) c.fallo(`Reto 3: no identificaron a ${k.nombre} como beneficiario final`);
      else if (m) {
        ganado += PUNTOS.falsaAlarma;
        c.r.falsasAlarmas!++;
        c.errores++;
        c.fallo(`Reto 3: marcaron a ${k.nombre} como beneficiario final`);
      }
    }
    const totalBf = cands.filter((k) => k.esBf).length;
    c.puntos += ganado;
    c.comp('conocer', ganado, totalBf * PUNTOS.beneficiario);
    c.senal('beneficiario', bien === totalBf);
    const d = DECISION_R3.find((o) => o.id === r.decision);
    c.decision(d?.etiquetas ?? [], 'actuar', mejorDe(DECISION_R3));
    c.detalle.push(`${bien} de ${totalBf} beneficiarios finales`);
  }

  if (numero === 4) {
    const ruta = lista(r.ruta);
    const rutaBien = ruta.length === RUTA_DINERO.length && ruta.every((id, i) => id === RUTA_DINERO[i]);
    if (rutaBien) c.aciertos++;
    else {
      c.errores++;
      c.fallo('Reto 4: no reconstruyeron bien el recorrido del dinero');
    }
    let ganado = rutaBien ? PUNTOS.ruta : 0;
    const marcas = obj(r.marcas); // movimientoId -> 'ok' | 'raro'
    for (const m of MOVIMIENTOS) {
      const v = marcas[m.id];
      if (m.inconsistente) {
        c.senal(m.senal!, v === 'raro');
        if (v === 'raro') {
          ganado += PUNTOS.senal;
          c.aciertos++;
        } else {
          ganado += PUNTOS.ignorar;
          c.r.ignoradas!++;
          c.errores++;
          c.fallo(`Reto 4: pasaron por alto «${m.de} → ${m.a}»`);
        }
      } else if (v === 'ok') {
        ganado += PUNTOS.normal;
        c.aciertos++;
      } else if (v === 'raro') {
        ganado += PUNTOS.falsaAlarma;
        c.r.falsasAlarmas!++;
        c.errores++;
      }
    }
    c.puntos += ganado;
    const posibleMov = PUNTOS.ruta + MOVIMIENTOS.reduce((s, m) => s + (m.inconsistente ? PUNTOS.senal : PUNTOS.normal), 0);
    c.comp('trazar', ganado, posibleMov);
    let preguntasBien = 0;
    for (const p of PREGUNTAS_R4) {
      const o = p.opciones.find((x) => x.id === obj(r.preguntas)[p.id]);
      const pts = o?.correcta ? PUNTOS[p.etiqueta] : 0;
      c.puntos += pts;
      c.comp(p.etiqueta === 'beneficiario' ? 'conocer' : 'trazar', pts, PUNTOS[p.etiqueta]);
      if (o?.correcta) {
        preguntasBien++;
        c.aciertos++;
      } else {
        c.errores++;
        c.fallo(`Reto 4: ${p.pregunta}`);
      }
    }
    c.detalle.push(rutaBien ? 'recorrido ✓' : 'recorrido ✗', `${MOVIMIENTOS.filter((m) => m.inconsistente && marcas[m.id] === 'raro').length} de ${MOVIMIENTOS.filter((m) => m.inconsistente).length} movimientos raros`, `${preguntasBien} de ${PREGUNTAS_R4.length} preguntas`);
  }

  if (numero === 5) {
    const colores = obj(r.colores);
    const razones = obj(r.razones);
    let bienColor = 0;
    let solidas = 0;
    for (const o of OPERACIONES) {
      const col = colores[o.id] as Color | undefined;
      const raz = o.razones.find((x) => x.id === razones[o.id]);
      let ganado = 0;
      if (col === o.color) {
        ganado += PUNTOS.color;
        bienColor++;
      } else if (col === 'verde' && o.color !== 'verde') {
        ganado += PUNTOS.ignorar;
        c.r.ignoradas!++;
        c.fallo(`Reto 5: pusieron en verde una operación ${COLORES[o.color].nombre.toLowerCase()}`);
      } else if (col && o.color === 'verde') {
        ganado += PUNTOS.falsaAlarma;
        c.r.falsasAlarmas!++;
      }
      for (const t of o.senales) c.senal(t, col === o.color || (col != null && col !== 'verde'));
      if (raz?.calidad === 'solida') {
        ganado += PUNTOS.razon;
        solidas++;
      } else if (raz?.calidad === 'automatica') {
        ganado += 5;
        c.fallo('Reto 5: justificaron con una respuesta automática');
      } else c.fallo('Reto 5: eligieron una razón equivocada');
      if (col === o.color && raz?.calidad === 'solida') c.aciertos++;
      else c.errores++;
      c.puntos += ganado;
      c.comp('analizar', ganado, PUNTOS.color + PUNTOS.razon);
    }
    c.detalle.push(`${bienColor} de ${OPERACIONES.length} colores`, `${solidas} de ${OPERACIONES.length} razones sólidas`);
  }

  if (numero === 6) {
    const el = obj(r.elecciones);
    for (const carta of CARTAS) {
      const o = carta.opciones.find((x) => x.id === el[carta.id]);
      const posible = mejorDe(carta.opciones);
      const p = c.decision(o?.etiquetas ?? [], 'actuar', posible);
      if (p < posible) c.fallo(`Reto 6: carta «${carta.titulo}»`);
    }
    c.detalle.push(`${c.aciertos} de ${CARTAS.length} cartas con la mejor decisión`);
    if (c.r.confidencial) c.detalle.push(`🗣️ ${c.r.confidencial} veces compartieron información reservada`);
  }

  if (numero === 7) {
    const el = obj(r.acciones);
    for (const a of ALERTAS) {
      const acc = el[a.id] as Accion | undefined;
      const p = puntosAlerta(a, acc && acc in ACCIONES ? acc : undefined);
      const posible = puntosDe(ETIQUETAS_ACCION[a.mejor]);
      c.puntos += p;
      c.comp('actuar', p, posible);
      if (acc === 'ignorar' && a.hayAlerta) c.r.ignoradas!++;
      if (acc === 'investigar') c.r.porCuentaPropia!++;
      if (acc === a.mejor) c.aciertos++;
      else {
        c.errores++;
        c.fallo(`Reto 7: «${a.texto.slice(0, 60)}…» pedía ${ACCIONES[a.mejor].nombre.toLowerCase()}`);
      }
    }
    c.detalle.push(`${c.aciertos} de ${ALERTAS.length} respuestas exactas`);
  }

  if (numero === 8) {
    const el = obj(r.elecciones);
    for (const paso of CASO_FINAL) {
      const o = paso.opciones.find((x) => x.id === el[paso.id]);
      const posible = mejorDe(paso.opciones);
      const p = c.decision(o?.etiquetas ?? [], paso.competencia, posible);
      if (paso.id === 'f1' || paso.id === 'f5') for (const t of ['perfil', 'reciente'] as TipoSenal[]) c.senal(t, p > 0);
      if (paso.id === 'f4') c.senal('tercero', p > 0);
      if (p < posible) c.fallo(`Caso final: «${paso.titulo}»`);
    }
    c.detalle.push(`${c.aciertos} de ${CASO_FINAL.length} decisiones completas`);
  }

  return { puntos: Math.max(0, c.puntos), aciertos: c.aciertos, errores: c.errores, detalle: c.detalle, resumen: c.r };
}

/** Puntaje máximo de cada reto (para mostrar «x de y»). */
export const MAXIMOS: Record<number, number> = {
  1: SITUACIONES.reduce((s, x) => s + (x.elementos.some((e) => e.senal) ? x.elementos.filter((e) => e.senal).length * PUNTOS.senal : PUNTOS.normal), 0),
  2: FICHAS_CONSULTA * PUNTOS.informacion + mejorDe(DECISION_R2),
  3: candidatosBf().filter((k) => k.esBf).length * PUNTOS.beneficiario + mejorDe(DECISION_R3),
  4: PUNTOS.ruta + MOVIMIENTOS.reduce((s, m) => s + (m.inconsistente ? PUNTOS.senal : PUNTOS.normal), 0) + PREGUNTAS_R4.reduce((s, p) => s + PUNTOS[p.etiqueta], 0),
  5: OPERACIONES.length * (PUNTOS.color + PUNTOS.razon),
  6: CARTAS.reduce((s, x) => s + mejorDe(x.opciones), 0),
  7: ALERTAS.reduce((s, a) => s + puntosDe(ETIQUETAS_ACCION[a.mejor]), 0),
  8: CASO_FINAL.reduce((s, x) => s + mejorDe(x.opciones), 0),
};

// ----------------------------------------------------------------------------
// Marcador, competencias, perfiles y certificación
// ----------------------------------------------------------------------------

export interface IntentoRr {
  equipo_id: string;
  reto: number;
  jugador_id: string | null;
  inicio: string;
  fin: string | null;
  aciertos: number;
  errores: number;
  puntos: number;
  resumen: ResumenRr | null;
}

export const COLABORACION_RR = { porPersona: 15, max: 60 };

export const PERFILES = {
  detective: { emoji: '🔎', nombre: 'Detective de Riesgos', ayuda: 'Detecta señales (80 % o más en detectar)' },
  analista: { emoji: '❓', nombre: 'Analista', ayuda: 'Hace buenas preguntas (80 % o más en conocer a la contraparte)' },
  guardian: { emoji: '🛡️', nombre: 'Guardián', ayuda: 'Escala correctamente y nunca compartió información reservada (80 % o más en escalar)' },
  navegante: { emoji: '🧭', nombre: 'Navegante', ayuda: 'Comprende el proceso completo (los 8 retos y 60 % o más en todas las competencias)' },
} as const;
export type ClavePerfil = keyof typeof PERFILES;

export const NIVELES_COMPRENSION = [
  { desde: 85, emoji: '🛡️', nombre: 'Guardián', ayuda: 'Domina la ruta y puede ayudar a otros.' },
  { desde: 70, emoji: '✅', nombre: 'Competente', ayuda: 'Reconoce las señales y activa la ruta.' },
  { desde: 50, emoji: '🌱', nombre: 'En desarrollo', ayuda: 'Reconoce varias señales, pero duda al actuar.' },
  { desde: 0, emoji: '🔰', nombre: 'Inicial', ayuda: 'Necesita refuerzo antes de tomar decisiones solo.' },
] as const;

export function nivelComprension(pct: number) {
  return NIVELES_COMPRENSION.find((n) => pct >= n.desde) ?? NIVELES_COMPRENSION[NIVELES_COMPRENSION.length - 1]!;
}

export interface MarcadorRr {
  equipoId: string;
  porReto: Record<number, IntentoRr | undefined>;
  retos: number;
  puntosRetos: number;
  colaboracion: number;
  participantes: number;
  total: number;
  /** % por competencia (null si todavía no la jugaron). */
  competencias: Record<Competencia, number | null>;
  comprension: number | null;
  ignoradas: number;
  sinInformacion: number;
  confidencial: number;
  porCuentaPropia: number;
  perfiles: ClavePerfil[];
  certificado: boolean;
  /** Qué le falta para certificar. */
  faltas: string[];
}

export function marcadorRr(equipoId: string, intentos: IntentoRr[], umbral = CONFIG_BASE.umbral): MarcadorRr {
  const suyos = intentos.filter((i) => i.equipo_id === equipoId && i.fin);
  const porReto: Record<number, IntentoRr | undefined> = {};
  for (const i of suyos) porReto[i.reto] = i;
  const participantes = new Set(suyos.map((i) => i.jugador_id).filter(Boolean)).size;
  const colaboracion = participantes > 1 ? Math.min(COLABORACION_RR.max, (participantes - 1) * COLABORACION_RR.porPersona) : 0;
  const puntosRetos = suyos.reduce((s, i) => s + i.puntos, 0);

  const suma: Partial<Record<Competencia, [number, number]>> = {};
  let ignoradas = 0;
  let sinInformacion = 0;
  let confidencial = 0;
  let porCuentaPropia = 0;
  for (const i of suyos) {
    const res = i.resumen ?? {};
    for (const [k, v] of Object.entries(res.comp ?? {}) as [Competencia, [number, number]][]) {
      const [g, p] = suma[k] ?? [0, 0];
      suma[k] = [g + v[0], p + v[1]];
    }
    ignoradas += res.ignoradas ?? 0;
    sinInformacion += res.sinInformacion ?? 0;
    confidencial += res.confidencial ?? 0;
    porCuentaPropia += res.porCuentaPropia ?? 0;
  }
  const competencias = Object.fromEntries(
    CLAVES_COMPETENCIA.map((k) => {
      const v = suma[k];
      return [k, v && v[1] > 0 ? Math.round((v[0] / v[1]) * 100) : null];
    }),
  ) as Record<Competencia, number | null>;
  const jugadas = CLAVES_COMPETENCIA.map((k) => competencias[k]).filter((v): v is number => v != null);
  const comprension = jugadas.length ? Math.round(jugadas.reduce((s, v) => s + v, 0) / jugadas.length) : null;
  const pct = (k: Competencia) => competencias[k] ?? 0;

  const perfiles: ClavePerfil[] = [];
  if (pct('detectar') >= 80) perfiles.push('detective');
  if (pct('conocer') >= 80) perfiles.push('analista');
  if (pct('actuar') >= 80 && confidencial === 0) perfiles.push('guardian');
  if (suyos.length >= RETOS.length && CLAVES_COMPETENCIA.every((k) => pct(k) >= 60)) perfiles.push('navegante');

  const faltas: string[] = [];
  for (const k of CLAVES_COMPETENCIA) if (pct(k) < umbral) faltas.push(`${COMPETENCIAS[k].emoji} ${COMPETENCIAS[k].nombre}: ${competencias[k] == null ? 'sin jugar' : `${pct(k)} %`} (mínimo ${umbral} %)`);
  if (confidencial > 0) faltas.push(`🗣️ Compartió información reservada ${confidencial} ${confidencial === 1 ? 'vez' : 'veces'}`);
  if (!porReto[8]) faltas.push('🏁 Falta el caso final');

  return {
    equipoId,
    porReto,
    retos: suyos.length,
    puntosRetos,
    colaboracion,
    participantes,
    total: puntosRetos + colaboracion,
    competencias,
    comprension,
    ignoradas,
    sinInformacion,
    confidencial,
    porCuentaPropia,
    perfiles,
    certificado: faltas.length === 0,
    faltas,
  };
}

// ----------------------------------------------------------------------------
// Cierre y evaluación: dificultad, errores frecuentes y opciones de mejora
// ----------------------------------------------------------------------------

/** Señales ordenadas de la más difícil a la más fácil (según todos los equipos). */
export function dificultadSenales(intentos: IntentoRr[]) {
  const suma = new Map<TipoSenal, [number, number]>();
  for (const i of intentos.filter((x) => x.fin)) {
    for (const [k, v] of Object.entries(i.resumen?.senales ?? {}) as [TipoSenal, [number, number]][]) {
      const [d, n] = suma.get(k) ?? [0, 0];
      suma.set(k, [d + v[0], n + v[1]]);
    }
  }
  return [...suma.entries()]
    .filter(([, [, n]]) => n > 0)
    .map(([k, [d, n]]) => ({ tipo: k, detectadas: d, total: n, pct: Math.round((d / n) * 100) }))
    .sort((a, b) => a.pct - b.pct);
}

/** Los errores que más se repiten entre equipos. */
export function erroresFrecuentes(intentos: IntentoRr[], max = 8) {
  const cuenta = new Map<string, Set<string>>();
  for (const i of intentos.filter((x) => x.fin)) {
    for (const f of new Set(i.resumen?.fallos ?? [])) {
      if (!cuenta.has(f)) cuenta.set(f, new Set());
      cuenta.get(f)!.add(i.equipo_id);
    }
  }
  return [...cuenta.entries()]
    .map(([texto, equipos]) => ({ texto, equipos: equipos.size }))
    .sort((a, b) => b.equipos - a.equipos || a.texto.localeCompare(b.texto))
    .slice(0, max);
}

/** Promedio de cada competencia entre los equipos que la jugaron. */
export function promedioCompetencias(marcadores: MarcadorRr[]) {
  return CLAVES_COMPETENCIA.map((k) => {
    const v = marcadores.map((m) => m.competencias[k]).filter((x): x is number => x != null);
    return { competencia: k, promedio: v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : null, equipos: v.length };
  });
}

const REFUERZO: Record<Competencia, { titulo: string; herramienta: string; detalle: string }> = {
  detectar: {
    titulo: 'Reforzar el reconocimiento de señales de alerta',
    herramienta: 'Catálogo de señales de alerta con casos de la empresa',
    detalle: 'Armen con el equipo un catálogo corto de señales de alerta propias del negocio (clientes, proveedores, pagos) con un ejemplo real de cada una y repásenlo en la inducción.',
  },
  conocer: {
    titulo: 'Reforzar la debida diligencia y el beneficiario final',
    herramienta: 'Lista de chequeo de conocimiento de la contraparte',
    detalle: 'Definan una lista de chequeo de una página: qué información es obligatoria, cuándo se pide más (debida diligencia intensificada) y cómo se identifica al beneficiario final.',
  },
  analizar: {
    titulo: 'Unificar los criterios del semáforo de riesgo',
    herramienta: 'Matriz de riesgo con criterios verde, amarillo y rojo',
    detalle: 'Escriban qué hace que una operación sea verde, amarilla o roja en su empresa, con ejemplos. Así el análisis no depende del criterio de cada persona.',
  },
  trazar: {
    titulo: 'Entrenar la trazabilidad de los pagos',
    herramienta: 'Regla de pagos: quién paga, quién recibe y por qué',
    detalle: 'Acuerden que ningún pago se recibe de un tercero ni se gira a una cuenta distinta del beneficiario sin verificación y registro. Practiquen con pagos reales anonimizados.',
  },
  actuar: {
    titulo: 'Hacer visible la ruta de escalamiento',
    herramienta: 'Ruta de escalamiento de una página',
    detalle: 'Publiquen en una página a quién se escala, por qué canal, en cuánto tiempo y qué NO se hace (avisar al cliente, investigar por cuenta propia). Pongan un ejemplo de reporte interno bien hecho.',
  },
};

export interface RecomendacionRr {
  ref: string;
  prioridad: 'alta' | 'media' | 'baja';
  titulo: string;
  detalle: string;
  herramienta?: string;
}

export function recomendacionesRr(equipos: { id: string; nombre: string; emoji: string }[], intentos: IntentoRr[], config: ConfigRuta): RecomendacionRr[] {
  const r: RecomendacionRr[] = [];
  const marcadores = equipos.map((e) => marcadorRr(e.id, intentos, config.umbral));
  const conJuego = marcadores.filter((m) => m.retos > 0);

  // Competencias por debajo del umbral.
  for (const { competencia, promedio } of promedioCompetencias(conJuego)) {
    if (promedio == null || promedio >= config.umbral) continue;
    const x = REFUERZO[competencia];
    r.push({
      ref: `rr-comp-${competencia}`,
      prioridad: promedio < 50 ? 'alta' : 'media',
      titulo: `${x.titulo} (promedio ${promedio} %)`,
      detalle: conRuta(x.detalle, config),
      herramienta: x.herramienta,
    });
  }

  // Señales con mayor dificultad.
  const dificiles = dificultadSenales(intentos).filter((s) => s.pct < 60);
  if (dificiles.length) {
    r.push({
      ref: 'rr-senales-dificiles',
      prioridad: dificiles.length >= 3 ? 'alta' : 'media',
      titulo: `Incluir en la capacitación las señales que más se escaparon: ${dificiles
        .slice(0, 4)
        .map((s) => `${SENALES[s.tipo].emoji} ${SENALES[s.tipo].nombre.toLowerCase()}`)
        .join('; ')}`,
      detalle: `Menos del 60 % de las veces se reconocieron. Usen un caso real de la empresa para cada una y pregunten: «¿qué haría usted?».`,
      herramienta: 'Casos cortos de señales de alerta',
    });
  }

  const confidencial = conJuego.reduce((s, m) => s + m.confidencial, 0);
  if (confidencial > 0) {
    r.push({
      ref: 'rr-reserva',
      prioridad: 'alta',
      titulo: `Reforzar la reserva de la información (${confidencial} ${confidencial === 1 ? 'vez se compartió' : 'veces se compartió'} información reservada en el juego)`,
      detalle: 'Recordar que no se le cuenta a la contraparte ni a otros compañeros que una operación se está analizando o se reportó. Incluyan frases modelo para responder al cliente sin revelar nada.',
      herramienta: 'Guion de respuesta al cliente y compromiso de confidencialidad',
    });
  }

  const ignoradas = conJuego.reduce((s, m) => s + m.ignoradas, 0);
  if (ignoradas > 0) {
    r.push({
      ref: 'rr-ignorar',
      prioridad: 'alta',
      titulo: `Nadie ignora una alerta: ${ignoradas} ${ignoradas === 1 ? 'alerta fue ignorada' : 'alertas fueron ignoradas'} en el juego`,
      detalle: conRuta('Dejen claro que ante cualquier señal lo mínimo es documentar y consultar con {responsable}. Quien reporta de buena fe está protegido; quien calla expone a la empresa.', config),
      herramienta: 'Regla «ante la duda, se consulta»',
    });
  }

  const sinInfo = conJuego.reduce((s, m) => s + m.sinInformacion, 0);
  if (sinInfo > 0) {
    r.push({
      ref: 'rr-sin-informacion',
      prioridad: 'media',
      titulo: `Definir qué información es obligatoria antes de aprobar (${sinInfo} decisiones sin información suficiente)`,
      detalle: 'La urgencia comercial, la confianza personal o la orden de un jefe llevaron a decidir sin información. Acuerden que sin la información mínima no se aprueba, y quién puede autorizar excepciones.',
      herramienta: 'Requisitos mínimos de vinculación y aprobación',
    });
  }

  const porCuenta = conJuego.reduce((s, m) => s + m.porCuentaPropia, 0);
  if (porCuenta > 0) {
    r.push({
      ref: 'rr-por-cuenta',
      prioridad: 'media',
      titulo: 'Aclarar el rol de cada persona: reconocer y reportar, no investigar',
      detalle: conRuta('Hubo decisiones de investigar por cuenta propia. El análisis le corresponde a {responsable}; el resto del equipo reconoce, documenta y escala.', config),
      herramienta: 'Roles y responsabilidades del sistema de prevención',
    });
  }

  const sinCertificar = conJuego.filter((m) => !m.certificado);
  if (sinCertificar.length) {
    const nombres = sinCertificar.map((m) => equipos.find((e) => e.id === m.equipoId)).filter(Boolean).map((e) => `${e!.emoji} ${e!.nombre}`);
    r.push({
      ref: 'rr-refuerzo-equipos',
      prioridad: 'media',
      titulo: `Plan de refuerzo para los equipos que no certificaron como Guardianes del Riesgo (${sinCertificar.length} de ${conJuego.length})`,
      detalle: `${nombres.join(', ')}. Repitan los retos de las competencias más bajas en 30 días y validen de nuevo.`,
      herramienta: 'Repetir los retos con casos propios',
    });
  }

  r.push({
    ref: 'rr-procedimiento',
    prioridad: 'baja',
    titulo: 'Configurar los casos con el procedimiento real de la empresa',
    detalle: 'Las reglas concretas, los responsables, los umbrales y las rutas de reporte dependen del tipo de entidad y de su sistema de prevención. Revisen el manual con el oficial de cumplimiento y ajusten los casos del juego.',
    herramienta: `Manual ${MARCOS[config.marco].nombre} de la empresa`,
  });
  r.push({
    ref: 'rr-monitoreo',
    prioridad: 'baja',
    titulo: 'Repetir el juego cada año y con cada persona nueva',
    detalle: 'La prevención es un hábito: inclúyanlo en la inducción de cargos expuestos (comercial, compras, tesorería) y midan cuántas operaciones inusuales se reportan internamente antes y después.',
    herramienta: 'Plan anual de capacitación',
  });

  const orden = { alta: 0, media: 1, baja: 2 };
  return r.sort((a, b) => orden[a.prioridad] - orden[b.prioridad]);
}

export function pesosRr(v: number) {
  return v >= 1_000_000 ? `$${(v / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} millones` : `$${Math.round(v).toLocaleString('es-CO')}`;
}
