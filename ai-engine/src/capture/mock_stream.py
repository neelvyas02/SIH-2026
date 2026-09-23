import os
import cv2
import time
import numpy as np
import logging

logger = logging.getLogger("borderguard.mock_stream")


class MockVideoSimulator:
    """Simulates a continuous CCTV feed either by looping an MP4 or generating synthetic surveillance frames."""

    def __init__(self, video_path: str = None, width: int = 1280, height: int = 720, target_fps: int = 25):
        self.video_path = video_path
        self.width = width
        self.height = height
        self.target_fps = target_fps
        self.frame_delay = 1.0 / target_fps
        
        self.cap = None
        self.frame_idx = 0
        self.use_synthetic = False

        if self.video_path and os.path.exists(self.video_path):
            self.cap = cv2.VideoCapture(self.video_path)
            logger.info(f"Loaded local test video: {self.video_path}")
        else:
            self.use_synthetic = True
            logger.info("No valid local video provided. Generating synthetic border surveillance feed.")

    def read_frame(self):
        """Yields next video frame with realistic timing delay."""
        time.sleep(self.frame_delay)
        self.frame_idx += 1

        if not self.use_synthetic and self.cap:
            ret, frame = self.cap.read()
            if not ret or frame is None:
                # Loop back to beginning
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = self.cap.read()

            if ret and frame is not None:
                return frame

        # Generate synthetic night/day border surveillance frame
        return self._generate_synthetic_frame()

    def _generate_synthetic_frame(self) -> np.ndarray:
        # Dark twilight background (Border outpost night surveillance)
        frame = np.full((self.height, self.width, 3), (25, 30, 40), dtype=np.uint8)

        # Draw terrain/ground line
        ground_y = int(self.height * 0.45)
        cv2.line(frame, (0, ground_y), (self.width, ground_y), (40, 50, 60), 2)

        # Draw simulated perimeter fence (vertical posts and crosswires)
        for x in range(50, self.width, 100):
            cv2.line(frame, (x, ground_y - 80), (x, ground_y + 40), (70, 75, 80), 2)
        cv2.line(frame, (0, ground_y - 60), (self.width, ground_y - 60), (60, 65, 70), 1)
        cv2.line(frame, (0, ground_y - 20), (self.width, ground_y - 20), (60, 65, 70), 1)

        # Simulate a walking intruder moving across the screen from left to right
        # Cycle over 200 frames
        cycle_pos = (self.frame_idx % 240) / 240.0
        intruder_x = int(50 + cycle_pos * (self.width - 150))
        # Walk towards camera (y decreases, size increases)
        intruder_y = int(ground_y + 50 + cycle_pos * 180)
        h = int(90 + cycle_pos * 100)
        w = int(h * 0.45)

        # Draw intruder silhouette
        x1 = intruder_x
        y1 = intruder_y - h
        x2 = intruder_x + w
        y2 = intruder_y

        # Draw body and head
        cv2.rectangle(frame, (x1, y1 + int(h * 0.25)), (x2, y2), (20, 20, 25), -1)
        center_x = (x1 + x2) // 2
        head_radius = int(w * 0.4)
        cv2.circle(frame, (center_x, y1 + head_radius + 5), head_radius, (25, 25, 30), -1)

        # Add timestamp & camera telemetry overlay
        ts_text = time.strftime("%Y-%m-%d %H:%M:%S UTC")
        cv2.putText(frame, f"CAM-01 [SECTOR 7B] | {ts_text}", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 220, 240), 2)

        return frame

    def release(self):
        if self.cap:
            self.cap.release()
