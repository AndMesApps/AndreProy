-- ============================================================================
-- 0005_proyectos.sql
-- AndMesApps · Proyectos de consultoría.
--
-- Todo lo que registra y controla una consultora en procesos, inspirado en su
-- Excel de control (Proyectos, Bitácora Diaria y control de hitos):
--
--   pr_proyectos   → ficha: cliente, fechas, horas y valor contratados,
--                    contacto, frecuencia de intervención, reglas, enlaces.
--   pr_hitos       → cronograma: fases, hitos, entregables y requisitos con
--                    responsable, fechas, estado, peso (para el % de avance),
--                    situación actual y próximo paso.
--   pr_objetivos   → objetivos del proyecto y su cumplimiento.
--   pr_kpis        → indicadores (línea base, meta) y pr_mediciones (valores).
--   pr_bitacora    → intervenciones: fecha, actividad, tiempo, estado,
--                    próximo paso (suma las horas ejecutadas).
--   pr_pagos       → cobros, contrapartidas y gastos con sus vencimientos.
--   pr_riesgos     → matriz de riesgos (probabilidad × impacto).
--   pr_documentos  → actas, informes, entregables y evidencias (enlaces).
--
-- Los procesos del Control de procesos se unen al proyecto con
-- pc_procesos.proyecto_id (y a través de ellos, sus juegos).
--
-- Permisos: como los juegos. El Administrador ve todo; el Líder, lo suyo.
-- Seguridad: RLS activo sin políticas. Solo el servidor lee y escribe.
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================================

create table if not exists pr_proyectos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cliente text not null,
  grupo text,
  tipo text not null default 'consultoria',
  programa text,
  descripcion text,
  objetivo_general text,
  contacto_nombre text,
  contacto_cargo text,
  contacto_correo text,
  contacto_celular text,
  gestor_externo text,
  fecha_inicio date,
  fecha_fin date,
  fecha_cierre_limite date,
  horas_contratadas numeric,
  valor_contrato numeric,
  frecuencia_dias int,
  estado text not null default 'en_curso',
  reglas text,
  enlaces text,
  creado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table pr_proyectos add constraint pr_proyectos_estado_check
    check (estado in ('por_iniciar', 'en_curso', 'pausado', 'finalizado', 'cancelado'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table pr_proyectos add constraint pr_proyectos_tipo_check
    check (tipo in ('consultoria', 'aplicativo', 'capacitacion', 'acompanamiento', 'programa', 'tarea_personal'));
exception when duplicate_object then null; end $$;

comment on table pr_proyectos is 'Proyecto de consultoría con su ficha, cronograma, objetivos, KPIs, bitácora, finanzas, riesgos y documentos.';
comment on column pr_proyectos.frecuencia_dias is 'Cada cuántos días se debe intervenir el proyecto; si pasan más, se avisa.';
comment on column pr_proyectos.reglas is 'Reglas clave del programa o contrato (topes, plazos, condiciones).';

create table if not exists pr_hitos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references pr_proyectos(id) on delete cascade,
  fase text,
  nombre text not null,
  que_cumplir text,
  insumos text,
  responsable text,
  fecha_inicio date,
  fecha_limite date,
  fecha_real date,
  estado text not null default 'pendiente',
  peso numeric not null default 1,
  horas_estimadas numeric,
  situacion text,
  proximo_paso text,
  soporte text,
  orden int not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

do $$ begin
  alter table pr_hitos add constraint pr_hitos_estado_check
    check (estado in ('pendiente', 'en_curso', 'en_aprobacion', 'rechazado', 'bloqueado', 'cumplido', 'no_aplica'));
exception when duplicate_object then null; end $$;

create table if not exists pr_objetivos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references pr_proyectos(id) on delete cascade,
  descripcion text not null,
  criterio text,
  responsable text,
  fecha_meta date,
  estado text not null default 'pendiente',
  avance numeric,
  peso numeric not null default 1,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table pr_objetivos add constraint pr_objetivos_estado_check
    check (estado in ('pendiente', 'en_curso', 'cumplido', 'no_cumplido'));
exception when duplicate_object then null; end $$;

create table if not exists pr_kpis (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references pr_proyectos(id) on delete cascade,
  objetivo_id uuid references pr_objetivos(id) on delete set null,
  nombre text not null,
  formula text,
  unidad text not null default '%',
  sentido text not null default 'subir',
  linea_base numeric,
  meta numeric,
  fuente text,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table pr_kpis add constraint pr_kpis_sentido_check check (sentido in ('bajar', 'subir'));
exception when duplicate_object then null; end $$;

create table if not exists pr_mediciones (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references pr_proyectos(id) on delete cascade,
  kpi_id uuid not null references pr_kpis(id) on delete cascade,
  fecha date not null,
  valor numeric not null,
  nota text,
  created_at timestamptz not null default now()
);

create table if not exists pr_bitacora (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references pr_proyectos(id) on delete cascade,
  hito_id uuid references pr_hitos(id) on delete set null,
  fecha date not null,
  actividad text not null,
  tiempo_min int,
  estado_tras text,
  proximo_paso text,
  fecha_proximo date,
  registrado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table pr_bitacora add constraint pr_bitacora_estado_check
    check (estado_tras is null or estado_tras in ('al_dia', 'pendiente', 'atrasado', 'pausado', 'finalizado'));
exception when duplicate_object then null; end $$;

create table if not exists pr_pagos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references pr_proyectos(id) on delete cascade,
  concepto text not null,
  tipo text not null default 'cobro',
  valor numeric not null default 0,
  fecha_limite date,
  fecha_pago date,
  estado text not null default 'pendiente',
  soporte text,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table pr_pagos add constraint pr_pagos_tipo_check check (tipo in ('cobro', 'contrapartida', 'gasto'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table pr_pagos add constraint pr_pagos_estado_check check (estado in ('pendiente', 'facturado', 'pagado', 'anulado'));
exception when duplicate_object then null; end $$;

create table if not exists pr_riesgos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references pr_proyectos(id) on delete cascade,
  descripcion text not null,
  probabilidad text not null default 'media',
  impacto text not null default 'medio',
  mitigacion text,
  responsable text,
  estado text not null default 'abierto',
  created_at timestamptz not null default now()
);

do $$ begin
  alter table pr_riesgos add constraint pr_riesgos_valores_check
    check (probabilidad in ('baja', 'media', 'alta') and impacto in ('bajo', 'medio', 'alto') and estado in ('abierto', 'controlado', 'cerrado'));
exception when duplicate_object then null; end $$;

create table if not exists pr_documentos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references pr_proyectos(id) on delete cascade,
  nombre text not null,
  tipo text not null default 'entregable',
  url text,
  fecha date,
  notas text,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table pr_documentos add constraint pr_documentos_tipo_check
    check (tipo in ('contrato', 'acta', 'informe', 'entregable', 'evidencia', 'otro'));
exception when duplicate_object then null; end $$;

-- Procesos del Control de procesos unidos al proyecto.
alter table pc_procesos add column if not exists proyecto_id uuid references pr_proyectos(id) on delete set null;

create index if not exists idx_pr_proyectos_creado_por on pr_proyectos(creado_por);
create index if not exists idx_pr_hitos_proyecto on pr_hitos(proyecto_id, orden);
create index if not exists idx_pr_objetivos_proyecto on pr_objetivos(proyecto_id);
create index if not exists idx_pr_kpis_proyecto on pr_kpis(proyecto_id);
create index if not exists idx_pr_mediciones_kpi on pr_mediciones(kpi_id, fecha);
create index if not exists idx_pr_bitacora_proyecto on pr_bitacora(proyecto_id, fecha);
create index if not exists idx_pr_pagos_proyecto on pr_pagos(proyecto_id);
create index if not exists idx_pr_riesgos_proyecto on pr_riesgos(proyecto_id);
create index if not exists idx_pr_documentos_proyecto on pr_documentos(proyecto_id);
create index if not exists idx_pc_procesos_proyecto on pc_procesos(proyecto_id);

-- RLS activo sin políticas: solo el service_role (servidor) accede.
alter table pr_proyectos enable row level security;
alter table pr_hitos enable row level security;
alter table pr_objetivos enable row level security;
alter table pr_kpis enable row level security;
alter table pr_mediciones enable row level security;
alter table pr_bitacora enable row level security;
alter table pr_pagos enable row level security;
alter table pr_riesgos enable row level security;
alter table pr_documentos enable row level security;
