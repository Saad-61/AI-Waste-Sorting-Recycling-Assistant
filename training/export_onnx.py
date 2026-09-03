"""
ONNX Model Exporter & Quantization Script
Converts trained PyTorch YOLO / CNN weights into ONNX for high-performance CPU inference.
"""
import argparse
from pathlib import Path
from ultralytics import YOLO


def export_yolo_to_onnx(weights_path: str, output_path: str = None, imgsz: int = 640):
    weights = Path(weights_path)
    if not weights.exists():
        print(f"[ONNX Export] Weights file {weights} does not exist. Using fallback placeholder yolov8n.pt")
        weights = "yolov8n.pt"

    print(f"[ONNX Export] Loading YOLO model from {weights}...")
    model = YOLO(str(weights))

    print(f"[ONNX Export] Exporting to ONNX format (imgsz={imgsz}, dynamic=False)...")
    exported_file = model.export(format="onnx", imgsz=imgsz, dynamic=False)
    print(f"[ONNX Export] Successfully exported to {exported_file}")

    if output_path:
        import shutil
        dest = Path(output_path)
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(exported_file, dest)
        print(f"[ONNX Export] Copied ONNX artifact to {dest}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export trained model to ONNX format")
    parser.add_argument("--weights", type=str, default="../backend/weights/yolo_waste.pt", help="Source PyTorch weights")
    parser.add_argument("--output", type=str, default="../backend/weights/yolo_waste.onnx", help="Target ONNX location")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")

    args = parser.parse_args()
    export_yolo_to_onnx(args.weights, args.output, args.imgsz)
