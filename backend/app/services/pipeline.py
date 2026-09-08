import time
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np

from app.config import settings
from app.services.detector import WasteDetector
from app.services.classifier import WasteClassifier
from app.services.explainability import ExplainabilityService
from app.services.decision_engine import DecisionEngine
from app.utils.image_processing import draw_detections, cv2_to_base64


class InferencePipeline:
    """Orchestrates detection, classification, Grad-CAM XAI, and rule-based decision engine"""

    def __init__(
        self,
        detector_weights_path: Optional[Path] = None,
        classifier_weights_path: Optional[Path] = None,
        name: str = "v2.0",
        description: str = "YOLOv8m + EfficientNet-B2 (Deep Precision)"
    ):
        self.name = name
        self.description = description
        self.detector = WasteDetector(weights_path=detector_weights_path or settings.YOLO_WEIGHTS_PATH)
        self.classifier = WasteClassifier(weights_path=classifier_weights_path or settings.CLASSIFIER_WEIGHTS_PATH)
        self.explainability = ExplainabilityService()
        self.decision_engine = DecisionEngine()

    def process_image(self, image: np.ndarray, filename: str = "upload.jpg") -> Dict[str, Any]:
        """
        End-to-end inference pipeline:
        1. YOLO Waste Detection  → bounding boxes
        2. CNN Crop Classification → material label + confidence
        3. Grad-CAM Explainability → saliency heatmap
        4. Decision Engine  → bin + disposal instructions
        5. Visual Annotation → annotated image
        """
        start_time = time.time()
        h, w, _ = image.shape

        # ── Step 1: Object Detection ──────────────────────────────────────────
        raw_detections = self.detector.detect(image)

        processed_items: List[Dict[str, Any]] = []
        item_count = 0

        for det in raw_detections:
            x1, y1, x2, y2 = det["bbox"]
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)

            crop = image[y1:y2, x1:x2]
            if crop.size == 0:
                continue

            # ── Minimum box size guard ────────────────────────────────────────
            # Tiny boxes (< 20×20 px) are almost always noise or leaf-edge artefacts
            crop_h, crop_w = crop.shape[:2]
            if crop_h < 20 or crop_w < 20:
                continue

            # ── Step 2: Classification ────────────────────────────────────────
            classification = self.classifier.classify_crop(
                crop,
                detected_label=det["label"],
                detector_confidence=det["confidence"]
            )

            # Two-tier false-positive filter: discard background clutter
            # Tier A: drop only if generic non-specific label or very low detector confidence
            lbl_lower = det["label"].lower()
            is_specific_waste = any(k in lbl_lower for k in ["plastic", "glass", "metal", "paper", "cardboard", "can", "bottle"])

            if det["confidence"] < 0.25 and classification.get("is_uncertain"):
                continue
            if not is_specific_waste and det["confidence"] < 0.45 and classification.get("is_uncertain"):
                continue

            # Tier B: foliage confirmed by heuristic → drop non-waste plant matter
            if "foliage" in classification["material"].lower():
                continue

            # If classifier was uncertain but detector found a specific waste object (e.g. transparent glass/plastic), assign category
            if classification.get("is_uncertain") and is_specific_waste and classification.get("material") in ["Uncertain / Other", "General Trash"]:
                fallback_map = {
                    "glass": "Glass Bottle",
                    "plastic": "Plastic Bottle (PET)",
                    "metal": "Metal Can",
                    "cardboard": "Cardboard",
                    "paper": "Paper",
                }
                for k, v in fallback_map.items():
                    if k in lbl_lower:
                        classification["material"] = v
                        classification["confidence"] = max(classification.get("confidence", 0.0), det["confidence"])
                        classification["is_uncertain"] = False
                        break

            # ── Step 3: Grad-CAM Heatmap ──────────────────────────────────────
            # Pass the loaded classifier model so real Grad-CAM can be computed
            classifier_model = getattr(self.classifier, "model", None)
            _, heatmap_b64 = self.explainability.generate_heatmap(
                crop,
                classifier_model=classifier_model,
            )

            # Encode crop for display in the explainability modal
            crop_b64 = cv2_to_base64(crop)

            # ── Step 4: Rule-based Decision ───────────────────────────────────
            decision = self.decision_engine.evaluate(
                label=det["label"],
                material=classification["material"],
                confidence=det["confidence"],
            )

            item_count += 1
            processed_items.append({
                "id": item_count,
                "label": det["label"],
                "confidence": det["confidence"],
                "classifier_confidence": classification["confidence"],
                "bbox": [x1, y1, x2, y2],
                "material": classification["material"],
                "bin": decision["disposal_bin"],
                "recyclable": decision["recyclable"],
                "badge_variant": decision["badge_variant"],
                "instructions": decision["instructions"],
                "heatmap": heatmap_b64,
                "crop_image": crop_b64,
                "is_uncertain": classification.get("is_uncertain", False),
            })

        # ── Step 5: Draw annotated image ──────────────────────────────────────
        annotated_img = draw_detections(image, processed_items)
        annotated_b64 = cv2_to_base64(annotated_img)

        # Primary bin determination
        if processed_items:
            bins = [item["bin"] for item in processed_items]
            primary_bin = max(set(bins), key=bins.count)
        else:
            primary_bin = "Unknown / No Objects Detected"

        elapsed_ms = (time.time() - start_time) * 1000

        return {
            "pipeline_name": self.name,
            "pipeline_description": self.description,
            "filename": filename,
            "total_objects": len(processed_items),
            "primary_bin": primary_bin,
            "processing_time_ms": round(elapsed_ms, 1),
            "annotated_image": annotated_b64,
            "items": processed_items,
        }


# ── Cached Singleton Pipelines for Dual-Model Comparison ──────────────────────
_v1_pipeline: Optional[InferencePipeline] = None
_v2_pipeline: Optional[InferencePipeline] = None


def get_v1_pipeline() -> InferencePipeline:
    """Returns cached v1.0 pipeline (YOLOv8n + MobileNetV3)"""
    global _v1_pipeline
    if _v1_pipeline is None:
        v1_yolo = settings.WEIGHTS_DIR / "v1.0" / "yolo_waste.pt"
        v1_cls = settings.WEIGHTS_DIR / "v1.0" / "classifier_waste.pth"
        _v1_pipeline = InferencePipeline(
            detector_weights_path=v1_yolo if v1_yolo.exists() else None,
            classifier_weights_path=v1_cls if v1_cls.exists() else None,
            name="v1.0",
            description="YOLOv8n + MobileNetV3 (Edge Speed)"
        )
    return _v1_pipeline


def get_v2_pipeline() -> InferencePipeline:
    """Returns cached v2.0 pipeline (YOLOv8m + EfficientNet-B2)"""
    global _v2_pipeline
    if _v2_pipeline is None:
        v2_yolo = settings.WEIGHTS_DIR / "v2.0" / "yolo_waste.pt"
        v2_cls = settings.WEIGHTS_DIR / "v2.0" / "classifier_waste.pth"
        _v2_pipeline = InferencePipeline(
            detector_weights_path=v2_yolo if v2_yolo.exists() else None,
            classifier_weights_path=v2_cls if v2_cls.exists() else None,
            name="v2.0",
            description="YOLOv8m + EfficientNet-B2 (Deep Precision)"
        )
    return _v2_pipeline

