import time
import numpy as np
from typing import Dict, Any, List

from app.services.detector import WasteDetector
from app.services.classifier import WasteClassifier
from app.services.explainability import ExplainabilityService
from app.services.decision_engine import DecisionEngine
from app.utils.image_processing import draw_detections, cv2_to_base64


class InferencePipeline:
    """Orchestrates detection, classification, Grad-CAM XAI, and rule-based decision engine"""

    def __init__(self):
        self.detector = WasteDetector()
        self.classifier = WasteClassifier()
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
            classification = self.classifier.classify_crop(crop, det["label"])

            # Two-tier false-positive filter: discard background clutter
            # Tier A: low detector confidence + uncertain classifier → drop
            if det["confidence"] < 0.50 and classification.get("is_uncertain"):
                continue
            # Tier B: foliage confirmed by heuristic with weak YOLO confidence → drop
            if det["confidence"] < 0.42 and "foliage" in classification["material"].lower():
                continue

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
            "filename": filename,
            "total_objects": len(processed_items),
            "primary_bin": primary_bin,
            "processing_time_ms": round(elapsed_ms, 1),
            "annotated_image": annotated_b64,
            "items": processed_items,
        }
