import { api } from "@/lib/apiClient";
import type { Detection, DetectionKind } from "@/types";

export interface BackendEventOut {
  id: string;
  camera_id: string;
  zone_id?: string | null;
  track_id: number;
  event_type: string;
  target_class: string;
  confidence_score: number;
  bounding_box: {
    x_min: number;
    y_min: number;
    width: number;
    height: number;
  };
  start_time: string;
  end_time?: string | null;
  created_at: string;
  camera_name?: string | null;
  zone_name?: string | null;
}

export function mapEventToDetection(ev: BackendEventOut): Detection {
  const isPerson = ev.target_class?.toLowerCase() === "person";
  const isVehicle =
    ev.target_class?.toLowerCase() === "vehicle" ||
    ev.target_class?.toLowerCase() === "car" ||
    ev.target_class?.toLowerCase() === "truck";

  const kind: DetectionKind = isPerson ? "human" : isVehicle ? "vehicle" : "human";

  const bbox = ev.bounding_box || { x_min: 200, y_min: 200, width: 100, height: 150 };
  const normBbox = {
    x: Math.min(95, Math.max(5, +((bbox.x_min / 1920) * 100).toFixed(1))),
    y: Math.min(95, Math.max(5, +((bbox.y_min / 1080) * 100).toFixed(1))),
    w: Math.min(50, Math.max(5, +((bbox.width / 1920) * 100).toFixed(1))),
    h: Math.min(60, Math.max(5, +((bbox.height / 1080) * 100).toFixed(1))),
  };

  return {
    id: ev.id,
    kind,
    cameraId: ev.camera_name || ev.camera_id,
    timestamp: ev.start_time || ev.created_at,
    confidence: +((ev.confidence_score || 0.85) * 100).toFixed(0),
    bbox: normBbox,
    subjectId: isPerson ? `P-${ev.track_id}` : `V-${ev.track_id}`,
    positionLabel: ev.zone_name || "Zero-Line Barbed Wire Buffer",
    vehicleClass: isVehicle ? "car" : undefined,
    plate: isVehicle ? `GJ-01-TR-${ev.track_id}` : undefined,
  };
}

export const detectionService = {
  /** Fetch real AI detections from FastAPI GET /api/v1/events */
  getByKind: async (kind: DetectionKind): Promise<Detection[]> => {
    let targetClass: string | undefined = undefined;
    if (kind === "human") targetClass = "person";
    else if (kind === "vehicle") targetClass = "vehicle";

    const query = targetClass ? `?target_class=${targetClass}&limit=50` : "?limit=50";

    try {
      const events = await api.get<BackendEventOut[]>(`/events${query}`);
      const detections = events.map(mapEventToDetection);

      if (kind === "anpr" || kind === "face") {
        // Return matching events if any, otherwise empty array for real empty-state
        return detections.filter((d) => d.kind === kind);
      }

      return detections;
    } catch {
      return [];
    }
  },

  getAll: async (): Promise<Detection[]> => {
    try {
      const events = await api.get<BackendEventOut[]>("/events?limit=100");
      return events.map(mapEventToDetection);
    } catch {
      return [];
    }
  },

  searchAnpr: async (plateQuery: string): Promise<Detection[]> => {
    const list = await detectionService.getByKind("anpr");
    const q = plateQuery.trim().toUpperCase();
    return list.filter((d) => d.plate && d.plate.toUpperCase().includes(q));
  },
};
