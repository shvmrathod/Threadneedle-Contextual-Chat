"""Runtime configuration loaded from environment variables."""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # OpenRouter
    openrouter_api_key: str = ""
    openrouter_model: str = "openai/gpt-oss-20b:free"

    # AI Provider
    ai_provider: str = "openrouter"

    # CORS
    allowed_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [
            o.strip()
            for o in self.allowed_origins.split(",")
            if o.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()