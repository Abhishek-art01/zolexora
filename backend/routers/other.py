from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import Optional
from core.deps import db_dep, current_user, admin_only
from core.config import settings
from models.documents import CoinTxDoc

# ── Orders ────────────────────────────────────────────────────────────────────
orders_router = APIRouter(prefix="/orders", tags=["orders"])

@orders_router.get("/my")
async def my_orders(user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    return await db.orders.find({"buyer_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)

@orders_router.get("/seller")
async def seller_orders(user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    if user["role"] not in ["seller", "admin"]:
        raise HTTPException(403, "Sellers only")
    q = {} if user["role"] == "admin" else {"seller_id": user["id"]}
    return await db.orders.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)

@orders_router.put("/{order_id}/status")
async def update_order_status(order_id: str, status: str, user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    valid = ["processing", "shipped", "delivered", "cancelled"]
    if status not in valid:
        raise HTTPException(400, f"Status must be one of: {valid}")
    fq = {"id": order_id} if user["role"] == "admin" else {"id": order_id, "seller_id": user["id"]}
    await db.orders.update_one(fq, {"$set": {"status": status}})
    return {"message": "Status updated"}

@orders_router.get("/{order_id}")
async def get_order(order_id: str, user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    if user["role"] != "admin" and order["buyer_id"] != user["id"] and order.get("seller_id") != user["id"]:
        raise HTTPException(403, "Not your order")
    return order


# ── Coins ─────────────────────────────────────────────────────────────────────
coins_router = APIRouter(prefix="/coins", tags=["coins"])

@coins_router.get("/balance")
async def coin_balance(user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    doc = await db.users.find_one({"id": user["id"]}, {"_id": 0, "coin_balance": 1})
    return {"coin_balance": doc["coin_balance"]}

@coins_router.get("/history")
async def coin_history(user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    return await db.coin_transactions.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)

class DiscountReq(BaseModel):
    coins_to_spend: int
    product_id: Optional[str] = None

DISCOUNT_TIERS = [
    {"coins": 50,  "percent": 10},
    {"coins": 100, "percent": 20},
    {"coins": 200, "percent": 30},
]

@coins_router.post("/generate-discount")
async def generate_discount(req: DiscountReq, user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    import uuid
    tier = next((t for t in DISCOUNT_TIERS if t["coins"] == req.coins_to_spend), None)
    if not tier:
        raise HTTPException(400, f"Valid amounts: {[t['coins'] for t in DISCOUNT_TIERS]}")
    doc = await db.users.find_one({"id": user["id"]})
    if doc["coin_balance"] < tier["coins"]:
        raise HTTPException(400, "Insufficient coins")
    code = str(uuid.uuid4())[:8].upper()
    discount = {
        "id": str(uuid.uuid4()), "user_id": user["id"], "code": code,
        "discount_percent": tier["percent"], "coins_spent": tier["coins"],
        "is_used": False, "product_id": req.product_id,
        "created_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
    }
    await db.discount_codes.insert_one(discount)
    await db.users.update_one({"id": user["id"]}, {"$inc": {"coin_balance": -tier["coins"]}})
    tx = CoinTxDoc(user_id=user["id"], amount=-tier["coins"], type="spent",
                   description=f"Generated {tier['percent']}% discount code")
    await db.coin_transactions.insert_one(tx.model_dump())
    discount.pop("_id", None)
    return discount

@coins_router.get("/discounts")
async def my_discounts(user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    return await db.discount_codes.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)


# ── Subscriptions ─────────────────────────────────────────────────────────────
subs_router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

@subs_router.get("/plans")
async def get_plans():
    return settings.SUBSCRIPTION_PLANS

class SubReq(BaseModel):
    plan_type: str

@subs_router.post("/checkout")
async def sub_checkout(req: SubReq, user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    if req.plan_type not in settings.SUBSCRIPTION_PLANS:
        raise HTTPException(400, "Invalid plan")
    if not settings.RAZORPAY_KEY_ID:
        raise HTTPException(503, "Payment gateway not configured yet")
    plan = settings.SUBSCRIPTION_PLANS[req.plan_type]
    import razorpay
    rz = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    rz_order = rz.order.create({
        "amount": int(plan["price"] * 100),
        "currency": "INR",
        "notes": {"user_id": user["id"], "plan_type": req.plan_type, "type": "subscription"},
    })
    await db.payment_transactions.insert_one({
        "id": __import__("uuid").uuid4().__str__(),
        "user_id": user["id"], "razorpay_order_id": rz_order["id"],
        "amount": plan["price"], "plan_type": req.plan_type, "status": "pending",
        "created_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
    })
    return {"razorpay_order_id": rz_order["id"], "amount": plan["price"], "key_id": settings.RAZORPAY_KEY_ID}


# ── Admin ─────────────────────────────────────────────────────────────────────
admin_router = APIRouter(prefix="/admin", tags=["admin"])

@admin_router.get("/stats")
async def admin_stats(u=Depends(admin_only), db: AsyncIOMotorDatabase = Depends(db_dep)):
    return {
        "total_users":       await db.users.count_documents({}),
        "viewers":           await db.users.count_documents({"role": "viewer"}),
        "sellers":           await db.users.count_documents({"role": "seller"}),
        "total_products":    await db.products.count_documents({}),
        "active_products":   await db.products.count_documents({"is_active": True}),
        "total_reels":       await db.reels.count_documents({}),
        "sponsored_reels":   await db.reels.count_documents({"content_type": "sponsored"}),
        "total_orders":      await db.orders.count_documents({}),
        "paid_orders":       await db.orders.count_documents({"payment_status": "paid"}),
        "total_reel_views":  await db.reel_views.count_documents({}),
        "pending_orders":    await db.orders.count_documents({"status": "pending"}),
    }

@admin_router.get("/users")
async def admin_users(u=Depends(admin_only), db: AsyncIOMotorDatabase = Depends(db_dep)):
    return await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)

@admin_router.put("/users/{uid}/role")
async def admin_set_role(uid: str, role: str, u=Depends(admin_only), db: AsyncIOMotorDatabase = Depends(db_dep)):
    if role not in ["admin", "seller", "viewer"]:
        raise HTTPException(400, "Invalid role")
    await db.users.update_one({"id": uid}, {"$set": {"role": role}})
    return {"message": "Role updated"}

@admin_router.put("/users/{uid}/toggle")
async def admin_toggle_user(uid: str, u=Depends(admin_only), db: AsyncIOMotorDatabase = Depends(db_dep)):
    doc = await db.users.find_one({"id": uid})
    if not doc:
        raise HTTPException(404, "User not found")
    await db.users.update_one({"id": uid}, {"$set": {"is_active": not doc["is_active"]}})
    return {"is_active": not doc["is_active"]}

@admin_router.get("/products")
async def admin_products(u=Depends(admin_only), db: AsyncIOMotorDatabase = Depends(db_dep)):
    return await db.products.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@admin_router.put("/products/{pid}/toggle")
async def admin_toggle_product(pid: str, u=Depends(admin_only), db: AsyncIOMotorDatabase = Depends(db_dep)):
    p = await db.products.find_one({"id": pid})
    if not p:
        raise HTTPException(404)
    await db.products.update_one({"id": pid}, {"$set": {"is_active": not p["is_active"]}})
    return {"is_active": not p["is_active"]}

@admin_router.delete("/products/{pid}")
async def admin_delete_product(pid: str, u=Depends(admin_only), db: AsyncIOMotorDatabase = Depends(db_dep)):
    await db.products.delete_one({"id": pid})
    return {"message": "Deleted"}

@admin_router.get("/reels")
async def admin_reels(u=Depends(admin_only), db: AsyncIOMotorDatabase = Depends(db_dep)):
    return await db.reels.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@admin_router.put("/reels/{rid}/toggle")
async def admin_toggle_reel(rid: str, u=Depends(admin_only), db: AsyncIOMotorDatabase = Depends(db_dep)):
    r = await db.reels.find_one({"id": rid})
    if not r:
        raise HTTPException(404)
    await db.reels.update_one({"id": rid}, {"$set": {"is_active": not r["is_active"]}})
    return {"is_active": not r["is_active"]}

@admin_router.delete("/reels/{rid}")
async def admin_delete_reel(rid: str, u=Depends(admin_only), db: AsyncIOMotorDatabase = Depends(db_dep)):
    await db.reels.delete_one({"id": rid})
    return {"message": "Deleted"}

@admin_router.get("/orders")
async def admin_orders(u=Depends(admin_only), db: AsyncIOMotorDatabase = Depends(db_dep)):
    return await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@admin_router.get("/analytics")
async def admin_analytics(u=Depends(admin_only), db: AsyncIOMotorDatabase = Depends(db_dep)):
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    seven_days_ago = (now - timedelta(days=7)).isoformat()
    return {
        "new_users_30d":   await db.users.count_documents({"created_at": {"$gte": thirty_days_ago}}),
        "new_users_7d":    await db.users.count_documents({"created_at": {"$gte": seven_days_ago}}),
        "orders_30d":      await db.orders.count_documents({"created_at": {"$gte": thirty_days_ago}}),
        "orders_7d":       await db.orders.count_documents({"created_at": {"$gte": seven_days_ago}}),
        "reels_views_30d": await db.reel_views.count_documents({"created_at": {"$gte": thirty_days_ago}}),
        "coins_earned_30d": await db.coin_transactions.count_documents({"type": "earned", "created_at": {"$gte": thirty_days_ago}}),
    }
