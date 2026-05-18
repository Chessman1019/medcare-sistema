import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from app.schemas.usuario import (
    PacienteCreate,
    RecuperacionContrasenaRestablecer,
    RecuperacionContrasenaSolicitar,
    RecuperacionContrasenaVerificar,
    UsuarioLogin,
)
from app.services.auth_service import verify_password, create_access_token, hash_password, get_user_by_email
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

@router.post("/login")
def login(data: UsuarioLogin):
    user = get_user_by_email(data.email)
    if not user or not verify_password(data.password, user["contrasena_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    token = create_access_token({"sub": str(user["id_usuario"]), "rol": user["tipo_usuario"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "rol": user["tipo_usuario"],
        "id_usuario": user["id_usuario"],
        "nombre": user["nombre"],
        "apellido": user["apellido"]
    }


@router.post("/recuperar-contrasena/solicitar")
def solicitar_recuperacion_contrasena(data: RecuperacionContrasenaSolicitar):
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
    user = supabase.table("usuario").insert({
        "nombre": data.nombre,
        "apellido": data.apellido,
        "email": data.email,
        "contrasena_hash": hash_password(data.password),
        "telefono": data.telefono,
        "tipo_usuario": "paciente"
    }).execute()
    id_usuario = user.data[0]["id_usuario"]
    supabase.table("paciente").insert({
        "id_usuario": id_usuario,
        "dni": data.dni,
        "fecha_nacimiento": str(data.fecha_nacimiento),
        "genero": data.genero,
        "seguro_medico": data.seguro_medico,
        "direccion": data.direccion
    }).execute()
    return {"mensaje": "Paciente registrado correctamente", "id_usuario": id_usuario}
