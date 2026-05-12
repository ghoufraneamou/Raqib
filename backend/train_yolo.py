"""
Entraîne YOLOv8 sur stamps_signature_docs (signature + stamp) et copie best.pt vers backend/weights/.
Usage (depuis la racine du repo) :
  cd backend && source .venv/bin/activate && python train_yolo.py
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_ROOT = ROOT / "stamps_signature_docs.v1i.yolov8"
WEIGHTS_DIR = Path(__file__).resolve().parent / "weights"
WEIGHTS_OUT = WEIGHTS_DIR / "best.pt"


def write_resolved_data_yaml() -> Path:
    """Ultralytics résout 'path' par rapport au CWD si relatif — on force le chemin absolu."""
    if not (DATA_ROOT / "train" / "images").is_dir():
        raise FileNotFoundError(f"Dataset introuvable : {DATA_ROOT / 'train' / 'images'}")

    resolved = Path(__file__).resolve().parent / "dataset_yolo.yaml"
    root_posix = DATA_ROOT.as_posix()
    resolved.write_text(
        f"""path: {root_posix}
train: train/images
val: valid/images
test: valid/images
nc: 2
names:
  0: signature
  1: stamp
""",
        encoding="utf-8",
    )
    return resolved


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=35)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument("--model", type=str, default="yolov8n.pt", help="yolov8n.pt (rapide) ou yolov8s.pt")
    parser.add_argument(
        "--device",
        type=str,
        default="cpu",
        help="cpu recommandé (MPS + Ultralytics peut crasher au backward). Ex. : mps, cuda:0",
    )
    args = parser.parse_args()

    import torch
    from ultralytics import YOLO

    try:
        data_yaml = write_resolved_data_yaml()
    except FileNotFoundError as e:
        print(e, file=sys.stderr)
        sys.exit(1)

    device = args.device
    if not device:
        device = "cpu"
    if device == "mps" and torch.backends.mps.is_available():
        train_kw_amp = False
    else:
        train_kw_amp = None
    print("Device:", device)
    print("data:", data_yaml)

    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

    model = YOLO(args.model)
    train_kw: dict = dict(
        data=str(data_yaml),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        patience=12,
        project=str(ROOT / "yolo_runs"),
        name="stamp_signature",
        exist_ok=True,
        device=device,
        verbose=True,
    )
    if train_kw_amp is False:
        train_kw["amp"] = False
    results = model.train(**train_kw)

    save_dir = Path(results.save_dir)
    best = save_dir / "weights" / "best.pt"
    if not best.is_file():
        print("best.pt introuvable sous", save_dir, file=sys.stderr)
        sys.exit(1)

    shutil.copy2(best, WEIGHTS_OUT)
    print("Poids copiés vers", WEIGHTS_OUT)


if __name__ == "__main__":
    main()
