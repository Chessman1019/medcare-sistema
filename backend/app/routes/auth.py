import secrets
from datetime import datetime, timedelta, timezone
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.database import supabase, supabase_admin
limiter = Limiter(key_func=get_remote_address)

from fastapi import APIRouter, Depends, Header, HTTPException
from app.schemas.usuario import (
    PacienteCreate,
    RecuperacionContrasenaRestablecer,
    RecuperacionContrasenaSolicitar,
    RecuperacionContrasenaVerificar,
    UsuarioCambiarContrasena,
    UsuarioLogin,
    UsuarioPerfilUpdate,
)
from app.services.auth_service import verify_password, create_access_token, hash_password, get_user_by_email, decode_token
from app.services.email_service import send_password_recovery_code
from app.database import supabase

router = APIRouter()

CODIGO_EXPIRACION_MINUTOS = 10


def _generar_codigo() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _buscar_codigo_activo(usuario_id: int, codigo: str):
    ahora = datetime.now(timezone.utc)
    res = (
        supabase.table("codigos_recuperacion_contrasena")
        .select("*")
        .eq("usuario_id", usuario_id)
        .eq("estado", "ACTIVO")
        .order("fecha_creacion", desc=True)
        .limit(5)
        .execute()
    )

    for item in res.data or []:
        fecha_expiracion = datetime.fromisoformat(item["fecha_expiracion"].replace("Z", "+00:00"))
        if fecha_expiracion < ahora:
            supabase.table("codigos_recuperacion_contrasena").update({"estado": "EXPIRADO"}).eq("id", item["id"]).execute()
            continue
        if verify_password(codigo, item["codigo_hash"]):
            return item

    return None


def _get_current_user(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")

    payload = decode_token(authorization.replace("Bearer ", "", 1).strip())
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Token inválido")

    res = supabase.table("usuario").select("*").eq("id_usuario", int(payload["sub"])).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    return res.data[0]

@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, data: UsuarioLogin):
    user = get_user_by_email(data.email)
    if not user or not verify_password(data.password, user["contrasena_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    token = create_access_token({"sub": str(user["id_usuario"]), "rol": user["tipo_usuario"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "rol": user["tipo_usuario"],
        "id_usuario": user["id_usuario"],
        "email": user["email"],
        "nombre": user["nombre"],
        "apellido": user["apellido"],
        "telefono": user.get("telefono"),
    }


@router.get("/me")
def obtener_perfil(usuario: dict = Depends(_get_current_user)):
    rol = usuario["tipo_usuario"]
    perfil = {
        "id_usuario": usuario["id_usuario"],
        "nombre": usuario["nombre"],
        "apellido": usuario["apellido"],
        "email": usuario["email"],
        "telefono": usuario.get("telefono"),
        "activo": usuario["activo"],
        "tipo_usuario": rol,
        "fecha_registro": usuario.get("fecha_registro"),
    }

    if rol == "paciente":
        res = supabase.table("paciente").select("*").eq("id_usuario", usuario["id_usuario"]).execute()
        perfil["paciente"] = res.data[0] if res.data else None
    elif rol == "doctor":
        res = supabase.table("doctor").select("*, especialidad(*)").eq("id_usuario", usuario["id_usuario"]).execute()
        perfil["doctor"] = res.data[0] if res.data else None
    elif rol in {"administrador", "recepcionista"}:
        res = supabase.table("administrador").select("*").eq("id_usuario", usuario["id_usuario"]).execute()
        perfil["administrador"] = res.data[0] if res.data else None

    return perfil


@router.put("/me")
def actualizar_perfil(data: UsuarioPerfilUpdate, usuario: dict = Depends(_get_current_user)):
    usuario_update = {}
    for campo in ("nombre", "apellido", "telefono"):
        valor = getattr(data, campo)
        if valor is not None:
            usuario_update[campo] = valor.strip() if isinstance(valor, str) else valor

    if usuario_update:
        supabase.table("usuario").update(usuario_update).eq("id_usuario", usuario["id_usuario"]).execute()

    if usuario["tipo_usuario"] == "paciente":
        paciente_update = {}
        for campo in ("direccion", "seguro_medico"):
            valor = getattr(data, campo)
            if valor is not None:
                paciente_update[campo] = valor.strip() if isinstance(valor, str) else valor
        if paciente_update:
            supabase.table("paciente").update(paciente_update).eq("id_usuario", usuario["id_usuario"]).execute()

    return obtener_perfil({**usuario, **usuario_update})


@router.put("/me/contrasena")
def cambiar_contrasena(data: UsuarioCambiarContrasena, usuario: dict = Depends(_get_current_user)):
    if not verify_password(data.contrasena_actual, usuario["contrasena_hash"]):
        raise HTTPException(status_code=400, detail="La contraseña actual no es correcta")

    nueva_contrasena = data.nueva_contrasena.strip()
    if len(nueva_contrasena) < 6:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres")

    supabase.table("usuario").update({
        "contrasena_hash": hash_password(nueva_contrasena),
    }).eq("id_usuario", usuario["id_usuario"]).execute()

    return {"mensaje": "Contraseña actualizada correctamente"}


@router.post("/recuperar-contrasena/solicitar")
@limiter.limit("3/minute")
def solicitar_recuperacion_contrasena(request: Request, data: RecuperacionContrasenaSolicitar):
    user = get_user_by_email(data.email)
    if not user:
        return {"mensaje": "Si el correo existe, enviaremos un codigo de recuperacion."}

    codigo = _generar_codigo()
    ahora = datetime.now(timezone.utc)
    fecha_expiracion = ahora + timedelta(minutes=CODIGO_EXPIRACION_MINUTOS)

    supabase.table("codigos_recuperacion_contrasena").update({"estado": "CANCELADO"}).eq("usuario_id", user["id_usuario"]).eq("estado", "ACTIVO").execute()

    supabase.table("codigos_recuperacion_contrasena").insert({
        "usuario_id": user["id_usuario"],
        "codigo_hash": hash_password(codigo),
        "estado": "ACTIVO",
        "fecha_expiracion": fecha_expiracion.isoformat(),
    }).execute()

    try:
        send_password_recovery_code(
            to_email=user["email"],
            nombre=f"{user['nombre']} {user['apellido']}".strip(),
            codigo=codigo,
        )
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudo enviar el correo de recuperacion: {error}")

    return {"mensaje": "Si el correo existe, enviaremos un codigo de recuperacion."}


@router.post("/recuperar-contrasena/verificar")
def verificar_codigo_recuperacion(data: RecuperacionContrasenaVerificar):
    user = get_user_by_email(data.email)
    if not user:
        raise HTTPException(status_code=400, detail="Codigo invalido o expirado")

    codigo = _buscar_codigo_activo(user["id_usuario"], data.codigo.strip())
    if not codigo:
        raise HTTPException(status_code=400, detail="Codigo invalido o expirado")

    return {"mensaje": "Codigo verificado correctamente"}


@router.post("/recuperar-contrasena/restablecer")
def restablecer_contrasena(data: RecuperacionContrasenaRestablecer):
    nueva_contrasena = data.nueva_contrasena.strip()
    if len(nueva_contrasena) < 6:
        raise HTTPException(status_code=400, detail="La nueva contrasena debe tener al menos 6 caracteres")

    user = get_user_by_email(data.email)
    if not user:
        raise HTTPException(status_code=400, detail="Codigo invalido o expirado")

    codigo = _buscar_codigo_activo(user["id_usuario"], data.codigo.strip())
    if not codigo:
        raise HTTPException(status_code=400, detail="Codigo invalido o expirado")

    supabase.table("usuario").update({
        "contrasena_hash": hash_password(nueva_contrasena),
    }).eq("id_usuario", user["id_usuario"]).execute()

    supabase.table("codigos_recuperacion_contrasena").update({
        "estado": "USADO",
        "fecha_uso": datetime.now(timezone.utc).isoformat(),
    }).eq("id", codigo["id"]).execute()

    supabase.table("codigos_recuperacion_contrasena").update({"estado": "CANCELADO"}).eq("usuario_id", user["id_usuario"]).eq("estado", "ACTIVO").execute()

    return {"mensaje": "Contrasena restablecida correctamente"}


@router.post("/registro/paciente")
def registro_paciente(data: PacienteCreate):
    if get_user_by_email(data.email):
        raise HTTPException(status_code=400, detail="Email ya registrado")
    user = supabase_admin.table("usuario").insert({
        "nombre": data.nombre,
        "apellido": data.apellido,
        "email": data.email,
        "contrasena_hash": hash_password(data.password),
        "telefono": data.telefono,
        "tipo_usuario": "paciente"
    }).execute()
    id_usuario = user.data[0]["id_usuario"]
    supabase_admin.table("paciente").insert({
        "id_usuario": id_usuario,
        "dni": data.dni,
        "fecha_nacimiento": str(data.fecha_nacimiento),
        "genero": data.genero,
        "seguro_medico": data.seguro_medico,
        "direccion": data.direccion
    }).execute()
    return {"mensaje": "Paciente registrado correctamente", "id_usuario": id_usuario}