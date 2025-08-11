from pydantic_settings import BaseSettings
from pydantic import AnyUrl
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: AnyUrl
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
