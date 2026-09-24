-- ============================================================================
-- 0001_makigami.sql
-- AndMesApps · Cacería Makigami por equipos.
--
-- Versión independiente del juego de Espiral de Crecimiento: aquí no hay
-- empresa ni colaboradores registrados. El facilitador (un correo listado en
-- ADMIN_EMAILS) crea un reto con un código; los jugadores entran con ese
-- código, eligen o crean su equipo y se registran con sus datos.
--
-- Ciclo de un reto (columna estado):
--   mapeo      → el facilitador dibuja el proceso actual (carriles y pasos).
--   caceria    → los jugadores "cazan" desperdicios Lean sobre los pasos.
--   rediseno   → se proponen mejoras, se votan y el facilitador aprueba.
--   cerrado    → resultados: tiempo antes vs. después y ranking final.
--
-- Seguridad: todas las tablas tienen RLS activo y NINGUNA política. Solo el
-- servidor (service_role, en las server actions) lee y escribe; el navegador
-- nunca consulta estas tablas directamente.
--
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================================

create table if not exists mk_retos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  titulo text not null,
  descripcion text,
  inicio_proceso text,
  fin_proceso text,
  estado text not null default 'mapeo',
  registro_abierto boolean not null default true,
  fecha_limite date,
  creado_por uuid references auth.users(id) on delete set null,
  cerrado_en timestamptz,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table mk_retos add constraint mk_retos_estado_check
    check (estado in ('mapeo', 'caceria', 'rediseno', 'cerrado'));
exception when duplicate_object then null; end $$;

comment on table mk_retos is 'Cacería Makigami: reto (sesión de juego) para mapear un proceso, cazar desperdicios Lean y rediseñarlo por equipos.';
comment on column mk_retos.codigo is 'Código corto que los jugadores escriben (o leen en el QR) para unirse al reto.';

create table if not exists mk_equipos (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references mk_retos(id) on delete cascade,
  nombre text not null,
  emoji text not null default '🦊',
  created_at timestamptz not null default now()
);

create unique index if not exists uq_mk_equipos_nombre on mk_equipos (reto_id, lower(nombre));

create table if not exists mk_jugadores (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references mk_retos(id) on delete cascade,
  equipo_id uuid not null references mk_equipos(id) on delete restrict,
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
  -- Hash SHA-256 del token que se guarda en la cookie del jugador (nunca el token en claro).
  token_hash text not null unique,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table mk_jugadores add constraint mk_jugadores_sexo_check
    check (sexo in ('femenino', 'masculino', 'otro', 'prefiero_no_decir'));
exception when duplicate_object then null; end $$;

comment on column mk_jugadores.es_lider is 'El jugador es el líder (capitán) de su equipo en el juego.';

create table if not exists mk_carriles (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references mk_retos(id) on delete cascade,
  nombre text not null,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists mk_pasos (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references mk_retos(id) on delete cascade,
  carril_id uuid not null references mk_carriles(id) on delete cascade,
  orden int not null default 0,
  descripcion text not null,
  tiempo_trabajo_min numeric not null default 0,
  tiempo_espera_min numeric not null default 0,
  documento_sistema text,
  clasificacion text,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table mk_pasos add constraint mk_pasos_clasificacion_check
    check (clasificacion is null or clasificacion in ('agrega_valor', 'necesaria', 'desperdicio'));
exception when duplicate_object then null; end $$;

create table if not exists mk_cazas (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references mk_retos(id) on delete cascade,
  paso_id uuid not null references mk_pasos(id) on delete cascade,
  jugador_id uuid not null references mk_jugadores(id) on delete cascade,
  tipo_desperdicio text not null,
  comentario text,
  created_at timestamptz not null default now(),
  unique (paso_id, jugador_id, tipo_desperdicio)
);

do $$ begin
  alter table mk_cazas add constraint mk_cazas_tipo_check
    check (tipo_desperdicio in ('esperas', 'traspasos', 'sobreprocesamiento', 'defectos', 'movimiento', 'inventario', 'sobreproduccion', 'talento'));
exception when duplicate_object then null; end $$;

create table if not exists mk_propuestas (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references mk_retos(id) on delete cascade,
  paso_id uuid references mk_pasos(id) on delete set null,
  jugador_id uuid not null references mk_jugadores(id) on delete cascade,
  accion text not null default 'simplificar',
  descripcion text not null,
  ahorro_estimado_min numeric not null default 0,
  estado text not null default 'propuesta',
  created_at timestamptz not null default now()
);

do $$ begin
  alter table mk_propuestas add constraint mk_propuestas_accion_check
    check (accion in ('eliminar', 'simplificar', 'automatizar', 'combinar', 'otro'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table mk_propuestas add constraint mk_propuestas_estado_check
    check (estado in ('propuesta', 'aprobada', 'descartada'));
exception when duplicate_object then null; end $$;

create table if not exists mk_votos (
  propuesta_id uuid not null references mk_propuestas(id) on delete cascade,
  jugador_id uuid not null references mk_jugadores(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (propuesta_id, jugador_id)
);

create index if not exists idx_mk_equipos_reto on mk_equipos(reto_id);
create index if not exists idx_mk_jugadores_reto on mk_jugadores(reto_id);
create index if not exists idx_mk_jugadores_equipo on mk_jugadores(equipo_id);
create index if not exists idx_mk_carriles_reto on mk_carriles(reto_id);
create index if not exists idx_mk_pasos_reto on mk_pasos(reto_id);
create index if not exists idx_mk_cazas_reto on mk_cazas(reto_id);
create index if not exists idx_mk_cazas_jugador on mk_cazas(jugador_id);
create index if not exists idx_mk_propuestas_reto on mk_propuestas(reto_id);

-- RLS activo sin políticas: solo el service_role (servidor) accede.
alter table mk_retos enable row level security;
alter table mk_equipos enable row level security;
alter table mk_jugadores enable row level security;
alter table mk_carriles enable row level security;
alter table mk_pasos enable row level security;
alter table mk_cazas enable row level security;
alter table mk_propuestas enable row level security;
alter table mk_votos enable row level security;
