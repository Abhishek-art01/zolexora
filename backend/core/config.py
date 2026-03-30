import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")


class Settings:
    MONGO_URL: str = os.environ.get("MONGO_URL", "")
    DB_NAME: str = os.environ.get("DB_NAME", "zolexora_db")
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 168

    RESEND_API_KEY: str = os.environ.get("RESEND_API_KEY", "")
    SENDER_EMAIL: str = os.environ.get("SENDER_EMAIL", "noreply@zolexora.com")

    RAZORPAY_KEY_ID: str = os.environ.get("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str = os.environ.get("RAZORPAY_KEY_SECRET", "")
    RAZORPAY_WEBHOOK_SECRET: str = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")

    CORS_ORIGINS: list = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",")]

    BUYER_URL: str = os.environ.get("BUYER_URL", "https://zolexora.com")
    SELLER_URL: str = os.environ.get("SELLER_URL", "https://seller.zolexora.com")
    ADMIN_URL: str = os.environ.get("ADMIN_URL", "https://admin.zolexora.com")

    COINS_PER_REEL_VIEW: int = 3
    COINS_CREATOR_PER_VIEW: int = 3
    MAX_DAILY_COINS: int = 150
    COIN_VALUE: float = 0.01
    MAX_COIN_DISCOUNT: float = 0.50

    SUBSCRIPTION_PLANS: dict = {
        "basic":   {"name": "Basic",   "price": 399, "coins_bonus": 100, "description": "100 bonus coins/month"},
        "premium": {"name": "Premium", "price": 799, "coins_bonus": 250, "description": "250 bonus coins/month + double earn days"},
    }
    CATEGORIES: list = ["Electronics","Fashion","Home & Living","Beauty","Sports","Food","Other"]

settings = Settings()
