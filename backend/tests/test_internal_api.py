import pytest
from app.models.camera import Camera
from app.core.config import settings


@pytest.mark.asyncio
async def test_internal_event_unauthorized(client):
    payload = {
        "event_type": "zone_intrusion",
        "camera_id": "test-cam",
        "track_id": 101,
        "target_class": "person",
        "confidence_score": 0.92,
        "bounding_box": {"x_min": 100, "y_min": 100, "width": 50, "height": 100}
    }
    response = await client.post("/api/v1/internal/events", json=payload)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_internal_event_authorized(client, async_db):
    cam = Camera(
        id="test-cam-1",
        name="Outpost 1",
        location="Sector 1",
        stream_url="rtsp://localhost:8554/live/1",
        status="online",
        is_active=True
    )
    async_db.add(cam)
    await async_db.commit()

    payload = {
        "event_type": "zone_intrusion",
        "camera_id": "test-cam-1",
        "track_id": 101,
        "target_class": "person",
        "confidence_score": 0.92,
        "bounding_box": {"x_min": 100, "y_min": 100, "width": 50, "height": 100},
        "dwell_duration_seconds": 2.1
    }
    response = await client.post(
        "/api/v1/internal/events",
        json=payload,
        headers={"X-Internal-Secret": settings.AI_SERVICE_SECRET}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert "alert_id" in data
