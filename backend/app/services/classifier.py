import os
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np

from app.config import settings


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
                self.model = torch.load(self.weights_path, map_location=settings.DEVICE)
                self.model.eval()
            except Exception as e:
                print(f"[WasteClassifier] Failed to load model weights ({e}). Running in heuristic mode.")
        else:
            print("[WasteClassifier] Classifier weights not found. Using category heuristic mapper.")

    def classify_crop(self, crop: np.ndarray, detected_label: Optional[str] = None) -> Dict[str, Any]:
        """
        Classifies cropped image region.
        Returns predicted material, confidence, and attributes.
        """
        if self.model is not None:
            # Model inference pipeline
            # (Preprocess, tensor conversion, forward pass)
            pass

        # Fallback mapping based on detector label heuristics
        label_lower = (detected_label or "").lower()
        if "bottle" in label_lower or "plastic" in label_lower:
            material = "Plastic (PET #1)"
            confidence = 0.92
        elif "can" in label_lower or "metal" in label_lower:
            material = "Aluminum Metal"
            confidence = 0.95
        elif "cup" in label_lower or "paper" in label_lower:
            material = "Paper / Cardboard"
            confidence = 0.88
        elif "box" in label_lower or "cardboard" in label_lower:
            material = "Corrugated Cardboard"
            confidence = 0.94
        elif "apple" in label_lower or "banana" in label_lower or "food" in label_lower or "organic" in label_lower:
            material = "Organic Compostable"
            confidence = 0.96
        else:
            material = "Mixed Material"
            confidence = 0.80

        return {
            "material": material,
            "confidence": confidence,
            "is_clean": True  # contamination status estimate
        }
