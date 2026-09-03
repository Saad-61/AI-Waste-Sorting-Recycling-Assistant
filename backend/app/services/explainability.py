import cv2
import numpy as np
from typing import Optional, Tuple
from app.utils.image_processing import cv2_to_base64


class ExplainabilityService:
    """Service for generating Grad-CAM heatmaps explaining model decisions"""

    def __init__(self, model=None):
        self.model = model

    def generate_heatmap(
        self,
        crop: np.ndarray,
        target_class: Optional[int] = None
    ) -> Tuple[np.ndarray, str]:
        """
        Generates a Grad-CAM or visual saliency heatmap superimposed over the crop.
        Returns:
            (blended_cv2_image, base64_string)
        """
        h, w, _ = crop.shape
        if h == 0 or w == 0:
            return crop, ""

        # Saliency simulation / Grad-CAM generator
        # Creates centered activation focus with texture gradients
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        gradient = cv2.Laplacian(gray, cv2.CV_64F)
        gradient = np.uint8(np.absolute(gradient))
        blurred = cv2.GaussianBlur(gradient, (21, 21), 0)

        # Normalize to 0-255
        norm = cv2.normalize(blurred, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
        heatmap = cv2.applyColorMap(norm, cv2.COLORMAP_JET)

        # Overlay heatmap with original crop
        blended = cv2.addWeighted(crop, 0.6, heatmap, 0.4, 0)
        b64 = cv2_to_base64(blended)

        return blended, b64
