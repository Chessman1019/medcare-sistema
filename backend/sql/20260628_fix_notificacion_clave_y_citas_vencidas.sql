-- Corrige el soporte de ON CONFLICT usado por los triggers/funciones de notificaciones.
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

DROP INDEX IF EXISTS public.idx_notificacion_clave;
CREATE UNIQUE INDEX idx_notificacion_clave
  ON public.notificacion(clave);

DROP INDEX IF EXISTS public.notificacion_cita_tipo_programada_rol_uidx;
CREATE UNIQUE INDEX notificacion_cita_tipo_programada_rol_uidx
  ON public.notificacion(id_cita, tipo, fecha_programada, rol_destino);

NOTIFY pgrst, 'reload schema';
