from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path
import logging

from core.config import settings
from core.database import get_db, close_db
from core.seed import seed_data
from routers.auth import router as auth_router
from routers.products import router as products_router
from routers.reels import router as reels_router
from routers.cart import router as cart_router
from routers.other import orders_router, coins_router, subs_router, admin_router
from shipping.router import router as shipping_router
from shipping.webhooks import router as shipping_webhooks_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s – %(message)s",
)
logger = logging.getLogger("zolexora")

UPLOADS_DIR = Path(__file__).parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Zolexora API...")
    db = get_db()
    await seed_data(db)
    yield
    close_db()
    logger.info("Zolexora API stopped.")


app = FastAPI(
    title="Zolexora API",
    version="1.0.0",
    description="Watch. Earn. Shop. — Zolexora platform API",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving (uploaded images/videos)
app.mount("/api/static", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# All routers under /api prefix
PREFIX = "/api"
app.include_router(auth_router,     prefix=PREFIX)
app.include_router(products_router, prefix=PREFIX)
app.include_router(reels_router,    prefix=PREFIX)
app.include_router(cart_router,     prefix=PREFIX)
app.include_router(orders_router,   prefix=PREFIX)
app.include_router(coins_router,    prefix=PREFIX)
app.include_router(subs_router,     prefix=PREFIX)
app.include_router(admin_router,             prefix=PREFIX)
app.include_router(shipping_router,          prefix=PREFIX)
app.include_router(shipping_webhooks_router, prefix=PREFIX)


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "razorpay_configured": bool(settings.RAZORPAY_KEY_ID),
        "email_configured": bool(settings.RESEND_API_KEY),
    }
