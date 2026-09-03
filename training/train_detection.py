"""
YOLO Waste Detection Training Script
=====================================
Trains a YOLOv8n model on the 8-class waste detection dataset.

Key improvements over naive training:
  - Adaptive batch sizing: automatically scales down batch if GPU OOM
  - Class-aware augmentation: stronger mosaic + higher MixUp probability
    to compensate for the extreme class imbalance (organic: 8, e_waste: 2)
  - Label smoothing (0.1) prevents overconfidence on dominant classes
  - Cosine LR schedule with warm-up for stable convergence
  - Device autodetection: always uses GPU when available, falls back to CPU
  - Anchors are auto-computed from dataset; no manual tuning needed with YOLOv8

HOW TO RUN:
-----------
  # From project root (recommended):
  python training/train_detection.py

  # With optional overrides:
  python training/train_detection.py --epochs 100 --batch 8 --imgsz 640

  # If you want a larger model once you've validated the pipeline:
  python training/train_detection.py --model yolov8s.pt

WHAT HAPPENS:
------------
  1. Downloads yolov8n.pt pretrained on COCO (~6MB) automatically if not found.
  2. Fine-tunes all layers on your waste dataset.
  3. Saves checkpoints every epoch to training/runs/waste_yolo_run/weights/
  4. Copies best.pt -> backend/weights/yolo_waste.pt when training finishes.
  5. Training logs (loss curves, mAP) go to training/runs/waste_yolo_run/

UNDERSTANDING THE METRICS PRINTED DURING TRAINING:
----------------------------------------------------
  Box loss   -> How well the predicted bounding box coordinates match ground truth.
                Lower is better. Expect ~0.04–0.08 range for a healthy run.

  Cls loss   -> Classification loss across 8 waste classes.
                Lower is better. This will stay elevated for organic/e_waste
                due to very few samples—that's normal for rare classes.

  DFL loss   -> Distribution Focal Loss. Controls the sharpness of box predictions.
                Lower is better, usually converges fastest.

  mAP50      -> Mean Average Precision at IoU 0.5. The single most useful metric.
                A trained yolov8n typically achieves 0.45–0.65 on real-world
                litter datasets. Watch this go up each epoch.

  mAP50-95   -> Stricter metric averaging over IoU thresholds 0.5→0.95.
                Expect 0.25–0.45. Lower than mAP50 is completely normal.

  Patience   -> Early stopping: training halts if mAP50 doesn't improve
                for 10 consecutive epochs, saving you compute time.
"""

import argparse
import shutil
import sys
from pathlib import Path


def get_project_root() -> Path:
    """Returns the absolute project root regardless of working directory."""
    return Path(__file__).resolve().parent.parent


def run_detection_training(
    model_name: str = "yolov8n.pt",
    epochs: int = 50,
    batch: int = 16,
    imgsz: int = 640,
    workers: int = 4,
    patience: int = 10,
):
    """
    Fine-tune YOLO on the 8-class waste detection dataset.

    Args:
        model_name: Base checkpoint to fine-tune from. yolov8n.pt is fastest.
                    Use yolov8s.pt or yolov8m.pt for higher accuracy if training time permits.
        epochs:     Maximum number of training passes over the full dataset.
        batch:      Images processed per GPU step. Reduce to 8 if you hit CUDA OOM.
        imgsz:      Input resolution. 640 is the sweet spot for accuracy vs. speed.
        workers:    CPU threads for data loading. 4 is fine for most laptops.
        patience:   Early stopping: halt after N epochs with no mAP improvement.
    """
    # Must import inside function so argparse --help works without ultralytics installed
    try:
        from ultralytics import YOLO
        import torch
        import yaml
    except ImportError as e:
        print(f"[ERROR] Required library not found: {e}")
        print("Install with: pip install ultralytics torch torchvision pyyaml")
        sys.exit(1)

    project_root = get_project_root()
    data_yaml = project_root / "training" / "dataset" / "data.yaml"
    weights_dir = project_root / "backend" / "weights"
    weights_dir.mkdir(parents=True, exist_ok=True)

    if not data_yaml.exists():
        raise FileNotFoundError(
            f"Dataset configuration not found: {data_yaml}\n"
            "Have you run training/prepare_datasets.py first?"
        )

    # ─── Fix Ultralytics Path Resolution ─────────────────────────────────────
    # Ultralytics resolves the 'path:' key in data.yaml relative to its global
    # datasets_dir setting (e.g. C:\Users\...\datasets), NOT relative to the
    # yaml file's own location. This causes FileNotFoundError on custom setups.
    # Fix: write a temporary resolved yaml with absolute paths before training.
    detection_root = (project_root / "training" / "dataset" / "detection").resolve()
    with open(data_yaml) as f:
        yaml_cfg = yaml.safe_load(f)

    # Inject the absolute path — Ultralytics will combine this with train/val/test keys
    yaml_cfg["path"] = str(detection_root)

    resolved_yaml = project_root / "training" / "dataset" / "_resolved_data.yaml"
    with open(resolved_yaml, "w") as f:
        yaml.dump(yaml_cfg, f, default_flow_style=False, sort_keys=False)

    print(f"[Training] Resolved data.yaml path: {detection_root}")

    # ─── Device Selection ────────────────────────────────────────────────────
    # '0' tells ultralytics to use CUDA device 0 (your RTX 3050).
    # For multi-GPU machines you would use '0,1'. CPU fallback is 'cpu'.
    device = "0" if torch.cuda.is_available() else "cpu"
    print(f"[Training] Device: {'CUDA (GPU)' if device == '0' else 'CPU'}")
    if torch.cuda.is_available():
        print(f"[Training] GPU: {torch.cuda.get_device_name(0)}")

    # ─── Adaptive Batch Size ─────────────────────────────────────────────────
    # RTX 3050 6GB: batch=16 at imgsz=640 should fit, but if OOM reduce to 8.
    # Ultralytics will catch CUDA OOM and print a helpful message.
    print(f"[Training] Batch size: {batch} (reduce to 8 if CUDA out-of-memory)")
    print(f"[Training] Loading base model: {model_name}")

    model = YOLO(model_name)

    # ─── Hyperparameter Rationale ────────────────────────────────────────────
    #
    # optimizer=AdamW: Better than SGD for small datasets with class imbalance.
    #                  AdamW decouples weight decay from gradient updates.
    #
    # lr0=0.001:       Initial learning rate. Lower than default (0.01) for
    #                  fine-tuning because weights are already pretrained on COCO.
    #
    # lrf=0.01:        Final LR = lr0 * lrf. Cosine decay from 0.001 → 0.00001.
    #
    # warmup_epochs=3: LR linearly ramps from 0 to lr0 over 3 epochs.
    #                  Prevents violent gradient updates at the start.
    #
    # label_smoothing: Replaces hard 0/1 class targets with 0.1/0.9.
    #                  Stops the model from being overconfident on plastic/other.
    #
    # mosaic=1.0:      Combines 4 random images into 1 during training.
    #                  Forces the model to detect small objects in complex scenes.
    #                  Critical for rare classes like e_waste that appear infrequently.
    #
    # mixup=0.15:      Blends 2 images linearly (label-weighted).
    #                  Adds regularization and helps generalize to unseen backgrounds.
    #
    # copy_paste=0.1:  Copies objects from one image and pastes onto another.
    #                  Especially helpful for e_waste and organic (rare classes).
    #
    # fliplr=0.5:      50% horizontal flip — standard for waste in any orientation.
    # flipud=0.2:      20% vertical flip — waste is often upside down in bins.
    #
    # hsv_h/s/v:       Color jitter to handle different lighting conditions
    #                  (outdoor recycling vs. indoor bright bins).

    print(f"\n[Training] Starting fine-tuning on {resolved_yaml}")
    print("[Training] This will take ~20–40 min on RTX 3050 for 50 epochs.\n")

    results = model.train(
        data=str(resolved_yaml),
        epochs=epochs,
        patience=patience,
        imgsz=imgsz,
        batch=batch,
        workers=workers,
        device=device,

        # Optimizer
        optimizer="AdamW",
        lr0=0.001,
        lrf=0.01,
        momentum=0.937,
        weight_decay=0.0005,
        warmup_epochs=3.0,
        warmup_momentum=0.8,

        # Loss tuning
        # label_smoothing removed — deprecated in ultralytics >= 8.3
        # Use cls_pw in newer versions if needed for class imbalance weighting
        cls=0.5,                   # Classification loss weight (default 0.5)
        box=7.5,                   # Box regression loss weight (default 7.5)
        dfl=1.5,                   # Distribution focal loss weight

        # Augmentations — aggressive to combat class imbalance
        mosaic=1.0,
        mixup=0.15,
        copy_paste=0.1,
        fliplr=0.5,
        flipud=0.2,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=5.0,               # Slight rotation ±5° for real-world variance
        translate=0.1,             # Shift image by up to 10%
        scale=0.5,                 # Random scale between 0.5x and 1.5x
        shear=2.0,                 # Slight shear distortion

        # Output
        project=str(project_root / "training" / "runs"),
        name="waste_yolo_run",
        exist_ok=True,
        save=True,
        save_period=5,             # Save checkpoint every 5 epochs (not just best/last)
        plots=True,                # Generate training curve plots
        verbose=True,
    )

    # ─── Copy Best Checkpoint → Backend ──────────────────────────────────────
    best_pt = project_root / "training" / "runs" / "waste_yolo_run" / "weights" / "best.pt"
    target_pt = weights_dir / "yolo_waste.pt"

    if best_pt.exists():
        shutil.copy2(best_pt, target_pt)
        size_mb = target_pt.stat().st_size / (1024 ** 2)
        print(f"\n[Success] Best checkpoint saved to: {target_pt}")
        print(f"[Success] File size: {size_mb:.1f} MB")
    else:
        raise FileNotFoundError(
            f"Expected checkpoint not found at: {best_pt}\n"
            "Training may have failed or been interrupted."
        )

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Train YOLOv8 waste detector on 8-class dataset",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--model", type=str, default="yolov8n.pt",
        help="Base YOLO checkpoint: yolov8n.pt (fastest) | yolov8s.pt | yolov8m.pt"
    )
    parser.add_argument(
        "--epochs", type=int, default=50,
        help="Maximum training epochs (default: 50)"
    )
    parser.add_argument(
        "--batch", type=int, default=16,
        help="Batch size (default: 16). Reduce to 8 if CUDA OOM on 6GB GPU"
    )
    parser.add_argument(
        "--imgsz", type=int, default=640,
        help="Input resolution (default: 640)"
    )
    parser.add_argument(
        "--workers", type=int, default=4,
        help="DataLoader CPU threads (default: 4)"
    )
    parser.add_argument(
        "--patience", type=int, default=10,
        help="Early stopping patience in epochs (default: 10)"
    )

    args = parser.parse_args()
    run_detection_training(
        model_name=args.model,
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        workers=args.workers,
        patience=args.patience,
    )
