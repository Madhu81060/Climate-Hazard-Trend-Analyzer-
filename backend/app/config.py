import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Climate Hazard Trend Analyzer"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database settings
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "climate_hazard_db")
    TINYDB_PATH: str = os.getenv("TINYDB_PATH", "backend/data/nosql_db.json")
    
    # Cache settings
    CACHE_EXPIRATION_SECONDS: int = 60 * 60 * 24 * 7  # 7 days
    
    # Rate Limiting
    RATE_LIMIT_DEFAULT: str = "60/minute"
    
    # External API settings
    OPEN_METEO_ARCHIVE_URL: str = "https://archive-api.open-meteo.com/v1/archive"
    API_REQUEST_TIMEOUT: float = 30.0
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
