# BorderGuard AI: AI Computer Vision & Tracking Pipeline

## 1. Frame Ingestion & Decoupling
To eliminate lag caused by buffer queuing in standard OpenCV `VideoCapture`, we use a dedicated reader thread (`capture/stream_reader.py`).
- It continuously calls `cap.read()` in an infinite loop.
- It writes the latest frame to a thread-safe single-slot queue (`queue.Queue(maxsize=1)`).
- When a new frame arrives, if the queue is full, the previous stale frame is discarded.
- This guarantees that inference is performed on the *latest real-world physical frame* rather than buffered frames from 2 seconds ago.

## 2. Object Detection (YOLOv8)
- Model: `yolov8n.pt` (Nano) or `yolov8s.pt` (Small) for balanced FPS and mAP.
- Inference Input: 640x640 letterbox resized tensors.
- Confidence Threshold: >= 0.50.
- Target Filter: Classes 0 (`person`), 2 (`car`), 5 (`bus`), 7 (`truck`), 16 (`dog`).

## 3. Multi-Object Tracking (ByteTrack)
Unlike simple IoU trackers, ByteTrack preserves identities through heavy occlusions:
- High-confidence detections are matched first using Kalman filter predictions.
- Unmatched tracks are subsequently tested against low-confidence detections (which may be partially occluded targets) before being dropped.
- Outputs persistent `track_id` values across the video sequence.

## 4. Zone Intersection & Debounce
1. Polygon Coordinates are normalized between `0.0` and `1.0`.
2. Target position is anchored at `(x_mid, y_bottom)`.
3. `shapely.geometry.Point.within(Polygon)` determines containment.
4. **Hysteresis Logic**:
   - `dwell_frames` must reach threshold (e.g. 15 frames / ~1.5 seconds) before event triggers.
   - Once triggered, a cooldown timer (30s) suppresses spamming identical alerts for that `track_id`.

## 5. Forensic Snapshot Generation
When a breach occurs:
- A clean copy of the frame is annotated with a high-visibility bounding box and class tag.
- The polygon boundary of the breached zone is drawn with an alert color.
- A cryptographic SHA-256 hash of the JPEG file is computed and stored alongside the record to ensure legal/forensic chain-of-custody integrity.
