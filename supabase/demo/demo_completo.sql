-- ============================================================================
-- demo_completo.sql · Datos de DEMOSTRACIÓN de toda la plataforma
--
-- Cuenta una historia completa para ver cómo fluye la información:
--
--   PROYECTO  «Mejora del proceso de compras» · Distribuidora Andina S.A.S.
--     ├─ cronograma, objetivos, KPIs y mediciones, bitácora, pagos, riesgos, documentos
--     └─ PROCESOS (Control de procesos)
--          ├─ «Compra de papelería e insumos»  ← indicador semanal bajando
--          │    ├─ JUEGO Cacería Makigami CAZA26 (diagnóstico, ya existe)
--          │    ├─ JUEGO Carrera Kaizen KAIZ26 (entrenamiento, se crea aquí)
--          │    └─ PLAN DE ACCIÓN con las mejoras que salieron de los dos juegos
--          └─ «Atención de solicitudes internas» (meta cumplida)
--
--   + 3 proyectos más para llenar el portafolio (uno al día, uno en riesgo y
--     uno finalizado).
--
-- Requisitos: migraciones 0001 a 0005 y el reto demo (reto_papeleria.sql).
-- Cómo usarlo: Supabase → SQL Editor → pegar todo → Run.
-- Se puede correr varias veces: borra lo de demostración (grupo
-- «Demostración», carrera KAIZ26 y sus procesos) y lo vuelve a crear.
-- Las fechas están pensadas alrededor del 24 de septiembre de 2026.
-- ============================================================================

do $$
declare
  v_dueno uuid;
  v_reto uuid;
  -- proyecto principal y sus piezas
  pr uuid; pr2 uuid; pr3 uuid; pr4 uuid;
  o1 uuid; o2 uuid; o3 uuid;
  k1 uuid; k2 uuid; k3 uuid;
  h_mapeo uuid; h_base uuid; h_diag uuid; h_redis uuid; h_kaizen uuid;
  -- procesos
  pc uuid; pc2 uuid;
  -- carrera kaizen
  kz uuid; eq_a uuid; eq_f uuid; eq_c uuid;
  tk_a2 uuid; tk_a3 uuid; tk_f2 uuid;
begin
  -- --------------------------------------------------------------------------
  -- Limpieza de la demo anterior
  -- --------------------------------------------------------------------------
  delete from pc_procesos where proyecto_id in (select id from pr_proyectos where grupo = 'Demostración');
  delete from pr_proyectos where grupo = 'Demostración';
  delete from kz_jugadores where sesion_id in (select id from kz_sesiones where codigo = 'KAIZ26');
  delete from kz_sesiones where codigo = 'KAIZ26';

  -- Dueña de la demo: la cuenta de Andrea (la primera que exista).
  select id into v_dueno from auth.users
   where lower(email) in ('anmimeor@gmail.com', 'andreamesiasapps@gmail.com')
   order by lower(email) = 'anmimeor@gmail.com' desc limit 1;

  select id into v_reto from mk_retos where codigo = 'CAZA26';
  if v_reto is null then
    raise exception 'Primero corre supabase/demo/reto_papeleria.sql (el reto CAZA26).';
  end if;
  update mk_retos set creado_por = coalesce(v_dueno, creado_por) where id = v_reto;

  -- ==========================================================================
  -- 1. PROYECTO PRINCIPAL
  -- ==========================================================================
  insert into pr_proyectos (nombre, cliente, grupo, tipo, programa, descripcion, objetivo_general,
    contacto_nombre, contacto_cargo, contacto_correo, contacto_celular, gestor_externo,
    fecha_inicio, fecha_fin, fecha_cierre_limite, horas_contratadas, valor_contrato, frecuencia_dias, estado,
    reglas, enlaces, creado_por, created_at)
  values ('Mejora del proceso de compras', 'Distribuidora Andina S.A.S.', 'Demostración', 'consultoria',
    'Productividad en procesos administrativos',
    'Diagnóstico, rediseño e implementación de mejoras en el proceso de compras de insumos y papelería. Incluye taller Makigami con el equipo, piloto de mejoras, formación Kaizen y medición de resultados.',
    'Reducir el tiempo de una compra de insumos de 12,4 a 6 días y dejar al equipo de Compras entrenado en mejora continua.',
    'Paula Gómez', 'Jefe de Compras', 'paula.gomez@ejemplo.com', '300 000 0000', 'Comité de Gerencia (seguimiento mensual)',
    '2026-08-18', '2026-12-11', '2026-12-18', 80, 18000000, 7, 'en_curso',
    E'1. Informe de avance al comité de gerencia el primer lunes de cada mes.\n2. Cambios de alcance solo con acta firmada por la Gerencia.\n3. Las horas adicionales se facturan a $220.000 la hora.',
    E'Carpeta del proyecto: pide a Paula el enlace de la carpeta compartida.\nIndicadores: tablero de Compras (Excel semanal).',
    v_dueno, '2026-08-15 09:00-05')
  returning id into pr;

  -- Cronograma (plantilla de consultoría, con estados reales al 24 de septiembre).
  insert into pr_hitos (proyecto_id, fase, nombre, que_cumplir, insumos, responsable, fecha_inicio, fecha_limite, fecha_real, estado, peso, situacion, proximo_paso, soporte, orden) values
    (pr, 'Arranque', 'Reunión de arranque y acta de inicio', 'Alcance, cronograma, responsables y canales acordados y firmados.', null, 'Andrea', null, '2026-08-21', '2026-08-20', 'cumplido', 1, 'Acta firmada por la Gerencia.', null, 'Acta de inicio', 10),
    (pr, 'Arranque', 'Levantamiento de información', null, 'Procedimiento de compras, formatos, histórico de solicitudes 2026.', 'Paula Gómez', '2026-08-19', '2026-08-31', '2026-08-29', 'cumplido', 2, null, null, null, 20);
  insert into pr_hitos (proyecto_id, fase, nombre, que_cumplir, responsable, fecha_inicio, fecha_limite, fecha_real, estado, peso, situacion, soporte, orden)
    values (pr, 'Diagnóstico', 'Mapeo del proceso actual (Cacería Makigami)', 'Proceso AS-IS mapeado con tiempos y desperdicios identificados con el equipo.', 'Andrea', '2026-09-01', '2026-09-24', '2026-09-24', 'cumplido', 3,
            'Taller con 8 personas (código CAZA26): 22 desperdicios cazados y 3 mejoras aprobadas.', 'Informe de la Cacería Makigami', 30)
    returning id into h_mapeo;
  insert into pr_hitos (proyecto_id, fase, nombre, que_cumplir, insumos, responsable, fecha_inicio, fecha_limite, fecha_real, estado, peso, situacion, orden)
    values (pr, 'Diagnóstico', 'Línea base de indicadores', 'Valor inicial de cada KPI con su fórmula y fuente.', 'Histórico de solicitudes de julio y agosto.', 'Paula Gómez', '2026-08-25', '2026-09-05', '2026-09-04', 'cumplido', 2, 'Tiempo total 12,4 días; 18 % de solicitudes devueltas.', 40)
    returning id into h_base;
  insert into pr_hitos (proyecto_id, fase, nombre, que_cumplir, responsable, fecha_limite, fecha_real, estado, peso, situacion, proximo_paso, orden)
    values (pr, 'Diagnóstico', 'Informe de diagnóstico', 'Hallazgos, causas raíz y oportunidades priorizadas, presentados al cliente.', 'Andrea', '2026-09-26', '2026-09-24', 'en_aprobacion', 2,
            'Enviado a la Gerencia el 24/09 con los resultados del Makigami.', 'Presentarlo en el comité del 29/09', 50)
    returning id into h_diag;
  insert into pr_hitos (proyecto_id, fase, nombre, responsable, fecha_inicio, fecha_limite, estado, peso, situacion, proximo_paso, orden)
    values (pr, 'Diseño', 'Rediseño del proceso (TO-BE) y plan de mejora', 'Andrea', '2026-09-22', '2026-10-09', 'en_curso', 3,
            'Borrador del TO-BE con 3 mejoras aprobadas en el Makigami.', 'Validar con Paula el formulario digital', 60)
    returning id into h_redis;
  insert into pr_hitos (proyecto_id, fase, nombre, responsable, fecha_limite, estado, peso, situacion, proximo_paso, orden) values
    (pr, 'Diseño', 'Aprobación de la política de compras menores', 'Gerencia', '2026-09-19', 'bloqueado', 1,
     'La Gerencia no ha firmado la eliminación de la firma del líder en compras menores a $500.000.', 'Insistir en el comité del 29/09', 70);
  insert into pr_hitos (proyecto_id, fase, nombre, que_cumplir, responsable, fecha_inicio, fecha_limite, fecha_real, estado, peso, situacion, orden)
    values (pr, 'Implementación', 'Taller de mejora continua (Carrera Kaizen)', 'Equipo de Compras entrenado en el ciclo PDCA.', 'Andrea', '2026-09-23', '2026-09-23', '2026-09-23', 'cumplido', 2,
            'Taller con 8 personas (código KAIZ26): +83 % de productividad en la simulación.', 80)
    returning id into h_kaizen;
  insert into pr_hitos (proyecto_id, fase, nombre, que_cumplir, responsable, fecha_inicio, fecha_limite, estado, peso, orden) values
    (pr, 'Implementación', 'Piloto de las mejoras', 'Proveedores preaprobados, formulario digital y aprobación sin firma en compras menores.', 'Paula Gómez', '2026-10-09', '2026-10-30', 'pendiente', 4, 90),
    (pr, 'Implementación', 'Estandarización y capacitación', 'Procedimiento actualizado y equipo entrenado.', 'Andrea', '2026-10-30', '2026-11-13', 'pendiente', 3, 100),
    (pr, 'Control', 'Medición de resultados', 'KPIs medidos contra la línea base y la meta.', 'Paula Gómez', '2026-11-13', '2026-11-27', 'pendiente', 2, 110),
    (pr, 'Cierre', 'Informe final y acta de cierre', 'Resultados, lecciones aprendidas y plan de sostenimiento.', 'Andrea', null, '2026-12-09', 'pendiente', 2, 120),
    (pr, 'Cierre', 'Encuesta de satisfacción del cliente', null, 'Andrea', null, '2026-12-11', 'pendiente', 1, 130);

  -- Objetivos y KPIs.
  insert into pr_objetivos (proyecto_id, descripcion, criterio, responsable, fecha_meta, estado, peso)
    values (pr, 'Reducir el tiempo de una compra de insumos de 12,4 a 6 días', 'Promedio mensual del tiempo desde la solicitud hasta la entrega en el puesto.', 'Paula Gómez', '2026-11-30', 'en_curso', 2)
    returning id into o1;
  insert into pr_objetivos (proyecto_id, descripcion, criterio, responsable, fecha_meta, estado, peso)
    values (pr, 'Bajar las solicitudes devueltas por errores del 18 % al 5 %', 'Solicitudes devueltas / solicitudes recibidas en el mes.', 'Paula Gómez', '2026-11-30', 'en_curso', 1)
    returning id into o2;
  insert into pr_objetivos (proyecto_id, descripcion, criterio, responsable, fecha_meta, estado, peso)
    values (pr, 'Dejar al equipo de Compras entrenado en mejora continua', 'Personas que completaron el taller Kaizen y aplican el ciclo PDCA.', 'Andrea', '2026-11-13', 'en_curso', 1)
    returning id into o3;

  insert into pr_kpis (proyecto_id, objetivo_id, nombre, formula, unidad, sentido, linea_base, meta, fuente)
    values (pr, o1, 'Tiempo total de una compra', 'Días calendario entre la solicitud y la entrega en el puesto (promedio).', 'días', 'bajar', 12.4, 6, 'Tablero de Compras')
    returning id into k1;
  insert into pr_kpis (proyecto_id, objetivo_id, nombre, formula, unidad, sentido, linea_base, meta, fuente)
    values (pr, o2, 'Solicitudes devueltas por error', 'Devueltas / recibidas × 100', '%', 'bajar', 18, 5, 'Registro de Compras')
    returning id into k2;
  insert into pr_kpis (proyecto_id, objetivo_id, nombre, formula, unidad, sentido, linea_base, meta, fuente)
    values (pr, o3, 'Personas entrenadas en Kaizen', 'Participantes que completaron la Carrera Kaizen.', 'personas', 'subir', 0, 12, 'Listas de asistencia')
    returning id into k3;

  insert into pr_mediciones (proyecto_id, kpi_id, fecha, valor, nota) values
    (pr, k1, '2026-08-31', 12.4, 'Línea base (agosto)'),
    (pr, k1, '2026-09-08', 11.5, null),
    (pr, k1, '2026-09-15', 10.8, 'Se empezó a pedir por correo a proveedores frecuentes'),
    (pr, k1, '2026-09-22', 9.6, null),
    (pr, k2, '2026-08-31', 18, 'Línea base'),
    (pr, k2, '2026-09-15', 15, null),
    (pr, k2, '2026-09-22', 13, null),
    (pr, k3, '2026-09-23', 8, 'Carrera Kaizen KAIZ26');

  -- Bitácora de intervenciones.
  insert into pr_bitacora (proyecto_id, hito_id, fecha, actividad, tiempo_min, estado_tras, proximo_paso, fecha_proximo, registrado_por) values
    (pr, null, '2026-08-20', 'Reunión de arranque con Gerencia y Compras. Firma del acta de inicio y acuerdo de canales (WhatsApp y correo).', 120, 'al_dia', 'Recibir procedimiento y formatos de compras', '2026-08-22', v_dueno),
    (pr, null, '2026-08-27', 'Entrevistas con 5 solicitantes y con el equipo de Compras. Revisión de formatos y del histórico de solicitudes.', 240, 'al_dia', 'Construir la línea base de indicadores', '2026-09-04', v_dueno),
    (pr, h_base, '2026-09-04', 'Línea base: 12,4 días por compra y 18 % de solicitudes devueltas. Validada con Paula.', 180, 'al_dia', 'Preparar el taller Makigami', '2026-09-18', v_dueno),
    (pr, h_mapeo, '2026-09-20', 'Preparación del mapa del proceso en la app (8 pasos, 5 áreas) e invitación a los participantes.', 90, 'al_dia', 'Taller Makigami con el equipo', '2026-09-22', v_dueno),
    (pr, h_mapeo, '2026-09-22', 'Taller Cacería Makigami con 8 personas: 22 desperdicios, 4 propuestas, 3 aprobadas (ahorro estimado 6 días).', 240, 'al_dia', 'Taller Kaizen con Compras', '2026-09-23', v_dueno),
    (pr, h_kaizen, '2026-09-23', 'Carrera Kaizen con 8 personas y 3 equipos: la productividad subió 83 % en 4 rondas. 5 estándares adoptados.', 180, 'al_dia', 'Enviar informe de diagnóstico', '2026-09-24', v_dueno),
    (pr, h_diag, '2026-09-24', 'Informe de diagnóstico enviado a Gerencia. Mejoras de los dos juegos llevadas al plan de acción del proceso.', 120, 'pendiente', 'Presentar el diagnóstico en el comité y pedir la firma de la política de compras menores', '2026-09-29', v_dueno);

  -- Pagos.
  insert into pr_pagos (proyecto_id, concepto, tipo, valor, fecha_limite, fecha_pago, estado, soporte) values
    (pr, 'Anticipo 40 %', 'cobro', 7200000, '2026-08-25', '2026-08-22', 'pagado', 'Factura FE-101'),
    (pr, 'Segundo pago 30 % (entrega del diagnóstico)', 'cobro', 5400000, '2026-09-30', null, 'facturado', 'Factura FE-118'),
    (pr, 'Pago final 30 % (acta de cierre)', 'cobro', 5400000, '2026-12-18', null, 'pendiente', null),
    (pr, 'Materiales del taller Kaizen', 'gasto', 180000, '2026-09-22', '2026-09-21', 'pagado', null);

  -- Riesgos.
  insert into pr_riesgos (proyecto_id, descripcion, probabilidad, impacto, mitigacion, responsable, estado) values
    (pr, 'La Gerencia no aprueba a tiempo la política de compras menores sin firma del líder.', 'alta', 'alto', 'Presentar en el comité el ahorro de 2 días medido en el Makigami y proponer un piloto de 1 mes.', 'Andrea', 'abierto'),
    (pr, 'Los proveedores no aceptan precios fijos para papelería.', 'media', 'alto', null, 'Paula Gómez', 'abierto'),
    (pr, 'Rotación en el equipo de Compras durante el piloto.', 'baja', 'medio', 'Documentar el procedimiento y formar a dos personas por puesto.', 'Paula Gómez', 'abierto'),
    (pr, 'El histórico de solicitudes no alcanza para la línea base.', 'media', 'medio', 'Se completó con registros de correo.', 'Andrea', 'cerrado');

  -- Documentos (sin enlaces reales: agrega los tuyos).
  insert into pr_documentos (proyecto_id, nombre, tipo, url, fecha, notas) values
    (pr, 'Propuesta y contrato firmado', 'contrato', null, '2026-08-15', 'Agrega el enlace de la carpeta del cliente'),
    (pr, 'Acta de inicio', 'acta', null, '2026-08-20', null),
    (pr, 'Informe de la Cacería Makigami CAZA26', 'informe', null, '2026-09-22', 'Se genera en la app: Makigami → Informe'),
    (pr, 'Informe de diagnóstico', 'entregable', null, '2026-09-24', null),
    (pr, 'Fotos del taller Kaizen', 'evidencia', null, '2026-09-23', null);

  -- ==========================================================================
  -- 2. PROCESOS DEL PROYECTO (Control de procesos)
  -- ==========================================================================
  insert into pc_procesos (nombre, cliente, area, responsable, objetivo, indicador, unidad, sentido, linea_base, meta, frecuencia, proyecto_id, creado_por, created_at)
  values ('Compra de papelería e insumos', 'Distribuidora Andina S.A.S.', 'Compras', 'Paula Gómez',
          'Que las áreas reciban sus insumos en máximo 6 días.', 'Tiempo total del proceso', 'días', 'bajar', 12.4, 6.4, 'semanal', pr, v_dueno, '2026-08-25 10:00-05')
  returning id into pc;

  insert into pc_mediciones (proceso_id, fecha, valor, nota) values
    (pc, '2026-08-25', 12.4, 'Línea base'),
    (pc, '2026-09-01', 12.1, null),
    (pc, '2026-09-08', 11.5, null),
    (pc, '2026-09-15', 10.8, 'Pedidos por correo a proveedores frecuentes'),
    (pc, '2026-09-22', 9.6, 'Primera semana con formulario compartido');

  insert into pc_procesos (nombre, cliente, area, responsable, objetivo, indicador, unidad, sentido, linea_base, meta, frecuencia, proyecto_id, creado_por)
  values ('Atención de solicitudes internas', 'Distribuidora Andina S.A.S.', 'Compras', 'Paula Gómez',
          'Responder toda solicitud interna en máximo 1 día hábil.', 'Solicitudes respondidas en 1 día', '%', 'subir', 55, 90, 'semanal', pr, v_dueno)
  returning id into pc2;
  insert into pc_mediciones (proceso_id, fecha, valor) values
    (pc2, '2026-09-01', 55), (pc2, '2026-09-08', 71), (pc2, '2026-09-15', 84), (pc2, '2026-09-22', 92);
  insert into pc_acciones (proceso_id, titulo, detalle, responsable, fecha_compromiso, estado, origen, cerrada_en) values
    (pc2, 'Bandeja única de solicitudes con responsable por turno', null, 'Paula Gómez', '2026-09-10', 'hecha', 'manual', '2026-09-09 16:00-05');

  -- El reto Makigami y la carrera Kaizen quedan unidos al proceso de compras.
  update mk_retos set proceso_id = pc where id = v_reto;

  -- ==========================================================================
  -- 3. CARRERA KAIZEN (ya jugada)
  -- ==========================================================================
  insert into kz_sesiones (codigo, titulo, descripcion, producto, unidad, criterio_calidad, total_rondas, duracion_ronda_seg,
                           estado, ronda_actual, fase, registro_abierto, creado_por, proceso_id, cerrado_en, created_at)
  values ('KAIZ26', 'Taller Kaizen · Equipo de Compras', 'Vivimos la mejora continua diligenciando solicitudes de compra en 4 rondas.',
          'Solicitudes de compra diligenciadas', 'solicitudes',
          'Todos los campos llenos, cálculos correctos, firma de quien aprueba y sin tachones.',
          4, 240, 'cerrado', 4, null, false, v_dueno, pc, '2026-09-23 17:00-05', '2026-09-23 14:00-05')
  returning id into kz;

  insert into kz_equipos (sesion_id, nombre, emoji, created_at) values (kz, 'Las Ágiles', '🦊', '2026-09-23 14:05-05') returning id into eq_a;
  insert into kz_equipos (sesion_id, nombre, emoji, created_at) values (kz, 'Flujo Continuo', '🦉', '2026-09-23 14:06-05') returning id into eq_f;
  insert into kz_equipos (sesion_id, nombre, emoji, created_at) values (kz, 'Cero Reprocesos', '🐺', '2026-09-23 14:07-05') returning id into eq_c;

  insert into kz_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, acepta_datos, token_hash) values
    (kz, eq_a, 'Paula', 'Gómez Arias', 'Jefe de Compras', true, 'femenino', '35 a 44', 'Distribuidora Andina', 'Compras', true, md5(random()::text || clock_timestamp())),
    (kz, eq_a, 'Esteban', 'Mora Ruiz', 'Analista de compras', false, 'masculino', '25 a 34', 'Distribuidora Andina', 'Compras', true, md5(random()::text || clock_timestamp())),
    (kz, eq_a, 'Natalia', 'Pérez Cano', 'Auxiliar administrativa', false, 'femenino', '18 a 24', 'Distribuidora Andina', 'Administración', true, md5(random()::text || clock_timestamp())),
    (kz, eq_f, 'Jorge', 'Salazar Vélez', 'Almacenista', true, 'masculino', '45 a 54', 'Distribuidora Andina', 'Almacén', true, md5(random()::text || clock_timestamp())),
    (kz, eq_f, 'Camila', 'Ríos Henao', 'Analista contable', false, 'femenino', '25 a 34', 'Distribuidora Andina', 'Contabilidad', true, md5(random()::text || clock_timestamp())),
    (kz, eq_f, 'Luis', 'Ortiz Gil', 'Auxiliar de compras', false, 'masculino', '25 a 34', 'Distribuidora Andina', 'Compras', true, md5(random()::text || clock_timestamp())),
    (kz, eq_c, 'Diana', 'López Marín', 'Coordinadora administrativa', true, 'femenino', '35 a 44', 'Distribuidora Andina', 'Administración', true, md5(random()::text || clock_timestamp())),
    (kz, eq_c, 'Felipe', 'Castro Soto', 'Asistente de gerencia', false, 'masculino', '25 a 34', 'Distribuidora Andina', 'Gerencia', true, md5(random()::text || clock_timestamp()));

  -- Resultados: unidades con calidad y con defecto por ronda.
  insert into kz_resultados (sesion_id, equipo_id, ronda, unidades_buenas, defectos) values
    (kz, eq_a, 1, 6, 3), (kz, eq_a, 2, 8, 1), (kz, eq_a, 3, 10, 1), (kz, eq_a, 4, 11, 0),
    (kz, eq_f, 1, 5, 2), (kz, eq_f, 2, 7, 2), (kz, eq_f, 3, 7, 1), (kz, eq_f, 4, 9, 0),
    (kz, eq_c, 1, 6, 1), (kz, eq_c, 2, 5, 3), (kz, eq_c, 3, 8, 0), (kz, eq_c, 4, 9, 0);

  -- Tarjetas Kaizen (rondas 2 a 4).
  insert into kz_tarjetas (sesion_id, equipo_id, ronda, problema, porques, idea, prediccion, decision)
    values (kz, eq_a, 2, 'Perdemos tiempo buscando los códigos de los productos', array['Cada uno busca en su celular', 'La lista está en un correo viejo', 'Nunca hicimos una lista a mano'], 'Lista impresa de códigos frecuentes en la mesa', 8, 'estandar')
    returning id into tk_a2;
  insert into kz_tarjetas (sesion_id, equipo_id, ronda, problema, porques, idea, prediccion, decision)
    values (kz, eq_a, 3, 'Los cálculos del total se equivocan', array['Sumamos a mano', 'No hay una tabla de precios', 'Cada uno usa su método', 'Nunca acordamos cómo calcular'], 'Tabla de precios con totales ya calculados por cantidad', 10, 'estandar')
    returning id into tk_a3;
  insert into kz_tarjetas (sesion_id, equipo_id, ronda, problema, porques, idea, prediccion, decision) values
    (kz, eq_a, 4, 'Esperamos la firma del aprobador', array['Hay un solo aprobador', 'Firma de a una', 'Nadie agrupa las solicitudes'], 'Pasar las solicitudes a firmar en lotes de 3', 12, 'estandar');
  insert into kz_tarjetas (sesion_id, equipo_id, ronda, problema, porques, idea, prediccion, decision)
    values (kz, eq_f, 2, 'Todos hacen todo y nos estorbamos', array['No hay roles', 'Nadie organizó el trabajo', 'Empezamos sin plan'], 'Línea por puestos: uno llena, otro calcula, otro revisa', 9, 'estandar')
    returning id into tk_f2;
  insert into kz_tarjetas (sesion_id, equipo_id, ronda, problema, porques, idea, prediccion, decision) values
    (kz, eq_f, 3, 'El que revisa se vuelve cuello de botella', array['Revisa todo al final', 'No hay criterios claros'], 'Revisar en cada puesto con una lista de chequeo', 9, 'descartada'),
    (kz, eq_f, 4, 'Seguimos con errores de firma', array['Se olvida firmar', 'La casilla no se ve', 'El formato es confuso'], 'Marcar con resaltador la casilla de firma', 9, 'estandar'),
    (kz, eq_c, 2, 'Hay tachones y hay que rehacer', array['Escribimos rápido', 'No hay borrador', 'Queremos ganar tiempo'], 'Escribir más despacio', 8, 'estandar'),
    (kz, eq_c, 3, 'Rehacemos por datos incompletos', array['No sabemos qué campos son obligatorios', 'El formato no lo dice', 'Nadie lo explicó'], 'Plantilla guía con los campos obligatorios resaltados', 8, 'estandar'),
    (kz, eq_c, 4, 'Nos demoramos en el total', array['Sumamos a mano', 'No hay calculadora'], 'Usar la calculadora del celular', 10, 'estandar');

  -- ==========================================================================
  -- 4. PLAN DE ACCIÓN del proceso (lo que llegó de los juegos + manual)
  -- ==========================================================================
  insert into pc_acciones (proceso_id, titulo, detalle, responsable, fecha_compromiso, estado, origen, origen_id, origen_ref, cerrada_en)
  select pc, 'Implementar: ' || p.descripcion,
         'Mejora aprobada en el rediseño de la Cacería Makigami.',
         case when p.descripcion ilike 'Sin firma%' then 'Gerencia' when p.descripcion ilike 'Formulario%' then 'Esteban Mora' else 'Paula Gómez' end,
         case when p.descripcion ilike 'Sin firma%' then date '2026-09-19' when p.descripcion ilike 'Formulario%' then date '2026-10-09' else date '2026-10-16' end,
         case when p.descripcion ilike 'Formulario%' then 'en_curso' when p.descripcion ilike 'Sin firma%' then 'pendiente' else 'en_curso' end,
         'makigami', v_reto, v_reto || ':mk-propuesta-' || p.id, null
    from mk_propuestas p where p.reto_id = v_reto and p.estado = 'aprobada';

  insert into pc_acciones (proceso_id, titulo, detalle, responsable, fecha_compromiso, estado, origen, origen_id, origen_ref, cerrada_en) values
    (pc, 'Atacar primero las esperas: son el 98 % del tiempo total',
     E'Fijen un tiempo máximo de respuesta para cada aprobación, deleguen firmas de bajo monto y dejen de trabajar por lotes.\nHerramienta sugerida: Acuerdos de nivel de servicio (ANS) y flujo continuo.',
     'Paula Gómez', '2026-10-02', 'en_curso', 'makigami', v_reto, v_reto || ':mk-esperas', null),
    (pc, 'Eliminar los 2 pasos que son desperdicio',
     'Firma del líder y transcripción al Excel de compras.', 'Andrea', '2026-10-30', 'pendiente', 'makigami', v_reto, v_reto || ':mk-pasos-desperdicio', null),
    (pc, 'Estandarizar y replicar: Tabla de precios con totales ya calculados por cantidad',
     'Idea del equipo Las Ágiles en la Carrera Kaizen: mejoró +25 % y se adoptó como estándar.', 'Esteban Mora', '2026-09-30', 'hecha', 'kaizen', kz, kz || ':kz-idea-' || tk_a3, '2026-09-24 11:00-05'),
    (pc, 'Estandarizar y replicar: Línea por puestos: uno llena, otro calcula, otro revisa',
     'Idea del equipo Flujo Continuo: mejoró +40 % y se adoptó como estándar.', 'Paula Gómez', '2026-10-09', 'en_curso', 'kaizen', kz, kz || ':kz-idea-' || tk_f2, null),
    (pc, 'Medir el tiempo total del proceso cada semana', 'Registro los lunes en el tablero de Compras.', 'Natalia Pérez', null, 'en_curso', 'makigami', v_reto, v_reto || ':mk-medir', null);

  -- ==========================================================================
  -- 5. OTROS PROYECTOS para llenar el portafolio
  -- ==========================================================================

  -- 5a. Programa con plan de trabajo, en riesgo (hitos rechazados y vencidos).
  insert into pr_proyectos (nombre, cliente, grupo, tipo, programa, objetivo_general, contacto_nombre, contacto_cargo, gestor_externo,
    fecha_inicio, fecha_fin, fecha_cierre_limite, horas_contratadas, valor_contrato, frecuencia_dias, estado, reglas, creado_por)
  values ('Fábrica de productividad · Transformación digital', 'Confecciones Río Claro', 'Demostración', 'programa',
    'Programa de productividad · Línea Transformación Digital',
    'Subir la productividad del área de producción con herramientas digitales y medirla con 6 indicadores.',
    'Mauricio Duarte', 'Gerente general', 'Gestora del programa',
    '2026-08-10', '2026-11-08', '2026-11-13', 60, 14100000, 7, 'en_curso',
    E'1. Máximo 30 h ejecutadas antes de aprobar el PT1 y 36 h antes de aprobar el PT2.\n2. Seguimiento mensual a más tardar el 3.er día hábil del mes siguiente.\n3. Subsanar un rechazo en 2 días calendario.',
    v_dueno)
  returning id into pr2;
  insert into pr_hitos (proyecto_id, fase, nombre, que_cumplir, insumos, responsable, fecha_inicio, fecha_limite, fecha_real, estado, peso, situacion, proximo_paso, orden) values
    (pr2, 'Alineación', 'Acta de alineación', 'Fechas, horas, topes y compromisos firmados.', null, 'Andrea', null, '2026-08-12', '2026-08-11', 'cumplido', 1, null, null, 10),
    (pr2, 'Plan de trabajo', 'PT1 - Plan de trabajo parte 1', 'Hallazgos, objetivo, cronograma por fases e indicadores.', 'Diagnóstico y visita.', 'Andrea', null, '2026-08-17', '2026-08-14', 'cumplido', 2, 'Aprobado el 20/08.', null, 20),
    (pr2, 'Plan de trabajo', 'PT2 - Línea base e indicadores', 'Línea base de los 6 indicadores y metas con variación ≥ 8 %.', 'Datos de julio de la empresa.', 'Andrea', null, '2026-09-01', '2026-09-12', 'rechazado', 3, 'Rechazado el 15/09: el periodo de la línea base no coincide con el acta.', 'Corregir el periodo y reenviar', 30),
    (pr2, 'Administrativo', 'Contrapartida', 'Pago de la contrapartida y soporte cargado.', 'Comprobante de pago.', 'Empresa', null, '2026-09-09', null, 'pendiente', 1, 'La empresa no ha confirmado el pago.', 'Llamar a Mauricio', 40),
    (pr2, 'Seguimientos', 'Seguimiento agosto 2026', 'Reportar actividades, horas reales y evidencias de agosto.', null, 'Andrea', '2026-08-01', '2026-09-03', '2026-09-02', 'cumplido', 1, '20 h reportadas.', null, 1000),
    (pr2, 'Seguimientos', 'Seguimiento septiembre 2026', 'Reportar actividades, horas reales y evidencias de septiembre.', null, 'Andrea', '2026-09-01', '2026-10-05', null, 'bloqueado', 1, 'No se puede crear hasta aprobar el PT2.', 'Depende del PT2', 1010),
    (pr2, 'Seguimientos', 'Seguimiento octubre 2026', 'Reportar actividades, horas reales y evidencias de octubre.', null, 'Andrea', '2026-10-01', '2026-11-04', null, 'pendiente', 1, null, null, 1020),
    (pr2, 'Cierre', 'Medición de salida', 'Medir los indicadores en el último mes.', null, 'Andrea', null, '2026-11-06', null, 'pendiente', 2, null, null, 50),
    (pr2, 'Cierre', 'Acta de cierre + encuestas', 'Resultados, monetización, entregables y encuestas.', null, 'Andrea', null, '2026-11-08', null, 'pendiente', 2, null, null, 60);
  insert into pr_bitacora (proyecto_id, fecha, actividad, tiempo_min, estado_tras, proximo_paso, fecha_proximo, registrado_por) values
    (pr2, '2026-08-11', 'Visita de diagnóstico y firma del acta de alineación.', 240, 'al_dia', 'Radicar PT1', '2026-08-14', v_dueno),
    (pr2, '2026-08-28', 'Capacitación en tablero digital de producción (2 sesiones).', 480, 'al_dia', 'Recolectar datos de línea base', '2026-09-05', v_dueno),
    (pr2, '2026-09-12', 'Envío del PT2 con línea base de los 6 indicadores.', 300, 'pendiente', 'Esperar aprobación de la gestora', '2026-09-16', v_dueno);
  insert into pr_pagos (proyecto_id, concepto, tipo, valor, fecha_limite, estado) values
    (pr2, 'Contrapartida 10 %', 'contrapartida', 1410000, '2026-09-09', 'pendiente');
  insert into pr_riesgos (proyecto_id, descripcion, probabilidad, impacto, mitigacion, responsable, estado) values
    (pr2, 'Superar el tope de 36 horas sin el PT2 aprobado.', 'alta', 'alto', null, 'Andrea', 'abierto');

  -- 5b. Aplicativo, al día.
  insert into pr_proyectos (nombre, cliente, grupo, tipo, objetivo_general, contacto_nombre, contacto_cargo,
    fecha_inicio, fecha_fin, horas_contratadas, valor_contrato, frecuencia_dias, estado, creado_por)
  values ('App de control de inventarios', 'Metalmecánica del Sur', 'Demostración', 'aplicativo',
    'Pasar el inventario de Excel a una app con alertas de stock mínimo.', 'Sergio Pineda', 'Jefe de almacén',
    '2026-09-01', '2026-11-30', 120, 24000000, 5, 'en_curso', v_dueno)
  returning id into pr3;
  insert into pr_hitos (proyecto_id, fase, nombre, responsable, fecha_inicio, fecha_limite, fecha_real, estado, peso, orden) values
    (pr3, 'Descubrimiento', 'Levantamiento de requisitos', 'Andrea', '2026-09-01', '2026-09-09', '2026-09-08', 'cumplido', 2, 10),
    (pr3, 'Descubrimiento', 'Prototipo aprobado por el cliente', 'Andrea', '2026-09-09', '2026-09-18', '2026-09-17', 'cumplido', 2, 20),
    (pr3, 'Construcción', 'Sprint 1: productos y existencias', 'Andrea', '2026-09-18', '2026-10-06', null, 'en_curso', 3, 30),
    (pr3, 'Construcción', 'Sprint 2: entradas, salidas y alertas', 'Andrea', '2026-10-06', '2026-10-24', null, 'pendiente', 3, 40),
    (pr3, 'Construcción', 'Sprint 3: reportes', 'Andrea', '2026-10-24', '2026-11-07', null, 'pendiente', 3, 50),
    (pr3, 'Validación', 'Pruebas con usuarios', 'Sergio Pineda', '2026-11-07', '2026-11-18', null, 'pendiente', 2, 60),
    (pr3, 'Entrega', 'Puesta en producción y acta de entrega', 'Andrea', null, '2026-11-30', null, 'pendiente', 2, 70);
  insert into pr_bitacora (proyecto_id, fecha, actividad, tiempo_min, estado_tras, proximo_paso, fecha_proximo, registrado_por) values
    (pr3, '2026-09-08', 'Taller de requisitos con almacén y compras.', 180, 'al_dia', 'Diseñar el prototipo', '2026-09-12', v_dueno),
    (pr3, '2026-09-17', 'Prototipo aprobado por Sergio con 2 ajustes.', 120, 'al_dia', 'Arrancar el sprint 1', '2026-09-18', v_dueno),
    (pr3, '2026-09-23', 'Sprint 1 al 50 %: catálogo de productos listo.', 360, 'al_dia', 'Demo del sprint 1', '2026-10-06', v_dueno);
  insert into pr_pagos (proyecto_id, concepto, tipo, valor, fecha_limite, fecha_pago, estado) values
    (pr3, 'Anticipo 50 %', 'cobro', 12000000, '2026-09-05', '2026-09-04', 'pagado'),
    (pr3, 'Pago contra entrega 50 %', 'cobro', 12000000, '2026-12-05', null, 'pendiente');

  -- 5c. Capacitación finalizada.
  insert into pr_proyectos (nombre, cliente, grupo, tipo, objetivo_general, fecha_inicio, fecha_fin, horas_contratadas, valor_contrato, estado, creado_por)
  values ('Formación Lean para líderes', 'Clínica Santa Lucía', 'Demostración', 'capacitacion',
    'Formar a 20 líderes en herramientas Lean aplicadas a servicios de salud.', '2026-06-02', '2026-08-15', 32, 9600000, 'finalizado', v_dueno)
  returning id into pr4;
  insert into pr_hitos (proyecto_id, fase, nombre, responsable, fecha_limite, fecha_real, estado, peso, orden) values
    (pr4, 'Preparación', 'Diagnóstico de necesidades', 'Andrea', '2026-06-10', '2026-06-09', 'cumplido', 1, 10),
    (pr4, 'Preparación', 'Diseño del contenido y materiales', 'Andrea', '2026-06-25', '2026-06-24', 'cumplido', 2, 20),
    (pr4, 'Ejecución', 'Sesiones de formación', 'Andrea', '2026-08-01', '2026-07-31', 'cumplido', 4, 30),
    (pr4, 'Evaluación', 'Evaluación de aprendizaje y aplicación', 'Andrea', '2026-08-10', '2026-08-08', 'cumplido', 2, 40),
    (pr4, 'Cierre', 'Informe final y certificados', 'Andrea', '2026-08-15', '2026-08-14', 'cumplido', 1, 50);
  insert into pr_bitacora (proyecto_id, fecha, actividad, tiempo_min, estado_tras, registrado_por) values
    (pr4, '2026-08-14', 'Entrega de certificados e informe final. 19 de 20 líderes aprobaron.', 120, 'finalizado', v_dueno);
  insert into pr_pagos (proyecto_id, concepto, tipo, valor, fecha_limite, fecha_pago, estado) values
    (pr4, 'Pago único', 'cobro', 9600000, '2026-08-30', '2026-08-28', 'pagado');

  raise notice 'Demo creada. Dueña: %', coalesce((select email from auth.users where id = v_dueno), 'NINGUNA (solo la ven los administradores)');
end $$;
