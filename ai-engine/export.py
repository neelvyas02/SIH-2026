#!/usr/bin/env python3
"""
BorderGuard AI - Model Export Utility
Exports trained YOLOv8 PyTorch weights (.pt) to high-performance inference runtimes:
- ONNX (.onnx) for cross-platform CPU/GPU inference and TensorRT
- TorchScript (.torchscript) for C++ / embedded deployments
- OpenVINO for Intel CPU hardware acceleration (Intel Core i5-12450HX)
- TensorRT (.engine) for native NVIDIA RTX 2050 CUDA acceleration
"""

import sys
import argparse
from pathlib import Path
from ultralytics import YOLO

AI_ENGINE_DIR = Path(__file__).resolve().parent
MODELS_DIR = AI_ENGINE_DIR / "models"


def export_model(weights_path: str = None, export_format: str = "onnx", imgsz: int = 640):
    """Exports trained YOLO model to target format."""
    if weights_path is None:
        default_pt = MODELS_DIR / "best.pt"
        if default_pt.exists():
            weights_path = str(default_pt)
        else:
            weights_path = "yolov8s.pt"
            print(f"[!] Warning: Custom best.pt not found. Exporting baseline {weights_path}...")

    print("=" * 70)
    print("BORDERGUARD AI - MODEL EXPORT")
    print("=" * 70)
    print(f"Source Model:  {weights_path}")
    print(f"Target Format: {export_format.upper()}")
    print(f"Image Size:    {imgsz}x{imgsz}")
    print("=" * 70 + "\n")

    model = YOLO(weights_path)

    try:
        exported_path = model.export(
            format=export_format,
            imgsz=imgsz,
            dynamic=True if export_format == "onnx" else False,
            simplify=True if export_format == "onnx" else False,
            half=True if export_format in ["engine", "onnx"] else False
        )
        print("\n" + "=" * 70)
        print("EXPORT SUCCESSFUL!")
        print("=" * 70)
        print(f"[+] Exported artifact: {exported_path}")
        print("=" * 70 + "\n")
        return exported_path
    except Exception as e:
        print(f"[-] Export failed: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Export trained YOLO model for BorderGuard AI")
    parser.add_argument("--weights", type=str, default=None, help="Path to weights file (default: models/best.pt)")
    parser.add_argument("--format", type=str, default="onnx", choices=["onnx", "torchscript", "openvino", "engine"], help="Export format (default: onnx)")
    parser.add_argument("--imgsz", type=int, default=640, help="Image resolution (default: 640)")

    args = parser.parse_args()
    export_model(weights_path=args.weights, export_format=args.format, imgsz=args.imgsz)


if __name__ == "__main__":
    main()
