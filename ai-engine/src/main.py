import os
import sys
import time
import argparse
import logging

# Add src to path
sys.path.insert(0, os.path.dirname(__file__))

from capture.mock_stream import MockVideoSimulator
from capture.stream_reader import RTSPStreamReader
from detector.yolo_detector import YOLODetector
from tracker.byte_tracker import MultiObjectTracker
from zones.polygon_engine import PolygonZoneEngine
from zones.hysteresis import ZoneHysteresisFilter
from evidence.snapshot_saver import EvidenceSnapshotSaver
from dispatcher.backend_client import BackendEventDispatcher

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [AI-ENGINE] %(message)s"
)
logger = logging.getLogger("borderguard.ai_main")


def run_pipeline(source: str = None, camera_id: str = "b1a23e54-7890-4c12-a345-6789abcdef01", camera_name: str = "Watchtower 04 - Zero Line"):
    logger.info("Initializing BorderGuard AI Analytics Pipeline...")

    # Default Restricted Zone (Barbed wire sector)
    default_polygon = [[0.15, 0.40], [0.88, 0.38], [0.95, 0.88], [0.08, 0.92]]
    zone_engine = PolygonZoneEngine(
        zone_id="9f8e7d6c-5b4a-3210-fedc-ba9876543210",
        name="Zero-Line Barbed Wire Buffer",
        polygon_coords=default_polygon,
        severity="critical"
    )

    # Initialize components
    detector = YOLODetector(conf_thresh=0.50)
    tracker = MultiObjectTracker(iou_threshold=0.3, max_lost_frames=25)
    hysteresis = ZoneHysteresisFilter(min_dwell_frames=12, cooldown_seconds=20.0)
    
    storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage"))
    evidence_saver = EvidenceSnapshotSaver(storage_dir=storage_dir)
    dispatcher = BackendEventDispatcher()

    # Determine video source
    is_rtsp = source and source.startswith(("rtsp://", "http://", "https://"))
    if is_rtsp:
        logger.info(f"Using live RTSP stream: {source}")
        stream = RTSPStreamReader(stream_url=source, camera_id=camera_id)
        stream.start()
    else:
        logger.info(f"Using mock/file stream simulator: {source or 'SYNTHETIC_GENERATOR'}")
        stream = MockVideoSimulator(video_path=source)

    frame_count = 0
    fps_timer = time.time()

    logger.info("BorderGuard AI Sentinel active. Processing surveillance feed...")

    try:
        while True:
            # Grab frame
            if is_rtsp:
                frame = stream.read_latest_frame(timeout=0.5)
            else:
                frame = stream.read_frame()

            if frame is None:
                time.sleep(0.01)
                continue

            frame_count += 1
            # Skip frames: process 1 in 2 to reduce compute and sustain smooth FPS
            if frame_count % 2 != 0:
                continue

            h, w = frame.shape[:2]

            # 1. Detect objects
            detections = detector.detect(frame)

            # 2. Track objects
            active_tracks = tracker.update(detections)

            # 3. Analyze restricted zone containment
            for track in active_tracks:
                is_inside = zone_engine.check_tracked_object(track, frame_width=w, frame_height=h)
                
                # Check hysteresis dwell timer
                should_alert = hysteresis.update(
                    zone_id=zone_engine.zone_id,
                    track_id=track.track_id,
                    is_inside=is_inside
                )

                if should_alert:
                    logger.warning(
                        f"ALERT TRIGGERED: Target #{track.track_id} ({track.detection.class_name}) "
                        f"breached restricted zone '{zone_engine.name}'!"
                    )

                    # 4. Capture & hash forensic snapshot
                    evidence_meta = evidence_saver.save_incident_snapshot(
                        frame=frame,
                        track=track,
                        zone_polygon_coords=default_polygon,
                        camera_id=camera_id,
                        camera_name=camera_name
                    )

                    # 5. Dispatch webhook event to FastAPI Backend
                    event_payload = {
                        "event_type": "zone_intrusion",
                        "camera_id": camera_id,
                        "zone_id": zone_engine.zone_id,
                        "track_id": track.track_id,
                        "target_class": track.detection.class_name,
                        "confidence_score": round(track.detection.confidence, 3),
                        "bounding_box": track.detection.bbox_xywh,
                        "ground_point": {
                            "x_norm": round(track.detection.ground_anchor[0] / w, 3),
                            "y_norm": round(track.detection.ground_anchor[1] / h, 3)
                        },
                        "dwell_duration_seconds": round(hysteresis.get_dwell_seconds(zone_engine.zone_id, track.track_id), 1),
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        "evidence": {
                            "snapshot_filename": evidence_meta["filename"],
                            "relative_path": evidence_meta["relative_path"],
                            "sha256_hash": evidence_meta["sha256_hash"]
                        }
                    }

                    dispatcher.send_intrusion_event(event_payload)

            # Log telemetry every 100 frames
            if frame_count % 100 == 0:
                elapsed = time.time() - fps_timer
                fps = 100.0 / elapsed if elapsed > 0 else 0
                logger.info(f"AI Pipeline Status: Healthy | Processing @ {fps:.1f} FPS | Active Tracks: {len(active_tracks)}")
                fps_timer = time.time()

    except KeyboardInterrupt:
        logger.info("Terminating AI Analytics Pipeline...")
    finally:
        if is_rtsp:
            stream.stop()
        else:
            stream.release()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BorderGuard AI Computer Vision & Tracking Sentinel")
    parser.add_argument("--source", type=str, default=None, help="RTSP URL or path to local test MP4 video")
    parser.add_argument("--camera-id", type=str, default="b1a23e54-7890-4c12-a345-6789abcdef01", help="Camera UUID in database")
    parser.add_argument("--camera-name", type=str, default="Watchtower 04 - Zero Line", help="Descriptive camera sector name")
    args = parser.parse_args()

    run_pipeline(source=args.source, camera_id=args.camera_id, camera_name=args.camera_name)
