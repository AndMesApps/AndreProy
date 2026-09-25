import { Boton, Ir, Paso, Pasos, Pregunta, Recuadro, Seccion, Sub, Tabla } from './piezas';

export function SeccionProyectos() {
  return (
    <Seccion
      id="proyectos"
      emoji="🗂️"
      titulo="Proyectos de consultoría"
      resumen="Todo lo que registra y controla una consultora en un proyecto: cronograma, objetivos, KPIs, bitácora, horas, pagos, riesgos, documentos y los procesos del cliente."
    >
      <Sub id="proyectos-portafolio" titulo="La página de Proyectos (el portafolio)">
        <p>
          En el menú toca <strong>🗂️ Proyectos</strong>. Verás todos tus proyectos juntos:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Cinco cifras arriba</strong>: proyectos activos, en riesgo o atrasados, hitos vencidos, horas trabajadas este mes y dinero por cobrar.
          </li>
          <li>
            <strong>Filtros</strong>: Activos, Todos, Finalizados, y por grupo o aliado (por ejemplo «Acescorp y Andrea»).
          </li>
          <li>
            <strong>🛣️ Hoja de ruta</strong>: cada proyecto es una barra que va de su fecha de inicio a su fecha de fin. La parte pintada es lo que ya avanzó. La línea
            roja es hoy. Si la parte pintada está muy a la izquierda de la línea roja, el proyecto va atrasado.
          </li>
          <li>
            <strong>📆 Mi agenda · 14 días</strong>: los hitos, pagos, próximos pasos y cierres de todos tus clientes, ordenados por fecha. Lo vencido sale en rojo y lo que
            vence en 2 días, en amarillo. Tocar un renglón te lleva a esa parte del proyecto.
          </li>
          <li>
            <strong>Tarjetas</strong> de cada proyecto con su salud, la barra del cronograma (la rayita oscura es dónde debería ir hoy), la de objetivos, los días que
            faltan, las horas y avisos como «2 vencidos» o «12 días sin intervenir».
          </li>
        </ul>
      </Sub>

      <Sub id="proyectos-crear" titulo="Crear un proyecto paso a paso">
        <Pasos>
          <Paso>
            En Proyectos toca <Boton tono="blanco">+ Nuevo proyecto</Boton>.
          </Paso>
          <Paso>
            <strong>📁 El proyecto</strong>: escribe el nombre (ej. <em>Mejora del proceso de compras</em>), el cliente (ej. <em>Distribuidora Andina S.A.S.</em>),
            elige el tipo y, si quieres, el grupo, el programa, el alcance y el objetivo general.
          </Paso>
          <Paso>
            <strong>📅 Fechas, horas y valor</strong>: fecha de inicio, <strong>fecha límite de finalización</strong>, límite del acta de cierre, cada cuántos días hay que
            intervenir (ej. 7), horas contratadas (ej. 80) y valor del contrato (ej. 18.000.000). Los números se pueden escribir como en Colombia: <em>1.410.000</em> o{' '}
            <em>12,4</em>.
          </Paso>
          <Paso>
            <strong>👥 Personas</strong>: el contacto en el cliente (nombre, cargo, correo, celular) y el gestor o supervisor externo, si lo hay.
          </Paso>
          <Paso>
            <strong>📜 Reglas clave y enlaces</strong> (opcional): las reglas del contrato o del programa (topes de horas, plazos) y los enlaces a carpetas o plataformas.
          </Paso>
          <Paso>
            <strong>🗓️ Cronograma inicial</strong>: elige una plantilla y la app arma todos los hitos repartidos entre la fecha de inicio y la de fin. Luego los ajustas.
          </Paso>
          <Paso>
            Toca <Boton>Crear proyecto</Boton>. Entras a la cabina del proyecto.
          </Paso>
        </Pasos>
        <Tabla
          cabeza={['Plantilla', 'Para qué sirve']}
          filas={[
            ['Consultoría en procesos', 'Arranque → Diagnóstico (con Makigami) → Diseño → Implementación (con Kaizen) → Control → Cierre. 12 hitos.'],
            ['Plan de trabajo con seguimientos', 'Acta de inicio, plan de trabajo y su aprobación, línea base de indicadores, medición intermedia, medición final e informe de cierre, más un seguimiento por cada mes.'],
            ['Desarrollo de aplicativo', 'Requisitos → Prototipo → 3 sprints → Pruebas → Capacitación → Producción.'],
            ['Capacitación', 'Necesidades → Diseño → Sesiones → Evaluación → Informe.'],
            ['Empezar vacío', 'Sin hitos: los agregas tú.'],
          ]}
        />
        <Recuadro tipo="ojo">
          <p>Para usar una plantilla necesitas la fecha de inicio y la fecha límite de finalización. Sin fechas, el proyecto se crea vacío.</p>
        </Recuadro>
      </Sub>

      <Sub id="proyectos-resumen" titulo="🧭 Pestaña Resumen: la cabina del proyecto">
        <p>Al entrar a un proyecto ves ocho pestañas. La primera, Resumen, te dice cómo va todo sin tener que buscar:</p>
        <Tabla
          filas={[
            ['Anillo Cronograma', 'Qué porcentaje de los hitos está cumplido (los hitos pesan según su «peso»). La rayita oscura marca dónde debería ir hoy según el tiempo.'],
            ['Anillo Objetivos', 'Cuánto se han cumplido los objetivos, calculado con sus KPIs.'],
            ['Anillo Tiempo', 'Cuánto del tiempo del proyecto ya pasó.'],
            ['Anillo Horas', 'Horas usadas contra las contratadas. Si pasa mucho de la rayita (el avance), se están gastando horas sin avanzar.'],
            ['📰 Resumen ejecutivo', 'Un texto que la app escribe sola con los datos de hoy. Sirve para contarle al cliente cómo va el proyecto.'],
            ['Avance por fase', 'Una barra por cada fase del cronograma.'],
            ['📆 Próximos 14 días', 'Lo que vence pronto en este proyecto.'],
            ['💡 Alertas', 'Lo que hay que atender, con prioridad alta, media o baja y qué hacer.'],
            ['🗂️ Ficha', 'Los datos del contrato, el contacto (con botón de WhatsApp), las reglas y los enlaces. «Editar ficha del proyecto» para cambiarlos.'],
          ]}
        />
        <Recuadro tipo="idea" titulo="¿Cómo decide la app si un proyecto está al día?">
          <p>Compara el avance del cronograma con el tiempo que ya pasó:</p>
          <ul className="ml-5 list-disc">
            <li>
              🟢 <strong>Al día</strong>: el avance va igual o mejor que el tiempo, y no hay hitos vencidos.
            </li>
            <li>
              🟡 <strong>En riesgo</strong>: va más de 10 puntos por detrás, o hay algún hito vencido.
            </li>
            <li>
              🔴 <strong>Atrasado</strong>: va más de 25 puntos por detrás, o tiene 3 o más hitos vencidos.
            </li>
          </ul>
          <p>
            Ejemplo: si ya pasó el 50 % del tiempo y el cronograma va en 30 %, hay 20 puntos de atraso → 🟡 En riesgo.
          </p>
        </Recuadro>
        <p>
          Arriba a la derecha puedes cambiar el <strong>estado</strong> (Por iniciar, En curso, Pausado, Finalizado, Cancelado), abrir el{' '}
          <Boton>📄 Informe de avance</Boton> o borrar el proyecto.
        </p>
      </Sub>

      <Sub id="proyectos-cronograma" titulo="🗓️ Pestaña Cronograma: hitos y Gantt">
        <p>
          Un <strong>hito</strong> es algo que hay que entregar o cumplir en una fecha: un informe, un acta, una reunión, un seguimiento mensual.
        </p>
        <Pasos>
          <Paso>
            Toca <Boton>+ Hito</Boton> para agregar uno. Llena la fase, el nombre, qué hay que cumplir, los insumos que se necesitan, el responsable, el estado, las fechas
            y el peso.
          </Paso>
          <Paso>
            Para agregar varios de una vez, elige una plantilla en <em>«Agregar hitos de una plantilla…»</em> y toca <Boton tono="blanco">Agregar</Boton>.
          </Paso>
          <Paso>
            Para los programas con reporte mensual, toca <Boton tono="blanco">📅 Seguimientos mensuales</Boton>. Crea un hito por mes, que vence el día hábil que
            escribas del mes siguiente (ej. el 3.er día hábil).
          </Paso>
          <Paso>
            Cambia entre <strong>Gantt</strong> (las barras en el tiempo) y <strong>Tabla</strong> (la lista, como en Excel). En la tabla puedes cambiar el estado directo
            en la columna Estado.
          </Paso>
          <Paso>Toca un hito (en el Gantt o en la tabla) para editarlo o borrarlo.</Paso>
        </Pasos>
        <Tabla
          cabeza={['Estado', 'Cuándo usarlo']}
          filas={[
            ['Pendiente', 'Aún no se empieza.'],
            ['En curso', 'Se está trabajando.'],
            ['En aprobación', 'Ya se entregó y el cliente o el gestor lo está revisando. Cuenta la mitad de su peso en el avance.'],
            ['Rechazado – subsanar', 'Lo devolvieron: hay que corregir y reenviar.'],
            ['Bloqueado', 'No se puede avanzar porque depende de otro (el cliente, una plataforma, una firma).'],
            ['Cumplido', 'Listo. Si no tenía fecha real, la app pone la de hoy.'],
            ['No aplica', 'Ya no se hará. No cuenta en el avance.'],
          ]}
        />
        <Recuadro tipo="consejo" titulo="¿Qué es el peso?">
          <p>
            Es la importancia del hito en el avance. Un informe grande puede pesar 3 y un acta 1. Si no sabes, deja 1 en todos: el avance será «hitos cumplidos / total de
            hitos».
          </p>
        </Recuadro>
        <Recuadro tipo="ejemplo">
          <p>
            Hito: <em>Línea base de indicadores</em> · Qué cumplir: <em>Valor inicial de los 6 indicadores y sus metas</em> · Insumos: <em>Datos de julio del
            cliente</em> · Estado: <em>Rechazado – subsanar</em> · Situación: <em>El cliente pidió usar agosto como periodo base</em> · Próximo paso: <em>Recalcular y
            reenviar</em>.
          </p>
        </Recuadro>
      </Sub>

      <Sub id="proyectos-objetivos" titulo="🎯 Pestaña Objetivos y KPIs">
        <p>
          Un <strong>objetivo</strong> es lo que el cliente quiere lograr. Un <strong>KPI</strong> (indicador) es el número que demuestra si se logró.
        </p>
        <Pasos>
          <Paso>
            Toca <Boton>+ Objetivo</Boton>: escribe el objetivo, cómo sabrán que se cumplió, el responsable y la fecha meta.
          </Paso>
          <Paso>
            Dentro del objetivo toca <strong>+ KPI para este objetivo</strong>: nombre, cómo se calcula, unidad (días, %, personas…), si mejorar es que suba o que baje, la{' '}
            <strong>línea base</strong> (cómo está hoy) y la <strong>meta</strong>.
          </Paso>
          <Paso>
            Cada vez que midas, toca <Boton tono="blanco">+ Medición</Boton> en el KPI y escribe la fecha y el valor.
          </Paso>
        </Pasos>
        <Recuadro tipo="ejemplo">
          <p>
            Objetivo: <em>Reducir el tiempo de una compra de 12,4 a 6 días</em>. KPI: <em>Tiempo total de una compra</em>, en días, mejorar = baje, línea base 12,4, meta 6.
          </p>
          <p>
            Si hoy mides 9,6 días, la app calcula que vas en el <strong>44 %</strong> del camino: bajaste 2,8 de los 6,4 días que había que bajar (2,8 ÷ 6,4 = 44 %).
          </p>
        </Recuadro>
        <Recuadro tipo="consejo" titulo="No empieces de cero: KPIs sugeridos">
          <p>
            Al crear un proyecto con plantilla, la app ya trae <strong>3 objetivos de ejemplo con sus KPIs</strong> (por ejemplo, en consultoría: reducir el tiempo del
            proceso, disminuir errores y dejar al equipo preparado). Solo tienes que ajustarlos y ponerles línea base y meta.
          </p>
          <p>
            Además, en la lista <em>«📚 Agregar un KPI sugerido…»</em> hay 19 indicadores típicos (tiempo de ciclo, entregas a tiempo, productividad por persona, OEE,
            errores, satisfacción, costo por unidad, adopción de una herramienta…). Al elegir uno, el formulario se llena con su nombre, cómo se calcula y su unidad.
          </p>
        </Recuadro>
        <p>
          El cumplimiento de cada objetivo es el promedio de sus KPIs. Si un objetivo no tiene KPIs, puedes poner un «avance manual» en %. Si lo marcas Cumplido, cuenta
          100 %.
        </p>
      </Sub>

      <Sub id="proyectos-bitacora" titulo="📝 Pestaña Bitácora: las intervenciones">
        <p>Aquí anotas cada vez que trabajas en el proyecto: reuniones, visitas, trabajo de escritorio. Es como la «Bitácora diaria» del Excel.</p>
        <Pasos>
          <Paso>
            Toca <Boton>+ Registrar intervención</Boton>.
          </Paso>
          <Paso>Escribe la fecha, el tiempo en minutos, qué hiciste, el hito relacionado (opcional), en qué estado quedó el proyecto, el próximo paso y su fecha.</Paso>
        </Pasos>
        <p>Con esto la app calcula sola:</p>
        <ul className="ml-5 list-disc">
          <li>
            Las <strong>horas ejecutadas</strong> (la suma de los minutos), que se comparan con las contratadas.
          </li>
          <li>
            Los <strong>días sin intervenir</strong>: si pasan más días que los de «intervenir cada», sale una alerta.
          </li>
          <li>
            El <strong>próximo paso</strong>, que aparece en la agenda y en el resumen ejecutivo.
          </li>
        </ul>
        <Recuadro tipo="ejemplo">
          <p>
            24/09 · 120 min · <em>Informe de diagnóstico enviado a Gerencia</em> · Estado: Pendiente · Próximo paso: <em>Presentarlo en el comité</em> para el 29/09.
          </p>
        </Recuadro>
      </Sub>

      <Sub id="proyectos-finanzas" titulo="💵 Pestaña Horas y pagos">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>⏱ Horas</strong>: una barra con las horas usadas. La rayita oscura es el avance del cronograma: lo sano es que la barra no la pase por mucho.
          </li>
          <li>
            <strong>💵 Dinero</strong>: valor del contrato, cobrado, por cobrar, vencido y gastos.
          </li>
          <li>
            <Boton>+ Pago o cobro</Boton>: concepto, tipo (cobro al cliente, aporte o cofinanciación, o gasto), valor, estado (pendiente, facturado, pagado, anulado), fecha límite, fecha
            de pago y soporte.
          </li>
        </ul>
        <Recuadro tipo="ejemplo">
          <p>
            <em>Segundo pago 30 %</em> · Cobro · 5.400.000 · Facturado · límite 30/09. Si llega el 30/09 sin marcarlo «Pagado», sale en rojo como vencido y aparece en las
            alertas.
          </p>
        </Recuadro>
      </Sub>

      <Sub id="proyectos-riesgos" titulo="⚠️ Pestaña Riesgos">
        <p>
          Un riesgo es algo que <strong>podría</strong> frenar el proyecto. Anótalo antes de que pase, con un plan para evitarlo.
        </p>
        <Pasos>
          <Paso>
            Toca <Boton>+ Riesgo</Boton>, descríbelo y elige la probabilidad (baja, media, alta) y el impacto (bajo, medio, alto).
          </Paso>
          <Paso>Escribe qué harás para evitarlo o reducirlo (mitigación) y quién es el responsable.</Paso>
        </Pasos>
        <p>
          La <strong>matriz</strong> de colores muestra dónde están tus riesgos abiertos. Nivel = probabilidad × impacto (1 a 9): verde es bajo, amarillo medio y rojo alto.
          Un riesgo rojo sin plan de mitigación sale como alerta de prioridad alta.
        </p>
      </Sub>

      <Sub id="proyectos-procesos" titulo="🔄 Pestaña Procesos">
        <p>
          Aquí se unen al proyecto los procesos del cliente que se van a mejorar (los del <Ir href="#procesos">Control de procesos</Ir>). Cada uno muestra su semáforo, su
          indicador, sus acciones abiertas y sus juegos.
        </p>
        <ul className="ml-5 list-disc">
          <li>
            <Boton tono="blanco">+ Nuevo proceso del proyecto</Boton>: lo crea ya unido.
          </li>
          <li>
            <em>«Unir un proceso que ya existe…»</em>: elige uno de la lista y toca <Boton tono="blanco">Unir</Boton>. Los del mismo cliente tienen ★.
          </li>
        </ul>
      </Sub>

      <Sub id="proyectos-documentos" titulo="📎 Pestaña Documentos">
        <p>
          Guarda los <strong>enlaces</strong> a contratos, actas, informes, entregables y evidencias (Google Drive, OneDrive, SharePoint…). La app no guarda los archivos,
          solo el enlace: así todo queda a un clic.
        </p>
        <Recuadro tipo="consejo">
          <p>En Google Drive: clic derecho en el archivo → Compartir → Copiar enlace. Luego pégalo en «Enlace».</p>
        </Recuadro>
      </Sub>

      <Sub id="proyectos-informe" titulo="📄 Informe de avance para el cliente">
        <Pasos>
          <Paso>
            En el proyecto toca <Boton>📄 Informe de avance</Boton>.
          </Paso>
          <Paso>
            Si el informe es para el cliente y no quieres mostrarle horas ni dinero, toca <strong>🙈 Ocultar horas y dinero</strong>.
          </Paso>
          <Paso>
            Toca <Boton>🖨️ Imprimir o guardar PDF</Boton>. En la ventana de impresión elige «Guardar como PDF» y envíalo por correo o WhatsApp.
          </Paso>
        </Pasos>
        <p>El informe trae: los anillos de avance, el resumen ejecutivo, los objetivos con sus KPIs, el cronograma, los procesos, los riesgos, las últimas intervenciones y las recomendaciones.</p>
      </Sub>

      <Sub titulo="Preguntas frecuentes">
        <div className="space-y-2">
          <Pregunta p="¿Por qué mi proyecto sale «En riesgo» si voy adelantada?">
            <p>Porque tiene al menos un hito vencido. Revisa la pestaña Cronograma: ponle fecha nueva, márcalo cumplido o «No aplica».</p>
          </Pregunta>
          <Pregunta p="Me equivoqué en una fecha del proyecto, ¿se mueven los hitos?">
            <p>No. Los hitos conservan sus fechas. Cambia la ficha y ajusta los hitos a mano (tócalos en el Gantt o en la tabla).</p>
          </Pregunta>
          <Pregunta p="¿Puedo tener proyectos sin procesos, como un aplicativo?">
            <p>Sí. Los procesos son opcionales. Para aplicativos y tareas personales la app ni siquiera te lo sugiere.</p>
          </Pregunta>
          <Pregunta p="¿Los líderes ven mis proyectos?">
            <p>No. Cada líder ve solo los suyos. Los administradores ven todos.</p>
          </Pregunta>
        </div>
      </Sub>
    </Seccion>
  );
}
