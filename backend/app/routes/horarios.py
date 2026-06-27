from fastapi import APIRouter, Depends, Header, HTTPException

from app.schemas.horario import HorarioDisponibleCreate
from app.services.auth_service import decode_token
from app.services.cita_service import crear_horario_disponible, get_horarios_libres

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


@router.get("/{id_doctor}")
def horarios_doctor(id_doctor: int):
    return get_horarios_libres(id_doctor)


@router.post("/")
def crear_horario(data: HorarioDisponibleCreate, _: dict = Depends(_require_roles("administrador", "recepcionista"))):
    try:
        horario = crear_horario_disponible(data.model_dump())
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    if not horario:
        raise HTTPException(status_code=400, detail="No se pudo registrar el horario disponible")
    return horario
