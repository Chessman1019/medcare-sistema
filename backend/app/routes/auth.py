from fastapi import APIRouter, HTTPException
from app.schemas.usuario import UsuarioLogin, PacienteCreate
from app.services.auth_service import verify_password, create_access_token, hash_password, get_user_by_email
from app.database import supabase

router = APIRouter()

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