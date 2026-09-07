"""
PyTorch Transfer Learning Classifier Script  v2.0
==================================================
Fine-tunes a CNN for fine-grained waste material recognition.
New in v2.0:
  - EfficientNet-B2 backbone (via timm) — best accuracy/speed trade-off
  - 11 output classes: 9 original + Soft Plastic/Bag + Uncertain/Other
  - Weighted CrossEntropyLoss to handle class imbalance (plastic: 2213, organic: 8)
  - Label smoothing (0.1) prevents overconfidence
  - MixUp augmentation for generalisation
  - Two-phase: frozen backbone warm-up then full cosine-LR fine-tune
  - WeightedRandomSampler oversamples rare classes each epoch
  - Per-class accuracy printed after training

HOW TO RUN (from project root):
  python training/train_classifier.py
  python training/train_classifier.py --arch efficientnet_b2 --epochs 30
  python training/train_classifier.py --epochs 5 --batch_size 16  # smoke test

OUTPUT:
  backend/weights/v2.0/classifier_waste.pth  (best val-acc checkpoint)
"""
import argparse
import random
import shutil
import sys
from collections import Counter
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from torchvision import transforms
from PIL import Image
import cv2

try:
    from tqdm import tqdm
except ImportError:
    def tqdm(x, **_): return x


# ── Class taxonomy (v2.0: 11 classes) ───────────────────────────────────────
CLASSES = [
    "Cardboard",                # 0
    "Glass Bottle",             # 1
    "Metal Can",                # 2
    "Paper",                    # 3
    "Plastic Bottle (PET)",     # 4
    "Plastic Container (HDPE)", # 5
    "Organic Waste",            # 6
    "Electronic Waste",         # 7
    "General Trash",            # 8
    "Soft Plastic / Bag",       # 9  NEW in v2.0
    "Uncertain / Other",        # 10 NEW in v2.0 (open-set catch-all)
]
NUM_CLASSES = len(CLASSES)

# YOLO detection class index -> Classifier class index
YOLO_TO_CLASSIFIER_MAP = {
    0: 4,  # plastic   -> Plastic Bottle (PET)
    1: 3,  # paper     -> Paper
    2: 0,  # cardboard -> Cardboard
    3: 1,  # glass     -> Glass Bottle
    4: 2,  # metal     -> Metal Can
    5: 6,  # organic   -> Organic Waste
    6: 7,  # e_waste   -> Electronic Waste
    7: 8,  # other     -> General Trash
}


# ── MixUp augmentation ───────────────────────────────────────────────────────
def mixup_data(x, y, alpha=0.3):
    lam = np.random.beta(alpha, alpha) if alpha > 0 else 1.0
    idx = torch.randperm(x.size(0), device=x.device)
    return lam * x + (1 - lam) * x[idx], y, y[idx], lam

def mixup_criterion(criterion, pred, y_a, y_b, lam):
    return lam * criterion(pred, y_a) + (1 - lam) * criterion(pred, y_b)


class WasteCropDataset(Dataset):
    """Dynamically extracts and augments bounding box crops from detection dataset"""

    def __init__(self, images_dir: Path, labels_dir: Path, transform=None):
        self.samples = []
        self.transform = transform

        if not images_dir.exists() or not labels_dir.exists():
            return

        for lbl_file in labels_dir.glob("*.txt"):
            img_file = images_dir / f"{lbl_file.stem}.jpg"
            if not img_file.exists():
                img_file = images_dir / f"{lbl_file.stem}.png"
            if not img_file.exists():
                continue

            with open(lbl_file, "r") as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) == 5:
                        cls_id = int(parts[0])
                        cx, cy, w, h = map(float, parts[1:])
                        mapped_cls = YOLO_TO_CLASSIFIER_MAP.get(cls_id, 8)
                        self.samples.append((str(img_file), (cx, cy, w, h), mapped_cls))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, (cx, cy, bw, bh), label = self.samples[idx]
        image = cv2.imread(img_path)
        if image is None:
            return torch.zeros((3, 224, 224)), label

        h, w, _ = image.shape
        x1 = max(0, int((cx - bw / 2) * w))
        y1 = max(0, int((cy - bh / 2) * h))
        x2 = min(w, int((cx + bw / 2) * w))
        y2 = min(h, int((cy + bh / 2) * h))

        crop = image[y1:y2, x1:x2]
        if crop.size == 0 or crop.shape[0] < 5 or crop.shape[1] < 5:
            crop = cv2.resize(image, (224, 224))
        else:
            crop = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)

        pil_img = Image.fromarray(crop)
        if self.transform:
            return self.transform(pil_img), label
        return transforms.ToTensor()(pil_img), label


# ── Model factory ────────────────────────────────────────────────────────────
def get_model(architecture: str, num_classes: int) -> nn.Module:
    """
    efficientnet_b2 -- v2.0 default (260x260 native, ~9M params, best accuracy/speed)
    mobilenet_v3    -- v1.0 (224x224, ~2.5M params, fastest on CPU)
    resnet18        -- baseline (224x224, ~11M params)
    """
    if architecture == "efficientnet_b2":
        try:
            import timm
            model = timm.create_model("efficientnet_b2", pretrained=True, num_classes=num_classes)
            print("[Model] EfficientNet-B2 loaded via timm (ImageNet pretrained)")
        except ImportError:
            print("[Model] timm not found. Run: pip install timm  (falling back to EfficientNet-B0)")
            from torchvision import models
            model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
            model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    elif architecture == "mobilenet_v3":
        from torchvision import models
        model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
        model.classifier[3] = nn.Linear(model.classifier[3].in_features, num_classes)
    elif architecture == "resnet18":
        from torchvision import models
        model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        model.fc = nn.Linear(model.fc.in_features, num_classes)
    else:
        raise ValueError(f"Unsupported architecture: {architecture}")
    return model


def freeze_backbone(model: nn.Module, arch: str):
    """Freeze backbone; keep classification head trainable for Phase 1."""
    head_key = {"efficientnet_b2": "classifier", "mobilenet_v3": "classifier", "resnet18": "fc"}.get(arch, "classifier")
    for name, p in model.named_parameters():
        if head_key not in name:
            p.requires_grad = False


def unfreeze_all(model: nn.Module):
    for p in model.parameters():
        p.requires_grad = True


def compute_class_weights(dataset) -> torch.Tensor:
    """Inverse-frequency weights; capped at 20x to avoid numerical instability."""
    counts = Counter(s[2] for s in dataset.samples)
    n_total = sum(counts.values())
    weights = []
    print("[Weights] Class loss weights:")
    for i, cls_name in enumerate(CLASSES):
        cnt = counts.get(i, 1)
        w = min(20.0, n_total / (NUM_CLASSES * cnt))
        weights.append(w)
        print(f"  [{i:2d}] {cls_name:<30s}  cnt={counts.get(i,0):5d}  w={w:.2f}")
    return torch.tensor(weights, dtype=torch.float32)


def get_input_size(arch: str) -> int:
    return 260 if arch == "efficientnet_b2" else 224


def run_epoch(model, loader, criterion, optimizer, device, training: bool, use_mixup: bool):
    model.train() if training else model.eval()
    total_loss, correct, total = 0.0, 0, 0
    all_preds, all_labels = [], []
    with torch.set_grad_enabled(training):
        for images, labels in tqdm(loader, desc="  Train" if training else "  Val  ", leave=False):
            images, labels = images.to(device), labels.to(device)
            if training and use_mixup and random.random() < 0.5:
                mx, ya, yb, lam = mixup_data(images, labels)
                out = model(mx)
                loss = mixup_criterion(criterion, out, ya, yb, lam)
            else:
                out = model(images)
                loss = criterion(out, labels)
            if training:
                optimizer.zero_grad()
                loss.backward()
                nn.utils.clip_grad_norm_(model.parameters(), 5.0)
                optimizer.step()
            _, preds = torch.max(out, 1)
            total_loss += loss.item() * images.size(0)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    return total_loss / max(total, 1), 100.0 * correct / max(total, 1), all_preds, all_labels


def print_per_class_accuracy(preds, labels):
    print("\n[Results] Per-class validation accuracy:")
    per = {i: [0, 0] for i in range(NUM_CLASSES)}
    for p, l in zip(preds, labels):
        per[l][1] += 1
        if p == l:
            per[l][0] += 1
    for i, cls_name in enumerate(CLASSES):
        corr, tot = per[i]
        if tot > 0:
            acc = 100.0 * corr / tot
            print(f"  [{i:2d}] {cls_name:<30s}  {corr}/{tot}  ({acc:.1f}%)")
        else:
            print(f"  [{i:2d}] {cls_name:<30s}  no val samples")


def train_classifier(args):
    torch.manual_seed(42); np.random.seed(42); random.seed(42)
    use_cuda = torch.cuda.is_available() and args.device != "cpu"
    device = torch.device("cuda" if use_cuda else "cpu")
    print(f"[Classifier] Device: {device}")
    if device.type == "cuda":
        print(f"[Classifier] GPU: {torch.cuda.get_device_name(0)}")

    project_root = Path(__file__).resolve().parent.parent
    det_dir = project_root / "training" / "dataset" / "detection"
    input_size = get_input_size(args.arch)
    print(f"[Classifier] Arch: {args.arch}  Input: {input_size}x{input_size}  Classes: {args.num_classes}")

    # ── Transforms ──────────────────────────────────────────────────────────
    train_tf = transforms.Compose([
        transforms.Resize((input_size + 20, input_size + 20)),
        transforms.RandomCrop(input_size),
        transforms.RandomHorizontalFlip(0.5),
        transforms.RandomVerticalFlip(0.15),
        transforms.RandomRotation(20),
        transforms.ColorJitter(0.3, 0.3, 0.2, 0.05),
        transforms.RandomGrayscale(0.05),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.2, scale=(0.02, 0.15)),
    ])
    val_tf = transforms.Compose([
        transforms.Resize((input_size, input_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    # ── Datasets ────────────────────────────────────────────────────────────
    train_ds = WasteCropDataset(det_dir / "images" / "train", det_dir / "labels" / "train", train_tf)
    val_ds   = WasteCropDataset(det_dir / "images" / "val",   det_dir / "labels" / "val",   val_tf)
    print(f"[Classifier] Train: {len(train_ds)} crops  |  Val: {len(val_ds)} crops")
    if len(train_ds) == 0:
        print("[Classifier] No samples found. Run: python training/prepare_datasets.py")
        sys.exit(1)

    # ── Weighted sampler ─────────────────────────────────────────────────────
    class_weights  = compute_class_weights(train_ds)
    sample_weights = [class_weights[s[2]].item() for s in train_ds.samples]
    sampler = WeightedRandomSampler(sample_weights, len(sample_weights), replacement=True)
    pin = device.type == "cuda"
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, sampler=sampler, num_workers=0, pin_memory=pin)
    val_loader   = DataLoader(val_ds,   batch_size=args.batch_size, shuffle=False,   num_workers=0, pin_memory=pin)

    # ── Loss (weighted CE + label smoothing) ─────────────────────────────────
    criterion = nn.CrossEntropyLoss(weight=class_weights.to(device), label_smoothing=0.1)

    output_path = Path(args.output)
    if not output_path.is_absolute():
        output_path = (project_root / output_path).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_best   = output_path.with_suffix(".best_tmp.pth")
    best_acc   = 0.0
    start_fine_ep = 0
    saved_opt_state = None
    saved_sched_state = None
    final_preds, final_labels = [], []

    resumed = False
    if args.resume:
        checkpoint_target = tmp_best if tmp_best.exists() else (output_path if output_path.exists() else None)
        if checkpoint_target:
            print(f"\n[Classifier] Resuming from checkpoint: {checkpoint_target}")
            try:
                loaded = torch.load(checkpoint_target, map_location=device, weights_only=False)
                if isinstance(loaded, dict) and "model" in loaded:
                    model = loaded["model"]
                    start_fine_ep = loaded.get("epoch", 0)
                    best_acc = loaded.get("best_acc", 0.0)
                    saved_opt_state = loaded.get("optimizer_state")
                    saved_sched_state = loaded.get("scheduler_state")
                    print(f"[Classifier] Resumed from Epoch {start_fine_ep} with Best Val Acc: {best_acc:.2f}%")
                else:
                    model = loaded
                    start_fine_ep = 10
                    print(f"[Classifier] Loaded raw model weights. Continuing from Epoch {start_fine_ep}.")
                resumed = True
            except Exception as e:
                print(f"[Classifier] Failed to load checkpoint ({e}). Starting fresh.")

    if not resumed:
        # ── Model ────────────────────────────────────────────────────────────────
        model = get_model(args.arch, args.num_classes).to(device)

        # ── Phase 1: Frozen backbone head warm-up ────────────────────────────────
        freeze_ep = min(5, max(1, args.epochs // 4))
        freeze_backbone(model, args.arch)
        head_params = [p for p in model.parameters() if p.requires_grad]
        opt_head = torch.optim.AdamW(head_params, lr=args.lr * 10, weight_decay=1e-4)
        print(f"\n[Phase 1] Frozen backbone  {freeze_ep} warm-up epochs  (head lr={args.lr * 10:.5f})")
        for ep in range(1, freeze_ep + 1):
            tr_loss, tr_acc, _, _ = run_epoch(model, train_loader, criterion, opt_head, device, True, False)
            print(f"  Epoch [{ep:02d}/{freeze_ep:02d}]  Loss: {tr_loss:.4f}  Acc: {tr_acc:.2f}%")
        fine_ep = args.epochs - freeze_ep
    else:
        fine_ep = max(start_fine_ep + 5, args.epochs - 5)

    # ── Phase 2: Full fine-tune + cosine LR ──────────────────────────────────
    unfreeze_all(model)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    if saved_opt_state is not None:
        try:
            optimizer.load_state_dict(saved_opt_state)
        except Exception:
            pass

    T0 = max(8, fine_ep // 2)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingWarmRestarts(
                    optimizer, T_0=T0, T_mult=1, eta_min=1e-6)
    if saved_sched_state is not None:
        try:
            scheduler.load_state_dict(saved_sched_state)
        except Exception:
            pass

    print(f"\n[Phase 2] Full fine-tune  Epoch [{start_fine_ep + 1:02d}/{fine_ep:02d}]  (lr={args.lr:.5f}  cosine T0={T0})")
    for ep in range(start_fine_ep + 1, fine_ep + 1):
        tr_loss, tr_acc, _, _           = run_epoch(model, train_loader, criterion, optimizer, device, True,  True)
        vl_loss, vl_acc, vl_p, vl_l    = run_epoch(model, val_loader,   criterion, None,      device, False, False)
        scheduler.step(ep)
        lr_now = optimizer.param_groups[0]["lr"]
        best_tag = ""
        if vl_acc > best_acc:
            best_acc = vl_acc
            # Save checkpoint dictionary with metadata for clean resumption
            checkpoint_bundle = {
                "epoch": ep,
                "model": model,
                "best_acc": best_acc,
                "optimizer_state": optimizer.state_dict(),
                "scheduler_state": scheduler.state_dict()
            }
            torch.save(checkpoint_bundle, str(tmp_best))
            best_tag = "  BEST"
            final_preds, final_labels = vl_p, vl_l
        print(f"  Epoch [{ep:02d}/{fine_ep:02d}]  "
              f"Train {tr_loss:.4f}/{tr_acc:.2f}%  "
              f"Val {vl_loss:.4f}/{vl_acc:.2f}%  "
              f"lr={lr_now:.6f}{best_tag}")

    # ── Save best checkpoint as clean model object for backend inference ──────
    if tmp_best.exists():
        loaded_final = torch.load(tmp_best, map_location="cpu", weights_only=False)
        final_model = loaded_final["model"] if isinstance(loaded_final, dict) and "model" in loaded_final else loaded_final
        torch.save(final_model, str(output_path))
        tmp_best.unlink()
    else:
        torch.save(model, str(output_path))

    print(f"\n[Success] Best val accuracy: {best_acc:.2f}%")
    print(f"[Success] Classifier saved to: {output_path}")
    if final_preds:
        print_per_class_accuracy(final_preds, final_labels)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Train CNN waste classifier  v2.0 — EfficientNet-B2 / 11 classes",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--arch", default="efficientnet_b2",
                        choices=["efficientnet_b2", "mobilenet_v3", "resnet18"],
                        help="Model backbone (default: efficientnet_b2)")
    parser.add_argument("--num_classes", type=int, default=NUM_CLASSES,
                        help=f"Output classes (default: {NUM_CLASSES})")
    parser.add_argument("--epochs", type=int, default=30,
                        help="Total epochs incl. frozen phase (default: 30)")
    parser.add_argument("--batch_size", type=int, default=32,
                        help="Batch size — reduce to 16 if GPU OOM (default: 32)")
    parser.add_argument("--lr", type=float, default=3e-4,
                        help="Base LR for fine-tune phase (default: 3e-4)")
    parser.add_argument("--device", default="auto",
                        help="Device: auto | cpu | cuda (default: auto)")
    parser.add_argument("--output", default="backend/weights/v2.0/classifier_waste.pth",
                        help="Output path for saved model")
    parser.add_argument("--resume", action="store_true", default=False,
                        help="Resume fine-tuning from last saved checkpoint (.best_tmp.pth or output path)")
    args = parser.parse_args()
    train_classifier(args)
