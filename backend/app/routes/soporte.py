from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import supabase, supabase_admin
from app.schemas.soporte import SoporteTicketCreate, SoporteTicketUpdate
from app.services.cita_service import get_cita
from app.services.security import get_current_user, require_roles

router = APIRouter()

VALID_ROLES = {"paciente", "doctor", "recepcionista", "administrador"}
VALID_ESTADOS = {"abierto", "en_revision", "resuelto", "cerrado"}
VALID_PRIORIDADES = {"baja", "normal", "alta", "urgente"}


def _normalizar_rol(rol: str) -> str:
    rol_limpio = (rol or "").strip().lower()
    if rol_limpio == "admin":
        rol_limpio = "administrador"
    if rol_limpio not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Rol de soporte no valido")
    return rol_limpio


def _normalizar_prioridad(prioridad: str) -> str:
    prioridad_limpia = (prioridad or "normal").strip().lower()
    if prioridad_limpia not in VALID_PRIORIDADES:
        raise HTTPException(status_code=400, detail="Prioridad de soporte no valida")
    return prioridad_limpia


def _normalizar_estado(estado: str) -> str:
    estado_limpio = (estado or "").strip().lower()
    if estado_limpio not in VALID_ESTADOS:
        raise HTTPException(status_code=400, detail="Estado de soporte no valido")
    return estado_limpio


def _es_personal_autorizado(usuario: dict) -> bool:
    return usuario.get("rol") in {"administrador", "recepcionista"}


def _validar_cita_soporte(id_cita: int | None, usuario: dict):
    if id_cita is None or _es_personal_autorizado(usuario):
        return
    cita = get_cita(id_cita)
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    usuario_id = int(usuario["id_usuario"])
    if usuario.get("rol") == "paciente" and int(cita["id_paciente"]) == usuario_id:
        return
    if usuario.get("rol") == "doctor" and int(cita["id_doctor"]) == usuario_id:
        return
    raise HTTPException(status_code=403, detail="No tienes permiso para asociar este ticket a la cita")


@router.get("/tickets")
def listar_tickets_soporte(
    rol: Optional[str] = Query(default=None),
    id_usuario: Optional[int] = Query(default=None),
    estado: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    usuario: dict = Depends(get_current_user),
):
    query = supabase.table("v_soporte_ticket_detalle").select("*")
    if _es_personal_autorizado(usuario):
        if rol:
            query = query.eq("rol", _normalizar_rol(rol))
        if id_usuario is not None:
            query = query.eq("id_usuario", id_usuario)
    else:
        if id_usuario is not None and id_usuario != int(usuario["id_usuario"]):
            raise HTTPException(status_code=403, detail="No tienes permiso para ver tickets de otro usuario")
        if rol and _normalizar_rol(rol) != usuario["rol"]:
            raise HTTPException(status_code=403, detail="No tienes permiso para ver tickets de otro rol")
        query = query.eq("id_usuario", usuario["id_usuario"]).eq("rol", usuario["rol"])
    if estado:
        query = query.eq("estado", _normalizar_estado(estado))
    res = query.order("fecha_actualizacion", desc=True).limit(limit).execute()
    return res.data or []


@router.post("/tickets")
def crear_ticket_soporte(data: SoporteTicketCreate, usuario: dict = Depends(get_current_user)):
    mensaje = data.mensaje.strip()
    if not mensaje:
        raise HTTPException(status_code=400, detail="El mensaje de soporte no puede estar vacio")
    _validar_cita_soporte(data.id_cita, usuario)
    payload = {
        "id_usuario": usuario["id_usuario"],
        "rol": usuario["rol"],
        "contexto": data.contexto,
        "mensaje": mensaje,
        "id_cita": data.id_cita,
        "prioridad": _normalizar_prioridad(data.prioridad),
        "estado": "abierto",
    }
    res = supabase_admin.table("soporte_ticket").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="No se pudo registrar el ticket de soporte")
    return {
        "mensaje": "Ticket de soporte registrado correctamente",
        "ticket": res.data[0],
    }


@router.put("/tickets/{id_ticket}/estado")
def actualizar_estado_ticket(
    id_ticket: int,
    data: SoporteTicketUpdate,
    _: dict = Depends(require_roles("administrador", "recepcionista")),
):
    estado = _normalizar_estado(data.estado)
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "estado": estado,
        "fecha_actualizacion": now,
    }
    if data.respuesta is not None:
        payload["respuesta"] = data.respuesta.strip() or None
    if data.asignado_a is not None:
        payload["asignado_a"] = data.asignado_a
    if estado in {"resuelto", "cerrado"}:
        payload["cerrado_en"] = now
    else:
        payload["cerrado_en"] = None
    res = supabase_admin.table("soporte_ticket").update(payload).eq("id_ticket", id_ticket).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Ticket de soporte no encontrado")
    return res.data[0]
