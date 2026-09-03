import time
import numpy as np
from typing import Dict, Any, List

from app.services.detector import WasteDetector
from app.services.classifier import WasteClassifier
from app.services.explainability import ExplainabilityService
from app.services.decision_engine import DecisionEngine
from app.utils.image_processing import draw_detections, cv2_to_base64


class InferencePipeline:
    """Orchestrates detection, classification, XAI, and rule-based decision engine"""

    def __init__(self):
        self.detector = WasteDetector()
        self.classifier = WasteClassifier()
        self.explainability = ExplainabilityService()
        self.decision_engine = DecisionEngine()

    def process_image(self, image: np.ndarray, filename: str = "upload.jpg") -> Dict[str, Any]:
        """
        Executes end-to-end inference pipeline on an input image:
        1. YOLO Waste Detection -> Bounding boxes
        2. PyTorch Crop Classification -> Material validation
        3. Explainability -> Grad-CAM saliency maps
        4. Decision Engine -> Recyclability & Bin recommendation
        5. Visual Annotation -> Bounding boxes rendering
        """
        start_time = time.time()
        h, w, _ = image.shape

        # Step 1: Object Detection
        raw_detections = self.detector.detect(image)

        processed_items: List[Dict[str, Any]] = []

        # Step 2: Iterate detected regions
        for idx, det in enumerate(raw_detections):
            x1, y1, x2, y2 = det["bbox"]
            # Clamp coordinates to image boundaries
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)

            crop = image[y1:y2, x1:x2]
            if crop.size == 0:
                continue

            # Step 2b: Classification
            classification = self.classifier.classify_crop(crop, det["label"])

            # Step 2c: Explainability Heatmap
            _, heatmap_b64 = self.explainability.generate_heatmap(crop)

            # Step 2d: Rule-based Decision
            decision = self.decision_engine.evaluate(
                label=det["label"],
                material=classification["material"],
                confidence=det["confidence"]
            )

            processed_items.append({
                "id": idx + 1,
                "label": det["label"],
                "confidence": det["confidence"],
                "bbox": [x1, y1, x2, y2],
                "material": classification["material"],
                "bin": decision["disposal_bin"],
                "recyclable": decision["recyclable"],
                "badge_variant": decision["badge_variant"],
                "instructions": decision["instructions"],
                "heatmap": heatmap_b64
            })

        # Step 3: Draw annotated image
        annotated_img = draw_detections(image, processed_items)
        annotated_b64 = cv2_to_base64(annotated_img)

        # Primary bin determination
        if processed_items:
            bins = [item["bin"] for item in processed_items]
            primary_bin = max(set(bins), key=bins.count)
        else:
            primary_bin = "Unknown / No Objects"

        elapsed_ms = (time.time() - start_time) * 1000

        return {
            "filename": filename,
            "total_objects": len(processed_items),
            "primary_bin": primary_bin,
            "processing_time_ms": round(elapsed_ms, 1),
            "annotated_image": annotated_b64,
            "items": processed_items
        }
