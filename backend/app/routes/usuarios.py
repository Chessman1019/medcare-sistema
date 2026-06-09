from fastapi import APIRouter, Depends, Header, HTTPException
from postgrest.exceptions import APIError
from app.database import supabase
from app.schemas.usuario import UsuarioAdminCreate
from app.services.auth_service import decode_token, hash_password

router = APIRouter()

ROLES_ADMIN_CREABLES = {"paciente", "doctor", "recepcionista", "administrador"}
def require_admin(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")

    payload = decode_token(authorization.replace("Bearer ", "", 1).strip())
    if not payload or payload.get("rol") != "administrador":
        raise HTTPException(status_code=403, detail="Solo un administrador puede realizar esta acción")

    return payload


def _get_or_raise_unique(table: str, field: str, value: str | int | None, message: str):
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
        supabase.table("paciente").insert({
            "id_usuario": id_usuario,
            "dni": data.dni,
            "fecha_nacimiento": str(data.fecha_nacimiento),
            "genero": data.genero,
            "seguro_medico": data.seguro_medico,
            "direccion": data.direccion,
        }).execute()
        return

    if rol == "doctor":
        if not data.cmp or not data.id_especialidad or not data.turno:
            raise HTTPException(status_code=400, detail="CMP, especialidad y turno son obligatorios para médicos")
        _get_or_raise_unique("doctor", "cmp", data.cmp, "CMP ya registrado")
        supabase.table("doctor").insert({
            "id_usuario": id_usuario,
            "id_especialidad": data.id_especialidad,
            "cmp": data.cmp,
            "disponible": True,
            "turno": data.turno,
        }).execute()
        return

    if rol in {"recepcionista", "administrador"}:
        if not data.codigo_empleado or not data.turno:
            raise HTTPException(status_code=400, detail="Código de empleado y turno son obligatorios para personal administrativo")
        _get_or_raise_unique("administrador", "codigo_empleado", data.codigo_empleado, "Código de empleado ya registrado")
        supabase.table("administrador").insert({
            "id_usuario": id_usuario,
            "codigo_empleado": data.codigo_empleado,
            "turno": data.turno,
        }).execute()
        return

    raise HTTPException(status_code=400, detail="Tipo de usuario no permitido")

@router.get("/especialidades")
def get_especialidades():
    res = supabase.table("especialidad").select("*").execute()
    return res.data

@router.get("")
def get_usuarios(_: dict = Depends(require_admin)):
    res = (
        supabase.table("usuario")
        .select("*, paciente(*), doctor(*, especialidad(*)), administrador(*)")
        .order("fecha_registro", desc=True)
        .execute()
    )
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
        usuario_res = supabase.table("usuario").insert({
            "nombre": data.nombre,
            "apellido": data.apellido,
            "email": data.email,
            "contrasena_hash": hash_password(data.password),
            "telefono": data.telefono,
            "activo": True,
            "tipo_usuario": rol,
        }).execute()

        usuario = usuario_res.data[0] if usuario_res.data else None
        if not usuario:
            raise HTTPException(status_code=400, detail="No se pudo crear el usuario")

        _insert_role_profile(usuario["id_usuario"], data)

        return {
            "mensaje": "Usuario creado correctamente",
            "id_usuario": usuario["id_usuario"],
            "tipo_usuario": rol,
        }
    except HTTPException:
        if usuario:
            supabase.table("usuario").delete().eq("id_usuario", usuario["id_usuario"]).execute()
        raise
    except APIError as error:
        if usuario:
            supabase.table("usuario").delete().eq("id_usuario", usuario["id_usuario"]).execute()
        raise HTTPException(status_code=400, detail=str(error))
