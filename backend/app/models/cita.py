from datetime import date
from fastapi import APIRouter, Depends, Header, HTTPException
from app.schemas.cita import AtencionCreate, CitaCreate, CitaReprogramar
from app.services.auth_service import decode_token
from app.services.cita_service import (
    cancelar_cita,
    cambiar_estado_cita,
    crear_cita,
    get_citas_doctor,
    get_citas_paciente,
    registrar_atencion,
    reprogramar_cita,
)
from app.database import supabase

router = APIRouter()


def _get_current_user(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    payload = decode_token(authorization.replace("Bearer ", "", 1).strip())
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Token invalido")
    return payload


def _require_roles(*roles):
    def dependency(usuario: dict = Depends(_get_current_user)):
        if usuario.get("rol") not in roles:
            raise HTTPException(status_code=403, detail="No tienes permiso para esta accion")
        return usuario
    return dependency


@router.post("/")
def nueva_cita(data: CitaCreate, id_paciente: int, _: dict = Depends(_get_current_user)):
    cita = crear_cita({
        "id_paciente": id_paciente,
        "id_doctor": data.id_doctor,
        "id_horario": data.id_horario,
        "fecha_hora": str(data.fecha_hora),
        "motivo": data.motivo,
        "tipo_atencion": data.tipo_atencion,
        "duracion_min": data.duracion_min,
        "estado": "pendiente"
    })
    if not cita:
        raise HTTPException(status_code=400, detail="No se pudo registrar la cita")
    return cita


@router.get("/todas")
def todas_las_citas(_: dict = Depends(_require_roles("administrador", "recepcionista"))):
    res = supabase.table("v_citas_detalle").select("*").order("fecha_hora", desc=True).execute()
    return res.data


@router.get("/hoy")
def citas_hoy(_: dict = Depends(_require_roles("administrador", "recepcionista", "doctor"))):
    hoy = str(date.today())
    res = supabase.table("v_citas_detalle").select("*")\
        .gte("fecha_hora", f"{hoy}T00:00:00")\
        .lte("fecha_hora", f"{hoy}T23:59:59")\
        .execute()
    return res.data


@router.get("/stats")
def estadisticas(_: dict = Depends(_require_roles("administrador", "recepcionista"))):
    citas = supabase.table("cita").select("estado").execute().data
    pacientes = supabase.table("paciente").select("id_usuario").execute().data
    doctores = supabase.table("doctor").select("id_usuario, disponible").execute().data
    especialidades = supabase.table("especialidad").select("id_especialidad").execute().data
    horarios_libres = supabase.table("horario_disponible").select("id_horario").eq("ocupado", False).execute().data
    lista_espera = supabase.table("lista_espera").select("id_espera").eq("estado", "en_espera").execute().data
    hoy = str(date.today())
    citas_hoy = supabase.table("cita").select("estado")\
        .gte("fecha_hora", f"{hoy}T00:00:00")\
        .lte("fecha_hora", f"{hoy}T23:59:59")\
        .execute().data
    return {
        "total_citas": len(citas),
        "citas_hoy": len(citas_hoy),
        "confirmadas_hoy": len([c for c in citas_hoy if c["estado"] == "confirmada"]),
        "canceladas_hoy": len([c for c in citas_hoy if c["estado"] == "cancelada"]),
        "en_atencion_hoy": len([c for c in citas_hoy if c["estado"] == "en_atencion"]),
        "completadas_hoy": len([c for c in citas_hoy if c["estado"] == "completada"]),
        "pendientes": len([c for c in citas if c["estado"] == "pendiente"]),
        "total_pacientes": len(pacientes),
        "doctores_activos": len([d for d in doctores if d["disponible"]]),
        "total_especialidades": len(especialidades),
        "horarios_libres": len(horarios_libres),
        "lista_espera": len(lista_espera),
    }


@router.get("/paciente/{id_paciente}")
def citas_paciente(id_paciente: int, _: dict = Depends(_get_current_user)):
    return get_citas_paciente(id_paciente)


@router.get("/doctor/{id_doctor}")
def citas_doctor(id_doctor: int, _: dict = Depends(_get_current_user)):
    return get_citas_doctor(id_doctor)


@router.put("/{id_cita}/cancelar")
def cancelar(id_cita: int, _: dict = Depends(_get_current_user)):
    return cancelar_cita(id_cita)


@router.put("/{id_cita}/confirmar")
def confirmar(id_cita: int, _: dict = Depends(_require_roles("administrador", "recepcionista"))):
    return cambiar_estado_cita(id_cita, "confirmada")


@router.put("/{id_cita}/asistencia")
def registrar_asistencia(id_cita: int, _: dict = Depends(_require_roles("administrador", "recepcionista"))):
    return cambiar_estado_cita(id_cita, "en_atencion")


@router.put("/{id_cita}/reprogramar")
def reprogramar(id_cita: int, data: CitaReprogramar, _: dict = Depends(_get_current_user)):
    try:
        cita = reprogramar_cita(id_cita, data.id_horario, str(data.fecha_hora))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return cita


@router.post("/{id_cita}/atencion")
def atender(id_cita: int, data: AtencionCreate, _: dict = Depends(_require_roles("doctor"))):
    try:
        atencion = registrar_atencion(id_cita, data.model_dump())
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"No se pudo registrar la atencion: {error}")
    if not atencion:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return atencion


@router.put("/{id_cita}/completar")
def completar(id_cita: int, _: dict = Depends(_require_roles("doctor", "administrador", "recepcionista"))):
    return cambiar_estado_cita(id_cita, "completada")


@router.put("/{id_cita}/salida")
def registrar_salida(id_cita: int, _: dict = Depends(_require_roles("doctor", "administrador", "recepcionista"))):
    return cambiar_estado_cita(id_cita, "completada")