# AI Waste Sorting & Recycling Assistant

An intelligent multi-stage waste sorting and recycling classification assistant built with **YOLOv8/v11** object detection, **PyTorch CNN** material classification, **Grad-CAM explainability**, a **FastAPI backend**, and a modern **React (Vite) frontend**.

---

## 🌟 Key Features

1. **Multi-Object Detection**: Locates individual items in cluttered waste streams using YOLOv8/v11.
2. **Fine-Grained Classification**: Pinpoints specific materials (PET, HDPE, Cardboard, Aluminum, Organic, Electronic).
3. **Explainable AI (Grad-CAM)**: Generates visual saliency maps explaining why an item was classified as recyclable or contaminated.
4. **Smart Decision Engine**: Maps classifications to local bin categories (Recyclable, Organic, Hazardous, General Waste) with actionable prep instructions (e.g., rinse, flatten, separate cap).
5. **Real-Time Input**: Supports drag-and-drop image uploads, batch analysis, and live webcam snapshots.
6. **Telemetry & History**: Stores scan records and disposal history in a lightweight SQLite database with export options.

---

## 📂 Repository Structure

```plaintext
waste-sorting-ai/
│
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI entrypoint, middleware, and route mounting
│   │   ├── config.py                   # Environment settings, confidence thresholds, paths
│   │   ├── database.py                 # SQLite engine & session management
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── health.py           # Health check & readiness probe
│   │   │       ├── analyze.py          # Image analysis & disposal endpoint (/analyze)
│   │   │       └── history.py          # Scan history & telemetry endpoints
│   │   ├── services/
│   │   │   ├── detector.py             # YOLO inference & bounding box extraction
│   │   │   ├── classifier.py           # PyTorch crop classification & feature extraction
│   │   │   ├── explainability.py       # Grad-CAM heatmap generator
│   │   │   ├── decision_engine.py      # Rule-based recyclability & disposal mapper
│   │   │   └── pipeline.py             # Orchestrator integrating detection, XAI, and rules
│   │   ├── models/
│   │   │   └── db_models.py            # SQLite schema for prediction logging
│   │   └── utils/
│   │       ├── image_processing.py     # Base64 encoding, CV2 drawing, color helpers
│   │       └── export.py               # CSV/PDF export generator
│   ├── weights/                        # Model checkpoints (.pt, .pth, .onnx)
│   ├── tests/                          # Backend API and pipeline unit tests
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/                 # UI components and feature modules
│   │   ├── services/                   # Axios API client
│   │   ├── App.jsx                     # Core application orchestrator
│   │   ├── index.css                   # Tailwind styling
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── Dockerfile
│
├── training/
│   ├── dataset/                        # YOLO dataset split & data.yaml
│   ├── notebooks/                      # EDA, evaluation, and error analysis
│   ├── train_detection.py              # YOLO fine-tuning script
│   ├── train_classifier.py             # CNN transfer learning script
│   └── export_onnx.py                  # ONNX conversion and quantization
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### 1. Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API docs will be available at: `http://localhost:8000/docs`

### 2. Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

The web app will run at: `http://localhost:5173`

### 3. Running with Docker Compose

```bash
docker-compose up --build
```

- Web UI: `http://localhost:3000`
- API Backend: `http://localhost:8000`
