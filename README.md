# 🧠 BrainGemma

> **AI-powered brain tumor diagnosis** — PathFoundation vision classifier + MedGemma clinical reasoning + React UI

---

## Architecture

```
brain-gemma/
├── app/                          ← FastAPI backend
│   ├── main.py                   ← CORS + routers
│   ├── api/
│   │   ├── diagnose.py           ← POST /api/v1/diagnose  ← frontend calls this
│   │   └── chat.py               ← POST /api/v1/chat      ← raw agent chat
│   ├── services/
│   │   ├── agent.py              ← LangGraph agentic loop (PathFoundation → MedGemma)
│   │   ├── vision.py             ← TumorClassifierTool (TF + PyTorch head)
│   │   └── response_adapter.py  ← MedGemma JSON → DiagnoseResponse schema
│   └── core/config.py           ← pydantic-settings (reads .env)
│
├── path_foundation_model/        ← Google PathFoundation TF SavedModel
├── brain_tumor_path_foundation_head.pth  ← Fine-tuned 4-class PyTorch head
│
├── frontend/                     ← React (Vite) UI
│   ├── src/
│   │   ├── api/mock.js           ← API client (real + mock mode)
│   │   ├── components/           ← Header, Hero, Dropzone, Results, Pipeline
│   │   ├── context/AppContext.jsx
│   │   └── App.jsx
│   ├── .env.local                ← VITE_API_BASE_URL, VITE_MOCK_MODE (gitignored)
│   └── package.json
│
├── requirements.txt
├── .env.example                  ← Copy to .env and fill in values
└── README.md
```

---

## Pipeline

```
Upload CT/MRI
    │
    ▼
POST /api/v1/diagnose
    │
    ├─ Phase 1: PathFoundation TF → embeddings → PyTorch head
    │           → "GLIOMA (Confidence: 94.2%)"
    │
    └─ Phase 2: MedGemma synthesis
               image + Phase 1 result → JSON report
               {primary_diagnosis, confidence, grade, location,
                differential_diagnosis, recommendations, triage_urgency}
                    │
                    ▼
              response_adapter.py  →  DiagnoseResponse
                    │
                    ▼
              React ResultsSection renders report
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- [LM Studio](https://lmstudio.ai/) running MedGemma locally  
  (or any OpenAI-compatible server at the URL in `.env`)

### 1. Backend Setup

```powershell
cd brain-gemma

# Create & activate virtual environment (always use venv)
python -m venv .venv
.venv\Scripts\activate          # Windows PowerShell
# source .venv/bin/activate     # macOS / Linux

# Install PyTorch with CUDA 12.4 (from PyTorch index)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124

# Install all other dependencies
pip install fastapi uvicorn pydantic pydantic-settings python-multipart `
            python-dotenv langchain langchain-core langchain-openai `
            langgraph langgraph-prebuilt pillow tensorflow tf_keras numpy

# Or install everything from requirements.txt (needs both indexes):
pip install -r requirements.txt --index-url https://download.pytorch.org/whl/cu124 `
            --extra-index-url https://pypi.org/simple

# Configure environment
cp .env.example .env
# Edit .env: set LLM_BASE_URL to your LM Studio IP

# Start the API server (using venv python)
.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API will be live at: **http://localhost:8000**  
Swagger docs: **http://localhost:8000/docs**

### 2. Frontend Setup

```bash
cd brain-gemma/frontend

# Install dependencies
npm install

# Configure environment (already set up — edit if needed)
# VITE_API_BASE_URL=http://localhost:8000
# VITE_MOCK_MODE=false

# Start development server
npm run dev
```

Frontend will be live at: **http://localhost:5173**

---

## API Endpoints

### `POST /api/v1/diagnose` ← Main endpoint (used by React frontend)

| Field | Type | Description |
|-------|------|-------------|
| `ct` | `File[]` | CT scan files (optional) |
| `mri` | `File[]` | MRI scan files (optional) |
| `context` | `string` | Optional clinical notes |

**Response:** `DiagnoseResponse`
```json
{
  "diagnosis": "High-Grade Glioma",
  "tumor_type": "Glioblastoma Multiforme (GBM)",
  "grade": "WHO Grade IV",
  "confidence": 94,
  "location": "Left Temporal Lobe",
  "modalities_used": ["MRI"],
  "triage": "URGENT",
  "findings": "...",
  "recommendations": ["..."],
  "differential": [{"label": "Glioma", "probability": 94}],
  "inference_ms": 1240
}
```

### `POST /api/v1/chat` ← Raw agent chat (for testing/debug)

| Field | Type | Description |
|-------|------|-------------|
| `message` | `string` | Text query |
| `image` | `File` | Optional scan image |

### `GET /health` or `GET /api/v1/health`
Returns model load status and LLM connectivity.

---

## Configuration (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_BASE_URL` | `http://localhost:1234/v1` | LM Studio / OpenAI-compat server |
| `LLM_MODEL` | `medgemma-1.5-4b-it` | Model name |
| `LLM_API_KEY` | `lm-studio` | API key (any string for LM Studio) |
| `UPLOAD_DIR` | `uploads` | Temp directory for uploaded scans |
| `ENV` | `development` | `development` = open CORS; `production` = locked |
| `PORT` | `8000` | Server port |

---

## Supported File Types

`.jpg` · `.jpeg` · `.png` · `.dcm` · `.nii` · `.gz` · `.bmp` · `.tiff`

---

## Tumor Classes

| PathFoundation class | Display | Triage |
|---------------------|---------|--------|
| `glioma` | High-Grade Glioma (GBM) | 🔴 URGENT |
| `meningioma` | Meningioma | 🟡 SOON |
| `pituitary` | Pituitary Adenoma | 🟡 SOON |
| `notumor` | No Tumor Detected | 🟢 ROUTINE |

---

## ⚠️ Disclaimer

This tool is for **research and demonstration purposes only**.  
It is **NOT approved for clinical use**. Always consult a qualified medical professional.

---

## License

MIT
