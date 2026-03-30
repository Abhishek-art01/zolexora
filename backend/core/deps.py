from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from core.database import get_db
from core.security import decode_token

oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

async def db_dep() -> AsyncIOMotorDatabase:
    return get_db()

async def current_user(token: str = Depends(oauth2), db: AsyncIOMotorDatabase = Depends(db_dep)):
    if not token:
        raise HTTPException(401, "Not authenticated")
    payload = decode_token(token)
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user

async def optional_user(token: str = Depends(oauth2), db: AsyncIOMotorDatabase = Depends(db_dep)):
    if not token:
        return None
    try:
        payload = decode_token(token)
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        return user
    except:
        return None

async def seller_only(user=Depends(current_user)):
    if user["role"] not in ["seller", "admin"]:
        raise HTTPException(403, "Sellers only")
    return user

async def admin_only(user=Depends(current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Admins only")
    return user
