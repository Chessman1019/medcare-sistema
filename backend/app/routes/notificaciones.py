from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.database import supabase
from app.schemas.notificacion import SoporteCreate

router = APIRouter()


def _listar_notificaciones(campo: str | None = None, valor: int | None = None, limit: int = 20):
    query = supabase.table("v_notificaciones_detalle").select("*")
    if campo and valor is not None:
        query = query.eq(campo, valor)
    res = query.order("fecha_programada", desc=True).limit(limit).execute()
    return res.data or []


def _buscar_cita_contexto(data: SoporteCreate):
    if data.id_cita:
        res = supabase.table("cita").select("*").eq("id_cita", data.id_cita).limit(1).execute()
        return res.data[0] if res.data else None

    rol = data.rol.lower()
    query = supabase.table("cita").select("*")

    if rol == "paciente":
        query = query.eq("id_paciente", data.id_usuario)
    elif rol == "doctor":
        query = query.eq("id_doctor", data.id_usuario)

    res = query.order("fecha_hora", desc=True).limit(1).execute()
    return res.data[0] if res.data else None


@router.get("/paciente/{id_paciente}")
def notificaciones_paciente(id_paciente: int):
    return _listar_notificaciones("id_paciente", id_paciente)


@router.get("/doctor/{id_doctor}")
def notificaciones_doctor(id_doctor: int):
    return _listar_notificaciones("id_doctor", id_doctor)


@router.get("/admin")
def notificaciones_admin():
    return _listar_notificaciones()


@router.put("/{id_notif}/marcar-enviada")
def marcar_notificacion_enviada(id_notif: int):
    res = supabase.table("notificacion").update({
        "enviada": True,
        "enviado_en": datetime.now(timezone.utc).isoformat(),
    }).eq("id_notif", id_notif).execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")

    return res.data[0]


@router.post("/soporte")
def crear_solicitud_soporte(data: SoporteCreate):
    mensaje = data.mensaje.strip()
    if not mensaje:
        raise HTTPException(status_code=400, detail="El mensaje de soporte no puede estar vacio")

    cita = _buscar_cita_contexto(data)
    if not cita:
        raise HTTPException(
            status_code=400,
            detail="No se encontro una cita asociada para registrar la solicitud de soporte",
        )

    contexto = f" ({data.contexto})" if data.contexto else ""
    payload = {
        "id_cita": cita["id_cita"],
        "tipo": "cita_creada",
        "canal": "sistema",
        "mensaje": f"Soporte {data.rol} #{data.id_usuario}{contexto}: {mensaje}",
        "enviada": False,
        "fecha_programada": datetime.now(timezone.utc).isoformat(),
    }

    res = supabase.table("notificacion").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="No se pudo registrar la solicitud de soporte")

    return {
        "mensaje": "Solicitud de soporte registrada correctamente",
        "notificacion": res.data[0],
    }
