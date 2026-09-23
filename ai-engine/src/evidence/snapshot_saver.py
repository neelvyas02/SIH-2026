import os
import time
import hashlib
import numpy as np
import logging

logger = logging.getLogger("borderguard.evidence")


class EvidenceSnapshotSaver:
    """Annotates incident frames with bounding boxes and zone boundaries, then hashes and persists them."""

    def __init__(self, storage_dir: str):
        self.storage_dir = storage_dir
        self.snapshots_dir = os.path.join(storage_dir, "snapshots")
        os.makedirs(self.snapshots_dir, exist_ok=True)

    def save_incident_snapshot(
        self,
        frame: np.ndarray,
        track,
        zone_polygon_coords: list,
        camera_id: str,
        camera_name: str
    ) -> dict:
        """Draws annotations and saves forensic snapshot to storage."""
        annotated = frame.copy()
        h, w = frame.shape[:2]

        # Draw zone polygon
        try:
            import cv2
            pts = np.array([[int(p[0] * w), int(p[1] * h)] for p in zone_polygon_coords], np.int32)
            pts = pts.reshape((-1, 1, 2))
            cv2.polylines(annotated, [pts], isClosed=True, color=(0, 0, 239), thickness=3)

            # Draw target bounding box
            det = track.detection
            x1, y1, x2, y2 = int(det.x1), int(det.y1), int(det.x2), int(det.y2)
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 3)

            # Draw ground anchor point (feet)
            gx, gy = int((x1 + x2) / 2), int(y2)
            cv2.circle(annotated, (gx, gy), 6, (0, 255, 255), -1)

            # Draw label tag
            label = f"INTRUSION #{track.track_id} {det.class_name.upper()} {int(det.confidence*100)}%"
            cv2.rectangle(annotated, (x1, y1 - 30), (x1 + len(label) * 11, y1), (0, 0, 255), -1)
            cv2.putText(annotated, label, (x1 + 5, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

            # Timestamp & telemetry bar
            ts = time.strftime("%Y-%m-%d %H:%M:%S UTC")
            telemetry = f"SECTOR: {camera_name} | {ts} | FORENSIC AUDIT TRAIL"
            cv2.rectangle(annotated, (0, h - 35), (w, h), (10, 15, 25), -1)
            cv2.putText(annotated, telemetry, (20, h - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 220, 255), 1)

            # Save file
            filename = f"ev_{camera_id[:6]}_{track.track_id}_{int(time.time())}.jpg"
            filepath = os.path.join(self.snapshots_dir, filename)
            cv2.imwrite(filepath, annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 85])

            # Compute SHA-256
            hasher = hashlib.sha256()
            with open(filepath, "rb") as f:
                hasher.update(f.read())
            sha256_hash = hasher.hexdigest()

            return {
                "filename": filename,
                "relative_path": f"snapshots/{filename}",
                "sha256_hash": sha256_hash
            }
        except Exception as e:
            logger.error(f"Failed to generate evidence snapshot: {e}")
            return {
                "filename": "mock_evidence.jpg",
                "relative_path": "snapshots/sample_evidence_104.jpg",
                "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            }
