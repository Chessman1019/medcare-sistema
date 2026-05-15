from fastapi import APIRouter
from app.database import supabase

router = APIRouter()

@router.get("/{id_paciente}")
def get_historial(id_paciente: int):
    res = supabase.table("historial_clinico")\
        .select("*")\
        .eq("id_paciente", id_paciente)\
        .execute()
    return res.data