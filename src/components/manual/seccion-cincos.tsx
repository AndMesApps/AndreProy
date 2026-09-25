import { Boton, Ir, Paso, Pasos, Pregunta, Recuadro, Seccion, Sub, Tabla } from './piezas';

export function SeccionCincos() {
  return (
    <Seccion
      id="cincos"
      emoji="🧹"
      titulo="Reto 5S — Del caos al flujo"
      resumen="Un juego por misiones para vivir las 5S tomando decisiones (no respondiendo preguntas) y llevarlas a un espacio real de la empresa."
    >
      <Sub titulo="¿Qué son las 5S y cómo es el juego?">
        <p>
          Las 5S son cinco hábitos japoneses para tener un lugar de trabajo ordenado, limpio y seguro: <strong>Clasificar</strong> (Seiri), <strong>Ordenar</strong>{' '}
          (Seiton), <strong>Limpiar</strong> (Seiso), <strong>Estandarizar</strong> (Seiketsu) y <strong>Sostener</strong> (Shitsuke).
        </p>
        <p>
          En el juego cada S es una <strong>misión</strong> con una historia y un reto. Al terminarla, la app les «revela» qué S acaban de descubrir y el error más común.
          Después viene la <strong>misión real</strong>: aplicar las 5S a un espacio de su empresa.
        </p>
        <Tabla
          cabeza={['Misión', 'Qué hace el equipo']}
          filas={[
            ['🔴 1 · Clasificar', 'En 90 segundos decide, de 20 objetos, cuáles se quedan (🟢), cuáles salen (🔴) y cuáles van a la zona de dudas con tarjeta roja (🟡).'],
            ['🟠 2 · Ordenar', 'Arrastra cada elemento a su zona según qué tan seguido se usa (al alcance, mueble cercano o archivo). Luego alguien que no ordenó debe encontrar 5 elementos, cada uno en menos de 10 segundos.'],
            ['🟡 3 · Limpiar', 'En 2 minutos encuentra 10 anomalías escondidas (fugas, cables, extintores vencidos…) y decide para cada una si solo limpia o elimina la causa.'],
            ['🟢 4 · Estandarizar', 'Elige para el checklist las frases que cualquiera puede verificar («herramientas en su silueta») y descarta las vagas («mantener ordenado»). Asigna el control visual a cada problema.'],
            ['🔵 5 · Sostener', 'Tres eventos sorpresa: una urgencia (¿hacen la rutina igual?), un colaborador nuevo que busca en el orden que ELLOS dejaron en la misión 2, y un cambio de turno que auditan con su estándar.'],
            ['🚀 Misión real', 'Eligen un espacio real, lo auditan antes, registran evidencias, hallazgos, una acción por cada S, resultados y lo auditan después.'],
          ]}
        />
      </Sub>

      <Sub titulo="Para la facilitadora: preparar y dirigir el reto">
        <Pasos>
          <Paso>
            Entra a <strong>🎲 Juegos → 🧹 Reto 5S</strong> y toca <Boton tono="blanco">+ Nuevo Reto 5S</Boton>. Escribe el título y elige el escenario:{' '}
            <strong>🏢 Oficina administrativa</strong> o <strong>🔧 Taller de mantenimiento</strong>.
          </Paso>
          <Paso>Comparte el código o el QR (panel «Equipos y jugadores» o Mi panel → Para compartir). Los equipos se inscriben desde el celular.</Paso>
          <Paso>
            En el <strong>🎛️ Mando</strong> toca <Boton>Abrir misión 1: 🔴 Clasificar</Boton>. Cada misión que abras queda disponible: cada equipo avanza a su ritmo.
          </Paso>
          <Paso>
            La tabla del mando muestra los puntos de cada equipo en cada misión. Si un equipo tuvo un problema, el ícono ↺ borra su jugada para que la repita.
          </Paso>
          <Paso>
            Cuando abras la <strong>🚀 misión real</strong>, los equipos llenan su formulario. Revísalas en «Misiones reales para revisar»: escribe una retroalimentación, da
            puntos extra (0 a 100) y toca <Boton>✅ Validar</Boton> o <Boton tono="blanco">✏️ Devolver para corregir</Boton>.
          </Paso>
          <Paso>
            Al final toca <Boton>🏁 Cerrar el reto y ver resultados</Boton> (dos veces para confirmar) y abre el <strong>Informe y opciones de mejora</strong>.
          </Paso>
        </Pasos>
        <Recuadro tipo="consejo">
          <p>
            Abre una misión, deja que todos la jueguen (5 a 10 minutos), haz una pausa de 5 minutos para conversar qué aprendieron y abre la siguiente. La conversación
            después de cada misión es donde más se aprende.
          </p>
        </Recuadro>
      </Sub>

      <Sub titulo="Para los equipos: cómo se juega cada misión">
        <Pasos>
          <Paso>Entren con el código. Arriba verán el camino de las 6 misiones: 🔒 las cerradas, en amarillo la abierta y con ✓ las que ya entregaron.</Paso>
          <Paso>
            Lean la historia y el reto. Debajo aparece el <strong>rol de cada integrante</strong> en esa misión: 🔎 Explorador (busca), 🧠 Analista (pregunta por qué), 🎯
            Estratega (decide) y 🛠️ Ejecutor (toca los botones). Los roles rotan en cada misión.
          </Paso>
          <Paso>
            El Ejecutor toca <Boton>▶ Empezar la misión</Boton>: arranca el reloj para todo el equipo. <strong>Un solo celular juega</strong>; los demás aportan desde su
            rol.
          </Paso>
          <Paso>
            Al terminar toquen <Boton>Entregar misión</Boton>. Solo se entrega una vez por equipo. Verán sus puntos, lo que descubrieron y el «cuidado» de esa S.
          </Paso>
        </Pasos>
      </Sub>

      <Sub titulo="La misión real paso a paso">
        <Pasos>
          <Paso>
            <strong>¿Qué vamos a mejorar?</strong> Elijan el tipo (área, proceso, puesto, oficina, archivo, herramientas o información digital), escriban el espacio y su
            problema.
          </Paso>
          <Paso>
            <strong>Auditoría ANTES</strong>: califiquen de 0 a 4 cada S como está hoy. La app calcula el % 5S.
          </Paso>
          <Paso>
            <strong>Evidencia inicial</strong>: peguen el enlace a la foto o video (Google Drive, OneDrive o el enlace del mensaje de WhatsApp).
          </Paso>
          <Paso>
            <strong>¿Qué encontramos?</strong> Cuántos innecesarios, cosas sin lugar, focos de suciedad, fallas, riesgos e información obsoleta.
          </Paso>
          <Paso>
            <strong>Aplicamos las 5S</strong>: escriban una acción concreta por cada S.
          </Paso>
          <Paso>
            <strong>Evidencia final</strong>, <strong>resultados</strong> (minutos ahorrados, tiempo de búsqueda antes y después, espacio liberado, elementos y riesgos
            eliminados) y <strong>auditoría DESPUÉS</strong>.
          </Paso>
          <Paso>
            Pueden <Boton tono="blanco">Guardar borrador</Boton> las veces que quieran. Cuando esté completo, <Boton>🚀 Enviar a la facilitadora</Boton>.
          </Paso>
        </Pasos>
        <Recuadro tipo="ejemplo">
          <p>
            Los Clasificadores mejoraron el <em>archivo de compras</em>: sacaron 14 cajas, etiquetaron los estantes por año y proveedor, repararon una gotera y dejaron una
            foto estándar en la puerta. La búsqueda de una orden bajó de 15 minutos a 45 segundos y su % 5S pasó de 25 % a 85 %.
          </p>
        </Recuadro>
      </Sub>

      <Sub titulo="Puntos y tablero">
        <Tabla
          cabeza={['Qué se premia', 'Cómo']}
          filas={[
            ['Calidad', 'Cada decisión correcta suma; las incorrectas restan (marcar lo que está bien como anomalía, elegir frases vagas…).'],
            ['Comprensión', 'Atacar la causa en Limpiar vale 10; solo limpiar, 2. Elegir frases verificables en Estandarizar.'],
            ['Colaboración', '+15 por cada persona distinta que entregue una misión (hasta +60). Por eso rotan los roles.'],
            ['Sostenibilidad', 'La misión 5: la urgencia, el colaborador nuevo y la auditoría del cambio de turno.'],
            ['Aplicación real', 'Enviada +100 o validada +250, +10 por cada evidencia (de 10), +2 por cada punto que mejore el % 5S y los puntos extra de la facilitadora.'],
            ['Velocidad', 'Solo un pequeño bono en Clasificar y Limpiar si terminan antes del tiempo.'],
          ]}
        />
        <p>
          El <strong>🏆 Tablero de equipos</strong> muestra: % 5S (de la auditoría después), tiempo total, errores, evidencias y puntos. El informe trae las opciones de
          mejora (la S más débil, replicar lo que funcionó, equipos sin misión real) para enviarlas al plan de acción de un proceso. Ver{' '}
          <Ir href="#informes">Informes y opciones de mejora</Ir>.
        </p>
      </Sub>

      <Pregunta p="¿Por qué la misión 5 usa lo que hicimos en la misión 2?">
        <p>
          Porque sostener significa que el orden funciona para otros. Si en la misión 2 pusieron algo en un lugar raro, el «colaborador nuevo» lo buscará allí y no lo
          encontrará: así descubren que el orden debe ser lógico para cualquiera, no solo para quien lo hizo.
        </p>
      </Pregunta>
      <Pregunta p="¿Dónde subo las fotos de la misión real?">
        <p>
          Por ahora la app guarda el <strong>enlace</strong>: suban la foto a Google Drive o a OneDrive y peguen el enlace, o copien el enlace del mensaje de WhatsApp donde la
          compartieron.
        </p>
      </Pregunta>
    </Seccion>
  );
}
