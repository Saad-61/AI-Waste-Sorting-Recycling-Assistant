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


BIN_COLORS = {
    "Recyclable": (0, 180, 255),      # Orange/Yellow BGR
    "Organic": (75, 180, 60),          # Green BGR
    "Hazardous": (50, 50, 220),        # Red BGR
    "General Waste": (160, 160, 160)   # Gray BGR
}


def draw_detections(
    image: np.ndarray,
    detections: List[Dict[str, Any]],
    line_thickness: int = 2
) -> np.ndarray:
    """
    Overlays styled bounding boxes and labels onto the image.
    Each detection dict contains:
    - bbox: [x1, y1, x2, y2]
    - label: str
    - confidence: float
    - bin: str (Recyclable, Organic, etc.)
    """
    annotated = image.copy()
    h, w, _ = annotated.shape

    for det in detections:
        box = det.get("bbox", [])
        if len(box) != 4:
            continue
        x1, y1, x2, y2 = [int(v) for v in box]
        bin_category = det.get("bin", "General Waste")
        color = BIN_COLORS.get(bin_category, (0, 255, 0))

        # Draw bounding box
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, line_thickness)

        # Label text
        label_text = f"{det.get('label', 'Item')} {det.get('confidence', 0.0):.0%} | {bin_category}"
        font_scale = 0.5
        font = cv2.FONT_HERSHEY_SIMPLEX
        (tw, th), baseline = cv2.getTextSize(label_text, font, font_scale, 1)

        # Draw background badge for label text
        cv2.rectangle(
            annotated,
            (x1, max(0, y1 - th - 8)),
            (x1 + tw + 6, max(th + 8, y1)),
            color,
            -1
        )
        cv2.putText(
            annotated,
            label_text,
            (x1 + 3, max(th + 4, y1 - 4)),
            font,
            font_scale,
            (255, 255, 255),
            1,
            cv2.LINE_AA
        )

    return annotated
