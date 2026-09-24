-- ============================================================================
-- 0002_roles.sql
-- AndMesApps · Roles de las personas que administran retos.
--
--   admin  → Administrador: ve y administra todos los retos y crea las
--            cuentas de administradores y líderes (pantalla /usuarios).
--   lider  → Líder: crea retos y ve/administra SOLO los que él creó
--            (mk_retos.creado_por).
--
-- Los jugadores NO están aquí: siguen entrando sin cuenta, con el código del
-- reto (tabla mk_jugadores).
--
-- Los correos de la variable ADMIN_EMAILS (Vercel) son administradores
-- principales aunque no tengan fila en esta tabla: así nadie queda por fuera
-- si se borra o desactiva una fila por error.
--
-- Seguridad: RLS activo sin políticas, como las demás tablas mk_*. Solo el
-- servidor (service_role) lee y escribe.
--
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================================

create table if not exists mk_usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text not null,
  rol text not null default 'lider',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table mk_usuarios add constraint mk_usuarios_rol_check
    check (rol in ('admin', 'lider'));
exception when duplicate_object then null; end $$;

create index if not exists idx_mk_retos_creado_por on mk_retos(creado_por);

alter table mk_usuarios enable row level security;
