# AndMesApps

Aplicativo independiente (NO es parte de Espiral de Crecimiento ni de FlowAndo): su propio GitHub,
Supabase, Vercel y navegador, todos con la cuenta **andreamesiasapps@gmail.com**. Nunca uses aquí las
cuentas `gh` de Flowando360, DianaSaidIndunnova u otras: el repo se configura solo con la cuenta nueva.

Primer módulo: **Cacería Makigami por equipos** (`/makigami`), derivado del juego de Espiral pero sin
empresa ni colaboradores: los jugadores se inscriben solos con un código de 6 caracteres.

## Stack
- Next.js 15 (App Router, `params`/`cookies()` asíncronos) + React 19 + Tailwind 3 + Supabase.
- Todo el acceso a datos va por el servidor con `db()` (service_role) en `src/lib/supabase/server.ts`.
  Las tablas `mk_*` tienen RLS activo **sin políticas**: el navegador nunca las consulta directo.
  Por eso cada server action valida primero quién llama (`getFacilitador()` o `getJugador(retoId)`).
- Facilitador = usuario de Supabase Auth cuyo correo está en `ADMIN_EMAILS`. Se crea a mano en
  Supabase → Authentication → Users (no hay registro público de facilitadores).
- Jugador = token aleatorio en una cookie httpOnly por reto (`mk_<retoId sin guiones>`); en la base
  solo se guarda su hash (`mk_jugadores.token_hash`). Ver `src/lib/jugador.ts`.
- Los puntos no se guardan: se calculan en vivo (`calcularPuntos` en `src/lib/makigami.ts`).

## Base de datos
- Migraciones en `supabase/migrations/`, siempre idempotentes (`if not exists`, `do $$ ... exception`).
- No las corro yo: el usuario las pega en Supabase → SQL Editor y las ejecuta.

## Estilo
- Interfaz y textos en español (Colombia), lenguaje sencillo. Debe verse bien en celular (390 px).
- Colores de marca en `tailwind.config.ts`: `marca` (turquesa), `secundario` (índigo), `acento` (ámbar),
  `bg-degradado`.
