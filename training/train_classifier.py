"""
PyTorch Transfer Learning Classifier Script (MobileNetV3 / ResNet)
Fine-tunes material & contamination classification on waste crops from detection dataset.
"""
import argparse
import sys
from pathlib import Path
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
from PIL import Image
import cv2


CLASSES = [
    "Cardboard",
    "Glass Bottle",
    "Metal Can",
    "Paper",
    "Plastic Bottle (PET)",
    "Plastic Container (HDPE)",
    "Organic Waste",
    "Electronic Waste",
    "General Trash"
]

# Map YOLO detection class indices (0..7) to Classifier indices (0..8)
YOLO_TO_CLASSIFIER_MAP = {
    0: 4,  # plastic -> Plastic Bottle (PET)
    1: 3,  # paper -> Paper
    2: 0,  # cardboard -> Cardboard
    3: 1,  # glass -> Glass Bottle
    4: 2,  # metal -> Metal Can
    5: 6,  # organic -> Organic Waste
    6: 7,  # e_waste -> Electronic Waste
    7: 8,  # other -> General Trash
}


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


def get_model(architecture: str, num_classes: int):
    if architecture == "mobilenet_v3":
        model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
        in_features = model.classifier[3].in_features
        model.classifier[3] = nn.Linear(in_features, num_classes)
    elif architecture == "resnet18":
        model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        in_features = model.fc.in_features
        model.fc = nn.Linear(in_features, num_classes)
    else:
        raise ValueError(f"Unsupported architecture: {architecture}")
    return model


def train_classifier(args):
    device = torch.device("cuda" if torch.cuda.is_available() and args.device != "cpu" else "cpu")
    print(f"[Classifier] Training on device: {device}")

    project_root = Path(__file__).resolve().parent.parent
    detection_dir = project_root / "training" / "dataset" / "detection"
    train_images = detection_dir / "images" / "train"
    train_labels = detection_dir / "labels" / "train"

    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    dataset = WasteCropDataset(train_images, train_labels, transform=train_transform)
    print(f"[Classifier] Extracted {len(dataset)} waste crop instances for training.")

    if len(dataset) == 0:
        print("[Classifier] No crop samples found. Ensure prepare_datasets.py was executed.")
        return

    loader = DataLoader(dataset, batch_size=args.batch_size, shuffle=True, num_workers=0)

    model = get_model(args.arch, args.num_classes).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)

    print(f"\n[Classifier] Starting training ({args.epochs} epochs)...")
    model.train()
    for epoch in range(1, args.epochs + 1):
        total_loss = 0.0
        correct = 0
        total = 0

        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

        epoch_loss = total_loss / max(total, 1)
        epoch_acc = (correct / max(total, 1)) * 100
        print(f"  Epoch [{epoch:02d}/{args.epochs:02d}] Loss: {epoch_loss:.4f} | Accuracy: {epoch_acc:.2f}%")

    output_path = Path(args.output)
    if not output_path.is_absolute():
        output_path = (project_root / output_path).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    torch.save(model, str(output_path))
    print(f"\n[Success] Trained Classifier saved to: {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train CNN waste material classifier on crops")
    parser.add_argument("--arch", type=str, default="mobilenet_v3", choices=["mobilenet_v3", "resnet18"])
    parser.add_argument("--num_classes", type=int, default=9)
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=5e-4)
    parser.add_argument("--device", type=str, default="0")
    parser.add_argument("--output", type=str, default="backend/weights/classifier_waste.pth")

    args = parser.parse_args()
    train_classifier(args)

