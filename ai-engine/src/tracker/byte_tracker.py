from typing import List, Dict, Optional
import numpy as np
# type checking placeholder
import logging

logger = logging.getLogger("borderguard.tracker")


class TrackedObject:
    def __init__(self, track_id: int, detection, max_lost_frames: int = 30):
        self.track_id = track_id
        self.detection = detection
        self.lost_frames = 0
        self.max_lost_frames = max_lost_frames
        self.age = 1
        self.history = [detection.ground_anchor]

    def update(self, detection):
        self.detection = detection
        self.lost_frames = 0
        self.age += 1
        self.history.append(detection.ground_anchor)
        if len(self.history) > 60:
            self.history.pop(0)

    def mark_lost(self):
        self.lost_frames += 1

    @property
    def is_dead(self) -> bool:
        return self.lost_frames > self.max_lost_frames


def compute_iou(boxA, boxB) -> float:
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
    unionArea = float(boxAArea + boxBArea - interArea)
    if unionArea == 0:
        return 0.0
    return interArea / unionArea


class MultiObjectTracker:
    """ByteTrack-style IoU and spatial trajectory tracker assigning persistent Track IDs."""

    def __init__(self, iou_threshold: float = 0.3, max_lost_frames: int = 25):
        self.iou_threshold = iou_threshold
        self.max_lost_frames = max_lost_frames
        self.next_track_id = 101
        self.active_tracks: Dict[int, TrackedObject] = {}

    def update(self, detections) -> List[TrackedObject]:
        """Matches incoming detections to active tracks, creates new tracks, and prunes stale tracks."""
        if not detections:
            # Mark all tracks as lost
            for track in self.active_tracks.values():
                track.mark_lost()
            self._prune_dead_tracks()
            return [t for t in self.active_tracks.values() if t.lost_frames == 0]

        matched_tracks = set()
        matched_detections = set()

        # Compute IoU matrix between active tracks and detections
        for track_id, track in self.active_tracks.items():
            track_box = [track.detection.x1, track.detection.y1, track.detection.x2, track.detection.y2]
            best_iou = 0.0
            best_det_idx = -1

            for idx, det in enumerate(detections):
                if idx in matched_detections:
                    continue
                det_box = [det.x1, det.y1, det.x2, det.y2]
                iou = compute_iou(track_box, det_box)
                if iou > best_iou:
                    best_iou = iou
                    best_det_idx = idx

            if best_iou >= self.iou_threshold and best_det_idx != -1:
                track.update(detections[best_det_idx])
                matched_tracks.add(track_id)
                matched_detections.add(best_det_idx)
            else:
                track.mark_lost()

        # Create new tracks for unmatched detections
        for idx, det in enumerate(detections):
            if idx not in matched_detections:
                new_track = TrackedObject(
                    track_id=self.next_track_id,
                    detection=det,
                    max_lost_frames=self.max_lost_frames
                )
                self.active_tracks[self.next_track_id] = new_track
                self.next_track_id += 1

        self._prune_dead_tracks()
        return [t for t in self.active_tracks.values() if t.lost_frames == 0]

    def _prune_dead_tracks(self):
        dead_ids = [t_id for t_id, track in self.active_tracks.items() if track.is_dead]
        for t_id in dead_ids:
            del self.active_tracks[t_id]
