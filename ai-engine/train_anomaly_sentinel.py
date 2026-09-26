#!/usr/bin/env python3
"""
BorderGuard AI - Video Anomaly Sentinel Training Pipeline
Dataset: Anomaly Videos (Parts 1 to 4) + Normal Videos
Classes: 14 categories (Normal, Abuse, Arrest, Arson, Assault, Burglary, Explosion, Fighting,
         RoadAccidents, Robbery, Shooting, Shoplifting, Stealing, Vandalism)
Model: SOTA Ultralytics YOLO11 Classification (yolo11n-cls)
Output: models/anomaly_sentinel.pt
"""

import os
import sys
import time
import random
import shutil
import argparse
import logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import cv2
import numpy as np
import torch
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [ANOMALY-TRAIN] %(message)s")
logger = logging.getLogger("borderguard.anomaly_train")

AI_ENGINE_DIR = Path(__file__).resolve().parent
MODELS_DIR = AI_ENGINE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# 14 Categories mapped to their respective dataset directories on D:
SOURCE_CATEGORIES = {
    "Abuse": Path(r"D:\Anomaly-Videos-Part-1\Anomaly-Videos-Part-1\Abuse"),
    "Arrest": Path(r"D:\Anomaly-Videos-Part-1\Anomaly-Videos-Part-1\Arrest"),
    "Arson": Path(r"D:\Anomaly-Videos-Part-1\Anomaly-Videos-Part-1\Arson"),
    "Assault": Path(r"D:\Anomaly-Videos-Part-1\Anomaly-Videos-Part-1\Assault"),
    "Burglary": Path(r"D:\Anomaly-Videos-Part-2\Anomaly-Videos-Part-2\Burglary"),
    "Explosion": Path(r"D:\Anomaly-Videos-Part-2\Anomaly-Videos-Part-2\Explosion"),
    "Fighting": Path(r"D:\Anomaly-Videos-Part-2\Anomaly-Videos-Part-2\Fighting"),
    "RoadAccidents": Path(r"D:\Anomaly-Videos-Part-3\Anomaly-Videos-Part-3\RoadAccidents"),
    "Robbery": Path(r"D:\Anomaly-Videos-Part-3\Anomaly-Videos-Part-3\Robbery"),
    "Shooting": Path(r"D:\Anomaly-Videos-Part-3\Anomaly-Videos-Part-3\Shooting"),
    "Shoplifting": Path(r"D:\Anomaly-Videos-Part-4\Anomaly-Videos-Part-4\Shoplifting"),
    "Stealing": Path(r"D:\Anomaly-Videos-Part-4\Anomaly-Videos-Part-4\Stealing"),
    "Vandalism": Path(r"D:\Anomaly-Videos-Part-4\Anomaly-Videos-Part-4\Vandalism"),
    "Normal": Path(r"D:\Normal_Videos_for_Event_Recognition\Normal_Videos_for_Event_Recognition"),
}


def extract_video_frames(video_path: Path, output_dir: Path, prefix: str, num_frames: int = 12, target_size=(256, 256)):
    """
    Extracts evenly spaced representative frames from a surveillance video.
    """
    saved_count = 0
    try:
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            return 0

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            cap.release()
            return 0

        # Compute sample indices avoiding very beginning and end black frames
        margin = max(1, int(total_frames * 0.05))
        usable_frames = max(1, total_frames - 2 * margin)
        step = max(1, usable_frames // num_frames)

        frame_indices = [margin + i * step for i in range(num_frames) if (margin + i * step) < total_frames]

        for i, fidx in enumerate(frame_indices):
            cap.set(cv2.CAP_PROP_POS_FRAMES, fidx)
            ret, frame = cap.read()
            if not ret or frame is None or frame.size == 0:
                continue

            if target_size is not None:
                frame = cv2.resize(frame, target_size, interpolation=cv2.INTER_AREA)

            out_filename = f"{prefix}_{video_path.stem}_f{fidx:06d}.jpg"
            out_file = output_dir / out_filename
            cv2.imwrite(str(out_file), frame, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
            saved_count += 1

        cap.release()
    except Exception as e:
        logger.debug(f"Error extracting from {video_path.name}: {e}")
    return saved_count


def prepare_anomaly_dataset(output_root: str = "D:/UCF_Anomaly_Dataset", val_split: float = 0.2, max_frames_per_class: int = 700):
    """
    Builds a balanced classification dataset from Anomaly Videos Part 1-4 + Normal Videos.
    Structure:
      D:/UCF_Anomaly_Dataset/train/<class>/
      D:/UCF_Anomaly_Dataset/val/<class>/
    """
    out_path = Path(output_root)
    train_dir = out_path / "train"
    val_dir = out_path / "val"

    train_dir.mkdir(parents=True, exist_ok=True)
    val_dir.mkdir(parents=True, exist_ok=True)

    logger.info("==========================================================================")
    logger.info("      BORDERGUARD AI - UCF ANOMALY & NORMAL DATASET PREPARATION PIPELINE   ")
    logger.info(f"Target Directory: {out_path.resolve()}")
    logger.info(f"Validation Split: {val_split * 100:.0f}%")
    logger.info("==========================================================================")

    stats = {}
    total_train = 0
    total_val = 0

    for cat_name, source_path in SOURCE_CATEGORIES.items():
        if not source_path.exists():
            logger.warning(f"Category path missing: {source_path}")
            continue

        cat_train_dir = train_dir / cat_name
        cat_val_dir = val_dir / cat_name
        cat_train_dir.mkdir(parents=True, exist_ok=True)
        cat_val_dir.mkdir(parents=True, exist_ok=True)

        videos = list(source_path.glob("*.mp4")) + list(source_path.glob("*.avi"))
        random.seed(42)
        random.shuffle(videos)

        if not videos:
            continue

        # Split at video level so no frames from same video leak between train and val
        split_idx = max(1, int(len(videos) * (1.0 - val_split)))
        train_videos = videos[:split_idx]
        val_videos = videos[split_idx:]

        # Calculate frames per video to balance total frames per class
        frames_per_vid = max(6, min(16, max_frames_per_class // len(videos)))

        logger.info(f"[*] Processing '{cat_name:<14}': {len(train_videos)} train vids, {len(val_videos)} val vids (frames/vid: {frames_per_vid})...")

        cat_train_count = 0
        cat_val_count = 0

        # Multi-threaded extraction for rapid processing
        with ThreadPoolExecutor(max_workers=6) as executor:
            futures = []
            for v in train_videos:
                futures.append(executor.submit(extract_video_frames, v, cat_train_dir, "trn", frames_per_vid))
            for f in as_completed(futures):
                cat_train_count += f.result()

        with ThreadPoolExecutor(max_workers=6) as executor:
            futures = []
            for v in val_videos:
                futures.append(executor.submit(extract_video_frames, v, cat_val_dir, "val", frames_per_vid))
            for f in as_completed(futures):
                cat_val_count += f.result()

        stats[cat_name] = {"train": cat_train_count, "val": cat_val_count, "total": cat_train_count + cat_val_count}
        total_train += cat_train_count
        total_val += cat_val_count

    logger.info("\n================ DATASET PREPARATION SUMMARY ================")
    logger.info(f"{'Category':<16} | {'Train Frames':<12} | {'Val Frames':<12} | {'Total':<10}")
    logger.info("-" * 60)
    for cat, counts in stats.items():
        logger.info(f"{cat:<16} | {counts['train']:<12} | {counts['val']:<12} | {counts['total']:<10}")
    logger.info("-" * 60)
    logger.info(f"{'TOTAL':<16} | {total_train:<12} | {total_val:<12} | {total_train + total_val:<10}")
    logger.info("=============================================================\n")

    return str(out_path.resolve())


def train_anomaly_model(dataset_dir: str = "D:/UCF_Anomaly_Dataset", epochs: int = 15, batch_size: int = 64, imgsz: int = 224):
    """
    Fine-tunes YOLO11 Classification on the 14-class surveillance anomaly dataset.
    Saves trained model to 'models/anomaly_sentinel.pt'.
    """
    device = "0" if torch.cuda.is_available() else "cpu"
    logger.info("==========================================================================")
    logger.info("            BORDERGUARD AI - SURVEILLANCE ANOMALY MODEL TRAINING          ")
    logger.info(f"Model Base   : yolo11n-cls.pt (YOLO11 Nano SOTA Classifier)")
    logger.info(f"Dataset Root : {dataset_dir}")
    logger.info(f"Epochs       : {epochs}")
    logger.info(f"Batch Size   : {batch_size}")
    logger.info(f"Image Size   : {imgsz}x{imgsz}")
    logger.info(f"Device       : GPU {device} ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})")
    logger.info("==========================================================================")

    model = YOLO("yolo11n-cls.pt")

    train_project = AI_ENGINE_DIR / "runs" / "classify"
    train_name = "train_anomaly_sentinel"

    results = model.train(
        data=dataset_dir,
        epochs=epochs,
        batch=batch_size,
        imgsz=imgsz,
        device=device,
        workers=4,
        project=str(train_project),
        name=train_name,
        exist_ok=True,
        save=True,
        save_period=5,
        verbose=True,
    )

    best_weights = train_project / train_name / "weights" / "best.pt"
    target_weights = MODELS_DIR / "anomaly_sentinel.pt"

    if best_weights.exists():
        shutil.copy(str(best_weights), str(target_weights))
        logger.info(f"\n[+] SUCCESS! Best model weights deployed to: {target_weights.resolve()}")
    else:
        logger.warning(f"Could not locate best.pt at {best_weights}. Checked runs directory.")

    return str(target_weights)


def main():
    parser = argparse.ArgumentParser(description="BorderGuard AI Anomaly Sentinel Dataset Prep & Trainer")
    parser.add_argument("--prepare", action="store_true", help="Prepare & extract frames from Anomaly Part 1-4 and Normal videos")
    parser.add_argument("--train", action="store_true", help="Execute YOLO11 training on the prepared dataset")
    parser.add_argument("--all", action="store_true", help="Prepare dataset and train model in one end-to-end run")
    parser.add_argument("--dataset-dir", type=str, default="D:/UCF_Anomaly_Dataset", help="Dataset directory location")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs (default: 15)")
    parser.add_argument("--batch", type=int, default=64, help="Batch size for training (default: 64)")
    parser.add_argument("--imgsz", type=int, default=224, help="Image resolution (default: 224)")
    parser.add_argument("--max-frames", type=int, default=650, help="Max frames per class for extraction (default: 650)")

    args = parser.parse_args()

    # Default to --all if no specific action provided
    if not (args.prepare or args.train or args.all):
        args.all = True

    if args.prepare or args.all:
        prepare_anomaly_dataset(output_root=args.dataset_dir, max_frames_per_class=args.max_frames)

    if args.train or args.all:
        train_anomaly_model(dataset_dir=args.dataset_dir, epochs=args.epochs, batch_size=args.batch, imgsz=args.imgsz)


if __name__ == "__main__":
    main()
