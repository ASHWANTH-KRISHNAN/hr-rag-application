from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "mysql+pymysql://root:password@127.0.0.1:3306/hr_rag"
    ollama_base_url: str = "http://127.0.0.1:11434"
    llm_model: str = "llama3.2"
    embed_model: str = "nomic-embed-text"
    chroma_path: str = "./chroma_db"
    documents_path: str = "./data"
    jwt_secret: str = "development-only-change-me"
    access_token_minutes: int = 60
    seed_admin_username: str = "hradmin"
    seed_admin_password: str = "ChangeThisAdmin123!"
    seed_employee_username: str = "employee"
    seed_employee_password: str = "ChangeThisEmployee123!"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
