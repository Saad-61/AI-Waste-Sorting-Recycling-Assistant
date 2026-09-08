import os
import glob
import json
import time
import requests
import pandas as pd
import numpy as np

BACKEND_URL = "http://127.0.0.1:8000/api/analyze"

def calculate_iou(box1, box2):
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    a1 = max(0, box1[2] - box1[0]) * max(0, box1[3] - box1[1])
    a2 = max(0, box2[2] - box2[0]) * max(0, box2[3] - box2[1])
    union = a1 + a2 - inter
    return inter / union if union > 0 else 0.0

def test_image(img_path, ground_truth_desc=""):
    print(f"\n--- Testing: {os.path.basename(img_path)} ({ground_truth_desc}) ---")
    start = time.time()
    try:
        with open(img_path, "rb") as f:
            files = {"file": (os.path.basename(img_path), f, "image/jpeg")}
            resp = requests.post(BACKEND_URL, files=files, timeout=90)
    except Exception as e:
        print(f"Request failed: {e}")
        return None
    
    elapsed = time.time() - start
    if resp.status_code != 200:
        print(f"Error {resp.status_code}: {resp.text}")
        return None
    
    data = resp.json()
    items = data.get("items", [])
    
    # Check overlaps between detected items
    overlapping_pairs = []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            b1 = items[i].get("bbox", items[i].get("box", []))
            b2 = items[j].get("bbox", items[j].get("box", []))
            if len(b1) == 4 and len(b2) == 4:
                iou = calculate_iou(b1, b2)
                if iou > 0.35:
                    overlapping_pairs.append({
                        "item1": f"{items[i].get('label')} ({items[i].get('material')}, conf={items[i].get('confidence', 0):.2f})",
                        "item2": f"{items[j].get('label')} ({items[j].get('material')}, conf={items[j].get('confidence', 0):.2f})",
                        "iou": round(iou, 3)
                    })
                
    result = {
        "file": os.path.basename(img_path),
        "path": img_path,
        "ground_truth": ground_truth_desc,
        "status_code": resp.status_code,
        "processing_time_ms": data.get("processing_time_ms"),
        "http_latency_ms": round(elapsed * 1000, 1),
        "total_objects": data.get("total_objects", 0),
        "primary_bin": data.get("primary_bin", ""),
        "items": items,
        "overlapping_pairs": overlapping_pairs
    }
    
    print(f"Objects: {len(items)}, Latency: {data.get('processing_time_ms')}ms, Primary Bin: {data.get('primary_bin')}")
    for idx, it in enumerate(items):
        print(f"  [{idx+1}] YOLO: {it.get('label')} ({it.get('confidence', 0):.2f}) | Clf: {it.get('material')} ({it.get('classifier_confidence', 0):.2f}) | Bin: {it.get('bin')}")
    if overlapping_pairs:
        print(f"  ** WARNING: Duplicate/Overlapping Bounding Boxes detected! **")
        for op in overlapping_pairs:
            print(f"     IoU {op['iou']}: {op['item1']} <--> {op['item2']}")
            
    return result

def main():
    meta_df = pd.read_csv("meta_df.csv")
    
    # 1. User uploaded problem images
    user_dir = r"C:\Users\Saad\.gemini\antigravity-ide\brain\4a0b7c05-3b80-49ef-b606-a5d097383973\.user_uploaded"
    user_test_files = [
        (os.path.join(user_dir, "media_1788860018883.png"), "User: Green Glass Bottle in leaves"),
        (os.path.join(user_dir, "media_1788859398510.png"), "User: Heineken Glass Bottle close-up"),
        (os.path.join(user_dir, "media_1788859819231.png"), "User: Heineken Bottle horizontal"),
        (os.path.join(user_dir, "media_1788860021082.png"), "User: Clear plastic water bottle"),
        (os.path.join(user_dir, "media_1788860121227.png"), "User: Outdoor scene with bottle & litter"),
    ]
    
    # 2. Curate 27 diverse images across multiple batches (batch_1 through batch_10)
    categories_to_sample = [
        ("Glass bottle", 5),
        ("Drink can", 5),
        ("Clear plastic bottle", 5),
        ("Other carton", 4),
        ("Plastic film", 4),
        ("Plastic bottle cap", 2),
        ("Food Can", 2)
    ]
    
    sampled_files = []
    seen_files = set()
    
    for cat, count in categories_to_sample:
        sub = meta_df[meta_df["cat_name"] == cat]
        for _, row in sub.iterrows():
            img_rel = row["img_file"].replace("/", "\\")
            full_path = os.path.join("data", img_rel)
            if full_path not in seen_files and os.path.exists(full_path):
                seen_files.add(full_path)
                desc = f"GT: {cat} ({row['img_file']})"
                sampled_files.append((full_path, desc))
                if len([s for s in sampled_files if cat in s[1]]) >= count:
                    break

    all_tests = user_test_files + sampled_files
    print(f"Total test suite assembled: {len(all_tests)} images (Target: >= 30)")
    
    results = []
    for path, gt in all_tests:
        if os.path.exists(path):
            res = test_image(path, gt)
            if res:
                results.append(res)
        else:
            print(f"File not found: {path}")
            
    out_file = r"scratch\sahi_30_evaluation_results.json"
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    with open(out_file, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved {len(results)} SAHI evaluations to {out_file}")

if __name__ == "__main__":
    main()
