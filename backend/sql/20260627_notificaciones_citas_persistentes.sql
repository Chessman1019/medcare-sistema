ALTER TABLE public.notificacion
  ADD COLUMN IF NOT EXISTS leida boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS leida_en timestamp with time zone NULL,
  ADD COLUMN IF NOT EXISTS eliminada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS eliminada_en timestamp with time zone NULL,
  ADD COLUMN IF NOT EXISTS rol_destino text NULL,
  ADD COLUMN IF NOT EXISTS clave text NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notificacion_clave
  ON public.notificacion(clave)
  WHERE clave IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notificacion_cita_tipo_rol
  ON public.notificacion(id_cita, tipo, rol_destino);

CREATE INDEX IF NOT EXISTS idx_notificacion_rol_leida_eliminada
  ON public.notificacion(rol_destino, leida, eliminada);

UPDATE public.notificacion
SET leida = true,
    leida_en = COALESCE(leida_en, enviado_en)
WHERE enviada = true
  AND leida = false;
