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
--   + Reto 5S LIMP26 y caso MudaLab MUDA26 (con su Banco de oportunidades),
--     unidos al proceso de compras.
--
--   + 3 proyectos más para llenar el portafolio (uno al día, uno en riesgo y
--     uno finalizado).
--
-- Requisitos: migraciones 0001 a 0008 y el reto demo (reto_papeleria.sql).
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
  -- reto 5S
  s5 uuid; q1 uuid; q2 uuid; q3 uuid;
  j1 uuid; j2 uuid; j3 uuid; j4 uuid; j5 uuid; j6 uuid; j7 uuid; j8 uuid;
  -- MudaLab
  ml uuid; op1 uuid;
begin
  -- --------------------------------------------------------------------------
  -- Limpieza de la demo anterior
  -- --------------------------------------------------------------------------
  delete from pc_procesos where proyecto_id in (select id from pr_proyectos where grupo = 'Demostración');
  delete from pr_proyectos where grupo = 'Demostración';
  delete from kz_jugadores where sesion_id in (select id from kz_sesiones where codigo = 'KAIZ26');
  delete from kz_sesiones where codigo = 'KAIZ26';
  delete from s5_jugadores where sesion_id in (select id from s5_sesiones where codigo = 'LIMP26');
  delete from s5_sesiones where codigo = 'LIMP26';
  delete from ml_jugadores where sesion_id in (select id from ml_sesiones where codigo = 'MUDA26');
  delete from ml_sesiones where codigo = 'MUDA26';

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

  -- 5a. Plan de trabajo con seguimientos mensuales, en riesgo (hitos rechazados y vencidos).
  insert into pr_proyectos (nombre, cliente, grupo, tipo, programa, objetivo_general, contacto_nombre, contacto_cargo, gestor_externo,
    fecha_inicio, fecha_fin, fecha_cierre_limite, horas_contratadas, valor_contrato, frecuencia_dias, estado, reglas, creado_por)
  values ('Transformación digital de producción', 'Confecciones Río Claro', 'Demostración', 'programa',
    'Programa de productividad 2026',
    'Subir la productividad del área de producción con herramientas digitales y medirla con 6 indicadores.',
    'Mauricio Duarte', 'Gerente general', 'Comité directivo del cliente',
    '2026-08-10', '2026-11-08', '2026-11-13', 60, 14100000, 7, 'en_curso',
    E'1. No pasar de 30 horas ejecutadas antes de que el cliente apruebe el plan de trabajo.
2. Seguimiento mensual a más tardar el 3.er día hábil del mes siguiente.
3. Corregir un entregable devuelto en máximo 2 días.',
    v_dueno)
  returning id into pr2;
  insert into pr_hitos (proyecto_id, fase, nombre, que_cumplir, insumos, responsable, fecha_inicio, fecha_limite, fecha_real, estado, peso, situacion, proximo_paso, orden) values
    (pr2, 'Inicio', 'Acta de inicio y acuerdos', 'Fechas, horas, alcance y reglas de trabajo firmados.', null, 'Andrea', null, '2026-08-12', '2026-08-11', 'cumplido', 1, null, null, 10),
    (pr2, 'Planeación', 'Plan de trabajo', 'Hallazgos iniciales, objetivos, actividades por fase e indicadores.', 'Diagnóstico y visita.', 'Andrea', null, '2026-08-17', '2026-08-14', 'cumplido', 2, 'Aprobado por el cliente el 20/08.', null, 20),
    (pr2, 'Planeación', 'Línea base de indicadores', 'Valor inicial de los 6 indicadores y sus metas.', 'Datos de julio del cliente.', 'Andrea', null, '2026-09-01', '2026-09-12', 'rechazado', 3, 'Devuelto el 15/09: el cliente pidió usar agosto como periodo base.', 'Recalcular con agosto y reenviar', 30),
    (pr2, 'Planeación', 'Datos de producción de agosto', 'Recibir del cliente los datos de agosto para la línea base.', 'Reporte de producción y horas.', 'Mauricio Duarte', null, '2026-09-09', null, 'pendiente', 1, 'El cliente no ha enviado los datos.', 'Llamar a Mauricio', 40),
    (pr2, 'Seguimientos', 'Seguimiento agosto 2026', 'Reportar actividades, horas reales y evidencias de agosto.', null, 'Andrea', '2026-08-01', '2026-09-03', '2026-09-02', 'cumplido', 1, '20 h reportadas.', null, 1000),
    (pr2, 'Seguimientos', 'Seguimiento septiembre 2026', 'Reportar actividades, horas reales y evidencias de septiembre.', null, 'Andrea', '2026-09-01', '2026-10-05', null, 'bloqueado', 1, 'Depende de que se apruebe la línea base.', 'Esperar la línea base', 1010),
    (pr2, 'Seguimientos', 'Seguimiento octubre 2026', 'Reportar actividades, horas reales y evidencias de octubre.', null, 'Andrea', '2026-10-01', '2026-11-04', null, 'pendiente', 1, null, null, 1020),
    (pr2, 'Cierre', 'Medición final', 'Medir los indicadores con los mismos cálculos de la línea base.', null, 'Andrea', null, '2026-11-06', null, 'pendiente', 2, null, null, 50),
    (pr2, 'Cierre', 'Informe final y acta de cierre', 'Resultados contra la meta, entregables y encuesta de satisfacción.', null, 'Andrea', null, '2026-11-08', null, 'pendiente', 2, null, null, 60);
  insert into pr_bitacora (proyecto_id, fecha, actividad, tiempo_min, estado_tras, proximo_paso, fecha_proximo, registrado_por) values
    (pr2, '2026-08-11', 'Visita de diagnóstico y firma del acta de inicio.', 240, 'al_dia', 'Entregar el plan de trabajo', '2026-08-14', v_dueno),
    (pr2, '2026-08-18', 'Taller de indicadores con jefes de área.', 240, 'al_dia', 'Capacitación en tablero digital', '2026-08-28', v_dueno),
    (pr2, '2026-08-25', 'Levantamiento de tiempos en corte y confección.', 240, 'al_dia', 'Capacitación en tablero digital', '2026-08-28', v_dueno),
    (pr2, '2026-08-28', 'Capacitación en tablero digital de producción (2 sesiones).', 480, 'al_dia', 'Recolectar datos de línea base', '2026-09-05', v_dueno),
    (pr2, '2026-09-05', 'Acompañamiento en planta: registro en el tablero digital.', 180, 'al_dia', 'Enviar la línea base', '2026-09-12', v_dueno),
    (pr2, '2026-09-12', 'Envío de la línea base de los 6 indicadores.', 300, 'pendiente', 'Esperar la revisión del cliente', '2026-09-16', v_dueno),
    (pr2, '2026-09-19', 'Ajuste de la línea base con los datos de agosto.', 120, 'pendiente', 'Esperar la revisión del cliente', '2026-09-26', v_dueno);
  insert into pr_riesgos (proyecto_id, descripcion, probabilidad, impacto, mitigacion, responsable, estado) values
    (pr2, 'Superar las 30 horas acordadas antes de que el cliente apruebe el plan.', 'alta', 'alto', null, 'Andrea', 'abierto');

  -- Objetivos y KPIs del programa (línea base con agosto, meta al cierre).
  insert into pr_objetivos (proyecto_id, descripcion, criterio, responsable, fecha_meta, estado, peso)
    values (pr2, 'Aumentar la productividad de la planta en al menos 15 %', 'Prendas terminadas por operaria al día, promedio del mes.', 'Mauricio Duarte', '2026-11-06', 'en_curso', 2)
    returning id into o1;
  insert into pr_kpis (proyecto_id, objetivo_id, nombre, formula, unidad, sentido, linea_base, meta, fuente)
    values (pr2, o1, 'Productividad por persona', 'Prendas terminadas / operarias / días trabajados.', 'prendas por persona al día', 'subir', 38, 44, 'Reporte de producción')
    returning id into k1;
  insert into pr_objetivos (proyecto_id, descripcion, criterio, responsable, fecha_meta, estado, peso)
    values (pr2, 'Cumplir las entregas a los clientes a tiempo', 'Pedidos despachados en la fecha prometida.', 'Jefe de despachos', '2026-11-06', 'en_curso', 1)
    returning id into o2;
  insert into pr_kpis (proyecto_id, objetivo_id, nombre, formula, unidad, sentido, linea_base, meta, fuente)
    values (pr2, o2, 'Entregas a tiempo', 'Pedidos a tiempo / pedidos despachados × 100.', '%', 'subir', 72, 90, 'Registro de despachos')
    returning id into k2;
  insert into pr_objetivos (proyecto_id, descripcion, criterio, responsable, fecha_meta, estado, peso)
    values (pr2, 'Llevar el control de producción en el tablero digital', 'Registros de producción hechos en el tablero y no en papel.', 'Andrea', '2026-10-15', 'en_curso', 1)
    returning id into o3;
  insert into pr_kpis (proyecto_id, objetivo_id, nombre, formula, unidad, sentido, linea_base, meta, fuente)
    values (pr2, o3, 'Registros hechos en papel', 'Registros en papel / total de registros × 100.', '%', 'bajar', 100, 10, 'Tablero digital')
    returning id into k3;
  insert into pr_mediciones (proyecto_id, kpi_id, fecha, valor, nota) values
    (pr2, k1, '2026-08-31', 38, 'Línea base (agosto)'), (pr2, k1, '2026-09-15', 40, null),
    (pr2, k2, '2026-08-31', 72, 'Línea base'), (pr2, k2, '2026-09-15', 70, 'Dos pedidos grandes atrasados'),
    (pr2, k3, '2026-08-31', 100, 'Todo en papel'), (pr2, k3, '2026-09-15', 60, 'Corte y confección ya usan el tablero');

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

  -- Objetivos y KPIs del aplicativo.
  insert into pr_objetivos (proyecto_id, descripcion, criterio, responsable, fecha_meta, estado, peso)
    values (pr3, 'Que el almacén use la app en su día a día', 'Usuarios de almacén y compras que la usan cada semana.', 'Sergio Pineda', '2026-11-30', 'pendiente', 1)
    returning id into o1;
  insert into pr_kpis (proyecto_id, objetivo_id, nombre, formula, unidad, sentido, linea_base, meta, fuente)
    values (pr3, o1, 'Adopción de la herramienta', 'Usuarios activos por semana / 8 usuarios previstos × 100.', '%', 'subir', 0, 90, 'Registro de uso de la app')
    returning id into k1;
  insert into pr_objetivos (proyecto_id, descripcion, criterio, responsable, fecha_meta, estado, peso)
    values (pr3, 'Evitar que la planta se quede sin materia prima', 'Paradas de producción por falta de material en el mes.', 'Sergio Pineda', '2026-11-30', 'en_curso', 2)
    returning id into o2;
  insert into pr_kpis (proyecto_id, objetivo_id, nombre, formula, unidad, sentido, linea_base, meta, fuente)
    values (pr3, o2, 'Paradas por falta de material', 'Veces al mes que se detiene la producción por falta de material.', 'paradas al mes', 'bajar', 6, 1, 'Bitácora de producción')
    returning id into k2;
  insert into pr_objetivos (proyecto_id, descripcion, criterio, responsable, fecha_meta, estado, peso)
    values (pr3, 'Que los usuarios queden satisfechos con la app', 'Encuesta al terminar las pruebas.', 'Andrea', '2026-11-18', 'pendiente', 1)
    returning id into o3;
  insert into pr_kpis (proyecto_id, objetivo_id, nombre, formula, unidad, sentido, linea_base, meta, fuente)
    values (pr3, o3, 'Satisfacción del cliente', 'Promedio de la encuesta (1 a 5).', 'puntos (1 a 5)', 'subir', null, 4.5, 'Encuesta');
  insert into pr_mediciones (proyecto_id, kpi_id, fecha, valor, nota) values
    (pr3, k2, '2026-08-31', 6, 'Línea base (agosto)'), (pr3, k2, '2026-09-22', 5, null);

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

  -- Objetivos y KPIs de la capacitación (ya cumplidos).
  insert into pr_objetivos (proyecto_id, descripcion, criterio, responsable, fecha_meta, estado, peso)
    values (pr4, 'Formar a 20 líderes en herramientas Lean', 'Líderes que completan y aprueban la evaluación.', 'Andrea', '2026-08-15', 'cumplido', 2)
    returning id into o1;
  insert into pr_kpis (proyecto_id, objetivo_id, nombre, formula, unidad, sentido, linea_base, meta, fuente)
    values (pr4, o1, 'Personas capacitadas', 'Líderes que aprobaron la evaluación final.', 'personas', 'subir', 0, 20, 'Listas y evaluaciones')
    returning id into k1;
  insert into pr_objetivos (proyecto_id, descripcion, criterio, responsable, fecha_meta, estado, peso)
    values (pr4, 'Que apliquen lo aprendido en sus servicios', 'Mejoras implementadas por los líderes al mes de terminar.', 'Coordinación de calidad', '2026-08-15', 'cumplido', 1)
    returning id into o2;
  insert into pr_kpis (proyecto_id, objetivo_id, nombre, formula, unidad, sentido, linea_base, meta, fuente)
    values (pr4, o2, 'Ideas de mejora implementadas', 'Mejoras puestas en práctica por los líderes formados.', 'ideas', 'subir', 0, 10, 'Informe de calidad')
    returning id into k2;
  insert into pr_objetivos (proyecto_id, descripcion, criterio, responsable, fecha_meta, estado, peso)
    values (pr4, 'Lograr una formación bien valorada', 'Promedio de la encuesta de satisfacción.', 'Andrea', '2026-08-15', 'cumplido', 1)
    returning id into o3;
  insert into pr_kpis (proyecto_id, objetivo_id, nombre, formula, unidad, sentido, linea_base, meta, fuente)
    values (pr4, o3, 'Satisfacción del cliente', 'Promedio de la encuesta (1 a 5).', 'puntos (1 a 5)', 'subir', 3, 4.5, 'Encuesta final')
    returning id into k3;
  insert into pr_mediciones (proyecto_id, kpi_id, fecha, valor, nota) values
    (pr4, k1, '2026-08-08', 19, '19 de 20 aprobaron'),
    (pr4, k2, '2026-08-14', 12, null),
    (pr4, k3, '2026-08-14', 4.7, null);


  -- ==========================================================================
  -- 6. FINANZAS (modelo de cobro, presupuesto, cobros con requisitos, viáticos)
  -- ==========================================================================
  if v_dueno is not null then
    insert into fn_parametros (usuario_id, meta_ingreso_mensual, margen_objetivo_pct)
    values (v_dueno, 12000000, 40)
    on conflict (usuario_id) do nothing;
  end if;

  -- 6a. Distribuidora Andina: valor fijo.
  update pr_proyectos set modalidad_cobro = 'valor_fijo', valor_hora = null, cobra_iva = false, retefuente_pct = 11,
    requisitos_cobro = E'Factura electrónica\nPlanilla de seguridad social (PILA) pagada del mes\nInforme de actividades del periodo\nAprobación de la Jefe de Compras'
  where id = pr;
  insert into pr_presupuesto (proyecto_id, categoria, descripcion, valor_planeado, reembolsable) values
    (pr, 'transporte', 'Taxis a la sede del cliente (16 visitas)', 640000, false),
    (pr, 'alimentacion', 'Refrigerios de los talleres', 300000, false),
    (pr, 'materiales', 'Materiales de los talleres Makigami y Kaizen', 350000, false),
    (pr, 'software', 'Herramientas digitales (proporción del mes)', 200000, false);
  update pr_pagos set categoria = 'materiales' where proyecto_id = pr and tipo = 'gasto';
  update pr_pagos set requisitos_cumplidos = array['Factura electrónica', 'Planilla de seguridad social (PILA) pagada del mes', 'Informe de actividades del periodo', 'Aprobación de la Jefe de Compras']
  where proyecto_id = pr and concepto like 'Anticipo%';
  update pr_pagos set requisitos_cumplidos = array['Factura electrónica', 'Planilla de seguridad social (PILA) pagada del mes']
  where proyecto_id = pr and concepto like 'Segundo pago%';
  insert into pr_pagos (proyecto_id, concepto, tipo, valor, fecha_limite, fecha_pago, estado, categoria) values
    (pr, 'Taxis de agosto y septiembre', 'gasto', 280000, '2026-09-24', '2026-09-24', 'pagado', 'transporte'),
    (pr, 'Refrigerios taller Makigami', 'gasto', 120000, '2026-09-22', '2026-09-22', 'pagado', 'alimentacion');

  -- 6b. Confecciones Río Claro: por horas, con viáticos y un aliado que trajo el cliente.
  update pr_proyectos set modalidad_cobro = 'por_horas', valor_hora = 235000, horas_contratadas = 60, valor_contrato = 14100000,
    cobra_iva = false, participacion_aliado_pct = 15, viaticos_pactados = 1800000, reteica_por_mil = 7,
    requisitos_cobro = E'Cuenta de cobro con las horas del mes\nPlanilla de seguridad social (PILA) pagada del mes\nInforme de actividades con evidencias\nAprobación del comité directivo'
  where id = pr2;
  insert into pr_presupuesto (proyecto_id, categoria, descripcion, valor_planeado, reembolsable) values
    (pr2, 'transporte', 'Bus intermunicipal ida y vuelta (6 viajes)', 900000, true),
    (pr2, 'alojamiento', 'Hotel (6 noches)', 1080000, true),
    (pr2, 'alimentacion', 'Alimentación en los viajes', 480000, true),
    (pr2, 'materiales', 'Impresión de tableros y formatos', 250000, false);
  insert into pr_pagos (proyecto_id, concepto, tipo, valor, horas, fecha_limite, fecha_pago, estado, requisitos_cumplidos, categoria, reembolsable) values
    (pr2, 'Horas de agosto (20 h)', 'cobro', 4700000, 20, '2026-09-10', '2026-09-08', 'pagado',
       array['Cuenta de cobro con las horas del mes', 'Planilla de seguridad social (PILA) pagada del mes', 'Informe de actividades con evidencias', 'Aprobación del comité directivo'], null, false),
    (pr2, 'Horas de septiembre', 'cobro', 2350000, 10, '2026-10-10', null, 'pendiente',
       array['Cuenta de cobro con las horas del mes'], null, false),
    (pr2, 'Viáticos de agosto', 'viatico', 600000, null, '2026-09-10', '2026-09-08', 'pagado', '{}', null, false),
    (pr2, 'Viáticos de septiembre', 'viatico', 600000, null, '2026-10-10', null, 'pendiente', '{}', null, false),
    (pr2, 'Bus a la planta (2 viajes)', 'gasto', 300000, null, '2026-09-12', '2026-09-12', 'pagado', '{}', 'transporte', true),
    (pr2, 'Hotel (2 noches)', 'gasto', 360000, null, '2026-09-12', '2026-09-12', 'pagado', '{}', 'alojamiento', true),
    (pr2, 'Alimentación en viaje', 'gasto', 150000, null, '2026-09-12', '2026-09-12', 'pagado', '{}', 'alimentacion', true);

  -- 6c. App de inventarios: mixto (valor fijo + horas adicionales) y con IVA.
  update pr_proyectos set modalidad_cobro = 'mixto', valor_hora = 180000, cobra_iva = true,
    requisitos_cobro = E'Factura electrónica con IVA\nPlanilla de seguridad social (PILA) pagada del mes\nActa de entrega del sprint'
  where id = pr3;
  insert into pr_presupuesto (proyecto_id, categoria, descripcion, valor_planeado) values
    (pr3, 'software', 'Servidor y base de datos (3 meses)', 450000),
    (pr3, 'apoyo', 'Diseñador para el prototipo', 1500000);
  insert into pr_pagos (proyecto_id, concepto, tipo, valor, fecha_limite, fecha_pago, estado, categoria) values
    (pr3, 'Diseñador del prototipo', 'gasto', 1500000, '2026-09-18', '2026-09-18', 'pagado', 'apoyo');


  -- ==========================================================================
  -- 7. RETO 5S (ya jugado, unido al proceso de compras)
  -- ==========================================================================
  insert into s5_sesiones (codigo, titulo, descripcion, escenario, estado, mision_actual, registro_abierto, creado_por, proceso_id, cerrado_en, created_at)
  values ('LIMP26', 'Reto 5S · Compras y Almacén', 'Del caos al flujo en el área de compras: primero jugamos, luego lo llevamos a nuestros puestos.',
          'oficina', 'cerrado', 6, false, v_dueno, pc, '2026-09-24 12:00-05', '2026-09-18 08:00-05')
  returning id into s5;
  insert into s5_equipos (sesion_id, nombre, emoji, created_at) values (s5, 'Los Clasificadores', '🦊', '2026-09-18 08:05-05') returning id into q1;
  insert into s5_equipos (sesion_id, nombre, emoji, created_at) values (s5, 'Orden y Flujo', '🦉', '2026-09-18 08:06-05') returning id into q2;
  insert into s5_equipos (sesion_id, nombre, emoji, created_at) values (s5, 'Cero Búsquedas', '🐺', '2026-09-18 08:07-05') returning id into q3;
  insert into s5_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, acepta_datos, token_hash) values (s5, q1, 'Paula', 'Gómez Arias', 'Jefe de Compras', true, 'femenino', true, md5(random()::text || clock_timestamp())) returning id into j1;
  insert into s5_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, acepta_datos, token_hash) values (s5, q1, 'Esteban', 'Mora Ruiz', 'Analista de compras', false, 'masculino', true, md5(random()::text || clock_timestamp())) returning id into j2;
  insert into s5_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, acepta_datos, token_hash) values (s5, q1, 'Natalia', 'Pérez Cano', 'Auxiliar administrativa', false, 'femenino', true, md5(random()::text || clock_timestamp())) returning id into j3;
  insert into s5_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, acepta_datos, token_hash) values (s5, q2, 'Jorge', 'Salazar Vélez', 'Almacenista', true, 'masculino', true, md5(random()::text || clock_timestamp())) returning id into j4;
  insert into s5_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, acepta_datos, token_hash) values (s5, q2, 'Camila', 'Ríos Henao', 'Analista contable', false, 'femenino', true, md5(random()::text || clock_timestamp())) returning id into j5;
  insert into s5_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, acepta_datos, token_hash) values (s5, q2, 'Luis', 'Ortiz Gil', 'Auxiliar de compras', false, 'masculino', true, md5(random()::text || clock_timestamp())) returning id into j6;
  insert into s5_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, acepta_datos, token_hash) values (s5, q3, 'Diana', 'López Marín', 'Coordinadora administrativa', true, 'femenino', true, md5(random()::text || clock_timestamp())) returning id into j7;
  insert into s5_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, acepta_datos, token_hash) values (s5, q3, 'Felipe', 'Castro Soto', 'Asistente de gerencia', false, 'masculino', true, md5(random()::text || clock_timestamp())) returning id into j8;

  -- Jugadas de cada misión (rotando quién entrega = colaboración).
  insert into s5_intentos (sesion_id, equipo_id, mision, jugador_id, inicio, fin, aciertos, errores, puntos) values
    (s5, q1, 1, j1, '2026-09-18 08:30-05', '2026-09-18 08:31:20-05', 18, 2, 197),
    (s5, q1, 2, j2, '2026-09-18 08:45-05', '2026-09-18 08:52-05', 14, 1, 170),
    (s5, q1, 3, j3, '2026-09-18 09:10-05', '2026-09-18 09:13-05', 9, 2, 176),
    (s5, q1, 4, j1, '2026-09-18 09:30-05', '2026-09-18 09:36-05', 10, 1, 92),
    (s5, q1, 5, j2, '2026-09-18 09:50-05', '2026-09-18 09:56-05', 10, 2, 124),
    (s5, q2, 1, j4, '2026-09-18 08:30-05', '2026-09-18 08:32:10-05', 15, 5, 125),
    (s5, q2, 2, j5, '2026-09-18 08:45-05', '2026-09-18 08:55-05', 12, 3, 146),
    (s5, q2, 3, j6, '2026-09-18 09:10-05', '2026-09-18 09:14-05', 8, 4, 118),
    (s5, q2, 4, j4, '2026-09-18 09:30-05', '2026-09-18 09:38-05', 7, 4, 42),
    (s5, q2, 5, j5, '2026-09-18 09:50-05', '2026-09-18 09:57-05', 8, 4, 98),
    (s5, q3, 1, j7, '2026-09-18 08:30-05', '2026-09-18 08:31:05-05', 17, 3, 180),
    (s5, q3, 2, j8, '2026-09-18 08:45-05', '2026-09-18 08:50-05', 15, 1, 181),
    (s5, q3, 3, j7, '2026-09-18 09:10-05', '2026-09-18 09:12:30-05', 10, 1, 205),
    (s5, q3, 4, j8, '2026-09-18 09:30-05', '2026-09-18 09:35-05', 9, 2, 84),
    (s5, q3, 5, j7, '2026-09-18 09:50-05', '2026-09-18 09:55-05', 11, 1, 132);

  -- Misiones reales.
  insert into s5_misiones_reales (sesion_id, equipo_id, tipo_area, area, problema, foto_antes, foto_despues, hallazgos, acciones, resultados, auditoria_antes, auditoria_despues, estado, comentario, puntos_bono) values
    (s5, q1, 'Archivo', 'Archivo de compras, primer piso', 'Se tardan hasta 15 minutos buscando una orden de compra; hay cajas de años viejos mezcladas con las del mes.',
     'Foto en el grupo de WhatsApp del equipo (18/09)', 'Foto en el grupo de WhatsApp del equipo (23/09)',
     '{"innecesarios": 14, "desorden": 9, "suciedad": 2, "problemas": 3, "riesgos": 1, "obsoleta": 6}',
     '{"Clasificar": "Sacamos 14 cajas: 9 a archivo central y 5 a reciclaje", "Ordenar": "Estantes etiquetados por año y proveedor; lo del mes a la altura de la mano", "Limpiar": "Se reparó la gotera que mojaba las cajas", "Estandarizar": "Foto estándar pegada en la puerta y mapa del archivo", "Sostener": "Revisión de 5 minutos cada viernes con responsable rotativo"}',
     '{"minutos_ahorrados": 25, "busqueda_antes": 900, "busqueda_despues": 45, "espacio_liberado": 3, "elementos_eliminados": 14, "riesgos_eliminados": 1}',
     '{"0": 1, "1": 1, "2": 2, "3": 0, "4": 1}', '{"0": 4, "1": 4, "2": 3, "3": 3, "4": 3}', 'validada', 'Excelente: el tiempo de búsqueda bajó de 15 minutos a 45 segundos.', 80),
    (s5, q2, 'Puesto de trabajo', 'Bodega de insumos de oficina', 'Nunca se sabe cuánto papel y tóner queda; se piden compras urgentes.',
     'Foto en Drive', 'Foto en Drive',
     '{"innecesarios": 6, "desorden": 11, "suciedad": 1, "problemas": 2, "riesgos": 2}',
     '{"Clasificar": "Retiramos cajas vacías y tóner de impresoras que ya no existen", "Ordenar": "Estantes con nivel mínimo y máximo marcado", "Limpiar": "Limpieza y revisión de humedad", "Estandarizar": "Tarjeta kanban para pedir cuando se llega al mínimo"}',
     '{"minutos_ahorrados": 10, "elementos_eliminados": 6, "riesgos_eliminados": 2}',
     '{"0": 2, "1": 1, "2": 2, "3": 1, "4": 1}', '{"0": 3, "1": 4, "2": 3, "3": 3, "4": 2}', 'enviada', null, 0),
    (s5, q3, 'Información digital', 'Carpeta compartida de Compras', 'Hay 4 versiones del formato de solicitud y nadie sabe cuál usar.',
     null, null, '{"obsoleta": 12}', '{"Clasificar": "Identificamos 12 archivos obsoletos"}', '{}',
     '{"0": 1, "1": 1, "2": 2, "3": 1, "4": 1}', '{}', 'borrador', null, 0);

  -- Una mejora del reto 5S ya llegó al plan del proceso.
  insert into pc_acciones (proceso_id, titulo, detalle, responsable, fecha_compromiso, estado, origen, origen_id, origen_ref) values
    (pc, 'Replicar la mejora de 🦊 Los Clasificadores en «Archivo de compras, primer piso» (25 % → 85 %)',
     'Estantes por año y proveedor, foto estándar y revisión de 5 minutos cada viernes. Llevarlo al archivo de contabilidad.', 'Paula Gómez', '2026-10-17', 'pendiente', 'cincos', s5, s5 || ':s5-replicar-' || q1);

  -- ==========================================================================
  -- 8. MUDALAB (caso ya jugado, unido al proceso de compras)
  --    Puntos calculados con las mismas reglas del juego (src/lib/mudalab.ts).
  -- ==========================================================================
  insert into ml_sesiones (codigo, titulo, descripcion, caso, estado, mision_actual, registro_abierto, creado_por, proceso_id, cerrado_en, created_at)
  values ('MUDA26', 'MudaLab · Equipo administrativo', 'Agencias de detectives a la caza de las 8 Mudas. Al final, cada quien trae una Muda de su propio trabajo.',
          'compras', 'cerrado', 6, false, v_dueno, pc, '2026-09-23 12:00-05', '2026-09-22 07:45-05')
  returning id into ml;
  insert into ml_equipos (sesion_id, nombre, emoji, created_at) values (ml, 'Los Cazamudas', '🦊', '2026-09-22 07:50-05') returning id into q1;
  insert into ml_equipos (sesion_id, nombre, emoji, created_at) values (ml, 'Flujo Total', '🦉', '2026-09-22 07:51-05') returning id into q2;
  insert into ml_equipos (sesion_id, nombre, emoji, created_at) values (ml, 'Detectives del Tiempo', '🐺', '2026-09-22 07:52-05') returning id into q3;
  insert into ml_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, acepta_datos, token_hash) values (ml, q1, 'Mariana', 'Restrepo Díaz', 'Coordinadora de compras', true, 'femenino', true, md5(random()::text || clock_timestamp())) returning id into j1;
  insert into ml_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, acepta_datos, token_hash) values (ml, q1, 'Andrés', 'Quintero Lara', 'Analista de costos', false, 'masculino', true, md5(random()::text || clock_timestamp())) returning id into j2;
  insert into ml_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, acepta_datos, token_hash) values (ml, q1, 'Sofía', 'Bermúdez Rey', 'Auxiliar contable', false, 'femenino', true, md5(random()::text || clock_timestamp())) returning id into j3;
  insert into ml_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, acepta_datos, token_hash) values (ml, q2, 'Ricardo', 'Montoya Paz', 'Jefe de almacén', true, 'masculino', true, md5(random()::text || clock_timestamp())) returning id into j4;
  insert into ml_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, acepta_datos, token_hash) values (ml, q2, 'Valentina', 'Cruz Ospina', 'Asistente de talento humano', false, 'femenino', true, md5(random()::text || clock_timestamp())) returning id into j5;
  insert into ml_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, acepta_datos, token_hash) values (ml, q2, 'Samuel', 'Vargas Toro', 'Mensajero', false, 'masculino', true, md5(random()::text || clock_timestamp())) returning id into j6;
  insert into ml_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, acepta_datos, token_hash) values (ml, q3, 'Laura', 'Giraldo Mejía', 'Tesorera', true, 'femenino', true, md5(random()::text || clock_timestamp())) returning id into j7;
  insert into ml_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, acepta_datos, token_hash) values (ml, q3, 'Tomás', 'Arango Villa', 'Auxiliar de sistemas', false, 'masculino', true, md5(random()::text || clock_timestamp())) returning id into j8;

  insert into ml_intentos (sesion_id, equipo_id, mision, jugador_id, inicio, fin, respuestas, aciertos, errores, puntos, resumen) values
(ml, q1, 1, j1, '2026-09-22 08:10-05', '2026-09-22 08:19-05', '{"problema":"a","afectados":"a","inicio":"b","fin":"c","indicador":"b","meta":"c"}', 6, 0, 120, '{}'),
    (ml, q1, 2, j2, '2026-09-22 09:10-05', '2026-09-22 09:23-05', '{"datos":true,"observados":["p2","p3","p4","p5","p6","p7","p8"],"marcas":{"p2":"sobreprocesamiento","p3":"transporte","p4":"espera","p5":"defectos","p6":"sobreproduccion","p7":"inventario","p8":"talento","p12":"movimiento"},"cuello":"p4","eficiencia":"e1"}', 8, 0, 375, '{"mudasDetectadas":8,"mudasClasificadas":8,"tiposEncontrados":["sobreprocesamiento","transporte","espera","defectos","sobreproduccion","inventario","talento","movimiento"],"cuello":true,"eficiencia":true}'),
    (ml, q1, 3, j3, '2026-09-22 10:10-05', '2026-09-22 10:27-05', '{"elecciones":[["b"],["a"],["c"],["a"],["b"]],"ishikawa":{"c1":"personas","c2":"personas","c3":"metodo","c4":"metodo","c5":"tecnologia","c6":"materiales","c7":"medicion","c8":"entorno"}}', 13, 0, 230, '{"raiz":true,"culpas":0}'),
    (ml, q1, 4, j1, '2026-09-22 11:10-05', '2026-09-22 11:31-05', '{"experimentos":[["A"],["B","C","E"],["B","C","D"]],"plan":["B","C","D"]}', 3, 0, 771, '{"plan":["B","C","D"],"dias":2.3,"defectos":3,"valido":true,"atacaRaiz":true,"experimentos":3}'),
    (ml, q1, 5, j2, '2026-09-22 12:10-05', '2026-09-22 12:35-05', '{"mecanismos":["estandar","indicador","alerta"]}', 3, 0, 380, '{"sostenibilidad":95,"mecanismos":["estandar","indicador","alerta"]}'),
    (ml, q2, 1, j4, '2026-09-22 08:10-05', '2026-09-22 08:22-05', '{"problema":"a","afectados":"a","inicio":"b","fin":"c","indicador":"b","meta":"a"}', 5, 1, 100, '{}'),
    (ml, q2, 2, j5, '2026-09-22 09:10-05', '2026-09-22 09:26-05', '{"datos":true,"observados":["p4","p5","p7","p8","p9","p12","p2"],"marcas":{"p2":"sobreprocesamiento","p4":"espera","p5":"defectos","p7":"inventario","p8":"sobreprocesamiento","p9":"espera","p12":"transporte","p6":"sobreproduccion"},"cuello":"p4","eficiencia":"e2"}', 7, 4, 250, '{"mudasDetectadas":7,"mudasClasificadas":5,"tiposEncontrados":["sobreprocesamiento","espera","defectos","sobreproduccion","inventario"],"cuello":true,"eficiencia":false}'),
    (ml, q2, 3, j6, '2026-09-22 10:10-05', '2026-09-22 10:30-05', '{"elecciones":[["c","b"],["a"],["c"],["b","a"],["b"]],"ishikawa":{"c1":"personas","c2":"personas","c3":"metodo","c4":"personas","c5":"tecnologia","c6":"metodo","c7":"medicion","c8":"entorno"}}', 11, 3, 150, '{"raiz":true,"culpas":1}'),
    (ml, q2, 4, j4, '2026-09-22 11:10-05', '2026-09-22 11:34-05', '{"experimentos":[["B","C","E"]],"plan":["B","C","E"]}', 3, 0, 704, '{"plan":["B","C","E"],"dias":1.8,"defectos":7,"valido":true,"atacaRaiz":true,"experimentos":1}'),
    (ml, q2, 5, j5, '2026-09-22 12:10-05', '2026-09-22 12:38-05', '{"mecanismos":["estandar","capacitacion","compromiso"]}', 3, 0, 220, '{"sostenibilidad":55,"mecanismos":["estandar","capacitacion","compromiso"]}'),
    (ml, q3, 1, j7, '2026-09-22 08:10-05', '2026-09-22 08:25-05', '{"problema":"c","afectados":"a","inicio":"a","fin":"c","indicador":"b","meta":"c"}', 4, 2, 80, '{}'),
    (ml, q3, 2, j8, '2026-09-22 09:10-05', '2026-09-22 09:29-05', '{"datos":false,"observados":["p1","p3","p4","p8","p10","p12","p5","p6"],"marcas":{"p3":"transporte","p4":"espera","p8":"espera","p12":"movimiento","p5":"defectos","p10":"espera"},"cuello":"p8","eficiencia":"e1"}', 5, 3, 200, '{"mudasDetectadas":5,"mudasClasificadas":4,"tiposEncontrados":["transporte","espera","defectos","movimiento"],"cuello":false,"eficiencia":true}'),
    (ml, q3, 3, j7, '2026-09-22 10:10-05', '2026-09-22 10:33-05', '{"elecciones":[["c","b"],["b","a"],["c"],["a"],["c","b"]],"ishikawa":{"c1":"personas","c2":"entorno","c3":"metodo","c4":"metodo","c5":"materiales","c6":"materiales","c7":"metodo","c8":"entorno"}}', 10, 5, 85, '{"raiz":true,"culpas":2}'),
    (ml, q3, 4, j8, '2026-09-22 11:10-05', '2026-09-22 11:37-05', '{"experimentos":[["A","B"],["B","G","H"]],"plan":["B","G","H"]}', 3, 0, 376, '{"plan":["B","G","H"],"dias":2.9,"defectos":18,"valido":true,"atacaRaiz":true,"experimentos":2}'),
    (ml, q3, 5, j7, '2026-09-22 12:10-05', '2026-09-22 12:41-05', '{"mecanismos":["tablero","compromiso","capacitacion"]}', 3, 0, 180, '{"sostenibilidad":45,"mecanismos":["tablero","compromiso","capacitacion"]}');

  -- Mundo 2: Banco de oportunidades (Mudas reales de su trabajo).
  insert into ml_oportunidades (sesion_id, equipo_id, jugador_id, proceso, problema, muda, evidencia, causa, idea, estado, resultado, minutos_semana, votos, created_at) values
    (ml, q1, j1, 'Legalización de viáticos', 'Imprimo los soportes, los escaneo y los vuelvo a enviar por correo a Contabilidad, que los vuelve a imprimir.', 'sobreprocesamiento',
     'Foto de la pila de soportes en el grupo de WhatsApp', 'Nunca se definió que Contabilidad acepta soportes digitales.', 'Formulario en línea con foto del soporte desde el celular.', 'probando', 'En prueba con 5 personas: de 40 a 10 minutos por legalización.', 120,
     array[j4, j5, j6, j7, j8], '2026-09-23 10:05-05'),
    (ml, q1, j2, 'Cierre contable mensual', 'Espero 3 días a que cada área envíe sus facturas; siempre llegan el último día.', 'espera',
     null, 'No hay fecha límite acordada por área.', 'Calendario de cierre con fecha por área y recordatorio automático.', 'idea', null, 180,
     array[j4, j7], '2026-09-23 10:12-05'),
    (ml, q1, j3, 'Archivo de facturas', 'Guardamos 2 copias en papel de cada factura electrónica.', 'sobreproduccion',
     null, 'Costumbre de antes de la factura electrónica.', 'Dejar solo el archivo digital con carpeta por mes.', 'implementada', 'Se dejaron de imprimir unas 300 hojas al mes.', 60,
     array[j5, j8], '2026-09-23 10:20-05'),
    (ml, q2, j4, 'Despacho de pedidos internos', 'El auxiliar camina hasta la bodega del fondo por cada pedido, aunque lo más pedido cabe en la bodega de adelante.', 'movimiento',
     'Diagrama de espagueti en Drive', 'La bodega se organizó por orden de llegada, no por lo que más se pide.', 'Poner lo más pedido (20 % de referencias) en la bodega de adelante.', 'idea', null, 150,
     array[j1, j2, j3, j7], '2026-09-23 10:08-05'),
    (ml, q2, j5, 'Contratación de personal', 'Pedimos las mismas certificaciones 2 veces: en la hoja de vida y en el formulario de ingreso.', 'sobreprocesamiento',
     null, 'Dos formatos que nadie ha unificado.', 'Un solo formulario de ingreso.', 'idea', null, 45,
     array[j2], '2026-09-23 10:15-05'),
    (ml, q3, j7, 'Pagos a proveedores', 'Uno de cada 10 pagos se devuelve porque la cuenta bancaria del proveedor está desactualizada.', 'defectos',
     null, 'Nadie pide actualizar la certificación bancaria.', 'Pedir la certificación una vez al año y validar antes de pagar.', 'idea', null, 90,
     array[j1, j4], '2026-09-23 10:18-05'),
    (ml, q3, j8, 'Soporte de sistemas', 'Resuelvo las mismas 5 preguntas cada semana porque nadie sabe dónde está el instructivo.', 'talento',
     null, 'El instructivo está en una carpeta que nadie conoce.', 'Video corto de 2 minutos por pregunta, en la intranet.', 'idea', null, 100,
     '{}', '2026-09-23 10:25-05');

  -- La oportunidad más votada ya llegó al plan del proceso.
  select id into op1 from ml_oportunidades where sesion_id = ml and proceso = 'Legalización de viáticos';
  insert into pc_acciones (proceso_id, titulo, detalle, responsable, fecha_compromiso, estado, origen, origen_id, origen_ref) values
    (pc, '🔁 Legalización de viáticos: soportes digitales desde el celular',
     'Causa: nunca se definió que Contabilidad acepta soportes digitales. Propuesta de 🦊 Los Cazamudas con 5 👍. En prueba: de 40 a 10 minutos.', 'Mariana Restrepo', '2026-10-24', 'en_curso', 'mudalab', ml, ml || ':ml-op-' || op1);

  raise notice 'Demo creada. Dueña: %', coalesce((select email from auth.users where id = v_dueno), 'NINGUNA (solo la ven los administradores)');
end $$;
