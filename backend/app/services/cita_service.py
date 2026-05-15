from app.database import supabase

def get_horarios_libres(id_doctor: int):
    res = supabase.table("horario_disponible")\
        .select("*")\
        .eq("id_doctor", id_doctor)\
        .eq("ocupado", False)\
        .execute()
    return res.data

def crear_cita(data: dict):
    res = supabase.table("cita").insert(data).execute()
    return res.data[0] if res.data else None

def get_citas_paciente(id_paciente: int):
    res = supabase.table("v_citas_detalle")\
        .select("*")\
        .eq("id_paciente", id_paciente)\
        .execute()
    return res.data

def get_citas_doctor(id_doctor: int):
    res = supabase.table("v_citas_detalle")\
        .select("*")\
        .eq("id_doctor", id_doctor)\
        .execute()
    return res.data

def cancelar_cita(id_cita: int):
    res = supabase.table("cita")\
        .update({"estado": "cancelada"})\
        .eq("id_cita", id_cita)\
        .execute()
    return res.data