-- ============================================================================
-- 0007_cincos.sql
-- AndMesApps · Reto 5S — Del caos al flujo.
--
-- Juego por equipos en misiones que la facilitadora va abriendo:
--   1 Clasificar · 2 Ordenar · 3 Limpiar · 4 Estandarizar · 5 Sostener
--   (simulación con un escenario: oficina o taller) y 6 Misión real
--   (el equipo aplica las 5S a un espacio de su empresa, con auditoría
--   antes y después, evidencias y resultados).
--
--   s5_sesiones         → el reto (código, escenario, misión abierta).
--   s5_equipos/jugadores → como en los demás juegos.
--   s5_intentos         → la jugada de cada equipo en cada misión simulada
--                         (respuestas, aciertos, errores, puntos, tiempo).
--   s5_misiones_reales  → la misión real de cada equipo.
--
-- Seguridad: RLS activo sin políticas. Solo el servidor lee y escribe.
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================================

create table if not exists s5_sesiones (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  titulo text not null,
  descripcion text,
  escenario text not null default 'oficina',
  estado text not null default 'preparacion',
  mision_actual int not null default 0,
  registro_abierto boolean not null default true,
  creado_por uuid references auth.users(id) on delete set null,
  proceso_id uuid references pc_procesos(id) on delete set null,
  cerrado_en timestamptz,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table s5_sesiones add constraint s5_sesiones_estado_check check (estado in ('preparacion', 'jugando', 'cerrado'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table s5_sesiones add constraint s5_sesiones_mision_check check (mision_actual between 0 and 6);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table s5_sesiones add constraint s5_sesiones_escenario_check check (escenario in ('oficina', 'taller'));
exception when duplicate_object then null; end $$;

comment on column s5_sesiones.mision_actual is 'Hasta qué misión está abierta: 0 = preparación, 1 a 5 = las 5S simuladas, 6 = misión real.';

create table if not exists s5_equipos (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references s5_sesiones(id) on delete cascade,
  nombre text not null,
  emoji text not null default '🦊',
  created_at timestamptz not null default now()
);

create unique index if not exists uq_s5_equipos_nombre on s5_equipos (sesion_id, lower(nombre));

create table if not exists s5_jugadores (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references s5_sesiones(id) on delete cascade,
  equipo_id uuid not null references s5_equipos(id) on delete restrict,
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
  alter table s5_jugadores add constraint s5_jugadores_sexo_check check (sexo in ('femenino', 'masculino', 'otro', 'prefiero_no_decir'));
exception when duplicate_object then null; end $$;

create table if not exists s5_intentos (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references s5_sesiones(id) on delete cascade,
  equipo_id uuid not null references s5_equipos(id) on delete cascade,
  mision int not null,
  jugador_id uuid references s5_jugadores(id) on delete set null,
  inicio timestamptz not null default now(),
  fin timestamptz,
  respuestas jsonb not null default '{}',
  aciertos int not null default 0,
  errores int not null default 0,
  puntos int not null default 0,
  unique (equipo_id, mision)
);

do $$ begin
  alter table s5_intentos add constraint s5_intentos_mision_check check (mision between 1 and 5);
exception when duplicate_object then null; end $$;

comment on column s5_intentos.respuestas is 'Las decisiones del equipo en la misión (qué clasificó, dónde ubicó, qué anomalías marcó…).';

create table if not exists s5_misiones_reales (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references s5_sesiones(id) on delete cascade,
  equipo_id uuid not null unique references s5_equipos(id) on delete cascade,
  tipo_area text,
  area text,
  problema text,
  foto_antes text,
  foto_despues text,
  hallazgos jsonb not null default '{}',
  acciones jsonb not null default '{}',
  resultados jsonb not null default '{}',
  auditoria_antes jsonb not null default '{}',
  auditoria_despues jsonb not null default '{}',
  estado text not null default 'borrador',
  comentario text,
  puntos_bono int not null default 0,
  updated_at timestamptz not null default now()
);

do $$ begin
  alter table s5_misiones_reales add constraint s5_misiones_reales_estado_check check (estado in ('borrador', 'enviada', 'validada', 'corregir'));
exception when duplicate_object then null; end $$;

create index if not exists idx_s5_sesiones_creado_por on s5_sesiones(creado_por);
create index if not exists idx_s5_equipos_sesion on s5_equipos(sesion_id);
create index if not exists idx_s5_jugadores_sesion on s5_jugadores(sesion_id);
create index if not exists idx_s5_intentos_sesion on s5_intentos(sesion_id);
create index if not exists idx_s5_reales_sesion on s5_misiones_reales(sesion_id);

alter table s5_sesiones enable row level security;
alter table s5_equipos enable row level security;
alter table s5_jugadores enable row level security;
alter table s5_intentos enable row level security;
alter table s5_misiones_reales enable row level security;

-- Las mejoras del Reto 5S también llegan al plan de acción de los procesos.
alter table pc_acciones drop constraint if exists pc_acciones_origen_check;
alter table pc_acciones add constraint pc_acciones_origen_check check (origen in ('manual', 'makigami', 'kaizen', 'cincos', 'informe'));
create index if not exists idx_s5_sesiones_proceso on s5_sesiones(proceso_id);
