import pytest
from app.models.camera import Camera


@pytest.mark.asyncio
async def test_list_cameras(client, async_db):
    cam = Camera(
        id="cam-uuid-1",
        name="Post Alpha",
        location="Sector 1",
        stream_url="rtsp://localhost:8554/live/test",
        stream_type="rtsp",
        fps=25,
        status="online",
        is_active=True
    )
    async_db.add(cam)
    await async_db.commit()

    response = await client.get("/api/v1/cameras")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Post Alpha"
