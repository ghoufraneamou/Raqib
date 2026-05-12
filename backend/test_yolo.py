import os
from ultralytics import YOLO

weights_path = r"C:\Users\HP\Desktop\cdg_incept\aui_report\the code\backend\weights\best.pt"

print("Exists:", os.path.exists(weights_path))

if os.path.exists(weights_path):
    print("Size:", os.path.getsize(weights_path), "bytes")

try:
    model = YOLO(weights_path)
    print("✅ YOLO model loaded successfully")
    print("Classes:", model.names)

except Exception as e:
    print("❌ LOAD ERROR:", repr(e))