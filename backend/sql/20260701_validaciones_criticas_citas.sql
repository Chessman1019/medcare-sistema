-- Refuerza reglas criticas de agenda medica en Supabase.
-- Ejecutar desde el SQL Editor de Supabase.
--
-- Reglas:
-- 1. Un doctor no puede tener horarios disponibles superpuestos.
-- 2. Una cita activa no puede cruzarse con otra cita activa del mismo doctor.
-- 3. Se consideran activas: pendiente, confirmada, reprogramada y en_atencion.
-- 4. Citas canceladas y completadas no bloquean disponibilidad.

CREATE INDEX IF NOT EXISTS idx_cita_doctor_estado_fecha
  ON public.cita (id_doctor, estado, fecha_hora);

CREATE INDEX IF NOT EXISTS idx_horario_disponible_doctor_fecha_rango
  ON public.horario_disponible (id_doctor, fecha, hora_inicio, hora_fin);

CREATE OR REPLACE FUNCTION public.validar_horario_disponible_no_solapado()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.horario_disponible h
    WHERE h.id_doctor = NEW.id_doctor
      AND h.fecha = NEW.fecha
      AND h.id_horario IS DISTINCT FROM NEW.id_horario
      AND NEW.hora_inicio < h.hora_fin
      AND NEW.hora_fin > h.hora_inicio
  ) THEN
    RAISE EXCEPTION 'El doctor ya tiene un horario disponible que se cruza con ese rango de tiempo';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_horario_disponible_no_solapado
ON public.horario_disponible;

CREATE TRIGGER trg_validar_horario_disponible_no_solapado
BEFORE INSERT OR UPDATE OF id_doctor, fecha, hora_inicio, hora_fin
ON public.horario_disponible
FOR EACH ROW
EXECUTE FUNCTION public.validar_horario_disponible_no_solapado();

CREATE OR REPLACE FUNCTION public.fecha_fin_cita_medcare(
  p_fecha_hora timestamp with time zone,
  p_id_horario integer,
  p_duracion_min integer
)
RETURNS timestamp with time zone
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_fecha date;
  v_hora_fin time;
  v_fin timestamp with time zone;
BEGIN
  IF p_id_horario IS NOT NULL THEN
    SELECT h.fecha, h.hora_fin
    INTO v_fecha, v_hora_fin
    FROM public.horario_disponible h
    WHERE h.id_horario = p_id_horario;

    IF v_fecha IS NOT NULL AND v_hora_fin IS NOT NULL THEN
      v_fin := (v_fecha + v_hora_fin) AT TIME ZONE 'America/Lima';
      IF v_fin <= p_fecha_hora THEN
        v_fin := v_fin + INTERVAL '1 day';
      END IF;
      RETURN v_fin;
    END IF;
  END IF;

  RETURN p_fecha_hora + (COALESCE(p_duracion_min, 30) || ' minutes')::interval;
END;
$$;

CREATE OR REPLACE FUNCTION public.validar_cita_medcare_no_solapada()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_inicio timestamp with time zone;
  v_fin timestamp with time zone;
BEGIN
  IF NEW.estado::text NOT IN ('pendiente', 'confirmada', 'reprogramada', 'en_atencion') THEN
    RETURN NEW;
  END IF;

  v_inicio := NEW.fecha_hora;
  v_fin := public.fecha_fin_cita_medcare(NEW.fecha_hora, NEW.id_horario, NEW.duracion_min);

  IF EXISTS (
    SELECT 1
    FROM public.cita c
    WHERE c.id_doctor = NEW.id_doctor
      AND c.id_cita IS DISTINCT FROM NEW.id_cita
      AND c.estado::text IN ('pendiente', 'confirmada', 'reprogramada', 'en_atencion')
      AND v_inicio < public.fecha_fin_cita_medcare(c.fecha_hora, c.id_horario, c.duracion_min)
      AND v_fin > c.fecha_hora
  ) THEN
    RAISE EXCEPTION 'Este horario ya no esta disponible. El doctor tiene otra cita programada en ese rango de tiempo. Selecciona otro horario.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_cita_medcare_no_solapada
ON public.cita;

CREATE TRIGGER trg_validar_cita_medcare_no_solapada
BEFORE INSERT OR UPDATE OF id_doctor, id_horario, fecha_hora, duracion_min, estado
ON public.cita
FOR EACH ROW
EXECUTE FUNCTION public.validar_cita_medcare_no_solapada();

NOTIFY pgrst, 'reload schema';
