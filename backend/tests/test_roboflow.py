import io
import pytest
from unittest.mock import MagicMock, patch
from PIL import Image
from httpx import AsyncClient
from app.services.roboflow_service import RoboflowService
from app.core.config import settings


def test_roboflow_service_unconfigured():
    """Verify that RoboflowService reports not configured when API key is missing."""
    service = RoboflowService(api_key="")
    assert not service.is_configured()
    
    with pytest.raises(ValueError, match="ROBOFLOW_API_KEY is not configured"):
        service.detect_from_bytes(b"dummy_bytes")


def test_roboflow_service_header_auth_initialization():
    """Verify that InferenceHTTPClient is initialized with header-based authorization."""
    mock_sdk = MagicMock()
    mock_client_cls = mock_sdk.InferenceHTTPClient
    mock_config_cls = mock_sdk.InferenceConfiguration
    
    mock_instance = MagicMock()
    mock_client_cls.return_value = mock_instance
    mock_instance.configure.return_value = mock_instance
    
    with patch.dict("sys.modules", {"inference_sdk": mock_sdk}):
        service = RoboflowService(
            model_id="people-detection-o4rdr-3yyvd/1",
            api_key="test_dummy_key_12345",
            api_url="https://serverless.roboflow.com"
        )
        
        # Verify client initialized with api_url and api_key
        mock_client_cls.assert_called_once_with(
            api_url="https://serverless.roboflow.com",
            api_key="test_dummy_key_12345"
        )
        # Verify configured with api_key_transport="header"
        mock_config_cls.assert_called_once_with(api_key_transport="header")
        assert service.is_configured()


def test_roboflow_coordinate_normalization():
    """Verify that center-point (x, y, w, h) coordinates are transformed into [x_min, y_min, w, h]."""
    # Create a 640x480 test image in bytes
    img = Image.new("RGB", (640, 480), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    image_bytes = buf.getvalue()

    mock_client = MagicMock()
    # Roboflow returns predictions centered around (320, 240) with w=100, h=200
    mock_client.infer.return_value = {
        "time": 0.045,
        "image": {"width": 640, "height": 480},
        "predictions": [
            {
                "x": 320.0,
                "y": 240.0,
                "width": 100.0,
                "height": 200.0,
                "confidence": 0.935,
                "class": "person"
            }
        ]
    }

    service = RoboflowService(api_key="mock_key")
    service.client = mock_client

    result = service.detect_from_bytes(image_bytes)
    assert result["objects_count"] == 1
    assert result["model"] == "people-detection-o4rdr-3yyvd/1"
    assert result["engine"] == "roboflow"
    
    detection = result["detections"][0]
    assert detection["class"] == "person"
    assert detection["confidence"] == 0.935
    # Expected: x_min = 320 - 50 = 270, y_min = 240 - 100 = 140, w = 100, h = 200
    assert detection["bbox"] == [270, 140, 100, 200]


@pytest.mark.asyncio
async def test_api_endpoint_roboflow_unconfigured(client: AsyncClient):
    """Verify that /api/v1/detect?engine=roboflow returns HTTP 400 when API key is missing."""
    img = Image.new("RGB", (100, 100), color=(50, 50, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    # Force roboflow unconfigured
    with patch("app.services.roboflow_service.roboflow_service.is_configured", return_value=False):
        response = await client.post(
            f"{settings.API_V1_STR}/detect?engine=roboflow",
            files={"file": ("frame.jpg", buf.getvalue(), "image/jpeg")}
        )
        assert response.status_code == 400
        assert "ROBOFLOW_API_KEY is not configured" in response.json()["detail"]
