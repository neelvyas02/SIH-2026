#!/usr/bin/env python3
"""
BorderGuard AI - Automated Google Drive UCF_Crime Dataset Unzipper & Model Trainer
Handles zip extraction of UCF_Crime files (Anomaly_Videos_Part_1.zip .. 4.zip, Training_Normal_Videos_Part_1.zip .. 2.zip),
frame sampling, YOLO dataset generation, and model training to produce 'models/surveillance_sentinel.pt'.
"""

import os
import sys
import zipfile
import argparse
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [UCF-GDRIVE] %(message)s")
logger = logging.getLogger("borderguard.ucf_gdrive")

AI_ENGINE_DIR = Path(__file__).resolve().parent
MODELS_DIR = AI_ENGINE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

UCF_CLASSES = {
    0: "normal",
    1: "abuse",
    2: "arrest",
    3: "arson",
    4: "assault",
    5: "burglary",
    6: "explosion",
    7: "fighting",
    8: "road_accidents",
    9: "robbery",
    10: "shooting",
    11: "shoplifting",
    12: "stealing",
    13: "vandalism",
    14: "weapon"
}


def unzip_ucf_dataset(gdrive_ucf_dir: str, target_extract_dir: str):
    """
    Unzips all UCF_Crime zip files (Anomaly_Videos_Part_1.zip ... Training_Normal_Videos_Part_2.zip) to target directory.
    """
    gdrive_path = Path(gdrive_ucf_dir)
    extract_path = Path(target_extract_dir)
    extract_path.mkdir(parents=True, exist_ok=True)

    zip_files = list(gdrive_path.glob("*.zip"))
    if not zip_files:
        logger.error(f"No zip files found in '{gdrive_ucf_dir}'! Ensure your Google Drive UCF_Crime directory contains zip files.")
        return False

    logger.info(f"Found {len(zip_files)} dataset zip archives in {gdrive_ucf_dir}.")
    for zfile in zip_files:
        logger.info(f"Unzipping '{zfile.name}' to {extract_path}...")
        try:
            with zipfile.ZipFile(zfile, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
            logger.info(f"[+] Successfully extracted '{zfile.name}'!")
        except Exception as e:
            logger.error(f"[-] Failed to unzip '{zfile.name}': {e}")

    return True


def extract_frames_and_build_dataset(dataset_dir: str, output_yolo_dir: str, sample_fps: int = 5):
    """
    Extracts frames from unzipped surveillance videos and creates train/val frame directories.
    """
    try:
        import cv2
    except ImportError:
        logger.error("OpenCV is required. Install with `pip install opencv-python`.")
        return

    dataset_path = Path(dataset_dir)
    yolo_path = Path(output_yolo_dir)

    train_img_dir = yolo_path / "images" / "train"
    val_img_dir = yolo_path / "images" / "val"
    train_img_dir.mkdir(parents=True, exist_ok=True)
    val_img_dir.mkdir(parents=True, exist_ok=True)

    video_files = list(dataset_path.rglob("*.mp4")) + list(dataset_path.rglob("*.avi"))
    logger.info(f"Found {len(video_files)} video clips across extracted dataset.")

    for idx, vpath in enumerate(video_files):
        is_val = (idx % 5 == 0)  # 80/20 train/val split
        target_dir = val_img_dir if is_val else train_img_dir

        cap = cv2.VideoCapture(str(vpath))
        if not cap.isOpened():
            continue

        native_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_interval = max(1, int(native_fps / sample_fps))
        fcnt = 0
        saved = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            fcnt += 1

            if fcnt % frame_interval == 0:
                img_name = f"{vpath.stem}_f{fcnt:06d}.jpg"
                cv2.imwrite(str(target_dir / img_name), frame, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
                saved += 1

        cap.release()
        logger.info(f"[{idx+1}/{len(video_files)}] Processed '{vpath.name}' -> Extracted {saved} frames.")


def create_yaml_config(output_yolo_dir: str, yaml_path: str = "surveillance_ucf.yaml"):
    """
    Creates YOLO dataset YAML config.
    """
    abs_yolo = str(Path(output_yolo_dir).resolve()).replace("\\", "/")
    content = f"""# BorderGuard AI - Surveillance Sentinel Model Config
path: {abs_yolo}
train: images/train
val: images/val

names:
"""
    for cid, cname in UCF_CLASSES.items():
        content += f"  {cid}: {cname}\n"

    with open(yaml_path, "w") as f:
        f.write(content)

    logger.info(f"[+] Created surveillance YAML config: {yaml_path}")
    return yaml_path


def train_surveillance_sentinel_model(yaml_path: str, epochs: int = 50, batch: int = 16):
    """
    Trains custom Surveillance Sentinel Model and outputs 'ai-engine/models/surveillance_sentinel.pt'.
    """
    try:
        from ultralytics import YOLO
        logger.info("[*] Starting YOLO training for Surveillance Sentinel Model...")
        model = YOLO("yolov8m.pt")
        results = model.train(
            data=yaml_path,
            epochs=epochs,
            batch=batch,
            imgsz=640,
            device=0,
            workers=8,
            project=str(AI_ENGINE_DIR / "runs" / "detect"),
            name="train_surveillance_sentinel"
        )

        # Copy best weights to models/surveillance_sentinel.pt
        best_weights = AI_ENGINE_DIR / "runs" / "detect" / "train_surveillance_sentinel" / "weights" / "best.pt"
        target_sentinel = MODELS_DIR / "surveillance_sentinel.pt"

        if best_weights.exists():
            import shutil
            shutil.copy(str(best_weights), str(target_sentinel))
            logger.info(f"[+] SUCCESS! Trained Surveillance Sentinel Model saved to: {target_sentinel}")
        else:
            logger.warning(f"Training complete. Weights location: {best_weights}")

    except Exception as e:
        logger.error(f"Failed to train Surveillance Sentinel Model: {e}")


def main():
    parser = argparse.ArgumentParser(description="Google Drive UCF_Crime Automated Model Trainer for Surveillance Sentinel")
    parser.add_argument("--gdrive-dir", type=str, default="G:/My Drive/Datasets/UCF_Crime", help="Path to Google Drive UCF_Crime folder containing zip files")
    parser.add_argument("--extract-dir", type=str, default="D:/UCF_Extracted", help="Local temporary directory to extract zip files")
    parser.add_argument("--yolo-dir", type=str, default="D:/UCF_YOLO_Dataset", help="Directory to store extracted frames for YOLO training")
    parser.add_argument("--skip-unzip", action="store_true", help="Skip unzipping if already unzipped")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs (default: 50)")

    args = parser.parse_args()

    if not args.skip_unzip:
        unzip_ucf_dataset(args.gdrive_dir, args.extract_dir)

    extract_frames_and_build_dataset(args.extract_dir, args.yolo_dir)
    yaml_file = create_yaml_config(args.yolo_dir)
    train_surveillance_sentinel_model(yaml_file, epochs=args.epochs)


if __name__ == "__main__":
    main()
