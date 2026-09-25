-- ============================================================================
-- 0008_mudalab.sql
-- AndMesApps · MUDALAB — La misión de recuperar el flujo.
--
-- Juego de detectives por equipos con la estructura DMAIC:
--   1 Definir · 2 Medir (Gemba con fichas de investigación y las 8 Mudas)
--   3 Analizar (5 porqués e Ishikawa) · 4 Mejorar (laboratorio con
--   presupuesto y simulación) · 5 Controlar (la Muda regresa)
--   y el Mundo 2 «Mi proceso»: cada persona registra una Muda real en el
--   Banco de oportunidades (con votos).
--
-- Seguridad: RLS activo sin políticas. Solo el servidor lee y escribe.
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================================

create table if not exists ml_sesiones (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  titulo text not null,
  descripcion text,
  caso text not null default 'compras',
  estado text not null default 'preparacion',
  mision_actual int not null default 0,
  registro_abierto boolean not null default true,
  creado_por uuid references auth.users(id) on delete set null,
  proceso_id uuid references pc_procesos(id) on delete set null,
  cerrado_en timestamptz,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table ml_sesiones add constraint ml_sesiones_estado_check check (estado in ('preparacion', 'jugando', 'cerrado'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table ml_sesiones add constraint ml_sesiones_mision_check check (mision_actual between 0 and 6);
exception when duplicate_object then null; end $$;

comment on column ml_sesiones.mision_actual is '0 = preparación, 1 a 5 = DMAIC, 6 = Mundo 2 «Mi proceso».';

create table if not exists ml_equipos (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references ml_sesiones(id) on delete cascade,
  nombre text not null,
  emoji text not null default '🦊',
  created_at timestamptz not null default now()
);

create unique index if not exists uq_ml_equipos_nombre on ml_equipos (sesion_id, lower(nombre));

create table if not exists ml_jugadores (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references ml_sesiones(id) on delete cascade,
  equipo_id uuid not null references ml_equipos(id) on delete restrict,
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
  alter table ml_jugadores add constraint ml_jugadores_sexo_check check (sexo in ('femenino', 'masculino', 'otro', 'prefiero_no_decir'));
exception when duplicate_object then null; end $$;

create table if not exists ml_intentos (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references ml_sesiones(id) on delete cascade,
  equipo_id uuid not null references ml_equipos(id) on delete cascade,
  mision int not null,
  jugador_id uuid references ml_jugadores(id) on delete set null,
  inicio timestamptz not null default now(),
  fin timestamptz,
  respuestas jsonb not null default '{}',
  aciertos int not null default 0,
  errores int not null default 0,
  puntos int not null default 0,
  resumen jsonb not null default '{}',
  unique (equipo_id, mision)
);

do $$ begin
  alter table ml_intentos add constraint ml_intentos_mision_check check (mision between 1 and 5);
exception when duplicate_object then null; end $$;

comment on column ml_intentos.resumen is 'Resultado calculado (mudas encontradas, días logrados, defectos, sostenibilidad…) para el tablero.';

create table if not exists ml_oportunidades (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references ml_sesiones(id) on delete cascade,
  equipo_id uuid not null references ml_equipos(id) on delete cascade,
  jugador_id uuid references ml_jugadores(id) on delete set null,
  proceso text not null,
  problema text not null,
  muda text not null,
  evidencia text,
  causa text,
  idea text,
  estado text not null default 'idea',
  resultado text,
  minutos_semana numeric,
  votos uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

do $$ begin
  alter table ml_oportunidades add constraint ml_oportunidades_estado_check check (estado in ('idea', 'probando', 'implementada'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table ml_oportunidades add constraint ml_oportunidades_muda_check
    check (muda in ('transporte', 'inventario', 'movimiento', 'espera', 'sobreproduccion', 'sobreprocesamiento', 'defectos', 'talento'));
exception when duplicate_object then null; end $$;

comment on table ml_oportunidades is 'Banco de oportunidades: Mudas reales que registran las personas en su propio trabajo.';

create index if not exists idx_ml_sesiones_creado_por on ml_sesiones(creado_por);
create index if not exists idx_ml_sesiones_proceso on ml_sesiones(proceso_id);
create index if not exists idx_ml_equipos_sesion on ml_equipos(sesion_id);
create index if not exists idx_ml_jugadores_sesion on ml_jugadores(sesion_id);
create index if not exists idx_ml_intentos_sesion on ml_intentos(sesion_id);
create index if not exists idx_ml_oportunidades_sesion on ml_oportunidades(sesion_id);

-- Las mejoras de MUDALAB también llegan al plan de acción de los procesos.
alter table pc_acciones drop constraint if exists pc_acciones_origen_check;
alter table pc_acciones add constraint pc_acciones_origen_check check (origen in ('manual', 'makigami', 'kaizen', 'cincos', 'mudalab', 'informe'));

alter table ml_sesiones enable row level security;
alter table ml_equipos enable row level security;
alter table ml_jugadores enable row level security;
alter table ml_intentos enable row level security;
alter table ml_oportunidades enable row level security;
