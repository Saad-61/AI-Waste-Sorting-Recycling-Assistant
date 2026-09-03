"""
YOLOv8/v11 Waste Detection Fine-Tuning Script
Supports training on custom dataset defined in dataset/data.yaml
"""
import argparse
from pathlib import Path
from ultralytics import YOLO


def train_yolo(args):
    dataset_yaml = Path(args.data).resolve()
    print(f"[Training] Initializing model '{args.model}'...")
    model = YOLO(args.model)

    print(f"[Training] Starting training on {dataset_yaml} for {args.epochs} epochs...")
    results = model.train(
        data=str(dataset_yaml),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        project=args.project,
        name=args.name,
        save=True
    )

    best_weights = Path(args.project) / args.name / "weights" / "best.pt"
    print(f"[Training] Training completed. Best checkpoint saved to {best_weights}")

    # Optionally copy best weights to backend/weights/
    target_weights = Path(__file__).resolve().parent.parent / "backend" / "weights" / "yolo_waste.pt"
    if best_weights.exists():
        import shutil
        target_weights.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(best_weights, target_weights)
        print(f"[Training] Copied best weights to backend: {target_weights}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLO on waste detection dataset")
    parser.add_argument("--model", type=str, default="yolov8n.pt", help="Initial weights: yolov8n.pt, yolov8s.pt, etc.")
    parser.add_argument("--data", type=str, default="dataset/data.yaml", help="Path to data.yaml")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--imgsz", type=int, default=640, help="Input image size")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--device", type=str, default="0", help="CUDA device '0' or 'cpu'")
    parser.add_argument("--project", type=str, default="runs/detect", help="Project save directory")
    parser.add_argument("--name", type=str, default="waste_yolo", help="Run name")

    args = parser.parse_args()
    train_yolo(args)
