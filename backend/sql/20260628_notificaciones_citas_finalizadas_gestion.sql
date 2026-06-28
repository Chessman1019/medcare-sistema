-- Habilita notificaciones para citas confirmadas que ya finalizaron y requieren gestion manual.
-- Ejecutar desde el SQL Editor de Supabase.

ALTER TYPE public.tipo_notif_enum ADD VALUE IF NOT EXISTS 'cita_finalizada_pendiente_gestion';

NOTIFY pgrst, 'reload schema';
