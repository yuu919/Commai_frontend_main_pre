import os
import json
from pathlib import Path
from pydantic import BaseModel, Field
from dotenv import load_dotenv


class ModelDefaults(BaseModel):
    temperature: float | None = None
    top_p: float | None = None
    max_tokens: int | None = None


class Settings(BaseModel):
    environment: str = Field(default=os.getenv("ENVIRONMENT", "development"))
    default_provider: str = Field(default=os.getenv("LLM_DEFAULT_PROVIDER", "openai"))
    model_defaults: dict = Field(default_factory=dict)  # deprecated: env JSON
    models_config: dict = Field(default_factory=dict)   # from config/models.json


def load_settings() -> Settings:
    # Load .env from package root (llm-bridge/.env) to ensure keys are found
    dotenv_path = Path(__file__).resolve().parents[2] / ".env"
    if dotenv_path.exists():
        load_dotenv(dotenv_path=dotenv_path)
    else:
        # Fallback: try current working directory
        load_dotenv()
    # Load model defaults from env (legacy)
    raw = os.getenv("LLM_MODEL_DEFAULTS_JSON")
    defaults: dict = {}
    if raw:
        try:
            defaults = json.loads(raw)
        except Exception:
            defaults = {}

    # Load models config file if exists
    root = Path(__file__).resolve().parents[2]
    models_cfg_path = root / "config" / "models.json"
    models_cfg: dict = {}
    if models_cfg_path.exists():
        try:
            with models_cfg_path.open("r", encoding="utf-8") as f:
                models_cfg = json.load(f)
        except Exception:
            models_cfg = {}

    return Settings(model_defaults=defaults, models_config=models_cfg)


settings = load_settings()


