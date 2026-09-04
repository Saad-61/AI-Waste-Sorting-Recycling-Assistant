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
        "Cardboard",
        "Glass Bottle",
        "Metal Can",
        "Paper",
        "Plastic Bottle (PET)",
        "Plastic Container (HDPE)",
        "Organic Waste",
        "Electronic Waste",
        "General Trash"
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

            # Raised thresholds: green > 0.55 (was 0.45), brown > 0.60 (was 0.55)
            return (
                (green_ratio > 0.55)
                or (brown_ratio > 0.60)
                or (variance < 18.0 and green_ratio > 0.30)
            )
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

    def classify_crop(self, crop: np.ndarray, detected_label: Optional[str] = None) -> Dict[str, Any]:
        """
        Classifies a cropped image region with three-stage open-set protection:

        Stage 1 – Foliage heuristic: colour-based HSV check rejects natural
                  vegetation before touching the neural network.

        Stage 2 – Shannon entropy gate: if the softmax distribution is nearly
                  uniform (high entropy), the model is confused and the item
                  is returned as 'Uncertain / Other' rather than being force-
                  assigned to the most-common class (Plastic Bottle).

        Stage 3 – Detector-label fusion: YOLO category overrides the CNN for
                  high-confidence YOLO hits (glass, metal, cardboard, etc.)
                  which typically have strong detector evidence.
        """
        # ── Guard: empty crop ─────────────────────────────────────────────────
        if crop is None or crop.size == 0:
            return {
                "material": "Uncertain / Other",
                "confidence": 0.0,
                "is_clean": False,
                "is_uncertain": True
            }

        # ── Stage 1: Foliage / ground heuristic ──────────────────────────────
        label_lower = (detected_label or "").lower()
        waste_keywords = ["plastic", "glass", "metal", "cardboard", "paper", "can", "bottle"]
        is_known_waste = any(kw in label_lower for kw in waste_keywords)

        if self._is_foliage_or_ground(crop) and not is_known_waste:
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

            # Flat / confused softmax → uncertain
            if entropy_ratio > _ENTROPY_REJECT_RATIO:
                return {
                    "material": "Uncertain / Other",
                    "confidence": round(pred_conf, 3),
                    "is_clean": False,
                    "is_uncertain": True
                }

        # Hard confidence floor (catches very-low-entropy but still weak predictions)
        if pred_conf < _MIN_TOP1_CONFIDENCE and not is_known_waste:
            return {
                "material": "Uncertain / Other",
                "confidence": round(pred_conf, 3),
                "is_clean": False,
                "is_uncertain": True
            }

        # ── Stage 3: Detector-label fusion ────────────────────────────────────
        if "glass" in label_lower:
            material   = "Glass Bottle / Container"
            confidence = max(pred_conf, 0.91)
        elif "cardboard" in label_lower or "box" in label_lower:
            material   = "Corrugated Cardboard"
            confidence = max(pred_conf, 0.94)
        elif "paper" in label_lower:
            material   = "Recyclable Paper"
            confidence = max(pred_conf, 0.90)
        elif "metal" in label_lower or "can" in label_lower:
            material   = "Aluminum / Tin Can"
            confidence = max(pred_conf, 0.95)
        elif "plastic" in label_lower:
            # For plastic sub-types require a higher CNN confidence bar to prevent
            # everything defaulting to PET (most common training class)
            if predicted_material and "plastic" in predicted_material.lower() and pred_conf >= _PLASTIC_MIN_CONF:
                material = predicted_material
            else:
                material = "Plastic Bottle (PET)"
            confidence = max(pred_conf, 0.75)   # lower floor vs before (was 0.88)
        elif "organic" in label_lower or "food" in label_lower:
            material   = "Organic Compostable"
            confidence = max(pred_conf, 0.96)
        elif "e_waste" in label_lower or "electronic" in label_lower or "battery" in label_lower:
            material   = "Electronic Waste"
            confidence = max(pred_conf, 0.95)
        elif predicted_material and pred_conf >= _MIN_TOP1_CONFIDENCE:
            material   = predicted_material
            confidence = pred_conf
        else:
            # Final fallback
            material   = "Uncertain / Other"
            confidence = pred_conf

        is_uncertain = (confidence < 0.50) or (material == "Uncertain / Other")

        return {
            "material": material,
            "confidence": round(confidence, 3),
            "is_clean": not is_uncertain,
            "is_uncertain": is_uncertain
        }
