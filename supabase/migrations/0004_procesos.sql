-- ============================================================================
-- 0004_procesos.sql
-- AndMesApps · Control de procesos.
--
-- Cada facilitador lleva sus propios procesos (los de sus clientes):
--
--   pc_procesos   → el proceso con su indicador principal: línea base, meta
--                   y si mejorar es que el número baje (ej. días) o suba
--                   (ej. % de entregas a tiempo).
--   pc_mediciones → el valor del indicador medido en cada fecha.
--   pc_acciones   → el plan de acción: mejoras con responsable, fecha y
--                   estado. Pueden venir de un juego (propuesta aprobada del
--                   Makigami, estándar de la Carrera Kaizen, recomendación de
--                   un informe) o escribirse a mano.
--
-- Los juegos se unen a un proceso con proceso_id (mk_retos, kz_sesiones).
--
-- Permisos: igual que los juegos. El Administrador ve todos los procesos; el
-- Líder, solo los que creó (creado_por).
--
-- Seguridad: RLS activo sin políticas. Solo el servidor lee y escribe.
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================================

create table if not exists pc_procesos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cliente text,
  area text,
  responsable text,
  objetivo text,
  indicador text not null default 'Tiempo total del proceso',
  unidad text not null default 'días',
  sentido text not null default 'bajar',
  linea_base numeric,
  meta numeric,
  frecuencia text not null default 'semanal',
  activo boolean not null default true,
  creado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table pc_procesos add constraint pc_procesos_sentido_check check (sentido in ('bajar', 'subir'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table pc_procesos add constraint pc_procesos_frecuencia_check check (frecuencia in ('diaria', 'semanal', 'quincenal', 'mensual'));
exception when duplicate_object then null; end $$;

comment on table pc_procesos is 'Control de procesos: proceso de un cliente con su indicador, línea base y meta.';
comment on column pc_procesos.sentido is 'bajar: mejorar es que el indicador baje (tiempos, costos, errores). subir: que suba (% a tiempo, productividad).';

create table if not exists pc_mediciones (
  id uuid primary key default gen_random_uuid(),
  proceso_id uuid not null references pc_procesos(id) on delete cascade,
  fecha date not null,
  valor numeric not null,
  nota text,
  created_at timestamptz not null default now()
);

create table if not exists pc_acciones (
  id uuid primary key default gen_random_uuid(),
  proceso_id uuid not null references pc_procesos(id) on delete cascade,
  titulo text not null,
  detalle text,
  responsable text,
  fecha_compromiso date,
  estado text not null default 'pendiente',
  origen text not null default 'manual',
  origen_id uuid,
  origen_ref text,
  cerrada_en timestamptz,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table pc_acciones add constraint pc_acciones_estado_check check (estado in ('pendiente', 'en_curso', 'hecha', 'descartada'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table pc_acciones add constraint pc_acciones_origen_check check (origen in ('manual', 'makigami', 'kaizen', 'informe'));
exception when duplicate_object then null; end $$;

comment on column pc_acciones.origen_id is 'Reto Makigami o carrera Kaizen de donde salió la acción.';
comment on column pc_acciones.origen_ref is 'Qué elemento del juego la originó (propuesta, tarjeta o recomendación): evita enviarla dos veces.';

-- Una misma propuesta/tarjeta/recomendación de un juego no se duplica en el plan de un proceso.
create unique index if not exists uq_pc_acciones_origen on pc_acciones (proceso_id, origen_ref) where origen_ref is not null;

create index if not exists idx_pc_procesos_creado_por on pc_procesos(creado_por);
create index if not exists idx_pc_mediciones_proceso on pc_mediciones(proceso_id, fecha);
create index if not exists idx_pc_acciones_proceso on pc_acciones(proceso_id);

-- Unir los juegos a un proceso.
alter table mk_retos add column if not exists proceso_id uuid references pc_procesos(id) on delete set null;
alter table kz_sesiones add column if not exists proceso_id uuid references pc_procesos(id) on delete set null;
create index if not exists idx_mk_retos_proceso on mk_retos(proceso_id);
create index if not exists idx_kz_sesiones_proceso on kz_sesiones(proceso_id);

-- RLS activo sin políticas: solo el service_role (servidor) accede.
alter table pc_procesos enable row level security;
alter table pc_mediciones enable row level security;
alter table pc_acciones enable row level security;
