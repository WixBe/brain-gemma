import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat import router as chat_router
from app.api.diagnose import router as diagnose_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="PathFoundation + MedGemma agentic brain tumor diagnosis API.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Dev: allow any localhost port (Vite picks whichever is free)
# Prod: set ENV=production and ALLOWED_ORIGINS in .env
IS_DEV = os.getenv("ENV", "development") == "development"

if IS_DEV:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"http://localhost(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(diagnose_router, prefix="/api/v1")   # POST /api/v1/diagnose
app.include_router(chat_router, prefix="/api/v1")        # POST /api/v1/chat (keep for testing)

@app.get("/health", tags=["System"])
async def root_health():
    """Root-level health check (mirrors /api/v1/health)."""
    return {"status": "ok", "service": settings.PROJECT_NAME}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    print(f"\nStarting {settings.PROJECT_NAME} on http://localhost:{port}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
