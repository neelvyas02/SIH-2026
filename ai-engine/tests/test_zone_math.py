import pytest
from src.zones.polygon_engine import PolygonZoneEngine, point_in_polygon_raycasting
from src.zones.hysteresis import ZoneHysteresisFilter
from src.detector.yolo_detector import Detection


def test_point_in_polygon_raycasting():
    # Square from (0.2, 0.2) to (0.8, 0.8)
    poly = [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8], [0.2, 0.8]]

    # Center point should be inside
    assert point_in_polygon_raycasting((0.5, 0.5), poly) is True

    # Far point should be outside
    assert point_in_polygon_raycasting((0.1, 0.1), poly) is False
    assert point_in_polygon_raycasting((0.9, 0.9), poly) is False


def test_ground_anchor_calculation():
    # Bounding box from (100, 200) to (300, 600)
    det = Detection(x1=100, y1=200, x2=300, y2=600, confidence=0.85, class_id=0, class_name="person")

    gx, gy = det.ground_anchor
    assert gx == 200.0  # (100 + 300) / 2
    assert gy == 600.0  # bottom of bounding box (feet contact point)


def test_hysteresis_dwell_and_cooldown():
    hyst = ZoneHysteresisFilter(min_dwell_frames=3, cooldown_seconds=5.0)
    zone_id = "test_zone"
    track_id = 101

    # Frame 1: inside (dwell = 1) -> No alert
    assert hyst.update(zone_id, track_id, is_inside=True) is False

    # Frame 2: inside (dwell = 2) -> No alert
    assert hyst.update(zone_id, track_id, is_inside=True) is False

    # Frame 3: inside (dwell = 3 >= min_dwell) -> ALERT!
    assert hyst.update(zone_id, track_id, is_inside=True) is True

    # Frame 4: inside (dwell = 4, but within 5s cooldown) -> No duplicate alert
    assert hyst.update(zone_id, track_id, is_inside=True) is False
