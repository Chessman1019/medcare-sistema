import asyncio
import sys
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.routes import auth, citas, horarios, historial, notificaciones, soporte, usuarios
from app.config import load_backend_env

load_backend_env()

# Solucionar WinError 10035 en Windows
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(
    title="MedCare API",
    description="Sistema de Gestion de Citas Medicas - Clinica MedCare S.A.C.",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

app.include_router(auth.router,           prefix="/api/auth",           tags=["Autenticacion"])
app.include_router(usuarios.router,       prefix="/api/usuarios",       tags=["Usuarios"])
app.include_router(citas.router,          prefix="/api/citas",          tags=["Citas"])
app.include_router(horarios.router,       prefix="/api/horarios",       tags=["Horarios"])
app.include_router(historial.router,      prefix="/api/historial",      tags=["Historial"])
app.include_router(notificaciones.router, prefix="/api/notificaciones", tags=["Notificaciones"])
app.include_router(soporte.router,        prefix="/api/soporte",        tags=["Soporte"])

@app.get("/")
def root():
    return {"mensaje": "MedCare API funcionando", "version": "1.0.0"}
@app.on_event("startup")
async def warmup():
    import asyncio
    import time
    def _warmup():
        for intento in range(10):
            try:
                from app.database import supabase
                supabase.table("especialidad").select("id_especialidad").limit(1).execute()
                print(f"✅ Conexión Supabase lista (intento {intento + 1})")
                return
            except Exception as e:
                print(f"⏳ Warmup intento {intento + 1}/10: {e}")
                time.sleep(1.5)
        print("⚠️ Warmup agotado — el sistema seguirá funcionando")
    
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _warmup)