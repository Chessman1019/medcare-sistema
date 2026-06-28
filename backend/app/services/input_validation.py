import re

DNI_PATTERN = re.compile(r"^\d{8}$")
PHONE_PATTERN = re.compile(r"^\d{9}$")


def _normalize_text(value):
    if value is None:
        return None
    return str(value).strip()


def normalize_required_dni(value):
    normalized = _normalize_text(value)
    if not normalized or not DNI_PATTERN.fullmatch(normalized):
        raise ValueError("El DNI debe tener 8 digitos numericos")
    return normalized


def normalize_optional_dni(value):
    normalized = _normalize_text(value)
    if not normalized:
        return None
    return normalize_required_dni(normalized)


def normalize_optional_phone(value):
    normalized = _normalize_text(value)
    if not normalized:
        return None
    if not PHONE_PATTERN.fullmatch(normalized):
        raise ValueError("El telefono debe tener 9 digitos numericos")
    return normalized
