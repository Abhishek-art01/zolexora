import uuid
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field

def now_iso(): return datetime.now(timezone.utc).isoformat()
def new_id(): return str(uuid.uuid4())


class UserDoc(BaseModel):
    id: str = Field(default_factory=new_id)
    email: str
    name: str
    role: str = "viewer"
    coin_balance: int = 0
    subscription_plan: Optional[str] = None
    subscription_expires_at: Optional[str] = None
    is_active: bool = True
    is_email_verified: bool = False
    auth_provider: str = "email"
    picture: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class ReelDoc(BaseModel):
    id: str = Field(default_factory=new_id)
    creator_id: str
    creator_name: str
    title: str
    description: str = ""
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    media_type: str = "image"
    content_type: str = "organic"   # organic | sponsored
    linked_product_id: Optional[str] = None
    sponsor_data: Optional[dict] = None
    is_active: bool = True
    views_count: int = 0
    likes_count: int = 0
    created_at: str = Field(default_factory=now_iso)


class ProductDoc(BaseModel):
    id: str = Field(default_factory=new_id)
    seller_id: str
    seller_name: str
    title: str
    description: str
    price: float
    original_price: Optional[float] = None
    discount_percent: Optional[float] = None
    category: str = "Other"
    images: List[str] = Field(default_factory=list)
    stock: int = 999
    is_active: bool = True
    rating: float = 0.0
    reviews_count: int = 0
    created_at: str = Field(default_factory=now_iso)


class OrderItemDoc(BaseModel):
    product_id: str
    product_title: str
    price: float
    quantity: int
    image: Optional[str] = None


class OrderDoc(BaseModel):
    id: str = Field(default_factory=new_id)
    buyer_id: str
    buyer_name: str
    seller_id: str
    seller_name: str
    items: List[OrderItemDoc]
    subtotal: float
    coins_used: int = 0
    coins_discount: float = 0.0
    total_paid: float = 0.0
    payment_method: str = "razorpay"
    payment_status: str = "pending"
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    status: str = "pending"
    created_at: str = Field(default_factory=now_iso)


class CoinTxDoc(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    amount: int
    type: str   # earned | spent | bonus
    description: str
    ref_id: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class PendingRegDoc(BaseModel):
    id: str = Field(default_factory=new_id)
    email: str
    name: str
    role: str
    password_hash: str
    otp: str
    expires_at: str
    created_at: str = Field(default_factory=now_iso)
