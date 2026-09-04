from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application Configuration Settings"""
    PROJECT_NAME: str = "AI Waste Sorting & Recycling Assistant"
    API_V1_STR: str = "/api"
    ENV: str = "development"

    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    WEIGHTS_DIR: Path = BASE_DIR / "weights"
    YOLO_WEIGHTS_PATH: Path = WEIGHTS_DIR / "yolo_waste.pt"
    ONNX_WEIGHTS_PATH: Path = WEIGHTS_DIR / "yolo_waste.onnx"
    CLASSIFIER_WEIGHTS_PATH: Path = WEIGHTS_DIR / "classifier_waste.pth"

    # Database
    DATABASE_URL: str = "sqlite:///./app_data.db"

    # Model inference settings
    CONFIDENCE_THRESHOLD: float = 0.32
    IOU_THRESHOLD: float = 0.40
    DEVICE: str = "cpu"  # 'cpu', 'cuda', or 'mps'

    # CORS configuration
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
