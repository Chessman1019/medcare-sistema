-- Agrega el rol recepcionista al enum usado por usuario.tipo_usuario.
-- Ejecutar este script primero y luego ejecutar:
-- 20260518_seed_credenciales_prueba.sql

DO $$
DECLARE
  v_tipo_schema text;
  v_tipo_nombre text;
BEGIN
  SELECT ns.nspname, t.typname
  INTO v_tipo_schema, v_tipo_nombre
  FROM pg_attribute a
  JOIN pg_type t ON t.oid = a.atttypid
  JOIN pg_namespace ns ON ns.oid = t.typnamespace
  WHERE a.attrelid = 'public.usuario'::regclass
    AND a.attname = 'tipo_usuario'
    AND t.typtype = 'e';

  IF v_tipo_nombre IS NULL THEN
    RAISE EXCEPTION 'usuario.tipo_usuario no usa un enum. Revisa el esquema antes de continuar.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace ns ON ns.oid = t.typnamespace
    WHERE ns.nspname = v_tipo_schema
      AND t.typname = v_tipo_nombre
      AND e.enumlabel = 'recepcionista'
  ) THEN
    EXECUTE format(
      'ALTER TYPE %I.%I ADD VALUE %L',
      v_tipo_schema,
      v_tipo_nombre,
      'recepcionista'
    );
  END IF;
END $$;
