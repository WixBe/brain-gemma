"""
BrainGemma — /diagnose Endpoint
=================================
POST /api/v1/diagnose
  - Accepts CT and/or MRI files (multipart/form-data)
  - Runs PathFoundation + MedGemma agentic pipeline
  - Returns DiagnoseResponse JSON matching frontend schema
"""

from __future__ import annotations

import os
import time
import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.services.agent import run_agent
from app.services.response_adapter import adapt, DiagnoseResponse

router = APIRouter()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".dcm", ".nii", ".gz", ".bmp", ".tiff", ".tif"}
MAX_FILE_SIZE_MB = 50


def _validate_and_save(upload: UploadFile, content: bytes) -> str:
    """Validate extension + size, save to uploads/, return path."""
    ext = os.path.splitext(upload.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File '{upload.filename}' exceeds {MAX_FILE_SIZE_MB}MB limit.",
        )
    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(settings.UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(content)
    return path


@router.post(
    "/diagnose",
    response_model=DiagnoseResponse,
    summary="Brain tumor diagnosis — PathFoundation + MedGemma",
    description=(
        "Upload CT and/or MRI scan images. The agentic pipeline runs "
        "PathFoundation feature extraction → classification head → "
        "MedGemma JSON synthesis. Returns a structured diagnostic report."
    ),
    tags=["Diagnosis"],
)
async def diagnose(
    ct: list[UploadFile] = File(default=[], description="CT scan files"),
    mri: list[UploadFile] = File(default=[], description="MRI scan files"),
    context: str = Form(default="", description="Optional clinical context / patient notes"),
):
    if not ct and not mri:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one CT or MRI file must be provided.",
        )

    # ── Save uploaded files ──────────────────────────────────────────────────
    ct_paths: list[str] = []
    mri_paths: list[str] = []

    for upload in ct:
        content = await upload.read()
        ct_paths.append(_validate_and_save(upload, content))

    for upload in mri:
        content = await upload.read()
        mri_paths.append(_validate_and_save(upload, content))

    # ── Pick best image: prefer MRI over CT ──────────────────────────────────
    primary_image = (mri_paths or ct_paths)[0]
    modalities_used = []
    if ct_paths:
        modalities_used.append("CT")
    if mri_paths:
        modalities_used.append("MRI")

    # ── Build query for agent ─────────────────────────────────────────────────
    user_query = context.strip() if context.strip() else "Analyze this brain scan and provide a diagnostic report."

    # ── Run agentic pipeline ──────────────────────────────────────────────────
    start_ms = time.monotonic()
    try:
        raw_response = run_agent(user_query=user_query, image_path=primary_image)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agentic pipeline failed: {str(e)}",
        )
    elapsed_ms = int((time.monotonic() - start_ms) * 1000)

    # ── Adapt response to frontend schema ─────────────────────────────────────
    result = adapt(raw_response, modalities_used=modalities_used, inference_ms=elapsed_ms)
    return result


@router.get(
    "/health",
    summary="Service health check",
    tags=["System"],
)
async def health():
    """Returns API status and model readiness."""
    from app.services.vision import classifier_instance
    models_loaded = (
        classifier_instance.infer_tf is not None
        and classifier_instance.model_pt is not None
    )
    return {
        "status": "ok",
        "models_loaded": models_loaded,
        "classifier": "PathFoundation + Classification Head",
        "llm": settings.LLM_MODEL,
        "llm_base_url": settings.LLM_BASE_URL,
    }
