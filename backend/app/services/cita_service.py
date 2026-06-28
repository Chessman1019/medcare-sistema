from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo
from zoneinfo import ZoneInfoNotFoundError

from app.database import supabase, supabase_admin
from app.services.notificacion_service import marcar_notificaciones_cita_leidas

try:
    LIMA_TZ = ZoneInfo("America/Lima")
except ZoneInfoNotFoundError:
    LIMA_TZ = timezone(timedelta(hours=-5), name="America/Lima")

ESTADOS_CITA = {
    "pendiente", "confirmada", "reprogramada",
    "cancelada", "en_atencion", "completada",
}


def now_lima() -> datetime:
    return datetime.now(LIMA_TZ)


def get_lima_today() -> date:
    return now_lima().date()


def get_lima_day_bounds(fecha: date | None = None) -> tuple[str, str]:
    dia = fecha or get_lima_today()
    inicio = datetime.combine(dia, time.min, tzinfo=LIMA_TZ)
    fin = datetime.combine(dia, time.max, tzinfo=LIMA_TZ)
    return inicio.isoformat(), fin.isoformat()


def _parse_date(value) -> date:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    return date.fromisoformat(str(value)[:10])


def _parse_time(value) -> time:
    if isinstance(value, time):
        return value.replace(tzinfo=None)
    text = str(value).strip()
    if "+" in text:
        text = text.split("+", 1)[0]
    if "-" in text[1:]:
        text = text.rsplit("-", 1)[0]
    return time.fromisoformat(text)


def _date_str(value) -> str:
    return _parse_date(value).isoformat()


def _time_str(value) -> str:
    return _parse_time(value).strftime("%H:%M:%S")


def _horario_datetime(horario: dict) -> datetime:
    return datetime.combine(
        _parse_date(horario["fecha"]),
        _parse_time(horario["hora_inicio"]),
        tzinfo=LIMA_TZ,
    )


def is_horario_futuro(horario: dict) -> bool:
    return _horario_datetime(horario) > now_lima()


def _validar_rango_horario(fecha, hora_inicio, hora_fin) -> tuple[str, str, str]:
    fecha_valor = _parse_date(fecha)
    inicio_valor = _parse_time(hora_inicio)
    fin_valor = _parse_time(hora_fin)

    if fin_valor <= inicio_valor:
        raise ValueError("La hora de fin debe ser posterior a la hora de inicio")

    inicio_lima = datetime.combine(fecha_valor, inicio_valor, tzinfo=LIMA_TZ)
    if inicio_lima <= now_lima():
        raise ValueError("No se pueden registrar horarios en fechas u horas pasadas")

    return fecha_valor.isoformat(), inicio_valor.strftime("%H:%M:%S"), fin_valor.strftime("%H:%M:%S")


def _validar_doctor(id_doctor: int):
    res = supabase.table("doctor").select("id_usuario").eq("id_usuario", id_doctor).limit(1).execute()
    if not res.data:
        raise ValueError("Doctor no encontrado")


def _validar_horario_duplicado(id_doctor: int, fecha: str, hora_inicio: str):
    res = supabase.table("horario_disponible")\
        .select("id_horario")\
        .eq("id_doctor", id_doctor)\
        .eq("fecha", fecha)\
        .eq("hora_inicio", hora_inicio)\
        .limit(1)\
        .execute()
    if res.data:
        raise ValueError("Ya existe un horario disponible para ese doctor en esa fecha y hora")


def get_horario(id_horario: int):
    res = supabase.table("horario_disponible")\
        .select("*")\
        .eq("id_horario", id_horario)\
        .limit(1)\
        .execute()
    return res.data[0] if res.data else None


def validar_horario_para_cita(id_horario: int, id_doctor: int | None = None, id_horario_actual: int | None = None):
    horario = get_horario(id_horario)
    if not horario:
        raise ValueError("Horario no encontrado")
    if id_doctor is not None and int(horario["id_doctor"]) != int(id_doctor):
        raise ValueError("El horario seleccionado no pertenece al doctor indicado")
    if horario.get("ocupado") and int(id_horario) != int(id_horario_actual or 0):
        raise ValueError("El horario seleccionado ya se encuentra ocupado")
    if not is_horario_futuro(horario):
        raise ValueError("El horario seleccionado ya no esta disponible")
    return horario


def get_horarios_libres(id_doctor: int):
    res = supabase.table("horario_disponible")\
        .select("*")\
        .eq("id_doctor", id_doctor)\
        .eq("ocupado", False)\
        .gte("fecha", get_lima_today().isoformat())\
        .order("fecha")\
        .order("hora_inicio")\
        .execute()
    return [horario for horario in (res.data or []) if is_horario_futuro(horario)]


def contar_horarios_libres_futuros() -> int:
    res = supabase.table("horario_disponible")\
        .select("*")\
        .eq("ocupado", False)\
        .gte("fecha", get_lima_today().isoformat())\
        .execute()
    return len([horario for horario in (res.data or []) if is_horario_futuro(horario)])


def crear_horario_disponible(data: dict):
    id_doctor = int(data["id_doctor"])
    fecha, hora_inicio, hora_fin = _validar_rango_horario(
        data["fecha"],
        data["hora_inicio"],
        data["hora_fin"],
    )
    _validar_doctor(id_doctor)
    _validar_horario_duplicado(id_doctor, fecha, hora_inicio)

    res = supabase_admin.table("horario_disponible").insert({
        "id_doctor": id_doctor,
        "fecha": fecha,
        "hora_inicio": hora_inicio,
        "hora_fin": hora_fin,
        "ocupado": False,
    }).execute()
    return res.data[0] if res.data else None

def crear_cita(data: dict):
    horario = validar_horario_para_cita(data["id_horario"], data.get("id_doctor"))
    data = dict(data)
    data["id_doctor"] = horario["id_doctor"]
    data["fecha_hora"] = _horario_datetime(horario).isoformat()
    res = supabase_admin.table("cita").insert(data).execute()
    cita = res.data[0] if res.data else None
    if cita and data.get("id_horario"):
        supabase_admin.table("horario_disponible")\
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
    res = supabase_admin.table("cita")\
        .update({"estado": "cancelada"})\
        .eq("id_cita", id_cita)\
        .execute()
    marcar_notificaciones_cita_leidas(id_cita)
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
    res = supabase_admin.table("cita")\
        .update({"estado": estado})\
        .eq("id_cita", id_cita)\
        .execute()
    if estado in {"confirmada", "cancelada"}:
        marcar_notificaciones_cita_leidas(id_cita)
    return res.data

def liberar_horario(id_horario: int):
    return supabase_admin.table("horario_disponible")\
        .update({"ocupado": False})\
        .eq("id_horario", id_horario)\
        .execute()

def ocupar_horario(id_horario: int):
    return supabase_admin.table("horario_disponible")\
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
    horario = validar_horario_para_cita(id_horario, id_horario_actual=horario_anterior)
    res = supabase_admin.table("cita")\
        .update({
            "id_horario": id_horario,
            "id_doctor": horario["id_doctor"],
            "fecha_hora": _horario_datetime(horario).isoformat(),
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
    res = supabase_admin.table("historial_clinico").insert(payload).execute()
    cambiar_estado_cita(id_cita, "completada")
    return res.data
