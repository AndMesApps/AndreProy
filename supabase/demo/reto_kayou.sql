-- ============================================================================
-- reto_kayou.sql · Reto de DEMOSTRACIÓN de MudaGami · Kayou para AndMesApps
--
-- Carga completo el reto "Kayou: la ruta del transporte — Bodega Central",
-- con dos equipos de jugadores inventados que produjeron el mismo lote con
-- el diseño de planta inicial (corrida 1), cada uno rediseñó su propia planta
-- y volvió a producir (corrida 2). Un equipo (Los Rápidos) rediseñó mucho
-- mejor que el otro (Vigías de Ruta), para que se vea la diferencia en el
-- informe y el ranking. Queda en estado CERRADO, con resultados listos.
--
-- Cómo usarlo: Supabase → SQL Editor → pegar todo → Run.
-- Se puede correr varias veces: borra el reto de demo (código KAYU26) y lo
-- vuelve a crear. Requiere la migración 0011_mudagami.sql ya corrida.
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
  e_rapidos uuid; e_vigias uuid;
  -- jugadores · Los Rápidos
  j_esteban uuid; j_daniela uuid; j_camilo uuid; j_natalia uuid;
  -- jugadores · Vigías de Ruta
  j_felipe uuid; j_paula uuid; j_sebastian uuid; j_laura uuid;
begin
  -- Limpieza (los jugadores antes que los equipos: equipo_id es "on delete restrict").
  delete from mg_jugadores where reto_id in (select id from mg_retos where codigo = 'KAYU26');
  delete from mg_retos where codigo = 'KAYU26';

  select id into v_dueno from auth.users where lower(email) = lower(v_email_dueno);

  -- --------------------------------------------------------------------------
  -- Reto
  -- --------------------------------------------------------------------------
  insert into mg_retos (codigo, titulo, descripcion, estado, registro_abierto, duracion_corrida_seg, duracion_rediseno_seg, creado_por, cerrado_en, created_at)
  values ('KAYU26',
          'Kayou: la ruta del transporte — Bodega Central',
          'Producimos un lote de 15 piezas dos veces: primero con la planta como siempre ha estado, y otra vez con la planta que cada equipo rediseñó. La idea es sentir cuánto cuesta mover cosas de un lado a otro sin necesidad.',
          'cerrado', false, 600, 240, v_dueno,
          '2026-09-26 09:05-05', '2026-09-26 08:00-05')
  returning id into v_reto;

  -- --------------------------------------------------------------------------
  -- Equipos y jugadores (personas inventadas)
  -- --------------------------------------------------------------------------
  insert into mg_equipos (reto_id, nombre, emoji, created_at) values (v_reto, 'Los Rápidos', '🦁', '2026-09-26 08:05-05') returning id into e_rapidos;
  insert into mg_equipos (reto_id, nombre, emoji, created_at) values (v_reto, 'Vigías de Ruta', '🦉', '2026-09-26 08:08-05') returning id into e_vigias;

  insert into mg_jugadores (reto_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, acepta_datos, token_hash, created_at)
  values (v_reto, e_rapidos, 'Esteban', 'Cárdenas Ruiz', 'Operario de Planta', true, 'masculino', '25 a 34', 'Bodega Central', 'Producción', '3 a 5 años', 'esteban.cardenas@ejemplo.com', true, md5(gen_random_uuid()::text), '2026-09-26 08:06-05')
  returning id into j_esteban;
  insert into mg_jugadores (reto_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, acepta_datos, token_hash, created_at)
  values (v_reto, e_rapidos, 'Daniela', 'Pérez Londoño', 'Operaria de Planta', false, 'femenino', '18 a 24', 'Bodega Central', 'Producción', 'Menos de 1 año', 'daniela.perez@ejemplo.com', true, md5(gen_random_uuid()::text), '2026-09-26 08:07-05')
  returning id into j_daniela;
  insert into mg_jugadores (reto_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, acepta_datos, token_hash, created_at)
  values (v_reto, e_rapidos, 'Camilo', 'Vargas Toro', 'Auxiliar de Logística', false, 'masculino', '25 a 34', 'Bodega Central', 'Logística', '1 a 3 años', 'camilo.vargas@ejemplo.com', true, md5(gen_random_uuid()::text), '2026-09-26 08:07-05')
  returning id into j_camilo;
  insert into mg_jugadores (reto_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, acepta_datos, token_hash, created_at)
  values (v_reto, e_rapidos, 'Natalia', 'Ríos Bedoya', 'Auxiliar de Calidad', false, 'femenino', '25 a 34', 'Bodega Central', 'Calidad', '1 a 3 años', 'natalia.rios@ejemplo.com', true, md5(gen_random_uuid()::text), '2026-09-26 08:08-05')
  returning id into j_natalia;

  insert into mg_jugadores (reto_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, acepta_datos, token_hash, created_at)
  values (v_reto, e_vigias, 'Felipe', 'Moreno Cano', 'Supervisor de Producción', true, 'masculino', '35 a 44', 'Bodega Central', 'Producción', '5 a 10 años', 'felipe.moreno@ejemplo.com', true, md5(gen_random_uuid()::text), '2026-09-26 08:09-05')
  returning id into j_felipe;
  insert into mg_jugadores (reto_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, acepta_datos, token_hash, created_at)
  values (v_reto, e_vigias, 'Paula', 'Jiménez Osorio', 'Operaria de Planta', false, 'femenino', '25 a 34', 'Bodega Central', 'Producción', '1 a 3 años', 'paula.jimenez@ejemplo.com', true, md5(gen_random_uuid()::text), '2026-09-26 08:10-05')
  returning id into j_paula;
  insert into mg_jugadores (reto_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, acepta_datos, token_hash, created_at)
  values (v_reto, e_vigias, 'Sebastián', 'Gil Muñoz', 'Auxiliar de Bodega', false, 'masculino', '18 a 24', 'Bodega Central', 'Logística', 'Menos de 1 año', 'sebastian.gil@ejemplo.com', true, md5(gen_random_uuid()::text), '2026-09-26 08:10-05')
  returning id into j_sebastian;
  insert into mg_jugadores (reto_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, acepta_datos, token_hash, created_at)
  values (v_reto, e_vigias, 'Laura', 'Betancur Soto', 'Auxiliar de Logística', false, 'femenino', '25 a 34', 'Bodega Central', 'Logística', '3 a 5 años', 'laura.betancur@ejemplo.com', true, md5(gen_random_uuid()::text), '2026-09-26 08:11-05')
  returning id into j_laura;

  -- --------------------------------------------------------------------------
  -- Corrida 1 (línea base): el mismo diseño de planta inicial para los dos
  -- equipos (LAYOUT_INICIAL en src/lib/mudagami.ts), así que la diferencia
  -- que viene después es por el rediseño, no por el punto de partida.
  -- --------------------------------------------------------------------------
  insert into mg_traslados (reto_id, equipo_id, corrida, medio, articulos, jugador_id, created_at) values
    -- Los Rápidos: 5 viajes en montacargas + 4 en carretilla = 70 min, $10.000
    (v_reto, e_rapidos, 1, 'montacargas', 3, j_esteban, '2026-09-26 08:35-05'),
    (v_reto, e_rapidos, 1, 'montacargas', 3, j_camilo,  '2026-09-26 08:36-05'),
    (v_reto, e_rapidos, 1, 'montacargas', 2, j_daniela, '2026-09-26 08:37-05'),
    (v_reto, e_rapidos, 1, 'montacargas', 3, j_esteban, '2026-09-26 08:39-05'),
    (v_reto, e_rapidos, 1, 'montacargas', 2, j_natalia, '2026-09-26 08:40-05'),
    (v_reto, e_rapidos, 1, 'carretilla',  1, j_camilo,  '2026-09-26 08:41-05'),
    (v_reto, e_rapidos, 1, 'carretilla',  1, j_daniela, '2026-09-26 08:42-05'),
    (v_reto, e_rapidos, 1, 'carretilla',  1, j_natalia, '2026-09-26 08:42-05'),
    (v_reto, e_rapidos, 1, 'carretilla',  1, j_esteban, '2026-09-26 08:43-05'),
    -- Vigías de Ruta: 6 viajes en montacargas + 2 en carretilla = 70 min, $12.000
    (v_reto, e_vigias, 1, 'montacargas', 3, j_felipe,    '2026-09-26 08:35-05'),
    (v_reto, e_vigias, 1, 'montacargas', 3, j_sebastian, '2026-09-26 08:36-05'),
    (v_reto, e_vigias, 1, 'montacargas', 2, j_paula,     '2026-09-26 08:37-05'),
    (v_reto, e_vigias, 1, 'montacargas', 3, j_felipe,    '2026-09-26 08:38-05'),
    (v_reto, e_vigias, 1, 'montacargas', 2, j_laura,     '2026-09-26 08:40-05'),
    (v_reto, e_vigias, 1, 'montacargas', 3, j_sebastian, '2026-09-26 08:41-05'),
    (v_reto, e_vigias, 1, 'carretilla',  1, j_paula,     '2026-09-26 08:42-05'),
    (v_reto, e_vigias, 1, 'carretilla',  1, j_laura,     '2026-09-26 08:43-05');

  -- --------------------------------------------------------------------------
  -- Rediseño (4 minutos): Los Rápidos acercaron bien las estaciones seguidas
  -- del proceso (mínimo teórico 7 traslados); Vigías de Ruta mejoraron algo,
  -- pero menos (mínimo teórico 9).
  -- --------------------------------------------------------------------------
  insert into mg_layouts (reto_id, equipo_id, corrida, posiciones, created_at, updated_at) values
    (v_reto, e_rapidos, 2,
     '{"F":"bodega_prima","E":"corte_recto","D":"perforado","A":"pintura","B":"bodega_terminado","C":"corte_circular"}'::jsonb,
     '2026-09-26 08:49-05', '2026-09-26 08:49-05'),
    (v_reto, e_vigias, 2,
     '{"F":"bodega_prima","E":"corte_recto","D":"perforado","A":"bodega_terminado","B":"pintura","C":"corte_circular"}'::jsonb,
     '2026-09-26 08:49-05', '2026-09-26 08:49-05');

  -- --------------------------------------------------------------------------
  -- Corrida 2 (con el diseño de cada equipo)
  -- --------------------------------------------------------------------------
  insert into mg_traslados (reto_id, equipo_id, corrida, medio, articulos, jugador_id, created_at) values
    -- Los Rápidos: 2 montacargas + 3 carretilla = 35 min, $4.000 (-50 % tiempo, -60 % costo)
    (v_reto, e_rapidos, 2, 'montacargas', 3, j_esteban, '2026-09-26 08:53-05'),
    (v_reto, e_rapidos, 2, 'montacargas', 2, j_camilo,  '2026-09-26 08:55-05'),
    (v_reto, e_rapidos, 2, 'carretilla',  1, j_daniela, '2026-09-26 08:56-05'),
    (v_reto, e_rapidos, 2, 'carretilla',  1, j_natalia, '2026-09-26 08:57-05'),
    (v_reto, e_rapidos, 2, 'carretilla',  1, j_esteban, '2026-09-26 08:58-05'),
    -- Vigías de Ruta: 5 montacargas + 3 carretilla = 65 min, $10.000 (-7 % tiempo, -17 % costo)
    (v_reto, e_vigias, 2, 'montacargas', 3, j_felipe,    '2026-09-26 08:53-05'),
    (v_reto, e_vigias, 2, 'montacargas', 3, j_sebastian, '2026-09-26 08:54-05'),
    (v_reto, e_vigias, 2, 'montacargas', 2, j_paula,     '2026-09-26 08:56-05'),
    (v_reto, e_vigias, 2, 'montacargas', 3, j_felipe,    '2026-09-26 08:57-05'),
    (v_reto, e_vigias, 2, 'montacargas', 2, j_laura,     '2026-09-26 08:59-05'),
    (v_reto, e_vigias, 2, 'carretilla',  1, j_paula,     '2026-09-26 09:00-05'),
    (v_reto, e_vigias, 2, 'carretilla',  1, j_sebastian, '2026-09-26 09:00-05'),
    (v_reto, e_vigias, 2, 'carretilla',  1, j_laura,     '2026-09-26 09:01-05');

  raise notice 'Reto de demo creado: código KAYU26 (dueño: %)', coalesce(v_email_dueno || case when v_dueno is null then ' — NO encontrado, queda sin dueño' else '' end, '—');
end $$;
