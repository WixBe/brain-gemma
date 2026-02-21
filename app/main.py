from fastapi import FastAPI
from app.api.chat import router as chat_router
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

app.include_router(chat_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    print(f"\nStarting {settings.PROJECT_NAME} on http://localhost:8000")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
