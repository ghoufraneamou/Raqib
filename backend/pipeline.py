
import io
import os
import re
import tempfile
from datetime import datetime
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple


import cv2
import fitz  # PyMuPDF
import numpy as np
import torch
from PIL import Image


# ============================================================
# Configuration
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


DEFAULT_YOLO_WEIGHTS = os.getenv(
    "AMMPS_YOLO_WEIGHTS",
    os.path.join(BASE_DIR, "weights", "best.pt"),
)
YOLO_CONF_DEFAULT = float(os.getenv("AMMPS_YOLO_CONF", "0.22"))
YOLO_CONF_SIGNATURE = float(os.getenv("AMMPS_YOLO_CONF_SIGNATURE", "0.14"))
YOLO_PREDICT_CONF = float(os.getenv("AMMPS_YOLO_PREDICT_CONF", "0.08"))
YOLO_ENHANCE = os.getenv("AMMPS_YOLO_ENHANCE", "1") == "1"
PDF_RENDER_DPI = int(os.getenv("AMMPS_PDF_DPI", "250"))
YOLO_IMGSZ = int(os.getenv("AMMPS_YOLO_IMGSZ", "768"))
YOLO_DEBUG = os.getenv("AMMPS_YOLO_DEBUG", "0") == "1"
DISABLE_YOLO = os.getenv("AMMPS_DISABLE_YOLO", "0") == "1"
MAX_YOLO_SIDE = int(os.getenv("AMMPS_MAX_YOLO_SIDE", "1400"))
DISABLE_LAYOUT = os.getenv("AMMPS_DISABLE_LAYOUT", "0") == "1"




# ============================================================
# Lazy singletons
# ============================================================

_reader = None
_yolo = None
_layout_processor = None
_layout_model = None


def _get_easyocr_reader():
    global _reader
    if _reader is None:
        try:
            import easyocr
            _reader = easyocr.Reader(["ar", "en"], gpu=False)
        except Exception as e:
            print("⚠️ EasyOCR unavailable:", repr(e))
            _reader = None
    return _reader


def _get_yolo():
    global _yolo
    if _yolo is not None:
        return _yolo

    print("📌 YOLO weights path:", DEFAULT_YOLO_WEIGHTS)
    print("📌 YOLO weights exists?:", os.path.exists(DEFAULT_YOLO_WEIGHTS))

    if not os.path.exists(DEFAULT_YOLO_WEIGHTS):
        _yolo = {
            "status": "NO_WEIGHTS",
            "error": "Weights file not found",
            "weights_path": DEFAULT_YOLO_WEIGHTS,
        }
        return _yolo

    try:
        from ultralytics import YOLO
        model = YOLO(DEFAULT_YOLO_WEIGHTS)
        print("✅ YOLO loaded. names =", getattr(model, "names", None))
        _yolo = model
        return _yolo
    except Exception as e:
        print("❌ YOLO load error:", repr(e))
        _yolo = {
            "status": "ERROR",
            "error": repr(e),
            "weights_path": DEFAULT_YOLO_WEIGHTS,
        }
        return _yolo


def _get_layout():
    global _layout_processor, _layout_model

    if DISABLE_LAYOUT:
        return None, None

    if _layout_processor is None or _layout_model is None:
        try:
            from transformers import LayoutLMv3Model, LayoutLMv3Processor

            _layout_processor = LayoutLMv3Processor.from_pretrained(
                "microsoft/layoutlmv3-base",
                apply_ocr=False,
            )
            _layout_model = LayoutLMv3Model.from_pretrained("microsoft/layoutlmv3-base")
            _layout_model.eval()
        except Exception as e:
            print("⚠️ LayoutLMv3 unavailable:", repr(e))
            return None, None

    return _layout_processor, _layout_model


# ============================================================
# Frontend-aligned data models
# ============================================================

@dataclass
class DossierContext:
    entity_type: str = ""
    activity_types: List[str] = field(default_factory=list)
    request_type: str = ""
    has_cannabis: bool = False


@dataclass
class DeclarantData:
    company_name: str = ""
    legal_form: str = ""
    address: str = ""
    country: str = "Maroc"


@dataclass
class OperatorData:
    registreCommerce: str = ""
    ice: str = ""
    identifiantFiscal: str = ""
    cnss: str = ""
    representantNom: str = ""
    representantPrenom: str = ""
    representantQualite: str = ""
    telephone: str = ""
    email: str = ""
    autorisationsExistantes: str = ""
    licences: str = ""


@dataclass
class ManufacturerData:
    name: str = ""
    address: str = ""
    country: str = ""


@dataclass
class ProductDataInput:
    product_id: str = ""
    product_name: str = ""
    origin: str = ""
    manufacturer: ManufacturerData = field(default_factory=ManufacturerData)


@dataclass
class ProductExtendedData:
    typeProduit: str = ""
    categorie: str = ""
    usagePrevu: str = ""
    publicCible: str = ""
    ingredientsINCI: str = ""
    formuleQuantitative: str = ""
    methodeFabrication: str = ""
    controlesQualite: str = ""
    fonctionProduit: str = ""
    precautionsEmploi: str = ""
    ddmOuPao: str = ""
    poidsVolume: str = ""


@dataclass
class VisaData:
    scriptPub: str = ""
    ciblePub: str = ""


@dataclass
class SubmissionData:
    context: DossierContext
    declarant: DeclarantData = field(default_factory=DeclarantData)
    operator_data: OperatorData = field(default_factory=OperatorData)
    product: ProductDataInput = field(default_factory=ProductDataInput)
    product_data: ProductExtendedData = field(default_factory=ProductExtendedData)
    visa_data: VisaData = field(default_factory=VisaData)
    modifications: List[str] = field(default_factory=list)
    no_change: bool = False


def build_submission_data(payload: Dict[str, Any]) -> SubmissionData:
    context_payload = payload.get("context", payload)

    context = DossierContext(
        entity_type=context_payload.get("entityType", context_payload.get("entity_type", "")),
        activity_types=context_payload.get("activityTypes", context_payload.get("activity_types", [])) or [],
        request_type=context_payload.get("requestType", context_payload.get("request_type", "")),
        has_cannabis=bool(context_payload.get("hasCannabis", context_payload.get("has_cannabis", False))),
    )

    declarant_raw = payload.get("declarant", {}) or {}
    declarant = DeclarantData(
        company_name=declarant_raw.get("company_name", declarant_raw.get("companyName", "")),
        legal_form=declarant_raw.get("legal_form", declarant_raw.get("legalForm", "")),
        address=declarant_raw.get("address", ""),
        country=declarant_raw.get("country", "Maroc"),
    )

    operator_raw = payload.get("operatorData", payload.get("operator_data", {})) or {}
    operator_data = OperatorData(
        registreCommerce=operator_raw.get("registreCommerce", ""),
        ice=operator_raw.get("ice", ""),
        identifiantFiscal=operator_raw.get("identifiantFiscal", ""),
        cnss=operator_raw.get("cnss", ""),
        representantNom=operator_raw.get("representantNom", ""),
        representantPrenom=operator_raw.get("representantPrenom", ""),
        representantQualite=operator_raw.get("representantQualite", ""),
        telephone=operator_raw.get("telephone", ""),
        email=operator_raw.get("email", ""),
        autorisationsExistantes=operator_raw.get("autorisationsExistantes", ""),
        licences=operator_raw.get("licences", ""),
    )

    product_raw = payload.get("product", {}) or {}
    manufacturer_raw = product_raw.get("manufacturer", {}) or {}
    product = ProductDataInput(
        product_id=product_raw.get("product_id", product_raw.get("productId", "")),
        product_name=product_raw.get("product_name", product_raw.get("productName", "")),
        origin=product_raw.get("origin", ""),
        manufacturer=ManufacturerData(
            name=manufacturer_raw.get("name", ""),
            address=manufacturer_raw.get("address", ""),
            country=manufacturer_raw.get("country", ""),
        ),
    )

    product_data_raw = payload.get("productData", payload.get("product_data", {})) or {}
    product_data = ProductExtendedData(
        typeProduit=product_data_raw.get("typeProduit", ""),
        categorie=product_data_raw.get("categorie", ""),
        usagePrevu=product_data_raw.get("usagePrevu", ""),
        publicCible=product_data_raw.get("publicCible", ""),
        ingredientsINCI=product_data_raw.get("ingredientsINCI", ""),
        formuleQuantitative=product_data_raw.get("formuleQuantitative", ""),
        methodeFabrication=product_data_raw.get("methodeFabrication", ""),
        controlesQualite=product_data_raw.get("controlesQualite", ""),
        fonctionProduit=product_data_raw.get("fonctionProduit", ""),
        precautionsEmploi=product_data_raw.get("precautionsEmploi", ""),
        ddmOuPao=product_data_raw.get("ddmOuPao", ""),
        poidsVolume=product_data_raw.get("poidsVolume", ""),
    )

    visa_raw = payload.get("visaData", payload.get("visa_data", {})) or {}
    visa_data = VisaData(
        scriptPub=visa_raw.get("scriptPub", ""),
        ciblePub=visa_raw.get("ciblePub", ""),
    )

    return SubmissionData(
        context=context,
        declarant=declarant,
        operator_data=operator_data,
        product=product,
        product_data=product_data,
        visa_data=visa_data,
        modifications=payload.get("modifications", []) or [],
        no_change=bool(payload.get("noChange", payload.get("no_change", False))),
    )


# ============================================================
# Generic helpers
# ============================================================

def pdf_has_text(pdf_path: str) -> bool:
    doc = fitz.open(pdf_path)
    try:
        for page in doc:
            if page.get_text().strip():
                return True
        return False
    finally:
        doc.close()


def normalize_boxes(boxes: List[List[int]], width: int, height: int) -> List[List[int]]:
    normalized = []
    for (x0, y0, x1, y1) in boxes:
        normalized.append([
            int(1000 * x0 / max(width, 1)),
            int(1000 * y0 / max(height, 1)),
            int(1000 * x1 / max(width, 1)),
            int(1000 * y1 / max(height, 1)),
        ])
    return normalized


def clean_text(s: str) -> str:
    s = (s or "").lower()
    s = s.replace("’", "'").replace("`", "'").replace("´", "'")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _loose_text(s: str) -> str:
    """OCR-tolerant text: lowercase, no accents/punctuation, compact spaces."""
    import unicodedata
    s = clean_text(s)
    s = "".join(ch for ch in unicodedata.normalize("NFKD", s) if not unicodedata.combining(ch))
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def contains_any(text: str, keywords: List[str]) -> bool:
    text_low = clean_text(text)
    text_loose = _loose_text(text)
    for k in keywords:
        k_low = clean_text(k)
        if k_low and k_low in text_low:
            return True
        k_loose = _loose_text(k)
        if k_loose and k_loose in text_loose:
            return True
    return False


def contains_all_loose(text: str, keywords: List[str]) -> bool:
    text_loose = _loose_text(text)
    return all(_loose_text(k) in text_loose for k in keywords if _loose_text(k))


def extract_dates(text: str) -> List[str]:
    return re.findall(
        r"\b(?:\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})\b",
        text or ""
    )

def find_doc_number(text: str) -> Optional[str]:
    m = re.search(r"\b(n°|no|numéro|numero)\s*[:\-]?\s*([a-z0-9\/\-\._]+)\b", text or "", re.I)
    return m.group(2) if m else None


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _normalize_text(value: str) -> str:
    value = _clean_str(value).lower()
    value = re.sub(r"\s+", " ", value)
    return value


def _digits_only(value: str) -> str:
    return re.sub(r"\D+", "", _clean_str(value))


def _safe_basename(path: str) -> str:
    return _normalize_text(os.path.basename(path or ""))


# ============================================================
# OCR and extraction
# ============================================================

def extract_from_digital_pdf(pdf_path: str) -> Tuple[List[str], List[List[int]], Image.Image, str]:
    words, boxes = [], []
    full_text_parts = []

    doc = fitz.open(pdf_path)
    try:
        for page in doc:
            full_text_parts.append(page.get_text())

            page_words = page.get_text("words")
            for item in page_words:
                x0, y0, x1, y1, word, *_ = item
                if not word or not word.strip():
                    continue

                words.append(word)
                boxes.append([int(x0), int(y0), int(x1), int(y1)])

        first_page = doc[0]
        pix = first_page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        image = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")

    finally:
        doc.close()

    return words, boxes, image, "\n".join(full_text_parts)


def extract_from_image(image_path: str) -> Tuple[List[str], List[List[int]], Image.Image, str]:
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")

    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    h, w = img.shape[:2]
    max_side = 1600
    scale = min(max_side / max(h, w), 1.0)
    if scale < 1.0:
        new_w = int(w * scale)
        new_h = int(h * scale)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

    reader = _get_easyocr_reader()
    if reader is None:
        pil_image = Image.fromarray(img)
        return [], [], pil_image, ""

    results = reader.readtext(img, detail=1, paragraph=False)

    words = []
    boxes = []
    full_text_parts = []

    for item in results:
        bbox, text, prob = item
        if not text or not text.strip():
            continue

        xs = [pt[0] for pt in bbox]
        ys = [pt[1] for pt in bbox]
        x0, y0 = int(min(xs)), int(min(ys))
        x1, y1 = int(max(xs)), int(max(ys))

        words.append(text)
        boxes.append([x0, y0, x1, y1])
        full_text_parts.append(text)

    full_text = "\n".join(full_text_parts)
    pil_image = Image.fromarray(img)
    return words, boxes, pil_image, full_text


def scanned_pdf_to_page_images(pdf_path: str, dpi: int = PDF_RENDER_DPI) -> List[Tuple[int, str]]:
    doc = fitz.open(pdf_path)
    out: List[Tuple[int, str]] = []
    try:
        for i in range(len(doc)):
            page = doc[i]
            mat = fitz.Matrix(dpi / 72, dpi / 72)
            pix = page.get_pixmap(matrix=mat, alpha=False)
            img_bytes = pix.tobytes("png")
            temp_path = os.path.join(tempfile.gettempdir(), f"ammps_page_{os.getpid()}_{i + 1}.png")
            Image.open(io.BytesIO(img_bytes)).save(temp_path)
            out.append((i + 1, temp_path))
    finally:
        doc.close()
    return out


def extract_words_boxes(file_path: str) -> Tuple[List[str], List[List[int]], Image.Image, str]:
    if file_path.lower().endswith(".pdf"):
        if pdf_has_text(file_path):
            return extract_from_digital_pdf(file_path)

        page_imgs = scanned_pdf_to_page_images(file_path)
        all_words, all_boxes, all_text = [], [], []
        first_image = None

        for page_no, img_path in page_imgs:
            words, boxes, image, text = extract_from_image(img_path)
            if first_image is None:
                first_image = image
            all_words.extend(words)
            all_boxes.extend(boxes)
            all_text.append(f"[PAGE {page_no}]\n{text}")

        if first_image is None:
            first_image = Image.new("RGB", (1000, 1000), "white")

        return all_words, all_boxes, first_image, "\n".join(all_text)

    return extract_from_image(file_path)


def generate_layout_embeddings(words: List[str], boxes: List[List[int]], image: Image.Image):
    processor, layout_model = _get_layout()
    if processor is None or layout_model is None:
        return None
    if len(words) == 0:
        return None

    width, height = image.size
    normalized_boxes = normalize_boxes(boxes, width, height)

    if len(words) != len(normalized_boxes):
        m = min(len(words), len(normalized_boxes))
        words = words[:m]
        normalized_boxes = normalized_boxes[:m]

    encoding = processor(
        image,
        words,
        boxes=normalized_boxes,
        return_tensors="pt",
        padding="max_length",
        truncation=True,
    )

    with torch.no_grad():
        outputs = layout_model(**encoding)

    return outputs.last_hidden_state


# ============================================================
# YOLO helpers
# ============================================================

def render_pdf_pages_to_bgr(pdf_path: str, dpi: int = PDF_RENDER_DPI) -> List[Tuple[int, np.ndarray]]:
    doc = fitz.open(pdf_path)
    out: List[Tuple[int, np.ndarray]] = []
    try:
        mat = fitz.Matrix(dpi / 72, dpi / 72)

        for i in range(len(doc)):
            page = doc[i]
            pix = page.get_pixmap(matrix=mat, alpha=False)
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
            if img.shape[2] == 3:
                img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
            elif img.shape[2] == 4:
                img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
            out.append((i + 1, img))
    finally:
        doc.close()
    return out


def _resize_for_yolo(img_bgr: np.ndarray, max_side: int = MAX_YOLO_SIDE) -> np.ndarray:
    if img_bgr is None or img_bgr.size == 0:
        return img_bgr
    h, w = img_bgr.shape[:2]
    side = max(h, w)
    if side <= max_side:
        return img_bgr
    scale = max_side / float(side)
    return cv2.resize(img_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)


def enhance_scan_bgr(img_bgr: np.ndarray) -> np.ndarray:
    if img_bgr is None or img_bgr.size == 0:
        return img_bgr
    img_bgr = _resize_for_yolo(img_bgr)
    if not YOLO_ENHANCE:
        return img_bgr
    try:
        lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
        l_ch, a_ch, b_ch = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l2 = clahe.apply(l_ch)
        return cv2.cvtColor(cv2.merge([l2, a_ch, b_ch]), cv2.COLOR_LAB2BGR)
    except cv2.error as e:
        print("⚠️ YOLO enhancement skipped because of OpenCV memory/image error:", repr(e))
        return _resize_for_yolo(img_bgr)


def yolo_detect_file(file_path: str, conf: float = YOLO_CONF_DEFAULT, dpi: int = PDF_RENDER_DPI) -> Dict[str, Any]:
    dets: Dict[str, List[Dict[str, Any]]] = {
        "signature": [],
        "stamp": [],
        "official_header": [],
    }

    if DISABLE_YOLO:
        return {"status": "DISABLED", "detections": dets}

    yolo = _get_yolo()
    if isinstance(yolo, dict):
        return {
            "status": "NO_MODEL",
            "error": yolo.get("error"),
            "weights_path": yolo.get("weights_path"),
            "detections": dets,
        }

    if file_path.lower().endswith(".pdf"):
        page_imgs = render_pdf_pages_to_bgr(file_path, dpi=dpi)
    else:
        img = cv2.imread(file_path)
        if img is None:
            return {"status": "ERROR_IMAGE_LOAD", "detections": dets}
        page_imgs = [(1, img)]

    names = yolo.names if hasattr(yolo, "names") else {}

    def normalize_cls(name: str):
        n = str(name).lower().strip()
        if "stamp" in n or "cachet" in n or "tampon" in n or "seal" in n:
            return "stamp"
        if "signature" in n or n in ("sig", "sign") or (len(n) >= 4 and "sign" in n and "stamp" not in n):
            return "signature"
        if "header" in n or "entete" in n or "en-tete" in n or "logo" in n:
            return "official_header"
        return None

    predict_conf = min(conf, YOLO_PREDICT_CONF, YOLO_CONF_SIGNATURE * 0.9)

    for page_no, img_bgr in page_imgs:
        try:
            frame = enhance_scan_bgr(img_bgr)
            results = yolo.predict(
                frame,
                conf=predict_conf,
                imgsz=min(YOLO_IMGSZ, MAX_YOLO_SIDE),
                iou=0.5,
                verbose=False,
            )
        except cv2.error as e:
            print(f"⚠️ YOLO skipped for {os.path.basename(file_path)} page {page_no}: {repr(e)}")
            continue
        except Exception as e:
            print(f"⚠️ YOLO prediction error for {os.path.basename(file_path)} page {page_no}: {repr(e)}")
            continue
        if not results:
            continue

        r = results[0]
        if YOLO_DEBUG:
            print(f"[YOLO_DEBUG] page={page_no} raw_boxes={len(r.boxes)} predict_conf={predict_conf} imgsz={YOLO_IMGSZ}")

        if getattr(r, "boxes", None) is None:
            continue

        for b in r.boxes:
            cls_id = int(b.cls.item())
            cls_name = names.get(cls_id, str(cls_id))
            cls_norm = normalize_cls(cls_name)
            if cls_norm is None:
                continue

            x1, y1, x2, y2 = b.xyxy[0].tolist()
            dets[cls_norm].append({
                "page": page_no,
                "conf": round(float(b.conf.item()), 3),
                "bbox_xyxy": [
                    round(float(x1), 1),
                    round(float(y1), 1),
                    round(float(x2), 1),
                    round(float(y2), 1),
                ],
                "raw_class": str(cls_name),
            })

    return {"status": "OK", "detections": dets, "yolo_names": names}


def _yolo_threshold_for_class(cls: str) -> float:
    if cls == "signature":
        return YOLO_CONF_SIGNATURE
    return YOLO_CONF_DEFAULT


def has_yolo(yolo_res: Dict[str, Any], cls: str, min_conf: Optional[float] = None) -> bool:
    if not isinstance(yolo_res, dict):
        return False

    if yolo_res.get("status") != "OK":
        return False

    thr = min_conf if min_conf is not None else _yolo_threshold_for_class(cls)

    detections = yolo_res.get("detections", {}).get(cls, [])
    return any(float(d.get("conf", 0.0)) >= thr for d in detections)

# ============================================================
# Document rules
# ============================================================

DOC_RULES = {
    "cooperative": [
        "COOP_FORMULAIRE_DECLARATION",
        "COOP_PLAN_ARCHITECTURAL",
        "COOP_LISTE_PERSONNEL",
        "COOP_STATUT",
        "COOP_PV_ASSEMBLEE_GENERALE",
        "COOP_ARRETE_CREATION_OU_DEPOT",
    ],
    "general_common": [
        "LETTRE_DEMANDE",
        "FICHE_SIGNALETIQUE_ANNEXE_C",
        "ATTESTATION_DECLARATION_SOCIETE",
        "ATTESTATION_FABRICANT_AUTORISATION_COMMERCIALISATION",
        "MAQUETTE_ETIQUETAGE_CONDITIONNEMENT",
        "PHOTO_EMBALLAGE",
        "NOTICE_UTILISATION",
        "ACCUSE_CAPM_FICHE_SECURITE",
        "CERTIFICAT_VENTE_LIBRE",
        "CERTIFICAT_BPF_ISO22716",
        "DECLARATION_HONNEUR_NORMES_INTERNATIONALES",
        "FICHIERS_NUMERISES",
    ],
    "activity_specific": {
        "ImF": ["AUTORISATION_EXERCICE_PAYS_ORIGINE"],
        "ImV": ["AUTORISATION_EXERCICE_PAYS_ORIGINE", "CONTRAT_SOUS_TRAITANCE"],
        "FL": [],
        "FE": ["CONTRAT_SOUS_TRAITANCE"],
    },
    "optional": [
        "CERTIFICAT_OMPIC",
    ],
    "renewal": [
        "DECLARATION_HONNEUR_SANS_MODIFICATION",
        "COPIE_CERTIFICAT_ENREGISTREMENT_RENOUVELLEMENT",
    ],
    "modification": [
        "DECLARATION_INITIALE",
        "JUSTIFICATIF_MODIFICATION",
    ],
    "visa_publicite": [
        "SCRIPT_PUBLICITAIRE",
    ],
    "cannabis": [
        "AUTORISATION_ANRAC",
        "FICHE_TECHNIQUE_MATIERE_PREMIERE_CANNABIS",
        "FDS_MATIERE_PREMIERE",
        "BULLETIN_ANALYSE_PRODUIT_FINI",
        "BULLETIN_ANALYSE_EXTRAIT_CANNABIS",
        "DECLARATION_THC_ZERO",
        "RAPPORT_STABILITE_PRODUIT_FINI",
    ],
}

DOC_LABELS = {
    "COOP_FORMULAIRE_DECLARATION": "Formulaire de déclaration de la coopérative",
    "COOP_PLAN_ARCHITECTURAL": "Plan architectural",
    "COOP_LISTE_PERSONNEL": "Liste du personnel",
    "COOP_STATUT": "Statut de la coopérative",
    "COOP_PV_ASSEMBLEE_GENERALE": "PV de l'assemblée générale",
    "COOP_ARRETE_CREATION_OU_DEPOT": "Arrêté de création ou attestation de dépôt",
    "LETTRE_DEMANDE": "Lettre de demande",
    "FICHE_SIGNALETIQUE_ANNEXE_C": "Fiche signalétique annexe C",
    "ATTESTATION_DECLARATION_SOCIETE": "Attestation de déclaration de la société",
    "ATTESTATION_FABRICANT_AUTORISATION_COMMERCIALISATION": "Attestation du fabricant autorisant la commercialisation",
    "MAQUETTE_ETIQUETAGE_CONDITIONNEMENT": "Maquette étiquetage / conditionnement",
    "PHOTO_EMBALLAGE": "Photographie emballage",
    "NOTICE_UTILISATION": "Notice d'utilisation",
    "ACCUSE_CAPM_FICHE_SECURITE": "Accusé CAPM / fiche sécurité",
    "CERTIFICAT_VENTE_LIBRE": "Certificat de vente libre",
    "CONTRAT_SOUS_TRAITANCE": "Contrat de sous-traitance",
    "CERTIFICAT_OMPIC": "Certificat OMPIC",
    "AUTORISATION_EXERCICE_PAYS_ORIGINE": "Autorisation d'exercice du fabricant",
    "CERTIFICAT_BPF_ISO22716": "Certificat BPF / ISO 22716",
    "DECLARATION_HONNEUR_NORMES_INTERNATIONALES": "Déclaration sur l'honneur",
    "FICHIERS_NUMERISES": "Fichiers numérisés",
    "DECLARATION_HONNEUR_SANS_MODIFICATION": "Déclaration sur l'honneur sans modification",
    "COPIE_CERTIFICAT_ENREGISTREMENT_RENOUVELLEMENT": "Copie du certificat d'enregistrement",
    "DECLARATION_INITIALE": "Copie de la déclaration initiale",
    "JUSTIFICATIF_MODIFICATION": "Justificatif de la modification",
    "SCRIPT_PUBLICITAIRE": "Script / texte publicitaire",
    "AUTORISATION_ANRAC": "Autorisation ANRAC",
    "FICHE_TECHNIQUE_MATIERE_PREMIERE_CANNABIS": "Fiche technique matière première cannabis",
    "FDS_MATIERE_PREMIERE": "Fiche de sécurité matière première",
    "BULLETIN_ANALYSE_PRODUIT_FINI": "Bulletin d'analyse produit fini",
    "BULLETIN_ANALYSE_EXTRAIT_CANNABIS": "Bulletin d'analyse extrait cannabis",
    "DECLARATION_THC_ZERO": "Déclaration THC = 0",
    "RAPPORT_STABILITE_PRODUIT_FINI": "Rapport de stabilité produit fini",
    "UNKNOWN": "Document inconnu",
}

FILENAME_DOC_HINTS = {
    # Filename hints are intentionally strong because OCR can confuse scanned documents.
    # Cannabis-specific documents are placed first because broad words such as
    # "autorisation", "fiche", "bulletin", "photo", or "déclaration" can otherwise
    # be captured by generic validators and make required cannabis documents appear missing.
    "AUTORISATION_ANRAC": [
        "autorisation anrac", "autorisation_anrac", "anrac", "certificat d autorisation anrac",
        "certificat_d_autorisation_anrac",
    ],
    "FICHE_TECHNIQUE_MATIERE_PREMIERE_CANNABIS": [
        "fiche technique cannabis", "fiche_technique_de_produit_derive_du_cannabis",
        "fiche technique de produit derive du cannabis", "fiche technique matiere premiere cannabis",
        "fiche_technique_matiere_premiere_cannabis", "matiere premiere cannabis", "cbd fiche technique",
    ],
    "FDS_MATIERE_PREMIERE": [
        "fiche de donnees de securite cbd", "fiche_de_donnees_de_securite_cbd",
        "fiche de securite cbd", "fiche_de_securite_cbd", "fds cbd", "fds cannabis",
        "fiche securite matiere premiere", "fiche_de_securite_matiere_premiere",
    ],
    "BULLETIN_ANALYSE_PRODUIT_FINI": [
        "bulletin analyse produit fini", "bulletin_d_analyse_produit_fini",
        "bulletin d analyse produit fini", "dosage cbd thc", "labosafe",
        "bulletin_d_analyse_laboratoire_labosafe",
    ],
    "BULLETIN_ANALYSE_EXTRAIT_CANNABIS": [
        "bulletin analyse extrait cannabis", "bulletin_d_analyse_extrait_cannabis",
        "bulletin d analyse extrait cannabis", "extrait cannabis", "cannabidiol", "cannalab",
        "bulletin_d_analyse_de_cannalab_maroc",
    ],
    "DECLARATION_THC_ZERO": [
        "declaration thc zero", "declaration_thc_zero", "thc zero", "thc=0", "thc 0",
        "declaration legale et notariale officielle", "declaration_legale_et_notariale_officielle",
        "declaration absence thc", "sans thc",
    ],
    "RAPPORT_STABILITE_PRODUIT_FINI": [
        "rapport stabilite produit fini", "rapport_d_etude_de_stabilite_de_cbd",
        "rapport d etude de stabilite de cbd", "rapport etude stabilite", "stabilite cbd",
        "rapport_d_etude_de_stabilite",
    ],
    "LETTRE_DEMANDE": [
        "demande d enregistrement", "demande_enregistrement", "demande d'enregistrement",
        "demande", "lettre demande", "lettre_demande",
    ],
    "ATTESTATION_DECLARATION_SOCIETE": [
        "declaration de la societe", "declaration_de_la_societe", "attestation declaration societe",
        "attestation_declaration_societe", "3 3 declaration", "3-3-declaration",
        "etablissement", "fabrication d importation", "fabrication d'importation",
    ],
    "AUTORISATION_EXERCICE_PAYS_ORIGINE": [
        "certificat d autorisation officielle de fabrication", "certificat_d_autorisation_officielle_de_fabrication",
        "autorisation officielle de fabrication", "autorisation du fabricant", "autorisation exercice",
        "autorisation d exercice", "manufacturer authorisation", "manufacturer authorization",
        "state trade", "regional council", "darmstadt",
    ],
    "CERTIFICAT_BPF_ISO22716": [
        "certificat de bonnes pratiques", "bonnes pratiques de fabrication", "bonnes_pratiques",
        "bpf", "gmp", "iso22716", "iso 22716", "manufacturing practice",
    ],
    "DECLARATION_HONNEUR_NORMES_INTERNATIONALES": [
        "declaration sur l honneur", "declaration_sur_l_honneur", "declaration sur l'honneur", "honneur",
    ],
    "FICHE_SIGNALETIQUE_ANNEXE_C": [
        "fiche signaletique", "fiche_signaletique", "fiche-signal", "fiche_sign",
        "signaletique", "signalétique", "annexe c",
    ],
    "PHOTO_EMBALLAGE": [
        "photo emballage", "photo_emballage", "photographie", "photosencouleur",
        "recto", "verso", "emballage", "product", "produit",
    ],
    "FICHIERS_NUMERISES": [
        "list", "liste ingredients", "ingredient list", "ingredients list", "inci", "files", "digital",
    ],
    "MAQUETTE_ETIQUETAGE_CONDITIONNEMENT": [
        "maquette", "maqette", "artwork", "packaging", "etiquetage", "etiquet", "label", "conditionnement",
    ],
    "CERTIFICAT_VENTE_LIBRE": ["cvl", "free sale", "free_sales", "vente libre", "certificat vente libre"],
    "ACCUSE_CAPM_FICHE_SECURITE": ["capm", "accus", "reception", "fiche securite", "fiche_securite"],
    "CERTIFICAT_OMPIC": ["ompic"],
    "ATTESTATION_FABRICANT_AUTORISATION_COMMERCIALISATION": [
        "autorisant la commercialisation", "loa", "letter of authorization",
        "attestation originale", "attestation fabricant", "commercialisation",
    ],
    "CONTRAT_SOUS_TRAITANCE": ["contrat", "sous-traitance", "sous_traitance"],
    "NOTICE_UTILISATION": ["notice", "utilisation", "mode-emploi", "mode_emploi"],
}


DOC_TYPE_ALIASES = {
    "CVL": "CERTIFICAT_VENTE_LIBRE",
    "FREE_SALES_CERTIFICATE": "CERTIFICAT_VENTE_LIBRE",
    "FREE_SALE_CERTIFICATE": "CERTIFICAT_VENTE_LIBRE",
}


# ============================================================
# Classification
# ============================================================

def classify_document_by_text(text_raw: str) -> str:
    text = clean_text(text_raw)
    loose = _loose_text(text_raw)

    # High-priority rules first. Cannabis documents MUST be checked before
    # broad rules such as authorization / declaration / maquette / photo / personnel.
    # Otherwise uploaded cannabis files are misclassified and then counted as missing.
    if "anrac" in loose and ("autorisation" in loose or "authorization" in loose or "authorisation" in loose or "certificat" in loose):
        return "AUTORISATION_ANRAC"

    if ("fiche technique" in loose or ("technical" in loose and "sheet" in loose)) and any(k in loose for k in ["cannabis", "cbd", "thc", "chanvre", "cannabidiol"]):
        return "FICHE_TECHNIQUE_MATIERE_PREMIERE_CANNABIS"

    if ("fiche de securite" in loose or "fiche de donnees de securite" in loose or "safety data sheet" in loose or re.search(r"\bfds\b", loose)) and any(k in loose for k in ["cannabis", "cbd", "thc", "chanvre", "cannabidiol"]):
        return "FDS_MATIERE_PREMIERE"

    if ("rapport" in loose and "stabilite" in loose) or ("stability" in loose and "report" in loose):
        if any(k in loose for k in ["cannabis", "cbd", "thc", "chanvre", "produit fini"]):
            return "RAPPORT_STABILITE_PRODUIT_FINI"

    if "bulletin" in loose and ("analyse" in loose or "analysis" in loose) and any(k in loose for k in ["cannabis", "cbd", "thc", "cannabidiol", "produit fini", "extrait"]):
        if "extrait" in loose or "cannabidiol" in loose:
            return "BULLETIN_ANALYSE_EXTRAIT_CANNABIS"
        return "BULLETIN_ANALYSE_PRODUIT_FINI"

    if ("thc" in loose and ("zero" in loose or "0" in loose or "absence" in loose or "sans" in loose)) and ("declaration" in loose or "honneur" in loose or "legale" in loose or "notariale" in loose):
        return "DECLARATION_THC_ZERO"

    # Generic high-priority rules. These must come before broad rules like
    # attestation / declaration / maquette, otherwise valid docs are counted missing.

    if (
        "22716" in loose
        or re.search(r"\bbpf\b", loose)
        or re.search(r"\bgmp\b", loose)
        or "good manufacturing" in loose
        or "bonnes pratiques" in loose
        or "manufacturing practice" in loose
    ):
        return "CERTIFICAT_BPF_ISO22716"

    if (
        "declaration sur l honneur" in loose
        or "déclaration sur l'honneur" in text
        or "normes internationales" in loose
        or ("qualite" in loose and "securite" in loose and "efficacite" in loose)
    ):
        return "DECLARATION_HONNEUR_NORMES_INTERNATIONALES"

    if (
        ("fiche" in loose and ("signaletique" in loose or "signal etique" in loose))
        or "annexe c" in loose
        or "nouvel enregistrement" in loose
    ):
        return "FICHE_SIGNALETIQUE_ANNEXE_C"

    if (
        ("autorisation" in loose or "authorization" in loose or "authorisation" in loose or "permit" in loose or "licence" in loose)
        and (
            "exercice" in loose
            or "fabrication" in loose
            or "manufacturer" in loose
            or "fabricant" in loose
            or "country of origin" in loose
            or "pays d origine" in loose
            or "state trade" in loose
            or "regional council" in loose
            or "darmstadt" in loose
            or "office de surveillance" in loose
        )
        and not ("letter of authorization" in loose and "commercial" in loose)
    ):
        return "AUTORISATION_EXERCICE_PAYS_ORIGINE"

    if (
        contains_any(text, ["capm", "centre antipoison", "pharmacovigilance"])
        and contains_any(text, ["accusé", "accuse", "réception", "reception"])
    ):
        return "ACCUSE_CAPM_FICHE_SECURITE"

    if contains_any(text, ["certificat de vente libre", "free sale certificate", "free sales certificate", "libre vente", "freely sold"]):
        return "CERTIFICAT_VENTE_LIBRE"

    if contains_any(text, ["directeur de l'ammps", "directeur de l ammps", "monsieur le directeur"]) and contains_any(text, ["lettre", "demande", "objet", "requête", "requete", "enregistrement"]):
        return "LETTRE_DEMANDE"


    if (
        contains_any(text, ["attestation", "déclaration", "declaration"])
        and contains_any(text, ["registre de commerce", "modèle 7", "modele 7", "rc", "ice"])
        and contains_any(text, ["activité", "activite", "importation", "fabrication", "distribution", "exportation"])
    ):
        return "ATTESTATION_DECLARATION_SOCIETE"

    if contains_any(text, ["formulaire de déclaration", "formulaire de declaration"]) and contains_any(text, ["coopérative", "cooperative"]):
        return "COOP_FORMULAIRE_DECLARATION"
    if contains_any(text, ["plan architectural", "plan du local", "plan d'aménagement", "plan d amenagement"]):
        return "COOP_PLAN_ARCHITECTURAL"
    if contains_any(text, ["liste du personnel", "personnel", "employé", "employe", "fonction", "poste"]) and len(text) < 5000:
        return "COOP_LISTE_PERSONNEL"
    if contains_any(text, ["statut de la coopérative", "statut de la cooperative", "tribunal"]) and contains_any(text, ["coopérative", "cooperative"]):
        return "COOP_STATUT"
    if contains_any(text, ["assemblée générale", "assemblee generale", "pv"]) and contains_any(text, ["coopérative", "cooperative"]):
        return "COOP_PV_ASSEMBLEE_GENERALE"
    if contains_any(text, ["arrêté de création", "arrete de creation", "attestation de dépôt", "attestation de depot", "tribunal"]) and contains_any(text, ["coopérative", "cooperative"]):
        return "COOP_ARRETE_CREATION_OU_DEPOT"

    if contains_any(text, ["ompic"]) and contains_any(text, ["certificat", "enregistrement", "marque", "dépôt", "depot"]):
        return "CERTIFICAT_OMPIC"

    if contains_any(text, ["contrat de sous-traitance", "sous-traitance", "sous traitance"]):
        return "CONTRAT_SOUS_TRAITANCE"

    if contains_any(text, ["notice", "mode d'emploi", "mode d emploi", "utilisation", "instructions"]):
        return "NOTICE_UTILISATION"

    if (
        contains_any(text, ["fabricant", "manufacturer"])
        and contains_any(text, ["autorise", "authorized", "commercialiser", "commercialisation", "distribuer", "distribution"])
        and contains_any(text, ["attestation", "certifiée conforme", "certifiee conforme", "original", "letter of authorization", "loa"])
    ):
        return "ATTESTATION_FABRICANT_AUTORISATION_COMMERCIALISATION"

    if (
        contains_any(text, ["attestation", "déclaration", "declaration"])
        and contains_any(text, ["registre de commerce", "modèle 7", "modele 7", "rc", "ice"])
        and contains_any(text, ["activité", "activite", "importation", "fabrication", "distribution", "exportation"])
    ):
        return "ATTESTATION_DECLARATION_SOCIETE"

    if contains_any(text, ["maquette", "étiquetage", "etiquetage", "conditionnement", "packaging", "charte graphique", "signature client", "ingredients", "inci", "barcode", "lipgloss", "lip gloss"]):
        return "MAQUETTE_ETIQUETAGE_CONDITIONNEMENT"

    if contains_any(text, ["photo", "photographie", "recto", "verso", "emballage"]) and len(text) < 1000:
        return "PHOTO_EMBALLAGE"

    if contains_any(text, ["fichiers numérisés", "fichiers numerises", "support électronique", "support electronique", "format électronique", "format electronique", "ingredient list", "inci", "content (%)"]):
        return "FICHIERS_NUMERISES"

    if contains_any(text, ["aucune modification n'a été apportée", "aucune modification n a ete apportee", "sans modification"]) and contains_any(text, ["déclaration sur l'honneur", "declaration sur l honneur", "honneur"]):
        return "DECLARATION_HONNEUR_SANS_MODIFICATION"
    if contains_any(text, ["certificat d'enregistrement", "certificat d enregistrement"]) and contains_any(text, ["renouvellement", "quinquennal", "enregistrement"]):
        return "COPIE_CERTIFICAT_ENREGISTREMENT_RENOUVELLEMENT"
    if contains_any(text, ["déclaration initiale", "declaration initiale"]):
        return "DECLARATION_INITIALE"
    if contains_any(text, ["justificatif de la modification", "justificatif modification", "modification identifiée", "modification identifiee", "déclaration de modification", "declaration de modification"]):
        return "JUSTIFICATIF_MODIFICATION"
    if contains_any(text, ["script publicitaire", "texte publicitaire", "publicité", "publicite", "promotion"]):
        return "SCRIPT_PUBLICITAIRE"

    if contains_any(text, ["anrac"]) and contains_any(text, ["autorisation", "activité", "activite"]):
        return "AUTORISATION_ANRAC"
    if contains_any(text, ["fiche technique"]) and contains_any(text, ["cannabis", "cbd", "thc", "matière première", "matiere premiere"]):
        return "FICHE_TECHNIQUE_MATIERE_PREMIERE_CANNABIS"
    if contains_any(text, ["fiche de sécurité", "fiche de securite", "fds"]) and contains_any(text, ["cannabis", "cbd", "thc", "matière première", "matiere premiere"]):
        return "FDS_MATIERE_PREMIERE"
    if contains_any(text, ["bulletin d'analyse", "bulletin d analyse"]) and contains_any(text, ["produit fini", "cbd", "thc"]):
        return "BULLETIN_ANALYSE_PRODUIT_FINI"
    if contains_any(text, ["bulletin d'analyse", "bulletin d analyse"]) and contains_any(text, ["extrait du cannabis", "extrait cannabis", "cbd"]):
        return "BULLETIN_ANALYSE_EXTRAIT_CANNABIS"
    if contains_any(text, ["thc = 0", "thc=0", "absence de thc", "sans thc"]) and contains_any(text, ["déclaration sur l'honneur", "declaration sur l honneur", "honneur"]):
        return "DECLARATION_THC_ZERO"
    if contains_any(text, ["rapport d'étude de stabilité", "rapport d etude de stabilite", "stabilité du produit fini", "stabilite du produit fini"]):
        return "RAPPORT_STABILITE_PRODUIT_FINI"

    return "UNKNOWN"

def _filename_hint_doc_type(file_path: str) -> Tuple[str, float, str]:
    """OCR-tolerant filename classification.

    Important: uploaded files often already contain the real document type.
    We normalize underscores, hyphens, accents and punctuation so names like
    Demande_d_enregistrement_de_produit_cosmetique.png are recognized.
    """
    name = _safe_basename(file_path)
    if not name:
        return "UNKNOWN", 0.0, "none"

    name_loose = _loose_text(name)
    for doc_type, patterns in FILENAME_DOC_HINTS.items():
        for p in patterns:
            p_loose = _loose_text(p)
            if p_loose and p_loose in name_loose:
                return doc_type, 0.96, f"filename:{p}"
    return "UNKNOWN", 0.0, "none"


def _guess_doc_type_from_text_and_filename(text_raw: str, file_path: str) -> Tuple[str, float, str]:
    text = clean_text(text_raw)

    # First trust strong filename hints for documents that OCR commonly confuses.
    # This prevents a demand letter being classified as declaration honneur, a company
    # declaration as personnel list, product photo as maquette, etc.
    by_name, conf_name, reason = _filename_hint_doc_type(file_path)
    strong_filename_types = {
        "LETTRE_DEMANDE",
        "ATTESTATION_DECLARATION_SOCIETE",
        "AUTORISATION_EXERCICE_PAYS_ORIGINE",
        "PHOTO_EMBALLAGE",
        "FICHIERS_NUMERISES",
        "FICHE_SIGNALETIQUE_ANNEXE_C",
        "AUTORISATION_ANRAC",
        "FICHE_TECHNIQUE_MATIERE_PREMIERE_CANNABIS",
        "FDS_MATIERE_PREMIERE",
        "BULLETIN_ANALYSE_PRODUIT_FINI",
        "BULLETIN_ANALYSE_EXTRAIT_CANNABIS",
        "DECLARATION_THC_ZERO",
        "RAPPORT_STABILITE_PRODUIT_FINI",
    }
    if by_name in strong_filename_types:
        return DOC_TYPE_ALIASES.get(by_name, by_name), conf_name, reason

    by_text = classify_document_by_text(text_raw)
    if by_text != "UNKNOWN":
        return DOC_TYPE_ALIASES.get(by_text, by_text), 0.93, "text"

    if by_name != "UNKNOWN":
        return DOC_TYPE_ALIASES.get(by_name, by_name), conf_name, reason

    loose = _loose_text(text_raw)
    if "22716" in loose or re.search(r"\bbpf\b", loose) or re.search(r"\bgmp\b", loose) or "good manufacturing" in loose:
        return "CERTIFICAT_BPF_ISO22716", 0.90, "text_heuristic"
    if "honneur" in loose or "normes internationales" in loose:
        return "DECLARATION_HONNEUR_NORMES_INTERNATIONALES", 0.90, "text_heuristic"
    if "fiche" in loose and ("signaletique" in loose or "annexe c" in loose):
        return "FICHE_SIGNALETIQUE_ANNEXE_C", 0.90, "text_heuristic"
    if ("autorisation" in loose or "authorization" in loose or "authorisation" in loose) and ("fabrication" in loose or "manufacturer" in loose or "darmstadt" in loose):
        return "AUTORISATION_EXERCICE_PAYS_ORIGINE", 0.90, "text_heuristic"

    if contains_any(text, ["free sales certificate", "free sale certificate", "certificate is issued", "export to morocco"]):
        return "CERTIFICAT_VENTE_LIBRE", 0.88, "text_heuristic"
    if contains_any(text, ["letter of authorization", "to whom it may concern", "hereby authorized", "sole person in charge"]):
        return "ATTESTATION_FABRICANT_AUTORISATION_COMMERCIALISATION", 0.88, "text_heuristic"
    if contains_any(text, ["ingredient list", "inci", "cas", "content (%)"]):
        return "FICHIERS_NUMERISES", 0.82, "text_heuristic"
    if contains_any(text, ["manufactured’s authorisation", "manufacturer’s authorisation", "state trade supervisory office", "regional council darmstadt"]):
        return "AUTORISATION_EXERCICE_PAYS_ORIGINE", 0.86, "text_heuristic"
    if contains_any(text, ["accusé de réception", "accuse de reception", "centre antipoison", "pharmacovigilance marocain"]):
        return "ACCUSE_CAPM_FICHE_SECURITE", 0.90, "text_heuristic"
    if contains_any(text, ["fiche signalétique d’un produit cosmétique", "fiche signaletique d’un produit cosmetique", "nouvel enregistrement"]):
        return "FICHE_SIGNALETIQUE_ANNEXE_C", 0.89, "text_heuristic"
    return "UNKNOWN", 0.0, "none"


def classify_document(text_raw: str, file_path: Optional[str] = None) -> str:
    doc_type, _, _ = _guess_doc_type_from_text_and_filename(text_raw, file_path or "")
    return doc_type


# ============================================================
# Structured extraction
# ============================================================

def detect_signature_or_stamp_hint(text_raw: str) -> Dict[str, bool]:
    text = clean_text(text_raw)
    signature_hint = contains_any(text, ["signature", "signé", "signe", "signée", "signee"])
    stamp_hint = contains_any(text, ["cachet", "tampon", "stamp"])
    legalisation_hint = contains_any(text, ["légalisé", "legalise", "légalisée", "legalisee"])
    return {
        "signature_hint": signature_hint,
        "stamp_hint": stamp_hint,
        "legalisation_hint": legalisation_hint,
    }


def extract_structured_entities(full_text: str) -> Dict[str, Any]:
    txt = full_text or ""

    ice_match = re.search(r"\bICE\b[:\s\-]*([0-9]{6,20})", txt, re.IGNORECASE)
    rc_match = re.search(r"\b(?:RC|Registre de Commerce)\b[:\s\-]*([A-Za-z0-9/\-]+)", txt, re.IGNORECASE)
    if_match = re.search(r"\b(?:IF|Identifiant Fiscal)\b[:\s\-]*([A-Za-z0-9/\-]+)", txt, re.IGNORECASE)
    cnss_match = re.search(r"\bCNSS\b[:\s\-]*([A-Za-z0-9/\-]+)", txt, re.IGNORECASE)
    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", txt)

    return {
        "ice": ice_match.group(1) if ice_match else "",
        "rc": rc_match.group(1) if rc_match else "",
        "if_number": if_match.group(1) if if_match else "",
        "cnss": cnss_match.group(1) if cnss_match else "",
        "email": email_match.group(0) if email_match else "",
        "full_text_normalized": _normalize_text(txt),
    }


def _extract_common_entities(full_text: str) -> Dict[str, Any]:
    txt = full_text or ""
    structured = extract_structured_entities(txt)

    product_patterns = [
        r"(?:nom du produit|product name|produit)\s*[:\-]\s*([A-Za-zÀ-ÿ0-9\s\-\_\/]+)",
        r"(?:designation|désignation)\s*[:\-]\s*([A-Za-zÀ-ÿ0-9\s\-\_\/]+)",
    ]
    product_name = ""
    for pat in product_patterns:
        m = re.search(pat, txt, re.I)
        if m:
            product_name = m.group(1)
            break

    company_name = ""
    for pat in [
        r"(?:société|societe|company|fabricant|manufacturer)\s*[:\-]\s*([A-Za-zÀ-ÿ0-9\s\-\.'&]+)",
        r"\b([A-Z][A-Z\s]+(?:SARL|S\.A\.R\.L|SA|S\.A|GMBH|LTD|LLC))\b",
    ]:
        m = re.search(pat, txt, re.I)
        if m:
            company_name = m.group(1)
            break

    presentation = ""
    m = re.search(r"\b(?:tube|flacon|pot)\s+(?:de\s*)?(\d+(?:[.,]\d+)?)\s*(ml|g)\b", txt, re.I)
    if m:
        presentation = f"{m.group(1)} {m.group(2)}"

    brand = ""
    m = re.search(r"\b(essence|catrice)\b", txt, re.I)
    if m:
        brand = m.group(1)

    destination_country = ""
    m = re.search(r"\b(export to|destined for the export to|destination)\s+([A-Za-zÀ-ÿ]+)", txt, re.I)
    if m:
        destination_country = m.group(2)

    result = dict(structured)
    result.update({
        "product_name": product_name,
        "company_name": company_name,
        "brand": brand,
        "presentation": presentation,
        "destination_country": destination_country,
    })
    return result


# ============================================================
# Validators
# ============================================================

def _simple_signed_stamped_validator(
    text_raw: str,
    yolo_res: Dict[str, Any],
    label: str,
    require_signature: bool = True,
    require_stamp: bool = True,
) -> Tuple[List[str], List[str]]:
    passed, failed = [], []
    hints = detect_signature_or_stamp_hint(text_raw)

    if require_signature:
        if has_yolo(yolo_res, "signature") or hints["signature_hint"]:
            passed.append("Signature détectée")
        else:
            failed.append(f"{label}: signature non détectée")

    if require_stamp:
        if has_yolo(yolo_res, "stamp") or hints["stamp_hint"]:
            passed.append("Cachet détecté")
        else:
            failed.append(f"{label}: cachet non détecté")

    return passed, failed


def validate_lettre_demande(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    passed, failed = [], []

    if contains_any(text, ["directeur de l'ammps", "directeur de l ammps", "monsieur le directeur"]):
        passed.append("Adressée au Directeur de l'AMMPS")
    else:
        failed.append("Lettre: destinataire Directeur de l'AMMPS non détecté")

    if has_yolo(yolo_res, "official_header") or contains_any(text, ["ice", "rc", "adresse", "société", "societe"]):
        passed.append("En-tête officiel détecté")
    else:
        failed.append("Lettre: en-tête officiel non détecté")

    p2, f2 = _simple_signed_stamped_validator(text_raw, yolo_res, "Lettre")
    passed.extend(p2)
    failed.extend(f2)
    return passed, failed


def validate_fiche_signaletique(
    file_path: str,
    text_raw: str,
    yolo_res: Dict[str, Any]
) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    passed, failed = [], []

    
    if contains_any(text, ["fiche signalétique", "fiche signaletique", "annexe c", "nouvel enregistrement"]) or contains_any(_safe_basename(file_path), ["fiche", "signaletique", "annexe"]):
        passed.append("Modèle fiche signalétique détecté")
    else:
        failed.append("Fiche: modèle fiche signalétique non détecté")

    if extract_dates(text_raw):
        passed.append("Date détectée")
    else:
        failed.append("Fiche: date non détectée")
    
    if detect_signature_or_stamp_hint(text_raw)["signature_hint"] or has_yolo(yolo_res, "signature"):
        passed.append("Signature détectée")
    else:
        failed.append("Fiche: signature non détectée")

    if detect_signature_or_stamp_hint(text_raw)["stamp_hint"] or has_yolo(yolo_res, "stamp"):
        passed.append("Cachet détecté")
    else:
        failed.append("Fiche: cachet non détecté")

    return passed, failed


def validate_attestation_declaration_societe(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    passed, failed = [], []

    if contains_any(text, ["attestation", "déclaration", "declaration", "rc", "ice", "registre de commerce"]):
        passed.append("Attestation société détectée")
    else:
        failed.append("Attestation société: attestation/RC/ICE non détectés")

    if contains_any(text, ["importation", "fabrication", "distribution", "exportation", "activite", "activité"]):
        passed.append("Type d'activité détecté")
    else:
        failed.append("Attestation société: type d'activité non détecté")

    p2, f2 = _simple_signed_stamped_validator(text_raw, yolo_res, "Attestation société")
    passed.extend(p2)
    failed.extend(f2)
    return passed, failed


def validate_attestation_fabricant_autorisation(
    file_path: str,
    text_raw: str,
    yolo_res: Dict[str, Any]
    ) -> Tuple[List[str], List[str]]:
    
    text = clean_text(text_raw)
    passed, failed = [], []

    # 1. Original / copie certifiée conforme
    if contains_any(text, ["original", "certifiée conforme", "certifiee conforme"]):
        passed.append("Original/copie certifiée conforme détecté")
    else:
        failed.append("Attestation fabricant: original/copie certifiée conforme non détecté")

    # 2. Signature
    if detect_signature_or_stamp_hint(text_raw)["signature_hint"] or has_yolo(yolo_res, "signature"):
        passed.append("Signature détectée")
    else:
        failed.append("Attestation fabricant: signature non détectée")

    # 3. Cachet
    if detect_signature_or_stamp_hint(text_raw)["stamp_hint"] or has_yolo(yolo_res, "stamp"):
        passed.append("Cachet détecté")
    else:
        failed.append("Attestation fabricant: cachet non détecté")

    return passed, failed

def validate_maquette_conditionnement(
    file_path: str,
    text_raw: str,
    yolo_res: Dict[str, Any]
    ) -> Tuple[List[str], List[str]]:

    text = clean_text(text_raw)
    passed, failed = [], []

    # 1. Detect packaging content (real logic)
    packaging_keywords = [
        "ingredients", "ingrédients", "inci",
        "lipgloss", "ml", "g", "barcode", "code",
        "brand", "marque", "product", "produit"
    ]

    if contains_any(text, packaging_keywords):
        passed.append("Contenu d’étiquetage détecté")
    else:
        failed.append("Maquette: contenu d’étiquetage non détecté")

    # 2. Multilingual detection (FR/AR/EN)
    if contains_any(text, ["fr", "ar", "en", "français", "arab", "english"]):
        passed.append("Contenu multilingue détecté")
    else:
        failed.append("Maquette: contenu multilingue non détecté")

    return passed, failed


def validate_photo_emballage(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    passed, failed = [], []
    ext = os.path.splitext(file_path)[1].lower()
    text = clean_text(text_raw)

    if ext in [".png", ".jpg", ".jpeg", ".pdf"]:
        passed.append("Support image/PDF valide")
    else:
        failed.append("Photo: format non conforme")

    general_keywords = ["emballage", "conditionnement", "etiquetage", "étiquetage", "photo", "photographie", "packaging", "label", "étiquette"]
    front_keywords = ["logo", "marque", "nom du produit", "product name", "volume", "poids net", "net weight", "net wt", "ml", "g", "kg"]
    back_keywords = [
        "ingredients", "ingrédients", "inci", "mode d'emploi", "conseils d'utilisation", "usage",
        "précautions", "warning", "warnings", "fabriqué par", "made in", "manufactured by",
        "distribué par", "distributed by", "importé par", "barcode", "code barre", "batch", "lot",
        "ddm", "pao", "expiry", "exp", "mfg", "scan", "qr", "adresse", "address"
    ]

    yolo_labels = []
    if isinstance(yolo_res, dict):
        detections = yolo_res.get("detections", {})
        if isinstance(detections, dict):
            yolo_labels = [k.lower() for k, vals in detections.items() if vals]

    visual_keywords = ["bottle", "tube", "box", "jar", "pack", "packaging", "flacon", "tube", "boîte", "pot", "emballage", "barcode", "qr"]

    general_detected = contains_any(text, general_keywords)
    front_detected = contains_any(text, front_keywords)
    back_detected = contains_any(text, back_keywords)
    visual_detected = any(k in yolo_labels for k in visual_keywords)
    low_text = len(text.strip()) < 20

    if general_detected or front_detected or back_detected or visual_detected or low_text:
        passed.append("Photo emballage plausible")
    else:
        failed.append("Photo: contenu emballage non détecté")

    if front_detected and back_detected:
        passed.append("Contenu recto/verso détecté")
    elif front_detected:
        passed.append("Contenu recto détecté")
    elif back_detected:
        passed.append("Contenu verso détecté")
    elif visual_detected or low_text:
        passed.append("Contenu emballage partiellement détecté")
    else:
        failed.append("Photo: contenu recto/verso/emballage non détecté")

    return passed, failed


def validate_notice_utilisation(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    if contains_any(text, ["notice", "utilisation", "mode d'emploi", "mode d emploi", "instructions"]):
        return ["Notice d'utilisation détectée"], []
    return [], ["Notice: mode d'emploi non détecté"]


def validate_accuse_capm(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    passed, failed = [], []

    if contains_any(text, ["capm", "centre antipoison", "accusé", "accuse", "réception", "reception"]):
        passed.append("Accusé CAPM détecté")
    else:
        failed.append("CAPM: accusé de réception non détecté")

    p2, f2 = _simple_signed_stamped_validator(text_raw, yolo_res, "Accusé CAPM", require_signature=False, require_stamp=True)
    passed.extend(p2)
    failed.extend(f2)
    return passed, failed


def validate_certificat_vente_libre(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    passed, failed = [], []

    if contains_any(text, ["certificat de vente libre", "free sale"]):
        passed.append("Certificat de vente libre détecté")
    else:
        failed.append("CVL: certificat de vente libre non détecté")

    if extract_dates(text_raw):
        passed.append("Date détectée")
    else:
        failed.append("CVL: date non détectée")

    p2, f2 = _simple_signed_stamped_validator(text_raw, yolo_res, "CVL")
    passed.extend(p2)
    failed.extend(f2)
    return passed, failed


def validate_contrat_sous_traitance(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    passed, failed = [], []

    if contains_any(text, ["contrat", "sous-traitance", "sous traitance"]):
        passed.append("Contrat de sous-traitance détecté")
    else:
        failed.append("Contrat sous-traitance: non détecté")

    if contains_any(text, ["responsabilités", "responsabilites", "modalités", "modalites"]):
        passed.append("Responsabilités/modalités détectées")
    else:
        failed.append("Contrat sous-traitance: responsabilités/modalités non détectées")

    return passed, failed


def validate_certificat_ompic(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    passed, failed = [], []

    if "ompic" in text:
        passed.append("OMPIC détecté")
    else:
        failed.append("OMPIC: mention OMPIC non détectée")

    if contains_any(text, ["marque", "enregistrement", "certificat"]):
        passed.append("Certificat/marque détecté")
    else:
        failed.append("OMPIC: certificat de marque non détecté")

    p2, f2 = _simple_signed_stamped_validator(text_raw, yolo_res, "Certificat OMPIC", require_signature=False, require_stamp=True)
    passed.extend(p2)
    failed.extend(f2)
    return passed, failed


def validate_autorisation_exercice(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    passed, failed = [], []

    if contains_any(text, ["autorisation d'exercice", "autorisation d exercice", "autorisation", "authorization", "authorisation", "licence", "permit", "state trade", "regional council"]):
        passed.append("Autorisation d'exercice détectée")
    else:
        failed.append("Autorisation exercice: non détectée")

    if contains_any(text, ["fabricant", "manufacturer", "pays d'origine", "pays d origine", "country of origin", "issued to", "darmstadt"]):
        passed.append("Fabricant/pays d'origine détecté")
    else:
        failed.append("Autorisation exercice: fabricant/pays d'origine non détectés")

    p2, f2 = _simple_signed_stamped_validator(text_raw, yolo_res, "Autorisation d'exercice", require_signature=False, require_stamp=True)
    passed.extend(p2)
    failed.extend(f2)
    return passed, failed


def validate_certificat_bpf(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    passed, failed = [], []

    if contains_any(text, ["iso 22716", "bpf", "gmp", "bonnes pratiques de fabrication"]):
        passed.append("BPF / ISO 22716 détecté")
    else:
        failed.append("BPF: ISO 22716 / BPF non détecté")

    if extract_dates(text_raw):
        passed.append("Date détectée")
    else:
        failed.append("BPF: date non détectée")

    p2, f2 = _simple_signed_stamped_validator(text_raw, yolo_res, "Certificat BPF / ISO 22716", require_signature=False, require_stamp=True)
    passed.extend(p2)
    failed.extend(f2)
    return passed, failed


def validate_declaration_honneur_normes(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    passed, failed = [], []

    if contains_any(text, ["déclaration sur l'honneur", "declaration sur l honneur"]):
        passed.append("Déclaration sur l'honneur détectée")
    else:
        failed.append("Déclaration honneur: non détectée")

    if contains_any(text, ["qualité", "qualite", "sécurité", "securite", "efficacité", "efficacite", "normes internationales"]):
        passed.append("Engagement qualité/sécurité/efficacité détecté")
    else:
        failed.append("Déclaration honneur: engagement qualité/sécurité/efficacité non détecté")

    hints = detect_signature_or_stamp_hint(text_raw)
    if hints["legalisation_hint"] or contains_any(text, ["légalisé", "legalise", "légalisée", "legalisee"]):
        passed.append("Légalisation détectée")
    else:
        failed.append("Déclaration honneur: légalisation non détectée")

    p2, f2 = _simple_signed_stamped_validator(text_raw, yolo_res, "Déclaration honneur")
    passed.extend(p2)
    failed.extend(f2)
    return passed, failed


def validate_fichiers_numerises(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    return ["Fichier électronique reçu"], []


def validate_coop_formulaire(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    passed, failed = [], []

    if contains_any(text, ["formulaire", "déclaration", "declaration"]) and contains_any(text, ["coopérative", "cooperative"]):
        passed.append("Formulaire de déclaration coopérative détecté")
    else:
        failed.append("Formulaire coopérative: non détecté")

    p2, f2 = _simple_signed_stamped_validator(text_raw, yolo_res, "Formulaire coopérative")
    passed.extend(p2)
    failed.extend(f2)
    return passed, failed


def validate_coop_plan_architectural(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    if contains_any(text, ["plan architectural", "plan", "local", "stockage", "fabrication"]) or text == "":
        return ["Plan architectural plausible"], []
    return [], ["Plan architectural: contenu non détecté"]


def validate_coop_liste_personnel(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    if contains_any(text, ["liste du personnel", "poste", "fonction", "employé", "employe"]):
        return ["Liste du personnel détectée"], []
    return [], ["Liste personnel: non détectée"]


def validate_coop_statut(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    passed, failed = [], []

    if contains_any(text, ["statut", "coopérative", "cooperative", "tribunal"]):
        passed.append("Statut coopérative détecté")
    else:
        failed.append("Statut coopérative: non détecté")

    if has_yolo(yolo_res, "stamp") or detect_signature_or_stamp_hint(text_raw)["stamp_hint"]:
        passed.append("Cachet détecté")
    else:
        failed.append("Statut coopérative: cachet non détecté")

    return passed, failed


def validate_coop_pv(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    if contains_any(text, ["assemblée générale", "assemblee generale", "pv", "président", "president", "gérant", "gerant"]):
        return ["PV assemblée générale détecté"], []
    return [], ["PV assemblée générale: non détecté"]


def validate_coop_arrete(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    if contains_any(text, ["arrêté", "arrete", "création", "creation", "tribunal", "dépôt", "depot"]):
        return ["Arrêté/attestation de dépôt détecté"], []
    return [], ["Arrêté/attestation de dépôt: non détecté"]


def validate_renewal_declaration(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    passed, failed = [], []

    if contains_any(text, ["aucune modification", "sans modification"]) and contains_any(text, ["déclaration sur l'honneur", "declaration sur l honneur"]):
        passed.append("Déclaration sans modification détectée")
    else:
        failed.append("Renouvellement: déclaration sans modification non détectée")

    p2, f2 = _simple_signed_stamped_validator(text_raw, yolo_res, "Déclaration renouvellement")
    passed.extend(p2)
    failed.extend(f2)
    return passed, failed


def validate_renewal_certificat(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    if contains_any(clean_text(text_raw), ["certificat d'enregistrement", "certificat d enregistrement"]):
        return ["Certificat d'enregistrement détecté"], []
    return [], ["Renouvellement: certificat d'enregistrement non détecté"]


def validate_declaration_initiale(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    if contains_any(clean_text(text_raw), ["déclaration initiale", "declaration initiale"]):
        return ["Déclaration initiale détectée"], []
    return [], ["Déclaration initiale: non détectée"]


def validate_justificatif_modification(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    if contains_any(text, ["modification", "adresse", "activité", "activite", "représentant", "representant", "fabricant", "étiquetage", "etiquetage"]):
        return ["Justificatif de modification plausible"], []
    return [], ["Justificatif modification: non détecté"]


def validate_script_publicitaire(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    if contains_any(text, ["publicité", "publicite", "promotion", "script", "texte publicitaire"]):
        return ["Script publicitaire détecté"], []
    return [], ["Visa publicité: script non détecté"]


def validate_autorisation_anrac(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    if contains_any(text, ["anrac", "autorisation"]) and contains_any(text, ["activité", "activite", "cannabis", "cbd", "thc"]):
        return ["Autorisation ANRAC détectée"], []
    return [], ["ANRAC: autorisation non détectée"]


def validate_fiche_technique_cannabis(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    if contains_any(text, ["fiche technique"]) and contains_any(text, ["cannabis", "cbd", "thc", "matière première", "matiere premiere"]):
        return ["Fiche technique cannabis détectée"], []
    return [], ["Fiche technique cannabis: non détectée"]


def validate_fds_cannabis(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    if contains_any(text, ["fiche de sécurité", "fiche de securite", "fds"]) and contains_any(text, ["cannabis", "cbd", "thc", "matière première", "matiere premiere"]):
        return ["FDS matière première détectée"], []
    return [], ["FDS cannabis: non détectée"]


def validate_bulletin_analyse_produit_fini(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    passed, failed = [], []

    if contains_any(text, ["bulletin d'analyse", "bulletin d analyse"]) and contains_any(text, ["produit fini", "cbd", "thc"]):
        passed.append("Bulletin analyse produit fini détecté")
    else:
        failed.append("Bulletin produit fini: non détecté")

    if extract_dates(text_raw):
        passed.append("Date détectée")
    else:
        failed.append("Bulletin produit fini: date non détectée")

    p2, f2 = _simple_signed_stamped_validator(text_raw, yolo_res, "Bulletin produit fini")
    passed.extend(p2)
    failed.extend(f2)
    return passed, failed


def validate_bulletin_analyse_extrait(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    if contains_any(text, ["bulletin d'analyse", "bulletin d analyse"]) and contains_any(text, ["extrait", "cannabis", "cbd"]):
        return ["Bulletin analyse extrait cannabis détecté"], []
    return [], ["Bulletin extrait cannabis: non détecté"]


def validate_declaration_thc_zero(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    passed, failed = [], []

    if contains_any(text, ["thc = 0", "thc=0", "absence de thc", "sans thc"]):
        passed.append("Déclaration THC = 0 détectée")
    else:
        failed.append("Déclaration THC 0: non détectée")

    hints = detect_signature_or_stamp_hint(text_raw)
    if hints["legalisation_hint"]:
        passed.append("Légalisation détectée")
    else:
        failed.append("Déclaration THC 0: légalisation non détectée")

    p2, f2 = _simple_signed_stamped_validator(text_raw, yolo_res, "Déclaration THC 0")
    passed.extend(p2)
    failed.extend(f2)
    return passed, failed


def validate_rapport_stabilite(file_path: str, text_raw: str, yolo_res: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    text = clean_text(text_raw)
    if contains_any(text, ["stabilité", "stabilite", "rapport d'étude", "rapport d etude", "protocole", "résultats", "resultats", "conclusion"]):
        return ["Rapport de stabilité plausible"], []
    return [], ["Rapport stabilité: non détecté"]


VALIDATORS = {
    "LETTRE_DEMANDE": validate_lettre_demande,
    "FICHE_SIGNALETIQUE_ANNEXE_C": validate_fiche_signaletique,
    "ATTESTATION_DECLARATION_SOCIETE": validate_attestation_declaration_societe,
    "ATTESTATION_FABRICANT_AUTORISATION_COMMERCIALISATION": validate_attestation_fabricant_autorisation,
    "MAQUETTE_ETIQUETAGE_CONDITIONNEMENT": validate_maquette_conditionnement,
    "PHOTO_EMBALLAGE": validate_photo_emballage,
    "NOTICE_UTILISATION": validate_notice_utilisation,
    "ACCUSE_CAPM_FICHE_SECURITE": validate_accuse_capm,
    "CERTIFICAT_VENTE_LIBRE": validate_certificat_vente_libre,
    "CONTRAT_SOUS_TRAITANCE": validate_contrat_sous_traitance,
    "CERTIFICAT_OMPIC": validate_certificat_ompic,
    "AUTORISATION_EXERCICE_PAYS_ORIGINE": validate_autorisation_exercice,
    "CERTIFICAT_BPF_ISO22716": validate_certificat_bpf,
    "DECLARATION_HONNEUR_NORMES_INTERNATIONALES": validate_declaration_honneur_normes,
    "FICHIERS_NUMERISES": validate_fichiers_numerises,
    "COOP_FORMULAIRE_DECLARATION": validate_coop_formulaire,
    "COOP_PLAN_ARCHITECTURAL": validate_coop_plan_architectural,
    "COOP_LISTE_PERSONNEL": validate_coop_liste_personnel,
    "COOP_STATUT": validate_coop_statut,
    "COOP_PV_ASSEMBLEE_GENERALE": validate_coop_pv,
    "COOP_ARRETE_CREATION_OU_DEPOT": validate_coop_arrete,
    "DECLARATION_HONNEUR_SANS_MODIFICATION": validate_renewal_declaration,
    "COPIE_CERTIFICAT_ENREGISTREMENT_RENOUVELLEMENT": validate_renewal_certificat,
    "DECLARATION_INITIALE": validate_declaration_initiale,
    "JUSTIFICATIF_MODIFICATION": validate_justificatif_modification,
    "SCRIPT_PUBLICITAIRE": validate_script_publicitaire,
    "AUTORISATION_ANRAC": validate_autorisation_anrac,
    "FICHE_TECHNIQUE_MATIERE_PREMIERE_CANNABIS": validate_fiche_technique_cannabis,
    "FDS_MATIERE_PREMIERE": validate_fds_cannabis,
    "BULLETIN_ANALYSE_PRODUIT_FINI": validate_bulletin_analyse_produit_fini,
    "BULLETIN_ANALYSE_EXTRAIT_CANNABIS": validate_bulletin_analyse_extrait,
    "DECLARATION_THC_ZERO": validate_declaration_thc_zero,
    "RAPPORT_STABILITE_PRODUIT_FINI": validate_rapport_stabilite,
}


# ============================================================
# Enhanced document checks
# ============================================================

def _criterion(name: str, status: str, details: str, source: str = "rule") -> Dict[str, Any]:
    return {"name": name, "status": status, "details": details, "source": source}


def _criteria_from_pass_fail(passed: List[str], failed: List[str]) -> List[Dict[str, Any]]:
    out = []
    for p in passed:
        out.append(_criterion(p, "PASS", p))
    for f in failed:
        out.append(_criterion(f, "FAIL", f))
    return out


def _presence_check(value: bool, pass_name: str, fail_name: str, source: str = "derived") -> Dict[str, Any]:
    return _criterion(pass_name if value else fail_name, "PASS" if value else "FAIL", pass_name if value else fail_name, source)


def _document_role_expectations(doc_type: str) -> Dict[str, bool]:
    signature_required = doc_type in {
        "LETTRE_DEMANDE",
        "FICHE_SIGNALETIQUE_ANNEXE_C",
        "ATTESTATION_DECLARATION_SOCIETE",
        "ATTESTATION_FABRICANT_AUTORISATION_COMMERCIALISATION",
        "CERTIFICAT_VENTE_LIBRE",
        "DECLARATION_HONNEUR_NORMES_INTERNATIONALES",
        "DECLARATION_HONNEUR_SANS_MODIFICATION",
        "BULLETIN_ANALYSE_PRODUIT_FINI",
        "DECLARATION_THC_ZERO",
    }
    stamp_required = doc_type in {
        "LETTRE_DEMANDE",
        "FICHE_SIGNALETIQUE_ANNEXE_C",
        "ATTESTATION_DECLARATION_SOCIETE",
        "ATTESTATION_FABRICANT_AUTORISATION_COMMERCIALISATION",
        "ACCUSE_CAPM_FICHE_SECURITE",
        "CERTIFICAT_VENTE_LIBRE",
        "CERTIFICAT_OMPIC",
        "AUTORISATION_EXERCICE_PAYS_ORIGINE",
        "CERTIFICAT_BPF_ISO22716",
        "DECLARATION_HONNEUR_NORMES_INTERNATIONALES",
    }
    return {"signature_required": signature_required, "stamp_required": stamp_required}


def _enhanced_document_checks(
    file_path: str,
    doc_type: str,
    full_text: str,
    yolo_res: Dict[str, Any],
    extracted: Dict[str, Any]
) -> List[Dict[str, Any]]:
    hints = detect_signature_or_stamp_hint(full_text)
    signed = has_yolo(yolo_res, "signature") or hints["signature_hint"]
    stamped = has_yolo(yolo_res, "stamp") or hints["stamp_hint"]
    official_header = has_yolo(yolo_res, "official_header")

    expectations = _document_role_expectations(doc_type)
    checks = []

    if expectations["signature_required"]:
        checks.append(_presence_check(signed, "Signature détectée", "Signature non détectée", "yolo_or_text"))
    else:
        checks.append(_criterion("Signature non obligatoire", "INFO", "Signature non obligatoire pour ce type de document", "policy"))

    if expectations["stamp_required"]:
        checks.append(_presence_check(stamped, "Cachet détecté", "Cachet non détecté", "yolo_or_text"))
    else:
        checks.append(_criterion("Cachet non obligatoire", "INFO", "Cachet non obligatoire pour ce type de document", "policy"))

    if doc_type == "LETTRE_DEMANDE":
        text = clean_text(full_text)
        checks.append(_presence_check(
            contains_any(text, ["directeur de l'ammps", "directeur de l ammps", "monsieur le directeur"]),
            "Destinataire AMMPS détecté",
            "Destinataire AMMPS non détecté",
            "text",
        ))
        checks.append(_presence_check(
            official_header or contains_any(text, ["adresse", "rc", "ice", "société", "societe"]),
            "En-tête officiel détecté",
            "En-tête officiel non détecté",
            "yolo_or_text",
        ))

    if doc_type == "FICHE_SIGNALETIQUE_ANNEXE_C":
        text = clean_text(full_text)
        field_hits = sum(
            1 for k in [
                "marque", "désignation", "designation",
                "présentation", "presentation",
                "fabricant", "importateur",
                "catégorie", "categorie"
            ]
            if k in text
        )
        checks.append(_presence_check(
            field_hits >= 4,
            "Rubriques principales détectées",
            "Rubriques principales incomplètes",
            "text",
        ))
        checks.append(_presence_check(
            bool(extracted.get("product_name")),
            "Nom produit extrait",
            "Nom produit non extrait",
            "entity_extraction",
        ))

    if doc_type == "MAQUETTE_ETIQUETAGE_CONDITIONNEMENT":
        text = clean_text(full_text)
        filename = _safe_basename(file_path)

        multilingual_detected = contains_any(text, [
            "fr", "ar", "en",
            "français", "francais",
            "arabe", "arab",
            "english", "anglais",
            "de", "allemand"
        ])

        maquette_hint_detected = contains_any(text, [
            "maquette", "étiquetage", "etiquetage",
            "conditionnement", "emballage", "packaging",
            "label", "étiquette", "etiquette"
        ]) or contains_any(filename, [
            "maquette", "packaging", "label", "etiquetage", "conditionnement"
        ])

        packaging_content_detected = contains_any(text, [
            "ingredients", "ingrédients", "ingredients:",
            "inci", "composition",
            "lipgloss", "lip gloss", "gloss", "gloss à lèvres",
            "produit", "product",
            "marque", "brand",
            "ml", "g", "fl.oz", "fl oz",
            "barcode", "code barre", "qr", "scan",
            "batch", "lot", "expiry", "exp",
            "cosnova", "essence",
            "made in", "fabriqué", "fabrique",
            "distributed", "distribué", "distribue"
        ])

        checks.append(_presence_check(
            maquette_hint_detected or packaging_content_detected,
            "Maquette / contenu d’étiquetage détecté",
            "Maquette / contenu d’étiquetage non détecté",
            "text_or_filename",
        ))

        checks.append(_presence_check(
            multilingual_detected,
            "Contenu multilingue détecté",
            "Contenu multilingue non détecté",
            "text",
        ))

        checks.append(_presence_check(
            packaging_content_detected,
            "Informations d'étiquetage plausibles détectées",
            "Informations d'étiquetage insuffisantes",
            "text",
        ))

    if doc_type == "PHOTO_EMBALLAGE":
        text = clean_text(full_text)
        filename = _safe_basename(file_path)

        checks.append(_presence_check(
            os.path.splitext(file_path)[1].lower() in [".png", ".jpg", ".jpeg", ".pdf"],
            "Support image/PDF valide",
            "Support image/PDF invalide",
            "file",
        ))
        checks.append(_presence_check(
            contains_any(text, ["recto", "verso", "photo", "emballage", "product", "produit"])
            or "product" in filename
            or "photo" in filename,
            "Photo emballage plausible",
            "Photo emballage non reconnue",
            "text_or_filename",
        ))

    if doc_type == "CERTIFICAT_VENTE_LIBRE":
        text = clean_text(full_text)
        checks.append(_presence_check(
            bool(extract_dates(full_text)),
            "Date détectée",
            "Date non détectée",
            "text",
        ))
        checks.append(_presence_check(
            contains_any(text, ["free sale", "free sales certificate", "vente libre", "freely sold"]),
            "Mention vente libre détectée",
            "Mention vente libre non détectée",
            "text",
        ))

    if doc_type == "ATTESTATION_FABRICANT_AUTORISATION_COMMERCIALISATION":
        text = clean_text(full_text)
        checks.append(_presence_check(
            contains_any(text, [
                "original",
                "certifiée conforme",
                "certifiee conforme",
                "certified true copy"
            ]),
            "Original/copie certifiée conforme détecté",
            "Original/copie certifiée conforme non détecté",
            "text",
        ))

    if doc_type == "AUTORISATION_EXERCICE_PAYS_ORIGINE":
        text = clean_text(full_text)
        checks.append(_presence_check(
            contains_any(text, ["manufacturer", "authorisation", "authorization", "state trade", "regional council", "issued to"]),
            "Autorisation d'exercice du fabricant détectée",
            "Autorisation d'exercice du fabricant non détectée",
            "text",
        ))
        checks.append(_presence_check(
            bool(extract_dates(full_text)),
            "Date détectée",
            "Date non détectée",
            "text",
        ))

    if doc_type == "CERTIFICAT_BPF_ISO22716":
        text = clean_text(full_text)
        checks.append(_presence_check(
            contains_any(text, ["iso 22716", "bpf", "gmp", "good manufacturing"]),
            "Mention BPF / ISO 22716 détectée",
            "Mention BPF / ISO 22716 non détectée",
            "text",
        ))

    if doc_type == "DECLARATION_HONNEUR_NORMES_INTERNATIONALES":
        text = clean_text(full_text)
        checks.append(_presence_check(
            contains_any(text, ["normes internationales", "qualité", "qualite", "sécurité", "securite", "efficacité", "efficacite"]),
            "Engagement qualité/sécurité/efficacité détecté",
            "Engagement qualité/sécurité/efficacité non détecté",
            "text",
        ))
        checks.append(_presence_check(
            hints["legalisation_hint"] or contains_any(text, ["legalisation", "légalis", "legalis"]),
            "Légalisation détectée",
            "Légalisation non détectée",
            "text",
        ))

    if doc_type == "NOTICE_UTILISATION":
        text = clean_text(full_text)
        checks.append(_presence_check(
            contains_any(text, ["utilisation", "instructions", "description", "composition", "conseils"]),
            "Notice d'utilisation plausible",
            "Notice d'utilisation insuffisante",
            "text",
        ))

    if doc_type == "ACCUSE_CAPM_FICHE_SECURITE":
        text = clean_text(full_text)
        checks.append(_presence_check(
            contains_any(text, ["centre antipoison", "capm", "fiche de sécurité", "fiche de securite"]),
            "Accusé CAPM détecté",
            "Accusé CAPM non détecté",
            "text",
        ))

    return checks


def _is_hard_failure(detail: str) -> bool:
    """
    Distinguish critical compliance failures from OCR/extraction uncertainty.

    HARD failures affect document validity.
    SOFT failures are kept as advisory notes only, because OCR may miss dates,
    product names, legalisation words, or certified-copy wording even when the
    document itself is acceptable.
    """
    d = _loose_text(detail)

    hard_patterns = [
        "signature non detect",
        "cachet non detect",
        "stamp non detect",
        "tampon non detect",
        "format non conforme",
        "support image pdf invalide",
        "no validator",
        "validator error",
        "error for doc type",
        "contenu emballage non detect",
        "photo contenu emballage non detect",
    ]

    return any(p in d for p in hard_patterns)


def _downgrade_soft_failures(criteria: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Convert non-critical FAIL criteria into INFO advisory criteria.
    This prevents valid documents from being marked PARTIAL only because OCR
    failed to extract a product name, date, legalisation wording, or consistency text.
    """
    adjusted: List[Dict[str, Any]] = []

    for c in criteria:
        item = dict(c)
        if item.get("status") == "FAIL":
            detail = str(item.get("details") or item.get("name") or "")
            if not _is_hard_failure(detail):
                item["status"] = "INFO"
                item["source"] = f"{item.get('source', 'rule')}_advisory"
                item["advisory"] = True
        adjusted.append(item)

    return adjusted


def _summarize_document_validity(criteria: List[Dict[str, Any]]) -> Dict[str, Any]:
    passed = sum(1 for c in criteria if c["status"] == "PASS")
    failed = sum(1 for c in criteria if c["status"] == "FAIL")
    info = sum(1 for c in criteria if c["status"] == "INFO")

    if failed == 0 and passed > 0:
        final = "VALID"
    elif failed > 0 and passed > 0:
        final = "PARTIAL"
    else:
        final = "INVALID"

    return {"passed": passed, "failed": failed, "info": info, "final_status": final}


# ============================================================
# Per-document processing
# ============================================================

def process_one_document(file_path: str) -> Dict[str, Any]:
    words, boxes, image, full_text = extract_words_boxes(file_path)

    guessed_doc_type, classification_confidence, classification_reason = (
        _guess_doc_type_from_text_and_filename(full_text, file_path)
    )
    doc_type = guessed_doc_type

    yolo_res = yolo_detect_file(
        file_path,
        conf=YOLO_CONF_DEFAULT,
        dpi=PDF_RENDER_DPI
    )

    emb = None
    try:
        emb = generate_layout_embeddings(words, boxes, image)
    except Exception as e:
        print("⚠️ Layout embedding error:", repr(e))

    passed: List[str] = []
    failed: List[str] = []

    if doc_type in VALIDATORS:
        try:
            passed, failed = VALIDATORS[doc_type](file_path, full_text, yolo_res)
        except Exception as e:
            failed = [f"Validator error for doc type {doc_type}: {repr(e)}"]
    else:
        failed = [f"No validator for doc type: {doc_type}"]

    structured_entities = _extract_common_entities(full_text)

    extracted = {
        "dates": extract_dates(full_text),
        "document_number": find_doc_number(full_text),
        "signature_stamp_hints": detect_signature_or_stamp_hint(full_text),
        "structured": structured_entities,
        "yolo_status": yolo_res.get("status") if isinstance(yolo_res, dict) else None,
        "yolo_error": yolo_res.get("error") if isinstance(yolo_res, dict) else None,
        "yolo_weights_path": yolo_res.get("weights_path") if isinstance(yolo_res, dict) else None,
        "yolo_names": yolo_res.get("yolo_names") if isinstance(yolo_res, dict) else None,
        "yolo_detections": yolo_res.get("detections") if isinstance(yolo_res, dict) else {},
    }

    hints = extracted["signature_stamp_hints"]

    signed_detected = has_yolo(yolo_res, "signature") or hints["signature_hint"]
    stamped_detected = has_yolo(yolo_res, "stamp") or hints["stamp_hint"]
    official_header_detected = has_yolo(yolo_res, "official_header")

    criteria_details = []

    # 1. Base validator criteria
    criteria_details.extend(_criteria_from_pass_fail(passed, failed))

    # 2. Enhanced structured criteria
    try:
        criteria_details.extend(
            _enhanced_document_checks(
                file_path,
                doc_type,
                full_text,
                yolo_res,
                structured_entities,
            )
        )
    except Exception as e:
        criteria_details.append(
            _criterion(
                "Enhanced checks error",
                "FAIL",
                f"Enhanced checks error for doc type {doc_type}: {repr(e)}",
                "system",
            )
        )

    # 3. Remove exact duplicate criteria without hiding different checks
    seen = set()
    unique_criteria = []

    for c in criteria_details:
        key = (
            c.get("name", ""),
            c.get("status", ""),
            c.get("details", ""),
            c.get("source", ""),
        )

        if key in seen:
            continue

        seen.add(key)
        unique_criteria.append(c)

    criteria_details = unique_criteria

    # Convert OCR/extraction uncertainty into advisory INFO before scoring/status.
    criteria_details = _downgrade_soft_failures(criteria_details)

    summary = _summarize_document_validity(criteria_details)

    consistency_seed = {
        "company_name": structured_entities.get("company_name", ""),
        "product_name": structured_entities.get("product_name", ""),
        "presentation": structured_entities.get("presentation", ""),
        "brand": structured_entities.get("brand", ""),
        "rc": structured_entities.get("rc", ""),
        "ice": structured_entities.get("ice", ""),
        "email": structured_entities.get("email", ""),
    }

    return {
        "file": os.path.basename(file_path),
        "path": file_path,
        "doc_type": doc_type,
        "doc_label": DOC_LABELS.get(doc_type, doc_type),
        "classification": {
            "doc_type": doc_type,
            "confidence": classification_confidence,
            "reason": classification_reason,
        },
        "signed": signed_detected,
        "stamped": stamped_detected,
        "official_header_detected": official_header_detected,
        "passed_criteria": [
            c["details"] for c in criteria_details if c.get("status") == "PASS"
        ],
        "failed_criteria": [
            c["details"] for c in criteria_details if c.get("status") == "FAIL"
        ],
        "criteria_details": criteria_details,
        "criteria_count": len([
            c for c in criteria_details
            if c.get("status") in ("PASS", "FAIL")
        ]),
        "passed_count": summary["passed"],
        "failed_count": summary["failed"],
        "info_count": summary["info"],
        "document_status": summary["final_status"],
        "extracted_fields": extracted,
        "consistency_seed": consistency_seed,
        "text_preview": full_text[:1200],
        "full_text": full_text,
        "embedding_shape": tuple(emb.shape) if emb is not None else None,
    }

# ============================================================
# Required documents
# ============================================================

def _should_require_cannabis_docs(context: DossierContext, docs: Optional[List[Dict[str, Any]]] = None) -> bool:
    if context.has_cannabis:
        if not docs:
            return True
        corpus = _normalize_text("\n".join(d.get("full_text", "") for d in docs))
        if any(k in corpus for k in ["cannabis", " cbd", "thc", "anrac", "chanvre"]):
            return True
        return False
    if not docs:
        return False
    corpus = _normalize_text("\n".join(d.get("full_text", "") for d in docs))
    return any(k in corpus for k in ["cannabis", " cbd", "thc", "anrac", "chanvre"])


def build_required_documents(context: DossierContext, docs: Optional[List[Dict[str, Any]]] = None, file_count: int = 0) -> Tuple[List[str], List[str]]:
    required: Set[str] = set()
    conditional: Set[str] = set(DOC_RULES["optional"])

    required.update([d for d in DOC_RULES["general_common"] if d != "FICHIERS_NUMERISES"])

    if file_count > 0:
        conditional.add("FICHIERS_NUMERISES")

    if context.entity_type == "cooperative":
        required.update(DOC_RULES["cooperative"])

    for activity in context.activity_types:
        required.update(DOC_RULES["activity_specific"].get(activity, []))

    if context.request_type == "renouvellement":
        required.update(DOC_RULES["renewal"])

    if context.request_type == "modification":
        required.update(DOC_RULES["modification"])

    if context.request_type == "visa-publicite":
        required.update(DOC_RULES["visa_publicite"])

    if _should_require_cannabis_docs(context, docs):
        required.update(DOC_RULES["cannabis"])

    return sorted(required), sorted(conditional)
# ============================================================
# Required documents
# ============================================================
# ============================================================
# Required documents
# ============================================================

def _should_require_cannabis_docs(
    context: DossierContext,
    docs: Optional[List[Dict[str, Any]]] = None
) -> bool:
    cannabis_keywords = ["cannabis", " cbd", "thc", "anrac", "chanvre"]

    if context.has_cannabis:
        if not docs:
            return True

        corpus = _normalize_text("\n".join(d.get("full_text", "") for d in docs))
        return any(k in corpus for k in cannabis_keywords)

    if not docs:
        return False

    corpus = _normalize_text("\n".join(d.get("full_text", "") for d in docs))
    return any(k in corpus for k in cannabis_keywords)


def build_required_documents(
    context: DossierContext,
    docs: Optional[List[Dict[str, Any]]] = None,
    file_count: int = 0
) -> Tuple[List[str], List[str]]:
    required: Set[str] = set()
    conditional: Set[str] = set(DOC_RULES["optional"])

    required.update([
        d for d in DOC_RULES["general_common"]
        if d != "FICHIERS_NUMERISES"
    ])

    if file_count > 0:
        conditional.add("FICHIERS_NUMERISES")

    if context.entity_type == "cooperative":
        required.update(DOC_RULES["cooperative"])

    for activity in (context.activity_types or []):
        required.update(DOC_RULES["activity_specific"].get(activity, []))

    if context.request_type == "renouvellement":
        required.update(DOC_RULES["renewal"])

    if context.request_type == "modification":
        required.update(DOC_RULES["modification"])

    if context.request_type == "visa-publicite":
        required.update(DOC_RULES["visa_publicite"])

    if _should_require_cannabis_docs(context, docs):
        required.update(DOC_RULES["cannabis"])

    return sorted(required), sorted(conditional)

# ============================================================
# Scoring and cross-validation
# ============================================================

def _collect_document_field_variants(docs: List[Dict[str, Any]], key: str) -> Dict[str, List[str]]:
    res: Dict[str, List[str]] = {}
    for d in docs:
        val = _clean_str(d.get("consistency_seed", {}).get(key, ""))
        if val:
            res.setdefault(_normalize_text(val), []).append(d["file"])
    return res


def _normalize_email_for_match(value: str) -> str:
    value = (value or "").lower().strip()
    replacements = {
        " ": "",
        "(at)": "@",
        "[at]": "@",
        "＠": "@",
        "(dot)": ".",
        "[dot]": ".",
        " point ": ".",
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    value = value.replace("..", ".")
    return value


def _token_overlap_match(expected: str, corpus: str, threshold: float = 0.55) -> bool:
    expected_tokens = {t for t in _loose_text(expected).split() if len(t) >= 4}
    corpus_tokens = set(_loose_text(corpus).split())

    if not expected_tokens:
        return False

    overlap = expected_tokens.intersection(corpus_tokens)
    return (len(overlap) / max(len(expected_tokens), 1)) >= threshold


def _address_match(expected: str, corpus: str) -> bool:
    # Address OCR is often noisy; use important-token overlap rather than exact string matching.
    return _token_overlap_match(expected, corpus, threshold=0.45)


def _loose_value_match(expected: str, corpus: str, threshold: float = 0.60) -> bool:
    expected_norm = _normalize_text(expected)
    corpus_norm = _normalize_text(corpus)
    if expected_norm and expected_norm in corpus_norm:
        return True
    return _token_overlap_match(expected, corpus, threshold=threshold)


def cross_validate_submission(submission: SubmissionData, docs: List[Dict[str, Any]]) -> Dict[str, Any]:
    joined_text = "\n".join([d.get("full_text", "") for d in docs])
    joined_norm = _normalize_text(joined_text)
    checks = []

    def add_check(field: str, expected: Any, found: bool, source: str, observed: Any = None):
        checks.append({
            "field": field,
            "expected": expected,
            "observed": observed,
            "found": found,
            "source": source,
            "status": "MATCH" if found else "MISMATCH",
        })

    def _doc_match(key: str, expected: str, digits_only: bool = False) -> Tuple[bool, Any]:
        if not expected:
            return False, ""
        variants = []
        for d in docs:
            val = _clean_str(d.get("consistency_seed", {}).get(key, ""))
            if val:
                variants.append({"file": d["file"], "value": val})

        if digits_only:
            ok = any(_digits_only(v["value"]) == _digits_only(expected) for v in variants) or (_digits_only(expected) in _digits_only(joined_text))
        else:
            ok = any(
                _normalize_text(v["value"]) == _normalize_text(expected)
                or _normalize_text(expected) in _normalize_text(v["value"])
                or _normalize_text(v["value"]) in _normalize_text(expected)
                for v in variants
            ) or (_normalize_text(expected) in joined_norm)

        return ok, variants

    company_name = _clean_str(submission.declarant.company_name)
    if company_name:
        found, observed = _doc_match("company_name", company_name)
        add_check("company_name", company_name, found, "documents_text", observed)

    legal_form = _clean_str(submission.declarant.legal_form)
    if legal_form:
        found_legal_form = _loose_value_match(legal_form, joined_text, threshold=0.50)
        add_check("legal_form", legal_form, found_legal_form, "documents_text_token_overlap", legal_form if found_legal_form else "")

    address = _clean_str(submission.declarant.address)
    if address:
        found_address = _address_match(address, joined_text)
        add_check("declarant_address", address, found_address, "documents_text_token_overlap", address if found_address else "")

    ice = _digits_only(submission.operator_data.ice)
    if ice:
        joined_digits = _digits_only(joined_text)
        found = bool(ice and ice in joined_digits)
        if not found:
            found, observed = _doc_match("ice", submission.operator_data.ice, digits_only=True)
        else:
            observed = ice
        add_check("ice", submission.operator_data.ice, found, "documents_text_digits", observed)

    rc = _clean_str(submission.operator_data.registreCommerce)
    if rc:
        found, observed = _doc_match("rc", rc)
        add_check("registre_commerce", rc, found, "structured_entities", observed)

    email = _clean_str(submission.operator_data.email)
    if email:
        expected_email = _normalize_email_for_match(email)
        joined_email_text = _normalize_email_for_match(joined_text)
        found = bool(expected_email and expected_email in joined_email_text)
        if not found:
            found, observed = _doc_match("email", email)
        else:
            observed = expected_email
        add_check("email", email, found, "documents_text_email_normalized", observed)

    rep_full_name = f"{_clean_str(submission.operator_data.representantPrenom)} {_clean_str(submission.operator_data.representantNom)}".strip()
    if rep_full_name:
        add_check("representant_legal", rep_full_name, _normalize_text(rep_full_name) in joined_norm, "documents_text", rep_full_name if _normalize_text(rep_full_name) in joined_norm else "")

    product_name = _clean_str(submission.product.product_name)
    if product_name:
        found, observed = _doc_match("product_name", product_name)
        add_check("product_name", product_name, found, "documents_text", observed)

    manufacturer_name = _clean_str(submission.product.manufacturer.name)
    if manufacturer_name:
        found_manufacturer = _loose_value_match(manufacturer_name, joined_text, threshold=0.55)
        add_check("manufacturer_name", manufacturer_name, found_manufacturer, "documents_text_token_overlap", manufacturer_name if found_manufacturer else "")

    categorie = _clean_str(submission.product_data.categorie)
    if categorie:
        found_categorie = _loose_value_match(categorie, joined_text, threshold=0.55)
        add_check("categorie", categorie, found_categorie, "documents_text_token_overlap", categorie if found_categorie else "")

    cannabis_keywords_found = any(k in joined_norm for k in ["cannabis", " cbd", "thc", "chanvre", "anrac"])
    if submission.context.has_cannabis:
        add_check("has_cannabis_flag", True, cannabis_keywords_found, "documents_text", "cannabis_keywords" if cannabis_keywords_found else "")

    consistency_checks = []
    for field in ["company_name", "product_name", "presentation", "brand", "rc", "ice"]:
        variants = _collect_document_field_variants(docs, field)
        normalized_variants = [k for k in variants.keys() if k]
        status = "CONSISTENT" if len(normalized_variants) <= 1 else "CONFLICT"
        consistency_checks.append({
            "field": field,
            "status": status,
            "variants": [{"value": k, "files": v} for k, v in variants.items()],
        })

    mismatches = [c for c in checks if c["status"] == "MISMATCH"]
    doc_conflicts = [c for c in consistency_checks if c["status"] == "CONFLICT"]

    matched_checks = len(checks) - len(mismatches)
    submission_score = 100.0 if not checks else round((matched_checks / len(checks)) * 100.0, 2)
    consistency_score = 100.0 if not consistency_checks else round(((len(consistency_checks) - len(doc_conflicts)) / len(consistency_checks)) * 100.0, 2)
    final_cross_score = round((submission_score * 0.7) + (consistency_score * 0.3), 2)

    return {
        "checks": checks,
        "mismatches": mismatches,
        "document_consistency_checks": consistency_checks,
        "document_conflicts": doc_conflicts,
        "cross_validation_score": final_cross_score,
        "submission_match_score": submission_score,
        "document_consistency_score": consistency_score,
    }


def compute_score(
    total_criteria: int,
    total_failed: int,
    missing_required_count: int = 0
) -> Tuple[float, str]:
    """
    Score = conformity of the analysed criteria only.

    Missing required documents are a completeness/status issue, not a numeric
    conformity-score issue. Therefore, if all analysed criteria are PASS,
    the score becomes 100%, even if one required document is still listed
    separately as missing.
    """
    if total_criteria <= 0:
        final_score = 0.0
    else:
        passed_criteria = max(0, total_criteria - total_failed)
        final_score = round(max(0.0, min(100.0, (passed_criteria / total_criteria) * 100.0)), 2)

    if final_score >= 85:
        risk = "LOW"
    elif final_score >= 60:
        risk = "MEDIUM"
    else:
        risk = "HIGH"

    return final_score, risk

# ============================================================
# Main dossier processing
# ============================================================

def _document_inventory_summary(docs: List[Dict[str, Any]], required_docs: List[str], conditional_docs: List[str], file_count: int) -> Dict[str, Any]:
    detected_unique = sorted(set(d["doc_type"] for d in docs))

    required_status = []
    for code in required_docs:
        required_status.append({
            "code": code,
            "label": DOC_LABELS.get(code, code),
            "uploaded": code in detected_unique,
            "files": [d["file"] for d in docs if d["doc_type"] == code],
        })

    conditional_status = []
    for code in conditional_docs:
        uploaded = (code == "FICHIERS_NUMERISES" and file_count > 0) or code in detected_unique
        conditional_status.append({
            "code": code,
            "label": DOC_LABELS.get(code, code),
            "uploaded": uploaded,
            "files": [d["file"] for d in docs if d["doc_type"] == code],
        })

    return {
        "required_documents": required_status,
        "conditional_documents": conditional_status,
        "detected_document_types": detected_unique,
    }


def _aggregate_signature_stamp_stats(docs: List[Dict[str, Any]]) -> Dict[str, Any]:
    return {
        "documents_with_signature": [d["file"] for d in docs if d.get("signed")],
        "documents_without_signature": [d["file"] for d in docs if not d.get("signed")],
        "documents_with_stamp": [d["file"] for d in docs if d.get("stamped")],
        "documents_without_stamp": [d["file"] for d in docs if not d.get("stamped")],
    }


def process_dossier(file_paths: List[str], submission: Optional[SubmissionData] = None) -> Dict[str, Any]:
    if submission is None:
        submission = SubmissionData(context=DossierContext())

    docs: List[Dict[str, Any]] = []
    total_criteria = 0
    total_failed = 0

    # 1. Process each document
    for fp in file_paths:
        try:
            d = process_one_document(fp)
            docs.append(d)

            total_criteria += len([
                c for c in d["criteria_details"]
                if c.get("status") in ("PASS", "FAIL")
            ])

            total_failed += len([
                c for c in d["criteria_details"]
                if c.get("status") == "FAIL"
            ])

        except Exception as e:
            print(f"⚠️ Error processing document {fp}: {repr(e)}")

    # 2. Required documents logic
    required_docs, conditional_docs = build_required_documents(
        submission.context,
        docs=docs,
        file_count=len(file_paths),
    )

    inventory = _document_inventory_summary(
        docs,
        required_docs,
        conditional_docs,
        len(file_paths)
    )

    detected_unique = inventory["detected_document_types"]

    missing_required = [t for t in required_docs if t not in detected_unique]

    missing_conditional = [
        t for t in conditional_docs
        if not (t == "FICHIERS_NUMERISES" and len(file_paths) > 0)
        and t not in detected_unique
    ]

    # 3. Base score (criteria + missing docs)
    base_score, _ = compute_score(
        total_criteria,
        total_failed,
        missing_required_count=len(missing_required)
    )

    # 4. Cross validation
    cross_validation = cross_validate_submission(submission, docs)

    # Cross-validation is advisory only.
    # False mismatches may happen because OCR can miss small text such as addresses, ICE, or emails.
    # We keep mismatches in the report for human review, but we do not reduce the compliance score.
    mismatch_penalty = 0.0
    conflict_penalty = 0.0

    final_score = max(
        0.0,
        round(base_score - mismatch_penalty - conflict_penalty, 2)
    )

    # 5. Risk level
    if final_score >= 85:
        final_risk = "LOW"
    elif final_score >= 60:
        final_risk = "MEDIUM"
    else:
        final_risk = "HIGH"

    # 6. Status logic
    # Do not show the confusing state: all uploaded docs valid + high score + "Dossier incomplet".
    # Missing required docs are still displayed in the report, but the global status is clearer.
    invalid_or_partial_docs = [d for d in docs if d.get("document_status") != "VALID"]

    if not missing_required and not invalid_or_partial_docs and final_score >= 85:
        status = "FORMALLY_COMPLETE"
    elif missing_required and len(missing_required) <= 1 and not invalid_or_partial_docs and final_score >= 85:
        status = "FORMALLY_COMPLETE_WITH_RESERVES"
    elif len(missing_required) <= 2 and final_score >= 70:
        status = "PARTIALLY_COMPLETE"
    else:
        status = "INCOMPLETE"

    # 7. Documents needing re-verification
    reverification = []
    for d in docs:
        if d.get("document_status") != "VALID":
            reverification.append({
                "file": d["file"],
                "doc_type": d["doc_type"],
                "doc_label": d["doc_label"],
                "issues": [
                    c["details"]
                    for c in d["criteria_details"]
                    if c.get("status") == "FAIL"
                ],
                "signature_detected": d.get("signed"),
                "stamp_detected": d.get("stamped"),
            })

    return {
        "dossier_status": status,
        "compliance_score": final_score,
        "risk_level": final_risk,
        "scoring_debug": {
            "total_criteria": total_criteria,
            "total_failed": total_failed,
            "missing_required_count": len(missing_required),
            "conformity_score_before_advisory_checks": base_score,
            "missing_penalty_policy": "No numeric penalty: missing documents affect dossier_status and actions, not conformity score",
            "cross_validation_mismatches": len(cross_validation.get("mismatches", [])),
            "document_conflicts": len(cross_validation.get("document_conflicts", [])),
            "mismatch_penalty_applied": mismatch_penalty,
            "conflict_penalty_applied": conflict_penalty,
            "final_score": final_score,
        },

        "missing_required_documents": missing_required,
        "missing_required_document_labels": [
            DOC_LABELS.get(code, code) for code in missing_required
        ],

        "missing_conditional_documents": missing_conditional,

        "required_documents": inventory["required_documents"],
        "conditional_documents": inventory["conditional_documents"],
        "detected_document_types": detected_unique,

        "documents_to_reverify": reverification,

        "signature_stamp_summary": _aggregate_signature_stamp_stats(docs),

        "cross_validation": cross_validation,
        "submission_context": asdict(submission.context),

        "documents": docs,

        "stats": {
            "total_documents": len(docs),
            "total_criteria": total_criteria,
            "total_failed_criteria": total_failed,
            "cross_validation_mismatches": len(cross_validation.get("mismatches", [])),
            "document_conflicts": len(cross_validation.get("document_conflicts", [])),
            "documents_valid": len([d for d in docs if d.get("document_status") == "VALID"]),
            "documents_partial": len([d for d in docs if d.get("document_status") == "PARTIAL"]),
            "documents_invalid": len([d for d in docs if d.get("document_status") == "INVALID"]),
        },

        "report_summary": {
            "overview": (
                f"{len(docs)} document(s) analysed; "
                f"{len(missing_required)} required document(s) missing; "
                f"{len(reverification)} document(s) need reverification."
            ),
            "detailed_mode": True,
            "cross_validation_enabled": True,
            "signature_detection_enabled": True,
            "stamp_detection_enabled": True,
        },
    }


def process_dossier_from_payload(file_paths: List[str], payload: Dict[str, Any]) -> Dict[str, Any]:
    print("PIPELINE WRAPPER: entered process_dossier_from_payload")
    print("PIPELINE WRAPPER: file_paths =", file_paths)
    print("PIPELINE WRAPPER: building submission data")
    submission = build_submission_data(payload)
    print("PIPELINE WRAPPER: submission data built")
    print("PIPELINE WRAPPER: calling process_dossier")
    result = process_dossier(file_paths, submission=submission)
    print("PIPELINE WRAPPER: process_dossier finished")
    return result


# ============================================================
# Downloadable report generation
# ============================================================

import qrcode

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image as RLImage,
    PageBreak,
)
from reportlab.pdfgen.canvas import Canvas


LOGO_MINISTRY_PATH = os.getenv(
    "AMMPS_LOGO_MINISTRY",
    os.path.join(BASE_DIR, "assets", "logo_ministry.png"),
)

LOGO_AMMPS_PATH = os.getenv(
    "AMMPS_LOGO_AMMPS",
    os.path.join(BASE_DIR, "assets", "logo_ammps.png"),
)

LOGO_RAQIB_PATH = os.getenv(
    "RAQIB_LOGO",
    os.path.join(BASE_DIR, "assets", "raqib_logo.png"),
)

FRONTEND_TRACKING_BASE_URL = os.getenv(
    "FRONTEND_TRACKING_BASE_URL",
    "http://localhost:5173/suivi-dossier",
)


def _safe_slug(value: str) -> str:
    value = re.sub(r"[^A-Za-z0-9._-]+", "_", value or "report")
    value = re.sub(r"_+", "_", value).strip("._")
    return value or "report"


def _report_timestamp() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _logo_cell(path: str, width_mm: float, height_mm: float):
    if path and os.path.exists(path):
        return RLImage(path, width=width_mm * mm, height=height_mm * mm)
    return ""


def _generate_qr_code(dossier_id: str) -> str:
    qr_dir = os.path.join(tempfile.gettempdir(), "raqib_qr_codes")
    os.makedirs(qr_dir, exist_ok=True)

    base = (FRONTEND_TRACKING_BASE_URL or "http://localhost:5173/suivi-dossier").rstrip("/")
    if "{dossier_id}" in base:
        tracking_url = base.replace("{dossier_id}", dossier_id)
    else:
        separator = "&" if "?" in base else "?"
        tracking_url = f"{base}{separator}dossier_id={dossier_id}"
    qr_path = os.path.join(qr_dir, f"qr_{_safe_slug(dossier_id)}.png")

    img = qrcode.make(tracking_url)
    img.save(qr_path)

    return qr_path


def _risk_color(risk: str):
    risk = (risk or "").upper()
    if risk == "LOW":
        return colors.HexColor("#1B7F3A")
    if risk == "MEDIUM":
        return colors.HexColor("#D98200")
    return colors.HexColor("#B42318")


def _status_label(status: str) -> str:
    labels = {
        "INCOMPLETE": "Dossier incomplet",
        "FORMALLY_COMPLETE": "Dossier formellement complet",
        "FORMALLY_COMPLETE_WITH_RESERVES": "Dossier formellement complet avec réserves",
        "FORMAL_ISSUES": "Dossier avec réserves formelles",
        "PROCESSING": "Analyse en cours",
    }
    return labels.get(status, status or "Non déterminé")


def _risk_label(risk: str) -> str:
    labels = {
        "LOW": "Faible",
        "MEDIUM": "Moyen",
        "HIGH": "Élevé",
    }
    return labels.get((risk or "").upper(), risk or "Non déterminé")


def _build_next_steps(result: Dict[str, Any]) -> List[str]:
    steps: List[str] = []

    if result.get("missing_required_document_labels"):
        steps.append("Compléter les documents obligatoires manquants avant toute instruction finale.")

    if result.get("documents_to_reverify"):
        steps.append("Corriger les documents signalés dans la section 'Documents à corriger' puis relancer une analyse.")

    cross_validation = result.get("cross_validation", {})
    if cross_validation.get("mismatches"):
        steps.append("Vérifier la cohérence entre les informations déclarées dans le formulaire et les informations détectées dans les documents.")

    if not steps:
        steps.append("Le dossier ne présente pas d'anomalie formelle majeure à ce stade de l'analyse automatisée.")

    steps.append("Soumettre le dossier corrigé à la validation administrative compétente.")

    return steps


def _concise_report_payload(result: Dict[str, Any]) -> Dict[str, Any]:
    docs_to_reverify = []

    for item in result.get("documents_to_reverify", []):
        docs_to_reverify.append({
            "file": item.get("file", ""),
            "label": item.get("doc_label", item.get("doc_type", "")),
            "issues": item.get("issues", []),
            "signature_detected": bool(item.get("signature_detected")),
            "stamp_detected": bool(item.get("stamp_detected")),
        })

    return {
        "generated_at": _report_timestamp(),
        "dossier_id": result.get("dossier_id", ""),
        "dossier_status": result.get("dossier_status", "UNKNOWN"),
        "dossier_status_label": _status_label(result.get("dossier_status", "UNKNOWN")),
        "compliance_score": result.get("compliance_score", 0),
        "risk_level": result.get("risk_level", "UNKNOWN"),
        "risk_label": _risk_label(result.get("risk_level", "UNKNOWN")),
        "total_documents": result.get("stats", {}).get("total_documents", 0),
        "documents_valid": result.get("stats", {}).get("documents_valid", 0),
        "documents_partial": result.get("stats", {}).get("documents_partial", 0),
        "documents_invalid": result.get("stats", {}).get("documents_invalid", 0),
        "total_criteria": result.get("stats", {}).get("total_criteria", 0),
        "failed_criteria": result.get("stats", {}).get("total_failed_criteria", 0),
        "missing_required_document_labels": result.get("missing_required_document_labels", []),
        "documents_to_reverify": docs_to_reverify,
        "documents": result.get("documents", []),
        "cross_validation": result.get("cross_validation", {}),
        "next_steps": _build_next_steps(result),
    }


def _build_styles():
    styles = getSampleStyleSheet()

    return {
        "title": ParagraphStyle(
            "AdministrativeTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=19,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#0B5D2A"),
            spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "AdministrativeSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#333333"),
        ),
        "section": ParagraphStyle(
            "SectionTitle",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#0B5D2A"),
            spaceBefore=9,
            spaceAfter=6,
            alignment=TA_LEFT,
        ),
        "body": ParagraphStyle(
            "BodyCustom",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor("#1F2933"),
        ),
        "small": ParagraphStyle(
            "SmallCustom",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#555555"),
        ),
        "note": ParagraphStyle(
            "NoteCustom",
            parent=styles["BodyText"],
            fontName="Helvetica-Oblique",
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#666666"),
            alignment=TA_CENTER,
        ),
    }


def _header_footer(canvas: Canvas, doc):
    canvas.saveState()

    width, height = A4

    canvas.setStrokeColor(colors.HexColor("#0B5D2A"))
    canvas.setLineWidth(0.7)
    canvas.line(16 * mm, 13 * mm, width - 16 * mm, 13 * mm)

    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(colors.HexColor("#666666"))
    canvas.drawString(
        16 * mm,
        8 * mm,
        "RAQIB - Rapport généré automatiquement | Document d'aide à l'analyse administrative",
    )
    canvas.drawRightString(
        width - 16 * mm,
        8 * mm,
        f"Page {doc.page}",
    )

    canvas.restoreState()


def _add_administrative_header(story: List[Any], s: Dict[str, ParagraphStyle]) -> None:
    header = Table(
        [[
            _logo_cell(LOGO_MINISTRY_PATH, 48, 18),
            Paragraph(
                "<b>Royaume du Maroc</b><br/>"
                "Ministère de la Santé et de la Protection Sociale<br/>"
                "<b>Agence Marocaine du Médicament et des Produits de Santé</b>",
                s["subtitle"],
            ),
            _logo_cell(LOGO_AMMPS_PATH, 38, 22),
        ]],
        colWidths=[55 * mm, 80 * mm, 55 * mm],
    )

    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, 0), "LEFT"),
        ("ALIGN", (1, 0), (1, 0), "CENTER"),
        ("ALIGN", (2, 0), (2, 0), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))

    story.append(header)

    line = Table([[""]], colWidths=[190 * mm], rowHeights=[1.2 * mm])
    line.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0B5D2A")),
    ]))
    story.append(line)
    story.append(Spacer(1, 8))

    story.append(Paragraph("RAPPORT D'ANALYSE ADMINISTRATIVE DU DOSSIER", s["title"]))
    story.append(Paragraph("Analyse automatisée de conformité documentaire - Plateforme RAQIB", s["subtitle"]))
    story.append(Spacer(1, 6))

    if os.path.exists(LOGO_RAQIB_PATH):
        raqib_table = Table(
            [[_logo_cell(LOGO_RAQIB_PATH, 42, 42)]],
            colWidths=[190 * mm],
        )
        raqib_table.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))
        story.append(raqib_table)
        story.append(Spacer(1, 5))


def _add_decision_box(story: List[Any], payload: Dict[str, Any], s: Dict[str, ParagraphStyle]) -> None:
    risk_color = _risk_color(payload.get("risk_level"))

    decision_data = [
        [
            Paragraph("<b>Statut global</b>", s["body"]),
            Paragraph(payload.get("dossier_status_label", "-"), s["body"]),
            Paragraph("<b>Score de conformité</b>", s["body"]),
            Paragraph(f"{payload.get('compliance_score', 0)}%", s["body"]),
        ],
        [
            Paragraph("<b>Niveau de risque</b>", s["body"]),
            Paragraph(payload.get("risk_label", "-"), s["body"]),
            Paragraph("<b>ID du dossier</b>", s["body"]),
            Paragraph(payload.get("dossier_id") or "-", s["body"]),
        ],
        [
            Paragraph("<b>Date de génération</b>", s["body"]),
            Paragraph(payload.get("generated_at", "-"), s["body"]),
            Paragraph("<b>Documents analysés</b>", s["body"]),
            Paragraph(str(payload.get("total_documents", 0)), s["body"]),
        ],
    ]

    table = Table(decision_data, colWidths=[38 * mm, 57 * mm, 38 * mm, 57 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F4F8F5")),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E6F1EA")),
        ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#E6F1EA")),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#0B5D2A")),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#B8CFC0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (1, 1), (1, 1), 2, risk_color),
    ]))

    story.append(Paragraph("Décision globale", s["section"]))
    story.append(table)

    dossier_id = payload.get("dossier_id")

    if dossier_id:
        qr_path = _generate_qr_code(dossier_id)

        qr_table = Table(
            [[
                Paragraph(
                    "<b>Suivi du dossier</b><br/>"
                    "Scannez ce QR code pour accéder à l'état d'avancement du dossier.",
                    s["body"],
                ),
                RLImage(qr_path, width=28 * mm, height=28 * mm),
            ]],
            colWidths=[145 * mm, 45 * mm],
        )

        qr_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAF8")),
            ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#B8CFC0")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (1, 0), (1, 0), "CENTER"),
            ("PADDING", (0, 0), (-1, -1), 7),
        ]))

        story.append(Spacer(1, 6))
        story.append(qr_table)

    story.append(Spacer(1, 8))


def _add_summary(story: List[Any], payload: Dict[str, Any], s: Dict[str, ParagraphStyle]) -> None:
    story.append(Paragraph("Synthèse administrative", s["section"]))

    overview = (
        f"Le dossier contient <b>{payload['total_documents']}</b> document(s) analysé(s). "
        f"<b>{payload['documents_valid']}</b> document(s) sont valides, "
        f"<b>{payload['documents_partial']}</b> partiellement conformes et "
        f"<b>{payload['documents_invalid']}</b> non conformes. "
        f"L'analyse a vérifié <b>{payload['total_criteria']}</b> critère(s), "
        f"dont <b>{payload['failed_criteria']}</b> critère(s) nécessitent une attention particulière."
    )

    story.append(Paragraph(overview, s["body"]))
    story.append(Spacer(1, 6))


def _add_missing_documents(story: List[Any], payload: Dict[str, Any], s: Dict[str, ParagraphStyle]) -> None:
    story.append(Paragraph("Documents obligatoires manquants", s["section"]))

    missing = payload.get("missing_required_document_labels", [])

    if not missing:
        story.append(Paragraph("Aucun document obligatoire manquant n'a été détecté.", s["body"]))
        story.append(Spacer(1, 6))
        return

    rows = [[Paragraph("<b>Document manquant</b>", s["body"]), Paragraph("<b>Action attendue</b>", s["body"])]]

    for label in missing:
        rows.append([
            Paragraph(label, s["body"]),
            Paragraph("Ajouter ce document au dossier avant la validation finale.", s["body"]),
        ])

    table = Table(rows, colWidths=[85 * mm, 105 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#B42318")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D0D5DD")),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#FFF5F5")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))

    story.append(table)
    story.append(Spacer(1, 6))


def _issue_action(issue: str) -> str:
    issue_low = (issue or "").lower()

    if "signature" in issue_low:
        return "Ajouter ou rendre visible la signature autorisée."
    if "cachet" in issue_low or "stamp" in issue_low:
        return "Ajouter ou rendre visible le cachet officiel."
    if "date" in issue_low:
        return "Ajouter une date lisible au format jj/mm/aaaa."
    if "non détecté" in issue_low or "non detecte" in issue_low:
        return "Vérifier la présence de l'élément exigé dans le document."
    if "rubrique" in issue_low or "incompl" in issue_low:
        return "Compléter les champs ou rubriques obligatoires."
    return "Corriger l'élément signalé puis relancer l'analyse."


def _add_documents_to_correct(story: List[Any], payload: Dict[str, Any], s: Dict[str, ParagraphStyle]) -> None:
    story.append(Paragraph("Documents à corriger ou à revérifier", s["section"]))

    items = payload.get("documents_to_reverify", [])

    if not items:
        story.append(Paragraph("Aucun document ne nécessite une revérification immédiate.", s["body"]))
        story.append(Spacer(1, 6))
        return

    rows = [[
        Paragraph("<b>Document</b>", s["body"]),
        Paragraph("<b>Critère échoué</b>", s["body"]),
        Paragraph("<b>Action recommandée</b>", s["body"]),
        Paragraph("<b>Signature</b>", s["body"]),
        Paragraph("<b>Cachet</b>", s["body"]),
    ]]

    for item in items:
        issues = item.get("issues", []) or ["Vérification recommandée"]
        first = True

        for issue in issues:
            rows.append([
                Paragraph(item.get("label") or item.get("file", "-") if first else "", s["body"]),
                Paragraph(issue, s["body"]),
                Paragraph(_issue_action(issue), s["body"]),
                Paragraph("Oui" if item.get("signature_detected") else "Non", s["body"]),
                Paragraph("Oui" if item.get("stamp_detected") else "Non", s["body"]),
            ])
            first = False

    table = Table(rows, colWidths=[45 * mm, 55 * mm, 58 * mm, 16 * mm, 16 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B5D2A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D0D5DD")),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#FBFDFB")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))

    story.append(table)
    story.append(Spacer(1, 6))


def _add_cross_validation(story: List[Any], payload: Dict[str, Any], s: Dict[str, ParagraphStyle]) -> None:
    cross = payload.get("cross_validation", {}) or {}
    mismatches = cross.get("mismatches", []) or []

    story.append(Paragraph("Contrôle de cohérence des informations déclarées", s["section"]))

    if not mismatches:
        story.append(Paragraph("Aucune incohérence majeure n'a été détectée entre les données déclarées et les documents analysés.", s["body"]))
        story.append(Spacer(1, 6))
        return

    rows = [[
        Paragraph("<b>Champ</b>", s["body"]),
        Paragraph("<b>Valeur déclarée</b>", s["body"]),
        Paragraph("<b>Observation</b>", s["body"]),
    ]]

    for item in mismatches[:10]:
        rows.append([
            Paragraph(str(item.get("field", "-")), s["body"]),
            Paragraph(str(item.get("expected", "-")), s["body"]),
            Paragraph("Valeur non retrouvée ou incohérente dans les documents analysés.", s["body"]),
        ])

    table = Table(rows, colWidths=[45 * mm, 70 * mm, 75 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#D98200")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D0D5DD")),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#FFF8E6")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))

    story.append(table)
    story.append(Spacer(1, 6))


def _add_detailed_document_analysis(story: List[Any], payload: Dict[str, Any], s: Dict[str, ParagraphStyle]) -> None:
    story.append(Paragraph("Analyse détaillée par document", s["section"]))

    documents = payload.get("documents", [])

    if not documents:
        story.append(Paragraph("Aucun document détaillé disponible.", s["body"]))
        return

    for doc in documents:
        doc_title = doc.get("doc_label") or doc.get("doc_type") or "Document"
        file_name = doc.get("file", "-")
        status = doc.get("document_status", "-")
        confidence = doc.get("classification", {}).get("confidence", 0)

        title_table = Table(
            [[
                Paragraph(f"<b>{doc_title}</b><br/><font size='7'>{file_name}</font>", s["body"]),
                Paragraph(f"<b>Statut :</b> {status}<br/><b>Confiance :</b> {round(confidence * 100, 1)}%", s["body"]),
            ]],
            colWidths=[125 * mm, 65 * mm],
        )
        title_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EAF4EF")),
            ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#0B5D2A")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(title_table)

        criteria = doc.get("criteria_details", [])
        rows = [[
            Paragraph("<b>Résultat</b>", s["body"]),
            Paragraph("<b>Critère contrôlé</b>", s["body"]),
            Paragraph("<b>Source</b>", s["body"]),
        ]]

        for c in criteria[:12]:
            status_c = c.get("status", "")
            symbol = "OK" if status_c == "PASS" else ("INFO" if status_c == "INFO" else "À revoir")
            rows.append([
                Paragraph(symbol, s["body"]),
                Paragraph(c.get("details", c.get("name", "")), s["body"]),
                Paragraph(c.get("source", "-"), s["small"]),
            ])

        table = Table(rows, colWidths=[24 * mm, 126 * mm, 40 * mm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#344E41")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#D0D5DD")),
            ("BACKGROUND", (0, 1), (-1, -1), colors.white),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("PADDING", (0, 0), (-1, -1), 4),
        ]))

        story.append(table)
        story.append(Spacer(1, 7))


def _add_recommendations(story: List[Any], payload: Dict[str, Any], s: Dict[str, ParagraphStyle]) -> None:
    story.append(Paragraph("Actions recommandées", s["section"]))

    for step in payload.get("next_steps", []):
        story.append(Paragraph(f"- {step}", s["body"]))

    story.append(Spacer(1, 8))


def _add_final_note(story: List[Any], s: Dict[str, ParagraphStyle]) -> None:
    story.append(Spacer(1, 8))

    note = (
        "Ce rapport est généré automatiquement par la plateforme RAQIB. "
        "Il constitue un outil d'aide à l'analyse administrative et ne remplace pas "
        "la décision réglementaire finale de l'autorité compétente."
    )

    table = Table([[Paragraph(note, s["note"])]], colWidths=[190 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F2F4F7")),
        ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#D0D5DD")),
        ("PADDING", (0, 0), (-1, -1), 7),
    ]))

    story.append(table)


def _build_pdf_story(payload: Dict[str, Any]) -> List[Any]:
    s = _build_styles()
    story: List[Any] = []

    _add_administrative_header(story, s)
    _add_decision_box(story, payload, s)
    _add_summary(story, payload, s)
    _add_missing_documents(story, payload, s)
    _add_documents_to_correct(story, payload, s)
    _add_cross_validation(story, payload, s)
    _add_recommendations(story, payload, s)

    story.append(PageBreak())

    _add_detailed_document_analysis(story, payload, s)
    _add_final_note(story, s)

    return story


def build_formal_pdf_report(result: Dict[str, Any], output_pdf_path: str) -> None:
    payload = _concise_report_payload(result)

    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=A4,
        rightMargin=10 * mm,
        leftMargin=10 * mm,
        topMargin=12 * mm,
        bottomMargin=18 * mm,
        title="Rapport d'analyse RAQIB",
    )

    story = _build_pdf_story(payload)

    doc.build(
        story,
        onFirstPage=_header_footer,
        onLaterPages=_header_footer,
    )


def export_dossier_report(
    result: Dict[str, Any],
    output_dir: Optional[str] = None,
    base_filename: str = "dossier_report",
) -> Dict[str, str]:
    output_dir = output_dir or os.path.join(tempfile.gettempdir(), "ammps_reports")
    os.makedirs(output_dir, exist_ok=True)

    slug = _safe_slug(base_filename)
    pdf_path = os.path.join(output_dir, f"{slug}.pdf")

    build_formal_pdf_report(result, pdf_path)

    return {"pdf": pdf_path}


def process_dossier_with_downloadable_report(
    file_paths: List[str],
    submission: Optional[SubmissionData] = None,
    output_dir: Optional[str] = None,
    base_filename: str = "dossier_report",
) -> Dict[str, Any]:
    result = process_dossier(file_paths, submission=submission)

    exported = export_dossier_report(
        result,
        output_dir=output_dir,
        base_filename=base_filename,
    )

    result["downloadable_report_files"] = exported
    result["downloadable_report_enabled"] = True

    return result


def process_dossier_from_payload_with_downloadable_report(
    file_paths: List[str],
    payload: Dict[str, Any],
    output_dir: Optional[str] = None,
    base_filename: str = "dossier_report",
) -> Dict[str, Any]:
    submission = build_submission_data(payload)

    return process_dossier_with_downloadable_report(
        file_paths,
        submission=submission,
        output_dir=output_dir,
        base_filename=base_filename,
    )