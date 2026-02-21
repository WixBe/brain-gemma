import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MedGemma Brain Tumor API" # <---project name--->
    LLM_BASE_URL: str = "http://[IP_ADDRESS]/v1" # <---chat api--->
    LLM_MODEL: str = "medgemma-1.5-4b-it" # <---model name--->
    LLM_API_KEY: str = "lm-studio" # <---api key--->
    UPLOAD_DIR: str = "uploads" # <---upload directory--->
    
settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
