import { Boton, Ir, Paso, Pasos, Pregunta, Recuadro, Seccion, Sub, Tabla } from './piezas';

/** El recorrido de la información, en cajitas con flechas. */
function Flujo() {
  const pasos = [
    { e: '🗂️', t: 'Proyecto', d: 'El contrato con el cliente: fechas, horas, objetivos, cronograma.' },
    { e: '📊', t: 'Proceso', d: 'Lo que se va a mejorar, con su indicador y su meta.' },
    { e: '🎯', t: 'Makigami', d: 'Diagnóstico: el equipo encuentra dónde se pierde el tiempo.' },
    { e: '🔁', t: 'Kaizen', d: 'Entrenamiento: el equipo aprende a mejorar con datos.' },
    { e: '📋', t: 'Plan de acción', d: 'Las mejoras de los juegos, con responsable y fecha.' },
    { e: '📈', t: 'Medición', d: 'Cada semana se mide el indicador para ver si mejora.' },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {pasos.map((p, i) => (
        <div key={p.t} className="relative rounded-xl border border-marmol-200 bg-white p-3 text-center">
          <p className="text-2xl">{p.e}</p>
          <p className="text-sm font-bold text-secundario">
            {i + 1}. {p.t}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-marmol-500">{p.d}</p>
        </div>
      ))}
    </div>
  );
}

export function SeccionInicio() {
  return (
    <>
      <Seccion id="inicio" emoji="👋" titulo="Primeros pasos" resumen="Qué es AndMesApps, quién puede hacer qué y cómo se conectan todas las partes.">
        <Sub titulo="¿Qué es AndMesApps?">
          <p>
            Es una aplicación para <strong>consultoras y consultores en procesos</strong>. Sirve para tres cosas:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Ejecutar proyectos</strong> de consultoría sin perder nada de vista: fechas, entregables, horas, pagos y resultados.
            </li>
            <li>
              <strong>Hacer talleres con juegos</strong> (Cacería Makigami y Carrera Kaizen) para que el equipo del cliente encuentre y resuelva sus problemas.
            </li>
            <li>
              <strong>Controlar los procesos</strong> después del taller, para que las mejoras no se queden en el papel.
            </li>
          </ul>
          <p>Funciona en el computador y en el celular. No hay que instalar nada: solo se abre la dirección en el navegador.</p>
        </Sub>

        <Sub titulo="Cómo fluye la información">
          <p>Todas las partes están conectadas. Este es el camino típico de un cliente, de izquierda a derecha:</p>
          <Flujo />
          <Recuadro tipo="ejemplo" titulo="Ejemplo con los datos de demostración">
            <p>
              La empresa <strong>Distribuidora Andina</strong> contrata el proyecto <em>«Mejora del proceso de compras»</em>. Dentro del proyecto se crea el
              proceso <em>«Compra de papelería e insumos»</em>, que hoy tarda 12,4 días.
            </p>
            <p>
              Con el equipo se hace una <strong>Cacería Makigami</strong> (código CAZA26): encuentran que el 98 % del tiempo son esperas y aprueban 3 mejoras. Luego
              una <strong>Carrera Kaizen</strong> (código KAIZ26) entrena a Compras en mejora continua.
            </p>
            <p>
              Las mejoras de ambos juegos se envían al <strong>plan de acción</strong> del proceso. Cada semana se mide el tiempo: ya va en 9,6 días. Todo eso se ve en el
              proyecto y sale en el <strong>informe de avance</strong> para el cliente.
            </p>
          </Recuadro>
        </Sub>

        <Sub titulo="Los tres tipos de personas">
          <Tabla
            cabeza={['Rol', 'Qué puede hacer']}
            filas={[
              ['👑 Administrador', 'Todo. Ve los proyectos, procesos y juegos de todos, y crea las cuentas en Usuarios.'],
              ['🧭 Líder', 'Crea sus propios proyectos, procesos y juegos, y solo ve y maneja los suyos.'],
              ['🎯 Jugador', 'No necesita cuenta. Entra a un juego con el código de 6 letras o el QR, y juega.'],
            ]}
          />
          <Recuadro tipo="idea">
            <p>
              A los administradores y líderes la app los llama <strong>facilitadores</strong>: son quienes dirigen los talleres y los proyectos. Los jugadores son las
              personas del cliente que participan en los juegos.
            </p>
          </Recuadro>
        </Sub>

        <Sub titulo="Cómo entrar">
          <Pasos>
            <Paso>
              Abre <strong>andre-proy.vercel.app</strong> en el navegador.
            </Paso>
            <Paso>
              Arriba a la derecha toca <Boton tono="blanco">Soy facilitador</Boton>.
            </Paso>
            <Paso>Escribe tu correo y tu clave (te las da la administradora) y toca <Boton>Ingresar</Boton>.</Paso>
            <Paso>
              Llegas a <strong>Mi panel</strong>. La primera vez te pregunta <em>«¿Cómo te llamas?»</em>: escribe tu nombre y toca ✓. Con ese nombre te verán en toda la
              app.
            </Paso>
          </Pasos>
          <Recuadro tipo="consejo">
            <p>Los jugadores no hacen este paso: solo escriben el código del juego. Mira la sección <Ir href="#jugadores">Para los jugadores</Ir>.</p>
          </Recuadro>
        </Sub>

        <Sub titulo="El menú de arriba">
          <Tabla
            filas={[
              ['🧭 Mi panel', 'Tu página de inicio: lo urgente de hoy.'],
              ['🗂️ Proyectos', 'Todos tus proyectos de consultoría (portafolio).'],
              ['💰 Finanzas', 'Tus parámetros, la proyección mes a mes, la planilla de seguridad social y la rentabilidad de cada proyecto.'],
              ['🎲 Juegos', 'Los tres juegos: 🎯 Cacería Makigami, 🔁 Carrera Kaizen y 🧹 Reto 5S. También se entra a cada uno escribiendo su código.'],
              ['📊 Procesos', 'El Control de procesos.'],
              ['👥 Usuarios', 'Solo administradores: las cuentas.'],
              ['❓ Ayuda', 'Este manual.'],
            ]}
          />
          <p>En el celular el menú muestra solo los íconos para que quepa. Son los mismos de la tabla.</p>
        </Sub>
      </Seccion>

      <Seccion id="panel" emoji="🧭" titulo="Mi panel" resumen="Tu página de inicio. Reúne lo que necesitas ver cada mañana.">
        <Sub titulo="Qué hay en Mi panel, de arriba hacia abajo">
          <Pasos>
            <Paso>
              <strong>Saludo y botones rápidos</strong>: ir a Mis proyectos, crear una Cacería Makigami, una Carrera Kaizen o entrar al Control de procesos. El lápiz ✏️ al
              lado de tu nombre sirve para cambiarlo.
            </Paso>
            <Paso>
              <strong>Cuatro cifras</strong>: juegos abiertos, procesos activos (y cuántos cumplen la meta), acciones abiertas y acciones vencidas.
            </Paso>
            <Paso>
              <strong>Mis proyectos</strong>: cada proyecto activo con su semáforo (🟢 al día, 🟡 en riesgo, 🔴 atrasado) y su barra de avance. A la derecha,{' '}
              <strong>Esta semana</strong>: lo que vence en los próximos 7 días en todos tus clientes.
            </Paso>
            <Paso>
              <strong>Para compartir</strong>: los juegos que están abiertos, con su código, el enlace y los botones <Boton tono="blanco">Copiar invitación</Boton>,{' '}
              <Boton tono="blanco">💬 WhatsApp</Boton> y <Boton tono="blanco">QR</Boton> para proyectarlo en el salón.
            </Paso>
            <Paso>
              <strong>Mis procesos</strong> con su semáforo y las acciones vencidas, e <strong>Informes</strong> de los juegos más recientes.
            </Paso>
          </Pasos>
          <Recuadro tipo="consejo" titulo="Una rutina de 5 minutos">
            <p>Cada mañana abre Mi panel y mira, en este orden:</p>
            <ol className="ml-5 list-decimal">
              <li>Lo que está en rojo en «Esta semana» (vencido).</li>
              <li>Las acciones vencidas de los procesos.</li>
              <li>Los proyectos en 🟡 o 🔴: entra y lee sus alertas.</li>
            </ol>
          </Recuadro>
        </Sub>
      </Seccion>

      <Seccion id="usuarios" emoji="👥" titulo="Usuarios (solo administradores)" resumen="Crear, modificar y retirar las cuentas de administradores y líderes.">
        <Sub titulo="Crear una cuenta nueva">
          <Pasos>
            <Paso>
              En el menú toca <strong>👥 Usuarios</strong> y luego <Boton>+ Nueva cuenta</Boton>.
            </Paso>
            <Paso>
              Llena el <strong>nombre</strong> (así se identificará en toda la app), el <strong>correo</strong> (con él inicia sesión), el <strong>rol</strong> (Líder o
              Administrador) y una <strong>clave inicial</strong> de mínimo 8 caracteres.
            </Paso>
            <Paso>
              Toca <Boton>Crear cuenta</Boton> y entrégale a la persona su correo y su clave. Ella entra por «Soy facilitador».
            </Paso>
          </Pasos>
          <Recuadro tipo="ejemplo">
            <p>
              Nombre: <em>Laura Restrepo</em> · Correo: <em>laura@miempresa.com</em> · Rol: <em>Líder</em> · Clave: <em>Compras2026</em>. Laura podrá crear sus
              propios proyectos y juegos, y solo verá los suyos.
            </p>
          </Recuadro>
        </Sub>
        <Sub titulo="Modificar, cambiar clave o retirar">
          <Tabla
            filas={[
              [<Boton key="m" tono="blanco">✏️ Modificar</Boton>, 'Cambia el nombre, el rol o si la cuenta está activa. Desactivar = la persona no puede entrar, pero se puede reactivar.'],
              [<Boton key="c" tono="blanco">🔑 Clave</Boton>, 'Le pone una clave nueva. Entrégasela a la persona.'],
              [<Boton key="r" tono="blanco">👤 Retirar</Boton>, 'Borra la cuenta para siempre (pide confirmar). Sus proyectos y juegos no se pierden: quedan a cargo de los administradores.'],
            ]}
          />
          <Recuadro tipo="ojo">
            <p>
              Las cuentas marcadas <strong>principal</strong> están fijas en la configuración del servidor (Vercel). A ellas solo se les puede cambiar el nombre; no se
              pueden desactivar ni retirar desde aquí, para que nadie quede por fuera por error.
            </p>
          </Recuadro>
        </Sub>
        <Pregunta p="¿Qué diferencia hay entre desactivar y retirar?">
          <p>
            <strong>Desactivar</strong> es como pausar: la persona no puede entrar, pero su cuenta sigue ahí y la puedes volver a activar. <strong>Retirar</strong> borra la
            cuenta. Si no estás segura, desactiva.
          </p>
        </Pregunta>
      </Seccion>
    </>
  );
}
