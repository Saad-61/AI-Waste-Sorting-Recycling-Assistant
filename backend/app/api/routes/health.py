import os
import torch
from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/")
def health_check():
    """Returns basic system health and model readiness indicators"""
    weights_found = {
        "yolo_weights": os.path.exists(settings.YOLO_WEIGHTS_PATH),
        "onnx_weights": os.path.exists(settings.ONNX_WEIGHTS_PATH),
        "classifier_weights": os.path.exists(settings.CLASSIFIER_WEIGHTS_PATH)
    }

    cuda_available = torch.cuda.is_available() if hasattr(torch, "cuda") else False

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENV,
        "cuda_available": cuda_available,
        "device": settings.DEVICE,
        "models": weights_found
    }
