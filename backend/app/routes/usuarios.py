from fastapi import APIRouter
from app.database import supabase

router = APIRouter()

@router.get("/especialidades")
def get_especialidades():
    res = supabase.table("especialidad").select("*").execute()
    return res.data

@router.get("/doctores")
def get_doctores():
    res = supabase.table("usuario").select("*, doctor(*, especialidad(*))").eq("tipo_usuario", "doctor").execute()
    return res.data

@router.get("/doctores/{id_especialidad}")
def get_doctores_por_especialidad(id_especialidad: int):
    res = supabase.table("doctor").select("*, usuario(*)").eq("id_especialidad", id_especialidad).execute()
    return res.data

@router.get("/pacientes")
def get_pacientes():
    res = supabase.table("usuario").select("*, paciente(*)").eq("tipo_usuario", "paciente").execute()
    return res.data

@router.get("/lista-espera")
def get_lista_espera():
    res = supabase.table("lista_espera").select("*, paciente(*, usuario(*)), especialidad(*)").eq("estado", "en_espera").execute()
    return res.data