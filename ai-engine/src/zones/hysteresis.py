import time
from typing import Dict
import logging

logger = logging.getLogger("borderguard.hysteresis")


class ZoneHysteresisFilter:
    """Manages dwell duration counters and alert anti-flapping debounce timers."""

    def __init__(self, min_dwell_frames: int = 15, cooldown_seconds: float = 30.0):
        self.min_dwell_frames = min_dwell_frames
        self.cooldown_seconds = cooldown_seconds

        # Map: (zone_id, track_id) -> dwell_count
        self.dwell_counters: Dict[tuple, int] = {}
        # Map: (zone_id, track_id) -> last_alert_time
        self.last_alert_times: Dict[tuple, float] = {}

    def update(self, zone_id: str, track_id: int, is_inside: bool) -> bool:
        """Updates dwell status for track in zone. Returns True only if an alert should trigger."""
        key = (zone_id, track_id)
        now = time.time()

        if not is_inside:
            # Gradually decay or reset counter if target leaves
            if key in self.dwell_counters:
                self.dwell_counters[key] = max(0, self.dwell_counters[key] - 2)
            return False

        # Target is inside zone
        current_dwell = self.dwell_counters.get(key, 0) + 1
        self.dwell_counters[key] = current_dwell

        # Check if dwell threshold exceeded
        if current_dwell >= self.min_dwell_frames:
            last_alert = self.last_alert_times.get(key, 0.0)
            if now - last_alert >= self.cooldown_seconds:
                self.last_alert_times[key] = now
                logger.info(f"Dwell threshold reached for track #{track_id} in zone '{zone_id}'. Triggering incident!")
                return True

        return False

    def get_dwell_seconds(self, zone_id: str, track_id: int, fps: float = 25.0) -> float:
        frames = self.dwell_counters.get((zone_id, track_id), 0)
        return float(frames) / fps
