from fastapi import APIRouter
from app.services.cita_service import get_horarios_libres
from app.database import supabase

router = APIRouter()

@router.get("/{id_doctor}")
def horarios_doctor(id_doctor: int):
    return get_horarios_libres(id_doctor)