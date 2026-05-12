import os
import json
import shutil
import tempfile
import re
import unicodedata
import smtplib

from email.message import EmailMessage
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from uuid import uuid4
from celery.result import AsyncResult
from .celery_app import celery_app
from celery.result import AsyncResult
from .tasks import process_dossier_task
from .dossier_store import load_dossiers, save_dossiers, build_tracking_timeline

from fastapi import FastAPI, File, Request, UploadFile, HTTPException, Form, Header
from .tasks import process_dossier_task
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from pydantic import BaseModel
from .pipeline import process_dossier_from_payload_with_downloadable_report, export_dossier_report

try:
    from .pipeline import process_dossier_from_payload_with_downloadable_report
    from .auth_routes import router as auth_router
    from .auth_service import init_db, decode_token, send_appointment_email
    from .openai_service import ask_ai
    from .pipeline import process_dossier_from_payload_with_downloadable_report, export_dossier_report
except ImportError:
    from .pipeline import process_dossier_from_payload_with_downloadable_report
    from .auth_routes import router as auth_router
    from .auth_service import init_db, decode_token, send_appointment_email
    from .openai_service import ask_ai
    from .pipeline import process_dossier_from_payload_with_downloadable_report, export_dossier_report

app = FastAPI(title="AMMPS Dossier Validation API", version="2.0")
app.include_router(auth_router)


@app.on_event("startup")
def _startup_auth_db() -> None:
    try:
        init_db()
    except Exception as e:
        print("⚠️ MySQL auth (init_db) :", repr(e))
        print(
            "   Créez la base : CREATE DATABASE",
            os.getenv("AMMPS_MYSQL_DATABASE", "ammps_auth"),
            "CHARACTER SET utf8mb4;",
        )
        print("   Variables : AMMPS_MYSQL_HOST, AMMPS_MYSQL_USER, AMMPS_MYSQL_PASSWORD, …")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXT = {"pdf", "png", "jpg", "jpeg"}


DOSSIER_STORE = os.path.join(tempfile.gettempdir(), "ammps_dossiers_store.json")


def load_dossiers() -> dict:
    if not os.path.exists(DOSSIER_STORE):
        return {}
    try:
        with open(DOSSIER_STORE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_dossiers(data: dict) -> None:
    with open(DOSSIER_STORE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _generate_dossier_id() -> str:
    existing = load_dossiers()
    year = datetime.now().year
    prefix = f"AMM-{year}-"
    current_numbers = []

    for key in existing.keys():
        if key.startswith(prefix):
            tail = key.replace(prefix, "")
            if tail.isdigit():
                current_numbers.append(int(tail))

    next_number = (max(current_numbers) + 1) if current_numbers else 1
    return f"{prefix}{next_number:06d}"


def build_tracking_timeline(result: dict) -> list:
    status = result.get("dossier_status", "INCOMPLETE")

    step_1 = {
        "step": "Dépôt de la demande",
        "date": datetime.now().strftime("%d %b %Y"),
        "completed": True,
        "current": False,
    }

    step_2_done = status in ["FORMALLY_COMPLETE", "FORMAL_ISSUES", "INCOMPLETE"]
    step_2 = {
        "step": "Vérification complétude",
        "date": datetime.now().strftime("%d %b %Y") if step_2_done else "-",
        "completed": step_2_done and status != "INCOMPLETE",
        "current": status == "INCOMPLETE",
    }

    step_3 = {
        "step": "Évaluation scientifique",
        "date": "En cours" if status == "FORMALLY_COMPLETE" else "-",
        "completed": False,
        "current": status == "FORMALLY_COMPLETE",
    }

    step_4 = {
        "step": "Décision finale",
        "date": "-",
        "completed": False,
        "current": False,
    }

    return [step_1, step_2, step_3, step_4]


def _clean_filename(filename: str) -> str:
    filename = filename or "file"
    if "." in filename:
        stem, ext = filename.rsplit(".", 1)
        ext = "." + ext.lower()
    else:
        stem, ext = filename, ""

    stem = unicodedata.normalize("NFKD", stem).encode("ascii", "ignore").decode("ascii")
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", stem).strip("_")
    if not stem:
        stem = "file"
    return f"{stem}{ext}"


def _save_upload_to_tmp(f: UploadFile) -> str:
    original_name = f.filename or "file"
    ext = original_name.split(".")[-1].lower() if "." in original_name else ""
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Allowed: {sorted(ALLOWED_EXT)}")

    safe_name = _clean_filename(original_name)
    tmp_dir = tempfile.mkdtemp(prefix="ammps_upload_")
    dst = os.path.join(tmp_dir, safe_name)
    with open(dst, "wb") as out:
        shutil.copyfileobj(f.file, out)
    return dst


def _extract_user_email(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_token(token)

    if isinstance(payload, dict):
        for key in ("email", "user_email", "sub"):
            value = payload.get(key)
            if isinstance(value, str) and "@" in value:
                return value.strip()

    return None


def _require_user_email(authorization: Optional[str], fallback_email: Optional[str] = None) -> str:
    """Return the authenticated user email used to isolate dossiers per account."""
    user_email = _extract_user_email(authorization)

    # Fallback kept for your current frontend, but token remains the preferred source.
    if not user_email and fallback_email and "@" in fallback_email:
        user_email = fallback_email.strip().lower()

    if not user_email:
        raise HTTPException(status_code=401, detail="Authenticated user email is required")

    return user_email.lower()

def _send_report_email_with_attachment(to_email: str, pdf_path: str, dossier_name: str) -> None:
    smtp_host = os.getenv("AMMPS_SMTP_HOST")
    smtp_port = int(os.getenv("AMMPS_SMTP_PORT", "587"))
    smtp_user = os.getenv("AMMPS_SMTP_USER")
    smtp_password = os.getenv("AMMPS_SMTP_PASSWORD")
    mail_from = os.getenv("AMMPS_MAIL_FROM", smtp_user or "")

    if not smtp_host or not mail_from:
        raise RuntimeError("SMTP configuration is missing")

    msg = EmailMessage()
    msg["Subject"] = f"Rapport d'analyse du dossier - {dossier_name}"
    msg["From"] = mail_from
    msg["To"] = to_email
    msg.set_content(
        "Bonjour,\n\n"
        "Votre rapport d'analyse AMMPS a été généré avec succès.\n"
        "Veuillez trouver le rapport PDF en pièce jointe.\n\n"
        "Cordialement,\n"
        "Plateforme AMMPS"
    )

    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    msg.add_attachment(pdf_bytes, maintype="application", subtype="pdf", filename=os.path.basename(pdf_path))

    with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
        server.starttls()
        if smtp_user and smtp_password:
            server.login(smtp_user, smtp_password)
        server.send_message(msg)


@app.get("/")
def root():
    return HTMLResponse(
        content=(
            "<!DOCTYPE html><html lang='fr'><head><meta charset='utf-8'><title>AMMPS API</title></head>"
            "<body style='font-family:system-ui;padding:2rem;max-width:40rem'>"
            "<h1>Backend AMMPS</h1>"
            "<p>Le serveur répond.</p>"
            "<p><a href='/health'>Ouvrir /health</a></p>"
            "</body></html>"
        )
    )


@app.get("/health")
def health(request: Request):
    accept = request.headers.get("accept", "")
    if "text/html" in accept and "application/json" not in accept:
        return HTMLResponse(
            content=(
                "<!DOCTYPE html><html lang='fr'><head><meta charset='utf-8'><title>Health</title></head>"
                "<body style='font-family:system-ui;padding:2rem'><h1>OK</h1>"
                "<p>Statut : <strong>ok</strong></p>"
                "<p><a href='/'>Accueil API</a></p></body></html>"
            )
        )
    return JSONResponse(content={"status": "ok"})


@app.post("/validate")
def validate(
    files: List[UploadFile] = File(...),
    context: Optional[str] = Form(None),
    declarant: Optional[str] = Form(None),
    operatorData: Optional[str] = Form(None),
    product: Optional[str] = Form(None),
    productData: Optional[str] = Form(None),
    visaData: Optional[str] = Form(None),
    modifications: Optional[str] = Form(None),
    noChange: Optional[str] = Form(None),
    authorization: Optional[str] = Header(None),
    userEmail: Optional[str] = Form(None),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    saved_paths: List[str] = []

    try:
        for f in files:
            path = _save_upload_to_tmp(f)
            saved_paths.append(path)

        payload = {
            "context": json.loads(context) if context else {},
            "declarant": json.loads(declarant) if declarant else {},
            "operatorData": json.loads(operatorData) if operatorData else {},
            "product": json.loads(product) if product else {},
            "productData": json.loads(productData) if productData else {},
            "visaData": json.loads(visaData) if visaData else {},
            "modifications": json.loads(modifications) if modifications else [],
            "noChange": json.loads(noChange.lower()) if isinstance(noChange, str) and noChange else False,
        }

        print("VALIDATE: request received")
        print("VALIDATE: files =", len(saved_paths))
        print("VALIDATE: launching Celery task")

        user_email = _require_user_email(authorization, userEmail)
        print("📧 EMAIL ASSOCIATED WITH DOSSIER:", user_email)

        dossier_id = _generate_dossier_id()

        dossiers = load_dossiers()
        dossiers[dossier_id] = {
            "dossier_id": dossier_id,
            "created_at": datetime.now().isoformat(),
            "product_name": payload.get("product", {}).get("product_name", ""),
            "company_name": payload.get("declarant", {}).get("company_name", ""),
            "request_type": payload.get("context", {}).get("request_type", ""),
            "entity_type": payload.get("context", {}).get("entity_type", ""),
            "dossier_status": "PROCESSING",
            "compliance_score": 0,
            "risk_level": "PENDING",
            "user_email": user_email,
            "timeline": [
                {
                    "step": "Dépôt de la demande",
                    "date": datetime.now().strftime("%d %b %Y"),
                    "completed": True,
                    "current": False,
                },
                {
                    "step": "Analyse du dossier",
                    "date": "En cours",
                    "completed": False,
                    "current": True,
                },
                {
                    "step": "Génération du rapport",
                    "date": "-",
                    "completed": False,
                    "current": False,
                },
                {
                    "step": "Décision finale",
                    "date": "-",
                    "completed": False,
                    "current": False,
                },
            ],
            "report": None,
            "task_id": None,
        }

        save_dossiers(dossiers)

        print("📧 EMAIL PASSED TO CELERY:", user_email)

        task = process_dossier_task.delay(
        saved_paths,
        payload,
        dossier_id,
        user_email
        )

        dossiers = load_dossiers()
        dossiers[dossier_id]["task_id"] = task.id
        save_dossiers(dossiers)

        return {
            "message": "Analyse lancée",
            "task_id": task.id,
            "dossier_id": dossier_id,
            "status": "PENDING"
        }

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid JSON in form field: {str(e)}"
        )

    except Exception as e:
        print("🔥 VALIDATE ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status/{task_id}")
def get_task_status(task_id: str):
    task = AsyncResult(task_id, app=celery_app)

    if task.state == "PENDING":
        return {
            "status": "PENDING",
            "message": "Analyse en cours"
        }

    if task.state == "SUCCESS":
        return {
            "status": "SUCCESS",
            "result": task.result
        }

    if task.state == "FAILURE":
        return {
            "status": "FAILURE",
            "error": str(task.result)
        }

    return {
        "status": task.state
    }


@app.get("/download-report")
def download_report(path: str):
    file_path = Path(path)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Report file not found")
    if file_path.suffix.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="Only PDF report download is allowed")
    return FileResponse(path=str(file_path), filename=file_path.name, media_type="application/pdf")


@app.post("/appointments/confirm")
def confirm_appointment(
    service: str = Form(...),
    date: str = Form(...),
    creneau: str = Form(...),
    location: str = Form(...),
    email: str = Form(...),
    authorization: Optional[str] = Header(None),
):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    send_appointment_email(
        to_email=email,
        service=service,
        date=date,
        time=creneau,
        location=location,
    )

    return {"message": "Appointment confirmed and email sent", "email": email}


class Question(BaseModel):
    question: str


@app.post("/ask-ai")
def ask_ai_route(payload: Question):
    return {"answer": ask_ai(payload.question)}

@app.get("/dossiers/{dossier_id}")
def get_dossier_tracking(
    dossier_id: str,
    authorization: Optional[str] = Header(None),
    x_user_email: Optional[str] = Header(None),
):
    user_email = _require_user_email(authorization, x_user_email)

    dossiers = load_dossiers()
    dossier = dossiers.get(dossier_id)

    if not dossier:
        raise HTTPException(status_code=404, detail="Dossier not found")

    # Legacy records created before this fix may not have user_email.
    # They are hidden from authenticated users instead of being shared.
    if dossier.get("user_email") != user_email:
        raise HTTPException(status_code=403, detail="Access denied")

    return dossier

@app.get("/dossiers")
def list_dossiers(
    authorization: Optional[str] = Header(None),
    x_user_email: Optional[str] = Header(None),
):
    user_email = _require_user_email(authorization, x_user_email)
    dossiers = load_dossiers()

    filtered = [
        dossier for dossier in dossiers.values()
        if dossier.get("user_email") == user_email
    ]

    return {
        "dossiers": sorted(
            filtered,
            key=lambda d: d.get("created_at", ""),
            reverse=True
        )
    }


