from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CitaCreate(BaseModel):
    id_doctor: int
    id_horario: int
    fecha_hora: datetime
    motivo: Optional[str] = None
    tipo_atencion: str = "web"
    duracion_min: int = 30

class CitaUpdate(BaseModel):
    estado: Optional[str] = None
    id_horario: Optional[int] = None
    fecha_hora: Optional[datetime] = None

class CitaReprogramar(BaseModel):
    id_horario: int
    fecha_hora: datetime

class AtencionCreate(BaseModel):
    diagnostico: str
    observaciones: Optional[str] = None
    tratamiento: Optional[str] = None

class CitaResponse(BaseModel):
    id_cita: int
    id_paciente: int
    id_doctor: int
    fecha_hora: datetime
    estado: str
    motivo: Optional[str] = None
    tipo_atencion: str

    class Config:
        from_attributes = True
