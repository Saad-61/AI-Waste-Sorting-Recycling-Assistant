"""
Dataset Preparation & Conversion Script
Converts raw TACO dataset (COCO format) to YOLO detection partitions,
and structures TrashNet + cropped instances into classification partitions.
"""
import json
import shutil
import random
from pathlib import Path
from PIL import Image

# Strict 8-class taxonomy mapping
TACO_TO_8 = {
    0: 4,  # Aluminium foil -> metal
    1: 6,  # Battery -> e_waste
    2: 4,  # Aluminium blister pack -> metal
    3: 7,  # Carded blister pack -> other
    4: 0,  # Other plastic bottle -> plastic
    5: 0,  # Clear plastic bottle -> plastic
    6: 3,  # Glass bottle -> glass
    7: 0,  # Plastic bottle cap -> plastic
    8: 4,  # Metal bottle cap -> metal
    9: 3,  # Broken glass -> glass
    10: 4, # Food Can -> metal
    11: 4, # Aerosol -> metal
    12: 4, # Drink can -> metal
    13: 2, # Toilet tube -> cardboard
    14: 2, # Other carton -> cardboard
    15: 2, # Egg carton -> cardboard
    16: 2, # Drink carton -> cardboard
    17: 2, # Corrugated carton -> cardboard
    18: 2, # Meal carton -> cardboard
    19: 2, # Pizza box -> cardboard
    20: 1, # Paper cup -> paper
    21: 0, # Disposable plastic cup -> plastic
    22: 0, # Foam cup -> plastic
    23: 3, # Glass cup -> glass
    24: 0, # Other plastic cup -> plastic
    25: 5, # Food waste -> organic
    26: 3, # Glass jar -> glass
    27: 0, # Plastic lid -> plastic
    28: 4, # Metal lid -> metal
    29: 0, # Other plastic -> plastic
    30: 1, # Magazine paper -> paper
    31: 1, # Tissues -> paper
    32: 1, # Wrapping paper -> paper
    33: 1, # Normal paper -> paper
    34: 1, # Paper bag -> paper
    35: 7, # Plastified paper bag -> other
    36: 0, # Plastic film -> plastic
    37: 0, # Six pack rings -> plastic
    38: 0, # Garbage bag -> plastic
    39: 0, # Other plastic wrapper -> plastic
    40: 0, # Single-use carrier bag -> plastic
    41: 0, # Polypropylene bag -> plastic
    42: 7, # Crisp packet -> other
    43: 0, # Spread tub -> plastic
    44: 0, # Tupperware -> plastic
    45: 0, # Disposable food container -> plastic
    46: 0, # Foam food container -> plastic
    47: 0, # Other plastic container -> plastic
    48: 0, # Plastic glooves -> plastic
    49: 0, # Plastic utensils -> plastic
    50: 4, # Pop tab -> metal
    51: 7, # Rope & strings -> other
    52: 4, # Scrap metal -> metal
    53: 7, # Shoe -> other
    54: 0, # Squeezable tube -> plastic
    55: 0, # Plastic straw -> plastic
    56: 1, # Paper straw -> paper
    57: 0, # Styrofoam piece -> plastic
    58: 7, # Unlabeled litter -> other
    59: 7  # Cigarette -> other
}

CLASSES = ["plastic", "paper", "cardboard", "glass", "metal", "organic", "e_waste", "other"]


def prepare_detection_dataset(taco_dir: Path, out_dir: Path):
    print("[Detection] Processing TACO dataset...")
    annotations_file = taco_dir / "annotations.json"
    with open(annotations_file, "r") as f:
        coco = json.load(f)

    # Index images and annotations
    images_by_id = {img["id"]: img for img in coco["images"]}
    annotations_by_img = {img["id"]: [] for img in coco["images"]}
    for ann in coco["annotations"]:
        annotations_by_img[ann["image_id"]].append(ann)

    # Separate images with rare classes (e_waste: 6, organic: 5) for stratified split
    rare_ids = []
    normal_ids = []
    for img_id, anns in annotations_by_img.items():
        has_rare = any(TACO_TO_8.get(a["category_id"]) in (5, 6) for a in anns)
        if has_rare:
            rare_ids.append(img_id)
        else:
            normal_ids.append(img_id)

    random.seed(42)
    random.shuffle(rare_ids)
    random.shuffle(normal_ids)

    def split_list(lst, train_r=0.70, val_r=0.15):
        n = len(lst)
        n_train = int(n * train_r)
        n_val = int(n * val_r)
        return lst[:n_train], lst[n_train:n_train + n_val], lst[n_train + n_val:]

    rare_train, rare_val, rare_test = split_list(rare_ids)
    norm_train, norm_val, norm_test = split_list(normal_ids)

    splits = {
        "train": rare_train + norm_train,
        "val": rare_val + norm_val,
        "test": rare_test + norm_test
    }

    # Setup directories
    for split_name in ["train", "val", "test"]:
        (out_dir / "images" / split_name).mkdir(parents=True, exist_ok=True)
        (out_dir / "labels" / split_name).mkdir(parents=True, exist_ok=True)

    copied_images = 0
    total_boxes = 0

    for split_name, img_ids in splits.items():
        for img_id in img_ids:
            img_info = images_by_id[img_id]
            rel_file_name = img_info["file_name"]
            src_img_path = taco_dir / rel_file_name

            if not src_img_path.exists():
                continue

            # Standardize destination file name: batch_1_000006.jpg
            flat_name = rel_file_name.replace("/", "_").replace("\\", "_")
            stem = Path(flat_name).stem
            dest_img_path = out_dir / "images" / split_name / flat_name
            dest_lbl_path = out_dir / "labels" / split_name / f"{stem}.txt"

            shutil.copy2(src_img_path, dest_img_path)
            copied_images += 1

            img_w = float(img_info["width"])
            img_h = float(img_info["height"])

            label_lines = []
            for ann in annotations_by_img[img_id]:
                cat_id = ann["category_id"]
                if cat_id not in TACO_TO_8:
                    continue
                target_cls = TACO_TO_8[cat_id]

                x, y, w, h = ann["bbox"]
                if w <= 0 or h <= 0:
                    continue

                # Convert to normalized xywh
                xc = (x + w / 2.0) / img_w
                yc = (y + h / 2.0) / img_h
                nw = w / img_w
                nh = h / img_h

                # Clamp strictly to [0.0, 1.0]
                xc = max(0.0, min(1.0, xc))
                yc = max(0.0, min(1.0, yc))
                nw = max(0.0001, min(1.0, nw))
                nh = max(0.0001, min(1.0, nh))

                label_lines.append(f"{target_cls} {xc:.6f} {yc:.6f} {nw:.6f} {nh:.6f}\n")
                total_boxes += 1

            with open(dest_lbl_path, "w") as f:
                f.writelines(label_lines)

    print(f"[Detection Complete] Transferred {copied_images} images with {total_boxes} boxes.")


def prepare_classification_dataset(trashnet_dir: Path, taco_dir: Path, out_dir: Path):
    print("[Classification] Processing TrashNet and cropped instances...")
    trashnet_mapping = {
        "cardboard": "cardboard",
        "glass": "glass",
        "metal": "metal",
        "paper": "paper",
        "plastic": "plastic",
        "trash": "other"
    }

    # Setup directories for all 8 classes in train and val
    for split in ["train", "val"]:
        for cls_name in CLASSES:
            (out_dir / split / cls_name).mkdir(parents=True, exist_ok=True)

    random.seed(42)

    # 1. Process TrashNet classes
    for src_cls, target_cls in trashnet_mapping.items():
        src_folder = trashnet_dir / src_cls
        if not src_folder.exists():
            continue
        all_imgs = [p for p in src_folder.iterdir() if p.is_file() and p.suffix.lower() in ('.jpg', '.jpeg', '.png')]
        random.shuffle(all_imgs)

        n_train = int(len(all_imgs) * 0.8)
        train_imgs = all_imgs[:n_train]
        val_imgs = all_imgs[n_train:]

        for img_p in train_imgs:
            shutil.copy2(img_p, out_dir / "train" / target_cls / img_p.name)
        for img_p in val_imgs:
            shutil.copy2(img_p, out_dir / "val" / target_cls / img_p.name)

    # 2. Extract crops for organic (cat 25) and e_waste (cat 1) from TACO
    annotations_file = taco_dir / "annotations.json"
    if annotations_file.exists():
        with open(annotations_file, "r") as f:
            coco = json.load(f)

        images_by_id = {img["id"]: img for img in coco["images"]}
        crops_by_class = {"organic": [], "e_waste": []}

        for ann in coco["annotations"]:
            cat_id = ann["category_id"]
            target_class = None
            if cat_id == 25:
                target_class = "organic"
            elif cat_id == 1:
                target_class = "e_waste"

            if target_class:
                img_info = images_by_id.get(ann["image_id"])
                if not img_info:
                    continue
                img_path = taco_dir / img_info["file_name"]
                if not img_path.exists():
                    continue

                try:
                    with Image.open(img_path) as im:
                        x, y, w, h = ann["bbox"]
                        if w < 10 or h < 10:
                            continue
                        crop = im.crop((x, y, x + w, y + h)).convert("RGB")
                        crops_by_class[target_class].append(crop)
                except Exception as e:
                    print(f"Error cropping {img_path}: {e}")

        # Distribute and augment crops for organic and e_waste
        for cls_name, crops in crops_by_class.items():
            print(f"[Classification] Extracted {len(crops)} crops for {cls_name}")
            if not crops:
                continue

            # Save base crops and augmentations (horizontal flip, slight rotations)
            expanded_crops = []
            for idx, c in enumerate(crops):
                expanded_crops.append(c)
                expanded_crops.append(c.transpose(Image.FLIP_LEFT_RIGHT))
                expanded_crops.append(c.rotate(15, expand=True))
                expanded_crops.append(c.rotate(-15, expand=True))

            random.shuffle(expanded_crops)
            n_train = max(1, int(len(expanded_crops) * 0.8))
            train_crops = expanded_crops[:n_train]
            val_crops = expanded_crops[n_train:] if len(expanded_crops) > 1 else expanded_crops

            for i, c in enumerate(train_crops):
                c.save(out_dir / "train" / cls_name / f"{cls_name}_crop_{i:03d}.jpg")
            for i, c in enumerate(val_crops):
                c.save(out_dir / "val" / cls_name / f"{cls_name}_crop_{i:03d}.jpg")

    print("[Classification Complete] Dataset directories populated.")


if __name__ == "__main__":
    taco_root = Path("data")
    trashnet_root = Path("dataset-resized")

    detection_out = Path("training/dataset/detection")
    classification_out = Path("training/dataset/classification")

    prepare_detection_dataset(taco_root, detection_out)
    prepare_classification_dataset(trashnet_root, taco_root, classification_out)
