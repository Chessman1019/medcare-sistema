from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo
from zoneinfo import ZoneInfoNotFoundError

from postgrest.exceptions import APIError

from app.database import supabase, supabase_admin
from app.services.notificacion_service import (
    marcar_notificaciones_cita_leidas,
    notificar_cita_cancelada,
    notificar_cita_confirmada,
    notificar_cita_finalizada_pendiente,
    notificar_cita_pendiente,
    notificar_cita_reprogramada,
)

try:
    LIMA_TZ = ZoneInfo("America/Lima")
except ZoneInfoNotFoundError:
    LIMA_TZ = timezone(timedelta(hours=-5), name="America/Lima")

ESTADOS_CITA = {
    "pendiente", "confirmada", "reprogramada",
    "cancelada", "en_atencion", "completada",
}
ESTADOS_CONFLICTO_CITA = {"pendiente", "confirmada", "reprogramada", "en_atencion"}
ESTADOS_AUTO_CANCELABLES = {"pendiente", "reprogramada"}
ESTADOS_REVISION_VENCIMIENTO = ESTADOS_AUTO_CANCELABLES | {"confirmada"}
TRANSICIONES_ESTADO_CITA = {
    "pendiente": {"confirmada", "cancelada", "reprogramada"},
    "confirmada": {"en_atencion", "completada", "cancelada", "reprogramada"},
    "reprogramada": {"confirmada", "en_atencion", "completada", "cancelada", "reprogramada"},
    "en_atencion": {"completada", "cancelada"},
    "cancelada": set(),
    "completada": set(),
}
MENSAJE_CONFLICTO_HORARIO = (
    "Este horario ya no está disponible. El doctor tiene otra cita programada "
    "en ese rango de tiempo. Selecciona otro horario."
)


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


def _parse_datetime(value) -> datetime:
    if isinstance(value, datetime):
        parsed = value
    else:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=LIMA_TZ)
    return parsed.astimezone(LIMA_TZ)


def _horario_datetime(horario: dict) -> datetime:
    return datetime.combine(
        _parse_date(horario["fecha"]),
        _parse_time(horario["hora_inicio"]),
        tzinfo=LIMA_TZ,
    )


def _duracion_cita(cita: dict) -> int:
    try:
        return max(int(cita.get("duracion_min") or 30), 0)
    except (TypeError, ValueError):
        return 30


def _fecha_fin_cita(cita: dict) -> datetime | None:
    try:
        fecha_hora = _parse_datetime(cita["fecha_hora"])
    except (KeyError, TypeError, ValueError):
        return None

    if cita.get("hora_fin"):
        try:
            fecha_base = _parse_date(cita.get("fecha_horario") or fecha_hora.date())
            fecha_fin = datetime.combine(fecha_base, _parse_time(cita["hora_fin"]), tzinfo=LIMA_TZ)
            if fecha_fin <= fecha_hora:
                fecha_fin += timedelta(days=1)
            return fecha_fin
        except (TypeError, ValueError):
            pass

    return fecha_hora + timedelta(minutes=_duracion_cita(cita))


def _horario_fin_datetime(horario: dict) -> datetime:
    inicio = _horario_datetime(horario)
    fecha_fin = datetime.combine(
        _parse_date(horario["fecha"]),
        _parse_time(horario["hora_fin"]),
        tzinfo=LIMA_TZ,
    )
    if fecha_fin <= inicio:
        fecha_fin += timedelta(days=1)
    return fecha_fin


def _rangos_solapados(inicio_a: datetime, fin_a: datetime, inicio_b: datetime, fin_b: datetime) -> bool:
    return inicio_a < fin_b and fin_a > inicio_b


def is_horario_futuro(horario: dict) -> bool:
    return _horario_datetime(horario) > now_lima()


def is_cita_vencida(cita: dict) -> bool:
    if cita.get("estado") not in ESTADOS_AUTO_CANCELABLES:
        return False
    fecha_fin = _fecha_fin_cita(cita)
    if not fecha_fin:
        return False
    return fecha_fin <= now_lima()


def _is_on_conflict_constraint_error(error: APIError) -> bool:
    text = str(error)
    return "42P10" in text or "no unique or exclusion constraint matching the ON CONFLICT specification" in text


def _is_db_horario_conflict_error(error: APIError) -> bool:
    text = str(error).lower()
    return (
        "otra cita programada" in text
        or "horario ya no" in text
        or "solap" in text
        or "se cruza" in text
    )


def _raise_cita_update_error(error: APIError):
    if _is_on_conflict_constraint_error(error):
        raise ValueError("Hay un trigger antiguo de notificaciones en la base de datos. Ejecuta la migracion 20260628_desactivar_triggers_notificacion_cita.sql.")
    raise error


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


def _validar_horario_disponible_solapado(id_doctor: int, fecha: str, hora_inicio: str, hora_fin: str):
    inicio_nuevo = _parse_time(hora_inicio)
    fin_nuevo = _parse_time(hora_fin)
    res = supabase.table("horario_disponible")\
        .select("id_horario,hora_inicio,hora_fin")\
        .eq("id_doctor", id_doctor)\
        .eq("fecha", fecha)\
        .execute()
    for horario in res.data or []:
        inicio_existente = _parse_time(horario["hora_inicio"])
        fin_existente = _parse_time(horario["hora_fin"])
        if inicio_nuevo < fin_existente and fin_nuevo > inicio_existente:
            raise ValueError("El doctor ya tiene un horario disponible que se cruza con ese rango de tiempo")


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
        raise ValueError("Este horario ya no esta disponible. Selecciona otro horario.")
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
    horarios_libres = []
    for horario in res.data or []:
        if not is_horario_futuro(horario):
            continue
        try:
            validar_conflicto_horario_cita(horario)
        except ValueError:
            continue
        horarios_libres.append(horario)
    return horarios_libres


def contar_horarios_libres_futuros() -> int:
    res = supabase.table("horario_disponible")\
        .select("*")\
        .eq("ocupado", False)\
        .gte("fecha", get_lima_today().isoformat())\
        .execute()
    total = 0
    for horario in res.data or []:
        if not is_horario_futuro(horario):
            continue
        try:
            validar_conflicto_horario_cita(horario)
        except ValueError:
            continue
        total += 1
    return total


def validar_conflicto_cita_doctor(
    id_doctor: int,
    fecha_inicio: datetime,
    fecha_fin: datetime,
    id_cita_actual: int | None = None,
):
    res = supabase_admin.table("cita")\
        .select("id_cita,id_horario,fecha_hora,duracion_min,estado")\
        .eq("id_doctor", id_doctor)\
        .in_("estado", list(ESTADOS_CONFLICTO_CITA))\
        .execute()

    for cita in _citas_con_horarios(res.data or []):
        if id_cita_actual is not None and int(cita["id_cita"]) == int(id_cita_actual):
            continue
        inicio_existente = _parse_datetime(cita["fecha_hora"])
        fin_existente = _fecha_fin_cita(cita)
        if not fin_existente:
            continue
        if _rangos_solapados(fecha_inicio, fecha_fin, inicio_existente, fin_existente):
            raise ValueError(MENSAJE_CONFLICTO_HORARIO)


def validar_conflicto_horario_cita(horario: dict, id_cita_actual: int | None = None):
    validar_conflicto_cita_doctor(
        int(horario["id_doctor"]),
        _horario_datetime(horario),
        _horario_fin_datetime(horario),
        id_cita_actual=id_cita_actual,
    )


def crear_horario_disponible(data: dict):
    id_doctor = int(data["id_doctor"])
    fecha, hora_inicio, hora_fin = _validar_rango_horario(
        data["fecha"],
        data["hora_inicio"],
        data["hora_fin"],
    )
    _validar_doctor(id_doctor)
    _validar_horario_duplicado(id_doctor, fecha, hora_inicio)
    _validar_horario_disponible_solapado(id_doctor, fecha, hora_inicio, hora_fin)

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
    validar_conflicto_horario_cita(horario)

    reserva = supabase_admin.table("horario_disponible")\
        .update({"ocupado": True})\
        .eq("id_horario", data["id_horario"])\
        .eq("ocupado", False)\
        .execute()
    if not reserva.data:
        raise ValueError("Este horario ya no esta disponible. Selecciona otro horario.")

    data = dict(data)
    data["id_doctor"] = horario["id_doctor"]
    data["fecha_hora"] = _horario_datetime(horario).isoformat()
    try:
        res = supabase_admin.table("cita").insert(data).execute()
    except APIError as error:
        liberar_horario(data["id_horario"])
        if _is_db_horario_conflict_error(error):
            raise ValueError(MENSAJE_CONFLICTO_HORARIO) from error
        raise
    cita = res.data[0] if res.data else None
    if not cita:
        liberar_horario(data["id_horario"])
    else:
        notificar_cita_pendiente(cita)
    return cita

def get_citas_paciente(id_paciente: int):
    cancelar_citas_vencidas()
    res = supabase.table("v_citas_detalle")\
        .select("*")\
        .eq("id_paciente", id_paciente)\
        .order("fecha_hora", desc=True)\
        .execute()
    return agregar_fecha_fin_citas(res.data or [])

def get_citas_doctor(id_doctor: int):
    cancelar_citas_vencidas()
    res = supabase.table("v_citas_detalle")\
        .select("*")\
        .eq("id_doctor", id_doctor)\
        .order("fecha_hora")\
        .execute()
    return agregar_fecha_fin_citas(res.data or [])


def _citas_con_horarios(citas: list[dict]) -> list[dict]:
    ids_horario = sorted({cita.get("id_horario") for cita in citas if cita.get("id_horario")})
    if not ids_horario:
        return citas

    horarios = {}
    try:
        res = supabase_admin.table("horario_disponible")\
            .select("id_horario,fecha,hora_fin")\
            .in_("id_horario", ids_horario)\
            .execute()
        horarios = {item.get("id_horario"): item for item in (res.data or [])}
    except APIError:
        horarios = {}

    return [
        {
            **cita,
            "fecha_horario": horarios.get(cita.get("id_horario"), {}).get("fecha"),
            "hora_fin": horarios.get(cita.get("id_horario"), {}).get("hora_fin"),
        }
        for cita in citas
    ]


def agregar_fecha_fin_citas(citas: list[dict]) -> list[dict]:
    citas = _citas_con_horarios(citas)
    resultado = []
    for cita in citas:
        fecha_fin = _fecha_fin_cita(cita)
        resultado.append({
            **cita,
            "fecha_fin": fecha_fin.isoformat() if fecha_fin else None,
        })
    return resultado


def _normalizar_doctor_relacion(doctor_relacion):
    if isinstance(doctor_relacion, list):
        return doctor_relacion[0] if doctor_relacion else {}
    return doctor_relacion or {}


def _doctor_meta_por_id(ids_doctor: list[int] | None = None) -> dict[int, dict]:
    query = supabase.table("usuario")\
        .select("id_usuario,nombre,apellido,doctor(id_especialidad,especialidad(nombre))")\
        .eq("tipo_usuario", "doctor")
    if ids_doctor:
        query = query.in_("id_usuario", ids_doctor)
    try:
        res = query.execute()
    except APIError:
        return {}

    doctores = {}
    for usuario in res.data or []:
        doctor = _normalizar_doctor_relacion(usuario.get("doctor"))
        especialidad = doctor.get("especialidad") or {}
        nombre = " ".join([
            str(usuario.get("nombre") or "").strip(),
            str(usuario.get("apellido") or "").strip(),
        ]).strip()
        doctores[int(usuario["id_usuario"])] = {
            "id_doctor": usuario.get("id_usuario"),
            "doctor": nombre or "Doctor",
            "id_especialidad": doctor.get("id_especialidad"),
            "especialidad": especialidad.get("nombre"),
        }
    return doctores


def _doctor_ids_por_especialidad(id_especialidad: int | None) -> set[int] | None:
    if not id_especialidad:
        return None
    res = supabase.table("doctor")\
        .select("id_usuario")\
        .eq("id_especialidad", id_especialidad)\
        .execute()
    return {int(item["id_usuario"]) for item in res.data or []}


def _hora_desde_datetime(value) -> str | None:
    if not value:
        return None
    try:
        return _parse_datetime(value).strftime("%H:%M:%S")
    except (TypeError, ValueError):
        return None


def _agenda_item_cita(cita: dict, doctor_meta: dict | None = None) -> dict:
    fecha_hora = cita.get("fecha_hora")
    fecha_inicio = None
    try:
        fecha_inicio = _parse_datetime(fecha_hora)
    except (TypeError, ValueError):
        fecha_inicio = None
    estado = cita.get("estado") or "pendiente"
    return {
        "tipo": "cita",
        "estado": estado,
        "ocupado": estado in ESTADOS_CONFLICTO_CITA or estado == "completada",
        "id_cita": cita.get("id_cita"),
        "id_horario": cita.get("id_horario"),
        "id_paciente": cita.get("id_paciente"),
        "paciente": cita.get("paciente") or cita.get("nombre_paciente"),
        "dni": cita.get("dni"),
        "id_doctor": cita.get("id_doctor"),
        "doctor": cita.get("doctor") or cita.get("nombre_doctor") or (doctor_meta or {}).get("doctor"),
        "id_especialidad": cita.get("id_especialidad") or (doctor_meta or {}).get("id_especialidad"),
        "especialidad": cita.get("especialidad") or (doctor_meta or {}).get("especialidad"),
        "fecha": fecha_inicio.date().isoformat() if fecha_inicio else str(fecha_hora or "")[:10],
        "fecha_hora": fecha_hora,
        "fecha_fin": cita.get("fecha_fin"),
        "hora_inicio": _hora_desde_datetime(fecha_hora),
        "hora_fin": _hora_desde_datetime(cita.get("fecha_fin")),
        "motivo": cita.get("motivo"),
        "tipo_atencion": cita.get("tipo_atencion"),
    }


def _agenda_item_horario(horario: dict, doctor_meta: dict | None, estado: str) -> dict:
    return {
        "tipo": "horario",
        "estado": estado,
        "ocupado": estado == "ocupado",
        "id_cita": None,
        "id_horario": horario.get("id_horario"),
        "id_paciente": None,
        "paciente": None,
        "dni": None,
        "id_doctor": horario.get("id_doctor"),
        "doctor": (doctor_meta or {}).get("doctor"),
        "id_especialidad": (doctor_meta or {}).get("id_especialidad"),
        "especialidad": (doctor_meta or {}).get("especialidad"),
        "fecha": _date_str(horario.get("fecha")),
        "fecha_hora": _horario_datetime(horario).isoformat(),
        "fecha_fin": _horario_fin_datetime(horario).isoformat(),
        "hora_inicio": _time_str(horario.get("hora_inicio")),
        "hora_fin": _time_str(horario.get("hora_fin")),
        "motivo": None,
        "tipo_atencion": None,
    }


def _aplicar_filtros_agenda(items: list[dict], estado: str | None, paciente: str | None) -> list[dict]:
    resultado = items
    estado_normalizado = (estado or "").strip().lower()
    paciente_normalizado = (paciente or "").strip().lower()
    if estado_normalizado:
        if estado_normalizado == "ocupado":
            resultado = [item for item in resultado if item.get("ocupado")]
        else:
            resultado = [item for item in resultado if item.get("estado") == estado_normalizado]
    if paciente_normalizado:
        resultado = [
            item for item in resultado
            if paciente_normalizado in str(item.get("paciente") or "").lower()
        ]
    return resultado


def get_agenda_medica(
    id_doctor: int | None = None,
    id_especialidad: int | None = None,
    fecha: str | None = None,
    estado: str | None = None,
    paciente: str | None = None,
) -> list[dict]:
    cancelar_citas_vencidas()
    try:
        fecha_filtro = _parse_date(fecha).isoformat() if fecha else None
    except (TypeError, ValueError):
        raise ValueError("Fecha no valida")

    ids_por_especialidad = _doctor_ids_por_especialidad(id_especialidad)
    ids_doctor: set[int] | None = ids_por_especialidad
    if id_doctor:
        ids_doctor = {int(id_doctor)} if ids_doctor is None else ids_doctor & {int(id_doctor)}
    if ids_doctor is not None and not ids_doctor:
        return []

    horarios_query = supabase.table("horario_disponible").select("*")
    citas_query = supabase.table("v_citas_detalle").select("*")
    if ids_doctor is not None:
        ids = sorted(ids_doctor)
        horarios_query = horarios_query.in_("id_doctor", ids)
        citas_query = citas_query.in_("id_doctor", ids)

    if fecha_filtro:
        inicio, fin = get_lima_day_bounds(_parse_date(fecha_filtro))
        horarios_query = horarios_query.eq("fecha", fecha_filtro)
        citas_query = citas_query.gte("fecha_hora", inicio).lte("fecha_hora", fin)
    else:
        inicio, _ = get_lima_day_bounds()
        horarios_query = horarios_query.gte("fecha", get_lima_today().isoformat())
        citas_query = citas_query.gte("fecha_hora", inicio)

    horarios = horarios_query.order("fecha").order("hora_inicio").execute().data or []
    citas = agregar_fecha_fin_citas(
        citas_query.order("fecha_hora", desc=False).execute().data or []
    )

    ids_meta = sorted({
        int(item["id_doctor"])
        for item in [*horarios, *citas]
        if item.get("id_doctor")
    })
    doctores_meta = _doctor_meta_por_id(ids_meta)

    items = []
    ids_horarios_con_cita = set()
    for cita in citas:
        if cita.get("id_horario"):
            ids_horarios_con_cita.add(int(cita["id_horario"]))
        meta = doctores_meta.get(int(cita["id_doctor"])) if cita.get("id_doctor") else None
        items.append(_agenda_item_cita(cita, meta))

    for horario in horarios:
        id_horario = int(horario["id_horario"])
        meta = doctores_meta.get(int(horario["id_doctor"])) if horario.get("id_doctor") else None
        if not horario.get("ocupado") and is_horario_futuro(horario):
            try:
                validar_conflicto_horario_cita(horario)
            except ValueError:
                continue
            items.append(_agenda_item_horario(horario, meta, "disponible"))
        elif horario.get("ocupado") and id_horario not in ids_horarios_con_cita:
            items.append(_agenda_item_horario(horario, meta, "ocupado"))

    items = _aplicar_filtros_agenda(items, estado, paciente)
    return sorted(
        items,
        key=lambda item: (
            item.get("fecha") or "",
            item.get("hora_inicio") or "",
            item.get("doctor") or "",
            item.get("tipo") or "",
        ),
    )


def _notificar_citas_confirmadas_finalizadas(citas: list[dict], ahora: datetime):
    for cita in citas:
        if cita.get("estado") != "confirmada":
            continue
        fecha_fin = _fecha_fin_cita(cita)
        if not fecha_fin or fecha_fin > ahora:
            continue

        notificar_cita_finalizada_pendiente(
            {**cita, "fecha_fin": fecha_fin.isoformat()},
            fecha_fin,
        )


def cancelar_citas_vencidas(id_cita: int | None = None, *, raise_errors: bool = False):
    ahora = now_lima()
    query = supabase_admin.table("cita")\
        .select("id_cita,id_horario,fecha_hora,duracion_min,estado")\
        .in_("estado", list(ESTADOS_REVISION_VENCIMIENTO))
    if id_cita is not None:
        query = query.eq("id_cita", id_cita)
    else:
        query = query.lte("fecha_hora", ahora.isoformat())

    citas = _citas_con_horarios(query.execute().data or [])
    vencidas = [cita for cita in citas if is_cita_vencida(cita)]
    _notificar_citas_confirmadas_finalizadas(citas, ahora)

    actualizadas = []
    ids_cita = [cita["id_cita"] for cita in vencidas]
    ids_horario = [cita.get("id_horario") for cita in vencidas if cita.get("id_horario")]
    if ids_cita:
        try:
            res = supabase_admin.table("cita")\
                .update({"estado": "cancelada"})\
                .in_("id_cita", ids_cita)\
                .in_("estado", list(ESTADOS_AUTO_CANCELABLES))\
                .execute()
        except APIError as error:
            if raise_errors:
                _raise_cita_update_error(error)
            return []

        actualizadas.extend(res.data or vencidas)

        if ids_horario:
            supabase_admin.table("horario_disponible")\
                .update({"ocupado": False})\
                .in_("id_horario", ids_horario)\
                .execute()
        for cita_id in ids_cita:
            marcar_notificaciones_cita_leidas(cita_id)
        for cita in actualizadas:
            notificar_cita_cancelada(cita)

    return actualizadas

def cancelar_cita(id_cita: int):
    auto_actualizadas = cancelar_citas_vencidas(id_cita, raise_errors=True)
    if auto_actualizadas:
        estado_auto = auto_actualizadas[0].get("estado")
        if estado_auto == "cancelada":
            return auto_actualizadas
        raise ValueError("La cita ya fue actualizada automaticamente")
    cita = get_cita(id_cita)
    if not cita:
        raise ValueError("Cita no encontrada")
    if cita.get("estado") == "cancelada":
        return [cita]
    if cita.get("estado") == "completada":
        raise ValueError("No se puede cancelar una cita completada")
    try:
        res = supabase_admin.table("cita")\
            .update({"estado": "cancelada"})\
            .eq("id_cita", id_cita)\
            .execute()
    except APIError as error:
        _raise_cita_update_error(error)
    if not res.data:
        raise ValueError("No se pudo cancelar la cita")
    marcar_notificaciones_cita_leidas(id_cita)
    if cita and cita.get("id_horario"):
        liberar_horario(cita["id_horario"])
    notificar_cita_cancelada(res.data[0])
    return res.data

def get_cita(id_cita: int):
    res = supabase_admin.table("cita")\
        .select("*")\
        .eq("id_cita", id_cita)\
        .execute()
    return res.data[0] if res.data else None

def cambiar_estado_cita(id_cita: int, estado: str):
    if estado not in ESTADOS_CITA:
        raise ValueError("Estado de cita no permitido")
    auto_actualizadas = cancelar_citas_vencidas(id_cita, raise_errors=True)
    if auto_actualizadas:
        estado_auto = auto_actualizadas[0].get("estado")
        if estado == estado_auto:
            return auto_actualizadas
        raise ValueError("La cita ya paso de horario y fue cancelada automaticamente")
    cita = get_cita(id_cita)
    if not cita:
        raise ValueError("Cita no encontrada")
    estado_actual = cita.get("estado")
    if estado_actual == estado:
        return [cita]
    if estado_actual in {"cancelada", "completada"}:
        raise ValueError("No se puede modificar una cita cancelada o completada")
    if estado not in TRANSICIONES_ESTADO_CITA.get(estado_actual, set()):
        raise ValueError(f"No se puede cambiar una cita de {estado_actual} a {estado}")
    if estado in ESTADOS_CONFLICTO_CITA and cita.get("id_horario"):
        horario = get_horario(cita["id_horario"])
        if horario:
            validar_conflicto_horario_cita(horario, id_cita_actual=id_cita)
    try:
        res = supabase_admin.table("cita")\
            .update({"estado": estado})\
            .eq("id_cita", id_cita)\
            .execute()
    except APIError as error:
        if _is_db_horario_conflict_error(error):
            raise ValueError(MENSAJE_CONFLICTO_HORARIO) from error
        _raise_cita_update_error(error)
    if not res.data:
        raise ValueError("No se pudo actualizar la cita")
    if estado in {"confirmada", "en_atencion"} and cita.get("id_horario"):
        ocupar_horario(cita["id_horario"])
    if estado == "cancelada" and cita.get("id_horario"):
        liberar_horario(cita["id_horario"])
    if estado in {"confirmada", "cancelada", "completada"}:
        marcar_notificaciones_cita_leidas(id_cita)
    if estado == "confirmada":
        notificar_cita_confirmada(res.data[0])
    elif estado == "cancelada":
        notificar_cita_cancelada(res.data[0])
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
    if "reprogramada" not in TRANSICIONES_ESTADO_CITA.get(cita.get("estado"), set()):
        raise ValueError(f"No se puede reprogramar una cita en estado {cita.get('estado')}")
    horario_anterior = cita.get("id_horario")
    horario = validar_horario_para_cita(id_horario, id_horario_actual=horario_anterior)
    validar_conflicto_horario_cita(horario, id_cita_actual=id_cita)

    horario_cambiado = not horario_anterior or int(horario_anterior) != int(id_horario)
    if horario_cambiado:
        reserva = supabase_admin.table("horario_disponible")\
            .update({"ocupado": True})\
            .eq("id_horario", id_horario)\
            .eq("ocupado", False)\
            .execute()
        if not reserva.data:
            raise ValueError("El horario seleccionado ya se encuentra ocupado")

    try:
        res = supabase_admin.table("cita")\
            .update({
                "id_horario": id_horario,
                "id_doctor": horario["id_doctor"],
                "fecha_hora": _horario_datetime(horario).isoformat(),
                "estado": "reprogramada",
            })\
            .eq("id_cita", id_cita)\
            .execute()
    except APIError as error:
        if horario_cambiado:
            liberar_horario(id_horario)
        if _is_db_horario_conflict_error(error):
            raise ValueError(MENSAJE_CONFLICTO_HORARIO) from error
        raise
    if horario_cambiado and horario_anterior:
        liberar_horario(horario_anterior)
    if not horario_cambiado:
        ocupar_horario(id_horario)
    if res.data:
        notificar_cita_reprogramada(res.data[0])
    return res.data

def registrar_atencion(id_cita: int, data: dict):
    cita = get_cita(id_cita)
    if not cita:
        return None
    if cita.get("estado") not in {"confirmada", "reprogramada", "en_atencion"}:
        raise ValueError("Solo se puede registrar atencion en citas confirmadas o en atencion")
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
