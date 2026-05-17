from typing import Optional
from pydantic import BaseModel


class SoporteCreate(BaseModel):
    id_usuario: int
    rol: str
    mensaje: str
    contexto: Optional[str] = None
    id_cita: Optional[int] = None
