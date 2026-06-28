-- Desactiva triggers heredados de notificaciones en cita que usan ON CONFLICT antiguo.
-- Ejecutar desde el SQL Editor de Supabase.

ALTER TABLE public.notificacion
  ADD COLUMN IF NOT EXISTS clave text NULL,
  ADD COLUMN IF NOT EXISTS rol_destino text NULL;

WITH duplicadas AS (
  SELECT
    id_notif,
    row_number() OVER (
      PARTITION BY clave
      ORDER BY eliminada ASC NULLS FIRST, id_notif ASC
    ) AS fila
  FROM public.notificacion
  WHERE clave IS NOT NULL
)
UPDATE public.notificacion n
SET clave = n.clave || ':duplicado:' || n.id_notif::text
FROM duplicadas d
WHERE n.id_notif = d.id_notif
  AND d.fila > 1;

ALTER TABLE public.notificacion DROP CONSTRAINT IF EXISTS idx_notificacion_clave;
DROP INDEX IF EXISTS public.idx_notificacion_clave;
ALTER TABLE public.notificacion
  ADD CONSTRAINT idx_notificacion_clave UNIQUE (clave);

WITH duplicadas AS (
  SELECT
    id_notif,
    row_number() OVER (
      PARTITION BY id_cita, tipo, fecha_programada, rol_destino
      ORDER BY eliminada ASC NULLS FIRST, id_notif ASC
    ) AS fila
  FROM public.notificacion
  WHERE rol_destino IS NOT NULL
)
UPDATE public.notificacion n
SET rol_destino = n.rol_destino || ':duplicado:' || n.id_notif::text
FROM duplicadas d
WHERE n.id_notif = d.id_notif
  AND d.fila > 1;

ALTER TABLE public.notificacion DROP CONSTRAINT IF EXISTS notificacion_cita_tipo_programada_rol_uidx;
DROP INDEX IF EXISTS public.notificacion_cita_tipo_programada_rol_uidx;
ALTER TABLE public.notificacion
  ADD CONSTRAINT notificacion_cita_tipo_programada_rol_uidx
  UNIQUE (id_cita, tipo, fecha_programada, rol_destino);

DO $$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT
      trigger_item.tgname AS trigger_name
    FROM pg_trigger trigger_item
    JOIN pg_class table_item ON table_item.oid = trigger_item.tgrelid
    JOIN pg_namespace schema_item ON schema_item.oid = table_item.relnamespace
    JOIN pg_proc function_item ON function_item.oid = trigger_item.tgfoid
    WHERE schema_item.nspname = 'public'
      AND table_item.relname = 'cita'
      AND NOT trigger_item.tgisinternal
      AND (
        lower(function_item.proname) LIKE '%notif%'
        OR lower(pg_get_functiondef(function_item.oid)) LIKE '%notificacion%'
        OR lower(pg_get_functiondef(function_item.oid)) LIKE '%on conflict%'
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.cita', item.trigger_name);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
