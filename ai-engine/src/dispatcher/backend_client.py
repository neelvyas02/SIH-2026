import json
import logging
import threading
import httpx

logger = logging.getLogger("borderguard.dispatcher")


class BackendEventDispatcher:
    """Dispatches validated security events to the FastAPI backend webhook asynchronously in background thread."""

    def __init__(self, backend_url: str = "http://localhost:8000/api/v1", secret_key: str = "ai-engine-internal-hmac-secret-key-987654"):
        self.backend_url = backend_url.rstrip("/")
        self.secret_key = secret_key
        self.webhook_url = f"{self.backend_url}/internal/events"
        self.health_url = f"{self.backend_url}/internal/camera-health"

    def send_intrusion_event(self, event_payload: dict) -> bool:
        """Asynchronously dispatches intrusion event in a non-blocking daemon thread."""
        def _worker():
            headers = {
                "Content-Type": "application/json",
                "X-Internal-Secret": self.secret_key
            }
            try:
                with httpx.Client(timeout=0.8) as client:
                    client.post(self.webhook_url, json=event_payload, headers=headers)
            except Exception:
                pass  # Silent fallback if backend is offline

        threading.Thread(target=_worker, daemon=True).start()
        return True

    def send_camera_health(self, camera_id: str, status: str, error_code: str = None, error_message: str = None):
        """Notifies backend of stream disconnect or recovery."""
        def _worker():
            headers = {
                "Content-Type": "application/json",
                "X-Internal-Secret": self.secret_key
            }
            payload = {
                "camera_id": camera_id,
                "status": status,
                "error_code": error_code,
                "error_message": error_message
            }
            try:
                with httpx.Client(timeout=0.8) as client:
                    client.post(self.health_url, json=payload, headers=headers)
            except Exception:
                pass

        threading.Thread(target=_worker, daemon=True).start()

