import { Boton, Ir, Paso, Pasos, Pregunta, Recuadro, Seccion, Sub, Tabla } from './piezas';

export function SeccionProcesos() {
  return (
    <>
      <Seccion
        id="procesos"
        emoji="📊"
        titulo="Control de procesos"
        resumen="Para sostener las mejoras: cada proceso con su indicador, su meta, sus mediciones y su plan de acción."
      >
        <Sub titulo="¿Qué es un proceso aquí?">
          <p>
            Es una actividad del cliente que se repite y se quiere mejorar, por ejemplo <em>«Compra de papelería e insumos»</em> o <em>«Atención de solicitudes
            internas»</em>. A cada proceso le ponemos <strong>un indicador principal</strong> que se mide seguido.
          </p>
        </Sub>

        <Sub titulo="Crear un proceso">
          <Pasos>
            <Paso>
              En el menú toca <strong>📊 Procesos</strong> y luego <Boton tono="blanco">+ Nuevo proceso</Boton>. (O créalo desde la pestaña Procesos de un proyecto, y
              quedará unido a él.)
            </Paso>
            <Paso>Escribe el nombre, el cliente, el área, el dueño del proceso (quien responde por él) y el objetivo de la mejora.</Paso>
            <Paso>
              En <strong>📏 Indicador principal</strong> toca uno de los sugeridos (Tiempo total del proceso, Entregas a tiempo, Errores o reprocesos, Casos atendidos, Costo
              por caso, Satisfacción) o escribe el tuyo.
            </Paso>
            <Paso>
              Elige si <strong>mejorar es que baje</strong> (tiempos, costos, errores) <strong>o que suba</strong> (% a tiempo, productividad). Escribe la línea base (hoy),
              la meta y cada cuánto se mide.
            </Paso>
            <Paso>
              Toca <Boton>Crear proceso</Boton>.
            </Paso>
          </Pasos>
          <Recuadro tipo="ejemplo">
            <p>
              <em>Compra de papelería e insumos</em> · Indicador: <em>Tiempo total del proceso</em> · Unidad: días · Mejorar = baje · Línea base: 12,4 · Meta: 6,4 · Se mide
              cada semana.
            </p>
          </Recuadro>
        </Sub>

        <Sub titulo="Registrar mediciones y leer la gráfica">
          <Pasos>
            <Paso>Entra al proceso. Debajo de la gráfica está el formulario: fecha, valor y una nota opcional.</Paso>
            <Paso>
              Toca <Boton>+ Registrar</Boton>. El punto aparece en la gráfica.
            </Paso>
          </Pasos>
          <p>
            En la gráfica, la <strong>línea verde punteada es la meta</strong> y la <strong>gris punteada es la línea base</strong>. Los puntos verdes son mediciones que ya
            cumplen la meta. Pasa el mouse (o toca) un punto para ver su fecha y su valor.
          </p>
          <Tabla
            cabeza={['Semáforo', 'Qué significa']}
            filas={[
              ['🟢 Meta cumplida', 'La última medición ya alcanzó la meta.'],
              ['🟡 Mejorando', 'Aún no llega, pero va mejor que la línea base.'],
              ['🔴 Lejos de la meta', 'Está igual o peor que la línea base.'],
              ['⚪ Sin datos', 'No hay mediciones todavía.'],
            ]}
          />
          <p>
            <strong>Avance hacia la meta</strong>: cuánto del camino entre la línea base y la meta ya se recorrió. Ej.: de 12,4 a 6,4 hay 6 días; si hoy vas en 9,6, bajaste
            2,8 → 47 %.
          </p>
        </Sub>

        <Sub titulo="El plan de acción">
          <p>Son las cosas concretas que se van a hacer para mejorar el proceso, cada una con responsable, fecha y estado.</p>
          <Pasos>
            <Paso>
              Toca <Boton tono="blanco">+ Nueva acción</Boton>, escribe qué se va a hacer, el detalle, el responsable y la fecha de compromiso.
            </Paso>
            <Paso>Cambia el estado con el selector de colores: Pendiente → En curso → Hecha (o Descartada).</Paso>
            <Paso>El lápiz ✏️ edita la acción y la caneca 🗑️ la borra.</Paso>
            <Paso>
              Con <strong>Lista | Tablero</strong> cambias a un Kanban: Pendiente, En curso, Hecha y Descartada. Arrastra las tarjetas para cambiar su estado.
            </Paso>
          </Pasos>
          <p>
            Cada acción muestra de dónde vino: ✍️ Manual, 🎯 Cacería Makigami, 🔁 Carrera Kaizen o 📄 Informe. Las vencidas salen en rojo. La barra «Avance del plan» cuenta
            cuántas están hechas.
          </p>
          <Recuadro tipo="consejo">
            <p>
              No escribas las acciones de los juegos a mano: envíalas desde el informe del juego (mira <Ir href="#informes">Informes y opciones de mejora</Ir>). Así quedan
              conectadas y no se repiten.
            </p>
          </Recuadro>
        </Sub>

        <Sub titulo="Opciones de mejora, juegos y archivar">
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>💡 Opciones de mejora</strong>: la app revisa el indicador y el plan y te dice qué hacer: medir si llevas días sin hacerlo, alertar si empeora 3 veces
              seguidas, avisar de acciones vencidas o sin responsable, o sugerir un nuevo juego. <Boton tono="blanco">+ Al plan</Boton> la convierte en acción.
            </li>
            <li>
              <strong>🎲 Juegos sobre este proceso</strong>: los Makigami y Kaizen hechos sobre él, con enlace a su informe. Puedes unir un juego que ya hiciste.
            </li>
            <li>
              <strong>Archivar</strong> saca el proceso de la lista sin borrar su historia (se ve en «Ver archivados»). <strong>Borrar</strong> lo elimina con sus mediciones y
              acciones.
            </li>
            <li>
              <Boton>🖨️ Imprimir o guardar PDF</Boton>: la página del proceso sirve como informe.
            </li>
          </ul>
        </Sub>
      </Seccion>

      <Seccion
        id="informes"
        emoji="📄"
        titulo="Informes y opciones de mejora"
        resumen="Cada juego y cada proyecto tiene su informe: se imprime o se guarda en PDF y sus mejoras se llevan al plan de acción."
      >
        <Sub titulo="Dónde están los informes">
          <Tabla
            filas={[
              ['🎯 Cacería Makigami', 'En el reto: «Informe y opciones de mejora» (debajo del título).'],
              ['🔁 Carrera Kaizen', 'En la carrera: «Informe y opciones de mejora».'],
              ['🗂️ Proyecto', 'Botón «📄 Informe de avance».'],
              ['📊 Proceso', 'La misma página del proceso, con «Imprimir o guardar PDF».'],
              ['🧭 Mi panel', 'La lista «Informes y opciones de mejora» con los juegos recientes.'],
            ]}
          />
        </Sub>
        <Sub titulo="Llevar las mejoras de un juego al plan de acción">
          <Pasos>
            <Paso>Abre el informe del juego y baja hasta <strong>💡 Opciones de mejora</strong>. Cada opción trae su prioridad, la explicación y la herramienta Lean sugerida.</Paso>
            <Paso>
              Marca las casillas de las que quieras llevar al plan. Las de prioridad alta y media vienen marcadas.
            </Paso>
            <Paso>
              En <strong>📋 Llevar al plan de acción</strong> elige el proceso y toca <Boton>Enviar N mejoras</Boton>.
            </Paso>
            <Paso>
              Listo: aparecen en el plan del proceso y el juego queda unido a él. Las que ya enviaste salen con la etiqueta <em>«✓ En el plan de acción»</em> y no se repiten.
            </Paso>
          </Pasos>
          <Recuadro tipo="ojo">
            <p>Si no tienes procesos, el informe te ofrece crear uno. Crea el proceso del cliente y vuelve al informe.</p>
          </Recuadro>
        </Sub>
        <Sub titulo="Guardar en PDF">
          <Pasos>
            <Paso>
              Toca <Boton>🖨️ Imprimir o guardar PDF</Boton>.
            </Paso>
            <Paso>En «Destino» (o «Impresora») elige <strong>Guardar como PDF</strong> y toca Guardar.</Paso>
          </Pasos>
          <p>El menú y los botones no salen en el PDF: solo el contenido del informe.</p>
        </Sub>
        <Pregunta p="¿De dónde salen las opciones de mejora? ¿Las escribe una inteligencia artificial?">
          <p>
            No. Son reglas de ingeniería de procesos aplicadas a los datos del juego. Por ejemplo: si las esperas son más de la mitad del tiempo del proceso, sugiere atacar
            las esperas; si más del 10 % de lo producido en la Carrera Kaizen salió con defecto, sugiere calidad en la fuente. Son un punto de partida: tú decides cuáles
            llevar al plan.
          </p>
        </Pregunta>
      </Seccion>
    </>
  );
}
