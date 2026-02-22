"""
BrainGemma — Response Adapter
==============================
Converts raw MedGemma JSON string → DiagnoseResponse Pydantic model.
Handles percentage strings, class name normalisation, and missing fields.
"""

from __future__ import annotations

import json
import re
import time
from typing import Any

from pydantic import BaseModel


# ── Pydantic schema (matches frontend DiagnoseResponse exactly) ───────────────

class DifferentialItem(BaseModel):
    label: str
    probability: int


class DiagnoseResponse(BaseModel):
    diagnosis: str
    tumor_type: str
    grade: str
    confidence: int
    location: str
    modalities_used: list[str]
    triage: str
    findings: str
    recommendations: list[str]
    differential: list[DifferentialItem]
    inference_ms: int


# ── Class name maps ────────────────────────────────────────────────────────────

_DIAGNOSIS_MAP: dict[str, str] = {
    "glioma":      "High-Grade Glioma",
    "meningioma":  "Meningioma",
    "pituitary":   "Pituitary Adenoma",
    "notumor":     "No Tumor Detected",
    "no tumor":    "No Tumor Detected",
    "no tumor detected": "No Tumor Detected",
}

_TUMOR_TYPE_MAP: dict[str, str] = {
    "glioma":      "Glioblastoma Multiforme (GBM)",
    "meningioma":  "Typical Meningioma",
    "pituitary":   "Pituitary Adenoma",
    "notumor":     "—",
    "no tumor":    "—",
    "no tumor detected": "—",
}

_TRIAGE_VALID = {"URGENT", "SOON", "ROUTINE"}


def _normalise_class(raw: str) -> str:
    """Map PathFoundation class strings to display names."""
    key = raw.strip().lower()
    return _DIAGNOSIS_MAP.get(key, raw.strip().title())


def _normalise_tumor_type(raw: str) -> str:
    key = raw.strip().lower()
    return _TUMOR_TYPE_MAP.get(key, raw.strip())


def _parse_pct(value: Any) -> int:
    """Convert '94.2%', 94.2, or '94' → int 94."""
    if isinstance(value, (int, float)):
        return int(value)
    text = str(value).replace("%", "").strip()
    try:
        return int(float(text))
    except ValueError:
        return 0


def _extract_json(text: str) -> dict:
    """4-level extraction: raw → code block → braces → empty."""
    # 1. Direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 2. Markdown code block
    block = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if block:
        try:
            return json.loads(block.group(1))
        except json.JSONDecodeError:
            pass

    # 3. First {...} blob
    brace = re.search(r"\{.*\}", text, re.DOTALL)
    if brace:
        try:
            return json.loads(brace.group())
        except json.JSONDecodeError:
            pass

    # 4. Nothing parseable → return empty dict (adapter fills defaults)
    return {}


def adapt(raw_medgemma: str, modalities_used: list[str], inference_ms: int) -> DiagnoseResponse:
    """
    Parse MedGemma's raw string output and return a DiagnoseResponse.
    Never raises — always returns a best-effort response.
    """
    data = _extract_json(raw_medgemma)

    # ── Primary diagnosis ────────────────────────────────────────────────────
    raw_diag = data.get("primary_diagnosis", "Unknown")
    diagnosis = _normalise_class(raw_diag)
    tumor_type = _normalise_tumor_type(raw_diag)

    # ── Confidence ───────────────────────────────────────────────────────────
    confidence = _parse_pct(data.get("confidence", 0))

    # ── Grade ────────────────────────────────────────────────────────────────
    grade_raw = data.get("grade", "N/A")
    # Strip "Typical: " prefix added by MedGemma prompt instruction
    grade = grade_raw.replace("Typical: ", "").strip()

    # ── Location ─────────────────────────────────────────────────────────────
    location = data.get("location", "N/A")

    # ── Triage ───────────────────────────────────────────────────────────────
    triage_raw = data.get("triage_urgency", data.get("triage", "ROUTINE"))
    triage = triage_raw.upper().strip()
    if triage not in _TRIAGE_VALID:
        triage = "ROUTINE"

    # ── Findings (MedGemma may not produce this; use a sensible default) ─────
    findings = data.get("findings", data.get("clinical_findings", ""))
    if not findings:
        findings = (
            f"AI vision analysis identified {diagnosis.lower()} "
            f"with {confidence}% confidence. "
            f"Refer to clinical context and imaging for detailed findings."
        )

    # ── Recommendations ──────────────────────────────────────────────────────
    recs = data.get("recommendations", [])
    if isinstance(recs, str):
        recs = [recs]
    if not recs:
        recs = ["Clinical correlation advised. Consult a specialist."]

    # ── Differential ─────────────────────────────────────────────────────────
    diff_raw = data.get("differential_diagnosis", data.get("differential", []))
    differential: list[DifferentialItem] = []
    for item in diff_raw:
        if isinstance(item, dict):
            label = item.get("condition", item.get("label", "Unknown"))
            prob = _parse_pct(item.get("probability", item.get("prob", 0)))
            differential.append(DifferentialItem(label=label, probability=prob))

    # Ensure at least one entry
    if not differential:
        differential = [DifferentialItem(label=diagnosis, probability=confidence)]

    return DiagnoseResponse(
        diagnosis=diagnosis,
        tumor_type=tumor_type,
        grade=grade,
        confidence=confidence,
        location=location,
        modalities_used=modalities_used or ["MRI"],
        triage=triage,
        findings=findings,
        recommendations=recs,
        differential=differential,
        inference_ms=inference_ms,
    )
