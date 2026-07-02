-- Habilita notificaciones funcionales de cambios de estado de citas.
-- Ejecutar desde el SQL Editor de Supabase antes de probar estas notificaciones.

ALTER TYPE public.tipo_notif_enum ADD VALUE IF NOT EXISTS 'cita_confirmada';
ALTER TYPE public.tipo_notif_enum ADD VALUE IF NOT EXISTS 'cita_cancelada';
ALTER TYPE public.tipo_notif_enum ADD VALUE IF NOT EXISTS 'cita_reprogramada';

NOTIFY pgrst, 'reload schema';
