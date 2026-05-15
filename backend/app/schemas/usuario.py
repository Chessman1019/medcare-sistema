from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

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

class UsuarioResponse(BaseModel):
    id_usuario: int
    nombre: str
    apellido: str
    email: str
    tipo_usuario: str
    activo: bool

    class Config:
        from_attributes = True