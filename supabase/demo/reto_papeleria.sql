-- ============================================================================
-- reto_papeleria.sql · Reto de DEMOSTRACIÓN para AndMesApps
--
-- Carga completo el reto "¿Por qué una compra de papelería tarda 2 semanas?"
-- (el mismo que se probó en Espiral de Crecimiento el 2026-09-23), con dos
-- equipos de jugadores inventados, sus cazas, propuestas y votos. Queda en la
-- fase CERRADO para ver los resultados; con "Volver a…" se recorren las fases.
--
-- Cómo usarlo: Supabase → SQL Editor → pegar todo → Run.
-- Se puede correr varias veces: borra el reto de demo (código CAZA26) y lo
-- vuelve a crear.
--
-- Dueño del reto: cambia el correo de abajo por el de un Líder si quieres que
-- sea él quien lo administre. Si el correo no existe, el reto queda sin dueño
-- y solo lo ven los administradores.
-- ============================================================================

do $$
declare
  v_email_dueno text := 'andreamesiasapps@gmail.com';
  v_dueno uuid;
  v_reto uuid;
  -- equipos
  e_compras uuid; e_halcon uuid;
  -- carriles
  c_sol uuid; c_lid uuid; c_com uuid; c_ger uuid; c_pro uuid;
  -- pasos
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; p6 uuid; p7 uuid; p8 uuid;
  -- jugadores
  j_laura uuid; j_carlos uuid; j_valentina uuid; j_andres uuid; j_mariana uuid;
  j_julian uuid; j_sofia uuid; j_daniel uuid;
  -- propuestas
  pr_a uuid; pr_b uuid; pr_c uuid; pr_d uuid;
begin
  -- Limpieza (los jugadores antes que los equipos: equipo_id es "on delete restrict").
  delete from mk_jugadores where reto_id in (select id from mk_retos where codigo = 'CAZA26');
  delete from mk_retos where codigo = 'CAZA26';

  select id into v_dueno from auth.users where lower(email) = lower(v_email_dueno);

  -- --------------------------------------------------------------------------
  -- Reto
  -- --------------------------------------------------------------------------
  insert into mk_retos (codigo, titulo, descripcion, inicio_proceso, fin_proceso, estado, registro_abierto, fecha_limite, creado_por, cerrado_en, created_at)
  values ('CAZA26',
          '¿Por qué una compra de papelería tarda 2 semanas?',
          'Pedir un paquete de hojas no debería tardar tanto. Ayúdanos a encontrar dónde se va el tiempo.',
          'Un colaborador necesita un insumo',
          'El insumo llega a su puesto',
          'cerrado', false, '2026-09-30', v_dueno,
          '2026-09-24 17:00-05', '2026-09-20 08:00-05')
  returning id into v_reto;

  -- --------------------------------------------------------------------------
  -- Mapa: carriles y pasos (tiempos en minutos: 1 día = 1440, 1 h = 60)
  -- --------------------------------------------------------------------------
  insert into mk_carriles (reto_id, nombre, orden) values (v_reto, 'Solicitante', 1) returning id into c_sol;
  insert into mk_carriles (reto_id, nombre, orden) values (v_reto, 'Líder del área', 2) returning id into c_lid;
  insert into mk_carriles (reto_id, nombre, orden) values (v_reto, 'Compras', 3) returning id into c_com;
  insert into mk_carriles (reto_id, nombre, orden) values (v_reto, 'Gerencia', 4) returning id into c_ger;
  insert into mk_carriles (reto_id, nombre, orden) values (v_reto, 'Proveedor', 5) returning id into c_pro;

  insert into mk_pasos (reto_id, carril_id, orden, descripcion, tiempo_trabajo_min, tiempo_espera_min, documento_sistema, clasificacion)
  values (v_reto, c_sol, 1, 'Llena la solicitud de compra en papel', 15, 1440, 'Formato en papel', 'necesaria') returning id into p1;
  insert into mk_pasos (reto_id, carril_id, orden, descripcion, tiempo_trabajo_min, tiempo_espera_min, documento_sistema, clasificacion)
  values (v_reto, c_lid, 2, 'Firma la solicitud', 5, 2880, 'Firma física', 'desperdicio') returning id into p2;
  insert into mk_pasos (reto_id, carril_id, orden, descripcion, tiempo_trabajo_min, tiempo_espera_min, documento_sistema, clasificacion)
  values (v_reto, c_com, 3, 'Transcribe la solicitud al Excel de compras', 20, 1440, 'Excel', 'desperdicio') returning id into p3;
  insert into mk_pasos (reto_id, carril_id, orden, descripcion, tiempo_trabajo_min, tiempo_espera_min, documento_sistema, clasificacion)
  values (v_reto, c_com, 4, 'Pide 3 cotizaciones a proveedores', 60, 4320, 'Correo', 'necesaria') returning id into p4;
  insert into mk_pasos (reto_id, carril_id, orden, descripcion, tiempo_trabajo_min, tiempo_espera_min, documento_sistema, clasificacion)
  values (v_reto, c_ger, 5, 'Aprueba la compra', 10, 2880, 'Firma física', 'necesaria') returning id into p5;
  insert into mk_pasos (reto_id, carril_id, orden, descripcion, tiempo_trabajo_min, tiempo_espera_min, documento_sistema, clasificacion)
  values (v_reto, c_com, 6, 'Emite la orden de compra', 30, 240, 'ERP', 'agrega_valor') returning id into p6;
  insert into mk_pasos (reto_id, carril_id, orden, descripcion, tiempo_trabajo_min, tiempo_espera_min, documento_sistema, clasificacion)
  values (v_reto, c_pro, 7, 'Entrega el pedido', 120, 4320, 'Remisión', 'agrega_valor') returning id into p7;
  insert into mk_pasos (reto_id, carril_id, orden, descripcion, tiempo_trabajo_min, tiempo_espera_min, documento_sistema, clasificacion)
  values (v_reto, c_com, 8, 'Recibe, revisa y entrega al solicitante', 30, 0, 'Remisión', 'agrega_valor') returning id into p8;

  -- --------------------------------------------------------------------------
  -- Equipos y jugadores (personas inventadas)
  -- --------------------------------------------------------------------------
  insert into mk_equipos (reto_id, nombre, emoji, created_at) values (v_reto, 'Cazadores de Compras', '🦊', '2026-09-21 08:10-05') returning id into e_compras;
  insert into mk_equipos (reto_id, nombre, emoji, created_at) values (v_reto, 'Ojos de Halcón', '🦉', '2026-09-21 08:25-05') returning id into e_halcon;

  insert into mk_jugadores (reto_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, acepta_datos, token_hash, created_at)
  values (v_reto, e_compras, 'Laura', 'Restrepo Gómez', 'Coordinadora Administrativa', true, 'femenino', '35 a 44', 'Espiral de Crecimiento', 'Administrativa y Financiera', '5 a 10 años', 'laura.restrepo@ejemplo.com', true, md5(gen_random_uuid()::text), '2026-09-21 08:10-05')
  returning id into j_laura;
  insert into mk_jugadores (reto_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, acepta_datos, token_hash, created_at)
  values (v_reto, e_compras, 'Carlos', 'Mejía Ortiz', 'Analista de Compras', false, 'masculino', '25 a 34', 'Espiral de Crecimiento', 'Compras', '3 a 5 años', 'carlos.mejia@ejemplo.com', true, md5(gen_random_uuid()::text), '2026-09-21 08:12-05')
  returning id into j_carlos;
  insert into mk_jugadores (reto_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, acepta_datos, token_hash, created_at)
  values (v_reto, e_compras, 'Valentina', 'Ospina Ríos', 'Auxiliar Contable', false, 'femenino', '18 a 24', 'Espiral de Crecimiento', 'Administrativa y Financiera', 'Menos de 1 año', 'valentina.ospina@ejemplo.com', true, md5(gen_random_uuid()::text), '2026-09-21 08:14-05')
  returning id into j_valentina;
  insert into mk_jugadores (reto_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, acepta_datos, token_hash, created_at)
  values (v_reto, e_compras, 'Andrés Felipe', 'Duque Marín', 'Asistente de Gerencia', false, 'masculino', '25 a 34', 'Espiral de Crecimiento', 'Gerencia', '1 a 3 años', 'andres.duque@ejemplo.com', true, md5(gen_random_uuid()::text), '2026-09-21 08:15-05')
  returning id into j_andres;
  insert into mk_jugadores (reto_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, acepta_datos, token_hash, created_at)
  values (v_reto, e_compras, 'Mariana', 'López Henao', 'Auxiliar de Talento Humano', false, 'femenino', '25 a 34', 'Espiral de Crecimiento', 'Talento Humano', '1 a 3 años', 'mariana.lopez@ejemplo.com', true, md5(gen_random_uuid()::text), '2026-09-21 08:18-05')
  returning id into j_mariana;

  insert into mk_jugadores (reto_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, acepta_datos, token_hash, created_at)
  values (v_reto, e_halcon, 'Julián', 'Castaño Vélez', 'Jefe de Operaciones', true, 'masculino', '45 a 54', 'Espiral de Crecimiento', 'Operaciones', 'Más de 10 años', 'julian.castano@ejemplo.com', true, md5(gen_random_uuid()::text), '2026-09-21 08:25-05')
  returning id into j_julian;
  insert into mk_jugadores (reto_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, acepta_datos, token_hash, created_at)
  values (v_reto, e_halcon, 'Sofía', 'Arango Zapata', 'Analista de Calidad', false, 'femenino', '25 a 34', 'Espiral de Crecimiento', 'Calidad', '3 a 5 años', 'sofia.arango@ejemplo.com', true, md5(gen_random_uuid()::text), '2026-09-21 08:27-05')
  returning id into j_sofia;
  insert into mk_jugadores (reto_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, acepta_datos, token_hash, created_at)
  values (v_reto, e_halcon, 'Daniel', 'Gómez Salazar', 'Auxiliar de Almacén', false, 'masculino', '18 a 24', 'Espiral de Crecimiento', 'Operaciones', 'Menos de 1 año', 'daniel.gomez@ejemplo.com', true, md5(gen_random_uuid()::text), '2026-09-21 08:30-05')
  returning id into j_daniel;

  -- --------------------------------------------------------------------------
  -- Cacería (la primera caza de cada hallazgo es la del pionero;
  -- con 3 cazadores el hallazgo queda validado)
  -- --------------------------------------------------------------------------
  insert into mk_cazas (reto_id, paso_id, jugador_id, tipo_desperdicio, comentario, created_at) values
    -- Paso 2 · Firma del líder: sobreprocesamiento (validado, pionera Laura)
    (v_reto, p2, j_laura,    'sobreprocesamiento', 'Firmar una compra de papelería no agrega valor', '2026-09-21 09:00-05'),
    (v_reto, p2, j_carlos,   'sobreprocesamiento', null, '2026-09-21 09:40-05'),
    (v_reto, p2, j_sofia,    'sobreprocesamiento', 'Es una firma de rutina, nadie revisa', '2026-09-21 10:15-05'),
    (v_reto, p2, j_julian,   'sobreprocesamiento', null, '2026-09-21 11:05-05'),
    -- Paso 2 · esperas (validado, pionero Carlos)
    (v_reto, p2, j_carlos,   'esperas', 'El líder solo firma los viernes', '2026-09-21 09:05-05'),
    (v_reto, p2, j_valentina,'esperas', null, '2026-09-21 10:30-05'),
    (v_reto, p2, j_daniel,   'esperas', null, '2026-09-21 14:20-05'),
    -- Paso 2 · movimiento y traspaso
    (v_reto, p2, j_mariana,  'movimiento', 'El solicitante lleva el papel de oficina en oficina', '2026-09-21 11:30-05'),
    (v_reto, p2, j_daniel,   'traspasos', null, '2026-09-21 14:25-05'),
    -- Paso 1 · defectos
    (v_reto, p1, j_mariana,  'defectos', 'Llegan formatos incompletos y hay que devolverlos', '2026-09-21 11:20-05'),
    -- Paso 3 · Excel: sobreprocesamiento (validado, pionera Valentina)
    (v_reto, p3, j_valentina,'sobreprocesamiento', 'Se digita dos veces lo mismo', '2026-09-21 09:30-05'),
    (v_reto, p3, j_laura,    'sobreprocesamiento', null, '2026-09-21 12:00-05'),
    (v_reto, p3, j_andres,   'sobreprocesamiento', null, '2026-09-22 08:45-05'),
    -- Paso 4 · Cotizaciones: esperas (validado, pionero Julián) y talento
    (v_reto, p4, j_julian,   'esperas', 'Tres días esperando cotizaciones de hojas', '2026-09-21 10:00-05'),
    (v_reto, p4, j_carlos,   'esperas', null, '2026-09-21 15:10-05'),
    (v_reto, p4, j_mariana,  'esperas', null, '2026-09-22 09:00-05'),
    (v_reto, p4, j_carlos,   'talento', 'Un analista cotizando papelería en vez de negociar compras grandes', '2026-09-21 15:15-05'),
    -- Paso 5 · Gerencia: esperas y sobreprocesamiento
    (v_reto, p5, j_andres,   'esperas', 'La agenda de gerencia retrasa la firma', '2026-09-21 16:00-05'),
    (v_reto, p5, j_sofia,    'esperas', null, '2026-09-22 10:10-05'),
    (v_reto, p5, j_laura,    'sobreprocesamiento', 'Doble aprobación: líder y gerencia', '2026-09-22 10:30-05'),
    -- Paso 7 · Proveedor: esperas
    (v_reto, p7, j_sofia,    'esperas', 'Tres días para entregar papelería', '2026-09-22 11:00-05'),
    -- Paso 8 · inventario
    (v_reto, p8, j_daniel,   'inventario', 'Se piden cantidades grandes "por si acaso"', '2026-09-22 11:30-05');

  -- --------------------------------------------------------------------------
  -- Rediseño: propuestas (ahorro en minutos), votos y decisión del facilitador
  -- --------------------------------------------------------------------------
  insert into mk_propuestas (reto_id, paso_id, jugador_id, accion, descripcion, ahorro_estimado_min, estado, created_at)
  values (v_reto, p2, j_laura, 'eliminar', 'Sin firma del líder para compras menores a $500.000', 2880, 'aprobada', '2026-09-23 09:00-05') returning id into pr_a;
  insert into mk_propuestas (reto_id, paso_id, jugador_id, accion, descripcion, ahorro_estimado_min, estado, created_at)
  values (v_reto, p3, j_valentina, 'automatizar', 'Formulario digital que llega directo al Excel de Compras', 1440, 'aprobada', '2026-09-23 09:20-05') returning id into pr_b;
  insert into mk_propuestas (reto_id, paso_id, jugador_id, accion, descripcion, ahorro_estimado_min, estado, created_at)
  values (v_reto, p4, j_julian, 'simplificar', 'Proveedores preaprobados con precios fijos: no cotizar papelería', 4320, 'aprobada', '2026-09-23 09:45-05') returning id into pr_c;
  insert into mk_propuestas (reto_id, paso_id, jugador_id, accion, descripcion, ahorro_estimado_min, estado, created_at)
  values (v_reto, p5, j_andres, 'simplificar', 'Gerencia aprueba solo compras mayores a $2.000.000', 2880, 'descartada', '2026-09-23 10:10-05') returning id into pr_d;

  insert into mk_votos (propuesta_id, jugador_id, created_at) values
    (pr_a, j_carlos, '2026-09-23 11:00-05'), (pr_a, j_valentina, '2026-09-23 11:05-05'), (pr_a, j_andres, '2026-09-23 11:10-05'),
    (pr_a, j_mariana, '2026-09-23 11:15-05'), (pr_a, j_sofia, '2026-09-23 11:20-05'), (pr_a, j_daniel, '2026-09-23 11:25-05'),
    (pr_b, j_laura, '2026-09-23 11:30-05'), (pr_b, j_carlos, '2026-09-23 11:35-05'), (pr_b, j_julian, '2026-09-23 11:40-05'),
    (pr_b, j_mariana, '2026-09-23 11:45-05'),
    (pr_c, j_laura, '2026-09-23 12:00-05'), (pr_c, j_carlos, '2026-09-23 12:05-05'), (pr_c, j_valentina, '2026-09-23 12:10-05'),
    (pr_c, j_andres, '2026-09-23 12:15-05'), (pr_c, j_sofia, '2026-09-23 12:20-05'), (pr_c, j_daniel, '2026-09-23 12:25-05'),
    (pr_c, j_mariana, '2026-09-23 12:30-05'),
    (pr_d, j_mariana, '2026-09-23 12:40-05'), (pr_d, j_daniel, '2026-09-23 12:45-05');

  raise notice 'Reto de demo creado: código CAZA26 (dueño: %)', coalesce(v_email_dueno || case when v_dueno is null then ' — NO encontrado, queda sin dueño' else '' end, '—');
end $$;
