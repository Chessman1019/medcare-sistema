import os
import smtplib
import socket
from email.message import EmailMessage

from app.config import load_backend_env

load_backend_env()

# --- Parche IPv4 ---
# Render (plan free) no tiene ruta de salida IPv6, y smtp.gmail.com resuelve
# primero a IPv6, lo que produce "[Errno 101] Network is unreachable".
# Forzamos que las conexiones SMTP resuelvan solo direcciones IPv4.
_orig_getaddrinfo = socket.getaddrinfo


def _getaddrinfo_ipv4(host, port, family=0, *args, **kwargs):
    return _orig_getaddrinfo(host, port, socket.AF_INET, *args, **kwargs)


socket.getaddrinfo = _getaddrinfo_ipv4
# --- Fin parche IPv4 ---


def send_password_recovery_code(to_email: str, nombre: str, codigo: str) -> None:
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM") or user
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() != "false"
    if not host or not sender:
        raise RuntimeError("SMTP no configurado")
    msg = EmailMessage()
    msg["Subject"] = "Codigo de recuperacion - Clinica MedCare"
    msg["From"] = sender
    msg["To"] = to_email
    msg.set_content(
        "\n".join([
            f"Hola {nombre or 'usuario'},",
            "",
            "Recibimos una solicitud para restablecer tu contrasena.",
            f"Tu codigo de recuperacion es: {codigo}",
            "",
            "Este codigo vence en 10 minutos. Si no solicitaste el cambio, ignora este mensaje.",
            "",
            "Clinica MedCare S.A.C.",
        ])
    )
    with smtplib.SMTP(host, port, timeout=15) as server:
        if use_tls:
            server.starttls()
        if user and password:
            server.login(user, password)
        server.send_message(msg)