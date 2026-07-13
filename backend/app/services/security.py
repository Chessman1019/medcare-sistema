from fastapi import Depends, Header, HTTPException

from app.database import supabase
from app.services.auth_service import decode_token


def get_current_user(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")

    payload = decode_token(authorization.replace("Bearer ", "", 1).strip())
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Token invalido")

    res = (
        supabase.table("usuario")
        .select("*")
        .eq("id_usuario", int(payload["sub"]))
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    usuario = res.data[0]
    if usuario.get("activo") is False:
        raise HTTPException(status_code=403, detail="Tu cuenta esta desactivada. Comunicate con el administrador.")

    return {
        **usuario,
        "rol": usuario.get("tipo_usuario") or payload.get("rol"),
    }


def require_roles(*roles: str):
    def dependency(usuario: dict = Depends(get_current_user)):
        if usuario.get("rol") not in roles:
            raise HTTPException(status_code=403, detail="No tienes permiso para esta accion")
        return usuario

    return dependency


def require_admin_or_reception(usuario: dict = Depends(get_current_user)):
    if usuario.get("rol") not in {"administrador", "recepcionista"}:
        raise HTTPException(status_code=403, detail="No tienes permiso para esta accion")
    return usuario
