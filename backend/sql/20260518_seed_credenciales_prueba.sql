-- Seed de credenciales y datos mínimos para pruebas del sistema MedCare.
-- Ejecutar desde Supabase SQL Editor.
-- Si tu enum usuario.tipo_usuario aún no tiene "recepcionista",
-- ejecuta primero: 20260518_add_rol_recepcionista.sql
--
-- Contraseña para todos los usuarios de prueba: MedCare123
--
-- Cuentas creadas/actualizadas:
--   admin.medcare@example.com         -> administrador
--   recepcion.medcare@example.com     -> recepcionista
--   doctor.medcare@example.com        -> doctor
--   paciente.medcare@example.com      -> paciente

DO $$
DECLARE
  v_password_hash text := '$2b$12$5.VA0odOcWDszWWwt.Sxu.aqTOF68DIBdsFqkxjEb7P6lUWDPwp86';
  v_missing_roles text;
  v_turno_admin text;
  v_turno_doctor text;
  v_genero_paciente text;
  v_admin_id integer;
  v_recepcion_id integer;
  v_doctor_id integer;
  v_paciente_id integer;
  v_especialidad_id integer;
  v_horario_cita_id integer;
  v_horario_fecha date;
  v_horario_inicio time;
  v_cita_id integer;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute a
    JOIN pg_type t ON t.oid = a.atttypid
    WHERE a.attrelid = 'public.usuario'::regclass
      AND a.attname = 'tipo_usuario'
      AND t.typtype = 'e'
  ) THEN
    SELECT string_agg(rol, ', ')
    INTO v_missing_roles
    FROM (VALUES ('paciente'), ('doctor'), ('administrador'), ('recepcionista')) AS roles(rol)
    WHERE NOT EXISTS (
      SELECT 1
      FROM pg_attribute a
      JOIN pg_enum e ON e.enumtypid = a.atttypid
      WHERE a.attrelid = 'public.usuario'::regclass
        AND a.attname = 'tipo_usuario'
        AND e.enumlabel = roles.rol
    );

    IF v_missing_roles IS NOT NULL THEN
      RAISE EXCEPTION 'Faltan estos roles en el enum usuario.tipo_usuario: %. Agrega esos valores antes de ejecutar el seed.', v_missing_roles;
    END IF;
  END IF;

  SELECT e.enumlabel
  INTO v_turno_admin
  FROM pg_attribute a
  JOIN pg_enum e ON e.enumtypid = a.atttypid
  WHERE a.attrelid = 'public.administrador'::regclass
    AND a.attname = 'turno'
  ORDER BY
    CASE
      WHEN lower(e.enumlabel) IN ('mañana', 'manana') THEN 0
      WHEN lower(e.enumlabel) = 'tarde' THEN 1
      WHEN lower(e.enumlabel) = 'noche' THEN 2
      ELSE 3
    END,
    e.enumsortorder
  LIMIT 1;

  SELECT e.enumlabel
  INTO v_turno_doctor
  FROM pg_attribute a
  JOIN pg_enum e ON e.enumtypid = a.atttypid
  WHERE a.attrelid = 'public.doctor'::regclass
    AND a.attname = 'turno'
  ORDER BY
    CASE
      WHEN lower(e.enumlabel) IN ('mañana', 'manana') THEN 0
      WHEN lower(e.enumlabel) = 'tarde' THEN 1
      WHEN lower(e.enumlabel) = 'noche' THEN 2
      ELSE 3
    END,
    e.enumsortorder
  LIMIT 1;

  SELECT e.enumlabel
  INTO v_genero_paciente
  FROM pg_attribute a
  JOIN pg_enum e ON e.enumtypid = a.atttypid
  WHERE a.attrelid = 'public.paciente'::regclass
    AND a.attname = 'genero'
  ORDER BY
    CASE
      WHEN e.enumlabel = 'M' THEN 0
      WHEN e.enumlabel = 'F' THEN 1
      ELSE 2
    END,
    e.enumsortorder
  LIMIT 1;

  v_turno_admin := COALESCE(v_turno_admin, 'mañana');
  v_turno_doctor := COALESCE(v_turno_doctor, 'mañana');
  v_genero_paciente := COALESCE(v_genero_paciente, 'M');

  UPDATE public.usuario
  SET email = 'admin.medcare@example.com'
  WHERE email = 'admin.test@medcare.local'
    AND NOT EXISTS (
      SELECT 1 FROM public.usuario WHERE email = 'admin.medcare@example.com'
    );

  UPDATE public.usuario
  SET email = 'recepcion.medcare@example.com'
  WHERE email = 'recepcion.test@medcare.local'
    AND NOT EXISTS (
      SELECT 1 FROM public.usuario WHERE email = 'recepcion.medcare@example.com'
    );

  UPDATE public.usuario
  SET email = 'doctor.medcare@example.com'
  WHERE email = 'doctor.test@medcare.local'
    AND NOT EXISTS (
      SELECT 1 FROM public.usuario WHERE email = 'doctor.medcare@example.com'
    );

  UPDATE public.usuario
  SET email = 'paciente.medcare@example.com'
  WHERE email = 'paciente.test@medcare.local'
    AND NOT EXISTS (
      SELECT 1 FROM public.usuario WHERE email = 'paciente.medcare@example.com'
    );

  EXECUTE format($sql$
    INSERT INTO public.usuario (nombre, apellido, email, contrasena_hash, telefono, activo, tipo_usuario)
    VALUES ('Admin', 'MedCare', 'admin.medcare@example.com', %L, '900000001', true, 'administrador')
    ON CONFLICT (email) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      apellido = EXCLUDED.apellido,
      contrasena_hash = EXCLUDED.contrasena_hash,
      telefono = EXCLUDED.telefono,
      activo = true,
      tipo_usuario = EXCLUDED.tipo_usuario
    RETURNING id_usuario
  $sql$, v_password_hash)
  INTO v_admin_id;

  EXECUTE format($sql$
    INSERT INTO public.usuario (nombre, apellido, email, contrasena_hash, telefono, activo, tipo_usuario)
    VALUES ('Recepción', 'MedCare', 'recepcion.medcare@example.com', %L, '900000002', true, 'recepcionista')
    ON CONFLICT (email) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      apellido = EXCLUDED.apellido,
      contrasena_hash = EXCLUDED.contrasena_hash,
      telefono = EXCLUDED.telefono,
      activo = true,
      tipo_usuario = EXCLUDED.tipo_usuario
    RETURNING id_usuario
  $sql$, v_password_hash)
  INTO v_recepcion_id;

  EXECUTE format($sql$
    INSERT INTO public.usuario (nombre, apellido, email, contrasena_hash, telefono, activo, tipo_usuario)
    VALUES ('Valeria', 'Ramos', 'doctor.medcare@example.com', %L, '900000003', true, 'doctor')
    ON CONFLICT (email) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      apellido = EXCLUDED.apellido,
      contrasena_hash = EXCLUDED.contrasena_hash,
      telefono = EXCLUDED.telefono,
      activo = true,
      tipo_usuario = EXCLUDED.tipo_usuario
    RETURNING id_usuario
  $sql$, v_password_hash)
  INTO v_doctor_id;

  EXECUTE format($sql$
    INSERT INTO public.usuario (nombre, apellido, email, contrasena_hash, telefono, activo, tipo_usuario)
    VALUES ('Diego', 'Alvarez', 'paciente.medcare@example.com', %L, '900000004', true, 'paciente')
    ON CONFLICT (email) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      apellido = EXCLUDED.apellido,
      contrasena_hash = EXCLUDED.contrasena_hash,
      telefono = EXCLUDED.telefono,
      activo = true,
      tipo_usuario = EXCLUDED.tipo_usuario
    RETURNING id_usuario
  $sql$, v_password_hash)
  INTO v_paciente_id;

  EXECUTE format($sql$
    INSERT INTO public.administrador (id_usuario, codigo_empleado, turno)
    VALUES (%s, 'ADM-TEST-001', %L)
    ON CONFLICT (id_usuario) DO UPDATE SET
      codigo_empleado = EXCLUDED.codigo_empleado,
      turno = EXCLUDED.turno
  $sql$, v_admin_id, v_turno_admin);

  EXECUTE format($sql$
    INSERT INTO public.administrador (id_usuario, codigo_empleado, turno)
    VALUES (%s, 'REC-TEST-001', %L)
    ON CONFLICT (id_usuario) DO UPDATE SET
      codigo_empleado = EXCLUDED.codigo_empleado,
      turno = EXCLUDED.turno
  $sql$, v_recepcion_id, v_turno_admin);

  INSERT INTO public.especialidad (nombre, descripcion)
  VALUES ('Medicina General', 'Atención médica general para pruebas del sistema.')
  ON CONFLICT (nombre) DO UPDATE SET
    descripcion = EXCLUDED.descripcion
  RETURNING id_especialidad
  INTO v_especialidad_id;

  EXECUTE format($sql$
    INSERT INTO public.doctor (id_usuario, id_especialidad, cmp, disponible, turno)
    VALUES (%s, %s, 'CMP-TEST-001', true, %L)
    ON CONFLICT (id_usuario) DO UPDATE SET
      id_especialidad = EXCLUDED.id_especialidad,
      cmp = EXCLUDED.cmp,
      disponible = true,
      turno = EXCLUDED.turno
  $sql$, v_doctor_id, v_especialidad_id, v_turno_doctor);

  EXECUTE format($sql$
    INSERT INTO public.paciente (id_usuario, dni, fecha_nacimiento, genero, direccion, seguro_medico)
    VALUES (%s, '70000001', DATE '2000-05-18', %L, 'Av. Principal 123', 'Seguro de prueba')
    ON CONFLICT (id_usuario) DO UPDATE SET
      dni = EXCLUDED.dni,
      fecha_nacimiento = EXCLUDED.fecha_nacimiento,
      genero = EXCLUDED.genero,
      direccion = EXCLUDED.direccion,
      seguro_medico = EXCLUDED.seguro_medico
  $sql$, v_paciente_id, v_genero_paciente);

  INSERT INTO public.horario_disponible (id_doctor, fecha, hora_inicio, hora_fin, ocupado)
  SELECT
    v_doctor_id,
    CURRENT_DATE + dia.valor,
    bloque.hora_inicio,
    bloque.hora_inicio + INTERVAL '30 minutes',
    false
  FROM generate_series(1, 5) AS dia(valor)
  CROSS JOIN (
    VALUES
      (TIME '09:00'),
      (TIME '10:00'),
      (TIME '11:00'),
      (TIME '15:00')
  ) AS bloque(hora_inicio)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.horario_disponible h
    WHERE h.id_doctor = v_doctor_id
      AND h.fecha = CURRENT_DATE + dia.valor
      AND h.hora_inicio = bloque.hora_inicio
  );

  SELECT h.id_horario, h.fecha, h.hora_inicio
  INTO v_horario_cita_id, v_horario_fecha, v_horario_inicio
  FROM public.horario_disponible h
  WHERE h.id_doctor = v_doctor_id
    AND h.ocupado = false
    AND h.fecha >= CURRENT_DATE
  ORDER BY h.fecha, h.hora_inicio
  LIMIT 1;

  IF v_horario_cita_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.cita c
       WHERE c.id_paciente = v_paciente_id
         AND c.id_doctor = v_doctor_id
         AND c.motivo = 'Cita de prueba para validación del sistema'
     ) THEN
    INSERT INTO public.cita (
      id_paciente,
      id_doctor,
      id_horario,
      fecha_hora,
      duracion_min,
      estado,
      motivo
    )
    VALUES (
      v_paciente_id,
      v_doctor_id,
      v_horario_cita_id,
      (v_horario_fecha + v_horario_inicio) AT TIME ZONE 'America/Lima',
      30,
      'pendiente',
      'Cita de prueba para validación del sistema'
    )
    RETURNING id_cita
    INTO v_cita_id;

    UPDATE public.horario_disponible
    SET ocupado = true
    WHERE id_horario = v_horario_cita_id;
  END IF;

  IF v_cita_id IS NULL THEN
    SELECT c.id_cita
    INTO v_cita_id
    FROM public.cita c
    WHERE c.id_paciente = v_paciente_id
      AND c.id_doctor = v_doctor_id
      AND c.motivo = 'Cita de prueba para validación del sistema'
    ORDER BY c.id_cita DESC
    LIMIT 1;
  END IF;

  IF to_regclass('public.soporte_ticket') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.soporte_ticket st
       WHERE st.id_usuario = v_paciente_id
         AND st.mensaje = 'Ticket de prueba creado desde el seed de credenciales.'
     ) THEN
    INSERT INTO public.soporte_ticket (
      id_usuario,
      rol,
      contexto,
      mensaje,
      id_cita,
      prioridad,
      estado
    )
    VALUES (
      v_paciente_id,
      'paciente',
      'prueba de soporte',
      'Ticket de prueba creado desde el seed de credenciales.',
      v_cita_id,
      'normal',
      'abierto'
    );
  END IF;

  RAISE NOTICE 'Seed ejecutado correctamente. Contraseña para todos: MedCare123';
  RAISE NOTICE 'Administrador: admin.medcare@example.com';
  RAISE NOTICE 'Recepción: recepcion.medcare@example.com';
  RAISE NOTICE 'Doctor: doctor.medcare@example.com';
  RAISE NOTICE 'Paciente: paciente.medcare@example.com';
END $$;
