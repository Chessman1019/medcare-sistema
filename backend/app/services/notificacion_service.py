from datetime import datetime, timedelta, timezone

from postgrest.exceptions import APIError

from app.database import supabase, supabase_admin

ROLES_NOTIFICACION_CITA = ("administrador", "recepcionista")
TIPO_CITA_PENDIENTE = "cita_pendiente"
TIPO_RECORDATORIO_CITA = "recordatorio_cita_pendiente"
DB_TIPOS_NOTIFICACION_CITA = {
    TIPO_CITA_PENDIENTE: "cita_creada",
    TIPO_RECORDATORIO_CITA: "recordatorio_24h",
}
SCHEMA_COLUMNS_PERSISTENTES = ("leida", "leida_en", "eliminada", "eliminada_en", "rol_destino", "clave")


def _is_missing_column_error(error: APIError, *columns: str) -> bool:
    text = str(error)
    return "Could not find" in text and "column" in text and any(column in text for column in columns)


def _is_invalid_tipo_notif_error(error: APIError) -> bool:
    text = str(error)
    return "invalid input value for enum tipo_notif_enum" in text


def _is_duplicate_notificacion_error(error: APIError) -> bool:
    text = str(error)
    return "duplicate key value violates unique constraint" in text


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


def _tipo_db(tipo: str) -> str:
    return DB_TIPOS_NOTIFICACION_CITA.get(tipo, tipo)


def _tipo_logico(notificacion: dict) -> str:
    clave = notificacion.get("clave") or ""
    if clave.startswith(f"{TIPO_RECORDATORIO_CITA}:"):
        return TIPO_RECORDATORIO_CITA
    if clave.startswith(f"{TIPO_CITA_PENDIENTE}:"):
        return TIPO_CITA_PENDIENTE
    tipo = notificacion.get("tipo")
    if notificacion.get("rol_destino") in ROLES_NOTIFICACION_CITA:
        if tipo == DB_TIPOS_NOTIFICACION_CITA[TIPO_RECORDATORIO_CITA]:
            return TIPO_RECORDATORIO_CITA
        if tipo == DB_TIPOS_NOTIFICACION_CITA[TIPO_CITA_PENDIENTE]:
            return TIPO_CITA_PENDIENTE
    return tipo


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


def _insertar_notificacion_si_no_existe(
    cita: dict,
    rol: str,
    tipo: str,
    mensaje: str,
    fecha_programada: str | None = None,
):
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
        "tipo": _tipo_db(tipo),
        "mensaje": mensaje,
        "fecha_programada": fecha_programada or _fecha_programada(cita),
        "enviada": False,
        "leida": False,
        "eliminada": False,
        "clave": clave,
    }
    try:
        res = supabase_admin.table("notificacion").insert(payload).execute()
    except APIError as error:
        if _is_invalid_tipo_notif_error(error):
            return None
        if _is_duplicate_notificacion_error(error):
            existente = supabase_admin.table("notificacion")\
                .select("id_notif")\
                .eq("clave", clave)\
                .limit(1)\
                .execute()
            return existente.data[0] if existente.data else None
        raise
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
            fecha_recordatorio = fecha_cita - timedelta(minutes=90) if fecha_cita else None
            if fecha_cita and fecha_recordatorio and fecha_recordatorio <= ahora <= fecha_cita:
                _insertar_notificacion_si_no_existe(
                    cita,
                    rol,
                    TIPO_RECORDATORIO_CITA,
                    f"Recordatorio: tienes una cita pendiente por aceptar que esta proxima a realizarse. {_descripcion_cita(cita)}",
                    fecha_recordatorio.isoformat(),
                )


def listar_notificaciones_citas(rol: str | None = None, limit: int = 50):
    try:
        sincronizar_notificaciones_citas_pendientes()
        query = supabase.table("notificacion")\
            .select("*")\
            .in_("tipo", list(DB_TIPOS_NOTIFICACION_CITA.values()))\
            .eq("eliminada", False)
        if rol:
            query = query.eq("rol_destino", rol)
        else:
            query = query.in_("rol_destino", list(ROLES_NOTIFICACION_CITA))
        res = query.order("leida").order("fecha_programada", desc=False).limit(limit).execute()
    except APIError as error:
        if _is_missing_column_error(error, *SCHEMA_COLUMNS_PERSISTENTES) or _is_invalid_tipo_notif_error(error):
            return []
        raise
    notificaciones = [
        {**notificacion, "tipo_db": notificacion.get("tipo"), "tipo": _tipo_logico(notificacion)}
        for notificacion in (res.data or [])
    ]
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
    ahora = datetime.now(timezone.utc).isoformat()
    try:
        res = supabase_admin.table("notificacion").update({
            "leida": True,
            "leida_en": ahora,
            "enviada": True,
            "enviado_en": ahora,
        }).eq("id_notif", id_notif).execute()
    except APIError as error:
        if not _is_missing_column_error(error, "leida", "leida_en"):
            raise
        res = supabase_admin.table("notificacion").update({
            "enviada": True,
            "enviado_en": ahora,
        }).eq("id_notif", id_notif).execute()
    return res.data[0] if res.data else None


def eliminar_notificacion(id_notif: int):
    try:
        res = supabase_admin.table("notificacion").update({
            "eliminada": True,
            "eliminada_en": datetime.now(timezone.utc).isoformat(),
        }).eq("id_notif", id_notif).execute()
    except APIError as error:
        if not _is_missing_column_error(error, "eliminada", "eliminada_en"):
            raise
        existente = supabase_admin.table("notificacion")\
            .select("id_notif")\
            .eq("id_notif", id_notif)\
            .limit(1)\
            .execute()
        if not existente.data:
            return None
        supabase_admin.table("notificacion").delete().eq("id_notif", id_notif).execute()
        return {**existente.data[0], "eliminada": True}
    return res.data[0] if res.data else None


def marcar_notificaciones_cita_leidas(id_cita: int):
    ahora = datetime.now(timezone.utc).isoformat()
    try:
        return supabase_admin.table("notificacion").update({
            "leida": True,
            "leida_en": ahora,
            "enviada": True,
          "enviado_en": ahora,
        }).eq("id_cita", id_cita)\
          .in_("tipo", list(DB_TIPOS_NOTIFICACION_CITA.values()))\
          .eq("eliminada", False)\
          .execute()
    except APIError as error:
        if not _is_missing_column_error(error, "leida", "leida_en", "eliminada"):
            raise
        return supabase_admin.table("notificacion").update({
            "enviada": True,
            "enviado_en": ahora,
        }).eq("id_cita", id_cita).execute()
