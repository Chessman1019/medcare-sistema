from datetime import date, time

from pydantic import BaseModel


class HorarioDisponibleCreate(BaseModel):
    id_doctor: int
    fecha: date
    hora_inicio: time
    hora_fin: time
