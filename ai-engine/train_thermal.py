#!/usr/bin/env python3
"""
BorderGuard AI - Thermal / Night-Vision Model Training Pipeline
Optimized for 16 GB Thermal IR & Night Surveillance Datasets
Hardware Acceleration: NVIDIA GeForce RTX 4070 GPU (8GB VRAM)
"""

import os
import sys
import shutil
import argparse
from pathlib import Path
import torch
from ultralytics import YOLO

AI_ENGINE_DIR = Path(__file__).resolve().parent
MODELS_DIR = AI_ENGINE_DIR / "models"
RUNS_DIR = AI_ENGINE_DIR / "runs"


def check_gpu_diagnostics():
    """Verifies PyTorch CUDA GPU capabilities."""
    print("=" * 75)
    print("BORDERGUARD AI - THERMAL TRAINING DIAGNOSTICS")
    print("=" * 75)
    print(f"Python Version:  {sys.version.split()[0]}")
    print(f"PyTorch Version: {torch.__version__}")

    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        gpu_mem_gb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
        print(f"GPU Detected:    {gpu_name}")
        print(f"Total VRAM:      {gpu_mem_gb:.2f} GB")
        print("CUDA Acceleration: ENABLED (Tensor Cores Active)")
        device = 0
        recommended_batch = 32 if gpu_mem_gb >= 7.5 else 16
    else:
        print("GPU Status: NO CUDA GPU detected. Falling back to CPU.")
        device = "cpu"
        recommended_batch = 8

    print("=" * 75 + "\n")
    return device, recommended_batch


def train_thermal_model(
    data_yaml_path: str,
    model_name: str = "yolov8s.pt",
    epochs: int = 50,
    batch_size: int = None,
    img_size: int = 640,
    workers: int = 4,
    device: str = None
):
    """
    Executes fine-tuning on Thermal / Night-Vision Dataset.
    """
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    RUNS_DIR.mkdir(parents=True, exist_ok=True)

    yaml_path = Path(data_yaml_path).resolve()
    if not yaml_path.exists():
        print(f"[-] Error: data.yaml not found at {yaml_path}")
        sys.exit(1)

    detected_device, auto_batch = check_gpu_diagnostics()
    chosen_device = device if device is not None else detected_device
    chosen_batch = batch_size if batch_size is not None else auto_batch

    print("=" * 75)
    print("THERMAL TRAINING CONFIGURATION")
    print("=" * 75)
    print(f"Pretrained Weights:  {model_name}")
    print(f"Dataset YAML:        {yaml_path}")
    print(f"Target Epochs:       {epochs}")
    print(f"Batch Size:          {chosen_batch}")
    print(f"Resolution:          {img_size}x{img_size}")
    print(f"Compute Device:      {chosen_device}")
    print("=" * 75 + "\n")

    model = YOLO(model_name)

    print("[*] Launching YOLOv8 Thermal Training with MixUp & Mosaic Augmentations...")
    results = model.train(
        data=str(yaml_path),
        epochs=epochs,
        batch=chosen_batch,
        imgsz=img_size,
        workers=workers,
        device=chosen_device,
        project=str(RUNS_DIR / "detect_thermal"),
        name="train",
        exist_ok=True,
        pretrained=True,
        optimizer="AdamW",
        amp=True,               # FP16 Tensor Core acceleration
        patience=10,            # Early stopping patience
        save=True,
        save_period=0,          # Don't hoard intermediate checkpoints to save disk space
        mosaic=1.0,
        mixup=0.15,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        verbose=True
    )

    # Export best model to models/best_thermal.pt and models/best.pt
    best_pt = RUNS_DIR / "detect_thermal" / "train" / "weights" / "best.pt"
    if best_pt.exists():
        thermal_dest = MODELS_DIR / "best_thermal.pt"
        default_dest = MODELS_DIR / "best.pt"
        shutil.copy2(best_pt, thermal_dest)
        shutil.copy2(best_pt, default_dest)
        print("\n" + "=" * 75)
        print("THERMAL MODEL TRAINING COMPLETE!")
        print("=" * 75)
        print(f"[+] Thermal weights saved to:   {thermal_dest}")
        print(f"[+] Active deployment weights: {default_dest}")
        print("=" * 75 + "\n")

    return results


def main():
    parser = argparse.ArgumentParser(description="Train Thermal & Night Vision YOLOv8 Model for BorderGuard AI")
    parser.add_argument("--data", type=str, required=True, help="Path to Thermal dataset data.yaml")
    parser.add_argument("--model", type=str, default="yolov8s.pt", help="Pretrained weights (yolov8s.pt or yolov8m.pt)")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs (default: 50)")
    parser.add_argument("--batch", type=int, default=None, help="Batch size (default: auto 32 for RTX 4070)")
    parser.add_argument("--imgsz", type=int, default=640, help="Image resolution (default: 640)")
    parser.add_argument("--workers", type=int, default=4, help="Dataloader workers (default: 4)")
    parser.add_argument("--device", type=str, default=None, help="Device to use: '0' for GPU or 'cpu'")

    args = parser.parse_args()

    train_thermal_model(
        data_yaml_path=args.data,
        model_name=args.model,
        epochs=args.epochs,
        batch_size=args.batch,
        img_size=args.imgsz,
        workers=args.workers,
        device=args.device
    )


if __name__ == "__main__":
    main()
