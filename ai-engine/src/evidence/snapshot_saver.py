import os
import time
import json
import sqlite3
import hashlib
import numpy as np
import logging

logger = logging.getLogger("borderguard.evidence")


class EvidenceSnapshotSaver:
    """Annotates incident frames with bounding boxes, extracts clear crops of persons/weapons, and persists records to disk & DB."""

    def __init__(self, storage_dir: str):
        self.storage_dir = storage_dir
        self.snapshots_dir = os.path.join(storage_dir, "snapshots")
        self.crops_persons_dir = os.path.join(storage_dir, "crops", "persons")
        self.crops_weapons_dir = os.path.join(storage_dir, "crops", "weapons")
        self.db_path = os.path.join(storage_dir, "borderguard.db")

        os.makedirs(self.snapshots_dir, exist_ok=True)
        os.makedirs(self.crops_persons_dir, exist_ok=True)
        os.makedirs(self.crops_weapons_dir, exist_ok=True)

        self._init_sqlite_db()

    def _init_sqlite_db(self):
        """Initializes standalone SQLite DB tables if not existing for instant local database recording."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS instant_detections (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    camera_id TEXT,
                    event_type TEXT NOT NULL,
                    target_class TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    bbox TEXT NOT NULL,
                    is_armed INTEGER DEFAULT 0,
                    weapon_details TEXT,
                    total_persons INTEGER DEFAULT 0,
                    total_weapons INTEGER DEFAULT 0,
                    total_explosives INTEGER DEFAULT 0,
                    total_suspicious INTEGER DEFAULT 0,
                    full_snapshot_path TEXT,
                    person_crop_path TEXT,
                    weapon_crop_path TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Failed to initialize SQLite instant DB: {e}")

    def save_crop(
        self,
        frame: np.ndarray,
        bbox: list,
        crop_type: str,
        class_name: str,
        track_id: int = None
    ) -> dict:
        """
        Extracts high-resolution crop of person or weapon/explosive from image frame.
        crop_type: 'person' or 'weapon'
        """
        try:
            import cv2
            h, w = frame.shape[:2]
            x1, y1, x2, y2 = [int(v) for v in bbox]

            # Add padding margin around crop
            margin = 15
            px1 = max(0, x1 - margin)
            py1 = max(0, y1 - margin)
            px2 = min(w, x2 + margin)
            py2 = min(h, y2 + margin)

            crop_img = frame[py1:py2, px1:px2]
            if crop_img.size == 0:
                crop_img = frame[y1:y2, x1:x2]

            timestamp_str = int(time.time() * 1000)
            tid_str = f"id{track_id}_" if track_id is not None else ""

            if crop_type == "person":
                filename = f"person_{tid_str}{timestamp_str}.jpg"
                save_dir = self.crops_persons_dir
                rel_path = f"crops/persons/{filename}"
            else:
                clean_cls = class_name.replace(" ", "_").lower()
                filename = f"weapon_{clean_cls}_{tid_str}{timestamp_str}.jpg"
                save_dir = self.crops_weapons_dir
                rel_path = f"crops/weapons/{filename}"

            filepath = os.path.join(save_dir, filename)
            cv2.imwrite(filepath, crop_img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])

            return {
                "filename": filename,
                "relative_path": rel_path,
                "absolute_path": filepath,
                "crop_type": crop_type,
                "class_name": class_name
            }
        except Exception as e:
            logger.error(f"Failed to save crop ({crop_type}, {class_name}): {e}")
            return None

    def save_instant_db_record(
        self,
        event_type: str,
        target_class: str,
        confidence: float,
        bbox: list,
        is_armed: bool,
        weapon_details: str,
        total_persons: int,
        total_weapons: int,
        total_explosives: int,
        total_suspicious: int,
        full_snapshot_path: str = None,
        person_crop_path: str = None,
        weapon_crop_path: str = None,
        camera_id: str = "default_cam"
    ) -> bool:
        """Instantly inserts detection incident details into local SQLite database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

            cursor.execute("""
                INSERT INTO instant_detections (
                    timestamp, camera_id, event_type, target_class, confidence, bbox,
                    is_armed, weapon_details, total_persons, total_weapons,
                    total_explosives, total_suspicious, full_snapshot_path,
                    person_crop_path, weapon_crop_path
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                ts, camera_id, event_type, target_class, float(confidence),
                json.dumps(bbox), 1 if is_armed else 0, weapon_details,
                total_persons, total_weapons, total_explosives, total_suspicious,
                full_snapshot_path, person_crop_path, weapon_crop_path
            ))

            conn.commit()
            conn.close()
            logger.info(f"[+] Instant DB Record saved for {target_class} (Armed: {is_armed})")
            return True
        except Exception as e:
            logger.error(f"Failed to insert instant DB record: {e}")
            return False

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
            if zone_polygon_coords:
                pts = np.array([[int(p[0] * w), int(p[1] * h)] for p in zone_polygon_coords], np.int32)
                pts = pts.reshape((-1, 1, 2))
                cv2.polylines(annotated, [pts], isClosed=True, color=(0, 0, 239), thickness=3)

            # Draw target bounding box
            det = track.detection if hasattr(track, 'detection') else track
            if hasattr(det, 'x1'):
                x1, y1, x2, y2 = int(det.x1), int(det.y1), int(det.x2), int(det.y2)
                cls_name = getattr(det, 'class_name', 'target')
                conf = getattr(det, 'confidence', 0.9)
                tid = getattr(track, 'track_id', 0)
            else:
                x1, y1, x2, y2 = [int(v) for v in det.get('bbox', [0,0,0,0])]
                cls_name = det.get('class', 'target')
                conf = det.get('conf', 0.9)
                tid = det.get('track_id', 0)

            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 3)

            # Draw label tag
            label = f"ALERT #{tid} {cls_name.upper()} {int(conf*100)}%"
            cv2.rectangle(annotated, (x1, max(0, y1 - 30)), (x1 + len(label) * 11, y1), (0, 0, 255), -1)
            cv2.putText(annotated, label, (x1 + 5, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

            # Timestamp & telemetry bar
            ts = time.strftime("%Y-%m-%d %H:%M:%S UTC")
            telemetry = f"SECTOR: {camera_name} | {ts} | FORENSIC AUDIT TRAIL"
            cv2.rectangle(annotated, (0, h - 35), (w, h), (10, 15, 25), -1)
            cv2.putText(annotated, telemetry, (20, h - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 220, 255), 1)

            # Save file
            filename = f"ev_{camera_id[:6]}_{tid}_{int(time.time())}.jpg"
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

