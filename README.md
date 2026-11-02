# Raqib – AI-Driven Regulatory Validation and Evaluation System

**For the Moroccan Agency for Medicines and Health Products (AMMPS)**

Raqib is an AI-driven platform that automatically checks regulatory dossiers (cosmetic and pharmaceutical products) submitted to AMMPS. Users upload their documents (PDF, JPG, JPEG, PNG), the system analyses them, and returns a **compliance score, a risk level and a structured report** that explains what passed, what failed and what is missing.

> Capstone project, Al Akhawayn University (School of Science and Engineering), carried out during an internship at **CDG Incept** in partnership with **AMMPS** and the **Ministère de la Santé**. Ribatis was selected through public tender as the technical implementation partner.

---

## Table of Contents

1. [The Problem](#1-the-problem)
2. [Key Features](#2-key-features)
3. [How It Works](#3-how-it-works)
4. [Scoring and Risk Levels](#4-scoring-and-risk-levels)
5. [Model Performance](#5-model-performance)
6. [System Architecture](#6-system-architecture)
7. [API Overview](#7-api-overview)
8. [Project Structure](#8-project-structure)
9. [Quick Start](#9-quick-start)
10. [Documentation](#10-documentation)
11. [Limitations and Future Work](#11-limitations-and-future-work)
12. [Responsible AI](#12-responsible-ai)
13. [Author and Supervision](#13-author-and-supervision)

---

## 1. The Problem

AMMPS processes thousands of regulatory submissions each year. Verifying them by hand (completeness, conformity, consistency between documents) is slow, error-prone and does not scale. A manual review takes about **3 to 5 business days per dossier**.

Raqib automates the repetitive checks and gives agents a clear, explainable report, so experts can focus on decisions that need human judgment.

---

## 2. Key Features

- **Secure authentication** with account creation, a 6-digit OTP sent by e-mail, and JWT sessions.
- **Dossier submission** with multiple documents (PDF, JPG, JPEG, PNG) and operator information.
- **Automated validation pipeline**: OCR, layout understanding, signature/stamp detection, rule-based checks.
- **Missing-document detection** based on the declared submission category (ImF, ImV, FL, FE).
- **Cross-document consistency checks** (ICE, RC, company name, product name, dates).
- **Compliance score and risk level** (LOW / MEDIUM / HIGH).
- **Reports in JSON and PDF** (ReportLab), downloadable and sent automatically by e-mail.
- **Dossier tracking** with a unique `dossier_id` and status through submission, validation and decision.
- **Messaging module** to upload complementary documents and re-validate without restarting the process.
- **Appointment booking** with an automatic confirmation e-mail.
- **AI assistant** (Llama 3.1 through the Groq API) answering platform questions in French and Arabic.
- **Asynchronous processing** with Celery so the interface stays responsive.

---

## 3. How It Works

```
PDF / Image
   └─► 1. OCR (EasyOCR: Arabic, French, English)
         └─► 2. LayoutLMv3 contextual embeddings (optional)
               └─► 3. YOLOv8 detection (signature / stamp / official header)
                     └─► 4. Document classification + type-specific rules
                           └─► 5. Cross-document consistency analysis
                                 └─► Compliance score + risk level + report
```

| Stage | What it does |
|-------|--------------|
| **OCR** | EasyOCR for scans and images; PyMuPDF text extraction for digital PDFs; PDF pages rendered at 200 DPI. |
| **LayoutLMv3** | Generates text + spatial embeddings (`microsoft/layoutlmv3-base`), a base for future learning-based validation. |
| **YOLOv8** | Detects signatures, stamps and official headers (default confidence 0.25). |
| **Classification** | Rule-based keyword matching routes each document to its own validator. |
| **Validators** | Each returns a list of passed criteria and a list of failed criteria (explainable). |
| **Consistency** | Compares ICE, RC, company and product names, and dates across documents. |

Supported document types include: Lettre de demande, Fiche signalétique, Attestation de déclaration société, Contrat de sous-traitance, Certificat de vente libre, Maquette de conditionnement, Déclaration sur l'honneur, Accusé CAPM, and product photographs.

---

## 4. Scoring and Risk Levels

The score is the share of validation criteria that pass across the dossier. Failed criteria, missing mandatory documents and inconsistencies reduce it.

| Risk level | Score |
|------------|-------|
| **LOW** | 85 or more |
| **MEDIUM** | 60 to 84 |
| **HIGH** | below 60 |

The score is a **decision-support indicator**. Final decisions always stay with AMMPS experts.

---

## 5. Model Performance

YOLOv8 was trained on **3,667 annotated page images** (from about 30 regulatory dossiers, prepared with Roboflow) with two classes: signature and stamp.

| Metric | Value |
|--------|-------|
| Precision | 0.92 |
| Recall | 0.90 |
| mAP@0.5 | 0.93 |
| mAP@0.5:0.95 | 0.66 |

Stamps are detected more reliably than signatures, which vary more in style, size and visibility.

Processing time on CPU is roughly **3 to 8 seconds per page**. Throughput scales by adding Celery workers.

---

## 6. System Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | React, TypeScript, Vite, shadcn/ui, Tailwind CSS |
| **Backend API** | Python, FastAPI |
| **Async processing** | Celery with a Redis queue |
| **AI / vision** | EasyOCR, PyMuPDF, LayoutLMv3 (Transformers), YOLOv8 (Ultralytics) |
| **Database** | MySQL 8+ (users, OTP codes) |
| **Security** | bcrypt password hashing, SHA-256 hashed OTP codes (10 min expiry), JWT HS256 (72 h) |
| **Reports and e-mail** | ReportLab (PDF), SMTP |
| **AI assistant** | Llama 3.1 through the Groq API |

Layered design: API layer, business logic layer, data access layer. The model was trained on Google Colab (Tesla T4) and runs inference on CPU.

---

## 7. API Overview

| Group | Endpoint | Method | Purpose |
|-------|----------|--------|---------|
| System | `/` | GET | Backend welcome page |
| System | `/health` | GET | Check the server is running |
| Validation | `/validate` | POST | Upload dossier files and launch analysis |
| Validation | `/status/{task_id}` | GET | Track the background analysis task |
| Reports | `/download-report` | GET | Download the generated PDF report |
| Appointments | `/appointments/confirm` | POST | Confirm an appointment and send an e-mail |
| Assistant | `/ask-ai` | POST | Ask the AI assistant a question |
| Tracking | `/dossiers` | GET | List stored dossiers |
| Tracking | `/dossiers/{dossier_id}` | GET | Tracking info for one dossier |
| Auth | auth routes | Multiple | Registration, login, OTP and token verification |

Interactive docs are available at `http://localhost:8000/docs` when the backend runs.

---

## 8. Project Structure

```
.
├── README.md                  # This file
├── backend/                   # FastAPI app and AI pipeline
│   ├── app.py
│   ├── pipeline.py
│   ├── train_yolo.py
│   ├── requirements.txt
│   ├── weights/best.pt        # Trained YOLOv8 weights
│   └── README.md              # Backend documentation
├── stamps_signature_docs.v1i.yolov8/   # Roboflow training dataset
└── src/, package.json, ...    # React frontend
```

> Adjust this tree to match your repository (for example if the frontend lives in its own folder).

---

## 9. Quick Start

### 1. Clone

```sh
git clone https://github.com/ghoufraneamou/Raqib.git
cd Raqib
```

### 2. Backend

```sh
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.app:app --host 0.0.0.0 --port 8000
```

Check it works: http://localhost:8000/health

Set secrets as environment variables, never in the code (for example `AMMPS_JWT_SECRET` for the JWT key, plus your SMTP, database and Groq API settings).

### 3. Frontend

In a second terminal:

```sh
npm install
npm run dev
```

Open http://localhost:5173. The backend allows requests from the Vite dev ports 5173 and 5174.

### 4. Try it

Sign in with the e-mail OTP, create a dossier, upload documents, click **Analyser le dossier**, and read the score and report.

---

## 10. Documentation

- **Backend**: setup, pipeline details, environment variables and YOLO training (`backend/README.md`).
- **Frontend**: setup, scripts and deployment (frontend README).
- **Full report**: the complete capstone report describes requirements, architecture, evaluation and limitations.

---

## 11. Limitations and Future Work

**Limitations**
- OCR quality depends on scan quality (blur, low resolution, compression).
- Signature detection is harder than stamp detection (faint, stylized or occluded signatures).
- LayoutLMv3 struggles on very complex layouts (multi-column, dense tables).
- CPU inference adds latency on large dossiers.
- Validation rules are hand-encoded, so regulatory changes need rule updates.
- The AI assistant has no conversational memory and depends on an external API.
- Testing used anonymized samples and templates because real dossiers are confidential.

**Future work**
- Retrieval-Augmented Generation (RAG) for the assistant, grounded in AMMPS documents.
- A larger and more diverse training dataset.
- GPU-accelerated deployment (the same `best.pt` can be reused).
- More advanced document understanding models.

---

## 12. Responsible AI

Raqib is a **decision-support tool**, not an autonomous decision-maker. Results are explainable (passed and failed criteria are listed), traceable (unique `dossier_id` and task id), and designed for human oversight. Sensitive regulatory data is protected with authenticated access, hashed credentials and environment-based secrets, following the principles of ISO/IEC 27001 (not formally certified).

---

## 13. Author and Supervision

**Author**: Ghoufrane Aamoumour
GitHub: [@ghoufraneamou](https://github.com/ghoufraneamou)

**Supervisors**: Manal Bani (CDG Incept) and Dr. Amine Abouaomar (Al Akhawayn University, SSE)

**Partners**: CDG Incept, AMMPS, Ministère de la Santé, Ribatis

Capstone report, May 2026.
