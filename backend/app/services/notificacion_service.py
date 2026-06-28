from datetime import datetime, timedelta, timezone

from app.database import supabase, supabase_admin

ROLES_NOTIFICACION_CITA = ("administrador", "recepcionista")
TIPO_CITA_PENDIENTE = "cita_pendiente"
TIPO_RECORDATORIO_CITA = "recordatorio_cita_pendiente"


def _parse_datetime(value) -> datetime | None:
    if not value:
        return None
    text = str(value).replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed


def _fecha_programada(cita: dict) -> str | None:
    return cita.get("fecha_hora") or cita.get("fecha_programada")


def _nombre_paciente(cita: dict) -> str:
    return cita.get("paciente") or cita.get("nombre_paciente") or "Paciente sin registrar"


def _doctor(cita: dict) -> str:
    return cita.get("doctor") or cita.get("nombre_doctor") or ""


def _descripcion_cita(cita: dict) -> str:
    partes = [
        _nombre_paciente(cita),
        _fecha_programada(cita) or "Sin fecha",
        cita.get("especialidad"),
        f"Dr. {_doctor(cita)}" if _doctor(cita) else "",
    ]
    return " · ".join([parte for parte in partes if parte])


def _insertar_notificacion_si_no_existe(cita: dict, rol: str, tipo: str, mensaje: str):
    id_cita = cita.get("id_cita")
    if not id_cita:
        return None
    clave = f"{tipo}:{rol}:{id_cita}"
    existente = supabase_admin.table("notificacion")\
        .select("id_notif")\
        .eq("clave", clave)\
        .limit(1)\
        .execute()
    if existente.data:
        return existente.data[0]

    payload = {
        "id_cita": id_cita,
        "rol_destino": rol,
        "tipo": tipo,
        "mensaje": mensaje,
        "fecha_programada": _fecha_programada(cita),
        "enviada": False,
        "leida": False,
        "eliminada": False,
        "clave": clave,
    }
    res = supabase_admin.table("notificacion").insert(payload).execute()
    return res.data[0] if res.data else None


def sincronizar_notificaciones_citas_pendientes():
    res = supabase.table("v_citas_detalle")\
        .select("*")\
        .eq("estado", "pendiente")\
        .execute()
    citas = res.data or []
    ahora = datetime.now(timezone.utc)

    for cita in citas:
        for rol in ROLES_NOTIFICACION_CITA:
            _insertar_notificacion_si_no_existe(
                cita,
                rol,
                TIPO_CITA_PENDIENTE,
                f"Tienes una cita pendiente por aprobar. {_descripcion_cita(cita)}",
            )

            fecha_cita = _parse_datetime(_fecha_programada(cita))
            if fecha_cita and ahora >= fecha_cita - timedelta(minutes=90):
                _insertar_notificacion_si_no_existe(
                    cita,
                    rol,
                    TIPO_RECORDATORIO_CITA,
                    f"Recordatorio: tienes una cita pendiente por aceptar que esta proxima a realizarse. {_descripcion_cita(cita)}",
                )


def listar_notificaciones_citas(rol: str | None = None, limit: int = 50):
    sincronizar_notificaciones_citas_pendientes()
    query = supabase.table("notificacion")\
        .select("*")\
        .in_("tipo", [TIPO_CITA_PENDIENTE, TIPO_RECORDATORIO_CITA])\
        .eq("eliminada", False)
    if rol:
        query = query.eq("rol_destino", rol)
    res = query.order("leida").order("fecha_programada", desc=False).limit(limit).execute()
    notificaciones = res.data or []
    ids_cita = [n.get("id_cita") for n in notificaciones if n.get("id_cita")]
    if not ids_cita:
        return notificaciones

    citas_res = supabase.table("v_citas_detalle").select("*").in_("id_cita", ids_cita).execute()
    citas_por_id = {cita.get("id_cita"): cita for cita in (citas_res.data or [])}
    return [
        {**notificacion, **(citas_por_id.get(notificacion.get("id_cita")) or {})}
        for notificacion in notificaciones
    ]


def marcar_notificacion_leida(id_notif: int):
    res = supabase_admin.table("notificacion").update({
        "leida": True,
        "leida_en": datetime.now(timezone.utc).isoformat(),
        "enviada": True,
        "enviado_en": datetime.now(timezone.utc).isoformat(),
    }).eq("id_notif", id_notif).execute()
    return res.data[0] if res.data else None


def eliminar_notificacion(id_notif: int):
    res = supabase_admin.table("notificacion").update({
        "eliminada": True,
        "eliminada_en": datetime.now(timezone.utc).isoformat(),
    }).eq("id_notif", id_notif).execute()
    return res.data[0] if res.data else None


def marcar_notificaciones_cita_leidas(id_cita: int):
    return supabase_admin.table("notificacion").update({
        "leida": True,
        "leida_en": datetime.now(timezone.utc).isoformat(),
        "enviada": True,
        "enviado_en": datetime.now(timezone.utc).isoformat(),
    }).eq("id_cita", id_cita)\
      .in_("tipo", [TIPO_CITA_PENDIENTE, TIPO_RECORDATORIO_CITA])\
      .eq("eliminada", False)\
      .execute()
