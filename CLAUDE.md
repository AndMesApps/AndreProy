# AndMesApps

Aplicativo independiente (NO es parte de Espiral de Crecimiento ni de FlowAndo): su propio GitHub,
Supabase, Vercel y navegador, todos con la cuenta **andreamesiasapps@gmail.com**. Nunca uses aquí las
cuentas `gh` de Flowando360, DianaSaidIndunnova u otras: el repo se configura solo con la cuenta nueva.

Plataforma de mejora continua para la consultora (Andrea, ingeniera industrial). Organización:
**juegos** para diagnosticar y entrenar + **control de procesos** para sostener, unidos por la "mejora"
(lo que sale de un juego llega al plan de acción de un proceso).

- `/panel` — "súper menú" del facilitador: juegos abiertos para compartir (código, enlace, WhatsApp, QR),
  procesos con semáforo y acciones vencidas, informes recientes, administración. Tras ingresar se llega aquí.
- `/makigami` — **Cacería Makigami** (diagnosticar): mapeo → cacería → rediseño → resultados.
- `/kaizen` — **Carrera Kaizen** (mejorar, modo taller): rondas cronometradas; ronda 1 = línea base
  (hacer, verificar); rondas 2..N = PDCA (planear con tarjeta Kaizen: problema, 5 porqués, idea,
  predicción → hacer → verificar → actuar: estándar o descartada). Lógica y puntos en `src/lib/kaizen.ts`.
- `/proyectos` — **Proyectos de consultoría**, con identidad propia (NO usar términos de un programa
  en particular como PT1/PT2/contrapartida/gestora: hablar de plan de trabajo, cronograma, seguimientos,
  aporte o cofinanciación, supervisor externo). Ficha, cronograma con Gantt y estados del Excel (plantillas + seguimientos
  mensuales al día hábil N), objetivos y KPIs, bitácora (horas y días sin intervenir), horas y pagos,
  riesgos (matriz), documentos, procesos unidos (`pc_procesos.proyecto_id`). Salud = avance vs. tiempo;
  resumen ejecutivo y alertas automáticas (`src/lib/proyectos.ts`); portafolio con hoja de ruta y agenda;
  informe de avance imprimible (`?finanzas=0` lo oculta). Registros genéricos: `ENTIDADES` define los
  campos y `guardarRegistro` valida; el formulario sale solo (`components/proyectos/registro.tsx`).
- `/finanzas` — **Mis finanzas** (consultora independiente en Colombia): parámetros editables
  (`fn_parametros`: salario mínimo, UVT, % IBC, salud, pensión, ARL, retenciones, provisión de renta,
  4x1000, meta y margen objetivo), proyección mes a mes con la planilla PILA consolidada (IBC 40 %,
  mín 1 / máx 25 SMMLV, FSP desde 4 SMMLV) y rentabilidad por proyecto. En cada proyecto, pestaña
  💰 Finanzas: modelo de cobro (valor fijo, por horas, mixto), IVA, retenciones, aliado, viáticos,
  requisitos de cobro, presupuesto por categoría (`pr_presupuesto`), movimientos (`pr_pagos` con tipo
  viatico). Cálculos puros en `src/lib/finanzas.ts`. Valores de ley 2026 = referencia a confirmar.
- `/cincos` — **Reto 5S — Del caos al flujo** (tablas `s5_*`): misiones 1-5 simuladas (escenarios oficina y
  taller en `src/lib/cincos.ts`: contenido, roles que rotan, `puntuar` en el servidor con el tiempo real) y misión
  6 real (auditoría 0-4 por S antes/después = % 5S, evidencias por enlace, validación de la facilitadora). Las
  misiones se conectan: la 5 usa el orden que el equipo dejó en la 2. Informe con `recomendaciones5S`.
- `/mudalab` — **MudaLab — La misión de recuperar el flujo** (tablas `ml_*`): agencias de detectives con el
  expediente #047 «La compra que tardaba 5 días» (12 pasos reales vs 5 del manual, 8 Mudas escondidas).
  Misiones DMAIC 1-5 (Definir, Gemba con 8 fichas y lentes 📄📊👀, 5 porqués con trampas de culpa + Ishikawa,
  laboratorio $500.000/3 personas/1 semana con hasta 3 experimentos, Controlar con deriva de 12 semanas) y
  6 = Mundo 2 «Mi proceso» (`ml_oportunidades`, votos = uuid[] de jugadores). Todo en `src/lib/mudalab.ts`
  (`puntuar` en servidor guarda `resumen` jsonb; la misión 5 usa el plan de la 4; `marcadorMl` = madurez 1-8 e
  insignias; `recomendacionesMl` incluye las oportunidades más votadas con ref `ml-op-<id>`).
- `/riesgo` — **La Ruta del Riesgo** (SAGRILAFT/SARLAFT, tablas `rr_*`): empresa inventada Textiles Horizonte;
  8 retos (señales, contraparte con 5 fichas, beneficiario final con estructura de propiedad, sigue el dinero,
  semáforo con razón, cartas de evento, escalar, caso final). Cada sesión guarda la ruta de la empresa (`marco`,
  `responsable`, `canal`, `umbral`) y los textos usan `{responsable}`/`{canal}` (`conRuta`). Puntos de la tabla del
  documento base; `puntuar` en servidor guarda `resumen` (competencias, señales, ignoradas, confidencial, fallos).
  `marcadorRr` = 5 competencias, perfiles y certificación «Guardián del Riesgo»; informe «Cierre y evaluación» y
  `/riesgo/[id]/certificados`. Todo en `src/lib/riesgo.ts`. Demo aparte: `supabase/demo/ruta_riesgo.sql` (RIES26).
- `/juegos` agrupa los cinco juegos.
- Menú (`src/components/menu-principal.tsx`, cliente): 🧭 Mi panel · 💼 Consultoría (Proyectos, Control de
  procesos, Mis finanzas) · 🎲 Juegos · ❓ Ayuda · menú de la persona (rol, Usuarios, Salir). En computador
  (lg+) son desplegables; en tablet/celular un botón ☰ abre una pantalla con los grupos. El encabezado NO
  lleva `backdrop-blur` (rompería el `fixed` del menú del celular).
- `/ayuda` tiene buscador (`components/manual/buscador.tsx`): marca `data-seccion`/`data-sub` en `piezas.tsx`.
- Tablero Kanban reutilizable (`src/components/kanban.tsx`): cronograma del proyecto (Gantt | Tabla |
  Tablero), plan de acción de procesos y portafolio de proyectos (`?vista=tablero`).
- `/procesos` — **Control de procesos**: proceso con indicador (línea base, meta, sentido bajar/subir),
  mediciones, plan de acción (`pc_acciones`) y juegos unidos (`proceso_id` en `mk_retos`/`kz_sesiones`).
- Informes imprimibles (PDF desde el navegador) con opciones de mejora automáticas:
  `/makigami/[id]/informe`, `/kaizen/[id]/informe`, y la página del proceso. Reglas en
  `src/lib/recomendaciones.ts` (juegos) y `src/lib/procesos.ts` (procesos). "Enviar al plan" = `enviarAlPlan`.
- Motor común de juegos: `src/lib/juego.ts` (inscripción, CSV), `src/lib/jugador.ts` (cookie por sesión,
  `getJugador(id, 'makigami' | 'kaizen')`, `generarCodigo`), `src/components/juego/*` (inscripción,
  panel de equipos, campo de código) y `src/lib/compartir.ts` (enlace + QR). Un juego nuevo = tablas
  propias `xx_*` + sus actions, reusando estas piezas.

## Cuentas y conexiones

| Servicio | Dónde | Cuenta |
|---|---|---|
| GitHub | repo `AndMesApps/AndreProy` (rama `main`) | usuario `AndMesApps` |
| Vercel | equipo `andmesapps`, proyecto `andre-proy` → https://andre-proy.vercel.app | andreamesiasapps@gmail.com |
| Supabase | el proyecto cuya URL está en la variable `SUPABASE_URL` de Vercel | andreamesiasapps@gmail.com |
| Navegador | Chrome con la sesión de andreamesiasapps (es el que usa Claude in Chrome) | andreamesiasapps@gmail.com |

- **GitHub CLI:** en este PC `gh` tiene varias cuentas (AndMesApps, Flowando360, DianaSaidIndunnova…).
  Antes de cualquier comando `gh` corre `gh auth status`; si la activa no es `AndMesApps`, corre
  `gh auth switch --user AndMesApps`. `git push` funciona sin `gh` (credencial guardada en Windows).
- **Despliegue:** cada `git push` a `main` despliega solo en Vercel (producción). No hay Vercel CLI.
  Para confirmar que salió, consulta la URL pública con `curl` o mira Deployments en el navegador.
- **Variables de entorno** (Vercel, sin prefijo `NEXT_PUBLIC_`, marcadas como sensibles: no se pueden
  leer en el panel): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`.
  Tras cambiar una variable hay que hacer **Redeploy**. Nunca escribas claves tú: la usuaria las pega.
- **Local:** no hay `.env.local`, así que `npm run dev` no conecta a Supabase. Verifica con
  `npm run typecheck` y `npm run build` (con variables de mentira:
  `SUPABASE_URL=https://x.supabase.co SUPABASE_ANON_KEY=x SUPABASE_SERVICE_ROLE_KEY=x npm run build`),
  y luego en producción tras desplegar.
- **Probar SQL:** Docker no está encendido en este PC. Para probar migraciones o scripts antes de
  pasárselos a la usuaria, usa PGlite en Node (`@electric-sql/pglite` en el scratchpad) con un esquema
  `auth.users` de mentira.

## Forma de trabajar
- Al terminar cada cambio: `typecheck` + `build`, commit y push a `main` (autorización permanente),
  y confirmar que el despliegue salió.
- Mensajes de commit en español.
- Explicaciones a la usuaria en español sencillo, paso a paso, sin jerga.

## Stack
- Next.js 15 (App Router, `params`/`cookies()` asíncronos) + React 19 + Tailwind 3 + Supabase.
- Todo el acceso a datos va por el servidor con `db()` (service_role) en `src/lib/supabase/server.ts`.
  Las tablas `mk_*` tienen RLS activo **sin políticas**: el navegador nunca las consulta directo.
  Por eso cada server action valida primero quién llama (`getFacilitador()` o `getJugador(retoId)`).
- Tres roles. "Facilitador" (`getFacilitador()` en `src/lib/auth.ts`) = Administrador o Líder:
  - **admin**: todo; gestiona cuentas en `/usuarios`. Son admin los correos de `ADMIN_EMAILS` (fijos, no se
    editan en la app) y las filas `mk_usuarios` con rol `admin`.
  - **lider**: fila activa en `mk_usuarios` con rol `lider`; crea retos y administra solo los suyos
    (`mk_retos.creado_por`). Todo permiso sobre un reto pasa por `puedeAdministrarReto()`.
  - **jugador**: sin cuenta (cookie por reto, abajo).
  Las cuentas las crea el admin en `/usuarios` (`auth.admin.createUser`, sin registro público). Desactivar
  una cuenta la marca `activo=false` y además la bloquea (ban) en Supabase Auth.
- Jugador = token aleatorio en una cookie httpOnly por reto (`mk_<retoId sin guiones>`); en la base
  solo se guarda su hash (`mk_jugadores.token_hash`). Ver `src/lib/jugador.ts`.
- Los puntos no se guardan: se calculan en vivo (`calcularPuntos` en `src/lib/makigami.ts`,
  `calcularMarcador` en `src/lib/kaizen.ts`).
- Tablas: `mk_*` (Makigami y usuarios), `kz_*` (Kaizen), `pc_*` (procesos), `pr_*` (proyectos), `fn_*` (finanzas), `s5_*` (Reto 5S), `ml_*` (MudaLab), `rr_*` (Ruta del Riesgo). Todas con RLS sin políticas.

## Base de datos
- Migraciones en `supabase/migrations/`, siempre idempotentes (`if not exists`, `do $$ ... exception`).
- No las corro yo: el usuario las pega en Supabase → SQL Editor y las ejecuta.
- `supabase/demo/reto_papeleria.sql`: reto de demostración (código `CAZA26`, compra de papelería,
  12.4 → 6.4 días, 2 equipos inventados, estado cerrado). Se puede correr varias veces.
- `supabase/demo/demo_completo.sql` (después del anterior): historia completa de «Distribuidora Andina
  S.A.S.» → proyecto con todo → procesos → CAZA26 + Carrera Kaizen `KAIZ26` → plan de acción; más 3
  proyectos para el portafolio. Todo con grupo «Demostración» (se borra y recrea al correrlo).

## Estado (al 2026-09-24)
- Hecho: app desplegada; 3 roles con pantalla Usuarios; reto demo; detalle del paso con botón de cerrar.
- Hecho (2026-09-24): Carrera Kaizen, Control de procesos, Mi panel, informes con opciones de mejora.
- Migraciones 0001–0004 corridas en Supabase (confirmado 2026-09-24). Probado en producción con sesión de
  administradora: Carrera Kaizen completa (3 rondas, 2 equipos), informe, envío al plan y proceso.
  Los datos de prueba se borraron.
- Migraciones 0001–0008 y demo_completo.sql corridas (confirmado 2026-09-24). MudaLab MUDA26 verificado en producción (informe, puntajes, Banco, envío al plan). Revisión responsive por iframes a 390/768/1366 px: sin desbordes.
- 0009_riesgo.sql corrida (2026-09-25). **Pendiente:** la usuaria debe correr `demo/ruta_riesgo.sql` (RIES26).
- Usuarios: cada facilitador escribe su nombre en /panel (`cambiarMiNombre`); en /usuarios se crean,
  editan (nombre, rol, activo) y retiran (`retirarUsuario` borra la cuenta de Auth) cuentas.
- Probar jugadores sin navegador: POST a la página con cabecera `Next-Action: <id>` (el id sale del HTML
  o de los chunks JS) y cuerpo JSON con los argumentos; cada jugador con su propio archivo de cookies.
- Ideas siguientes: modo "proceso real" de Kaizen (rondas = semanas), más juegos (5S digital, SMED,
  5 porqués), plantilla de configuración por juego.

## Estilo
- Interfaz y textos en español (Colombia), lenguaje sencillo. Debe verse bien en celular (390 px).
- Colores de marca en `tailwind.config.ts`: `marca` (turquesa), `secundario` (índigo), `acento` (ámbar),
  `bg-degradado`.

## Actualizar Control_Intervencion_Diaria.xlsx ("Actualiza Memoria")

Cuando el usuario diga **"Actualiza Memoria"** (o "actualiza memoria") en esta sesión, además de
guardar la memoria de la sesión como normalmente lo harías (y de actualizar la sección "Estado" de
este archivo si cambió algo importante):

1. Resume en 1-2 líneas qué se hizo en la sesión (será la "Actividad realizada").
2. Define el "Estado tras la intervención": uno de "Al día", "Pendiente", "Atrasado", "Pausado", "Finalizado".
3. Si aplica, define el "Próximo paso" (y opcionalmente una fecha para ese próximo paso).
4. Verifica que `C:\mis_apps\Control_Intervencion_Diaria.xlsx` no esté abierto en Excel (proceso
   `EXCEL` o archivo `~$Control_Intervencion_Diaria.xlsx` en `C:\mis_apps`; si lo está, pide al usuario
   que lo cierre y no sigas intentando en loop).
5. Ejecuta en terminal:

   ```
   node C:\mis_apps\excel-tools\log-intervencion.js --proyecto "Andrea Proyectos" --actividad "<resumen>" --estado "<estado>" --proximo "<próximo paso>"
   ```

   El nombre de proyecto de ESTA carpeta en la hoja "Proyectos" de Control_Intervencion_Diaria.xlsx es
   exactamente: **"Andrea Proyectos"** (no lo cambies ni lo traduzcas; no uses "Espiral de Crecimiento").

6. Inmediatamente después (SIEMPRE, no solo si algo se ve roto), ejecuta también:

   ```
   node C:\mis_apps\excel-tools\fix-proyectos-formulas.js
   ```

   Motivo: el usuario abre este archivo directamente en Excel entre sesiones, y eso termina pisando con
   valores fijos las fórmulas de la hoja "Proyectos" que traen "Última intervención" y "Qué queda
   pendiente" desde la Bitácora. Este script repara/reescribe esas fórmulas siempre; es idempotente.

Nunca edites ese xlsx directamente con ExcelJS ni otro script por tu cuenta: usa siempre
`log-intervencion.js` (valida el proyecto/estado, encuentra la fila libre, guarda y repara las
extensiones de Excel que ExcelJS rompe — ver `C:\mis_apps\excel-tools\fix-extlst.js`) y luego
`fix-proyectos-formulas.js`.
