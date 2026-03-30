import uuid
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from core.deps import db_dep, current_user, seller_only
from models.documents import ProductDoc

router = APIRouter(prefix="/products", tags=["products"])
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)


class ProductCreate(BaseModel):
    title: str
    description: str
    price: float
    original_price: Optional[float] = None
    discount_percent: Optional[float] = None
    category: str = "Other"
    images: List[str] = []
    stock: int = 999


class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    discount_percent: Optional[float] = None
    category: Optional[str] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None


@router.get("")
async def list_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = "newest",
    limit: int = 40,
    skip: int = 0,
    db: AsyncIOMotorDatabase = Depends(db_dep),
):
    q: dict = {"is_active": True}
    if category and category != "All":
        q["category"] = category
    if search:
        q["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]
    if min_price is not None:
        q.setdefault("price", {})["$gte"] = min_price
    if max_price is not None:
        q.setdefault("price", {})["$lte"] = max_price

    sort_map = {
        "newest": [("created_at", -1)],
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "popular": [("reviews_count", -1)],
    }
    cursor = db.products.find(q, {"_id": 0}).sort(sort_map.get(sort, [("created_at", -1)])).skip(skip).limit(limit)
    return await cursor.to_list(limit)


@router.get("/my")
async def my_products(user=Depends(seller_only), db: AsyncIOMotorDatabase = Depends(db_dep)):
    return await db.products.find({"seller_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.get("/{product_id}")
async def get_product(product_id: str, db: AsyncIOMotorDatabase = Depends(db_dep)):
    p = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Product not found")
    return p


@router.post("")
async def create_product(data: ProductCreate, user=Depends(seller_only), db: AsyncIOMotorDatabase = Depends(db_dep)):
    product = ProductDoc(seller_id=user["id"], seller_name=user["name"], **data.model_dump())
    await db.products.insert_one(product.model_dump())
    return product.model_dump()


@router.put("/{product_id}")
async def update_product(product_id: str, data: ProductUpdate, user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    fq = {"id": product_id} if user["role"] == "admin" else {"id": product_id, "seller_id": user["id"]}
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "No fields to update")
    result = await db.products.update_one(fq, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Product not found or not yours")
    return {"message": "Updated"}


@router.delete("/{product_id}")
async def delete_product(product_id: str, user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    fq = {"id": product_id} if user["role"] == "admin" else {"id": product_id, "seller_id": user["id"]}
    await db.products.delete_one(fq)
    return {"message": "Deleted"}


@router.post("/{product_id}/upload-image")
async def upload_image(product_id: str, file: UploadFile = File(...), user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    fq = {"id": product_id} if user["role"] == "admin" else {"id": product_id, "seller_id": user["id"]}
    if not await db.products.find_one(fq):
        raise HTTPException(404, "Product not found")
    ext = (file.filename or "img.jpg").rsplit(".", 1)[-1].lower()
    fname = f"{uuid.uuid4()}.{ext}"
    (UPLOADS_DIR / fname).write_bytes(await file.read())
    url = f"/api/static/{fname}"
    await db.products.update_one({"id": product_id}, {"$push": {"images": url}})
    return {"image_url": url}
