-- Renombra administrador.legajo a administrador.codigo_empleado.
-- Ejecutar una sola vez en Supabase SQL Editor antes de usar la gestión de usuarios actualizada.

DO $$
BEGIN
  IF to_regclass('public.administrador') IS NULL THEN
    RAISE EXCEPTION 'No existe la tabla public.administrador.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'administrador'
      AND column_name = 'legajo'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'administrador'
      AND column_name = 'codigo_empleado'
  ) THEN
    ALTER TABLE public.administrador
      RENAME COLUMN legajo TO codigo_empleado;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'administrador_legajo_key'
      AND conrelid = 'public.administrador'::regclass
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'administrador_codigo_empleado_key'
      AND conrelid = 'public.administrador'::regclass
  ) THEN
    ALTER TABLE public.administrador
      RENAME CONSTRAINT administrador_legajo_key TO administrador_codigo_empleado_key;
  END IF;
END $$;
