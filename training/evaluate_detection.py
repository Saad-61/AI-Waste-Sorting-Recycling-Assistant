"""
YOLO Waste Detection Evaluation Script
========================================
Evaluates the trained YOLOv8 detector on the held-out TEST split.
Saves per-class precision/recall/mAP metrics to training/evaluation_results.json.

HOW TO RUN:
-----------
  # From project root, run AFTER training is complete:
  python training/evaluate_detection.py

  # Optional: test against a specific checkpoint
  python training/evaluate_detection.py --weights backend/weights/yolo_waste.pt

UNDERSTANDING THE OUTPUT METRICS:
----------------------------------
  Precision (P):
      Of all the boxes the model predicted, what fraction were correct?
      Example: Precision=0.80 means 80% of predicted "plastic" boxes
      actually contained plastic. False positives drag this down.

  Recall (R):
      Of all real objects in the images, what fraction did the model find?
      Example: Recall=0.70 means the model missed 30% of real waste items.
      False negatives drag this down.

  mAP@50 (mean Average Precision at IoU 0.5):
      The primary detection metric. A predicted box is counted as correct
      if it overlaps the ground truth by at least 50% (IoU threshold).
      Averaged across all 8 classes. Higher = better.
      Ballpark for a trained yolov8n: 0.45–0.65 on this dataset.

  mAP@50:95:
      Stricter version: averages mAP across IoU thresholds 0.5, 0.55, ..., 0.95.
      This punishes slightly misaligned boxes that mAP50 would still count.
      Typically 0.60–0.70x of mAP50. If your mAP50 is 0.55, expect ~0.33–0.38 here.

  Per-class metrics:
      Look carefully at organic and e_waste — they will likely have
      low recall due to very few training samples. This is expected and
      will improve with more data or with the classifier (Module 3).

WHAT FILES GET GENERATED:
--------------------------
  training/evaluation_results.json  -> Structured metrics you can analyze
  training/runs/waste_yolo_eval/     -> Confusion matrix image, PR curves,
                                       F1 curve, prediction samples
"""

import argparse
import json
import sys
from pathlib import Path


CLASSES = ["plastic", "paper", "cardboard", "glass", "metal", "organic", "e_waste", "other"]


def run_evaluation(weights_path: str = None, conf: float = 0.25, iou: float = 0.6):
    """
    Validate the trained model against the test split and save structured results.

    Args:
        weights_path: Path to .pt weights file. Defaults to backend/weights/yolo_waste.pt
        conf:         Confidence threshold for predictions (0.0–1.0).
                      0.25 is standard for evaluation — lower catches more objects
                      but increases false positives.
        iou:          IoU threshold for NMS (Non-Maximum Suppression).
                      0.6 removes duplicate boxes that overlap by >60%.
    """
    try:
        from ultralytics import YOLO
        import torch
    except ImportError as e:
        print(f"[ERROR] {e}")
        sys.exit(1)

    project_root = Path(__file__).resolve().parent.parent
    model_path = Path(weights_path) if weights_path else project_root / "backend" / "weights" / "yolo_waste.pt"
    data_yaml = project_root / "training" / "dataset" / "data.yaml"
    output_json = project_root / "training" / "evaluation_results.json"

    if not model_path.exists():
        raise FileNotFoundError(
            f"Trained model not found at: {model_path}\n"
            "Run training/train_detection.py first."
        )

    if not data_yaml.exists():
        raise FileNotFoundError(f"data.yaml not found at: {data_yaml}")

    device = "0" if torch.cuda.is_available() else "cpu"
    print(f"[Evaluation] Loading model: {model_path}")
    print(f"[Evaluation] Device: {'GPU' if device == '0' else 'CPU'}")
    model = YOLO(str(model_path))

    print("[Evaluation] Running inference on test partition...")
    print("[Evaluation] This evaluates every image in training/dataset/detection/images/test/\n")

    metrics = model.val(
        data=str(data_yaml),
        split="test",                  # Evaluate on held-out test split, not val
        imgsz=640,
        batch=16,
        conf=conf,
        iou=iou,
        device=device,
        plots=True,                    # Generates confusion matrix, PR curve, F1 curve
        save_json=True,                # COCO-format predictions saved to JSON
        project=str(project_root / "training" / "runs"),
        name="waste_yolo_eval",
        exist_ok=True,
        verbose=True,
    )

    # ─── Parse Overall Metrics ────────────────────────────────────────────────
    # metrics.box provides aggregated and per-class results from the val run.
    # mp = mean precision, mr = mean recall, map50 = mAP@0.5, map = mAP@0.5:0.95
    results = {
        "model_path": str(model_path),
        "eval_split": "test",
        "conf_threshold": conf,
        "iou_threshold": iou,
        "overall": {
            "precision": round(float(metrics.box.mp), 4),
            "recall": round(float(metrics.box.mr), 4),
            "map50": round(float(metrics.box.map50), 4),
            "map50_95": round(float(metrics.box.map), 4),
            "f1": round(
                2 * float(metrics.box.mp) * float(metrics.box.mr)
                / max(float(metrics.box.mp) + float(metrics.box.mr), 1e-6), 4
            ),
        },
        "per_class": {},
        "class_imbalance_notes": {
            "organic": "Only 8 training instances. Low recall expected. Consider augmenting.",
            "e_waste": "Only 2 training instances. Metrics unreliable. CNN classifier handles this better.",
        }
    }

    # ─── Per-class Metrics ────────────────────────────────────────────────────
    # metrics.box.p, .r, .ap50, .ap are arrays indexed by class order in data.yaml
    for idx, class_name in enumerate(CLASSES):
        if idx < len(metrics.box.p):
            p = float(metrics.box.p[idx])
            r = float(metrics.box.r[idx])
            f1 = 2 * p * r / max(p + r, 1e-6)
            results["per_class"][class_name] = {
                "precision": round(p, 4),
                "recall": round(r, 4),
                "map50": round(float(metrics.box.ap50[idx]), 4),
                "map50_95": round(float(metrics.box.ap[idx]), 4),
                "f1": round(f1, 4),
            }

    # ─── Save Results ─────────────────────────────────────────────────────────
    with open(output_json, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n[Success] Evaluation results saved to: {output_json}")
    print("\n═══ OVERALL TEST METRICS ═══")
    for k, v in results["overall"].items():
        bar = "█" * int(v * 30)
        print(f"  {k:<12}: {v:.4f}  {bar}")

    print("\n═══ PER-CLASS METRICS ═══")
    print(f"  {'Class':<12} {'P':>6} {'R':>6} {'mAP50':>8} {'mAP50-95':>10}")
    print(f"  {'─'*12} {'─'*6} {'─'*6} {'─'*8} {'─'*10}")
    for cls_name, cls_metrics in results["per_class"].items():
        print(
            f"  {cls_name:<12} "
            f"{cls_metrics['precision']:>6.3f} "
            f"{cls_metrics['recall']:>6.3f} "
            f"{cls_metrics['map50']:>8.3f} "
            f"{cls_metrics['map50_95']:>10.3f}"
        )

    print(f"\n[Info] Confusion matrix and PR curves saved to:")
    print(f"       training/runs/waste_yolo_eval/")

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Evaluate trained YOLO waste detector on the test split",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--weights", type=str, default=None,
        help="Path to .pt weights file (default: backend/weights/yolo_waste.pt)"
    )
    parser.add_argument(
        "--conf", type=float, default=0.25,
        help="Confidence threshold (default: 0.25)"
    )
    parser.add_argument(
        "--iou", type=float, default=0.6,
        help="NMS IoU threshold (default: 0.6)"
    )

    args = parser.parse_args()
    run_evaluation(weights_path=args.weights, conf=args.conf, iou=args.iou)
