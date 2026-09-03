import os
from pathlib import Path
from PIL import Image

TAXONOMY = {
    0: "plastic",
    1: "paper",
    2: "cardboard",
    3: "glass",
    4: "metal",
    5: "organic",
    6: "e_waste",
    7: "other"
}

VALID_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def validate_and_clean_detection_data(base_dir: Path):
    images_dir = base_dir / "images"
    labels_dir = base_dir / "labels"

    stats = {
        "inspected": 0,
        "corrupt_images": 0,
        "fixed_boxes": 0,
        "dropped_boxes": 0,
        "orphans": 0
    }

    for split in ["train", "val", "test"]:
        img_split = images_dir / split
        lbl_split = labels_dir / split

        if not img_split.exists():
            continue

        lbl_split.mkdir(parents=True, exist_ok=True)

        for img_path in list(img_split.iterdir()):
            if img_path.suffix.lower() not in VALID_IMAGE_EXTS:
                continue

            stats["inspected"] += 1
            # 1. Image Integrity Check
            try:
                with Image.open(img_path) as img:
                    img.verify()
                # Reopen to check channels (verify closes file descriptor)
                with Image.open(img_path) as img:
                    if img.mode not in ("RGB", "L"):
                        img.convert("RGB").save(img_path)
            except Exception as e:
                print(f"[Corrupt Image Dropped] {img_path}: {e}")
                img_path.unlink(missing_ok=True)
                lbl_path = lbl_split / f"{img_path.stem}.txt"
                lbl_path.unlink(missing_ok=True)
                stats["corrupt_images"] += 1
                continue

            # 2. Label Alignment Check
            lbl_path = lbl_split / f"{img_path.stem}.txt"
            if not lbl_path.exists():
                # Create empty label file for background images
                lbl_path.touch()
                stats["orphans"] += 1
                continue

            # 3. Bounding Box Boundary & Class ID Checks
            valid_lines = []
            with open(lbl_path, "r") as f:
                lines = f.readlines()

            for line in lines:
                parts = line.strip().split()
                if len(parts) != 5:
                    stats["dropped_boxes"] += 1
                    continue

                try:
                    cls_id = int(parts[0])
                    xc, yc, w, h = map(float, parts[1:])
                except ValueError:
                    stats["dropped_boxes"] += 1
                    continue

                if cls_id not in TAXONOMY:
                    stats["dropped_boxes"] += 1
                    continue

                # Clamp coordinate values strictly to [0.0, 1.0]
                clamped_xc = max(0.0, min(1.0, xc))
                clamped_yc = max(0.0, min(1.0, yc))
                clamped_w = max(0.001, min(1.0, w))
                clamped_h = max(0.001, min(1.0, h))

                if (clamped_xc, clamped_yc, clamped_w, clamped_h) != (xc, yc, w, h):
                    stats["fixed_boxes"] += 1

                valid_lines.append(f"{cls_id} {clamped_xc:.6f} {clamped_yc:.6f} {clamped_w:.6f} {clamped_h:.6f}\n")

            with open(lbl_path, "w") as f:
                f.writelines(valid_lines)

    print(f"[Scrubbing Complete] Stats: {stats}")
    return stats


if __name__ == "__main__":
    base_path = Path("training/dataset/detection")
    validate_and_clean_detection_data(base_path)
