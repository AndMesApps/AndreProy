# AndMesApps

Juegos y herramientas de formación en mejora continua.

## Cacería Makigami por equipos

1. El facilitador crea un reto y dibuja el proceso (carriles y pasos con tiempos).
2. Los jugadores entran con el código o el QR, eligen o crean su equipo y se registran.
3. En la cacería marcan los 8 desperdicios Lean en cada paso; en el rediseño proponen y votan mejoras.
4. Al cerrar se ve el antes vs. después del proceso y el ranking de equipos.

## Configuración

1. Copia `.env.example` como `.env.local` y llena los valores de Supabase.
2. En Supabase → SQL Editor ejecuta `supabase/migrations/0001_makigami.sql`.
3. En Supabase → Authentication → Users crea el usuario del facilitador (con "Auto confirm").
4. `npm install` y `npm run dev`.
