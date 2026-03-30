import random
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import Optional

from core.deps import db_dep, current_user
from core.security import hash_password, verify_password, create_token
from core.email import send_otp_email
from models.documents import UserDoc, PendingRegDoc

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterReq(BaseModel):
    email: str
    password: str
    name: str
    role: str = "viewer"

class VerifyReq(BaseModel):
    email: str
    otp: str

class LoginReq(BaseModel):
    email: str
    password: str

class ResendOtpReq(BaseModel):
    email: str


@router.post("/register")
async def register(req: RegisterReq, db: AsyncIOMotorDatabase = Depends(db_dep)):
    if req.role not in ["viewer", "seller"]:
        raise HTTPException(400, "Role must be viewer or seller")
    if await db.users.find_one({"email": req.email}):
        raise HTTPException(400, "Email already registered")

    otp = str(random.randint(100000, 999999))
    expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    pending = PendingRegDoc(
        email=req.email, name=req.name, role=req.role,
        password_hash=hash_password(req.password),
        otp=otp, expires_at=expires,
    )
    await db.pending_registrations.delete_many({"email": req.email})
    await db.pending_registrations.insert_one(pending.model_dump())
    await send_otp_email(req.email, req.name, otp)

    return {"status": "otp_required", "email": req.email, "message": "Verification code sent to your email"}


@router.post("/resend-otp")
async def resend_otp(req: ResendOtpReq, db: AsyncIOMotorDatabase = Depends(db_dep)):
    pending = await db.pending_registrations.find_one({"email": req.email}, {"_id": 0})
    if not pending:
        raise HTTPException(400, "No pending registration found")
    otp = str(random.randint(100000, 999999))
    expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    await db.pending_registrations.update_one(
        {"email": req.email}, {"$set": {"otp": otp, "expires_at": expires}}
    )
    await send_otp_email(req.email, pending["name"], otp)
    return {"message": "New verification code sent"}


@router.post("/verify-register")
async def verify_register(req: VerifyReq, db: AsyncIOMotorDatabase = Depends(db_dep)):
    pending = await db.pending_registrations.find_one({"email": req.email}, {"_id": 0})
    if not pending:
        raise HTTPException(400, "No pending registration. Please register again.")
    if pending["otp"] != req.otp:
        raise HTTPException(400, "Invalid verification code")

    exp = pending["expires_at"]
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(400, "Code expired. Please register again.")

    if await db.users.find_one({"email": req.email}):
        raise HTTPException(400, "Email already registered")

    user = UserDoc(
        email=pending["email"], name=pending["name"],
        role=pending["role"], coin_balance=20, is_email_verified=True,
    )
    doc = user.model_dump()
    doc["password_hash"] = pending["password_hash"]
    await db.users.insert_one(doc)
    await db.pending_registrations.delete_one({"email": req.email})

    return {"token": create_token(user.id, user.role), "user": user.model_dump()}


@router.post("/login")
async def login(req: LoginReq, db: AsyncIOMotorDatabase = Depends(db_dep)):
    doc = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not doc or not verify_password(req.password, doc.get("password_hash", "")):
        raise HTTPException(401, "Invalid email or password")
    if not doc.get("is_active", True):
        raise HTTPException(403, "Account suspended. Contact support.")
    user = UserDoc(**doc)
    return {"token": create_token(user.id, user.role), "user": user.model_dump()}


@router.get("/me")
async def me(user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    doc = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return doc


@router.put("/me")
async def update_profile(data: dict, user=Depends(current_user), db: AsyncIOMotorDatabase = Depends(db_dep)):
    allowed = {"name", "picture"}
    update = {k: v for k, v in data.items() if k in allowed}
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    return {"message": "Profile updated"}
