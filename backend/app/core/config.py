import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "BorderGuard AI"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server host & port
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # JWT Security
    SECRET_KEY: str = "super-secret-security-operations-center-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours for operational shifts

    # Internal AI Engine HMAC Secret
    AI_SERVICE_SECRET: str = "ai-engine-internal-hmac-secret-key-987654"

    # Database
    # Default is SQLite for zero-setup execution; can be overridden by env DATABASE_URL for Postgres
    DATABASE_URL: str = "sqlite+aiosqlite:///./borderguard.db"

    # Storage Paths
    STORAGE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../storage"))
    SNAPSHOT_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../storage/snapshots"))
    CLIP_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../storage/clips"))

    # CORS Whitelist
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    # Roboflow Serverless Cloud API Settings
    ROBOFLOW_API_KEY: str = ""
    ROBOFLOW_MODEL_ID: str = "people-detection-o4rdr-3yyvd/1"
    ROBOFLOW_API_URL: str = "https://serverless.roboflow.com"
    DETECTION_ENGINE: str = "yolo"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        return ["*"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()

# Ensure storage directories exist at startup
os.makedirs(settings.SNAPSHOT_DIR, exist_ok=True)
os.makedirs(settings.CLIP_DIR, exist_ok=True)
