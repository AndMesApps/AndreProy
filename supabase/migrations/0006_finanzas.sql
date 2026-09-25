-- ============================================================================
-- 0006_finanzas.sql
-- AndMesApps · Finanzas del consultor independiente (Colombia).
--
--   fn_parametros    → los valores de cada consultor para calcular: salario
--                      mínimo, UVT, % de base de cotización, salud, pensión,
--                      clase de riesgo ARL, retenciones por defecto, provisión
--                      de renta, 4x1000, meta de ingreso y margen objetivo.
--   pr_proyectos     → + modelo de cobro (valor fijo, por horas o mixto),
--                      valor hora, IVA, retenciones propias del contrato,
--                      participación de un aliado, viáticos pactados y
--                      requisitos para cobrar.
--   pr_presupuesto   → gastos planeados del proyecto por categoría.
--   pr_pagos         → + categoría, reembolsable, horas facturadas,
--                      requisitos cumplidos y el tipo «viatico».
--
-- Seguridad: RLS activo sin políticas. Solo el servidor lee y escribe.
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================================

create table if not exists fn_parametros (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  anio int not null default 2026,
  smmlv numeric not null default 1750905,
  uvt numeric not null default 52374,
  ibc_pct numeric not null default 40,
  salud_pct numeric not null default 12.5,
  pension_pct numeric not null default 16,
  clase_arl int not null default 1,
  retefuente_pct numeric not null default 10,
  reteica_por_mil numeric not null default 9.66,
  provision_renta_pct numeric not null default 8,
  gmf boolean not null default true,
  meta_ingreso_mensual numeric,
  margen_objetivo_pct numeric not null default 40,
  updated_at timestamptz not null default now()
);

do $$ begin
  alter table fn_parametros add constraint fn_parametros_arl_check check (clase_arl between 1 and 5);
exception when duplicate_object then null; end $$;

comment on table fn_parametros is 'Parámetros financieros de cada consultor (valores de ley editables y metas).';

alter table pr_proyectos add column if not exists modalidad_cobro text not null default 'valor_fijo';
alter table pr_proyectos add column if not exists valor_hora numeric;
alter table pr_proyectos add column if not exists cobra_iva boolean not null default false;
alter table pr_proyectos add column if not exists retefuente_pct numeric;
alter table pr_proyectos add column if not exists reteica_por_mil numeric;
alter table pr_proyectos add column if not exists otras_retenciones_pct numeric not null default 0;
alter table pr_proyectos add column if not exists participacion_aliado_pct numeric not null default 0;
alter table pr_proyectos add column if not exists viaticos_pactados numeric;
alter table pr_proyectos add column if not exists requisitos_cobro text;

do $$ begin
  alter table pr_proyectos add constraint pr_proyectos_modalidad_check check (modalidad_cobro in ('valor_fijo', 'por_horas', 'mixto'));
exception when duplicate_object then null; end $$;

comment on column pr_proyectos.modalidad_cobro is 'valor_fijo: un valor total; por_horas: horas × valor hora; mixto: valor fijo + horas adicionales × valor hora.';
comment on column pr_proyectos.retefuente_pct is 'Retención en la fuente de este contrato; vacío = la de los parámetros del consultor.';
comment on column pr_proyectos.participacion_aliado_pct is '% del ingreso que se reparte con un aliado o intermediario.';
comment on column pr_proyectos.requisitos_cobro is 'Requisitos para cada cobro, uno por línea (factura, PILA, informe, aprobación…).';

create table if not exists pr_presupuesto (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references pr_proyectos(id) on delete cascade,
  categoria text not null default 'otros',
  descripcion text not null,
  valor_planeado numeric not null default 0,
  reembolsable boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_pr_presupuesto_proyecto on pr_presupuesto(proyecto_id);

alter table pr_pagos add column if not exists categoria text;
alter table pr_pagos add column if not exists reembolsable boolean not null default false;
alter table pr_pagos add column if not exists horas numeric;
alter table pr_pagos add column if not exists requisitos_cumplidos text[] not null default '{}';

-- Nuevo tipo: viáticos que reconoce el cliente.
alter table pr_pagos drop constraint if exists pr_pagos_tipo_check;
alter table pr_pagos add constraint pr_pagos_tipo_check check (tipo in ('cobro', 'contrapartida', 'gasto', 'viatico'));

alter table fn_parametros enable row level security;
alter table pr_presupuesto enable row level security;
