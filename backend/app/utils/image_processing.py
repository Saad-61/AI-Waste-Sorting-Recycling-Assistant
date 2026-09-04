import base64
import cv2
import numpy as np
from typing import List, Dict, Any, Tuple


def base64_to_cv2(b64_string: str) -> np.ndarray:
    """Decodes a base64 string to an OpenCV BGR image"""
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]
    img_bytes = base64.b64decode(b64_string)
    nparr = np.frombuffer(img_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return image


def bytes_to_cv2(file_bytes: bytes) -> np.ndarray:
    """Decodes raw byte buffer into an OpenCV BGR image"""
    nparr = np.frombuffer(file_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return image


def cv2_to_base64(image: np.ndarray, format: str = ".jpg") -> str:
    """Encodes an OpenCV image to a base64 data URI string"""
    _, buffer = cv2.imencode(format, image)
    encoded = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


# ── Confidence-based box colour thresholds ──────────────────────────────────
# Colours are in BGR (OpenCV convention)
# High confidence  >= 0.75  -->  vivid green
# Medium           0.50–0.74 --> warm amber/orange
# Low              < 0.50   -->  muted red
# Uncertain item            -->  grey

def _confidence_colour(confidence: float) -> Tuple[int, int, int]:
    """Returns a BGR colour scaled by detection confidence."""
    if confidence >= 0.75:
        return (55, 190, 70)    # Green   (BGR)
    elif confidence >= 0.50:
        return (30, 145, 235)   # Amber   (BGR: orange-ish)
    else:
        return (60, 60, 210)    # Red     (BGR)


# Legacy bin-colour map kept for any callers that still use it directly
BIN_COLORS = {
    "Recyclable":    (0, 180, 255),
    "Organic":       (75, 180, 60),
    "Hazardous":     (50, 50, 220),
    "General Waste": (160, 160, 160)
}


def draw_detections(
    image: np.ndarray,
    detections: List[Dict[str, Any]],
    line_thickness: int = 2
) -> np.ndarray:
    """
    Overlays confidence-coloured bounding boxes and labels onto the image.

    Box colour encodes the YOLO detection confidence:
      • Green  (>= 75 %)  — high confidence
      • Amber  (50–74 %)  — moderate confidence
      • Red    (< 50 %)   — low confidence, treat with caution
      • Grey              — uncertain / open-set rejected item

    Each detection dict may contain:
      - bbox:                  [x1, y1, x2, y2]
      - label:                 str   (YOLO class name)
      - confidence:            float (YOLO detection score)
      - classifier_confidence: float (CNN material score, optional)
      - material:              str   (fine-grained material label, optional)
      - bin:                   str   (Recyclable, Organic, etc.)
      - is_uncertain:          bool
    """
    annotated = image.copy()
    h, w = annotated.shape[:2]

    font       = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.45
    font_thick = 1

    for det in detections:
        box = det.get("bbox", [])
        if len(box) != 4:
            continue

        x1, y1, x2, y2 = [int(v) for v in box]
        # Clamp to image bounds
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w - 1, x2), min(h - 1, y2)

        det_conf  = det.get("confidence", 0.0)
        clf_conf  = det.get("classifier_confidence", None)
        label     = det.get("label", "Item")
        material  = det.get("material", "")
        is_unc    = det.get("is_uncertain", False)

        # Uncertain items get a muted grey box regardless of raw confidence
        if is_unc:
            box_color = (115, 115, 115)
        else:
            box_color = _confidence_colour(det_conf)

        # ── Bounding box ──────────────────────────────────────────────────────
        cv2.rectangle(annotated, (x1, y1), (x2, y2), box_color, line_thickness)

        # ── Label chip text ───────────────────────────────────────────────────
        det_pct = f"{det_conf:.0%}"
        if is_unc:
            label_text = f"[?] {label} {det_pct}"
        elif clf_conf is not None and material:
            clf_pct    = f"{clf_conf:.0%}"
            label_text = f"{label} {det_pct} | {material} {clf_pct}"
        else:
            label_text = f"{label} {det_pct}"

        (tw, th), _ = cv2.getTextSize(label_text, font, font_scale, font_thick)

        chip_x1 = x1
        chip_y1 = max(0, y1 - th - 8)
        chip_x2 = min(w - 1, x1 + tw + 8)
        chip_y2 = max(th + 8, y1)

        # Semi-opaque background chip using weighted blend
        overlay = annotated.copy()
        cv2.rectangle(overlay, (chip_x1, chip_y1), (chip_x2, chip_y2), box_color, -1)
        cv2.addWeighted(overlay, 0.82, annotated, 0.18, 0, annotated)

        # White label text
        cv2.putText(
            annotated,
            label_text,
            (chip_x1 + 4, max(th + 4, y1 - 4)),
            font,
            font_scale,
            (255, 255, 255),
            font_thick,
            cv2.LINE_AA
        )

    return annotated
