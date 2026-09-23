#!/usr/bin/env python3
"""
BorderGuard AI - Custom YOLOv8 Model Training Pipeline
Target Classes: gun (0), person (1)
Dataset: Weapons.v1i.yolo26

Hardware Optimization:
- NVIDIA GeForce RTX 2050 (4 GB VRAM)
- Intel Core i5-12450HX
- RAM: 12 GB
"""

import os
import sys
import shutil
import argparse
from pathlib import Path
import torch
from ultralytics import YOLO

# Project root paths
AI_ENGINE_DIR = Path(__file__).resolve().parent
DATA_YAML_PATH = AI_ENGINE_DIR / "dataset" / "data.yaml"
MODELS_DIR = AI_ENGINE_DIR / "models"
RUNS_DIR = AI_ENGINE_DIR / "runs"


def check_hardware():
    """Checks CPU and GPU compute capabilities and recommends settings."""
    print("=" * 70)
    print("HARDWARE & COMPUTE DIAGNOSTICS")
    print("=" * 70)
    print(f"Python Version: {sys.version.split()[0]}")
    print(f"PyTorch Version: {torch.__version__}")

    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        gpu_mem_gb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
        print(f"GPU Detected: {gpu_name}")
        print(f"Total VRAM:   {gpu_mem_gb:.2f} GB")
        print("CUDA Compute: ENABLED (Fast Hardware Acceleration)")
        device = 0
        recommended_batch = 16 if gpu_mem_gb >= 3.5 else 8
    else:
        print("GPU Status:   NO CUDA GPU DETECTED in current PyTorch build.")
        print("Compute Mode: CPU Fallback")
        print("Tip: Install PyTorch with CUDA for RTX 2050 acceleration:")
        print("     pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121")
        device = "cpu"
        recommended_batch = 8

    print("=" * 70 + "\n")
    return device, recommended_batch


def train_model(
    model_name: str = "yolov8s.pt",
    data_path: str = None,
    epochs: int = 50,
    batch_size: int = None,
    img_size: int = 640,
    workers: int = 4,
    resume: bool = False,
    device: str = None
):
    """
    Executes YOLOv8 transfer learning on the Weapons dataset.
    """
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    RUNS_DIR.mkdir(parents=True, exist_ok=True)

    target_data_yaml = Path(data_path) if data_path is not None else DATA_YAML_PATH
    if not target_data_yaml.is_absolute():
        target_data_yaml = target_data_yaml.resolve()

    detected_device, auto_batch = check_hardware()
    chosen_device = device if device is not None else detected_device
    chosen_batch = batch_size if batch_size is not None else auto_batch

    if not target_data_yaml.exists():
        print(f"[-] Error: data.yaml not found at {target_data_yaml}")
        sys.exit(1)

    print("=" * 70)
    print("TRAINING CONFIGURATION")
    print("=" * 70)
    print(f"Pretrained Model:   {model_name}")
    print(f"Dataset YAML:       {target_data_yaml}")
    print(f"Target Epochs:      {epochs}")
    print(f"Batch Size:         {chosen_batch}")
    print(f"Image Resolution:   {img_size}x{img_size}")
    print(f"Dataloader Workers: {workers}")
    print(f"Compute Device:     {chosen_device}")
    print(f"Resume Training:    {resume}")
    print("=" * 70 + "\n")

    # Initialize model
    if resume:
        last_ckpt = RUNS_DIR / "detect" / "train" / "weights" / "last.pt"
        if not last_ckpt.exists():
            print(f"[-] Error: Cannot resume. Checkpoint not found: {last_ckpt}")
            sys.exit(1)
        print(f"[*] Resuming training from checkpoint: {last_ckpt}")
        model = YOLO(str(last_ckpt))
    else:
        print(f"[*] Loading pretrained weights: {model_name}...")
        model = YOLO(model_name)

    # Train model
    print("[*] Starting YOLO training loop with data augmentation...")
    results = model.train(
        data=str(target_data_yaml),
        epochs=epochs,
        batch=chosen_batch,
        imgsz=img_size,
        workers=workers,
        device=chosen_device,
        project=str(RUNS_DIR / "detect"),
        name="train",
        exist_ok=True,
        pretrained=True,
        optimizer="auto",
        amp=True,              # Automatic Mixed Precision for VRAM optimization
        patience=10,           # Early stopping patience if validation metrics plateau
        save=True,
        save_period=5,
        mosaic=1.0,            # 4-image mosaic composition
        mixup=0.1,             # Blends two images to improve generalization
        fliplr=0.5,            # Horizontal flip (50% probability)
        hsv_h=0.015,           # HSV hue fraction
        hsv_s=0.7,             # HSV saturation
        hsv_v=0.4,             # HSV value (brightness)
        verbose=True
    )

    # Copy best weights to models/best.pt
    best_pt = RUNS_DIR / "detect" / "train" / "weights" / "best.pt"
    if best_pt.exists():
        destination = MODELS_DIR / "best.pt"
        shutil.copy2(best_pt, destination)
        print("\n" + "=" * 70)
        print("TRAINING COMPLETE!")
        print("=" * 70)
        print(f"[+] Best checkpoint saved to: {best_pt}")
        print(f"[+] Copied to deployment path: {destination}")
        print(f"[+] Evaluation graphs generated in: {RUNS_DIR / 'detect' / 'train'}")
        print("=" * 70 + "\n")
    else:
        print("[!] Warning: best.pt weights file not found in runs directory.")

    return results


def main():
    parser = argparse.ArgumentParser(description="Train custom YOLOv8 model for BorderGuard AI")
    parser.add_argument("--model", type=str, default="yolov8s.pt", help="Pretrained model (yolov8n.pt, yolov8s.pt, yolov8m.pt)")
    parser.add_argument("--data", type=str, default=None, help="Path to data.yaml (defaults to dataset/data.yaml)")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs (default: 50)")
    parser.add_argument("--batch", type=int, default=None, help="Batch size (default: auto 16 for GPU, 8 for CPU)")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size (default: 640)")
    parser.add_argument("--workers", type=int, default=4, help="Number of data loader workers (default: 4)")
    parser.add_argument("--device", type=str, default=None, help="Device to use: '0' for GPU or 'cpu'")
    parser.add_argument("--resume", action="store_true", help="Resume training from last.pt checkpoint")

    args = parser.parse_args()

    train_model(
        model_name=args.model,
        data_path=args.data,
        epochs=args.epochs,
        batch_size=args.batch,
        img_size=args.imgsz,
        workers=args.workers,
        resume=args.resume,
        device=args.device
    )


if __name__ == "__main__":
    main()
