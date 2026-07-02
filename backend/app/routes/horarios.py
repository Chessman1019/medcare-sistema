from fastapi import APIRouter, Depends, HTTPException

from app.schemas.horario import HorarioDisponibleCreate
from app.services.cita_service import crear_horario_disponible, get_horarios_libres
from app.services.security import get_current_user, require_admin_or_reception

router = APIRouter()


@router.get("/{id_doctor}")
def horarios_doctor(id_doctor: int, _: dict = Depends(get_current_user)):
    return get_horarios_libres(id_doctor)


@router.post("/")
def crear_horario(data: HorarioDisponibleCreate, _: dict = Depends(require_admin_or_reception)):
    try:
        horario = crear_horario_disponible(data.model_dump())
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    if not horario:
        raise HTTPException(status_code=400, detail="No se pudo registrar el horario disponible")
    return horario
