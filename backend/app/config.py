from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BACKEND_DIR / ".env"


def load_backend_env() -> None:
    load_dotenv(dotenv_path=ENV_PATH, encoding="utf-8-sig")
