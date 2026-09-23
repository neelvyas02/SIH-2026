import json
import logging
import httpx

logger = logging.getLogger("borderguard.dispatcher")


class BackendEventDispatcher:
    """Dispatches validated security events to the FastAPI backend webhook."""

    def __init__(self, backend_url: str = "http://localhost:8000/api/v1", secret_key: str = "ai-engine-internal-hmac-secret-key-987654"):
        self.backend_url = backend_url.rstrip("/")
        self.secret_key = secret_key
        self.webhook_url = f"{self.backend_url}/internal/events"
        self.health_url = f"{self.backend_url}/internal/camera-health"

    def send_intrusion_event(self, event_payload: dict) -> bool:
        """Synchronously or asynchronously sends intrusion event to FastAPI."""
        headers = {
            "Content-Type": "application/json",
            "X-Internal-Secret": self.secret_key
        }

        try:
            with httpx.Client(timeout=4.0) as client:
                response = client.post(self.webhook_url, json=event_payload, headers=headers)
                if response.status_code in [200, 201]:
                    logger.info(f"Successfully posted incident to backend: {response.json()}")
                    return True
                else:
                    logger.warning(f"Backend rejected event with code {response.status_code}: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Failed to communicate with FastAPI backend ({e}). Check if backend is running on port 8000.")
            return False

    def send_camera_health(self, camera_id: str, status: str, error_code: str = None, error_message: str = None):
        """Notifies backend of stream disconnect or recovery."""
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
            with httpx.Client(timeout=3.0) as client:
                client.post(self.health_url, json=payload, headers=headers)
        except Exception as e:
            logger.warning(f"Failed to post camera health status: {e}")
