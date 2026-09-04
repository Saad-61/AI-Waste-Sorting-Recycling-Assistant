import os
from pathlib import Path
from typing import List, Dict, Any
import numpy as np

from app.config import settings

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None


class WasteDetector:
    """YOLO-based waste detector for locating recyclable and waste objects"""

    def __init__(self, weights_path: Path = settings.YOLO_WEIGHTS_PATH):
        self.weights_path = weights_path
        self.model = None
        self._load_model()

    def _load_model(self):
        """Loads trained YOLO model or falls back gracefully"""
        if YOLO is None:
            print("[WasteDetector] Ultralytics not installed. Running in mock mode.")
            return

        if self.weights_path and os.path.exists(self.weights_path):
            print(f"[WasteDetector] Loading weights from {self.weights_path}")
            self.model = YOLO(str(self.weights_path))
        else:
            print(f"[WasteDetector] Custom weights not found at {self.weights_path}. Initializing default detector.")
            try:
                # Use default yolov8n as placeholder until custom training completes
                self.model = YOLO("yolov8n.pt")
            except Exception as e:
                print(f"[WasteDetector] Notice: Could not load default YOLO weights ({e}). Running in placeholder mode.")

    def detect(self, image: np.ndarray, conf: float = settings.CONFIDENCE_THRESHOLD) -> List[Dict[str, Any]]:
        """
        Runs object detection on input image.
        Returns list of detections with format:
        [
            {
                "bbox": [x1, y1, x2, y2],
                "confidence": float,
                "class_id": int,
                "label": str
            }
        ]
        """
        if self.model is None:
            # Fallback mock detector for initial testing prior to training
            h, w, _ = image.shape
            return [
                {
                    "bbox": [int(w * 0.2), int(h * 0.2), int(w * 0.8), int(h * 0.8)],
                    "confidence": 0.89,
                    "class_id": 0,
                    "label": "plastic_bottle"
                }
            ]

        h, w, _ = image.shape
        total_image_area = float(h * w)

        # Run YOLO inference
        results = self.model.predict(
            source=image,
            conf=0.32,          # Raised from 0.28 — filters more spurious leaf/texture noise
            iou=0.45,
            imgsz=1024,         # High-resolution inference for fine-grained detection
            agnostic_nms=False, # Standard NMS allows adjacent objects of same class
            device=settings.DEVICE,
            verbose=False
        )

        detections = []
        if len(results) > 0:
            boxes = results[0].boxes
            for box in boxes:
                coords = box.xyxy[0].cpu().numpy().astype(int).tolist()
                confidence = float(box.conf[0].cpu().numpy())
                cls_id = int(box.cls[0].cpu().numpy())
                label = self.model.names[cls_id] if hasattr(self.model, "names") else f"class_{cls_id}"

                # Calculate box area ratio
                box_w = max(0, coords[2] - coords[0])
                box_h = max(0, coords[3] - coords[1])
                box_area_ratio = (box_w * box_h) / max(total_image_area, 1.0)

                # Filter out giant background hallucinations (e.g. handrails, walls) unless confidence is high
                if box_area_ratio > 0.55 and confidence < 0.70:
                    continue

                detections.append({
                    "bbox": coords,
                    "confidence": round(confidence, 3),
                    "class_id": cls_id,
                    "label": label
                })

        return detections
