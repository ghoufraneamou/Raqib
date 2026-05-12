import os
import json
import tempfile
from datetime import datetime

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


def build_tracking_timeline(result: dict) -> list:
    status = result.get("dossier_status", "INCOMPLETE")

    return [
        {
            "step": "Dépôt de la demande",
            "date": datetime.now().strftime("%d %b %Y"),
            "completed": True,
            "current": False,
        },
        {
            "step": "Vérification complétude",
            "date": datetime.now().strftime("%d %b %Y"),
            "completed": status != "INCOMPLETE",
            "current": status == "INCOMPLETE",
        },
        {
            "step": "Évaluation scientifique",
            "date": "En cours" if status == "FORMALLY_COMPLETE" else "-",
            "completed": False,
            "current": status == "FORMALLY_COMPLETE",
        },
        {
            "step": "Décision finale",
            "date": "-",
            "completed": False,
            "current": False,
        },
    ]