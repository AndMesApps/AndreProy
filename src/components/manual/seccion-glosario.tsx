import { Pregunta, Seccion, Sub, Tabla } from './piezas';

export function SeccionGlosario() {
  return (
    <>
      <Seccion id="preguntas" emoji="🙋" titulo="Preguntas frecuentes" resumen="Dudas comunes, respondidas en una o dos frases.">
        <div className="space-y-2">
          <Pregunta p="¿Se guarda todo automáticamente?">
            <p>Sí, apenas tocas Guardar, Registrar o cambias un estado. No hay que exportar ni guardar archivos.</p>
          </Pregunta>
          <Pregunta p="¿Puedo usar la app en el celular?">
            <p>Sí. Todo funciona en el celular; en pantallas pequeñas algunas tablas se desplazan de lado con el dedo.</p>
          </Pregunta>
          <Pregunta p="¿Cómo le mando al cliente un informe?">
            <p>Abre el informe (del proyecto, del proceso o del juego), toca «Imprimir o guardar PDF», elige «Guardar como PDF» y envía el archivo.</p>
          </Pregunta>
          <Pregunta p="Borré algo por error, ¿se puede recuperar?">
            <p>No. Por eso la app siempre pide confirmar antes de borrar. Si dudas, en vez de borrar usa «Archivar» (procesos), «Cancelado» (proyectos) o «Descartada» (acciones).</p>
          </Pregunta>
          <Pregunta p="¿Los clientes o jugadores pueden ver mis proyectos o mis finanzas?">
            <p>No. Los jugadores solo ven el juego al que entraron. Los proyectos, procesos y finanzas solo los ven tú y los administradores.</p>
          </Pregunta>
          <Pregunta p="¿Qué son los datos de «Demostración»?">
            <p>
              Son ejemplos inventados (Distribuidora Andina, Confecciones Río Claro, Metalmecánica del Sur, Clínica Santa Lucía, el reto CAZA26, la carrera KAIZ26, el Reto 5S LIMP26, el caso MudaLab MUDA26 y la Ruta del Riesgo RIES26) para
              ver cómo fluye la información. Todos tienen el grupo «Demostración» y se pueden borrar cuando empieces con tus clientes reales.
            </p>
          </Pregunta>
          <Pregunta p="¿Qué hago si algo no carga o se ve raro?">
            <p>Recarga la página (tecla F5 o arrastra hacia abajo en el celular). Si sigue igual, cierra sesión con «Salir» y vuelve a entrar.</p>
          </Pregunta>
        </div>
      </Seccion>

      <Seccion id="glosario" emoji="📖" titulo="Glosario" resumen="Las palabras técnicas que usa la app, explicadas sin enredos.">
        <Sub titulo="Mejora continua y Lean">
          <Tabla
            filas={[
              ['Lean', 'Forma de trabajar que busca quitar todo lo que no agrega valor al cliente.'],
              ['Desperdicio', 'Todo lo que gasta tiempo o esfuerzo y no le agrega valor a quien recibe el resultado. Ej.: esperar una firma dos días.'],
              ['Agrega valor', 'Lo que transforma algo y el cliente pagaría por ello.'],
              ['Eficiencia del proceso', 'Qué porcentaje del tiempo total agrega valor. Ej.: 3 horas de 12 días ≈ 1 %.'],
              ['Traspaso', 'Cada vez que el trabajo pasa de un área a otra. Cada traspaso trae cola y riesgo de error.'],
              ['Makigami', 'Mapa del proceso en forma de rollo, con carriles por área y pasos con tiempos.'],
              ['Kaizen', '«Cambio para mejor»: mejoras pequeñas, una a la vez, comprobadas con datos.'],
              ['PDCA', 'Planear, Hacer (Do), Verificar (Check), Actuar: el ciclo para mejorar con método.'],
              ['5 porqués', 'Preguntar «¿por qué?» varias veces hasta llegar a la causa de fondo de un problema.'],
              ['Estándar', 'La forma acordada de hacer algo, que todos siguen hasta que se mejore.'],
              ['Poka-yoke', 'Algo que hace imposible (o muy difícil) cometer un error. Ej.: un campo obligatorio.'],
              ['5S digital', 'Orden de la información: cada archivo en su lugar y fácil de encontrar.'],
              ['5S', 'Clasificar (Seiri), Ordenar (Seiton), Limpiar (Seiso), Estandarizar (Seiketsu) y Sostener (Shitsuke).'],
              ['Tarjeta roja', 'Etiqueta para lo dudoso: se aparta en una zona y se decide en una fecha si se queda o sale.'],
              ['Tablero de sombras', 'Tablero con la silueta de cada herramienta: si falta una, se ve de inmediato.'],
              ['Control visual', 'Señal que muestra de un vistazo si algo está bien o mal: etiquetas, colores, marcas en el piso, niveles mínimo y máximo.'],
              ['Auditoría 5S', 'Calificación de 0 a 4 de cada S en un espacio; el resultado es el % 5S.'],
              ['Muda', 'Palabra japonesa para desperdicio. Hay 8: transporte, inventario, movimiento, espera, sobreproducción, sobreprocesamiento, defectos y talento no aprovechado.'],
              ['Gemba', '«El lugar real»: donde pasan las cosas. Ir al Gemba es ver el proceso con los propios ojos, no en el manual.'],
              ['Cuello de botella', 'El paso donde el trabajo se represa más tiempo. Mejorar otro paso no acelera el proceso si el cuello sigue igual.'],
              ['Causa raíz', 'La causa de fondo que, si se elimina, hace que el problema no vuelva. Nunca es «una persona»: es algo del proceso.'],
              ['Ishikawa (espina de pescado)', 'Diagrama que ordena las causas de un problema en categorías: personas, método, tecnología, materiales, medición y entorno.'],
              ['DMAIC', 'Definir, Medir, Analizar, Mejorar (Improve) y Controlar: las 5 fases para resolver un problema con método.'],
              ['VSM (mapa de flujo de valor)', 'Dibujo de todo el proceso con los tiempos de trabajo y de espera, para ver dónde se pierde el flujo.'],
              ['Kanban (tablero)', 'Tablero con columnas por estado donde las tarjetas se mueven a medida que avanza el trabajo.'],
            ]}
          />
        </Sub>
        <Sub titulo="Proyectos e indicadores">
          <Tabla
            filas={[
              ['Hito', 'Algo que hay que entregar o cumplir en una fecha.'],
              ['Fase', 'Grupo de hitos de una misma etapa: Arranque, Diagnóstico, Diseño…'],
              ['Cronograma / Gantt', 'Los hitos puestos en el tiempo, como barras de inicio a fin.'],
              ['Peso', 'Qué tanto cuenta un hito en el avance del proyecto.'],
              ['Plan de trabajo', 'El documento que dice qué se hará, cuándo y cómo se medirá.'],
              ['Seguimiento', 'Reporte periódico (por ejemplo mensual) de lo que se hizo y las horas usadas.'],
              ['KPI o indicador', 'El número que muestra si algo mejora. Ej.: días que tarda una compra.'],
              ['Línea base', 'Cómo está el indicador antes de mejorar. Es el punto de partida.'],
              ['Meta', 'A dónde se quiere llegar con el indicador.'],
              ['Avance hacia la meta', 'Qué parte del camino entre la línea base y la meta ya se recorrió.'],
              ['Semáforo', '🟢 bien, 🟡 atención, 🔴 problema, ⚪ sin datos.'],
              ['Riesgo', 'Algo que podría pasar y frenar el proyecto. Se mide con probabilidad × impacto.'],
              ['Mitigación', 'Lo que se hace para que un riesgo no pase o duela menos.'],
              ['Aporte o cofinanciación', 'Dinero que pone el cliente o un tercero para financiar parte del proyecto.'],
              ['Bitácora', 'El diario de las intervenciones: qué se hizo, cuándo y cuánto tiempo.'],
            ]}
          />
        </Sub>
        <Sub titulo="Prevención de LA/FT (La Ruta del Riesgo)">
          <Tabla
            filas={[
              ['LA/FT', 'Lavado de activos (hacer que dinero ilícito parezca legal) y financiación del terrorismo.'],
              ['SAGRILAFT y SARLAFT', 'Los sistemas de prevención de LA/FT en Colombia: SAGRILAFT para empresas vigiladas por la Supersociedades; SARLAFT para entidades financieras y otros sectores.'],
              ['Señal de alerta', 'Algo que no encaja con lo que se sabe de un cliente, proveedor u operación. No es una acusación: es una razón para mirar mejor.'],
              ['Contraparte', 'Cualquiera con quien la empresa tiene una relación: clientes, proveedores, socios, empleados.'],
              ['Debida diligencia', 'Los pasos para conocer a una contraparte antes y durante la relación. Es más profunda (intensificada) cuando el riesgo es mayor.'],
              ['Beneficiario final', 'La persona natural que de verdad es dueña o controla una empresa, aunque no aparezca en el primer papel.'],
              ['PEP', 'Persona Expuesta Políticamente: alguien con un cargo público importante. No es una falta, pero pide más controles.'],
              ['Listas restrictivas', 'Listas de personas vinculadas con delitos. La del Consejo de Seguridad de la ONU es obligatoria (vinculante) en Colombia.'],
              ['Operación inusual', 'La que no corresponde al perfil de la contraparte. Se reporta internamente a quien defina el procedimiento.'],
              ['ROS', 'Reporte de Operación Sospechosa a la UIAF (la Unidad de Información y Análisis Financiero). Lo hace el oficial de cumplimiento, no cada colaborador.'],
              ['Reserva de la información', 'Lo que se analiza o reporta no se le cuenta a la contraparte ni a quien no lo necesita.'],
            ]}
          />
        </Sub>
      </Seccion>
    </>
  );
}
