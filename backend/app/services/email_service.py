import os
import smtplib
import socket
from email.message import EmailMessage

import requests

from app.config import load_backend_env

load_backend_env()

# Forzar IPv4 (Render sin salida IPv6) para el modo SMTP local
_orig_getaddrinfo = socket.getaddrinfo


def _getaddrinfo_ipv4(host, port, family=0, *args, **kwargs):
    return _orig_getaddrinfo(host, port, socket.AF_INET, *args, **kwargs)


socket.getaddrinfo = _getaddrinfo_ipv4


def _cuerpo_recuperacion(nombre: str, codigo: str) -> str:
    return "\n".join([
        f"Hola {nombre or 'usuario'},",
        "",
        "Recibimos una solicitud para restablecer tu contrasena.",
        f"Tu codigo de recuperacion es: {codigo}",
        "",
        "Este codigo vence en 10 minutos. Si no solicitaste el cambio, ignora este mensaje.",
        "",
        "Clinica MedCare S.A.C.",
    ])


def _send_via_brevo(to_email: str, subject: str, text: str) -> None:
    """Envio por API HTTPS (puerto 443): compatible con Render free."""
    api_key = os.getenv("BREVO_API_KEY")
    sender = os.getenv("SMTP_FROM") or os.getenv("SMTP_USER")
    if not sender:
        raise RuntimeError("Remitente no configurado (SMTP_FROM)")
    resp = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={"api-key": api_key, "Content-Type": "application/json"},
        json={
            "sender": {"name": "Clinica MedCare", "email": sender},
            "to": [{"email": to_email}],
            "subject": subject,
            "textContent": text,
        },
        timeout=15,
    )
    resp.raise_for_status()


def _send_via_smtp(to_email: str, subject: str, text: str) -> None:
    """Envio SMTP clasico: usado en desarrollo local."""
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM") or user
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() != "false"
    if not host or not sender:
        raise RuntimeError("SMTP no configurado")
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email
    msg.set_content(text)
    with smtplib.SMTP(host, port, timeout=15) as server:
        if use_tls:
            server.starttls()
        if user and password:
            server.login(user, password)
        server.send_message(msg)


def send_password_recovery_code(to_email: str, nombre: str, codigo: str) -> None:
    subject = "Codigo de recuperacion - Clinica MedCare"
    text = _cuerpo_recuperacion(nombre, codigo)
    if os.getenv("BREVO_API_KEY"):
        _send_via_brevo(to_email, subject, text)
    else:
        _send_via_smtp(to_email, subject, text)