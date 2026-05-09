from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    openai_embedding_model: str = "text-embedding-3-small"

    notion_token: str = ""
    notion_dogs_database_id: str = ""
    notion_medical_database_id: str = ""
    notion_medications_database_id: str = ""
    notion_consultations_database_id: str = ""

    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "pawmind_medical"
    qdrant_api_key: str | None = None

    cors_origins: str = "http://localhost:3020,http://127.0.0.1:3020"

    default_dog_name: str = "your dog"

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
