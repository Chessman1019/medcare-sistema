from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, citas, horarios, historial, usuarios

app = FastAPI(
    title="MedCare API",
    description="Sistema de Gestion de Citas Medicas - Clinica MedCare S.A.C.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/api/auth",      tags=["Autenticacion"])
app.include_router(usuarios.router,  prefix="/api/usuarios",  tags=["Usuarios"])
app.include_router(citas.router,     prefix="/api/citas",     tags=["Citas"])
app.include_router(horarios.router,  prefix="/api/horarios",  tags=["Horarios"])
app.include_router(historial.router, prefix="/api/historial", tags=["Historial"])

@app.get("/")
def root():
    return {"mensaje": "MedCare API funcionando", "version": "1.0.0"}