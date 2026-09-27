-- ============================================================================
-- 0010_makigami_matriz.sql
-- Cacería Makigami: matriz de calor impacto/complejidad para las propuestas
-- de mejora (pedida por la usuaria a partir de FORMATOS_MAKIGAMI.xlsx —
-- hoja "Cuadro de Priorización" — y Makigami.docx). Cada propuesta se
-- califica en dos escalas de 1 a 3 al proponerla; con eso se ubica sola en
-- el cuadrante correspondiente (ver zonaPropuesta en src/lib/makigami.ts).
--
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================================

alter table mk_propuestas add column if not exists impacto smallint not null default 2;
alter table mk_propuestas add column if not exists complejidad smallint not null default 2;

do $$ begin
  alter table mk_propuestas add constraint mk_propuestas_impacto_check check (impacto between 1 and 3);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table mk_propuestas add constraint mk_propuestas_complejidad_check check (complejidad between 1 and 3);
exception when duplicate_object then null; end $$;

comment on column mk_propuestas.impacto is 'Impacto/beneficio de la mejora: 1 bajo, 2 medio, 3 alto.';
comment on column mk_propuestas.complejidad is 'Costo/complejidad de hacerla: 1 fácil (con lo que hay), 2 media, 3 alta (requiere tiempo o dinero).';
