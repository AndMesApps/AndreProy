import { Boton, Ir, Paso, Pasos, Pregunta, Recuadro, Seccion, Sub, Tabla } from './piezas';

export function SeccionFinanzas() {
  return (
    <Seccion
      id="finanzas"
      emoji="💰"
      titulo="Finanzas: cuánto te queda de verdad"
      resumen="Cómo cobrar cada proyecto (valor fijo o por horas), qué te descuentan, cuánto pagas de seguridad social, cuánto puedes gastar y cuánto te queda libre."
    >
      <Sub titulo="La idea en una frase">
        <p>
          No es lo mismo lo que <strong>cobras</strong> que lo que <strong>te queda</strong>. Entre una cosa y otra están las retenciones, la seguridad social, los gastos, el
          aliado, el ICA, la renta y el 4x1000. La app hace esas cuentas por ti, proyecto por proyecto y mes a mes.
        </p>
        <Recuadro tipo="ojo">
          <p>
            Los cálculos son para <strong>planear y decidir</strong>. No reemplazan a tu contador ni la liquidación oficial de la planilla o de los impuestos. Los valores de ley
            (salario mínimo, UVT, tarifas) se pueden cambiar en «Mis parámetros».
          </p>
        </Recuadro>
      </Sub>

      <Sub id="finanzas-parametros" titulo="Paso 1: tus parámetros (se hace una sola vez)">
        <Pasos>
          <Paso>
            En el menú toca <strong>💼 Consultoría → 💰 Mis finanzas</strong>. Arriba está <strong>Mis parámetros</strong>.
          </Paso>
          <Paso>
            Revisa los <strong>valores de ley</strong>: salario mínimo y UVT del año. La app trae valores de referencia; confírmalos con tu contador.
          </Paso>
          <Paso>
            <strong>Seguridad social</strong>: normalmente se deja como viene (base del 40 %, salud 12,5 %, pensión 16 %). Elige tu <strong>clase de riesgo ARL</strong>: para
            consultoría de oficina es la I; si visitas plantas con frecuencia, puede ser la II.
          </Paso>
          <Paso>
            <strong>Impuestos</strong>: tu retención en la fuente habitual (honorarios: 10 % u 11 %), el reteICA de tu municipio (por mil) y la provisión para renta (tu tasa
            aproximada; pregúntale a tu contador).
          </Paso>
          <Paso>
            <strong>Metas</strong>: cuánto quieres facturar al mes y qué margen quieres que te quede (por ejemplo 40 %). Toca <Boton>Guardar mis parámetros</Boton>.
          </Paso>
        </Pasos>
      </Sub>

      <Sub id="finanzas-cobro" titulo="Paso 2: cómo se cobra cada proyecto">
        <p>
          Entra al proyecto → pestaña <strong>💰 Finanzas</strong> → <strong>Configurar</strong>. Elige la forma de cobro:
        </p>
        <Tabla
          filas={[
            ['Valor fijo', 'Un valor total por el proyecto (se paga en cuotas o contra entregables). Ej.: $18.000.000.'],
            ['Por horas', 'Cada hora tiene un valor. Total = horas × valor hora. Ej.: 60 h × $235.000 = $14.100.000.'],
            ['Mixto', 'Un valor fijo por lo contratado y las horas de más se cobran aparte al valor hora.'],
          ]}
        />
        <p>Luego completa, si aplica:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Cobro IVA</strong>: solo si eres responsable de IVA. El IVA no es tuyo: la app lo separa para que lo apartes.
          </li>
          <li>
            <strong>Retención en la fuente y reteICA</strong> de este contrato (si los dejas vacíos, usa tus parámetros).
          </li>
          <li>
            <strong>Otras deducciones</strong>: estampillas o contribuciones (comunes en contratos con entidades públicas).
          </li>
          <li>
            <strong>Participación de un aliado</strong>: el % que le toca a un socio o a quien te trajo el cliente.
          </li>
          <li>
            <strong>Viáticos que paga el cliente</strong>: lo que te reconoce por viajes en todo el proyecto.
          </li>
          <li>
            <strong>Requisitos para cobrar</strong>, uno por línea (toca «Usar los requisitos sugeridos»): factura, planilla PILA pagada, informe de actividades, aprobación
            del supervisor…
          </li>
        </ul>
      </Sub>

      <Sub id="finanzas-leer" titulo="Paso 3: leer la pestaña Finanzas del proyecto">
        <Tabla
          filas={[
            ['Te queda libre', 'Lo que te queda después de todo, con lo planeado. Verde si llegas a tu margen objetivo; rojo si no.'],
            ['Valor real de tu hora', 'Lo que te queda libre dividido entre las horas del proyecto. Compáralo con lo que cobras por hora.'],
            ['Puedes gastar hasta', 'El máximo de gastos para no bajar de tu margen objetivo. Debajo ves cuánto llevas gastado.'],
            ['Seguridad social del proyecto', 'Lo que este proyecto aporta a tu planilla (estimado).'],
            ['📊 Rentabilidad', 'La cuenta completa, planeado contra real a la fecha, renglón por renglón.'],
            ['💳 Lo que entra a tu cuenta', 'Lo que te consignan después de retenciones (y el IVA que debes apartar).'],
            ['⏱ Horas', 'Horas usadas contra contratadas, y un aviso si tienes horas trabajadas sin facturar.'],
            ['🧾 Presupuesto de gastos', 'Planeado contra real por categoría: transporte, alimentación, alojamiento, insumos, apoyo profesional, software, pólizas…'],
            ['💵 Cobros, viáticos y gastos', 'Cada movimiento con su estado y, en los cobros, la lista de requisitos para marcar ✓ a medida que los cumples.'],
            ['🏥 Seguridad social mes a mes', 'La base de cotización y los aportes de cada mes del proyecto.'],
          ]}
        />
        <Recuadro tipo="ejemplo" titulo="Ejemplo completo: 60 horas a $235.000">
          <p>Ingreso: 60 × $235.000 = <strong>$14.100.000</strong> (sin IVA). Retención 10 %, reteICA 9,66 por mil, gastos planeados $1.200.000, viáticos pactados $800.000.</p>
          <ul className="ml-5 list-disc">
            <li>Te consignan: $14.100.000 − $1.410.000 (retención) − $136.206 (reteICA) = <strong>$12.553.794</strong>.</li>
            <li>Gastos netos: $1.200.000 − $800.000 de viáticos = $400.000.</li>
            <li>Seguridad social: 40 % × (12,5 % + 16 % + 0,522 %) ≈ 11,6 % del ingreso = $1.636.841.</li>
            <li>ICA $136.206, provisión de renta 8 % ≈ $965.053, 4x1000 ≈ $50.215.</li>
            <li>
              Te queda libre ≈ <strong>$10.911.685</strong> → el valor real de tu hora es ≈ <strong>$181.861</strong>, no $235.000.
            </li>
          </ul>
          <p>La retención en la fuente no se pierde: es un anticipo de tu impuesto de renta y se descuenta cuando declaras.</p>
        </Recuadro>
      </Sub>

      <Sub id="finanzas-movimientos" titulo="Registrar cobros, viáticos y gastos">
        <Pasos>
          <Paso>
            En la pestaña Finanzas del proyecto toca <Boton>+ Movimiento</Boton>.
          </Paso>
          <Paso>
            Elige el tipo: <strong>Cobro al cliente</strong> (tus facturas o cuentas de cobro; si es por horas, escribe cuántas horas cubre), <strong>Viáticos que paga el
            cliente</strong>, <strong>Aporte o cofinanciación</strong> o <strong>Gasto</strong> (con su categoría y si el cliente te lo reembolsa).
          </Paso>
          <Paso>Pon el valor, el estado (pendiente, facturado, pagado, anulado), la fecha límite y la de pago.</Paso>
          <Paso>En cada cobro, toca los requisitos a medida que los cumples. Cuando todos están en verde, ya puedes cobrar.</Paso>
        </Pasos>
        <p>
          Para planear, usa <Boton tono="blanco">+ Gasto planeado</Boton> en el presupuesto: así ves por categoría cuánto llevas contra lo que planeaste.
        </p>
      </Sub>

      <Sub id="finanzas-mis" titulo="Mis finanzas: todos tus proyectos juntos">
        <p>
          La página <Ir href="/finanzas">💰 Mis finanzas</Ir> suma todos tus proyectos mes a mes:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Este mes</strong>: ingresos, lo que te queda libre, la planilla PILA a pagar (la del mes anterior) y lo que te deben.
          </li>
          <li>
            <strong>📅 Mes a mes</strong>: ingresos, retenciones, seguridad social, gastos, renta y lo que te queda, con una barra por mes (la rayita es tu meta).
          </li>
          <li>
            <strong>🏥 Tu planilla</strong>: base, salud, pensión, fondo de solidaridad y ARL de cada mes, y en qué mes se paga.
          </li>
          <li>
            <strong>🏆 ¿Qué proyectos te dejan más?</strong>: margen y valor real de la hora de cada proyecto.
          </li>
        </ul>
        <Recuadro tipo="idea" titulo="¿Por qué la seguridad social se calcula con todos los proyectos juntos?">
          <p>
            Porque la planilla se paga una vez al mes sumando todo lo que ganaste ese mes. La base es el 40 % del ingreso, pero nunca menos de 1 salario mínimo ni más de
            25. Si tu base pasa de 4 salarios mínimos, se suma el Fondo de Solidaridad Pensional (1 % o más). Por eso un mes con dos contratos puede costarte más que la
            suma de cada uno por separado.
          </p>
          <p>
            Ejemplo: si en un mes facturas $4.000.000, el 40 % ($1.600.000) es menor que el salario mínimo, así que cotizas sobre el salario mínimo: unos $508.100. Si
            facturas $20.000.000, la base es $8.000.000 y pagas unos $2.401.800, incluido el 1 % de solidaridad.
          </p>
        </Recuadro>
      </Sub>

      <Pregunta p="Si el cliente me paga en noviembre un trabajo de octubre, ¿en qué mes cuenta?">
        <p>
          Para la proyección, la app reparte el valor del proyecto entre los meses en que se trabaja (y en los proyectos por horas usa las horas reales de la bitácora). Tu
          contador te dirá cómo reportarlo: en general la seguridad social de los contratistas se liquida sobre lo que se causa o se paga en cada mes según el contrato.
        </p>
      </Pregunta>
      <Pregunta p="¿Los viáticos son ingreso?">
        <p>
          En la app, los viáticos que paga el cliente sirven para cubrir tus gastos de viaje: se restan de tus gastos. Si te sobra plata de viáticos, sube lo que te queda
          libre. Consulta con tu contador cómo declararlos.
        </p>
      </Pregunta>
    </Seccion>
  );
}
