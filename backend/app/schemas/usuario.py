from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

class RecuperacionContrasenaSolicitar(BaseModel):
    email: EmailStr

class RecuperacionContrasenaVerificar(BaseModel):
    email: EmailStr
    codigo: str

class RecuperacionContrasenaRestablecer(BaseModel):
    email: EmailStr
    codigo: str
    nueva_contrasena: str

class UsuarioBase(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    telefono: Optional[str] = None

class PacienteCreate(UsuarioBase):
    password: str
    dni: str
    fecha_nacimiento: date
    genero: str
    seguro_medico: Optional[str] = None
    direccion: Optional[str] = None

class DoctorCreate(UsuarioBase):
    password: str
    cmp: str
    id_especialidad: int
    turno: str

class UsuarioAdminCreate(UsuarioBase):
    password: str
    tipo_usuario: str
    dni: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    seguro_medico: Optional[str] = None
    direccion: Optional[str] = None
    cmp: Optional[str] = None
    id_especialidad: Optional[int] = None
    codigo_empleado: Optional[str] = None
    turno: Optional[str] = None

class UsuarioPerfilUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    seguro_medico: Optional[str] = None

class UsuarioCambiarContrasena(BaseModel):
    contrasena_actual: str
    nueva_contrasena: str

class UsuarioResponse(BaseModel):
    id_usuario: int
    nombre: str
    apellido: str
    email: str
    tipo_usuario: str
    activo: bool

    class Config:
        from_attributes = True
