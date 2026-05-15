from abc import ABC, abstractmethod

class Usuario(ABC):
    def __init__(self, id_usuario, nombre, apellido, email, telefono, tipo_usuario):
        self._id_usuario = id_usuario
        self._nombre = nombre
        self._apellido = apellido
        self._email = email
        self._telefono = telefono
        self._tipo_usuario = tipo_usuario
        self._activo = True

    @property
    def id_usuario(self): return self._id_usuario
    @property
    def nombre(self): return self._nombre
    @property
    def apellido(self): return self._apellido
    @property
    def email(self): return self._email
    @property
    def nombre_completo(self): return f"{self._nombre} {self._apellido}"

    @abstractmethod
    def obtener_rol(self) -> str:
        pass

class Paciente(Usuario):
    def __init__(self, id_usuario, nombre, apellido, email, telefono,
                 dni, fecha_nacimiento, genero, seguro_medico=None, direccion=None):
        super().__init__(id_usuario, nombre, apellido, email, telefono, "paciente")
        self.__dni = dni
        self.__fecha_nacimiento = fecha_nacimiento
        self.__genero = genero
        self.__seguro_medico = seguro_medico
        self.__direccion = direccion

    @property
    def dni(self): return self.__dni

    def obtener_rol(self): return "paciente"

class Doctor(Usuario):
    def __init__(self, id_usuario, nombre, apellido, email, telefono,
                 cmp, id_especialidad, turno, disponible=True):
        super().__init__(id_usuario, nombre, apellido, email, telefono, "doctor")
        self.__cmp = cmp
        self.__id_especialidad = id_especialidad
        self.__turno = turno
        self.__disponible = disponible

    @property
    def cmp(self): return self.__cmp
    @property
    def disponible(self): return self.__disponible

    def obtener_rol(self): return "doctor"

class Administrador(Usuario):
    def __init__(self, id_usuario, nombre, apellido, email, telefono, legajo, turno):
        super().__init__(id_usuario, nombre, apellido, email, telefono, "administrador")
        self.__legajo = legajo
        self.__turno = turno

    def obtener_rol(self): return "administrador"