import io
import pytest
from PIL import Image


@pytest.mark.asyncio
async def test_detect_objects_endpoint(client):
    # Create a simple 320x240 RGB JPEG in memory
    img = Image.new("RGB", (320, 240), color=(50, 100, 150))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"file": ("frame.jpg", buf.read(), "image/jpeg")}
    response = await client.post("/api/v1/detect", files=files)

    assert response.status_code == 200
    data = response.json()
    assert "timestamp" in data
    assert "inference_time_ms" in data
    assert "objects_count" in data
    assert "detections" in data
    assert isinstance(data["detections"], list)

    for item in data["detections"]:
        assert "class" in item
        assert "confidence" in item
        assert "bbox" in item
        assert len(item["bbox"]) == 4
