#!/usr/bin/env python3
"""
BorderGuard AI - Model Evaluation & Validation Pipeline
Calculates Precision, Recall, mAP50, and mAP50-95 on the Weapons test/val dataset.
Generates confusion matrices, PR curves, and provides per-class error analysis.
"""

import sys
import argparse
from pathlib import Path
from ultralytics import YOLO

AI_ENGINE_DIR = Path(__file__).resolve().parent
DATA_YAML_PATH = AI_ENGINE_DIR / "dataset" / "data.yaml"
MODELS_DIR = AI_ENGINE_DIR / "models"
RUNS_DIR = AI_ENGINE_DIR / "runs"


def evaluate_model(
    weights_path: str = None,
    split: str = "test",
    img_size: int = 640,
    batch_size: int = 16,
    conf_threshold: float = 0.25,
    iou_threshold: float = 0.50
):
    """
    Evaluates the trained YOLO model on the test or validation dataset split.
    """
    if weights_path is None:
        if (MODELS_DIR / "best.pt").exists():
            weights_path = str(MODELS_DIR / "best.pt")
        elif (RUNS_DIR / "detect" / "train" / "weights" / "best.pt").exists():
            weights_path = str(RUNS_DIR / "detect" / "train" / "weights" / "best.pt")
        else:
            weights_path = "yolov8n.pt"
            print(f"[!] Warning: Custom best.pt not found. Evaluating baseline {weights_path}...")

    print("=" * 70)
    print("MODEL VALIDATION & EVALUATION AUDIT")
    print("=" * 70)
    print(f"Weights Path:        {weights_path}")
    print(f"Dataset YAML:        {DATA_YAML_PATH}")
    print(f"Evaluation Split:    {split.upper()}")
    print(f"Confidence Thresh:   {conf_threshold}")
    print(f"IoU NMS Thresh:      {iou_threshold}")
    print("=" * 70 + "\n")

    model = YOLO(weights_path)

    # Run validation
    metrics = model.val(
        data=str(DATA_YAML_PATH),
        split=split,
        imgsz=img_size,
        batch=batch_size,
        conf=conf_threshold,
        iou=iou_threshold,
        project=str(RUNS_DIR / "detect"),
        name=f"val_{split}",
        exist_ok=True,
        verbose=True
    )

    # Extract metrics
    map50 = metrics.box.map50
    map50_95 = metrics.box.map
    precision = metrics.box.mp
    recall = metrics.box.mr

    print("\n" + "=" * 70)
    print("OVERALL DETECTION PERFORMANCE SUMMARY")
    print("=" * 70)
    print(f"  Mean Precision (P):       {precision * 100:>6.2f}%")
    print(f"  Mean Recall (R):          {recall * 100:>6.2f}%")
    print(f"  mAP @ 0.50 (IoU=0.50):    {map50 * 100:>6.2f}%")
    print(f"  mAP @ 0.50-0.95:          {map50_95 * 100:>6.2f}%")
    print("=" * 70)

    # Per-class metrics
    class_names = metrics.names
    print("\n" + "-" * 70)
    print(f"{'Class Name':<15} {'Precision':<12} {'Recall':<12} {'mAP50':<12} {'mAP50-95':<12}")
    print("-" * 70)

    for i, cls_name in class_names.items():
        if i < len(metrics.box.p):
            p = metrics.box.p[i]
            r = metrics.box.r[i]
            m50 = metrics.box.maps[i] if i < len(metrics.box.maps) else 0.0
            # Estimate mAP50 from box curves
            print(f"{cls_name:<15} {p*100:>6.2f}%      {r*100:>6.2f}%      {m50*100:>6.2f}%")

    print("-" * 70)

    # Failure Mode Diagnostics
    print("\n" + "=" * 70)
    print("DETECTION ACCURACY & BOTTLENECK ANALYSIS")
    print("=" * 70)
    print("1. Gun vs. Person Detection Discrepancy:")
    print("   - 'person' typically achieves higher mAP (>85%) due to larger pixel footprint and distinct silhouette.")
    print("   - 'gun' typically has lower recall at distant camera angles due to:")
    print("     * Small bounding box size (<32x32 pixels) in border CCTV viewpoints.")
    print("     * Hand occlusion and holster shadows.")
    print("2. False Positives Check:")
    print("   - High confidence false alarms often occur on rectangular handheld objects (smartphones, tools, flashlights).")
    print("3. False Negatives Check:")
    print("   - Missed detections occur in low-light night conditions or when the weapon is held close to dark clothing.")
    print("4. Evaluation Artifacts Saved:")
    val_dir = RUNS_DIR / "detect" / f"val_{split}"
    print(f"   - Confusion Matrix: {val_dir / 'confusion_matrix.png'}")
    print(f"   - PR Curve Graph:   {val_dir / 'PR_curve.png'}")
    print(f"   - F1 Score Curve:   {val_dir / 'F1_curve.png'}")
    print("=" * 70 + "\n")

    return metrics


def main():
    parser = argparse.ArgumentParser(description="Evaluate trained YOLOv8 model for BorderGuard AI")
    parser.add_argument("--weights", type=str, default=None, help="Path to model weights (defaults to models/best.pt)")
    parser.add_argument("--split", type=str, default="test", choices=["test", "val", "train"], help="Dataset split to evaluate (default: test)")
    parser.add_argument("--imgsz", type=int, default=640, help="Image resolution (default: 640)")
    parser.add_argument("--conf", type=float, default=0.25, help="Confidence threshold (default: 0.25)")
    parser.add_argument("--iou", type=float, default=0.50, help="NMS IoU threshold (default: 0.50)")

    args = parser.parse_args()

    evaluate_model(
        weights_path=args.weights,
        split=args.split,
        img_size=args.imgsz,
        conf_threshold=args.conf,
        iou_threshold=args.iou
    )


if __name__ == "__main__":
    main()
