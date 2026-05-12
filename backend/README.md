# AMMPS Capstone – Final Pipeline (Backend)

This backend exposes your **full pipeline** as an API endpoint:

**PDF/Image → OCR (EasyOCR) → LayoutLMv3 (optional embeddings) → YOLOv8 (signature/stamp/header) → Rule-based validation → Dossier score/report**

## 1) What you get
- `backend/pipeline.py` : your pipeline (refactored from Colab, no notebook code)
- `backend/app.py` : FastAPI endpoint `/validate` (multi-file upload)
- `backend/weights/best.pt` : your trained YOLOv8 weights (signature/stamp/official_header)

## 2) Entraîner YOLO (signature / tampon)

Le dataset Roboflow est dans `stamps_signature_docs.v1i.yolov8/`. Sur **Apple Silicon**, l’entraînement **MPS** peut planter : le script utilise **CPU** par défaut (stable).

```bash
cd backend
source .venv/bin/activate   # Python 3.12+ recommandé
pip install -r requirements.txt
python train_yolo.py --epochs 35 --batch 12 --device cpu
# copie automatique vers backend/weights/best.pt
```

Fichier généré : `backend/dataset_yolo.yaml` (chemins absolus vers le dataset).

## 3) Run locally

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate

pip install -r requirements.txt

# optional: disable LayoutLMv3 if you want faster runtime
# export AMMPS_DISABLE_LAYOUT=1

uvicorn backend.app:app --host 0.0.0.0 --port 8000
```

Health check:
- `GET http://localhost:8000/health`

## 4) Call the API (from frontend)
Endpoint:
- `POST http://localhost:8000/validate`
- form-data key: `files` (you can upload multiple files)

Example with curl:
```bash
curl -X POST "http://localhost:8000/validate" \
  -F "files=@01_LETTRE_DEMANDE_realistic_scanned.pdf" \
  -F "files=@some_image.jpg"
```

## 5) Environment variables
- `AMMPS_YOLO_WEIGHTS` : path to YOLO weights (default: `backend/weights/best.pt`)
- `AMMPS_YOLO_CONF` : confidence threshold (default: `0.25`)
- `AMMPS_PDF_DPI` : render DPI for PDF→images before YOLO (default: `200`)
- `AMMPS_DISABLE_LAYOUT=1` : disable LayoutLMv3 embeddings (faster)

Variables utiles pour la **signature** sur scans faibles :

- `AMMPS_YOLO_CONF_SIGNATURE` (défaut ~0.14) — seuil de validation pour la classe signature
- `AMMPS_YOLO_PREDICT_CONF` (défaut ~0.08) — seuil minimal côté inférence
- `AMMPS_YOLO_ENHANCE=0` — désactiver le prétraitement CLAHE

## 6) Notes
- YOLO uses the visual evidence to validate **signature/stamp/header** criteria.
- The rest of the criteria are **explainable rules** on extracted text.
- If YOLO weights are missing, the pipeline still runs using text-based hints.
