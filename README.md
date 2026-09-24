# AndMesApps

Juegos y herramientas de formación en mejora continua.

## Cacería Makigami por equipos

1. El facilitador crea un reto y dibuja el proceso (carriles y pasos con tiempos).
2. Los jugadores entran con el código o el QR, eligen o crean su equipo y se registran.
3. En la cacería marcan los 8 desperdicios Lean en cada paso; en el rediseño proponen y votan mejoras.
4. Al cerrar se ve el antes vs. después del proceso y el ranking de equipos.

## Roles

- **Administrador**: ve y administra todos los retos y crea las cuentas en **Usuarios** (menú de arriba).
  Los correos de la variable `ADMIN_EMAILS` (Vercel) son administradores principales fijos.
- **Líder**: crea retos y administra solo los suyos (mapa, equipos, jugadores, fases).
- **Jugador**: sin cuenta; entra con el código del reto y solo juega.

Administradores y líderes entran por **"Soy facilitador"**.

## Configuración

1. Copia `.env.example` como `.env.local` y llena los valores de Supabase.
2. En Supabase → SQL Editor ejecuta, en orden, los archivos de `supabase/migrations/` (`0001_makigami.sql`, `0002_roles.sql`).
3. En Supabase → Authentication → Users crea el primer administrador (con "Auto confirm") y pon su correo en `ADMIN_EMAILS`.
   Las demás cuentas (administradores y líderes) se crean desde la app, en **Usuarios**.
4. `npm install` y `npm run dev`.
