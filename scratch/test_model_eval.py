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
    inter_area = max(0, x2 - x1) * max(0, y2 - y1)
    box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union_area = box1_area + box2_area - inter_area
    if union_area <= 0:
        return 0.0
    return inter_area / union_area

def test_image(img_path, ground_truth_desc=""):
    print(f"\n--- Testing: {os.path.basename(img_path)} ---")
    start = time.time()
    try:
        with open(img_path, "rb") as f:
            files = {"file": (os.path.basename(img_path), f, "image/jpeg")}
            resp = requests.post(BACKEND_URL, files=files, timeout=60)
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
    
    print(f"Objects: {len(items)}, Time: {data.get('processing_time_ms')}ms, Bin: {data.get('primary_bin')}")
    for idx, it in enumerate(items):
        print(f"  [{idx+1}] YOLO: {it.get('label')} ({it.get('confidence', 0):.2f}) | Clf: {it.get('material')} ({it.get('classifier_confidence', 0):.2f}) | Bin: {it.get('bin')}")
    if overlapping_pairs:
        print(f"  ** WARNING: Duplicate/Overlapping Bounding Boxes detected! **")
        for op in overlapping_pairs:
            print(f"     IoU {op['iou']}: {op['item1']} <--> {op['item2']}")
            
    return result

def main():
    # 1. User uploaded problem images
    user_dir = r"C:\Users\Saad\.gemini\antigravity-ide\brain\4a0b7c05-3b80-49ef-b606-a5d097383973\.user_uploaded"
    user_test_files = [
        (os.path.join(user_dir, "media_1788859398510.png"), "Single Green Glass Beer Bottle (Heineken) on dark surface"),
        (os.path.join(user_dir, "media_1788859819231.png"), "Green Glass Beer Bottle (Heineken) lying horizontally"),
        (os.path.join(user_dir, "media_1788860018883.png"), "Black plastic lid in wet mulch/leaves"),
        (os.path.join(user_dir, "media_1788860021082.png"), "Clear plastic water bottle on asphalt"),
        (os.path.join(user_dir, "media_1788860121227.png"), "Multiple waste items (bottle, lid, litter) in outdoor scene")
    ]
    
    # 2. Dataset ground truth images from data/batch_1
    dataset_files = [
        (r"data\batch_1\000006.jpg", "Glass bottle (Ground Truth: Glass bottle)"),
        (r"data\batch_1\000008.jpg", "Meal carton, Other carton (Ground Truth: Paper/Carton)"),
        (r"data\batch_1\000010.jpg", "Clear plastic bottle, bottle cap (Ground Truth: Plastic)"),
        (r"data\batch_1\000019.jpg", "Clear plastic bottle, drink can, bottle cap (Ground Truth: Plastic & Can)"),
        (r"data\batch_1\000026.jpg", "Drink can (Ground Truth: Metal Can)"),
        (r"data\batch_1\000047.jpg", "Food can, plastic bottle, cap, pop tab (Ground Truth: Metal & Plastic)"),
        (r"data\batch_1\000055.jpg", "Aerosol can (Ground Truth: Metal Can)"),
        (r"data\batch_1\000005.jpg", "Clear plastic bottle (Ground Truth: Plastic Bottle)"),
        (r"data\batch_1\000012.jpg", "Glass bottle (Ground Truth: Glass Bottle)"),
        (r"data\batch_1\000007.jpg", "Food Can, Glass cup, Pop tab (Ground Truth: Metal Can, Glass)"),
    ]
    
    all_tests = user_test_files + dataset_files
    
    results = []
    for path, gt in all_tests:
        if os.path.exists(path):
            res = test_image(path, gt)
            if res:
                results.append(res)
        else:
            print(f"File not found: {path}")
            
    out_file = r"scratch\evaluation_results.json"
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    with open(out_file, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved {len(results)} test evaluations to {out_file}")

if __name__ == "__main__":
    main()
