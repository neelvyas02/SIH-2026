import cv2
import time
import threading
import queue
import logging

logger = logging.getLogger("borderguard.stream_reader")


class RTSPStreamReader:
    """Multi-threaded non-blocking OpenCV RTSP frame grabber.
    
    Drops backlogged frames to prevent latency accumulation and automatically
    reconnects if the CCTV feed drops.
    """

    def __init__(self, stream_url: str, camera_id: str, max_reconnect_attempts: int = 10):
        self.stream_url = stream_url
        self.camera_id = camera_id
        self.max_reconnect_attempts = max_reconnect_attempts
        
        # Single slot queue: always holds only the latest frame
        self.frame_queue = queue.Queue(maxsize=1)
        self.running = False
        self.thread = None
        self.is_connected = False
        self.cap = None

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        logger.info(f"Started video capture thread for camera {self.camera_id}")

    def stop(self):
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2.0)
        if self.cap and self.cap.isOpened():
            self.cap.release()
        logger.info(f"Stopped video capture thread for camera {self.camera_id}")

    def _connect(self) -> bool:
        if self.cap and self.cap.isOpened():
            self.cap.release()

        logger.info(f"Connecting to video stream: {self.stream_url}")
        self.cap = cv2.VideoCapture(self.stream_url)
        # Attempt to set lower buffer size in OpenCV
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        if self.cap.isOpened():
            self.is_connected = True
            logger.info(f"Successfully connected to stream: {self.stream_url}")
            return True
        else:
            self.is_connected = False
            logger.error(f"Failed to open stream: {self.stream_url}")
            return False

    def _capture_loop(self):
        reconnect_count = 0

        while self.running:
            if not self.is_connected:
                if not self._connect():
                    reconnect_count += 1
                    time.sleep(min(2 ** reconnect_count, 10))
                    continue
                else:
                    reconnect_count = 0

            ret, frame = self.cap.read()
            if not ret or frame is None:
                logger.warning(f"Failed to read frame from {self.stream_url}. Triggering reconnect...")
                self.is_connected = False
                time.sleep(1.0)
                continue

            # Push to queue, dropping stale frame if consumer has not read yet
            if self.frame_queue.full():
                try:
                    self.frame_queue.get_nowait()
                except queue.Empty:
                    pass

            try:
                self.frame_queue.put_nowait(frame)
            except queue.Full:
                pass

    def read_latest_frame(self, timeout: float = 0.5):
        """Returns the most recent physical frame or None if timeout."""
        try:
            return self.frame_queue.get(timeout=timeout)
        except queue.Empty:
            return None
