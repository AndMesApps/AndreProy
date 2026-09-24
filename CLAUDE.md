# AndMesApps

Aplicativo independiente (NO es parte de Espiral de Crecimiento ni de FlowAndo): su propio GitHub,
Supabase, Vercel y navegador, todos con la cuenta **andreamesiasapps@gmail.com**. Nunca uses aquí las
cuentas `gh` de Flowando360, DianaSaidIndunnova u otras: el repo se configura solo con la cuenta nueva.

Primer módulo: **Cacería Makigami por equipos** (`/makigami`), derivado del juego de Espiral pero sin
empresa ni colaboradores: los jugadores se inscriben solos con un código de 6 caracteres.

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
- Los puntos no se guardan: se calculan en vivo (`calcularPuntos` en `src/lib/makigami.ts`).

## Base de datos
- Migraciones en `supabase/migrations/`, siempre idempotentes (`if not exists`, `do $$ ... exception`).
- No las corro yo: el usuario las pega en Supabase → SQL Editor y las ejecuta.
- `supabase/demo/reto_papeleria.sql`: reto de demostración (código `CAZA26`, compra de papelería,
  12.4 → 6.4 días, 2 equipos inventados, estado cerrado). Se puede correr varias veces.

## Estado (al 2026-09-24)
- Hecho: app desplegada; 3 roles con pantalla Usuarios; reto demo; detalle del paso con botón de cerrar.
- Por confirmar con la usuaria al empezar: ¿ya corrió `0002_roles.sql` y `reto_papeleria.sql` en
  Supabase? ¿`ADMIN_EMAILS` tiene su correo exacto (como aparece en Supabase → Authentication → Users)
  y se hizo Redeploy? Los roles aún no se han probado con sesión iniciada.

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
