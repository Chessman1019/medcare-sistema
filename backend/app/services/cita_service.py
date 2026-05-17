from app.database import supabase

ESTADOS_CITA = {
    "pendiente",
    "confirmada",
    "reprogramada",
    "cancelada",
    "en_atencion",
    "completada",
}

def get_horarios_libres(id_doctor: int):
    res = supabase.table("horario_disponible")\
        .select("*")\
        .eq("id_doctor", id_doctor)\
        .eq("ocupado", False)\
        .execute()
    return res.data

def crear_cita(data: dict):
    res = supabase.table("cita").insert(data).execute()
    cita = res.data[0] if res.data else None
    if cita and data.get("id_horario"):
        supabase.table("horario_disponible")\
            .update({"ocupado": True})\
            .eq("id_horario", data["id_horario"])\
            .execute()
    return cita

def get_citas_paciente(id_paciente: int):
    res = supabase.table("v_citas_detalle")\
        .select("*")\
        .eq("id_paciente", id_paciente)\
        .order("fecha_hora", desc=True)\
        .execute()
    return res.data

def get_citas_doctor(id_doctor: int):
    res = supabase.table("v_citas_detalle")\
        .select("*")\
        .eq("id_doctor", id_doctor)\
        .order("fecha_hora")\
        .execute()
    return res.data

def cancelar_cita(id_cita: int):
    cita = get_cita(id_cita)
    res = supabase.table("cita")\
        .update({"estado": "cancelada"})\
        .eq("id_cita", id_cita)\
        .execute()
    if cita and cita.get("id_horario"):
        liberar_horario(cita["id_horario"])
    return res.data

def get_cita(id_cita: int):
    res = supabase.table("cita")\
        .select("*")\
        .eq("id_cita", id_cita)\
        .execute()
    return res.data[0] if res.data else None

def cambiar_estado_cita(id_cita: int, estado: str):
    if estado not in ESTADOS_CITA:
        raise ValueError("Estado de cita no permitido")
    res = supabase.table("cita")\
        .update({"estado": estado})\
        .eq("id_cita", id_cita)\
        .execute()
    return res.data

def liberar_horario(id_horario: int):
    return supabase.table("horario_disponible")\
        .update({"ocupado": False})\
        .eq("id_horario", id_horario)\
        .execute()

def ocupar_horario(id_horario: int):
    return supabase.table("horario_disponible")\
        .update({"ocupado": True})\
        .eq("id_horario", id_horario)\
        .execute()

def reprogramar_cita(id_cita: int, id_horario: int, fecha_hora: str):
    cita = get_cita(id_cita)
    if not cita:
        return None
    if cita.get("estado") in ("cancelada", "completada"):
        raise ValueError("No se puede reprogramar una cita cancelada o completada")

    horario_anterior = cita.get("id_horario")
    res = supabase.table("cita")\
        .update({
            "id_horario": id_horario,
            "fecha_hora": fecha_hora,
            "estado": "reprogramada",
        })\
        .eq("id_cita", id_cita)\
        .execute()

    if horario_anterior and horario_anterior != id_horario:
        liberar_horario(horario_anterior)
    ocupar_horario(id_horario)
    return res.data

def registrar_atencion(id_cita: int, data: dict):
    cita = get_cita(id_cita)
    if not cita:
        return None

    fecha_atencion = str(cita["fecha_hora"]).split("T")[0]
    payload = {
        "id_cita": id_cita,
        "id_paciente": cita["id_paciente"],
        "fecha_atencion": fecha_atencion,
        "diagnostico": data["diagnostico"],
        "observaciones": data.get("observaciones"),
        "tratamiento": data.get("tratamiento"),
    }

    res = supabase.table("historial_clinico").insert(payload).execute()
    cambiar_estado_cita(id_cita, "completada")
    return res.data
