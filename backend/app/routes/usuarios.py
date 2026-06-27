import logging
logger = logging.getLogger(__name__)

from postgrest.exceptions import APIError
from app.schemas.usuario import UsuarioAdminCreate
from app.services.auth_service import decode_token, hash_password
from fastapi import APIRouter, Body, Depends, Header, HTTPException
from app.database import supabase, supabase_admin

router = APIRouter()

ROLES_ADMIN_CREABLES = {"paciente", "doctor", "recepcionista", "administrador"}

def _normalize_optional_text(value):
    if value is None:
        return None
    normalized = " ".join(str(value).strip().split())
    return normalized or None

def require_admin(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    payload = decode_token(authorization.replace("Bearer ", "", 1).strip())
    if not payload or payload.get("rol") != "administrador":
        raise HTTPException(status_code=403, detail="Solo un administrador puede realizar esta acción")
    return payload

def _get_or_raise_unique(table, field, value, message):
    if value in (None, ""):
        return
    res = supabase.table(table).select(field).eq(field, value).execute()
    if res.data:
        raise HTTPException(status_code=400, detail=message)

def _insert_role_profile(id_usuario: int, data: UsuarioAdminCreate):
    rol = data.tipo_usuario
    if rol == "paciente":
        if not data.dni or not data.fecha_nacimiento or not data.genero:
            raise HTTPException(status_code=400, detail="DNI, fecha de nacimiento y género son obligatorios para pacientes")
        _get_or_raise_unique("paciente", "dni", data.dni, "DNI ya registrado")
        supabase_admin.table("paciente").insert({
            "id_usuario": id_usuario, "dni": data.dni,
            "fecha_nacimiento": str(data.fecha_nacimiento), "genero": data.genero,
            "seguro_medico": _normalize_optional_text(data.seguro_medico),
            "direccion": _normalize_optional_text(data.direccion),
        }).execute()
        return
    if rol == "doctor":
        if not data.cmp or not data.id_especialidad or not data.turno:
            raise HTTPException(status_code=400, detail="CMP, especialidad y turno son obligatorios para médicos")
        _get_or_raise_unique("doctor", "cmp", data.cmp, "CMP ya registrado")
        supabase_admin.table("doctor").insert({
            "id_usuario": id_usuario, "id_especialidad": data.id_especialidad,
            "cmp": data.cmp, "disponible": True, "turno": data.turno,
        }).execute()
        return
    if rol in {"recepcionista", "administrador"}:
        if not data.codigo_empleado or not data.turno:
            raise HTTPException(status_code=400, detail="Código de empleado y turno son obligatorios")
        _get_or_raise_unique("administrador", "codigo_empleado", data.codigo_empleado, "Código de empleado ya registrado")
        supabase_admin.table("administrador").insert({
            "id_usuario": id_usuario, "codigo_empleado": data.codigo_empleado, "turno": data.turno,
        }).execute()
        return
    raise HTTPException(status_code=400, detail="Tipo de usuario no permitido")


# ── Especialidades ──────────────────────────────────────────
@router.get("/especialidades")
def get_especialidades():
    res = supabase.table("especialidad").select("*").execute()
    return res.data

@router.get("/seguros-medicos")
def get_seguros_medicos():
    res = supabase_admin.table("paciente").select("seguro_medico").execute()
    seguros = {}
    for item in res.data or []:
        nombre = _normalize_optional_text(item.get("seguro_medico"))
        if nombre:
            seguros.setdefault(nombre.casefold(), nombre)
    return sorted(seguros.values(), key=lambda seguro: seguro.casefold())


# ── Usuarios ────────────────────────────────────────────────
@router.get("")
def get_usuarios(_: dict = Depends(require_admin)):
    res = supabase.table("usuario")\
        .select("*, paciente(*), doctor(*, especialidad(*)), administrador(*)")\
        .order("fecha_registro", desc=True).execute()
    return res.data

@router.post("")
def crear_usuario(data: UsuarioAdminCreate, _: dict = Depends(require_admin)):
    rol = data.tipo_usuario
    if rol not in ROLES_ADMIN_CREABLES:
        raise HTTPException(status_code=400, detail="Tipo de usuario no permitido")
    if len(data.password.strip()) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    usuario_existente = supabase.table("usuario").select("id_usuario").eq("email", data.email).execute()
    if usuario_existente.data:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    usuario = None
    try:
        usuario_res = supabase_admin.table("usuario").insert({
            "nombre": data.nombre, "apellido": data.apellido, "email": data.email,
            "contrasena_hash": hash_password(data.password), "telefono": data.telefono,
            "activo": True, "tipo_usuario": rol,
        }).execute()
        usuario = usuario_res.data[0] if usuario_res.data else None
        if not usuario:
            raise HTTPException(status_code=400, detail="No se pudo crear el usuario")
        _insert_role_profile(usuario["id_usuario"], data)
        return {"mensaje": "Usuario creado correctamente", "id_usuario": usuario["id_usuario"], "tipo_usuario": rol}
    except HTTPException:
        if usuario:
            supabase_admin.table("usuario").delete().eq("id_usuario", usuario["id_usuario"]).execute()
        raise
    except APIError as error:
        if usuario:
            supabase_admin.table("usuario").delete().eq("id_usuario", usuario["id_usuario"]).execute()
        raise HTTPException(status_code=400, detail=str(error))


# ── Doctores ────────────────────────────────────────────────
@router.get("/doctores")
def get_doctores():
    res = supabase.table("usuario").select("*, doctor(*, especialidad(*))").eq("tipo_usuario", "doctor").execute()
    return res.data

@router.get("/doctores/especialidad/{id_especialidad}")
def get_doctores_por_especialidad(id_especialidad: int):
    res = supabase.table("doctor").select("*, usuario(*)").eq("id_especialidad", id_especialidad).execute()
    return res.data

@router.put("/doctores/{id_usuario}")
def actualizar_doctor(id_usuario: int, data: dict = Body(...), _: dict = Depends(require_admin)):
    try:
        usuario_data = {k: v for k, v in data.items() if k in ["nombre", "apellido", "email", "telefono"]}
        if usuario_data:
            supabase_admin.table("usuario").update(usuario_data).eq("id_usuario", id_usuario).execute()
        doctor_data = {k: v for k, v in data.items() if k in ["cmp", "turno", "id_especialidad"]}
        if doctor_data:
            if "id_especialidad" in doctor_data and doctor_data["id_especialidad"]:
                doctor_data["id_especialidad"] = int(doctor_data["id_especialidad"])
            supabase_admin.table("doctor").update(doctor_data).eq("id_usuario", id_usuario).execute()
        return {"mensaje": "Doctor actualizado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/doctores/{id_usuario}/disponible")
def toggle_disponible(id_usuario: int, data: dict, _: dict = Depends(require_admin)):
    supabase_admin.table("doctor").update({"disponible": data["disponible"]}).eq("id_usuario", id_usuario).execute()
    return {"mensaje": "Disponibilidad actualizada"}


# ── Pacientes ───────────────────────────────────────────────
@router.get("/pacientes")
def get_pacientes():
    res = supabase.table("usuario").select("*, paciente(*)").eq("tipo_usuario", "paciente").execute()
    return res.data


# ── Lista de espera ─────────────────────────────────────────
@router.get("/lista-espera")
def get_lista_espera():
    res = supabase.table("lista_espera").select("*, paciente(*, usuario(*)), especialidad(*)").eq("estado", "en_espera").execute()
    return res.data


# ── Configuración ───────────────────────────────────────────
@router.get("/configuracion")
def get_configuracion():
    res = supabase.table("configuracion_clinica").select("*").eq("id", 1).execute()
    return res.data[0] if res.data else {}

@router.put("/configuracion")
def actualizar_configuracion(data: dict, _: dict = Depends(require_admin)):
    data.pop("id", None)
    data.pop("updated_at", None)
    data["updated_at"] = "now()"
    supabase_admin.table("configuracion_clinica").update(data).eq("id", 1).execute()
    return {"mensaje": "Configuración actualizada correctamente"}

@router.post("/especialidades")
def crear_especialidad(data: dict = Body(...), _: dict = Depends(require_admin)):
    res = supabase_admin.table("especialidad").insert({
        "nombre": data["nombre"],
        "descripcion": data.get("descripcion", ""),
    }).execute()
    return res.data[0]

@router.put("/especialidades/{id_especialidad}")
def actualizar_especialidad(id_especialidad: int, data: dict = Body(...), _: dict = Depends(require_admin)):
    res = supabase_admin.table("especialidad").update({
        "nombre": data["nombre"],
        "descripcion": data.get("descripcion", ""),
    }).eq("id_especialidad", id_especialidad).execute()
    return res.data[0]
@router.patch("/lista-espera/{id_espera}")
def actualizar_lista_espera(id_espera: int, data: dict = Body(...), _: dict = Depends(require_admin)):
    supabase_admin.table("lista_espera").update({
        "estado": data["estado"]
    }).eq("id_espera", id_espera).execute()
    return {"mensaje": "Lista de espera actualizada"}
