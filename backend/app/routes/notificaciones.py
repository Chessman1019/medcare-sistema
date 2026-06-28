from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from postgrest.exceptions import APIError
from app.database import supabase, supabase_admin
from app.schemas.notificacion import SoporteCreate
from app.services.cita_service import cancelar_citas_vencidas
from app.services.notificacion_service import (
    eliminar_notificacion,
    listar_notificaciones_citas,
    marcar_notificacion_leida,
)

router = APIRouter()


def _is_missing_column_error(error: APIError, *columns: str) -> bool:
    text = str(error)
    return "Could not find" in text and "column" in text and any(column in text for column in columns)


def _aplicar_estado_notificaciones(notificaciones: list[dict], limit: int) -> list[dict]:
    ids = [item.get("id_notif") for item in notificaciones if item.get("id_notif")]
    if not ids:
        return notificaciones[:limit]

    try:
        res = supabase_admin.table("notificacion")\
            .select("id_notif,leida,enviada,eliminada")\
            .in_("id_notif", ids)\
            .execute()
    except APIError as error:
        if not _is_missing_column_error(error, "leida", "eliminada"):
            raise
        res = supabase_admin.table("notificacion")\
            .select("id_notif,enviada")\
            .in_("id_notif", ids)\
            .execute()

    estados = {item.get("id_notif"): item for item in (res.data or [])}
    visibles = []
    for item in notificaciones:
        estado = estados.get(item.get("id_notif"), {})
        if estado.get("eliminada") or item.get("eliminada"):
            continue
        visibles.append({
            **item,
            "leida": estado.get("leida", item.get("leida", item.get("enviada", False))),
            "enviada": estado.get("enviada", item.get("enviada", False)),
            "eliminada": False,
        })
    return visibles[:limit]


def _listar_notificaciones(campo: str | None = None, valor: int | None = None, limit: int = 20):
    query = supabase.table("v_notificaciones_detalle").select("*")
    if campo and valor is not None:
        query = query.eq(campo, valor)
    res = query.order("fecha_programada", desc=True).limit(max(limit * 3, limit)).execute()
    return _aplicar_estado_notificaciones(res.data or [], limit)


@router.get("/paciente/{id_paciente}")
def notificaciones_paciente(id_paciente: int):
    return _listar_notificaciones("id_paciente", id_paciente)


@router.get("/doctor/{id_doctor}")
def notificaciones_doctor(id_doctor: int):
    return _listar_notificaciones("id_doctor", id_doctor)


@router.get("/admin")
def notificaciones_admin():
    return _listar_notificaciones()


@router.get("/citas-pendientes")
def notificaciones_citas_pendientes(rol: str | None = Query(default=None)):
    cancelar_citas_vencidas()
    return listar_notificaciones_citas(rol)


@router.put("/{id_notif}/marcar-enviada")
def marcar_notificacion_enviada(id_notif: int):
    res = supabase_admin.table("notificacion").update({
        "enviada": True,
        "enviado_en": datetime.now(timezone.utc).isoformat(),
    }).eq("id_notif", id_notif).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    return res.data[0]


@router.put("/{id_notif}/marcar-leida")
def marcar_leida(id_notif: int):
    notificacion = marcar_notificacion_leida(id_notif)
    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    return notificacion


@router.delete("/{id_notif}")
def eliminar(id_notif: int):
    notificacion = eliminar_notificacion(id_notif)
    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    return notificacion


@router.post("/soporte")
def crear_solicitud_soporte(data: SoporteCreate):
    mensaje = data.mensaje.strip()
    if not mensaje:
        raise HTTPException(status_code=400, detail="El mensaje de soporte no puede estar vacio")
    payload = {
        "id_usuario": data.id_usuario,
        "rol": data.rol,
        "contexto": data.contexto,
        "mensaje": mensaje,
        "id_cita": data.id_cita,
        "prioridad": "normal",
        "estado": "abierto",
    }
    res = supabase_admin.table("soporte_ticket").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="No se pudo registrar la solicitud de soporte")
    return {
        "mensaje": "Solicitud de soporte registrada correctamente",
        "ticket": res.data[0],
    }
