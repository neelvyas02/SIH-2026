#!/usr/bin/env python3
"""
BorderGuard AI - 100 GB UCF-Crime Dataset Training & Preprocessing Script
Provides tools for:
1. Video frame extraction & sampling from UCF-Crime videos (Abuse, Arrest, Arson, Assault, Burglary, Explosion, Fighting, Shooting, etc.).
2. Label format converter to Ultralytics YOLO format (x_center, y_center, width, height).
3. Data yaml configuration builder.
4. Model training execution with YOLOv8 / YOLOv11 for custom suspicious video anomaly & weapon detection.
"""

import os
import sys
import argparse
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [UCF-TRAIN] %(message)s")
logger = logging.getLogger("borderguard.ucf_train")

UCF_CLASSES = [
    "normal",
    "abuse",
    "arrest",
    "arson",
    "assault",
    "burglary",
    "explosion",
    "fighting",
    "road_accidents",
    "robbery",
    "shooting",
    "shoplifting",
    "stealing",
    "vandalism",
    "weapon"
]


def extract_frames_from_ucf(dataset_dir: str, output_dir: str, sample_fps: int = 5):
    """
    Scans UCF-Crime dataset directory for MP4/AVI videos and extracts frames at given FPS rate.
    """
    try:
        import cv2
    except ImportError:
        logger.error("OpenCV is required. Install with `pip install opencv-python`.")
        return

    dataset_path = Path(dataset_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    if not dataset_path.exists():
        logger.error(f"Dataset path '{dataset_dir}' does not exist!")
        return

    video_files = list(dataset_path.rglob("*.mp4")) + list(dataset_path.rglob("*.avi"))
    logger.info(f"Found {len(video_files)} surveillance video files in {dataset_dir}.")

    for idx, vid_path in enumerate(video_files):
        category = vid_path.parent.name
        cat_out_dir = output_path / category
        cat_out_dir.mkdir(parents=True, exist_ok=True)

        cap = cv2.VideoCapture(str(vid_path))
        if not cap.isOpened():
            continue

        native_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_interval = max(1, int(native_fps / sample_fps))
        frame_cnt = 0
        saved_cnt = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_cnt += 1

            if frame_cnt % frame_interval == 0:
                out_name = f"{vid_path.stem}_f{frame_cnt:06d}.jpg"
                cv2.imwrite(str(cat_out_dir / out_name), frame, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
                saved_cnt += 1

        cap.release()
        logger.info(f"[{idx+1}/{len(video_files)}] Processed '{vid_path.name}' -> Extracted {saved_cnt} frames.")


def generate_yolo_dataset_yaml(dataset_root: str, yaml_out_path: str = "ucf_crime.yaml"):
    """
    Creates YOLO dataset YAML config file for Ultralytics training.
    """
    dataset_root = str(Path(dataset_root).resolve()).replace("\\", "/")
    yaml_content = f"""# BorderGuard AI - UCF-Crime 100 GB Custom Training Config
path: {dataset_root}
train: images/train
val: images/val
test: images/val

names:
"""
    for idx, cname in enumerate(UCF_CLASSES):
        yaml_content += f"  {idx}: {cname}\n"

    with open(yaml_out_path, "w") as f:
        f.write(yaml_content)

    logger.info(f"[+] Created YOLO dataset config: {yaml_out_path}")


def train_yolo_model(yaml_path: str, weights: str = "yolov8m.pt", epochs: int = 50, batch: int = 16, imgsz: int = 640):
    """
    Triggers Ultralytics YOLO training loop.
    """
    try:
        from ultralytics import YOLO
        logger.info(f"[*] Starting YOLO training on UCF-Crime dataset using weights: {weights}...")
        model = YOLO(weights)
        model.train(
            data=yaml_path,
            epochs=epochs,
            batch=batch,
            imgsz=imgsz,
            device=0,
            workers=8,
            save=True,
            project="runs/detect",
            name="train_ucf_crime"
        )
        logger.info("[+] Training complete! Model weights saved to runs/detect/train_ucf_crime/weights/best.pt")
    except Exception as e:
        logger.error(f"Failed to launch YOLO training: {e}")


def main():
    parser = argparse.ArgumentParser(description="UCF-Crime 100 GB Dataset Preprocessing & YOLO Model Trainer")
    parser.add_argument("--action", type=str, choices=["extract", "yaml", "train"], required=True, help="Action to perform: extract, yaml, or train")
    parser.add_argument("--dataset-dir", type=str, default="D:/UCF_Crimes", help="Path to raw UCF-Crime dataset folder")
    parser.add_argument("--output-dir", type=str, default="D:/UCF_Frames", help="Output directory for extracted frames or YOLO dataset")
    parser.add_argument("--fps", type=int, default=5, help="Frame sampling rate for extraction (default: 5 FPS)")
    parser.add_argument("--weights", type=str, default="yolov8m.pt", help="Initial model weights (yolov8n.pt, yolov8m.pt, yolov8x.pt)")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs (default: 50)")

    args = parser.parse_args()

    if args.action == "extract":
        extract_frames_from_ucf(args.dataset_dir, args.output_dir, sample_fps=args.fps)
    elif args.action == "yaml":
        generate_yolo_dataset_yaml(args.output_dir)
    elif args.action == "train":
        yaml_file = "ucf_crime.yaml"
        if not os.path.exists(yaml_file):
            generate_yolo_dataset_yaml(args.output_dir, yaml_file)
        train_yolo_model(yaml_file, weights=args.weights, epochs=args.epochs)


if __name__ == "__main__":
    main()
