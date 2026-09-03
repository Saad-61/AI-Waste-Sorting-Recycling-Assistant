"""
PyTorch Transfer Learning Classifier Script (MobileNetV3 / ResNet)
Fine-tunes material & contamination classification on waste crops.
"""
import argparse
from pathlib import Path
import torch
import torch.nn as nn
from torchvision import models, datasets, transforms


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

    num_classes = args.num_classes
    model = get_model(args.arch, num_classes).to(device)

    print(f"[Classifier] Initialized {args.arch} for {num_classes} classes.")
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Save initial structure
    torch.save(model, str(output_path))
    print(f"[Classifier] Model checkpoint saved to {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train CNN waste material classifier")
    parser.add_argument("--arch", type=str, default="mobilenet_v3", choices=["mobilenet_v3", "resnet18"])
    parser.add_argument("--num_classes", type=int, default=9)
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--device", type=str, default="0")
    parser.add_argument("--output", type=str, default="../backend/weights/classifier_waste.pth")

    args = parser.parse_args()
    train_classifier(args)
