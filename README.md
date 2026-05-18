<p align="center">
  <img src="frontend/public/medcare-logo.png" alt="Clínica MedCare S.A.C." width="180" />
</p>

# Clínica MedCare S.A.C. - Sistema de Citas Médicas

Sistema web para la gestión integral de citas médicas de Clínica MedCare S.A.C. Incluye portal para pacientes, recepción/administración y médicos, con autenticación, recuperación de contraseña por correo, agenda, historial clínico, notificaciones y soporte operativo.

## Funcionalidades principales

- Autenticación por roles: paciente, doctor, recepcionista y administrador.
- Registro de pacientes e inicio de sesión con JWT.
- Recuperación de contraseña mediante código enviado por correo.
- Agenda de citas con selección de especialidad, doctor, fecha y horario.
- Gestión de citas: confirmación, reprogramación, cancelación, asistencia y salida.
- Panel de paciente con próxima cita, historial, notificaciones y soporte.
- Panel de recepción/administración con métricas, agenda global, registro de pacientes y tickets de soporte.
- Panel médico con agenda diaria, atención, diagnóstico, tratamiento e historial clínico.
- Integración con Supabase como base de datos.
- Interfaz responsiva para escritorio, tablet y móvil.

## Tecnologías

**Frontend**
- React
- Vite
- Tailwind CSS
- Axios
- React Router

**Backend**
- Python
- FastAPI
- Uvicorn
- Supabase Python Client
- JWT
- SMTP para recuperación de contraseña

**Base de datos**
- Supabase PostgreSQL

## Estructura del proyecto

```text
medcare-sistema/
+-- backend/
|   +-- app/
|   |   +-- routes/
|   |   +-- schemas/
|   |   +-- services/
|   |   +-- models/
|   +-- sql/
|   +-- main.py
|   +-- requirements.txt
+-- frontend/
|   +-- public/
|   +-- src/
|   |   +-- components/
|   |   +-- context/
|   |   +-- pages/
|   |   +-- services/
|   +-- package.json
+-- README.md
```

## Requisitos previos

- Git
- Node.js 20 o superior
- Python 3.11 o superior
- Cuenta/proyecto en Supabase
- Credenciales SMTP para envío de correos

## Descargar el repositorio

```powershell
git clone https://github.com/Chessman1019/medcare-sistema.git
cd medcare-sistema
```

Si vas a trabajar sobre la rama de desarrollo actual:

```powershell
git checkout feature/ui-medcare-portal
git pull origin feature/ui-medcare-portal
```

## Configurar el backend

Entra a la carpeta del backend:

```powershell
cd backend
```

Crea y activa un entorno virtual:

```powershell
python -m venv venv
.\venv\Scripts\activate
```

Instala dependencias:

```powershell
pip install -r requirements.txt
```

Crea el archivo `backend/.env` con tus credenciales:

```env
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_KEY=TU_SUPABASE_KEY

SECRET_KEY=CAMBIA_ESTA_CLAVE_SECRETA
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASSWORD=tu_app_password
SMTP_FROM=tu_correo@gmail.com
SMTP_USE_TLS=true
```

Importante: no subas el archivo `.env` al repositorio. Ya está incluido en `.gitignore`.

## Preparar Supabase

La base de datos debe tener las tablas principales del sistema: `usuario`, `paciente`, `doctor`, `administrador`, `especialidad`, `horario_disponible`, `cita`, `historial_clinico`, `notificacion`, `lista_espera`, `soporte_ticket` y `codigos_recuperacion_contrasena`.

Los scripts complementarios están en:

```text
backend/sql/
+-- 20260517_soporte_ticket.sql
+-- 20260517_codigos_recuperacion_contrasena.sql
```

Ejecuta esos scripts desde el SQL Editor de Supabase si tu base aún no tiene esas tablas o funciones.

## Levantar el backend

Desde `backend/` y con el entorno virtual activo:

```powershell
uvicorn main:app --reload
```

El backend quedará disponible en:

```text
http://127.0.0.1:8000
```

Documentación interactiva de la API:

```text
http://127.0.0.1:8000/docs
```

## Configurar el frontend

Abre otra terminal desde la raíz del proyecto:

```powershell
cd frontend
npm install
```

Opcionalmente, crea `frontend/.env` si necesitas cambiar la URL del backend:

```env
VITE_API_URL=http://localhost:8000/api
```

## Levantar el frontend

Desde `frontend/`:

```powershell
npm run dev
```

El frontend quedará disponible normalmente en:

```text
http://localhost:5173
```

## Comandos útiles

Backend:

```powershell
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload
```

Frontend:

```powershell
cd frontend
npm run dev
```

Validar frontend:

```powershell
cd frontend
npm run lint
npm run build
```

## Flujo principal del sistema

```text
Paciente solicita una cita
Recepción valida y confirma
Doctor atiende y registra la atención
Sistema actualiza historial, notificaciones y disponibilidad
```

## Seguridad

- No compartas credenciales reales de Supabase ni SMTP.
- Usa contraseñas de aplicación para Gmail u otro proveedor SMTP.
- Mantén `backend/.env` fuera de Git.
- Rota las claves si accidentalmente se exponen.

## Estado del proyecto

El sistema cuenta con backend funcional, frontend responsivo y conexión con Supabase para los flujos principales de paciente, recepción/administración y médico.
