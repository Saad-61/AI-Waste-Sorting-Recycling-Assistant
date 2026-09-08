import os
import math
from pathlib import Path
from typing import Dict, Any, Optional, List
import numpy as np

from app.config import settings


# ── Open-set rejection thresholds ────────────────────────────────────────────
# Shannon entropy of a uniform distribution over N classes = log(N)
# We reject predictions whose entropy exceeds ENTROPY_THRESHOLD * log(N),
# i.e. the model is no more confident than a near-random guess.
_ENTROPY_REJECT_RATIO  = 0.82    # reject if entropy > 82 % of max possible entropy
_MIN_TOP1_CONFIDENCE   = 0.38    # hard floor: top-1 prob must exceed this
_PLASTIC_MIN_CONF      = 0.55    # plastic sub-type needs higher bar (most-common class bias)


def _shannon_entropy(probs: "np.ndarray") -> float:
    """Computes Shannon entropy of a probability vector (nats)."""
    probs = np.clip(probs, 1e-9, 1.0)
    return float(-np.sum(probs * np.log(probs)))


class WasteClassifier:
    """PyTorch-based CNN classifier for fine-grained material recognition on bounding box crops"""

    CLASSES = [
        "Cardboard",                # 0
        "Glass Bottle",             # 1
        "Metal Can",                # 2
        "Paper",                    # 3
        "Plastic Bottle (PET)",     # 4
        "Plastic Container (HDPE)", # 5
        "Organic Waste",            # 6
        "Electronic Waste",         # 7
        "General Trash",            # 8
        "Soft Plastic / Bag",       # 9  (v2.0)
        "Uncertain / Other",        # 10 (v2.0)
    ]

    # Maximum possible entropy for this class count (log of N classes)
    _MAX_ENTROPY: float = math.log(len(CLASSES))

    def __init__(self, weights_path: Path = settings.CLASSIFIER_WEIGHTS_PATH):
        self.weights_path = weights_path
        self.model = None
        self._load_model()

    def _load_model(self):
        """Loads PyTorch CNN model or operates in heuristic fallback mode"""
        if self.weights_path and os.path.exists(self.weights_path):
            try:
                import torch
                try:
                    import timm  # required for EfficientNet-B2 model deserialization
                except ImportError:
                    pass
                print(f"[WasteClassifier] Loading weights from {self.weights_path}")
                self.model = torch.load(self.weights_path, map_location=settings.DEVICE, weights_only=False)
                self.model.eval()
            except Exception as e:
                print(f"[WasteClassifier] Failed to load model weights ({e}). Running in heuristic mode.")
        else:
            print("[WasteClassifier] Classifier weights not found. Using category heuristic mapper.")

    def _is_foliage_or_ground(self, crop: np.ndarray) -> bool:
        """
        Heuristic to detect natural vegetation, autumn leaves, soil, or flat
        pavement that YOLO occasionally boxes as waste.

        Thresholds tightened vs. original (0.40 green / 0.50 brown) to reduce
        false-positive foliage rejection on green-packaged recyclables.
        """
        if crop is None or crop.size < 400:   # skip tiny crops (< ~20×20 px)
            return False
        try:
            import cv2
            hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
            h, s, v = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
            total_px = crop.shape[0] * crop.shape[1]

            # Vivid green foliage: hue 25-85, decent saturation & brightness
            green_mask  = (h >= 25) & (h <= 85) & (s >= 50) & (v >= 40)
            green_ratio = np.count_nonzero(green_mask) / total_px

            # Autumn / dry brown leaf: hue 8-24, high saturation, mid brightness
            brown_mask  = (h >= 8) & (h <= 24) & (s >= 70) & (v >= 35) & (v <= 175)
            brown_ratio = np.count_nonzero(brown_mask) / total_px

            # Flat featureless surface (pavement, soil) – very low Laplacian variance
            gray     = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
            variance = cv2.Laplacian(gray, cv2.CV_64F).var()

            # Foliage thresholds: green > 0.35 or brown leaf > 0.50 or low-texture greenery
            return (
                (green_ratio > 0.35)
                or (brown_ratio > 0.50)
                or (variance < 25.0 and green_ratio > 0.20)
            )
        except Exception:
            return False

    def _is_human_skin(self, crop: np.ndarray) -> bool:
        """Biometric skin detection to prevent human hands/fingers from being classified as plastic"""
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
            return skin_ratio > 0.55
        except Exception:
            return False

    def _run_model_inference(self, crop: np.ndarray):
        """
        Runs forward pass and returns (pred_idx, pred_conf, probs_np).
        Returns (None, 0.0, None) if the model is unavailable or errors out.
        """
        if self.model is None:
            return None, 0.0, None
        try:
            import torch
            from PIL import Image
            import torchvision.transforms as T

            transform = T.Compose([
                T.Resize((224, 224)),
                T.ToTensor(),
                T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])

            if len(crop.shape) == 3 and crop.shape[2] == 3:
                pil_img = Image.fromarray(crop[:, :, ::-1])
            else:
                pil_img = Image.fromarray(crop)

            tensor = transform(pil_img).unsqueeze(0).to(settings.DEVICE)

            with torch.no_grad():
                logits = self.model(tensor)
                probs  = torch.softmax(logits, dim=1)[0]
                conf, pred_idx = torch.max(probs, dim=0)

            probs_np = probs.cpu().numpy()
            return pred_idx.item(), round(conf.item(), 3), probs_np
        except Exception as e:
            print(f"[WasteClassifier] Inference warning ({e}).")
            return None, 0.0, None

    def classify_crop(self, crop: np.ndarray, detected_label: Optional[str] = None, detector_confidence: float = 1.0) -> Dict[str, Any]:
        """
        Classifies a cropped image region with open-set protection, skin detection, and Bayesian fusion.
        """
        # ── Guard: empty crop ─────────────────────────────────────────────────
        if crop is None or crop.size == 0:
            return {
                "material": "Uncertain / Other",
                "confidence": 0.0,
                "is_clean": False,
                "is_uncertain": True
            }

        label_lower = (detected_label or "").lower()
        is_definite_waste = detector_confidence >= 0.48 and any(
            kw in label_lower for kw in ["glass", "metal", "cardboard", "paper", "can", "bottle", "plastic"]
        )

        # ── Stage 0: Human Hand / Finger Occlusion Guard ──────────────────────
        # Only classify as human hand if it is an isolated hand/finger without a strong waste detection
        if self._is_human_skin(crop) and not is_definite_waste:
            return {
                "material": "Human Hand / Skin Occlusion",
                "confidence": 0.88,
                "is_clean": False,
                "is_uncertain": True
            }

        # ── Stage 1: Foliage / ground heuristic ──────────────────────────────
        if self._is_foliage_or_ground(crop) and not is_definite_waste:
            return {
                "material": "Organic Foliage / Plant Matter",
                "confidence": 0.88,
                "is_clean": True,
                "is_uncertain": False
            }

        # ── Neural network inference ──────────────────────────────────────────
        pred_idx, pred_conf, probs_np = self._run_model_inference(crop)
        predicted_material = self.CLASSES[pred_idx] if (pred_idx is not None and 0 <= pred_idx < len(self.CLASSES)) else None

        # ── Stage 2: Shannon entropy open-set gate ───────────────────────────
        if probs_np is not None:
            entropy       = _shannon_entropy(probs_np)
            entropy_ratio = entropy / self._MAX_ENTROPY

            # Flat / confused softmax → uncertain (unless detector has strong evidence)
            if entropy_ratio > _ENTROPY_REJECT_RATIO and not is_definite_waste:
                return {
                    "material": "Uncertain / Other",
                    "confidence": round(pred_conf, 3),
                    "is_clean": False,
                    "is_uncertain": True
                }

        # Hard confidence floor
        if pred_conf < _MIN_TOP1_CONFIDENCE and not is_definite_waste:
            return {
                "material": "Uncertain / Other",
                "confidence": round(pred_conf, 3),
                "is_clean": False,
                "is_uncertain": True
            }

        # ── Stage 3: Intelligent Confidence-Weighted Bayesian Fusion ──────────
        # Material mapping helpers
        clf_name = (predicted_material or "").lower()

        # CASE 1: Strong Classifier Recognition (EfficientNet >= 0.60)
        # EfficientNet has seen full-color 224x224 crop details. If confident, it can overturn YOLO!
        if pred_conf >= 0.60 and predicted_material and predicted_material != "Uncertain / Other":
            if "glass" in clf_name:
                material = "Glass Bottle / Container"
                confidence = max(pred_conf, 0.88)
            elif "metal" in clf_name or "can" in clf_name:
                material = "Aluminum / Tin Can"
                confidence = max(pred_conf, 0.90)
            elif "cardboard" in clf_name:
                material = "Corrugated Cardboard"
                confidence = max(pred_conf, 0.92)
            elif "paper" in clf_name:
                material = "Recyclable Paper"
                confidence = max(pred_conf, 0.88)
            elif "soft plastic" in clf_name or "bag" in clf_name:
                material = "Soft Plastic / Bag"
                confidence = max(pred_conf, 0.85)
            elif "hdpe" in clf_name or "container" in clf_name:
                material = "Plastic Container (HDPE)"
                confidence = max(pred_conf, 0.84)
            elif "plastic" in clf_name or "pet" in clf_name:
                material = "Plastic Bottle (PET)"
                confidence = max(pred_conf, 0.85)
            elif "organic" in clf_name:
                material = "Organic Compostable"
                confidence = max(pred_conf, 0.88)
            elif "electronic" in clf_name or "e_waste" in clf_name:
                material = "Electronic Waste"
                confidence = max(pred_conf, 0.90)
            else:
                material = predicted_material
                confidence = pred_conf

        # CASE 2: Both Agree in Domain (Synergistic Boost)
        elif "glass" in label_lower and "glass" in clf_name:
            material = "Glass Bottle / Container"
            confidence = round(min(0.98, max(detector_confidence, pred_conf) + 0.10), 2)
        elif ("metal" in label_lower or "can" in label_lower) and ("metal" in clf_name or "can" in clf_name):
            material = "Aluminum / Tin Can"
            confidence = round(min(0.98, max(detector_confidence, pred_conf) + 0.10), 2)
        elif "plastic" in label_lower and ("plastic" in clf_name or "bag" in clf_name):
            if "soft plastic" in clf_name or "bag" in clf_name:
                material = "Soft Plastic / Bag"
            elif "hdpe" in clf_name:
                material = "Plastic Container (HDPE)"
            else:
                material = "Plastic Bottle (PET)"
            confidence = round(min(0.95, max(detector_confidence, pred_conf) + 0.08), 2)

        # CASE 3: Strong YOLO Prior (Detector >= 0.55 when Classifier is Ambiguous)
        elif detector_confidence >= 0.55:
            if "glass" in label_lower:
                material = "Glass Bottle / Container"
                confidence = max(detector_confidence, 0.85)
            elif "metal" in label_lower or "can" in label_lower:
                material = "Aluminum / Tin Can"
                confidence = max(detector_confidence, 0.85)
            elif "cardboard" in label_lower or "box" in label_lower:
                material = "Corrugated Cardboard"
                confidence = max(detector_confidence, 0.88)
            elif "paper" in label_lower:
                material = "Recyclable Paper"
                confidence = max(detector_confidence, 0.85)
            elif "plastic" in label_lower:
                if "soft plastic" in clf_name or "bag" in clf_name:
                    material = "Soft Plastic / Bag"
                    confidence = 0.80
                elif "hdpe" in clf_name:
                    material = "Plastic Container (HDPE)"
                    confidence = 0.80
                else:
                    material = "Plastic Bottle (PET)"
                    confidence = max(detector_confidence, 0.78)
            elif "organic" in label_lower:
                material = "Organic Compostable"
                confidence = max(detector_confidence, 0.85)
            else:
                material = predicted_material or "Uncertain / Other"
                confidence = max(detector_confidence, pred_conf)

        # CASE 4: Moderate Classifier Guidance
        elif predicted_material and pred_conf >= _MIN_TOP1_CONFIDENCE and predicted_material != "Uncertain / Other":
            material = predicted_material
            confidence = pred_conf

        # CASE 5: Fallback
        else:
            material = "Uncertain / Other"
            confidence = round(pred_conf, 3)

        is_uncertain = (confidence < 0.45) or (material == "Uncertain / Other")

        return {
            "material": material,
            "confidence": round(confidence, 3),
            "is_clean": not is_uncertain,
            "is_uncertain": is_uncertain
        }
