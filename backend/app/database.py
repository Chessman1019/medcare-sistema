import os
import httpx
from supabase import create_client, Client
from app.config import load_backend_env

load_backend_env()

SUPABASE_URL: str = os.getenv("SUPABASE_URL")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Forzar HTTP/1.1 para evitar WinError 10035 en Windows
supabase.postgrest.session = httpx.Client(http2=False)
supabase_admin.postgrest.session = httpx.Client(http2=False)