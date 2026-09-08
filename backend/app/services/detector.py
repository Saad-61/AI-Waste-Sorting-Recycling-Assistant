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

        raw_detections = []

        # 1. Global standard pass at native 640px
        results_global = self.model.predict(
            source=image,
            conf=settings.CONFIDENCE_THRESHOLD,
            iou=0.40,
            imgsz=640,
            agnostic_nms=True,
            device=settings.DEVICE,
            verbose=False
        )
        if len(results_global) > 0 and len(results_global[0].boxes) > 0:
            for box in results_global[0].boxes:
                coords = box.xyxy[0].cpu().numpy().astype(int).tolist()
                confidence = float(box.conf[0].cpu().numpy())
                cls_id = int(box.cls[0].cpu().numpy())
                label = self.model.names[cls_id] if hasattr(self.model, "names") else f"class_{cls_id}"

                box_w = max(0, coords[2] - coords[0])
                box_h = max(0, coords[3] - coords[1])
                box_area_ratio = (box_w * box_h) / max(total_image_area, 1.0)
                if box_area_ratio > 0.95 and confidence < 0.35:
                    continue

                raw_detections.append({
                    "bbox": coords,
                    "confidence": round(confidence, 3),
                    "class_id": cls_id,
                    "label": label
                })

        # 2. Lightweight SAHI (4 strategic quadrant tiles) for high-resolution images (>950px)
        if max(h, w) > 950:
            tile_size = 640
            # 4 quadrant positions: top-left, top-right, bottom-left, bottom-right
            quadrants = [
                (0, 0),
                (0, max(0, w - tile_size)),
                (max(0, h - tile_size), 0),
                (max(0, h - tile_size), max(0, w - tile_size))
            ]

            for y_start, x_start in set(quadrants):
                y_end = min(h, y_start + tile_size)
                x_end = min(w, x_start + tile_size)
                tile = image[y_start:y_end, x_start:x_end]

                if tile.shape[0] < 300 or tile.shape[1] < 300:
                    continue

                tile_res = self.model.predict(
                    source=tile,
                    conf=0.28,           # Slightly higher confidence floor for tile crops to reject asphalt/gravel noise
                    iou=0.40,
                    imgsz=640,
                    agnostic_nms=True,
                    device=settings.DEVICE,
                    verbose=False
                )

                if len(tile_res) > 0 and len(tile_res[0].boxes) > 0:
                    for box in tile_res[0].boxes:
                        coords = box.xyxy[0].cpu().numpy().astype(int).tolist()
                        conf = float(box.conf[0].cpu().numpy())
                        cls_id = int(box.cls[0].cpu().numpy())
                        label = self.model.names[cls_id] if hasattr(self.model, "names") else f"class_{cls_id}"

                        bw = max(0, coords[2] - coords[0])
                        bh = max(0, coords[3] - coords[1])
                        # Reject giant full-tile fills and tiny noisy specks
                        if (bw * bh) > (tile_size * tile_size * 0.85) or (bw < 24 and bh < 24):
                            continue

                        global_coords = [
                            coords[0] + x_start,
                            coords[1] + y_start,
                            coords[2] + x_start,
                            coords[3] + y_start
                        ]

                        raw_detections.append({
                            "bbox": global_coords,
                            "confidence": round(conf, 3),
                            "class_id": cls_id,
                            "label": label
                        })

        # 3. Filter tiny noisy specks & isolated human fingers
        filtered_detections = []
        for det in raw_detections:
            b = det["bbox"]
            bw = max(0, b[2] - b[0])
            bh = max(0, b[3] - b[1])

            # Filter tiny gravel/asphalt speck hallucinations (<22px) unless confidence is high
            if (bw < 22 or bh < 22) and det["confidence"] < 0.65:
                continue

            crop = image[max(0, b[1]):min(h, b[3]), max(0, b[0]):min(w, b[2])]
            lbl = det["label"].lower()
            is_waste_keyword = any(k in lbl for k in ["metal", "can", "bottle", "glass", "cardboard"])

            # If isolated bare skin without strong waste detection, discard
            if self._is_human_skin(crop) and not (is_waste_keyword and det["confidence"] >= 0.55):
                continue

            filtered_detections.append(det)

        # 4. Cross-class IoU deduplication
        deduped = self._deduplicate_detections(filtered_detections, iou_thresh=0.40)

        # 5. Containment suppression (IoS - Intersection over Smaller)
        # Suppresses redundant sub-part boxes (e.g. pop tab or rim inside a metal can)
        detections = self._suppress_nested_boxes(deduped, ios_thresh=0.68)
        return detections

    @staticmethod
    def _is_human_skin(crop: np.ndarray) -> bool:
        """Robust biometric skin tone detector to prevent human hands/fingers from being boxed as waste"""
        if crop is None or crop.size < 300:
            return False
        try:
            import cv2
            hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
            ycrcb = cv2.cvtColor(crop, cv2.COLOR_BGR2YCrCb)

            h, s, v = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
            hsv_mask = ((h <= 25) | (h >= 170)) & (s >= 30) & (s <= 210) & (v >= 60)

            cr = ycrcb[:, :, 1]
            cb = ycrcb[:, :, 2]
            ycrcb_mask = (cr >= 135) & (cr <= 175) & (cb >= 85) & (cb <= 125)

            skin_mask = hsv_mask & ycrcb_mask
            skin_ratio = np.count_nonzero(skin_mask) / float(crop.shape[0] * crop.shape[1])
            return skin_ratio > 0.58
        except Exception:
            return False

    @staticmethod
    def _suppress_nested_boxes(detections, ios_thresh=0.68):
        """
        Suppresses sub-part boxes that are largely enclosed inside a parent container box.
        Example: Prevents redundant pop-tabs, lids, or rim boxes from being drawn on top of cans.
        """
        if len(detections) <= 1:
            return detections

        # Sort by bounding box area descending (largest boxes first)
        sorted_by_area = sorted(
            detections,
            key=lambda d: max(0, d["bbox"][2] - d["bbox"][0]) * max(0, d["bbox"][3] - d["bbox"][1]),
            reverse=True
        )

        kept = []
        for det in sorted_by_area:
            b1 = det["bbox"]
            area1 = max(0, b1[2] - b1[0]) * max(0, b1[3] - b1[1])
            if area1 <= 0:
                continue

            is_nested = False
            for parent in kept:
                b2 = parent["bbox"]
                area2 = max(0, b2[2] - b2[0]) * max(0, b2[3] - b2[1])

                # Calculate intersection area
                x1 = max(b1[0], b2[0])
                y1 = max(b1[1], b2[1])
                x2 = min(b1[2], b2[2])
                y2 = min(b1[3], b2[3])
                inter = max(0, x2 - x1) * max(0, y2 - y1)

                # IoS: How much of the smaller box (b1) is inside the parent box (b2)?
                ios = inter / float(area1)
                if ios >= ios_thresh:
                    # Box b1 is inside parent container b2 (e.g. pop tab inside can)
                    is_nested = True
                    break

            if not is_nested:
                kept.append(det)

        # Restore confidence-descending ordering
        return sorted(kept, key=lambda d: d["confidence"], reverse=True)

    @staticmethod
    def _deduplicate_detections(detections, iou_thresh=0.40):
        """Cross-class non-maximum suppression ensuring no duplicate boxes on single items"""
        if not detections:
            return []
        sorted_dets = sorted(detections, key=lambda d: d["confidence"], reverse=True)
        kept = []
        for det in sorted_dets:
            b1 = det["bbox"]
            overlap = False
            for k in kept:
                b2 = k["bbox"]
                x1 = max(b1[0], b2[0])
                y1 = max(b1[1], b2[1])
                x2 = min(b1[2], b2[2])
                y2 = min(b1[3], b2[3])
                inter = max(0, x2 - x1) * max(0, y2 - y1)
                a1 = max(0, b1[2] - b1[0]) * max(0, b1[3] - b1[1])
                a2 = max(0, b2[2] - b2[0]) * max(0, b2[3] - b2[1])
                union = a1 + a2 - inter
                iou = inter / union if union > 0 else 0.0
                if iou > iou_thresh:
                    overlap = True
                    break
            if not overlap:
                kept.append(det)
        return kept
