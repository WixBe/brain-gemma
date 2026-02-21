# MedGemma Brain Tumor Analysis API

## Overview

This project provides a **FastAPI** service that leverages a local **MedGemma** LLM together with the **Path Foundation** vision model to analyze brain MRI scans. The API accepts a text prompt and an optional MRI image, runs a classification tool to detect tumor type, and then asks MedGemma to generate a structured JSON diagnostic report (primary diagnosis, confidence, grade, location, differential diagnoses, recommendations, and triage urgency).

## Features

- Multimodal input: text + image (base64‑encoded) sent directly to MedGemma.
- Automatic tumor classification via a TensorFlow feature extractor + PyTorch classification head.
- Structured JSON output for easy downstream consumption.
- Robust handling of tool‑call loops with a guard to prevent infinite recursion.

## Quick Start

```bash
# 1. Clone the repository (if not already)
git clone https://github.com/yourorg/medgemma-brain-gem
cd medgemma-brain-gem

# 2. Create a virtual environment and install dependencies
python -m venv .venv
source .venv/bin/activate   # on Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 3. Ensure the Path Foundation model files are present under `path_foundation_model/`
#    (they are included in the repo).

# 4. Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The server will be reachable at `http://localhost:8000`.

## API Endpoint

### `POST /api/v1/chat`

**Form fields**
- `message` – The user’s textual query.
- `image` – (optional) An MRI scan file.

**Response**
```json
{
  "status": "success",
  "response": "{ ... JSON diagnostic report ... }",
  "image_processed": true
}
```

## Example Curl Request

```bash
curl --location 'http://localhost:8000/api/v1/chat' \
  --form 'message="Can you check this MRI scan and tell me if there\'s a tumor?"' \
  --form 'image=@"/E:/Workspace/Hackathon/Medgemma/Dataset/ext-test-data/glioma.jpg"'
```

The request will return a JSON diagnostic report similar to:

```json
{
  "primary_diagnosis": "GLIOMA",
  "confidence": 0.76,
  "grade": "III",
  "location": "Left Temporal Lobe",
  "differential_diagnosis": {
    "GLIOMA": 0.76,
    "MENINGIOMA": 0.15,
    "NO_TUMOR": 0.09
  },
  "recommendations": "Refer to neuro‑oncology for further evaluation.",
  "triage_urgency": "high"
}
```

## Configuration

All configurable values live in `app/core/config.py`:
- `PROJECT_NAME`
- `LLM_BASE_URL` – URL of the local MedGemma server.
- `LLM_MODEL`
- `LLM_API_KEY`
- `UPLOAD_DIR` – Directory where uploaded images are temporarily stored.

## License

MIT License – see the `LICENSE` file for details.
