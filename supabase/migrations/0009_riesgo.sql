-- ============================================================================
-- 0009_riesgo.sql
-- AndMesApps · LA RUTA DEL RIESGO — detectar, prevenir y reportar riesgos
-- de LA/FT (SAGRILAFT y SARLAFT).
--
-- Juego por equipos (o individual) con 8 retos: 1 ¿Detectas la señal?
-- · 2 Conoce a tu contraparte · 3 Encuentra al beneficiario final
-- · 4 Sigue el dinero · 5 Clasifica el riesgo (semáforo) · 6 ¿Qué harías?
-- (cartas de evento) · 7 Escala correctamente · 8 Caso final.
-- Cada sesión se configura con la ruta real de la empresa (marco, a quién se
-- escala, por qué canal y el umbral de la certificación «Guardián del Riesgo»).
--
-- Seguridad: RLS activo sin políticas. Solo el servidor lee y escribe.
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================================

create table if not exists rr_sesiones (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  titulo text not null,
  descripcion text,
  marco text not null default 'sagrilaft',
  responsable text not null default 'Oficial de Cumplimiento',
  canal text not null default 'el canal interno de reporte de operaciones inusuales',
  umbral int not null default 70,
  estado text not null default 'preparacion',
  reto_actual int not null default 0,
  registro_abierto boolean not null default true,
  creado_por uuid references auth.users(id) on delete set null,
  proceso_id uuid references pc_procesos(id) on delete set null,
  cerrado_en timestamptz,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table rr_sesiones add constraint rr_sesiones_estado_check check (estado in ('preparacion', 'jugando', 'cerrado'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table rr_sesiones add constraint rr_sesiones_reto_check check (reto_actual between 0 and 8);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table rr_sesiones add constraint rr_sesiones_marco_check check (marco in ('sagrilaft', 'sarlaft', 'ambos'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table rr_sesiones add constraint rr_sesiones_umbral_check check (umbral between 50 and 100);
exception when duplicate_object then null; end $$;

comment on column rr_sesiones.reto_actual is '0 = preparación, 1 a 8 = retos abiertos (cada equipo avanza a su ritmo).';
comment on column rr_sesiones.umbral is '% mínimo en cada competencia para la certificación Guardián del Riesgo.';

create table if not exists rr_equipos (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references rr_sesiones(id) on delete cascade,
  nombre text not null,
  emoji text not null default '🦊',
  created_at timestamptz not null default now()
);

create unique index if not exists uq_rr_equipos_nombre on rr_equipos (sesion_id, lower(nombre));

create table if not exists rr_jugadores (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references rr_sesiones(id) on delete cascade,
  equipo_id uuid not null references rr_equipos(id) on delete restrict,
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
  alter table rr_jugadores add constraint rr_jugadores_sexo_check check (sexo in ('femenino', 'masculino', 'otro', 'prefiero_no_decir'));
exception when duplicate_object then null; end $$;

create table if not exists rr_intentos (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references rr_sesiones(id) on delete cascade,
  equipo_id uuid not null references rr_equipos(id) on delete cascade,
  reto int not null,
  jugador_id uuid references rr_jugadores(id) on delete set null,
  inicio timestamptz not null default now(),
  fin timestamptz,
  respuestas jsonb not null default '{}',
  aciertos int not null default 0,
  errores int not null default 0,
  puntos int not null default 0,
  resumen jsonb not null default '{}',
  unique (equipo_id, reto)
);

do $$ begin
  alter table rr_intentos add constraint rr_intentos_reto_check check (reto between 1 and 8);
exception when duplicate_object then null; end $$;

comment on column rr_intentos.resumen is 'Resultado calculado en el servidor: puntos por competencia, señales detectadas, alertas ignoradas, errores frecuentes…';

create index if not exists idx_rr_sesiones_creado_por on rr_sesiones(creado_por);
create index if not exists idx_rr_sesiones_proceso on rr_sesiones(proceso_id);
create index if not exists idx_rr_equipos_sesion on rr_equipos(sesion_id);
create index if not exists idx_rr_jugadores_sesion on rr_jugadores(sesion_id);
create index if not exists idx_rr_intentos_sesion on rr_intentos(sesion_id);

-- Las opciones de mejora de La Ruta del Riesgo también llegan al plan de acción de los procesos.
alter table pc_acciones drop constraint if exists pc_acciones_origen_check;
alter table pc_acciones add constraint pc_acciones_origen_check check (origen in ('manual', 'makigami', 'kaizen', 'cincos', 'mudalab', 'riesgo', 'informe'));

alter table rr_sesiones enable row level security;
alter table rr_equipos enable row level security;
alter table rr_jugadores enable row level security;
alter table rr_intentos enable row level security;
