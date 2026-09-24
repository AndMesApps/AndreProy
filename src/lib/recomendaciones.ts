/**
 * Opciones de mejora automáticas a partir de los resultados de cada juego.
 * Son reglas de ingeniería de procesos (Lean) aplicadas a los datos: no
 * reemplazan el criterio de la facilitadora, le dan un punto de partida para
 * el informe y para el plan de acción del Control de procesos.
 * Funciones puras: sirven en el servidor y en el navegador.
 */
import {
  CLASIFICACIONES,
  DESPERDICIOS,
  formatearDuracion,
  type MetricasProceso,
  type TipoDesperdicio,
} from '@/lib/makigami';
import { errorPrediccion, formatearPct, tarjetaCompleta, type MarcadorEquipo, type TarjetaMinima } from '@/lib/kaizen';

export type Prioridad = 'alta' | 'media' | 'baja';

export interface Recomendacion {
  /** Identificador estable: evita enviar la misma recomendación dos veces al plan de acción. */
  ref: string;
  prioridad: Prioridad;
  titulo: string;
  detalle: string;
  /** Herramienta Lean sugerida. */
  herramienta?: string;
}

export const PRIORIDADES: Record<Prioridad, { nombre: string; clase: string; orden: number }> = {
  alta: { nombre: 'Prioridad alta', clase: 'bg-red-100 text-bajo', orden: 0 },
  media: { nombre: 'Prioridad media', clase: 'bg-amber-100 text-medio', orden: 1 },
  baja: { nombre: 'Prioridad baja', clase: 'bg-marmol-100 text-marmol-600', orden: 2 },
};

function ordenar(lista: Recomendacion[]) {
  return lista.sort((a, b) => PRIORIDADES[a.prioridad].orden - PRIORIDADES[b.prioridad].orden);
}

// ----------------------------------------------------------------------------
// Cacería Makigami
// ----------------------------------------------------------------------------

/** Qué hacer contra cada desperdicio en un proceso de oficina. */
export const CONTRAMEDIDAS: Record<TipoDesperdicio, { herramienta: string; accion: string }> = {
  esperas: {
    herramienta: 'Acuerdos de nivel de servicio (ANS) y flujo continuo',
    accion: 'Fijen un tiempo máximo de respuesta para cada aprobación, deleguen firmas de bajo monto y dejen de trabajar por lotes.',
  },
  traspasos: {
    herramienta: 'Dueño de proceso de principio a fin',
    accion: 'Nombren un responsable único del caso, combinen pasos de la misma área y eliminen los “pase por aquí” que no agregan nada.',
  },
  sobreprocesamiento: {
    herramienta: 'Estandarización y captura única del dato',
    accion: 'Eliminen las revisiones dobles, digiten cada dato una sola vez y usen un formato estándar con lo mínimo necesario.',
  },
  defectos: {
    herramienta: 'Poka-yoke (a prueba de errores) y calidad en la fuente',
    accion: 'Pongan validaciones y campos obligatorios en el formato, una lista de chequeo antes de enviar y busquen la causa raíz con los 5 porqués.',
  },
  movimiento: {
    herramienta: '5S digital',
    accion: 'Un repositorio único y ordenado, nombres de archivo estándar y la información que se usa siempre a un clic.',
  },
  inventario: {
    herramienta: 'Kanban y límite de trabajo en curso',
    accion: 'Atiendan por orden de llegada, pongan un tablero visible de solicitudes y un límite de casos abiertos por persona.',
  },
  sobreproduccion: {
    herramienta: 'Producir solo lo que el cliente usa (pull)',
    accion: 'Pregunten a quien recibe cada informe o copia si lo usa; lo que nadie usa, se deja de hacer.',
  },
  talento: {
    herramienta: 'Automatización y sistema de ideas',
    accion: 'Automaticen las tareas mecánicas (formularios, recordatorios, reportes) y abran un canal para que el equipo proponga mejoras.',
  },
};

export interface DatosInformeMakigami {
  metricas: MetricasProceso;
  traspasos: number;
  pasos: { id: string; orden: number; descripcion: string; tiempo_espera_min: number; tiempo_trabajo_min: number; clasificacion: keyof typeof CLASIFICACIONES | null; carril: string }[];
  /** Cazas por tipo de desperdicio (cuántas veces lo marcaron). */
  cazasPorTipo: Map<TipoDesperdicio, number>;
  propuestas: { id: string; descripcion: string; ahorro_estimado_min: number; estado: 'propuesta' | 'aprobada' | 'descartada'; votos: number; paso: string | null }[];
}

export function recomendacionesMakigami(d: DatosInformeMakigami): Recomendacion[] {
  const r: Recomendacion[] = [];
  const { metricas: m } = d;
  const total = m.tiempoTotal || 1;

  // 1. Mejoras aprobadas por el grupo: son el plan de acción natural.
  for (const p of d.propuestas.filter((p) => p.estado === 'aprobada').sort((a, b) => b.ahorro_estimado_min - a.ahorro_estimado_min)) {
    r.push({
      ref: `mk-propuesta-${p.id}`,
      prioridad: p.ahorro_estimado_min >= total * 0.1 ? 'alta' : 'media',
      titulo: `Implementar: ${p.descripcion.length > 90 ? `${p.descripcion.slice(0, 90)}…` : p.descripcion}`,
      detalle: `Mejora aprobada en el rediseño${p.paso ? ` (paso: ${p.paso})` : ''}. Ahorro estimado: ${formatearDuracion(p.ahorro_estimado_min)}. Asignen responsable y fecha, y midan el tiempo total antes y después.`,
    });
  }

  // 2. Esperas: casi siempre el mayor desperdicio de un proceso administrativo.
  if (m.espera / total >= 0.5) {
    const top = [...d.pasos].sort((a, b) => b.tiempo_espera_min - a.tiempo_espera_min).filter((p) => p.tiempo_espera_min > 0).slice(0, 3);
    r.push({
      ref: 'mk-esperas',
      prioridad: 'alta',
      titulo: `Atacar primero las esperas: son el ${Math.round((m.espera / total) * 100)} % del tiempo total`,
      detalle: `El trabajo pasa la mayor parte del tiempo quieto. Las esperas más largas: ${top.map((p) => `paso ${p.orden} «${p.descripcion}» (${formatearDuracion(p.tiempo_espera_min)})`).join('; ')}. ${CONTRAMEDIDAS.esperas.accion}`,
      herramienta: CONTRAMEDIDAS.esperas.herramienta,
    });
  }

  // 3. Eficiencia muy baja.
  if (m.tiempoTotal > 0 && m.eficiencia < 10) {
    r.push({
      ref: 'mk-eficiencia',
      prioridad: 'alta',
      titulo: `Solo el ${m.eficiencia < 1 ? 'menos de 1' : Math.round(m.eficiencia)} % del tiempo agrega valor`,
      detalle: `De ${formatearDuracion(m.tiempoTotal)} de proceso, solo ${formatearDuracion(m.valorAgregado)} transforman algo que el cliente valora. Una meta realista para el primer ciclo de mejora es duplicar esa eficiencia recortando esperas y pasos que no agregan valor.`,
      herramienta: 'Mapa de flujo de valor (VSM) del estado futuro',
    });
  }

  // 4. Pasos marcados como desperdicio por el facilitador.
  const desperdicio = d.pasos.filter((p) => p.clasificacion === 'desperdicio');
  if (desperdicio.length) {
    r.push({
      ref: 'mk-pasos-desperdicio',
      prioridad: 'alta',
      titulo: `Eliminar ${desperdicio.length === 1 ? 'el paso que es desperdicio' : `los ${desperdicio.length} pasos que son desperdicio`}`,
      detalle: `${desperdicio.map((p) => `paso ${p.orden} «${p.descripcion}» (${p.carril})`).join('; ')}. Antes de eliminarlos confirmen con el dueño del proceso que ningún requisito legal o de control depende de ellos.`,
      herramienta: 'ECRS: eliminar, combinar, reordenar, simplificar',
    });
  }

  // 5. Traspasos.
  if (d.traspasos >= 5 || (d.pasos.length > 0 && d.traspasos / d.pasos.length > 0.5)) {
    r.push({
      ref: 'mk-traspasos',
      prioridad: 'media',
      titulo: `Reducir los ${d.traspasos} traspasos entre áreas`,
      detalle: `Cada traspaso es una cola, un riesgo de error y una espera. ${CONTRAMEDIDAS.traspasos.accion}`,
      herramienta: CONTRAMEDIDAS.traspasos.herramienta,
    });
  }

  // 6. Los desperdicios que más cazaron los equipos.
  const tipos = [...d.cazasPorTipo.entries()].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
  tipos.forEach(([tipo, n], i) => {
    if (tipo === 'esperas' && r.some((x) => x.ref === 'mk-esperas')) return;
    if (tipo === 'traspasos' && r.some((x) => x.ref === 'mk-traspasos')) return;
    r.push({
      ref: `mk-desperdicio-${tipo}`,
      prioridad: i === 0 ? 'alta' : 'media',
      titulo: `${DESPERDICIOS[tipo].emoji} ${DESPERDICIOS[tipo].nombre}: lo marcaron ${n} ${n === 1 ? 'vez' : 'veces'}`,
      detalle: CONTRAMEDIDAS[tipo].accion,
      herramienta: CONTRAMEDIDAS[tipo].herramienta,
    });
  });

  // 7. Ideas con apoyo del grupo que no se han resuelto.
  const pendientes = d.propuestas.filter((p) => p.estado === 'propuesta' && p.votos > 0).sort((a, b) => b.votos - a.votos).slice(0, 3);
  if (pendientes.length) {
    r.push({
      ref: 'mk-propuestas-votadas',
      prioridad: 'baja',
      titulo: 'Evaluar las ideas con más votos que no se aprobaron',
      detalle: pendientes.map((p) => `«${p.descripcion}» (${p.votos} ${p.votos === 1 ? 'voto' : 'votos'})`).join('; '),
    });
  }

  // 8. Sostener: medir.
  r.push({
    ref: 'mk-medir',
    prioridad: 'baja',
    titulo: 'Medir el tiempo total del proceso cada semana',
    detalle: `Línea base de hoy: ${formatearDuracion(m.tiempoTotal)}. Registren el indicador en el Control de procesos para comprobar que las mejoras se sostienen.`,
    herramienta: 'Control de procesos',
  });

  return ordenar(r);
}

// ----------------------------------------------------------------------------
// Carrera Kaizen
// ----------------------------------------------------------------------------

export interface DatosInformeKaizen {
  unidad: string;
  equipos: { id: string; nombre: string; emoji: string }[];
  marcadores: Map<string, MarcadorEquipo>;
  tarjetas: (TarjetaMinima & { id: string })[];
}

export function recomendacionesKaizen(d: DatosInformeKaizen): Recomendacion[] {
  const r: Recomendacion[] = [];
  const nombre = (id: string) => {
    const e = d.equipos.find((x) => x.id === id);
    return e ? `${e.emoji} ${e.nombre}` : 'un equipo';
  };
  const rondas = [...d.marcadores.values()].flatMap((m) => m.rondas);
  const conResultado = rondas.filter((x) => x.resultado);

  // 1. Las ideas que funcionaron: estandarizarlas y replicarlas.
  const exitosas = rondas
    .filter((x) => x.tarjeta && x.mejoraPct != null && x.mejoraPct > 0 && x.tarjeta.idea.trim())
    .sort((a, b) => (b.mejoraPct ?? 0) - (a.mejoraPct ?? 0));
  for (const x of exitosas.slice(0, 5)) {
    const t = d.tarjetas.find((t) => t.equipo_id === x.tarjeta!.equipo_id && t.ronda === x.ronda);
    r.push({
      ref: `kz-idea-${t?.id ?? `${x.tarjeta!.equipo_id}-${x.ronda}`}`,
      prioridad: (x.mejoraPct ?? 0) >= 20 ? 'alta' : 'media',
      titulo: `Estandarizar y replicar: ${x.tarjeta!.idea}`,
      detalle: `Idea de ${nombre(x.tarjeta!.equipo_id)} en la ronda ${x.ronda}: mejoró ${formatearPct(x.mejoraPct)}. ${x.tarjeta!.decision === 'estandar' ? 'El equipo ya la adoptó como estándar.' : 'El equipo no la adoptó como estándar: revisen por qué.'} Documéntenla en una hoja de trabajo estándar y enséñenla a todos.`,
      herramienta: 'Trabajo estandarizado',
    });
  }

  // 2. Calidad.
  const buenas = conResultado.reduce((s, x) => s + x.resultado!.unidades_buenas, 0);
  const defectos = conResultado.reduce((s, x) => s + x.resultado!.defectos, 0);
  const tasa = buenas + defectos > 0 ? defectos / (buenas + defectos) : 0;
  if (tasa >= 0.1) {
    r.push({
      ref: 'kz-calidad',
      prioridad: 'alta',
      titulo: `El ${Math.round(tasa * 100)} % de lo producido salió con defecto`,
      detalle: `Producir rápido no sirve si hay que rehacer. Definan un estándar visual de “unidad buena”, revisen en cada puesto en vez de al final y hagan a prueba de errores los pasos donde más se falla.`,
      herramienta: 'Calidad en la fuente y poka-yoke',
    });
  }

  // 3. Predicciones: ¿los equipos saben estimar su capacidad?
  const conPrediccion = rondas.filter((x) => x.tarjeta?.prediccion != null && x.resultado);
  if (conPrediccion.length >= 2) {
    const errores = conPrediccion.map((x) => errorPrediccion(x.tarjeta!.prediccion!, x.resultado!.unidades_buenas));
    const promedio = errores.reduce((s, e) => s + e, 0) / errores.length;
    const sesgo = conPrediccion.reduce((s, x) => s + (x.tarjeta!.prediccion! - x.resultado!.unidades_buenas), 0) / conPrediccion.length;
    if (promedio > 0.25) {
      r.push({
        ref: 'kz-prediccion',
        prioridad: 'media',
        titulo: `Las predicciones fallaron en promedio un ${Math.round(promedio * 100)} %`,
        detalle: `Los equipos tienden a ${sesgo > 0 ? 'sobreestimar' : 'subestimar'} el efecto de sus ideas. Antes de comprometer metas en el proceso real, midan una línea base y prueben las mejoras en pequeño.`,
        herramienta: 'Ciclo PDCA con línea base',
      });
    }
  }

  // 4. Análisis de causa raíz.
  const tarjetas = d.tarjetas.filter((t) => t.ronda > 1);
  const incompletas = tarjetas.filter((t) => !tarjetaCompleta(t)).length;
  if (tarjetas.length >= 2 && incompletas / tarjetas.length > 0.4) {
    r.push({
      ref: 'kz-causa-raiz',
      prioridad: 'media',
      titulo: `${incompletas} de ${tarjetas.length} tarjetas Kaizen quedaron incompletas`,
      detalle: 'Los equipos saltan del problema a la solución sin buscar la causa. Refuercen los 5 porqués y el diagrama de causa y efecto (Ishikawa) antes de proponer ideas.',
      herramienta: '5 porqués e Ishikawa',
    });
  }

  // 5. Decisiones contra los datos.
  const incoherentes = rondas.filter(
    (x) => x.tarjeta?.decision && x.mejoraPct != null && ((x.tarjeta.decision === 'estandar' && x.mejoraPct <= 0) || (x.tarjeta.decision === 'descartada' && x.mejoraPct > 0)),
  );
  if (incoherentes.length) {
    r.push({
      ref: 'kz-decisiones',
      prioridad: 'media',
      titulo: `${incoherentes.length} ${incoherentes.length === 1 ? 'decisión fue' : 'decisiones fueron'} contra lo que decían los datos`,
      detalle: `${incoherentes.map((x) => `${nombre(x.tarjeta!.equipo_id)} en la ronda ${x.ronda}`).join('; ')}. Acordar que una idea solo se vuelve estándar si el indicador mejora evita adoptar cambios por gusto.`,
      herramienta: 'Decisiones basadas en datos',
    });
  }

  // 6. Equipos estancados y diferencias entre equipos.
  const finales = [...d.marcadores.values()].filter((m) => m.ultima != null && m.lineaBase != null);
  for (const m of finales.filter((m) => (m.mejoraTotalPct ?? 0) <= 0 && m.rondas.filter((x) => x.resultado).length > 1)) {
    r.push({
      ref: `kz-estancado-${m.equipoId}`,
      prioridad: 'media',
      titulo: `Acompañar a ${nombre(m.equipoId)}: no superó su línea base`,
      detalle: `Terminó con ${m.ultima} frente a ${m.lineaBase} de la ronda 1. Revisen con el equipo qué probaron y ayúdenlos a elegir una sola causa a la vez.`,
      herramienta: 'Coaching Kata',
    });
  }
  if (finales.length >= 2) {
    const orden = [...finales].sort((a, b) => b.ultima! - a.ultima!);
    const mejor = orden[0]!;
    const peor = orden[orden.length - 1]!;
    if (peor.ultima! > 0 && mejor.ultima! / peor.ultima! >= 1.5) {
      r.push({
        ref: 'kz-benchmarking',
        prioridad: 'media',
        titulo: `${nombre(mejor.equipoId)} produce ${(mejor.ultima! / peor.ultima!).toFixed(1)} veces más que ${nombre(peor.equipoId)}`,
        detalle: `Con el mismo material y el mismo tiempo, el método hace la diferencia. Hagan que el mejor equipo muestre cómo trabaja (${mejor.estandares.map((t) => t.idea).join('; ') || 'sus estándares'}) y que los demás lo adopten.`,
        herramienta: 'Benchmarking interno y yokoten (replicar lo que funciona)',
      });
    }
  }

  // 7. Llevarlo al trabajo real.
  r.push({
    ref: 'kz-proceso-real',
    prioridad: 'baja',
    titulo: 'Llevar el método a un proceso real del equipo',
    detalle: 'Elijan un proceso del día a día, midan su línea base y hagan un ciclo PDCA por semana con una mejora a la vez. Regístrenlo en el Control de procesos.',
    herramienta: 'Control de procesos',
  });

  return ordenar(r);
}
