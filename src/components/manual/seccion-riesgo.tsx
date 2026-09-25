import { Boton, Ir, Paso, Pasos, Pregunta, Recuadro, Seccion, Sub, Tabla } from './piezas';

export function SeccionRiesgo() {
  return (
    <Seccion
      id="riesgo"
      emoji="🗺️"
      titulo="La Ruta del Riesgo — SAGRILAFT y SARLAFT"
      resumen="Un juego para aprender a detectar, prevenir y reportar riesgos de lavado de activos y financiación del terrorismo (LA/FT) tomando decisiones, no memorizando normas."
    >
      <Sub titulo="¿De qué se trata?">
        <p>
          Una empresa inventada, <strong>Textiles Horizonte S.A.S.</strong>, está creciendo: clientes, proveedores, socios y operaciones nuevas. El reto del equipo es
          hacerla crecer <strong>sin dejar entrar</strong> operaciones o relaciones que sirvan para lavar dinero o financiar el terrorismo. La frase del juego:{' '}
          <em>«La empresa está creciendo. Pero no todo lo que parece una oportunidad es una buena oportunidad.»</em>
        </p>
        <p>
          En cada situación el equipo decide: ¿continuar?, ¿investigar?, ¿escalar?, ¿reportar? Primero vive la situación, luego decide, después recibe la explicación y al
          final conecta lo vivido con el concepto y con el procedimiento de su empresa.
        </p>
        <p>
          Arriba se ve el <strong>tablero de la ruta</strong>: 🏢 Empresa → 👥 Cliente · Proveedor · Socio → 💼 Operación → 🔍 Analizar → 🚦 Normal o alerta → 📣
          Escalar / actuar según el procedimiento. Cada estación se enciende cuando el equipo completa sus retos.
        </p>
      </Sub>

      <Sub titulo="Los 8 retos">
        <Tabla
          cabeza={['Reto', 'Qué hace el equipo']}
          filas={[
            ['🔎 1 · ¿Detectas la señal?', '4 situaciones. Tocan lo que les llama la atención (monto, empresa nueva, pago de un tercero…). Una situación es normal: si ven señales donde no las hay, también pierden.'],
            ['🪪 2 · Conoce a tu contraparte', 'Comercializadora XYZ pide $800 millones. Con 5 fichas piden información (financiera, beneficiario final, origen de los recursos, soportes…) y ven la respuesta. Hay solicitudes que no corresponden. Al final deciden qué hacer.'],
            ['👤 3 · Beneficiario final', 'Recorren la estructura de propiedad, multiplican los porcentajes y marcan a las personas que están realmente detrás (5 % o más, o quien controla por un poder).'],
            ['💸 4 · Sigue el dinero', 'El dinero son fichas. Arman el recorrido (cliente → empresa → tercero → cuenta en el exterior), marcan los movimientos que no cuadran y responden quién entrega, quién recibe, por qué y quién es el beneficiario.'],
            ['🚦 5 · Clasifica el riesgo', '6 operaciones con semáforo 🟢🟡🔴 y una razón. La razón vale más que el color: «es mucha plata» es una respuesta automática.'],
            ['🃏 6 · ¿Qué harías?', 'Cartas de evento: el cliente urgente, el favor, el tercero, el cambio de cuenta, el cliente perfecto y el curioso. Al elegir aparece enseguida la explicación.'],
            ['📣 7 · Escala correctamente', 'Llega información nueva de operaciones en marcha. Eligen: ignorar, preguntar, documentar, escalar, reportar según el procedimiento o investigar por su cuenta (trampa).'],
            ['🏁 8 · Caso final', 'La historia completa de Andes Import Group en 7 decisiones, de la detección a la llamada del cliente que pregunta «¿me están investigando?».'],
          ]}
        />
        <Recuadro tipo="idea" titulo="Después de cada reto, la app enseña">
          <p>
            El equipo ve sus puntos, la lección, <strong>📘 el concepto</strong> detrás de lo que vivió (señal de alerta, debida diligencia, beneficiario final,
            trazabilidad, matriz de riesgo, reserva de la información, operación inusual y sospechosa) y un botón <strong>🔎 Revisar el reto</strong> con lo que era correcto.
          </p>
        </Recuadro>
      </Sub>

      <Sub titulo="Para la facilitadora: preparar y dirigir la sesión">
        <Pasos>
          <Paso>
            En el menú abre <strong>🎲 Juegos → 🗺️ La Ruta del Riesgo</strong> y toca <Boton tono="blanco">+ Nueva sesión</Boton>.
          </Paso>
          <Paso>
            Escribe el título y configura <strong>la ruta real de la empresa</strong>: el sistema (SAGRILAFT, SARLAFT o ambos), <strong>a quién se escala</strong> (ej. «Oficial
            de Cumplimiento») y <strong>por qué canal</strong> (ej. «el formato de operación inusual en la intranet»). Los retos usan estas palabras en sus textos. También
            defines el % mínimo por competencia para certificar (70 % por defecto).
          </Paso>
          <Paso>Comparte el código o el QR (panel «Equipos y jugadores» o Mi panel → Para compartir). Se puede jugar por equipos o de a una persona (un equipo de uno).</Paso>
          <Paso>
            En el <strong>🎛️ Mando</strong> abre los retos uno por uno con <Boton>Abrir reto 1</Boton>, o toca <Boton tono="blanco">Abrir todos (a su ritmo)</Boton> si cada
            quien avanza solo (por ejemplo, en una capacitación virtual).
          </Paso>
          <Paso>La tabla del mando muestra los puntos de cada equipo por reto. El ícono ↺ borra la jugada de un equipo para que la repita.</Paso>
          <Paso>
            Al final toca <Boton>🏁 Cerrar la sesión y ver resultados</Boton> (dos veces) y abre <strong>Cierre y evaluación</strong> y <strong>Certificados</strong>.
          </Paso>
        </Pasos>
        <Recuadro tipo="consejo">
          <p>
            Después de cada reto dedica 5 minutos a conectar con el manual real: «¿quién es nuestro oficial de cumplimiento?, ¿dónde está el formato?, ¿qué señales vemos en
            nuestro negocio?». El juego deja claro que las reglas concretas dependen del tipo de entidad y de su sistema de prevención.
          </p>
        </Recuadro>
      </Sub>

      <Sub titulo="Para los equipos: cómo se juega">
        <Pasos>
          <Paso>Entren con el código. Arriba ven la ruta y los 8 retos: 🔒 los cerrados, en amarillo el abierto y con ✓ los que ya entregaron.</Paso>
          <Paso>
            Los roles rotan en cada reto: 🔎 Observador (lee y dice qué le llama la atención), ❓ Preguntador (propone qué pedir o preguntar), 📖 Custodio (recuerda la ruta y
            cuida la información) y ✍️ Escriba (toca los botones).
          </Paso>
          <Paso>
            El Escriba toca <Boton>▶ Empezar el reto</Boton>. Un solo celular juega; los demás discuten. El reloj solo avisa: no cierra el reto.
          </Paso>
          <Paso>Cuando todo esté respondido, se activa el botón de entregar. Se entrega una sola vez por equipo.</Paso>
        </Pasos>
      </Sub>

      <Sub titulo="Puntos, competencias, perfiles y certificación">
        <Tabla
          cabeza={['Acción', 'Puntos']}
          filas={[
            ['Detectar señal de alerta', '+10'],
            ['Hacer una pregunta pertinente', '+10'],
            ['Solicitar información adecuada', '+15'],
            ['Identificar beneficiario final', '+15'],
            ['Escalar correctamente', '+20'],
            ['Documentar correctamente', '+10'],
            ['Proteger la información / reconocer que algo es normal', '+10'],
            ['Semáforo: color correcto +10 y razón sólida +15 (razón automática +5)', 'hasta +25'],
            ['Ignorar una alerta', '−20'],
            ['Decidir sin información suficiente', '−15'],
            ['Compartir información confidencial indebidamente', '−30'],
            ['Marcar como señal algo normal / pedir información que no corresponde / investigar por su cuenta', '−5 / −10 / −10'],
          ]}
        />
        <p>
          Cada reto alimenta una o varias de las <strong>5 competencias</strong>: 🔎 detectar señales, 🪪 conocer a la contraparte, 🚦 analizar y clasificar, 💸 seguir el
          dinero y 📣 escalar y proteger. El tablero muestra el % de cada una con una rayita en el mínimo para certificar.
        </p>
        <p>
          En lugar de premiar solo «quién sabe más», se reconocen <strong>perfiles</strong>: 🔎 Detective de Riesgos (detecta señales), ❓ Analista (hace buenas preguntas),
          🛡️ Guardián (escala bien y nunca compartió información reservada) y 🧭 Navegante (comprende el proceso completo).
        </p>
        <Recuadro tipo="idea" titulo="🛡️ Certificación Guardián del Riesgo">
          <p>
            Se entrega por dominio de competencias, no por puntos: el mínimo configurado (70 %) en las 5 competencias, el caso final completo y cero veces compartir información
            reservada. En <strong>Certificados</strong> sale un certificado por persona, uno por hoja, listo para imprimir o guardar en PDF.
          </p>
        </Recuadro>
      </Sub>

      <Sub titulo="Cierre y evaluación (el informe)">
        <Tabla
          filas={[
            ['🏆 Resultado por equipo', 'Puntos por reto, perfiles, nivel de comprensión (🔰 Inicial, 🌱 En desarrollo, ✅ Competente, 🛡️ Guardián), certificación y lo que le falta.'],
            ['🧩 Conceptos que requieren refuerzo', 'El promedio de cada competencia, de la más baja a la más alta.'],
            ['🚩 Señales con mayor dificultad', 'Qué tipo de señal se reconoció menos (terceros, efectivo, exterior, listas, precios…).'],
            ['❗ Errores frecuentes', 'Lo que más se repitió entre equipos: sirve de guion para la conversación final.'],
            ['👥 Resultado por colaborador', 'Cada persona con los retos que entregó, el nivel de su equipo y si certificó.'],
            ['💡 Recomendaciones de refuerzo', 'Generadas con los resultados. Se pueden enviar al plan de acción de un proceso.'],
          ]}
        />
        <p>
          El botón «Exportar a Excel» del panel de equipos baja cada persona con sus competencias y su certificación. Ver también{' '}
          <Ir href="#informes">Informes y opciones de mejora</Ir>.
        </p>
        <Recuadro tipo="ejemplo" titulo="Para verlo funcionando">
          <p>
            Los datos de demostración traen la sesión <strong>RIES26</strong> («La Ruta del Riesgo · Comercial y compras») ya cerrada, con 3 equipos: uno certificado como
            Guardián del Riesgo, uno en desarrollo y uno que solo alcanzó a completar 5 retos. Abre su Cierre y evaluación y sus Certificados.
          </p>
        </Recuadro>
      </Sub>

      <Pregunta p="¿Reemplaza la capacitación obligatoria de SAGRILAFT o SARLAFT?">
        <p>
          No. Es una forma de practicar decisiones. Los casos son inventados y deben complementarse con el manual y el procedimiento de la empresa. Por eso cada sesión se
          configura con a quién se escala y por qué canal.
        </p>
      </Pregunta>
      <Pregunta p="¿Por qué «investigar por mi cuenta» resta puntos?">
        <p>
          Porque la meta no es formar investigadores: es reconocer señales y activar la ruta. Averiguar por fuera del procedimiento puede alertar a los involucrados y dañar
          el análisis de quien sí tiene esa responsabilidad.
        </p>
      </Pregunta>
    </Seccion>
  );
}
