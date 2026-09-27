import { Boton, Ir, Paso, Pasos, Pregunta, Recuadro, Seccion, Sub, Tabla } from './piezas';

export function SeccionMudaGami() {
  return (
    <Seccion
      id="mudagami"
      emoji="🚚"
      titulo="MudaGami · Kayou — la ruta del transporte"
      resumen="Un juego corto (30 a 45 minutos) para sentir en carne propia la muda de transporte: mover cosas de un lado a otro sin necesidad."
    >
      <Sub titulo="¿De qué se trata?">
        <p>
          Cada equipo produce un lote de <strong>15 piezas de papel</strong> (5 triángulos, 5 cuadrados, 5 circunferencias) pasando por{' '}
          <strong>6 estaciones fijas</strong> de una planta: bodega de materia prima, corte recto, corte circular, perforado, pintura y bodega de producto
          terminado. Cada vez que mueven algo entre dos estaciones que <strong>no quedan una al lado de la otra</strong>, tienen que usar el montacargas o la
          carretilla — y eso es exactamente lo que se mide: cuántos traslados hicieron, cuánto tiempo tomaron y cuánto costaron.
        </p>
        <Tabla
          cabeza={['Medio de transporte', 'Reglas']}
          filas={[
            ['🚛 Montacargas', 'Hasta 3 artículos por viaje · 10 minutos · $2.000 por viaje.'],
            ['🛒 Carretilla', '1 artículo por viaje · 5 minutos · sin costo.'],
          ]}
        />
        <p>Después de medir la primera producción, cada equipo tiene 4 minutos para rediseñar su propia planta y volver a producir. Ahí está la lección: acomodar bien las estaciones reduce el transporte sin gastar un peso más.</p>
      </Sub>

      <Sub titulo="1. Materiales físicos (los reparte la facilitadora)">
        <p>El juego combina algo físico (cortar y marcar papel) con la app (medir y comparar). Antes del taller, prepara para cada equipo:</p>
        <Pasos>
          <Paso>Una hoja con las 15 figuras para recortar (5 triángulos, 5 cuadrados, 5 circunferencias).</Paso>
          <Paso>Un par de tijeras (o dos, si el equipo quiere dividirse el corte recto y el circular).</Paso>
          <Paso>Un punzón o algo para perforar (solo se perforan triángulos —1 hueco— y cuadrados —2 huecos—; las circunferencias no se perforan).</Paso>
          <Paso>Un marcador o resaltador para «pintar» cada figura.</Paso>
          <Paso>Un espacio de mesa donde el equipo pueda acomodar sus 6 estaciones (unas hojas o tarjetas con el nombre de cada una sirven).</Paso>
        </Pasos>
        <Recuadro tipo="idea">
          <p>
            La app no simula el corte ni el pintado: eso lo hace el equipo con sus manos, como en un taller real. El celular o el computador es el «formato de
            medición de transportes» de toda la vida, pero automático.
          </p>
        </Recuadro>
      </Sub>

      <Sub titulo="2. Crear el reto e invitar a los jugadores">
        <Pasos>
          <Paso>
            En el menú toca <strong>🎲 Juegos → 🚚 MudaGami · Kayou</strong> y luego <Boton tono="blanco">+ Nuevo reto</Boton>.
          </Paso>
          <Paso>
            Escribe el título, cuántos minutos dura cada corrida (por defecto 10) y cuántos minutos tiene el rediseño (por defecto 4, como en el material
            original). Toca <Boton>Crear reto</Boton>.
          </Paso>
          <Paso>
            Comparte el <strong>código</strong> de 6 letras o el <strong>QR</strong> con los equipos, igual que en los demás juegos (también sale en{' '}
            <Ir href="#panel">Mi panel → Para compartir</Ir>).
          </Paso>
          <Paso>Puedes crear los equipos antes o dejar que se armen solos al inscribirse.</Paso>
        </Pasos>
      </Sub>

      <Sub titulo="3. Corrida 1 (línea base)">
        <Pasos>
          <Paso>
            Toca <Boton>🚚 Empezar: Corrida 1</Boton> y luego <Boton tono="blanco">▶ Iniciar cronómetro</Boton> cuando el equipo esté listo.
          </Paso>
          <Paso>Todos ven el mismo diseño de planta (fijo, igual para todos los equipos) y empiezan a producir sus 15 piezas.</Paso>
          <Paso>
            Cada vez que el equipo hace un traslado no contiguo, cualquier integrante toca <Boton tono="blanco">+ Montacargas</Boton> (eligiendo cuántos artículos,
            1 a 3) o <Boton tono="blanco">+ Carretilla</Boton> en su celular. La Tabla 1 (traslados, tiempo, costo) se actualiza sola.
          </Paso>
          <Paso>Si alguien se equivoca, el botón «Deshacer» quita el último traslado registrado del equipo.</Paso>
          <Paso>
            Cuando terminen las 15 piezas, toca <Boton>🧭 Cerrar corrida 1 y pasar a Rediseño</Boton>.
          </Paso>
        </Pasos>
      </Sub>

      <Sub titulo="4. Rediseño de planta">
        <Pasos>
          <Paso>
            Inicia los <strong>4 minutos</strong> con <Boton tono="blanco">▶ Iniciar los 4 minutos</Boton>.
          </Paso>
          <Paso>Cada equipo, en su propio celular, toca una estación del tablero y luego otra para intercambiarlas de lugar — no hay que arrastrar nada.</Paso>
          <Paso>
            Debajo del tablero se ve en vivo el <strong>mínimo de traslados posible</strong> con el diseño que llevan armado: es una pista, no una obligación, para
            que sepan si todavía pueden mejorar más.
          </Paso>
          <Paso>El diseño se guarda solo, cada vez que lo cambian. No hace falta un botón de «Guardar».</Paso>
        </Pasos>
        <Recuadro tipo="consejo">
          <p>La idea es acercar las estaciones que van seguidas en el proceso (por ejemplo, corte y perforado) para que dejen de necesitar montacargas o carretilla entre ellas.</p>
        </Recuadro>
      </Sub>

      <Sub titulo="5. Corrida 2 y resultados">
        <Pasos>
          <Paso>
            Toca <Boton>🚚 Empezar Corrida 2</Boton>: ahora cada equipo produce con <strong>su propio</strong> diseño.
          </Paso>
          <Paso>Se vuelve a medir igual que en la corrida 1.</Paso>
          <Paso>
            Toca <Boton>🎉 Cerrar el reto y publicar resultados</Boton> para ver, por equipo, cuánto redujeron en tiempo y costo de transporte, el ranking de
            equipos y el individual, y las insignias.
          </Paso>
          <Paso>
            Abre <strong>Informe y opciones de mejora</strong> para imprimirlo y enviar las recomendaciones al plan de acción de un proceso (ver{' '}
            <Ir href="#informes">Informes</Ir>).
          </Paso>
        </Pasos>
        <p>Insignias: 🚚 Transportista (registró en las dos corridas), 📉 Reductor de mudas (bajó 50 % o más el tiempo), 📐 Arquitecto de planta (llegó al mínimo teórico) y 💰 Cero desperdicio (dejó el costo en $0).</p>
      </Sub>

      <Pregunta p="¿De dónde salió este juego?">
        <p>
          Es la versión digital de un juego físico de la consultora («Kayou»): el tablero, las 6 estaciones, las reglas de montacargas y carretilla y el formato
          de medición de transportes son los mismos; la app solo automatiza la medición y la comparación.
        </p>
      </Pregunta>
      <Pregunta p="¿Se puede jugar sin estar todos en el mismo salón?">
        <p>
          Sí, cada equipo puede estar en un lugar distinto siempre que tenga sus materiales físicos y alguien registrando los traslados desde el celular. Lo único
          que necesitan compartir es el reloj (por eso el cronómetro lo controla la facilitadora para todos a la vez).
        </p>
      </Pregunta>
    </Seccion>
  );
}
