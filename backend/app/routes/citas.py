from fastapi import APIRouter, HTTPException
from app.schemas.cita import CitaCreate, CitaUpdate
from app.services.cita_service import crear_cita, get_citas_paciente, get_citas_doctor, cancelar_cita
from app.database import supabase

router = APIRouter()

@router.post("/")
def nueva_cita(data: CitaCreate, id_paciente: int):
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
    return cita

@router.get("/todas")
def todas_las_citas():
    res = supabase.table("v_citas_detalle").select("*").order("fecha_hora", desc=True).execute()
    return res.data

@router.get("/hoy")
def citas_hoy():
    from datetime import date
    hoy = str(date.today())
    res = supabase.table("v_citas_detalle").select("*").gte("fecha_hora", f"{hoy}T00:00:00").lte("fecha_hora", f"{hoy}T23:59:59").execute()
    return res.data

@router.get("/stats")
def estadisticas():
    citas = supabase.table("cita").select("estado").execute().data
    pacientes = supabase.table("paciente").select("id_usuario").execute().data
    doctores = supabase.table("doctor").select("id_usuario, disponible").execute().data
    especialidades = supabase.table("especialidad").select("id_especialidad").execute().data
    horarios_libres = supabase.table("horario_disponible").select("id_horario").eq("ocupado", False).execute().data
    lista_espera = supabase.table("lista_espera").select("id_espera").eq("estado", "en_espera").execute().data
    from datetime import date
    hoy = str(date.today())
    citas_hoy = supabase.table("cita").select("estado").gte("fecha_hora", f"{hoy}T00:00:00").lte("fecha_hora", f"{hoy}T23:59:59").execute().data
    return {
        "total_citas": len(citas),
        "citas_hoy": len(citas_hoy),
        "confirmadas_hoy": len([c for c in citas_hoy if c["estado"] == "confirmada"]),
        "canceladas_hoy": len([c for c in citas_hoy if c["estado"] == "cancelada"]),
        "pendientes": len([c for c in citas if c["estado"] == "pendiente"]),
        "total_pacientes": len(pacientes),
        "doctores_activos": len([d for d in doctores if d["disponible"]]),
        "total_especialidades": len(especialidades),
        "horarios_libres": len(horarios_libres),
        "lista_espera": len(lista_espera),
    }

@router.get("/paciente/{id_paciente}")
def citas_paciente(id_paciente: int):
    return get_citas_paciente(id_paciente)

@router.get("/doctor/{id_doctor}")
def citas_doctor(id_doctor: int):
    return get_citas_doctor(id_doctor)

@router.put("/{id_cita}/cancelar")
def cancelar(id_cita: int):
    return cancelar_cita(id_cita)

@router.put("/{id_cita}/confirmar")
def confirmar(id_cita: int):
    res = supabase.table("cita").update({"estado": "confirmada"}).eq("id_cita", id_cita).execute()
    return res.data

@router.put("/{id_cita}/completar")
def completar(id_cita: int):
    res = supabase.table("cita").update({"estado": "completada"}).eq("id_cita", id_cita).execute()
    return res.data