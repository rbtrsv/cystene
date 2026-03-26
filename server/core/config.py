import secrets
from datetime import timedelta
from typing import List, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    # Basic application settings
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    PROJECT_NAME: str = "Nudgio API"
    VERSION: str = "0.1.0"
    DESCRIPTION: str = "Ecommerce Recommendation Engine"

    # URL settings
    SERVER_URL: str = "http://localhost:8002"
    FRONTEND_URL: str = "http://localhost:3002"
    
    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours (1 day) to match Django Ninja
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 days default
    
    # Computed properties for token expiration
    @property
    def ACCESS_TOKEN_EXPIRATION(self) -> timedelta:
        return timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    @property
    def REFRESH_TOKEN_EXPIRATION(self) -> timedelta:
        return timedelta(days=self.REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Database settings
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost/dbname"
    
    # CORS configuration
    BACKEND_CORS_ORIGINS: str = "http://localhost:3002"
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> str:
        if isinstance(v, str):
            return v
        elif isinstance(v, list):
            return ','.join(v)
        raise ValueError("Invalid BACKEND_CORS_ORIGINS format")
    
    # Stripe settings
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # Google OAuth settings
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: Optional[str] = None
    
    # Email settings
    GMAIL_USER: Optional[str] = None
    GMAIL_APP_PASSWORD: Optional[str] = None
    EMAILS_ENABLED: bool = False

    # Shopify OAuth settings
    SHOPIFY_CLIENT_ID: Optional[str] = None
    SHOPIFY_CLIENT_SECRET: Optional[str] = None
    SHOPIFY_SCOPES: str = "read_products,read_orders"
    SHOPIFY_REDIRECT_URI: Optional[str] = None
    SHOPIFY_API_VERSION: str = "2026-01"
    
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()