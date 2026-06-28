from typing import Optional

from pydantic import BaseModel


class SoporteTicketCreate(BaseModel):
    id_usuario: Optional[int] = None
    rol: str
    mensaje: str
    contexto: Optional[str] = None
    id_cita: Optional[int] = None
    prioridad: str = "normal"


class SoporteTicketUpdate(BaseModel):
    estado: str
    respuesta: Optional[str] = None
    asignado_a: Optional[int] = None
