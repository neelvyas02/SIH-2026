from typing import List, Tuple
import logging

logger = logging.getLogger("borderguard.polygon_engine")


def point_in_polygon_raycasting(point: Tuple[float, float], polygon: List[List[float]]) -> bool:
    """Ray casting algorithm to test if a point (x, y) is inside a polygon."""
    x, y = point
    n = len(polygon)
    inside = False

    p1x, p1y = polygon[0]
    for i in range(n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y

    return inside


class PolygonZoneEngine:
    """Spatial analysis engine calculating ground-contact zone containment."""

    def __init__(self, zone_id: str, name: str, polygon_coords: List[List[float]], severity: str = "critical"):
        self.zone_id = zone_id
        self.name = name
        self.polygon_coords = polygon_coords
        self.severity = severity
        self.shapely_poly = None

        try:
            from shapely.geometry import Polygon
            self.shapely_poly = Polygon(self.polygon_coords)
        except Exception:
            self.shapely_poly = None

    def contains_point(self, norm_x: float, norm_y: float) -> bool:
        """Tests whether a normalized coordinate [0.0 - 1.0] lies inside the zone."""
        if self.shapely_poly is not None:
            try:
                from shapely.geometry import Point
                pt = Point(norm_x, norm_y)
                return self.shapely_poly.contains(pt)
            except Exception:
                pass
        
        return point_in_polygon_raycasting((norm_x, norm_y), self.polygon_coords)

    def check_tracked_object(self, track, frame_width: int, frame_height: int) -> bool:
        """Evaluates whether the bottom-center contact point of the tracked object is inside the zone."""
        gx, gy = track.detection.ground_anchor
        norm_x = gx / float(frame_width)
        norm_y = gy / float(frame_height)
        return self.contains_point(norm_x, norm_y)
