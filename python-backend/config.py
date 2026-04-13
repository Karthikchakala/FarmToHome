from pathlib import Path

from dotenv import dotenv_values
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
  model_config = SettingsConfigDict(extra="ignore")

  project_root: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[1])
  farming_markdown_path: Path = Field(
    default_factory=lambda: Path(__file__).resolve().parents[1] / "Farming_Data_RAG.md"
  )
  vectorstore_dir: Path = Field(
    default_factory=lambda: Path(__file__).resolve().parent / "vectorstore"
  )

  groq_api_key: str | None = Field(
    default=None,
  )

  @classmethod
  def settings_customise_sources(
    cls,
    settings_cls,
    init_settings,
    env_settings,
    dotenv_settings,
    file_secret_settings,
  ):
    def merged_dotenv_settings() -> dict:
      # Load the root .env first, then let python-backend/.env override it.
      root_env = Path(__file__).resolve().parents[1] / ".env"
      local_env = Path(__file__).resolve().parent / ".env"

      values: dict = {}
      if root_env.exists():
        values.update({k: v for k, v in dotenv_values(root_env).items() if v is not None})
      if local_env.exists():
        values.update({k: v for k, v in dotenv_values(local_env).items() if v is not None})

      groq_key = values.get("GROQ_API_KEY")
      return {"groq_api_key": groq_key} if groq_key else {}

    return init_settings, env_settings, merged_dotenv_settings, file_secret_settings


settings = Settings()
