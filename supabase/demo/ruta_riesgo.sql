-- ============================================================================
-- ruta_riesgo.sql · Datos de DEMOSTRACIÓN de «La Ruta del Riesgo» (RIES26)
--
-- Historia: Distribuidora Andina S.A.S. (la empresa de la demo) capacita a
-- sus áreas Comercial, Compras y Tesorería en SAGRILAFT con el juego.
--
--   PROCESO «Vinculación de clientes y proveedores (SAGRILAFT)»
--     ├─ indicador mensual: % de contrapartes con debida diligencia completa
--     ├─ JUEGO La Ruta del Riesgo RIES26 (ya jugado y cerrado)
--     │    ├─ 🦊 Los Guardianes   → 8 retos, certifican «Guardián del Riesgo»
--     │    ├─ 🦉 Radar Comercial  → 8 retos, en desarrollo (compartieron información reservada)
--     │    └─ 🐺 Brújula Verde    → solo alcanzaron 5 retos
--     └─ PLAN DE ACCIÓN con 2 recomendaciones que salieron del informe
--
-- Los puntos y resúmenes se calcularon con las mismas reglas del juego
-- (src/lib/riesgo.ts), así que el informe y el tablero cuadran.
--
-- Requisitos: migración 0009_riesgo.sql. (Si también corriste demo_completo.sql,
-- el proceso queda unido al proyecto de demostración de Distribuidora Andina.)
-- Cómo usarlo: Supabase → SQL Editor → pegar todo → Run.
-- Se puede correr varias veces: borra RIES26 y su proceso y los vuelve a crear.
-- ============================================================================

do $$
declare
  v_dueno uuid;
  v_proyecto uuid;
  pc uuid;
  rr uuid;
  q1 uuid; q2 uuid; q3 uuid;
  j1 uuid; j2 uuid; j3 uuid; j4 uuid; j5 uuid; j6 uuid; j7 uuid; j8 uuid; j9 uuid;
begin
  -- Limpieza de la demo anterior
  delete from pc_procesos where nombre = 'Vinculación de clientes y proveedores (SAGRILAFT)' and cliente = 'Distribuidora Andina S.A.S.';
  delete from rr_jugadores where sesion_id in (select id from rr_sesiones where codigo = 'RIES26');
  delete from rr_sesiones where codigo = 'RIES26';

  -- Dueña de la demo: la cuenta de Andrea (la primera que exista).
  select id into v_dueno from auth.users
   where lower(email) in ('anmimeor@gmail.com', 'andreamesiasapps@gmail.com')
   order by lower(email) = 'anmimeor@gmail.com' desc limit 1;
  select id into v_proyecto from pr_proyectos where grupo = 'Demostración' and cliente = 'Distribuidora Andina S.A.S.' order by created_at limit 1;

  -- ==========================================================================
  -- 1. PROCESO que el juego ayuda a sostener
  -- ==========================================================================
  insert into pc_procesos (nombre, cliente, area, responsable, objetivo, indicador, unidad, sentido, linea_base, meta, frecuencia, proyecto_id, creado_por, created_at)
  values ('Vinculación de clientes y proveedores (SAGRILAFT)', 'Distribuidora Andina S.A.S.', 'Cumplimiento', 'Catalina Duarte',
          'Que ninguna contraparte se vincule sin debida diligencia completa y que toda señal de alerta llegue a la Oficial de Cumplimiento.',
          'Contrapartes con debida diligencia completa', '%', 'subir', 58, 95, 'mensual', v_proyecto, v_dueno, '2026-06-01 09:00-05')
  returning id into pc;
  insert into pc_mediciones (proceso_id, fecha, valor, nota) values
    (pc, '2026-06-30', 58, 'Línea base: faltaba el beneficiario final en 4 de cada 10 expedientes.'),
    (pc, '2026-07-31', 63, null),
    (pc, '2026-08-31', 71, 'Lista de chequeo de vinculación en uso.'),
    (pc, '2026-09-24', 78, 'Semana del juego La Ruta del Riesgo (RIES26).');

  -- ==========================================================================
  -- 2. LA RUTA DEL RIESGO (sesión ya jugada y cerrada)
  -- ==========================================================================
  insert into rr_sesiones (codigo, titulo, descripcion, marco, responsable, canal, umbral, estado, reto_actual, registro_abierto, creado_por, proceso_id, cerrado_en, created_at)
  values ('RIES26', 'La Ruta del Riesgo · Comercial, compras y tesorería',
          'Capacitación SAGRILAFT para los cargos que tratan con clientes, proveedores y pagos.',
          'sagrilaft', 'la Oficial de Cumplimiento (Catalina Duarte)', 'el formato «Reporte interno de operación inusual» de la intranet', 70,
          'cerrado', 8, false, v_dueno, pc, '2026-09-24 16:30-05', '2026-09-24 07:30-05')
  returning id into rr;
  insert into rr_equipos (sesion_id, nombre, emoji, created_at) values (rr, 'Los Guardianes', '🦊', '2026-09-24 07:40-05') returning id into q1;
  insert into rr_equipos (sesion_id, nombre, emoji, created_at) values (rr, 'Radar Comercial', '🦉', '2026-09-24 07:41-05') returning id into q2;
  insert into rr_equipos (sesion_id, nombre, emoji, created_at) values (rr, 'Brújula Verde', '🐺', '2026-09-24 07:42-05') returning id into q3;
  insert into rr_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, organizacion, area, acepta_datos, token_hash) values (rr, q1, 'Natalia', 'Ospina Gil', 'Analista de tesorería', true, 'femenino', 'Distribuidora Andina S.A.S.', 'Tesorería', true, md5(random()::text || clock_timestamp())) returning id into j1;
  insert into rr_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, organizacion, area, acepta_datos, token_hash) values (rr, q1, 'Felipe', 'Cardona Ruiz', 'Coordinador de compras', false, 'masculino', 'Distribuidora Andina S.A.S.', 'Compras', true, md5(random()::text || clock_timestamp())) returning id into j2;
  insert into rr_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, organizacion, area, acepta_datos, token_hash) values (rr, q1, 'Diana', 'Moreno Salas', 'Auxiliar de cartera', false, 'femenino', 'Distribuidora Andina S.A.S.', 'Tesorería', true, md5(random()::text || clock_timestamp())) returning id into j3;
  insert into rr_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, organizacion, area, acepta_datos, token_hash) values (rr, q2, 'Julián', 'Pineda Rojas', 'Ejecutivo comercial', true, 'masculino', 'Distribuidora Andina S.A.S.', 'Comercial', true, md5(random()::text || clock_timestamp())) returning id into j4;
  insert into rr_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, organizacion, area, acepta_datos, token_hash) values (rr, q2, 'Carolina', 'Vélez Mora', 'Ejecutiva comercial', false, 'femenino', 'Distribuidora Andina S.A.S.', 'Comercial', true, md5(random()::text || clock_timestamp())) returning id into j5;
  insert into rr_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, organizacion, area, acepta_datos, token_hash) values (rr, q2, 'Mateo', 'Galeano Ríos', 'Asesor de ventas', false, 'masculino', 'Distribuidora Andina S.A.S.', 'Comercial', true, md5(random()::text || clock_timestamp())) returning id into j6;
  insert into rr_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, organizacion, area, acepta_datos, token_hash) values (rr, q3, 'Paula', 'Gómez Arias', 'Jefe de compras', true, 'femenino', 'Distribuidora Andina S.A.S.', 'Compras', true, md5(random()::text || clock_timestamp())) returning id into j7;
  insert into rr_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, organizacion, area, acepta_datos, token_hash) values (rr, q3, 'Esteban', 'Londoño Vera', 'Almacenista', false, 'masculino', 'Distribuidora Andina S.A.S.', 'Compras', true, md5(random()::text || clock_timestamp())) returning id into j8;
  insert into rr_jugadores (sesion_id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, organizacion, area, acepta_datos, token_hash) values (rr, q3, 'Lina', 'Acosta Prado', 'Auxiliar contable', false, 'femenino', 'Distribuidora Andina S.A.S.', 'Contabilidad', true, md5(random()::text || clock_timestamp())) returning id into j9;

  insert into rr_intentos (sesion_id, equipo_id, reto, jugador_id, inicio, fin, respuestas, aciertos, errores, puntos, resumen) values
    (rr, q1, 1, j1, '2026-09-24 08:05-05', '2026-09-24 08:38-05', '{"marcas":{"s1":["a","b","c","d"],"s2":["a","c","d"],"s4":["c","d","e"]},"nada":{"s3":true}}', 11, 0, 110, '{"comp":{"detectar":[110,120]},"senales":{"perfil":[2,2],"reciente":[2,2],"tercero":[1,1],"precio":[1,1],"urgencia":[0,1],"exterior":[2,2],"efectivo":[2,2]},"ignoradas":0,"sinInformacion":0,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":["Reto 1: se escapó «Anticipo del 100 %»"]}'),
    (rr, q1, 2, j2, '2026-09-24 09:05-05', '2026-09-24 09:38-05', '{"pedidas":["beneficiario","origen","financiera","soportes","listas"],"decision":"escalar"}', 6, 0, 95, '{"comp":{"conocer":[75,75],"actuar":[20,20]},"senales":{},"ignoradas":0,"sinInformacion":0,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":[]}'),
    (rr, q1, 3, j3, '2026-09-24 10:05-05', '2026-09-24 10:38-05', '{"marcados":["marta","julian","pedro","lucia","alvaro"],"decision":"escalar"}', 6, 0, 110, '{"comp":{"conocer":[75,75],"actuar":[35,35]},"senales":{"beneficiario":[1,1]},"ignoradas":0,"sinInformacion":0,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":[]}'),
    (rr, q1, 4, j1, '2026-09-24 11:05-05', '2026-09-24 11:38-05', '{"ruta":["m1","m2","m3"],"marcas":{"m1":"raro","m2":"raro","m3":"raro","m4":"ok"},"preguntas":{"entrega":"b","recibe":"c","porque":"a","bf":"b"}}', 9, 0, 100, '{"comp":{"trazar":[85,85],"conocer":[15,15]},"senales":{"tercero":[2,2],"exterior":[1,1]},"ignoradas":0,"sinInformacion":0,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":[]}'),
    (rr, q1, 5, j2, '2026-09-24 12:05-05', '2026-09-24 12:38-05', '{"colores":{"o1":"verde","o2":"amarillo","o3":"amarillo","o4":"rojo","o5":"rojo","o6":"verde"},"razones":{"o1":"a","o2":"a","o3":"a","o4":"a","o5":"b","o6":"c"}}', 5, 1, 140, '{"comp":{"analizar":[140,150]},"senales":{"exterior":[1,1],"listas":[2,2],"efectivo":[1,1],"tercero":[1,1]},"ignoradas":0,"sinInformacion":0,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":["Reto 5: justificaron con una respuesta automática"]}'),
    (rr, q1, 6, j3, '2026-09-24 13:05-05', '2026-09-24 13:38-05', '{"elecciones":{"urgente":"c","favor":"b","tercero":"c","cambio":"c","perfecto":"c","curioso":"c"}}', 5, 1, 110, '{"comp":{"actuar":[125,140]},"senales":{},"ignoradas":0,"sinInformacion":1,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":["Reto 6: carta «El favor»"]}'),
    (rr, q1, 7, j1, '2026-09-24 14:05-05', '2026-09-24 14:38-05', '{"acciones":{"a1":"escalar","a2":"documentar","a3":"reportar","a4":"preguntar","a5":"reportar","a6":"reportar"}}', 5, 1, 110, '{"comp":{"actuar":[110,120]},"senales":{},"ignoradas":0,"sinInformacion":0,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":["Reto 7: «Un cliente antiguo hace 4 depósitos en efectivo de $9,5 mill…» pedía escalar"]}'),
    (rr, q1, 8, j2, '2026-09-24 15:05-05', '2026-09-24 15:38-05', '{"elecciones":{"f1":"b","f2":"a","f3":"b","f4":"a","f5":"b","f6":"b","f7":"b"}}', 7, 0, 130, '{"comp":{"detectar":[20,20],"conocer":[30,30],"trazar":[20,20],"analizar":[20,20],"actuar":[40,40]},"senales":{"perfil":[2,2],"reciente":[2,2],"tercero":[1,1]},"ignoradas":0,"sinInformacion":0,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":[]}'),
    (rr, q2, 1, j4, '2026-09-24 08:08-05', '2026-09-24 08:44-05', '{"marcas":{"s1":["a","b","d"],"s2":["a","b","c","f"],"s3":["a"],"s4":["c","d"]},"nada":{}}', 8, 2, 70, '{"comp":{"detectar":[75,120]},"senales":{"perfil":[1,2],"reciente":[1,2],"tercero":[1,1],"precio":[1,1],"urgencia":[1,1],"exterior":[1,2],"efectivo":[2,2]},"ignoradas":0,"sinInformacion":0,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":2,"fallos":["Reto 1: se escapó «Casi no hay información pública de ella»","Reto 1: se escapó «Su RUT dice «asesorías», no algodón»","Reto 1: se escapó «Consignado desde diferentes ciudades»"]}'),
    (rr, q2, 2, j5, '2026-09-24 09:08-05', '2026-09-24 09:44-05', '{"pedidas":["identidad","referencias","redes","financiera","tributaria"],"decision":"mitad"}', 4, 2, 35, '{"comp":{"conocer":[60,75],"actuar":[0,20]},"senales":{},"ignoradas":0,"sinInformacion":1,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":["Reto 2: pidieron información que no corresponde («Fotos personales del representante en redes sociales»)","Reto 2: no pidieron «Beneficiario final»","Reto 2: no pidieron «Origen de los recursos»"]}'),
    (rr, q2, 3, j6, '2026-09-24 10:08-05', '2026-09-24 10:44-05', '{"marcados":["marta","julian","istmo","andres"],"decision":"buscar"}', 2, 3, 10, '{"comp":{"conocer":[20,75],"actuar":[0,35]},"senales":{"beneficiario":[0,1]},"ignoradas":0,"sinInformacion":0,"confidencial":0,"porCuentaPropia":1,"falsasAlarmas":2,"fallos":["Reto 3: marcaron a Inversiones del Istmo Corp. como beneficiario final","Reto 3: no identificaron a Pedro Lema como beneficiario final","Reto 3: no identificaron a Lucía Varón como beneficiario final","Reto 3: marcaron a Andrés Ruiz como beneficiario final","Reto 3: no identificaron a Álvaro Quiroga como beneficiario final"]}'),
    (rr, q2, 4, j4, '2026-09-24 11:08-05', '2026-09-24 11:44-05', '{"ruta":["m1","m2","m4"],"marcas":{"m1":"raro","m2":"ok","m3":"raro","m4":"ok"},"preguntas":{"entrega":"b","recibe":"c","porque":"a","bf":"a"}}', 6, 3, 40, '{"comp":{"trazar":[40,85],"conocer":[0,15]},"senales":{"tercero":[1,2],"exterior":[1,1]},"ignoradas":1,"sinInformacion":0,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":["Reto 4: no reconstruyeron bien el recorrido del dinero","Reto 4: pasaron por alto «🏢 Textiles Horizonte → 🤝 Servicios Brava Ltda.»","Reto 4: ¿A quién hay que identificar como beneficiario final para entender la operación?"]}'),
    (rr, q2, 5, j5, '2026-09-24 12:08-05', '2026-09-24 12:44-05', '{"colores":{"o1":"verde","o2":"verde","o3":"rojo","o4":"rojo","o5":"rojo","o6":"verde"},"razones":{"o1":"a","o2":"a","o3":"b","o4":"a","o5":"a","o6":"b"}}', 3, 3, 90, '{"comp":{"analizar":[95,150]},"senales":{"exterior":[0,1],"listas":[2,2],"efectivo":[1,1],"tercero":[1,1]},"ignoradas":1,"sinInformacion":0,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":["Reto 5: pusieron en verde una operación amarillo","Reto 5: justificaron con una respuesta automática","Reto 5: justificaron con una respuesta automática"]}'),
    (rr, q2, 6, j6, '2026-09-24 13:08-05', '2026-09-24 13:44-05', '{"elecciones":{"urgente":"b","favor":"c","tercero":"c","cambio":"c","perfecto":"c","curioso":"b"}}', 4, 2, 65, '{"comp":{"actuar":[110,140]},"senales":{},"ignoradas":0,"sinInformacion":1,"confidencial":1,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":["Reto 6: carta «El cliente urgente»","Reto 6: carta «El curioso»"]}'),
    (rr, q2, 7, j4, '2026-09-24 14:08-05', '2026-09-24 14:44-05', '{"acciones":{"a1":"escalar","a2":"escalar","a3":"reportar","a4":"investigar","a5":"reportar","a6":"escalar"}}', 4, 2, 90, '{"comp":{"actuar":[100,120]},"senales":{},"ignoradas":0,"sinInformacion":0,"confidencial":0,"porCuentaPropia":1,"falsasAlarmas":0,"fallos":["Reto 7: «Un cliente cambia la dirección de entrega a otra ciudad porq…» pedía documentar","Reto 7: «El proveedor envía la factura con un NIT que no coincide con…» pedía preguntar"]}'),
    (rr, q2, 8, j5, '2026-09-24 15:08-05', '2026-09-24 15:44-05', '{"elecciones":{"f1":"b","f2":"a","f3":"b","f4":"a","f5":"c","f6":"b","f7":"c"}}', 5, 2, 95, '{"comp":{"detectar":[20,20],"conocer":[30,30],"trazar":[20,20],"analizar":[10,20],"actuar":[30,40]},"senales":{"perfil":[2,2],"reciente":[2,2],"tercero":[1,1]},"ignoradas":0,"sinInformacion":1,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":["Caso final: «El semáforo»","Caso final: «La llamada»"]}'),
    (rr, q3, 1, j7, '2026-09-24 08:12-05', '2026-09-24 08:52-05', '{"marcas":{"s1":["a","c","d"],"s2":["c","d"],"s4":["a","c"]},"nada":{"s3":true}}', 7, 1, 65, '{"comp":{"detectar":[65,120]},"senales":{"perfil":[2,2],"reciente":[1,2],"tercero":[1,1],"precio":[0,1],"urgencia":[0,1],"exterior":[1,2],"efectivo":[1,2]},"ignoradas":0,"sinInformacion":0,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":1,"fallos":["Reto 1: se escapó «La empresa fue creada hace poco»","Reto 1: se escapó «Precios 30 % por debajo del mercado»","Reto 1: se escapó «Anticipo del 100 %»","Reto 1: se escapó «Dividido en consignaciones de $9 millones»","Reto 1: se escapó «Consignado desde diferentes ciudades»"]}'),
    (rr, q3, 2, j8, '2026-09-24 09:12-05', '2026-09-24 09:52-05', '{"pedidas":["beneficiario","identidad","clave","origen"],"decision":"aprobar"}', 3, 2, 20, '{"comp":{"conocer":[45,75],"actuar":[0,20]},"senales":{},"ignoradas":0,"sinInformacion":1,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":["Reto 2: pidieron información que no corresponde («La clave de su banca en línea para ver el saldo»)","Reto 2: no pidieron «Información financiera»"]}'),
    (rr, q3, 3, j9, '2026-09-24 10:12-05', '2026-09-24 10:52-05', '{"marcados":["marta","julian"],"decision":"seguir"}', 2, 1, 10, '{"comp":{"conocer":[30,75],"actuar":[0,35]},"senales":{"beneficiario":[0,1]},"ignoradas":1,"sinInformacion":0,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":["Reto 3: no identificaron a Pedro Lema como beneficiario final","Reto 3: no identificaron a Lucía Varón como beneficiario final","Reto 3: no identificaron a Álvaro Quiroga como beneficiario final"]}'),
    (rr, q3, 4, j7, '2026-09-24 11:12-05', '2026-09-24 11:52-05', '{"ruta":["m2","m1","m3"],"marcas":{"m1":"ok","m2":"raro","m3":"raro","m4":"ok"},"preguntas":{"entrega":"a","recibe":"c","porque":"a","bf":"b"}}', 6, 3, 45, '{"comp":{"trazar":[30,85],"conocer":[15,15]},"senales":{"tercero":[1,2],"exterior":[1,1]},"ignoradas":1,"sinInformacion":0,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":["Reto 4: no reconstruyeron bien el recorrido del dinero","Reto 4: pasaron por alto «🏦 Inversiones Omega S.A.S. → 🏢 Textiles Horizonte»","Reto 4: ¿Quién entrega realmente el dinero de la venta?"]}'),
    (rr, q3, 5, j8, '2026-09-24 12:12-05', '2026-09-24 12:52-05', '{"colores":{"o1":"verde","o2":"amarillo","o3":"amarillo","o4":"amarillo","o5":"amarillo","o6":"verde"},"razones":{"o1":"b","o2":"a","o3":"a","o4":"b","o5":"b","o6":"b"}}', 3, 3, 105, '{"comp":{"analizar":[105,150]},"senales":{"exterior":[1,1],"listas":[2,2],"efectivo":[1,1],"tercero":[1,1]},"ignoradas":0,"sinInformacion":0,"confidencial":0,"porCuentaPropia":0,"falsasAlarmas":0,"fallos":["Reto 5: justificaron con una respuesta automática","Reto 5: eligieron una razón equivocada"]}');

  -- ==========================================================================
  -- 3. Dos recomendaciones del informe ya llegaron al plan de acción
  -- ==========================================================================
  insert into pc_acciones (proceso_id, titulo, detalle, responsable, fecha_compromiso, estado, origen, origen_id, origen_ref) values
    (pc, 'Reforzar la reserva de la información (1 vez se compartió información reservada en el juego)',
     'Recordar que no se le cuenta a la contraparte ni a otros compañeros que una operación se está analizando o se reportó. Incluir frases modelo para responder al cliente sin revelar nada.',
     'Catalina Duarte', '2026-10-15', 'en_curso', 'riesgo', rr, rr || ':rr-reserva'),
    (pc, 'Nadie ignora una alerta: 4 alertas fueron ignoradas en el juego',
     'Dejar claro que ante cualquier señal lo mínimo es documentar y consultar con la Oficial de Cumplimiento. Publicar la ruta de escalamiento de una página en Comercial y Compras.',
     'Julián Pineda', '2026-10-31', 'pendiente', 'riesgo', rr, rr || ':rr-ignorar');

  raise notice 'Demo RIES26 creada. Dueña: %', coalesce((select email from auth.users where id = v_dueno), 'NINGUNA (solo la ven los administradores)');
end $$;
