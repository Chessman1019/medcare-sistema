-- Refuerza las reglas de horarios disponibles en Supabase.
-- Ejecutar desde el SQL Editor de Supabase.
--
-- Reglas:
-- 1. Un doctor no puede tener dos horarios con la misma fecha y hora de inicio.
-- 2. La hora de fin debe ser posterior a la hora de inicio.
-- 3. No se pueden crear o mover horarios a fechas/horas pasadas segun America/Lima.

CREATE UNIQUE INDEX IF NOT EXISTS idx_horario_disponible_doctor_fecha_inicio
  ON public.horario_disponible (id_doctor, fecha, hora_inicio);

CREATE OR REPLACE FUNCTION public.validar_horario_disponible_lima()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_ahora_lima timestamp without time zone := now() AT TIME ZONE 'America/Lima';
BEGIN
  IF NEW.hora_fin <= NEW.hora_inicio THEN
    RAISE EXCEPTION 'La hora de fin debe ser posterior a la hora de inicio';
  END IF;

  IF (NEW.fecha + NEW.hora_inicio) <= v_ahora_lima THEN
    RAISE EXCEPTION 'No se pueden registrar horarios en fechas u horas pasadas';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_horario_disponible_lima ON public.horario_disponible;

CREATE TRIGGER trg_validar_horario_disponible_lima
BEFORE INSERT OR UPDATE OF fecha, hora_inicio, hora_fin
ON public.horario_disponible
FOR EACH ROW
EXECUTE FUNCTION public.validar_horario_disponible_lima();
