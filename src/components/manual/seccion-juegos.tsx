import { Boton, Ir, Paso, Pasos, Pregunta, Recuadro, Seccion, Sub, Tabla } from './piezas';

export function SeccionJuegos() {
  return (
    <>
      <Seccion
        id="makigami"
        emoji="🎯"
        titulo="Cacería Makigami"
        resumen="Un juego para diagnosticar un proceso: se dibuja tal como ocurre hoy, los equipos cazan los desperdicios y proponen cómo rediseñarlo."
      >
        <Sub titulo="¿Qué es un Makigami?">
          <p>
            Es un mapa del proceso en forma de «rollo de papel»: cada fila (<strong>carril</strong>) es una persona o área, y cada tarjeta (<strong>paso</strong>) es algo que
            se hace, con su tiempo de trabajo y su tiempo de espera. Al verlo completo, salta a la vista dónde se pierde el tiempo.
          </p>
          <p>El juego tiene 4 etapas, y tú, como facilitadora, decides cuándo pasar a la siguiente:</p>
          <Tabla
            filas={[
              ['1. ✏️ Mapeo', 'Tú dibujas el proceso: carriles y pasos con sus tiempos.'],
              ['2. 🎯 Cacería', 'Los jugadores marcan desperdicios en los pasos desde su celular.'],
              ['3. 💡 Rediseño', 'Todos proponen mejoras y votan; tú apruebas las mejores.'],
              ['4. 🎉 Resultados', 'Se ve el antes y el después del proceso y el ranking de equipos.'],
            ]}
          />
        </Sub>

        <Sub titulo="1. Crear el reto y dibujar el proceso">
          <Pasos>
            <Paso>
              En el menú toca <strong>🎲 Juegos → 🎯 Cacería Makigami</strong> y luego <Boton tono="blanco">+ Nuevo reto</Boton>.
            </Paso>
            <Paso>
              Escribe el título (ej. <em>¿Por qué una compra de papelería tarda 2 semanas?</em>), la descripción del problema, dónde empieza y dónde termina el proceso, y
              la fecha límite de la cacería (opcional). Toca <Boton>Crear y empezar a mapear</Boton>.
            </Paso>
            <Paso>
              En <strong>Carriles</strong> escribe cada rol o área que interviene (ej. <em>Solicitante, Líder del área, Compras, Gerencia, Proveedor</em>) y toca agregar.
              Con las flechas cambias su orden.
            </Paso>
            <Paso>
              En el tablero toca <strong>+ Paso aquí</strong> en el carril de quien hace el paso. Escribe qué se hace, el <strong>tiempo de trabajo</strong> (lo que alguien
              tarda haciéndolo), el <strong>tiempo de espera</strong> (lo que el trabajo queda quieto antes del siguiente paso), el documento o sistema que usa y, si quieres,
              su clasificación.
            </Paso>
            <Paso>Repite hasta dibujar todo el proceso, en orden. Tocar un paso lo abre para editarlo o moverlo.</Paso>
          </Pasos>
          <Tabla
            cabeza={['Clasificación del paso', 'Qué significa']}
            filas={[
              ['Agrega valor', 'Transforma algo que el cliente final valora y pagaría. Ej.: entregar el pedido.'],
              ['Necesaria, no agrega valor', 'No agrega valor, pero hoy no se puede quitar (ley, control). Ej.: aprobar la compra.'],
              ['Desperdicio', 'No agrega nada y se puede eliminar. Ej.: transcribir la solicitud a otro Excel.'],
            ]}
          />
          <Recuadro tipo="ejemplo">
            <p>
              Paso 2 · Carril <em>Líder del área</em> · <em>Firma la solicitud</em> · trabajo 5 min · espera 2 días · clasificación <em>Desperdicio</em>. Solo 5 minutos de
              trabajo, pero el papel queda 2 días en un escritorio.
            </p>
          </Recuadro>
          <Recuadro tipo="consejo">
            <p>
              Escribe los tiempos en la unidad más cómoda: minutos (min), horas (h) o días (d). La app los suma y calcula la <strong>eficiencia</strong>: qué porcentaje del
              tiempo total agrega valor. Suele salir menos del 10 %, y eso es lo que sorprende a los participantes.
            </p>
          </Recuadro>
        </Sub>

        <Sub titulo="2. Invitar a los jugadores">
          <Pasos>
            <Paso>
              Arriba del tablero está el panel <strong>👥 Equipos y jugadores</strong> con el <strong>código</strong> de 6 letras y el <strong>QR</strong>.
            </Paso>
            <Paso>
              Proyecta el QR en el salón o toca <Boton tono="blanco">Copiar enlace</Boton> y envíalo por WhatsApp. También lo encuentras en{' '}
              <Ir href="#panel">Mi panel → Para compartir</Ir>.
            </Paso>
            <Paso>
              Puedes crear los equipos antes (<Boton>+ Crear equipo</Boton>) o dejar que el primer jugador de cada equipo lo cree al inscribirse.
            </Paso>
            <Paso>
              Desde el panel puedes renombrar equipos, mover jugadores de equipo (⇄), eliminar jugadores, cerrar la inscripción y{' '}
              <Boton tono="blanco">Descargar jugadores (Excel)</Boton>.
            </Paso>
          </Pasos>
        </Sub>

        <Sub titulo="3. La cacería">
          <Pasos>
            <Paso>
              Cuando el mapa esté listo toca <Boton>🎯 Abrir la cacería</Boton> y confirma. El mapa ya no se puede editar (salvo que vuelvas a Mapeo).
            </Paso>
            <Paso>
              Cada jugador toca un paso en su celular y marca los desperdicios que ve: esperas, traspasos, sobreprocesamiento, errores, búsqueda de información, trabajo
              acumulado, sobreproducción o talento no aprovechado.
            </Paso>
            <Paso>El tablero se actualiza solo cada pocos segundos: todos ven lo que cazan los demás y los pasos más «calientes».</Paso>
            <Paso>
              Cuando termine el tiempo toca <Boton>💡 Cerrar cacería y pasar a Rediseño</Boton>.
            </Paso>
          </Pasos>
          <Recuadro tipo="idea" titulo="Los 8 desperdicios en la oficina">
            <p>
              ⏳ Esperas · 🔀 Traspasos innecesarios · ✍️ Sobreprocesamiento · 🔁 Errores y reprocesos · 🔍 Búsqueda de información · 📥 Trabajo acumulado · 📄
              Sobreproducción · 💡 Talento no aprovechado. La página de Makigami trae un ejemplo de cada uno.
            </p>
          </Recuadro>
        </Sub>

        <Sub titulo="4. Rediseño y resultados">
          <Pasos>
            <Paso>
              En Rediseño cada jugador escribe propuestas: qué paso mejora, qué acción (eliminar, simplificar, automatizar, combinar u otra), la idea y cuánto tiempo
              ahorraría. Toca <Boton>Proponer</Boton>.
            </Paso>
            <Paso>Todos votan las propuestas de los demás (no se puede votar la propia).</Paso>
            <Paso>Tú apruebas o descartas cada propuesta. Las aprobadas calculan el tiempo del proceso rediseñado.</Paso>
            <Paso>
              Toca <Boton>🎉 Cerrar el reto y publicar resultados</Boton>: se muestra el antes vs. después y el ranking final.
            </Paso>
            <Paso>
              Abre <strong>Informe y opciones de mejora</strong> para imprimirlo y enviar las mejoras al plan de acción (ver <Ir href="#informes">Informes</Ir>).
            </Paso>
          </Pasos>
          <Tabla
            cabeza={['Cómo se ganan puntos', 'Puntos']}
            filas={[
              ['Cazar un desperdicio (hasta 12 cazas por persona)', '3'],
              ['Ser el primero en ver un desperdicio que luego marcan 3 personas', '15'],
              ['Proponer una mejora', '10'],
              ['Que te aprueben una mejora', '40'],
            ]}
          />
          <p>Además hay insignias: 🎯 Cazador (10 cazas), 🦅 Ojo de Halcón, 🧠 Arquitecto del Proceso y ⚡ Ahorrador de Tiempo.</p>
        </Sub>
        <Pregunta p="¿Puedo devolverme de etapa?">
          <p>Sí. Usa «Volver a…» junto al botón de avanzar. Las cazas, propuestas y votos no se borran.</p>
        </Pregunta>
      </Seccion>

      <Seccion
        id="kaizen"
        emoji="🔁"
        titulo="Carrera Kaizen"
        resumen="Un juego para entrenar la mejora continua: los equipos producen algo sencillo en rondas cronometradas y mejoran con el ciclo PDCA. Gana quien mejora de verdad, con datos."
      >
        <Sub titulo="Cómo funciona, en pocas palabras">
          <p>
            <strong>Kaizen</strong> significa «cambio para mejor». En el taller, los equipos fabrican algo sencillo (aviones de papel, cartas, figuras con fichas, formularios)
            durante varias rondas de pocos minutos. Antes de cada ronda buscan la causa de su problema, eligen <strong>una sola</strong> mejora y predicen cuánto van a
            producir.
          </p>
          <Tabla
            cabeza={['Ronda', 'Qué pasa']}
            filas={[
              ['Ronda 1 (línea base)', '⚙️ Hacer → 📏 Verificar. Trabajan como saben, sin mejoras. Así se sabe desde dónde parten.'],
              ['Rondas 2 en adelante', '🧠 Planear → ⚙️ Hacer → 📏 Verificar → ✅ Actuar. Es el ciclo PDCA completo.'],
            ]}
          />
          <Tabla
            cabeza={['Fase', 'Qué hacen los equipos']}
            filas={[
              ['🧠 Planear', 'Llenan la tarjeta Kaizen: el problema, los 5 porqués, una idea y la predicción de unidades buenas.'],
              ['⚙️ Hacer', 'Producen aplicando su idea mientras corre el cronómetro.'],
              ['📏 Verificar', 'Cuentan las unidades buenas y las defectuosas con el criterio de calidad, y las registran.'],
              ['✅ Actuar', 'Si su idea mejoró, la vuelven estándar; si no, la descartan.'],
            ]}
          />
        </Sub>

        <Sub titulo="1. Preparar la carrera">
          <Pasos>
            <Paso>
              En el menú toca <strong>🎲 Juegos → 🔁 Carrera Kaizen</strong> y luego <Boton tono="blanco">+ Nueva carrera</Boton>.
            </Paso>
            <Paso>
              Elige una simulación lista (✈️ Aviones de papel, ✉️ Cartas para enviar, 🧱 Ensamble de fichas, 📝 Solicitudes de oficina): se llenan solos el producto, la
              unidad, el criterio de calidad y los minutos.
            </Paso>
            <Paso>Ajusta el título, el número de rondas (recomendado 4 o 5) y los minutos por ronda (se aceptan decimales, ej. 2,5).</Paso>
            <Paso>
              Toca <Boton>Crear carrera</Boton>. Prepara los materiales: la página de Kaizen los lista para cada simulación.
            </Paso>
          </Pasos>
          <Recuadro tipo="ejemplo" titulo="Ejemplo: aviones de papel">
            <p>
              Producto: <em>Aviones de papel</em> · Unidad: <em>aviones</em> · Criterio de calidad: <em>tiene el modelo indicado, alas simétricas y vuela al menos 3
              metros</em> · 3 minutos por ronda · 5 rondas.
            </p>
          </Recuadro>
        </Sub>

        <Sub titulo="2. Dirigir la carrera con el mando">
          <p>
            Invita a los jugadores igual que en el Makigami (código, QR o enlace). En la carrera tienes el <strong>🎛️ Mando del facilitador</strong>:
          </p>
          <Pasos>
            <Paso>
              <Boton>▶ Empezar: Ronda 1 (línea base)</Boton> arranca la carrera.
            </Paso>
            <Paso>
              En cada fase Hacer, cuando todos estén listos, toca <Boton tono="acento">▶ Iniciar cronómetro</Boton>. Todos ven la misma cuenta regresiva en su celular.
              Puedes reiniciarlo o detenerlo.
            </Paso>
            <Paso>
              <Boton>Siguiente: …</Boton> pasa a la fase que sigue. El botón dice cuál es. <Boton tono="blanco">Atrás</Boton> sirve si avanzaste por error.
            </Paso>
            <Paso>
              La tabla muestra, por equipo, su tarjeta Kaizen (toca 👁️ para leerla), sus unidades con calidad y con defecto (puedes corregirlas y tocar ✓), su mejora y su
              decisión. Arriba, «Ver ronda» cambia de ronda.
            </Paso>
            <Paso>
              Si falta algún equipo, un aviso amarillo te dice cuál («⏳ Faltan…»). Puedes esperar o seguir.
            </Paso>
            <Paso>
              En la última ronda el botón dice <Boton>🏁 Terminar carrera y ver resultados</Boton>: tócalo dos veces para confirmar.
            </Paso>
          </Pasos>
        </Sub>

        <Sub titulo="3. Puntos y resultados">
          <Tabla
            cabeza={['Cómo se ganan puntos', 'Puntos']}
            filas={[
              ['Por cada 1 % que mejoran las unidades buenas frente a la ronda anterior', '1 (máx. 100 por ronda)'],
              ['Predicción a menos del 10 % del resultado real', '30'],
              ['Predicción a menos del 25 %', '15'],
              ['Tarjeta completa: problema, 3 porqués o más, idea y predicción', '10'],
              ['Decidir bien: estandarizar lo que mejoró o descartar lo que no', '20'],
              ['Ronda con cero defectos', '10'],
            ]}
          />
          <Recuadro tipo="ejemplo">
            <p>
              Un equipo pasa de 8 a 12 aviones buenos (+50 % → 50 puntos), había predicho 12 (exacto → 30), llenó bien su tarjeta (10), la volvió estándar porque mejoró (20)
              y no tuvo defectos (10). Total de la ronda: <strong>120 puntos</strong>.
            </p>
          </Recuadro>
          <p>
            El <strong>🏆 Marcador</strong> ordena los equipos (tocar uno muestra sus puntos ronda por ronda) y la <strong>📈 Curva de mejora</strong> dibuja las unidades
            buenas de cada equipo por ronda. Al final, <strong>📖 La historia de cada equipo</strong> muestra todas sus tarjetas. El informe trae las opciones de mejora para
            llevar al plan de acción.
          </p>
        </Sub>
        <Pregunta p="¿Por qué una sola idea por ronda?">
          <p>Porque si cambian varias cosas a la vez no se sabe cuál funcionó. Una idea por ronda = aprender con datos.</p>
        </Pregunta>
        <Pregunta p="Un equipo contó mal, ¿se puede corregir?">
          <p>Sí. En la tabla del mando escribe los números correctos de ese equipo y ronda y toca ✓. Los puntos se recalculan solos.</p>
        </Pregunta>
      </Seccion>

      <Seccion id="jugadores" emoji="📱" titulo="Para los jugadores" resumen="Lo que hace una persona que participa en un juego. No necesita cuenta ni clave.">
        <Sub titulo="Unirse a un juego">
          <Pasos>
            <Paso>Escanea el QR con la cámara del celular, o abre el enlace que te enviaron, o entra a la app, abre 🎲 Juegos y escribe el código de 6 letras en el juego que te indicaron.</Paso>
            <Paso>
              <strong>Paso 1 de 2</strong>: elige tu equipo. Si eres el primero de tu equipo, tócale «Mi equipo no está: crear uno nuevo».
            </Paso>
            <Paso>
              <strong>Paso 2 de 2</strong>: escribe tus nombres, apellidos, cargo y sexo. Marca «Soy el líder de mi equipo» si lo eres (solo uno por equipo). Autoriza el
              tratamiento de datos y toca <Boton>Entrar al juego</Boton>.
            </Paso>
          </Pasos>
          <Recuadro tipo="consejo">
            <p>
              El celular te recuerda: si cierras la página y vuelves a abrir el enlace, entras directo, sin inscribirte otra vez. Usa siempre el mismo celular y el mismo
              navegador.
            </p>
          </Recuadro>
        </Sub>
        <Sub titulo="Qué hace el jugador en cada juego">
          <Tabla
            filas={[
              ['🎯 Makigami', 'Toca los pasos del mapa y marca los desperdicios que ve. En Rediseño propone mejoras y vota las de los demás.'],
              ['🔁 Kaizen', 'Con su equipo llena la tarjeta Kaizen, produce mientras corre el cronómetro, registra cuántas unidades salieron bien y decide si su idea se vuelve estándar.'],
              ['🧹 Reto 5S', 'Juega las misiones con su equipo según el rol que le toca, y en la misión real llena con su equipo la auditoría, las evidencias y los resultados.'],
            ]}
          />
          <p>La pantalla del jugador cambia sola según la fase que abra la facilitadora. No hay que recargar.</p>
        </Sub>
      </Seccion>
    </>
  );
}
