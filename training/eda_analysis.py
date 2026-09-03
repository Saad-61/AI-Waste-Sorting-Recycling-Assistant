import json
from pathlib import Path
from collections import Counter

CLASSES = ["plastic", "paper", "cardboard", "glass", "metal", "organic", "e_waste", "other"]


def generate_eda_report(base_dir: Path, output_file: Path):
    labels_dir = base_dir / "labels"
    images_dir = base_dir / "images"

    summary = {
        "splits": {},
        "class_frequencies": {c: 0 for c in CLASSES},
        "total_instances": 0,
        "total_images": 0,
        "bbox_aspect_ratios": {
            "mean_aspect_ratio": 0.0,
            "min_aspect_ratio": 0.0,
            "max_aspect_ratio": 0.0
        }
    }

    aspect_ratios = []

    for split in ["train", "val", "test"]:
        lbl_split = labels_dir / split
        img_split = images_dir / split

        img_count = len([p for p in img_split.glob("*.*")]) if img_split.exists() else 0
        split_counter = Counter()

        if lbl_split.exists():
            for lbl_file in lbl_split.glob("*.txt"):
                with open(lbl_file, "r") as f:
                    for line in f:
                        parts = line.strip().split()
                        if parts and len(parts) == 5:
                            cls_id = int(parts[0])
                            w = float(parts[3])
                            h = float(parts[4])
                            if h > 0:
                                aspect_ratios.append(w / h)

                            if 0 <= cls_id < len(CLASSES):
                                label_name = CLASSES[cls_id]
                                split_counter[label_name] += 1
                                summary["class_frequencies"][label_name] += 1
                                summary["total_instances"] += 1

        summary["splits"][split] = {
            "images": img_count,
            "instances": sum(split_counter.values()),
            "breakdown": dict(split_counter)
        }
        summary["total_images"] += img_count

    if aspect_ratios:
        summary["bbox_aspect_ratios"] = {
            "mean_aspect_ratio": round(sum(aspect_ratios) / len(aspect_ratios), 3),
            "min_aspect_ratio": round(min(aspect_ratios), 3),
            "max_aspect_ratio": round(max(aspect_ratios), 3)
        }

    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, "w") as f:
        json.dump(summary, f, indent=2)

    print(f"[EDA Complete] Dataset Summary successfully written to {output_file}")
    print(json.dumps(summary, indent=2))
    return summary


if __name__ == "__main__":
    generate_eda_report(
        Path("training/dataset/detection"),
        Path("training/dataset/dataset_summary.json")
    )
