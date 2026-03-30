import uuid
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from core.deps import db_dep, current_user
from core.config import settings
from models.documents import OrderDoc, OrderItemDoc, CoinTxDoc

router = APIRouter(tags=["cart"])


class CartAddReq(BaseModel):
    product_id: str
    quantity: int = 1


class CheckoutReq(BaseModel):
    coins_to_use: int = 0
    origin_url: str = "https://zolexora.com"


# ── Cart ─────────────────────────────────────────────────────────────────────

@router.get("/cart")
async def get_cart(user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    items = await db.cart.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
    result = []
    for item in items:
        p = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if p:
            result.append({**item, "product": p})
    return result


@router.get("/cart/count")
async def cart_count(user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    count = await db.cart.count_documents({"user_id": user["id"]})
    return {"count": count}


@router.post("/cart/items")
async def add_to_cart(data: CartAddReq, user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    product = await db.products.find_one({"id": data.product_id, "is_active": True})
    if not product:
        raise HTTPException(404, "Product not found")
    existing = await db.cart.find_one({"user_id": user["id"], "product_id": data.product_id})
    if existing:
        await db.cart.update_one(
            {"user_id": user["id"], "product_id": data.product_id},
            {"$inc": {"quantity": data.quantity}}
        )
    else:
        await db.cart.insert_one({
            "id": str(uuid.uuid4()), "user_id": user["id"],
            "product_id": data.product_id, "quantity": data.quantity,
        })
    return {"message": "Added to cart"}


@router.put("/cart/items/{product_id}")
async def update_cart_item(product_id: str, quantity: int, user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    if quantity <= 0:
        await db.cart.delete_one({"user_id": user["id"], "product_id": product_id})
    else:
        await db.cart.update_one(
            {"user_id": user["id"], "product_id": product_id},
            {"$set": {"quantity": quantity}}
        )
    return {"message": "Updated"}


@router.delete("/cart/items/{product_id}")
async def remove_cart_item(product_id: str, user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    await db.cart.delete_one({"user_id": user["id"], "product_id": product_id})
    return {"message": "Removed"}


@router.delete("/cart")
async def clear_cart(user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    await db.cart.delete_many({"user_id": user["id"]})
    return {"message": "Cart cleared"}


# ── Checkout ──────────────────────────────────────────────────────────────────

@router.post("/cart/checkout")
async def checkout(req: CheckoutReq, user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    cart_items = await db.cart.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
    if not cart_items:
        raise HTTPException(400, "Cart is empty")

    items = []
    subtotal = 0.0
    seller_id = None
    seller_name = None

    for ci in cart_items:
        p = await db.products.find_one({"id": ci["product_id"], "is_active": True})
        if not p:
            continue
        items.append(OrderItemDoc(
            product_id=p["id"], product_title=p["title"],
            price=p["price"], quantity=ci["quantity"],
            image=p["images"][0] if p.get("images") else None,
        ))
        subtotal += p["price"] * ci["quantity"]
        if not seller_id:
            seller_id = p["seller_id"]
            seller_name = p["seller_name"]

    if not items:
        raise HTTPException(400, "No valid products in cart")

    # Coin discount calculation
    user_doc = await db.users.find_one({"id": user["id"]})
    max_coins = min(
        req.coins_to_use,
        user_doc["coin_balance"],
        int((subtotal * settings.MAX_COIN_DISCOUNT) / settings.COIN_VALUE),
    )
    coins_discount = round(max_coins * settings.COIN_VALUE, 2)
    amount_to_pay = max(0.0, round(subtotal - coins_discount, 2))

    order = OrderDoc(
        buyer_id=user["id"], buyer_name=user["name"],
        seller_id=seller_id or "", seller_name=seller_name or "",
        items=items, subtotal=subtotal,
        coins_used=max_coins, coins_discount=coins_discount,
        total_paid=amount_to_pay,
        payment_method="razorpay" if amount_to_pay > 0 else "coins",
    )
    await db.orders.insert_one(order.model_dump())

    # Fully paid with coins
    if amount_to_pay == 0:
        await db.users.update_one({"id": user["id"]}, {"$inc": {"coin_balance": -max_coins}})
        if max_coins > 0:
            tx = CoinTxDoc(user_id=user["id"], amount=-max_coins, type="spent",
                           description=f"Order #{order.id[:8]} paid with coins", ref_id=order.id)
            await db.coin_transactions.insert_one(tx.model_dump())
        await db.orders.update_one({"id": order.id}, {"$set": {"payment_status": "paid", "status": "processing"}})
        await db.cart.delete_many({"user_id": user["id"]})
        return {"type": "coins", "order_id": order.id, "message": "Order placed!"}

    # Razorpay — create order
    if not settings.RAZORPAY_KEY_ID:
        # Payment gateway not configured yet — return pending order
        return {
            "type": "razorpay_pending_setup",
            "order_id": order.id,
            "amount": amount_to_pay,
            "message": "Payment gateway not configured yet. Order saved.",
        }

    import razorpay
    rz_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    rz_order = rz_client.order.create({
        "amount": int(amount_to_pay * 100),  # paise
        "currency": "INR",
        "receipt": order.id,
        "notes": {"order_id": order.id, "buyer_id": user["id"], "coins_used": str(max_coins)},
    })
    await db.orders.update_one({"id": order.id}, {"$set": {"razorpay_order_id": rz_order["id"]}})
    return {
        "type": "razorpay",
        "razorpay_order_id": rz_order["id"],
        "amount": amount_to_pay,
        "currency": "INR",
        "order_id": order.id,
        "key_id": settings.RAZORPAY_KEY_ID,
    }


@router.post("/cart/checkout/verify-payment")
async def verify_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    user=Depends(current_user),
    db: AsyncIOMotorDatabase = Depends(db_dep),
):
    if not settings.RAZORPAY_KEY_ID:
        raise HTTPException(503, "Payment gateway not configured")

    import razorpay
    import hmac, hashlib
    # Verify signature
    msg = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        msg.encode(), hashlib.sha256
    ).hexdigest()
    if expected != razorpay_signature:
        raise HTTPException(400, "Payment signature invalid")

    order = await db.orders.find_one({"razorpay_order_id": razorpay_order_id})
    if not order:
        raise HTTPException(404, "Order not found")

    await db.orders.update_one(
        {"razorpay_order_id": razorpay_order_id},
        {"$set": {
            "payment_status": "paid",
            "status": "processing",
            "razorpay_payment_id": razorpay_payment_id,
        }}
    )

    # Deduct coins
    coins_used = order.get("coins_used", 0)
    if coins_used > 0:
        await db.users.update_one({"id": user["id"]}, {"$inc": {"coin_balance": -coins_used}})
        tx = CoinTxDoc(user_id=user["id"], amount=-coins_used, type="spent",
                       description=f"Order #{order['id'][:8]}", ref_id=order["id"])
        await db.coin_transactions.insert_one(tx.model_dump())

    await db.cart.delete_many({"user_id": user["id"]})
    return {"message": "Payment verified", "order_id": order["id"]}
