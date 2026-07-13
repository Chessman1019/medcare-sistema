from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from postgrest.exceptions import APIError
from app.database import supabase, supabase_admin
from app.schemas.notificacion import SoporteCreate
from app.services.cita_service import cancelar_citas_vencidas, get_cita
from app.services.security import get_current_user, require_roles
from app.services.notificacion_service import (
    eliminar_notificacion,
    listar_notificaciones_citas,
    marcar_notificacion_leida,
)

router = APIRouter()
ROLES_ADMINISTRATIVOS_NOTIFICACION = {"administrador", "recepcionista"}


def _is_missing_column_error(error: APIError, *columns: str) -> bool:
    text = str(error)
    return "Could not find" in text and "column" in text and any(column in text for column in columns)


def _rol_destino_notificacion(item: dict, estado: dict) -> str | None:
    return estado.get("rol_destino") or item.get("rol_destino")


def _es_notificacion_visible_para_destino(
    item: dict,
    estado: dict,
    *,
    rol_destino: str | None = None,
    excluir_roles: set[str] | None = None,
) -> bool:
    rol = _rol_destino_notificacion(item, estado)
    if rol_destino is not None:
        return rol == rol_destino
    if excluir_roles and rol in excluir_roles:
        return False
    return True


def _aplicar_estado_notificaciones(
    notificaciones: list[dict],
    limit: int,
    *,
    rol_destino: str | None = None,
    excluir_roles: set[str] | None = None,
) -> list[dict]:
    ids = [item.get("id_notif") for item in notificaciones if item.get("id_notif")]
    if not ids:
        return [
            item
            for item in notificaciones
            if _es_notificacion_visible_para_destino(
                item,
                {},
                rol_destino=rol_destino,
                excluir_roles=excluir_roles,
            )
        ][:limit]

    try:
        res = supabase_admin.table("notificacion")\
            .select("id_notif,leida,enviada,eliminada,rol_destino")\
            .in_("id_notif", ids)\
            .execute()
    except APIError as error:
        if not _is_missing_column_error(error, "leida", "eliminada", "rol_destino"):
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
        if not _es_notificacion_visible_para_destino(
            item,
            estado,
            rol_destino=rol_destino,
            excluir_roles=excluir_roles,
        ):
            continue
        visibles.append({
            **item,
            "leida": estado.get("leida", item.get("leida", item.get("enviada", False))),
            "enviada": estado.get("enviada", item.get("enviada", False)),
            "eliminada": False,
            "rol_destino": _rol_destino_notificacion(item, estado),
        })
    return visibles[:limit]


def _listar_notificaciones(
    campo: str | None = None,
    valor: int | None = None,
    limit: int = 20,
    *,
    rol_destino: str | None = None,
    excluir_roles: set[str] | None = None,
):
    query = supabase.table("v_notificaciones_detalle").select("*")
    if campo and valor is not None:
        query = query.eq(campo, valor)
    res = query.order("fecha_programada", desc=True).limit(max(limit * 5, limit)).execute()
    return _aplicar_estado_notificaciones(
        res.data or [],
        limit,
        rol_destino=rol_destino,
        excluir_roles=excluir_roles,
    )


def _obtener_notificacion_detalle(id_notif: int):
    res = (
        supabase.table("v_notificaciones_detalle")
        .select("*")
        .eq("id_notif", id_notif)
        .limit(1)
        .execute()
    )
    if res.data:
        return res.data[0]

    res = (
        supabase_admin.table("notificacion")
        .select("*")
        .eq("id_notif", id_notif)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def _validar_acceso_notificacion(id_notif: int, usuario: dict):
    notificacion = _obtener_notificacion_detalle(id_notif)
    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")

    rol = usuario.get("rol")
    usuario_id = int(usuario["id_usuario"])
    rol_destino = notificacion.get("rol_destino")

    if rol == "paciente":
        if rol_destino and rol_destino != "paciente":
            raise HTTPException(status_code=403, detail="No tienes permiso para esta notificacion")
        if int(notificacion.get("id_paciente") or 0) == usuario_id:
            return notificacion
    elif rol == "doctor":
        if rol_destino and rol_destino != "doctor":
            raise HTTPException(status_code=403, detail="No tienes permiso para esta notificacion")
        if int(notificacion.get("id_doctor") or 0) == usuario_id:
            return notificacion
    elif rol in ROLES_ADMINISTRATIVOS_NOTIFICACION and rol_destino == rol:
        return notificacion

    raise HTTPException(status_code=403, detail="No tienes permiso para esta notificacion")


def _validar_cita_soporte(id_cita: int | None, usuario: dict):
    if id_cita is None or usuario.get("rol") in ROLES_ADMINISTRATIVOS_NOTIFICACION:
        return
    cita = get_cita(id_cita)
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    usuario_id = int(usuario["id_usuario"])
    if usuario.get("rol") == "paciente" and int(cita["id_paciente"]) == usuario_id:
        return
    if usuario.get("rol") == "doctor" and int(cita["id_doctor"]) == usuario_id:
        return
    raise HTTPException(status_code=403, detail="No tienes permiso para asociar esta solicitud a la cita")


@router.get("/paciente/{id_paciente}")
def notificaciones_paciente(id_paciente: int, usuario: dict = Depends(require_roles("paciente"))):
    if id_paciente != int(usuario["id_usuario"]):
        raise HTTPException(status_code=403, detail="No tienes permiso para ver estas notificaciones")
    return _listar_notificaciones(
        "id_paciente",
        id_paciente,
        rol_destino="paciente",
    )


@router.get("/doctor/{id_doctor}")
def notificaciones_doctor(id_doctor: int, usuario: dict = Depends(require_roles("doctor"))):
    if id_doctor != int(usuario["id_usuario"]):
        raise HTTPException(status_code=403, detail="No tienes permiso para ver estas notificaciones")
    return _listar_notificaciones(
        "id_doctor",
        id_doctor,
        rol_destino="doctor",
    )


@router.get("/admin")
def notificaciones_admin(_: dict = Depends(require_roles("administrador"))):
    return _listar_notificaciones(rol_destino="administrador")


@router.get("/citas-pendientes")
def notificaciones_citas_pendientes(
    rol: str | None = Query(default=None),
    usuario: dict = Depends(require_roles("administrador", "recepcionista")),
):
    rol_destino = rol or usuario.get("rol")
    if rol_destino not in ROLES_ADMINISTRATIVOS_NOTIFICACION:
        raise HTTPException(status_code=400, detail="Rol de notificacion no valido")
    if rol_destino != usuario.get("rol"):
        raise HTTPException(status_code=403, detail="No tienes permiso para ver notificaciones de otro rol")
    cancelar_citas_vencidas()
    return listar_notificaciones_citas(rol_destino)


@router.put("/{id_notif}/marcar-enviada")
def marcar_notificacion_enviada(id_notif: int, usuario: dict = Depends(get_current_user)):
    _validar_acceso_notificacion(id_notif, usuario)
    res = supabase_admin.table("notificacion").update({
        "enviada": True,
        "enviado_en": datetime.now(timezone.utc).isoformat(),
    }).eq("id_notif", id_notif).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    return res.data[0]


@router.put("/{id_notif}/marcar-leida")
def marcar_leida(id_notif: int, usuario: dict = Depends(get_current_user)):
    _validar_acceso_notificacion(id_notif, usuario)
    notificacion = marcar_notificacion_leida(id_notif)
    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    return notificacion


@router.delete("/{id_notif}")
def eliminar(id_notif: int, usuario: dict = Depends(get_current_user)):
    _validar_acceso_notificacion(id_notif, usuario)
    notificacion = eliminar_notificacion(id_notif)
    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    return notificacion


@router.post("/soporte")
def crear_solicitud_soporte(data: SoporteCreate, usuario: dict = Depends(get_current_user)):
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
