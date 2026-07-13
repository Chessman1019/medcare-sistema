from fastapi import APIRouter, Depends, HTTPException
from app.database import supabase
from app.services.security import get_current_user

router = APIRouter()

@router.get("/{id_paciente}")
def get_historial(id_paciente: int, usuario: dict = Depends(get_current_user)):
    rol = usuario.get("rol")
    usuario_id = int(usuario["id_usuario"])
    if rol == "paciente":
        if id_paciente != usuario_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para ver este historial")
    elif rol == "doctor":
        citas = supabase.table("cita")\
            .select("id_cita")\
            .eq("id_doctor", usuario_id)\
            .eq("id_paciente", id_paciente)\
            .limit(1)\
            .execute()
        if not citas.data:
            raise HTTPException(status_code=403, detail="No tienes permiso para ver este historial")
    elif rol != "administrador":
        raise HTTPException(status_code=403, detail="No tienes permiso para ver historiales clinicos")

    res = supabase.table("historial_clinico")\
        .select("*")\
        .eq("id_paciente", id_paciente)\
        .execute()
    return res.data
