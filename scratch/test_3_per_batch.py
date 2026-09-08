import os
import random
import json
import time
import requests
import pandas as pd

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

def main():
    random.seed(42) # Reproducible random selection
    
    meta_df = pd.read_csv("meta_df.csv")
    gt_map = {}
    for _, row in meta_df.iterrows():
        gt_map[row["img_file"]] = f"{row['cat_name']} ({row['supercategory']})"
        
    data_dir = "data"
    batches = [b for b in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, b)) and b.startswith("batch_")]
    batches = sorted(batches, key=lambda x: int(x.split("_")[1]))
    
    selected_tests = []
    for b in batches:
        b_dir = os.path.join(data_dir, b)
        imgs = [f for f in os.listdir(b_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if len(imgs) >= 3:
            chosen = random.sample(imgs, 3)
        else:
            chosen = imgs
            
        for img in chosen:
            full_p = os.path.join(b_dir, img)
            rel_k = f"{b}/{img}"
            gt_desc = gt_map.get(rel_k, "Unannotated / Scene")
            selected_tests.append({
                "batch": b,
                "filename": img,
                "path": full_p,
                "ground_truth": gt_desc
            })
            
    print(f"Selected {len(selected_tests)} images (3 per batch across {len(batches)} batches). Starting evaluation...")
    
    results = []
    start_all = time.time()
    
    for idx, item in enumerate(selected_tests, 1):
        p = item["path"]
        print(f"[{idx}/{len(selected_tests)}] Testing {item['batch']}/{item['filename']} -> GT: {item['ground_truth']}")
        t0 = time.time()
        try:
            with open(p, "rb") as f:
                resp = requests.post(BACKEND_URL, files={"file": (item["filename"], f, "image/jpeg")}, timeout=60)
            elapsed = time.time() - t0
            
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                
                # Check overlaps
                overlaps = []
                for i in range(len(items)):
                    for j in range(i + 1, len(items)):
                        b1 = items[i].get("bbox", [])
                        b2 = items[j].get("bbox", [])
                        if len(b1) == 4 and len(b2) == 4:
                            iou = calculate_iou(b1, b2)
                            if iou > 0.35:
                                overlaps.append({
                                    "item1": f"{items[i].get('label')} ({items[i].get('material')})",
                                    "item2": f"{items[j].get('label')} ({items[j].get('material')})",
                                    "iou": round(iou, 3)
                                })
                                
                res_obj = {
                    "batch": item["batch"],
                    "filename": item["filename"],
                    "ground_truth": item["ground_truth"],
                    "status_code": 200,
                    "total_objects": data.get("total_objects", 0),
                    "primary_bin": data.get("primary_bin"),
                    "processing_time_ms": data.get("processing_time_ms"),
                    "http_latency_ms": round(elapsed * 1000, 1),
                    "items": [
                        {
                            "label": it.get("label"),
                            "confidence": it.get("confidence"),
                            "material": it.get("material"),
                            "bin": it.get("bin"),
                            "bbox": it.get("bbox")
                        }
                        for it in items
                    ],
                    "overlaps": overlaps
                }
                results.append(res_obj)
                print(f"   => Targets: {len(items)}, Bin: {data.get('primary_bin')}, Latency: {data.get('processing_time_ms')}ms")
                for it in items[:3]:
                    print(f"      - {it.get('label')} ({it.get('confidence'):.2f}) -> {it.get('material')} -> {it.get('bin')}")
                if len(items) > 3:
                    print(f"      ... and {len(items)-3} more targets")
            else:
                print(f"   => HTTP Error {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"   => Request Exception: {e}")
            
    total_time = time.time() - start_all
    out_file = r"scratch\results_3_per_batch.json"
    with open(out_file, "w") as f:
        json.dump(results, f, indent=2)
        
    # Aggregate Stats
    detected_count = sum(1 for r in results if r["total_objects"] > 0)
    zero_count = sum(1 for r in results if r["total_objects"] == 0)
    total_targets = sum(r["total_objects"] for r in results)
    has_overlap_count = sum(1 for r in results if len(r["overlaps"]) > 0)
    avg_latency = sum(r["processing_time_ms"] for r in results) / max(1, len(results))
    
    print("\n" + "="*60)
    print("=== EXTENSIVE 3-PER-BATCH EVALUATION SUMMARY ===")
    print(f"Total Batches: {len(batches)} (batch_1 to batch_{len(batches)})")
    print(f"Total Images Tested: {len(results)}")
    print(f"Images with >= 1 Target Detected: {detected_count} ({detected_count/len(results)*100:.1f}%)")
    print(f"Images with 0 Targets Detected: {zero_count} ({zero_count/len(results)*100:.1f}%)")
    print(f"Total Discrete Targets Isolated: {total_targets}")
    print(f"Images with Duplicate Overlaps (IoU > 0.35): {has_overlap_count} ({has_overlap_count/len(results)*100:.1f}%)")
    print(f"Average Pipeline Latency: {avg_latency:.1f} ms")
    print(f"Total Benchmark Runtime: {total_time:.1f} s")
    print("="*60)

if __name__ == "__main__":
    main()
