import { Boton, Ir, Paso, Pasos, Pregunta, Recuadro, Seccion, Sub, Tabla } from './piezas';

export function SeccionMudaLab() {
  return (
    <Seccion
      id="mudalab"
      emoji="🕵️"
      titulo="MudaLab — La misión de recuperar el flujo"
      resumen="Un juego de detectives para aprender a encontrar desperdicios (Mudas), llegar a su causa, probar soluciones con presupuesto y sostener la mejora. Termina con Mudas reales del trabajo de cada persona."
    >
      <Sub titulo="¿De qué se trata?">
        <p>
          Cada equipo es una <strong>agencia de detectives</strong>. Reciben el <strong>📁 Expediente #047: «La compra que tardaba 5 días»</strong>: pedir un paquete de
          hojas en una empresa inventada tarda 5 días y casi 1 de cada 5 solicitudes se devuelve. Su misión: recuperar el flujo.
        </p>
        <p>
          El juego sigue las 5 fases del método <strong>DMAIC</strong> (Definir, Medir, Analizar, Mejorar y Controlar). Los «enemigos» son las{' '}
          <strong>8 Mudas</strong>, es decir, los 8 tipos de desperdicio:
        </p>
        <Tabla
          cabeza={['Muda', 'Qué es y un ejemplo del caso']}
          filas={[
            ['🚚 Transporte', 'Mover papeles o cosas sin necesidad. Ej.: Subir el formato impreso al 3.er piso.'],
            ['📦 Inventario', 'Guardar más de lo necesario. Ej.: Papelería para 6 meses en el almacén.'],
            ['🚶 Movimiento', 'Personas que caminan o buscan de más. Ej.: Ir al almacén a recoger y no encontrar a nadie.'],
            ['⏳ Espera', 'Trabajo detenido esperando algo. Ej.: 2 días esperando una firma de 2 minutos.'],
            ['🖨️ Sobreproducción', 'Hacer más de lo que se necesita. Ej.: Imprimir 3 copias que nadie lee.'],
            ['🔁 Sobreprocesamiento', 'Trabajo que el cliente no valora. Ej.: Un formato de 34 datos cuando se usan 9.'],
            ['❌ Defectos', 'Errores que obligan a repetir. Ej.: 18 % de solicitudes devueltas por datos incompletos.'],
            ['🧠 Talento no aprovechado', 'Personas capaces en tareas que no usan lo que saben. Ej.: Una experta en negociación copiando precios a mano.'],
          ]}
        />
      </Sub>

      <Sub titulo="Las misiones">
        <Tabla
          cabeza={['Misión', 'Qué hace el equipo']}
          filas={[
            ['🎯 1 · Definir', 'Elige la definición correcta del problema (la que se mide y no culpa a nadie), a quién afecta, dónde empieza y termina el proceso, el indicador y la meta.'],
            ['🔎 2 · Medir (Gemba)', 'Primero ve los 5 pasos del manual. Al tocar «Ir al Gemba» descubre que en la realidad hay 12. Con 8 fichas de investigación usa la lente 📊 datos (tiempos de trabajo y espera) y 👀 observar (una pista por paso). Marca la Muda de cada paso, el cuello de botella y qué parte del tiempo agrega valor.'],
            ['🧩 3 · Analizar', '5 porqués con pistas falsas: si culpan a una persona, pierden puntos. Al llegar al quinto aparece «🔓 CAUSA RAÍZ DESBLOQUEADA». Luego ubican 8 causas en el diagrama de Ishikawa (espina de pescado).'],
            ['🧪 4 · Mejorar', 'Con $500.000, 3 personas y 1 semana eligen tarjetas de solución (algunas son trampas caras). Pueden hacer hasta 3 experimentos: la app muestra el antes y el después en días y en % de devoluciones. Entregan el mejor.'],
            ['🛡️ 5 · Controlar', '«3 semanas después… la Muda regresó». Eligen hasta 3 mecanismos para sostener la mejora (estándar, indicador, tablero, inducción, alerta, auditoría…) y ven una gráfica de 12 semanas: con su sistema contra sin control.'],
            ['🏢 Mundo 2 · Mi proceso', 'Cada persona registra una Muda de su propio trabajo en el Banco de oportunidades: proceso, problema, tipo de Muda, evidencia, causa, idea, estado y minutos que se pierden por semana. Todos votan 👍 las de otros equipos.'],
          ]}
        />
        <Recuadro tipo="idea" titulo="Después de cada misión, la app enseña">
          <p>
            Al entregar, el equipo ve su puntaje, la lección de esa fase y un botón <strong>🔎 Revisar la misión</strong> con lo que era correcto (por ejemplo, la tabla con la
            Muda escondida en cada paso).
          </p>
        </Recuadro>
      </Sub>

      <Sub titulo="Para la facilitadora: preparar y dirigir el caso">
        <Pasos>
          <Paso>
            En el menú abre <strong>🎲 Juegos → 🕵️ MudaLab</strong> y toca <Boton tono="blanco">+ Nuevo caso MudaLab</Boton>. Escribe un título (ej. «MudaLab · Equipo
            administrativo») y un mensaje opcional.
          </Paso>
          <Paso>Comparte el código o el QR (panel «Equipos y jugadores» o Mi panel → Para compartir). Las personas se inscriben desde el celular en su agencia.</Paso>
          <Paso>
            En el <strong>🎛️ Mando</strong> toca <Boton>Abrir misión 1: 🎯 Definir</Boton>. Cada misión abierta queda disponible: cada equipo avanza a su ritmo.
          </Paso>
          <Paso>La tabla del mando muestra los puntos de cada equipo por misión. El ícono ↺ borra la jugada de un equipo para que la repita.</Paso>
          <Paso>
            Después de la misión 5 abre <strong>🏢 el Mundo 2: Mi proceso</strong>. Verás el Banco de oportunidades llenarse en vivo. Puedes borrar lo que no corresponda.
          </Paso>
          <Paso>
            Al final toca <Boton>🏁 Cerrar el caso y ver resultados</Boton> (dos veces) y abre el <strong>Informe y opciones de mejora</strong>. Las oportunidades más
            votadas aparecen como opciones para enviar al plan de acción de un proceso real.
          </Paso>
        </Pasos>
        <Recuadro tipo="consejo">
          <p>
            Duración sugerida: 5 minutos Definir, 10 Medir, 8 Analizar, 10 Mejorar y 5 Controlar, con 5 minutos de conversación después de cada una. Pregunta siempre:
            «¿dónde vemos esta Muda en nuestro trabajo?». Eso prepara el Mundo 2.
          </p>
        </Recuadro>
      </Sub>

      <Sub titulo="Para los equipos: cómo se juega">
        <Pasos>
          <Paso>Entren con el código. Arriba ven el camino de las misiones: 🔒 las cerradas, en amarillo la abierta y con ✓ las que ya entregaron.</Paso>
          <Paso>
            Cada integrante tiene un rol que rota en cada misión: 🕵️ Detective (observa y lee las pistas), 📊 Analista (mira los datos), 🧩 Estratega (propone y cuida el
            presupuesto) y ✍️ Escriba (toca los botones y entrega).
          </Paso>
          <Paso>
            El Escriba toca <Boton>▶ Empezar la misión</Boton>. <strong>Un solo celular juega</strong>; los demás investigan y opinan.
          </Paso>
          <Paso>
            Cuando estén listos, toquen el botón de entregar (se activa cuando todo está respondido). Solo se entrega una vez por equipo.
          </Paso>
        </Pasos>
      </Sub>

      <Sub titulo="Puntos, madurez e insignias">
        <Tabla
          cabeza={['Qué se premia', 'Puntos']}
          filas={[
            ['Definir bien el problema', '20 por cada respuesta correcta (hasta 120).'],
            ['Detectar una Muda', '15, y +5 si la observaron en el Gemba (con evidencia). Marcar una Muda donde no la hay resta 10.'],
            ['Clasificar el tipo de Muda', '15 por cada una bien clasificada.'],
            ['Medir', '50 por el cuello de botella y 50 por la eficiencia real.'],
            ['Causa raíz', '20 por cada porqué acertado al primer intento y 70 por la causa raíz. Culpar a una persona resta 20.'],
            ['Ishikawa', '10 por cada causa en su categoría.'],
            ['Proponer', '150 si el plan ataca la causa raíz con la bandeja digital; menos si no.'],
            ['Mejorar el indicador', 'Hasta 300 según cuánto se acerquen a 2 días, y hasta 300 según cuánto se acerquen a 5 % de devoluciones. +50 si hicieron 2 o más experimentos.'],
            ['Sostener', 'Hasta 400, según el % de sostenibilidad de su sistema de control.'],
            ['Compartir aprendizaje', '100 por cada oportunidad real en el Banco (hasta 3 por equipo) y 10 por cada 👍 recibido (hasta 100).'],
            ['Colaboración', '+15 por cada persona distinta que entregue una misión (hasta +60).'],
          ]}
        />
        <p>
          La <strong>🪜 escalera de madurez</strong> muestra qué tan lejos llegó cada equipo en 8 niveles: 👀 la vio, 🏷️ la clasificó, 📏 la midió, 🔓 encontró la causa, 💡
          propuso, 🧪 experimentó, 📉 demostró y 🛡️ la sostuvo. Además hay <strong>insignias</strong>: 🕵️ Detective (las 8 Mudas), 🔓 Rompecausas (causa raíz sin culpar a
          nadie), 💰 Ahorrador (meta de días gastando $300.000 o menos), 🛡️ Guardián (90 % de sostenibilidad) y 🏹 Cazador real (3 o más Mudas en el Banco).
        </p>
        <p>
          El informe del caso trae los resultados por agencia, cuántos equipos llegaron a cada nivel, el Banco de oportunidades agrupado por Muda y las opciones de mejora.
          Ver <Ir href="#informes">Informes y opciones de mejora</Ir>.
        </p>
      </Sub>

      <Pregunta p="¿Cuál es la mejor solución en el laboratorio?">
        <p>
          No hay una sola. La combinación «firma solo para compras grandes» + «bandeja digital con datos obligatorios» ataca la causa raíz. Después, cada equipo decide si
          prioriza los días (catálogo de proveedores) o los defectos (capacitación). Comprar software o contratar a alguien no cabe en el presupuesto: esa es la trampa.
        </p>
      </Pregunta>
      <Pregunta p="¿En qué se diferencia de la Cacería Makigami?">
        <p>
          La Cacería Makigami se hace sobre un proceso real del cliente que tú dibujas. MudaLab trae un caso listo para entrenar el método completo (de la definición al
          control) sin preparar nada, y al final lleva a cada persona a su propio trabajo con el Banco de oportunidades.
        </p>
      </Pregunta>
    </Seccion>
  );
}
