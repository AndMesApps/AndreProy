-- ============================================================================
-- 0003_kaizen.sql
-- AndMesApps · Carrera Kaizen por equipos (modo taller).
--
-- Los equipos producen algo sencillo en el salón (aviones de papel, fichas,
-- un formulario…) en varias rondas cronometradas. Cada ronda es un ciclo
-- PDCA completo y gana el equipo que mejora de verdad, medido con datos:
--
--   Ronda 1 (línea base):  hacer → verificar
--   Rondas 2..N:           planear → hacer → verificar → actuar
--
--   planear   → el equipo llena su tarjeta Kaizen: problema, 5 porqués,
--               idea y predicción de unidades buenas.
--   hacer     → producen con el cronómetro del facilitador.
--   verificar → registran unidades buenas y defectuosas.
--   actuar    → deciden si la idea se vuelve estándar o se descarta.
--
-- Ciclo de la carrera (columna estado): preparacion → jugando → cerrado.
-- La ronda y la fase en curso están en ronda_actual y fase.
--
-- Seguridad: RLS activo sin políticas, como las tablas mk_*. Solo el
-- servidor (service_role) lee y escribe.
--
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================================

create table if not exists kz_sesiones (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  titulo text not null,
  descripcion text,
  producto text not null,
  unidad text not null default 'unidades',
  criterio_calidad text,
  total_rondas int not null default 5,
  duracion_ronda_seg int not null default 180,
  estado text not null default 'preparacion',
  ronda_actual int not null default 0,
  fase text,
  cronometro_inicio timestamptz,
  registro_abierto boolean not null default true,
  creado_por uuid references auth.users(id) on delete set null,
  cerrado_en timestamptz,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table kz_sesiones add constraint kz_sesiones_estado_check
    check (estado in ('preparacion', 'jugando', 'cerrado'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table kz_sesiones add constraint kz_sesiones_fase_check
    check (fase is null or fase in ('planear', 'hacer', 'verificar', 'actuar'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table kz_sesiones add constraint kz_sesiones_rondas_check
    check (total_rondas between 2 and 10 and duracion_ronda_seg between 30 and 3600);
exception when duplicate_object then null; end $$;

comment on table kz_sesiones is 'Carrera Kaizen: sesión de juego en rondas PDCA donde los equipos mejoran su producción.';
comment on column kz_sesiones.producto is 'Lo que fabrican los equipos en el taller, ej. "Aviones de papel".';
comment on column kz_sesiones.unidad is 'Cómo se cuentan, ej. "aviones".';
comment on column kz_sesiones.criterio_calidad is 'Cuándo una unidad cuenta como buena, ej. "vuela más de 3 metros".';
comment on column kz_sesiones.cronometro_inicio is 'Cuándo arrancó el cronómetro de la fase Hacer de la ronda en curso.';

create table if not exists kz_equipos (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references kz_sesiones(id) on delete cascade,
  nombre text not null,
  emoji text not null default '🦊',
  created_at timestamptz not null default now()
);

create unique index if not exists uq_kz_equipos_nombre on kz_equipos (sesion_id, lower(nombre));

create table if not exists kz_jugadores (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references kz_sesiones(id) on delete cascade,
  equipo_id uuid not null references kz_equipos(id) on delete restrict,
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
  alter table kz_jugadores add constraint kz_jugadores_sexo_check
    check (sexo in ('femenino', 'masculino', 'otro', 'prefiero_no_decir'));
exception when duplicate_object then null; end $$;

-- Una tarjeta Kaizen por equipo y ronda (desde la ronda 2).
create table if not exists kz_tarjetas (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references kz_sesiones(id) on delete cascade,
  equipo_id uuid not null references kz_equipos(id) on delete cascade,
  ronda int not null,
  problema text not null default '',
  porques text[] not null default '{}',
  idea text not null default '',
  prediccion int,
  decision text,
  editado_por uuid references kz_jugadores(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (equipo_id, ronda)
);

do $$ begin
  alter table kz_tarjetas add constraint kz_tarjetas_decision_check
    check (decision is null or decision in ('estandar', 'descartada'));
exception when duplicate_object then null; end $$;

comment on column kz_tarjetas.prediccion is 'Unidades buenas que el equipo cree que hará en la ronda con su idea.';
comment on column kz_tarjetas.decision is 'Fase Actuar: estandar (se vuelve la nueva forma de trabajar) o descartada.';

-- Resultado medido de cada equipo en cada ronda.
create table if not exists kz_resultados (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references kz_sesiones(id) on delete cascade,
  equipo_id uuid not null references kz_equipos(id) on delete cascade,
  ronda int not null,
  unidades_buenas int not null default 0,
  defectos int not null default 0,
  registrado_por uuid references kz_jugadores(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (equipo_id, ronda)
);

do $$ begin
  alter table kz_resultados add constraint kz_resultados_valores_check
    check (unidades_buenas >= 0 and defectos >= 0);
exception when duplicate_object then null; end $$;

create index if not exists idx_kz_sesiones_creado_por on kz_sesiones(creado_por);
create index if not exists idx_kz_equipos_sesion on kz_equipos(sesion_id);
create index if not exists idx_kz_jugadores_sesion on kz_jugadores(sesion_id);
create index if not exists idx_kz_jugadores_equipo on kz_jugadores(equipo_id);
create index if not exists idx_kz_tarjetas_sesion on kz_tarjetas(sesion_id);
create index if not exists idx_kz_resultados_sesion on kz_resultados(sesion_id);

-- RLS activo sin políticas: solo el service_role (servidor) accede.
alter table kz_sesiones enable row level security;
alter table kz_equipos enable row level security;
alter table kz_jugadores enable row level security;
alter table kz_tarjetas enable row level security;
alter table kz_resultados enable row level security;
