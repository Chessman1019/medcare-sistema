from datetime import datetime

class Cita:
    def __init__(self, id_cita, id_paciente, id_doctor, id_horario,
                 fecha_hora, motivo=None, tipo_atencion="web", duracion_min=30):
        self.__id_cita = id_cita
        self.__id_paciente = id_paciente
        self.__id_doctor = id_doctor
        self.__id_horario = id_horario
        self.__fecha_hora = fecha_hora
        self.__estado = "pendiente"
        self.__motivo = motivo
        self.__tipo_atencion = tipo_atencion
        self.__duracion_min = duracion_min

    @property
    def id_cita(self): return self.__id_cita
    @property
    def estado(self): return self.__estado

    def confirmar(self):
        if self.__estado == "pendiente":
            self.__estado = "confirmada"
            return True
        return False

    def cancelar(self):
        if self.__estado not in ("cancelada", "completada"):
            self.__estado = "cancelada"
            return True
        return False

    def reprogramar(self, nuevo_horario_id, nueva_fecha):
        if self.__estado not in ("cancelada", "completada"):
            self.__id_horario = nuevo_horario_id
            self.__fecha_hora = nueva_fecha
            self.__estado = "reprogramada"
            return True
        return False