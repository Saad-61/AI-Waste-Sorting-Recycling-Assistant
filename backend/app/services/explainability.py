import cv2
import numpy as np
from typing import Optional, Tuple, Any
from app.utils.image_processing import cv2_to_base64


class ExplainabilityService:
    """
    Generates visual saliency / Grad-CAM heatmaps that explain which regions
    of a detected crop drove the classification decision.

    When a PyTorch classifier model is available, runs a proper Grad-CAM pass.
    Falls back to a gradient-magnitude edge map when no model is loaded.
    """

    def __init__(self, model=None):
        self.model = model  # optional: set after classifier loads

    # ─────────────────────────────────────────────────────────────────────────
    # Public API
    # ─────────────────────────────────────────────────────────────────────────

    def generate_heatmap(
        self,
        crop: np.ndarray,
        target_class: Optional[int] = None,
        classifier_model: Optional[Any] = None,
    ) -> Tuple[np.ndarray, str]:
        """
        Returns (blended_cv2_image, base64_string).

        Strategy:
        1. Try real Grad-CAM if a PyTorch model is available.
        2. Fall back to Laplacian gradient magnitude edge map.
        """
        if crop is None or crop.size == 0 or crop.shape[0] == 0 or crop.shape[1] == 0:
            return crop if crop is not None else np.zeros((64, 64, 3), dtype=np.uint8), ""

        model = classifier_model or self.model

        if model is not None:
            try:
                blended = self._gradcam_heatmap(crop, model, target_class)
                return blended, cv2_to_base64(blended)
            except Exception as e:
                print(f"[Explainability] Grad-CAM failed ({e}), falling back to edge map.")

        blended = self._edge_map_heatmap(crop)
        return blended, cv2_to_base64(blended)

    # ─────────────────────────────────────────────────────────────────────────
    # Real Grad-CAM implementation
    # ─────────────────────────────────────────────────────────────────────────

    def _gradcam_heatmap(self, crop: np.ndarray, model, target_class: Optional[int]) -> np.ndarray:
        """
        Hooks into the last convolutional layer of the classifier to compute
        a true class-activation map (Grad-CAM).
        """
        import torch
        import torch.nn.functional as F
        from PIL import Image
        import torchvision.transforms as T
        from app.config import settings

        # Prepare input tensor
        transform = T.Compose([
            T.Resize((224, 224)),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        pil_img = Image.fromarray(crop[:, :, ::-1])          # BGR → RGB
        tensor = transform(pil_img).unsqueeze(0).to(settings.DEVICE)

        # ── Hook registration ──────────────────────────────────────────────
        activations: list = []
        gradients: list = []

        target_layer = self._find_last_conv(model)
        if target_layer is None:
            raise ValueError("No convolutional layer found in model")

        def forward_hook(module, inp, out):
            activations.append(out.detach())

        def backward_hook(module, grad_in, grad_out):
            gradients.append(grad_out[0].detach())

        fwd_handle = target_layer.register_forward_hook(forward_hook)
        bwd_handle = target_layer.register_full_backward_hook(backward_hook)

        # ── Forward + backward pass ────────────────────────────────────────
        model.eval()
        output = model(tensor)                               # (1, num_classes)
        if target_class is None:
            target_class = output.argmax(dim=1).item()

        model.zero_grad()
        class_score = output[0, target_class]
        class_score.backward()

        fwd_handle.remove()
        bwd_handle.remove()

        if not activations or not gradients:
            raise ValueError("Hooks did not capture activations/gradients")

        # ── Grad-CAM weights ───────────────────────────────────────────────
        acts = activations[0].squeeze(0)                    # (C, H, W)
        grads = gradients[0].squeeze(0)                     # (C, H, W)
        weights = grads.mean(dim=(1, 2), keepdim=True)      # (C, 1, 1) — global average pool
        cam = F.relu((weights * acts).sum(dim=0))           # (H, W)

        # Normalise to [0, 255]
        cam = cam.cpu().numpy()
        cam = cv2.resize(cam, (crop.shape[1], crop.shape[0]))
        cam = cam - cam.min()
        if cam.max() > 0:
            cam = cam / cam.max()
        cam = np.uint8(255 * cam)

        heatmap_color = cv2.applyColorMap(cam, cv2.COLORMAP_TURBO)
        blended = cv2.addWeighted(crop, 0.55, heatmap_color, 0.45, 0)
        return blended

    # ─────────────────────────────────────────────────────────────────────────
    # Edge-map fallback
    # ─────────────────────────────────────────────────────────────────────────

    def _edge_map_heatmap(self, crop: np.ndarray) -> np.ndarray:
        """
        Gradient-magnitude edge map as a visual proxy for attention.
        Highlights texture and boundary regions the network would attend to.
        """
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

        # Combine Sobel + Laplacian for richer edge response
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        sobel_mag = np.sqrt(sobelx ** 2 + sobely ** 2)

        laplacian = np.abs(cv2.Laplacian(gray, cv2.CV_64F))
        combined = 0.6 * sobel_mag + 0.4 * laplacian

        blurred = cv2.GaussianBlur(combined, (15, 15), 0)
        norm = cv2.normalize(blurred, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
        heatmap_color = cv2.applyColorMap(norm, cv2.COLORMAP_TURBO)
        blended = cv2.addWeighted(crop, 0.55, heatmap_color, 0.45, 0)
        return blended

    # ─────────────────────────────────────────────────────────────────────────
    # Helpers
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _find_last_conv(model) -> Optional[Any]:
        """Walks model layers in reverse to find the last Conv2d layer."""
        import torch.nn as nn
        last_conv = None
        for module in model.modules():
            if isinstance(module, nn.Conv2d):
                last_conv = module
        return last_conv
