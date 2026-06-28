-- Habilita notificaciones para citas confirmadas que ya finalizaron.
-- Ejecutar desde el SQL Editor de Supabase.

ALTER TYPE public.tipo_notif_enum ADD VALUE IF NOT EXISTS 'cita_por_completar';

NOTIFY pgrst, 'reload schema';
