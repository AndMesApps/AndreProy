-- ============================================================================
-- 0011_mudagami.sql
-- AndMesApps · MudaGami — Kayou: la ruta del transporte.
--
-- Versión digital del juego físico "Kayou" (de los materiales MudaGami de la
-- consultora): un equipo produce un lote de 15 piezas (5 triángulos, 5
-- cuadrados, 5 circunferencias) pasando por 6 estaciones fijas de una planta
-- (bodega de materia prima, corte recto, corte circular, perforado, pintura,
-- bodega de producto terminado). Cada vez que mueven materia prima, trabajo
-- en proceso o producto terminado entre dos estaciones que NO quedan una al
-- lado de la otra, deben usar el montacargas (hasta 3 artículos, 10 min,
-- 2000 pesos por viaje) o la carretilla (1 artículo, 5 min, sin costo): eso
-- es la muda de transporte que el juego mide con el "Formato de medición de
-- transportes" (Tabla 1) de los materiales originales.
--
-- Ciclo de un reto (columna estado):
--   espera     → el facilitador arma equipos; los jugadores se inscriben.
--   corrida_1  → línea base: el tablero trae el diseño de planta fijo.
--   rediseno   → 4 minutos por equipo para reorganizar su propio tablero.
--   corrida_2  → se repite la producción con el diseño de cada equipo.
--   cerrado    → resultados: traslados, tiempo y costo antes vs. después.
--
-- La materia prima real (tijeras, punzón, figuras de papel) es física: el
-- facilitador la reparte en el taller. La app mide y compara transportes,
-- exactamente el mismo rol que cumplía el formato de papel.
--
-- Seguridad: RLS activo y NINGUNA política. Solo el servidor (service_role)
-- accede. Idempotente: se puede correr más de una vez sin error.
-- ============================================================================

create table if not exists mg_retos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  titulo text not null,
  descripcion text,
  estado text not null default 'espera',
  registro_abierto boolean not null default true,
  duracion_corrida_seg int not null default 600,
  duracion_rediseno_seg int not null default 240,
  cronometro_inicio timestamptz,
  fecha_limite date,
  proceso_id uuid references pc_procesos(id) on delete set null,
  creado_por uuid references auth.users(id) on delete set null,
  cerrado_en timestamptz,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table mg_retos add constraint mg_retos_estado_check
    check (estado in ('espera', 'corrida_1', 'rediseno', 'corrida_2', 'cerrado'));
exception when duplicate_object then null; end $$;

comment on table mg_retos is 'MudaGami · Kayou: reto para medir y reducir la muda de transporte en una planta simulada, por equipos.';
comment on column mg_retos.cronometro_inicio is 'Inicio del cronómetro de la fase actual (corrida o rediseño); null = detenido. Es el mismo para todos los equipos.';

create table if not exists mg_equipos (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references mg_retos(id) on delete cascade,
  nombre text not null,
  emoji text not null default '🦊',
  created_at timestamptz not null default now()
);

create unique index if not exists uq_mg_equipos_nombre on mg_equipos (reto_id, lower(nombre));

create table if not exists mg_jugadores (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references mg_retos(id) on delete cascade,
  equipo_id uuid not null references mg_equipos(id) on delete restrict,
  nombres text not null,
  apellidos text not null,
  cargo text not null,
  es_lider boolean not null default false,
  sexo text not null,
  rango_edad text,
  organizacion text,
  area text,
  antiguedad text,
  email text,
  celular text,
  acepta_datos boolean not null default false,
  token_hash text not null unique,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table mg_jugadores add constraint mg_jugadores_sexo_check
    check (sexo in ('femenino', 'masculino', 'otro', 'prefiero_no_decir'));
exception when duplicate_object then null; end $$;

-- Diseño de planta de cada equipo para la corrida 2 (la corrida 1 usa el
-- diseño fijo inicial, igual para todos, definido en src/lib/mudagami.ts).
create table if not exists mg_layouts (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references mg_retos(id) on delete cascade,
  equipo_id uuid not null references mg_equipos(id) on delete cascade,
  corrida smallint not null,
  posiciones jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (equipo_id, corrida)
);

do $$ begin
  alter table mg_layouts add constraint mg_layouts_corrida_check check (corrida in (1, 2));
exception when duplicate_object then null; end $$;

comment on column mg_layouts.posiciones is 'Mapa espacio → estación, ej. {"A":"corte_circular","B":"perforado",...}.';

-- El "Formato de medición de transportes" (Tabla 1): cada fila es un viaje.
create table if not exists mg_traslados (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references mg_retos(id) on delete cascade,
  equipo_id uuid not null references mg_equipos(id) on delete cascade,
  corrida smallint not null,
  medio text not null,
  articulos smallint not null default 1,
  jugador_id uuid references mg_jugadores(id) on delete set null,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table mg_traslados add constraint mg_traslados_corrida_check check (corrida in (1, 2));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table mg_traslados add constraint mg_traslados_medio_check check (medio in ('montacargas', 'carretilla'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table mg_traslados add constraint mg_traslados_articulos_check check (articulos between 1 and 3);
exception when duplicate_object then null; end $$;

create index if not exists idx_mg_equipos_reto on mg_equipos(reto_id);
create index if not exists idx_mg_jugadores_reto on mg_jugadores(reto_id);
create index if not exists idx_mg_jugadores_equipo on mg_jugadores(equipo_id);
create index if not exists idx_mg_layouts_reto on mg_layouts(reto_id);
create index if not exists idx_mg_traslados_reto on mg_traslados(reto_id);
create index if not exists idx_mg_traslados_equipo on mg_traslados(equipo_id, corrida);

alter table mg_retos enable row level security;
alter table mg_equipos enable row level security;
alter table mg_jugadores enable row level security;
alter table mg_layouts enable row level security;
alter table mg_traslados enable row level security;

-- Permite que "Enviar al plan" (Control de procesos) reciba opciones de mejora de MudaGami.
alter table pc_acciones drop constraint if exists pc_acciones_origen_check;
alter table pc_acciones add constraint pc_acciones_origen_check
  check (origen in ('manual', 'makigami', 'kaizen', 'cincos', 'mudalab', 'riesgo', 'mudagami', 'informe'));
