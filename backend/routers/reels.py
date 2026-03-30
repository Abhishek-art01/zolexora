import uuid
from pathlib import Path
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from core.deps import db_dep, current_user, optional_user
from core.config import settings
from models.documents import ReelDoc, CoinTxDoc

router = APIRouter(prefix="/reels", tags=["reels"])
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"


class ReelCreate(BaseModel):
    title: str
    description: str = ""
    linked_product_id: Optional[str] = None
    content_type: str = "organic"   # organic | sponsored
    sponsor_data: Optional[dict] = None


@router.get("")
async def list_reels(limit: int = 30, skip: int = 0, db: AsyncIOMotorDatabase = Depends(db_dep)):
    return await db.reels.find({"is_active": True}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)


@router.get("/my")
async def my_reels(user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    return await db.reels.find({"creator_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.post("")
async def create_reel(data: ReelCreate, user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    reel = ReelDoc(
        creator_id=user["id"], creator_name=user["name"],
        **data.model_dump()
    )
    await db.reels.insert_one(reel.model_dump())
    return reel.model_dump()


@router.post("/{reel_id}/upload")
async def upload_reel_media(reel_id: str, file: UploadFile = File(...), user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    if not await db.reels.find_one({"id": reel_id, "creator_id": user["id"]}):
        raise HTTPException(404, "Reel not found")
    is_video = (file.content_type or "").startswith("video/")
    ext = (file.filename or "media.mp4").rsplit(".", 1)[-1].lower()
    fname = f"{uuid.uuid4()}.{ext}"
    (UPLOADS_DIR / fname).write_bytes(await file.read())
    url = f"/api/static/{fname}"
    mt = "video" if is_video else "image"
    await db.reels.update_one({"id": reel_id}, {"$set": {"video_url": url, "thumbnail_url": url, "media_type": mt}})
    return {"video_url": url}


@router.post("/{reel_id}/view")
async def view_reel(reel_id: str, user=Depends(optional_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    reel = await db.reels.find_one({"id": reel_id, "is_active": True})
    if not reel:
        raise HTTPException(404, "Reel not found")

    await db.reels.update_one({"id": reel_id}, {"$inc": {"views_count": 1}})

    if not user:
        return {"coins_earned": 0, "message": "Login to earn coins"}

    # Check daily dedup
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    if await db.reel_views.find_one({"user_id": user["id"], "reel_id": reel_id, "created_at": {"$gte": today}}):
        return {"coins_earned": 0, "message": "Already earned today for this reel"}

    # Check daily limit
    daily_earned = await db.coin_transactions.count_documents({
        "user_id": user["id"], "type": "earned", "created_at": {"$gte": today}
    })
    if daily_earned * settings.COINS_PER_REEL_VIEW >= settings.MAX_DAILY_COINS:
        return {"coins_earned": 0, "message": "Daily coin limit reached"}

    # Award viewer
    await db.reel_views.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"], "reel_id": reel_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.users.update_one({"id": user["id"]}, {"$inc": {"coin_balance": settings.COINS_PER_REEL_VIEW}})
    tx = CoinTxDoc(user_id=user["id"], amount=settings.COINS_PER_REEL_VIEW, type="earned",
                   description=f"Watched reel: {reel['title']}", ref_id=reel_id)
    await db.coin_transactions.insert_one(tx.model_dump())

    # Award creator
    if reel["creator_id"] != user["id"]:
        await db.users.update_one({"id": reel["creator_id"]}, {"$inc": {"coin_balance": settings.COINS_CREATOR_PER_VIEW}})
        ctx = CoinTxDoc(user_id=reel["creator_id"], amount=settings.COINS_CREATOR_PER_VIEW,
                        type="earned", description=f"View on your reel: {reel['title']}", ref_id=reel_id)
        await db.coin_transactions.insert_one(ctx.model_dump())

    return {"coins_earned": settings.COINS_PER_REEL_VIEW, "message": f"+{settings.COINS_PER_REEL_VIEW} coins!"}


@router.put("/{reel_id}")
async def update_reel(reel_id: str, data: dict, user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    allowed = {"title", "description", "linked_product_id", "sponsor_data", "is_active"}
    update = {k: v for k, v in data.items() if k in allowed}
    fq = {"id": reel_id} if user["role"] == "admin" else {"id": reel_id, "creator_id": user["id"]}
    await db.reels.update_one(fq, {"$set": update})
    return {"message": "Updated"}


@router.delete("/{reel_id}")
async def delete_reel(reel_id: str, user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    fq = {"id": reel_id} if user["role"] == "admin" else {"id": reel_id, "creator_id": user["id"]}
    await db.reels.delete_one(fq)
    return {"message": "Deleted"}
