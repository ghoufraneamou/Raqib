import os
from datetime import datetime
from .mailer import send_report_email_with_attachment

from .celery_app import celery_app
from .pipeline import (
    process_dossier_from_payload_with_downloadable_report,
    export_dossier_report,
)
from .dossier_store import load_dossiers, save_dossiers, build_tracking_timeline
from .mailer import send_report_email_with_attachment


@celery_app.task
def process_dossier_task(file_paths, payload, dossier_id, user_email=None):
    if user_email:
        user_email = str(user_email).strip().lower()
    report = process_dossier_from_payload_with_downloadable_report(
        file_paths,
        payload,
        base_filename=f"dossier_report_{dossier_id}",
    )

    report["dossier_id"] = dossier_id

    exported = export_dossier_report(
        report,
        base_filename=f"dossier_report_{dossier_id}",
    )
    report["downloadable_report_files"] = exported

    pdf_path = exported.get("pdf")

    dossier_name = (
        payload.get("product", {}).get("product_name")
        or payload.get("declarant", {}).get("company_name")
        or dossier_id
    )

    email_status = {
        "sent": False,
        "recipient": user_email,
        "error": None,
    }

    if user_email and pdf_path and os.path.exists(pdf_path):
        try:
            send_report_email_with_attachment(
                to_email=user_email,
                pdf_path=pdf_path,
                dossier_name=dossier_name,
            )
            email_status["sent"] = True
        except Exception as e:
            email_status["error"] = str(e)
            print("REPORT EMAIL ERROR:", repr(e))

    report["report_email"] = email_status

    print("📧 CELERY user_email:", user_email)
    print("📄 CELERY pdf_path:", pdf_path)
    print("📄 CELERY pdf exists:", os.path.exists(pdf_path) if pdf_path else False)

    tracking_data = {
        "dossier_id": dossier_id,
        "created_at": datetime.now().isoformat(),
        "product_name": payload.get("product", {}).get("product_name", ""),
        "company_name": payload.get("declarant", {}).get("company_name", ""),
        "request_type": payload.get("context", {}).get("request_type", ""),
        "entity_type": payload.get("context", {}).get("entity_type", ""),
        "dossier_status": report.get("dossier_status"),
        "compliance_score": report.get("compliance_score"),
        "risk_level": report.get("risk_level"),
        "timeline": build_tracking_timeline(report),
        "report": report,
        "report_email": email_status,
        "user_email": user_email,
    }

    dossiers = load_dossiers()
    existing = dossiers.get(dossier_id, {})
    if existing.get("task_id"):
        tracking_data["task_id"] = existing.get("task_id")
    else:
        tracking_data["task_id"] = None
    dossiers[dossier_id] = {**existing, **tracking_data}
    save_dossiers(dossiers)

    return {
        "message": "Rapport généré avec succès",
        "download_ready": True,
        "downloadable_report_files": report.get("downloadable_report_files", {}),
        "report_email": email_status,
        "summary": report.get("report_summary", {}),
        "dossier_status": report.get("dossier_status"),
        "compliance_score": report.get("compliance_score"),
        "risk_level": report.get("risk_level"),
        "full_report": report,
        "dossier_id": dossier_id,
        "tracking": {
            "dossier_id": dossier_id,
            "timeline": tracking_data["timeline"],
        },
    }