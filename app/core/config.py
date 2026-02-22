import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "BrainGemma API"

    # MedGemma LLM — point to LM Studio or any OpenAI-compatible server
    LLM_BASE_URL: str = "http://localhost:1234/v1"
    LLM_MODEL: str = "medgemma-1.5-4b-it"
    LLM_API_KEY: str = "lm-studio"

    # File uploads
    UPLOAD_DIR: str = "uploads"

    # Runtime
    ENV: str = "development"        # development | production
    PORT: int = 8000

    # Production CORS (ignored in dev mode)
    ALLOWED_ORIGINS: str = "https://your-frontend-domain.com"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
