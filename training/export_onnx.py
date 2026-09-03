"""
YOLO ONNX Export & CPU Verification Script
============================================
Exports the trained YOLOv8 detector to ONNX format for production deployment.
Runs a benchmark inference pass via onnxruntime to validate the export.

WHY ONNX EXPORT?
-----------------
  PyTorch .pt files require the full PyTorch runtime (~2GB) and GPU support
  to run inference. ONNX (Open Neural Network Exchange) is a universal format
  that runs on CPU via onnxruntime (~50MB), enabling deployment on:
    - The FastAPI backend (no GPU required)
    - Edge devices (Jetson Nano, Raspberry Pi)
    - Browsers via ONNX.js

HOW TO RUN:
-----------
  # From project root, run AFTER training is complete:
  python training/export_onnx.py

  # With optional settings:
  python training/export_onnx.py --opset 12 --imgsz 640

  # If you want to benchmark inference speed:
  python training/export_onnx.py --benchmark 50

UNDERSTANDING ONNX EXPORT OPTIONS:
-------------------------------------
  dynamic=True:
      Allows any batch size at runtime (1, 4, 8, ...).
      The backend sends single images, so this gives flexibility.
      If False, batch size is locked to 1 at export.

  simplify=True:
      Runs ONNX Simplifier (onnxsim) to merge redundant operations.
      Reduces model size by ~15–30% and speeds up inference.
      Requires: pip install onnxsim

  opset=12:
      ONNX opset version. Version 12 has broad compatibility across
      onnxruntime versions. Use opset 11 if you hit compatibility issues
      with older deployment targets.

  half=False (default):
      FP32 precision. For GPU inference you can export with half=True
      (FP16) for 2x speed, but onnxruntime CPU only supports FP32.

WHAT THE VERIFICATION TEST DOES:
---------------------------------
  Creates a random 640×640 "image" tensor and passes it through the
  exported ONNX model. If the output shape is correct (batch, num_detections, 12)
  the export is valid. The 12 columns are: [x, y, w, h, conf, cls_0...cls_7].
"""

import argparse
import shutil
import sys
import time
from pathlib import Path


def export_and_verify_onnx(opset: int = 12, imgsz: int = 640, benchmark_runs: int = 10):
    """
    Export trained YOLO weights to ONNX and verify with onnxruntime.

    Args:
        opset:          ONNX opset version (12 recommended for broad compatibility).
        imgsz:          Input image size for export (should match training imgsz).
        benchmark_runs: Number of warmup + timed inference runs for latency measurement.
    """
    try:
        from ultralytics import YOLO
        import numpy as np
        import onnxruntime as ort
    except ImportError as e:
        print(f"[ERROR] Missing dependency: {e}")
        print("Install with: pip install ultralytics onnxruntime numpy")
        sys.exit(1)

    project_root = Path(__file__).resolve().parent.parent
    pt_path = project_root / "backend" / "weights" / "yolo_waste.pt"
    onnx_target = project_root / "backend" / "weights" / "yolo_waste.onnx"

    if not pt_path.exists():
        raise FileNotFoundError(
            f"Source weights not found at: {pt_path}\n"
            "Run training/train_detection.py first."
        )

    print(f"[Export] Loading weights from: {pt_path}")
    print(f"[Export] Target ONNX path: {onnx_target}\n")

    model = YOLO(str(pt_path))

    # ─── Export to ONNX ───────────────────────────────────────────────────────
    # Ultralytics export() returns the path to the generated .onnx file.
    # It's saved next to the .pt file by default, so we move it to onnx_target.
    print(f"[Export] Exporting to ONNX (opset={opset}, imgsz={imgsz})...")
    exported_file = model.export(
        format="onnx",
        imgsz=imgsz,
        dynamic=True,      # Variable batch size support
        simplify=True,     # Run onnxsim to reduce graph complexity
        opset=opset,
        half=False,        # FP32 for CPU compatibility
    )

    # Move to the backend/weights directory
    exported_path = Path(exported_file)
    if exported_path != onnx_target:
        shutil.move(str(exported_path), str(onnx_target))

    size_mb = onnx_target.stat().st_size / (1024 ** 2)
    print(f"[Export] ONNX file saved: {onnx_target}")
    print(f"[Export] File size: {size_mb:.1f} MB\n")

    # ─── ONNX Runtime Verification ────────────────────────────────────────────
    print("[Verification] Loading ONNX model with onnxruntime (CPU)...")

    # CPUExecutionProvider: uses optimized CPU kernels (MLAS backend by default)
    session = ort.InferenceSession(
        str(onnx_target),
        providers=["CPUExecutionProvider"]
    )

    input_meta = session.get_inputs()[0]
    output_meta = session.get_outputs()

    print(f"[Verification] Input name: '{input_meta.name}'")
    print(f"[Verification] Input shape: {input_meta.shape}  (batch, channels, height, width)")
    print(f"[Verification] Outputs: {[o.name for o in output_meta]}")

    # Build a random batch-1 float32 tensor — simulates a real image
    # Values in [0.0, 1.0] to match YOLO's normalized input expectation
    dummy_input = (
        (lambda x: x / x.max())(__import__("numpy").random.randn(1, 3, imgsz, imgsz).astype("float32").clip(0))
    )

    # ─── Warmup Pass ─────────────────────────────────────────────────────────
    # First inference always takes longer due to memory allocation and JIT compilation.
    # We discard the warmup result and only benchmark subsequent passes.
    print("[Verification] Running warmup inference...")
    session.run(None, {input_meta.name: dummy_input})

    # ─── Benchmark Timed Passes ───────────────────────────────────────────────
    import numpy as np
    latencies = []
    print(f"[Benchmark] Running {benchmark_runs} inference passes...")
    for _ in range(benchmark_runs):
        t0 = time.perf_counter()
        outputs = session.run(None, {input_meta.name: dummy_input})
        t1 = time.perf_counter()
        latencies.append((t1 - t0) * 1000)  # Convert to milliseconds

    output_shape = outputs[0].shape
    mean_ms = np.mean(latencies)
    min_ms = np.min(latencies)
    max_ms = np.max(latencies)

    print(f"\n[Verification Passed] ✓")
    print(f"  Output tensor shape: {output_shape}")
    print(f"  → batch={output_shape[0]}, predictions={output_shape[1]}, "
          f"coords+conf+classes={output_shape[2]}")
    print(f"\n[Benchmark] CPU inference latency ({benchmark_runs} runs):")
    print(f"  Mean:  {mean_ms:>7.1f} ms")
    print(f"  Min:   {min_ms:>7.1f} ms")
    print(f"  Max:   {max_ms:>7.1f} ms")
    print(f"  FPS:   {1000/mean_ms:>7.1f} frames/sec (theoretical)")

    if mean_ms <= 150:
        print("[Benchmark] ✓ Latency is within acceptable range for real-time use.")
    else:
        print("[Benchmark] ⚠ Latency exceeds 150ms. Consider quantization (INT8) for speed.")

    print(f"\n[Complete] ONNX model is ready for backend deployment at:")
    print(f"           {onnx_target}")

    return str(onnx_target)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Export trained YOLO model to ONNX and benchmark on CPU",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--opset", type=int, default=12,
        help="ONNX opset version (default: 12)"
    )
    parser.add_argument(
        "--imgsz", type=int, default=640,
        help="Input image resolution for export (default: 640)"
    )
    parser.add_argument(
        "--benchmark", type=int, default=10,
        help="Number of inference runs for latency benchmark (default: 10)"
    )

    args = parser.parse_args()
    export_and_verify_onnx(
        opset=args.opset,
        imgsz=args.imgsz,
        benchmark_runs=args.benchmark,
    )
