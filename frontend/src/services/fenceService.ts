import { api } from "@/lib/apiClient";
import type { VirtualFence, Severity } from "@/types";

export interface BackendZoneOut {
  id: string;
  camera_id: string;
  name: string;
  zone_type: string;
  polygon_coordinates: number[][];
  severity_level: string;
  dwell_time_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function mapZoneToVirtualFence(z: BackendZoneOut): VirtualFence {
  const points = (z.polygon_coordinates || []).map(([x, y]) => ({
    lat: 24.1200 + (y || 0) * 0.012,
    lng: 70.5400 + (x || 0) * 0.015,
  }));

  return {
    id: z.id,
    name: z.name,
    shape: "polygon",
    points: points.length > 0 ? points : [{ lat: 24.125, lng: 70.545 }, { lat: 24.128, lng: 70.550 }],
    severity: (z.severity_level || "HIGH").toUpperCase() as Severity,
    direction: "both",
    activeHours: `24x7 (${z.dwell_time_threshold}s loiter threshold)`,
    cameraIds: [z.camera_id],
    alertType: `${(z.zone_type || "restricted").toUpperCase()} Breach`,
    enabled: z.is_active,
  };
}

export const fenceService = {
  /** Fetch all zones from real backend GET /api/v1/zones */
  getAll: async (): Promise<VirtualFence[]> => {
    try {
      const raw = await api.get<BackendZoneOut[]>("/zones");
      return raw.map(mapZoneToVirtualFence);
    } catch {
      // Fallback: fetch from cameras if /zones direct is empty
      const cameras = await api.get<{ id: string }[]>("/cameras");
      const allZones: VirtualFence[] = [];
      for (const cam of cameras) {
        try {
          const zList = await api.get<BackendZoneOut[]>(`/cameras/${cam.id}/zones`);
          allZones.push(...zList.map(mapZoneToVirtualFence));
        } catch {
          // Continue
        }
      }
      return allZones;
    }
  },

  getById: async (id: string): Promise<VirtualFence | null> => {
    const all = await fenceService.getAll();
    return all.find((f) => f.id === id) || null;
  },

  /** Toggle fence/zone active state on backend */
  toggleEnabled: async (id: string): Promise<VirtualFence> => {
    const existing = await fenceService.getById(id);
    if (!existing) throw new Error(`Zone ${id} not found`);

    const updated = await api.put<BackendZoneOut>(`/zones/${id}`, {
      is_active: !existing.enabled,
    });
    return mapZoneToVirtualFence(updated);
  },

  /** Create a new restricted zone polygon on backend */
  create: async (data: Omit<VirtualFence, "id">): Promise<VirtualFence> => {
    const cameraId = data.cameraIds?.[0] || "b1a23e54-7890-4c12-a345-6789abcdef01";

    const coords = data.points.map((p) => [
      Math.min(1.0, Math.max(0.0, +((p.lng - 70.5400) / 0.015).toFixed(2))),
      Math.min(1.0, Math.max(0.0, +((p.lat - 24.1200) / 0.012).toFixed(2))),
    ]);

    const created = await api.post<BackendZoneOut>(`/cameras/${cameraId}/zones`, {
      name: data.name,
      zone_type: "restricted",
      polygon_coordinates: coords.length >= 3 ? coords : [[0.1, 0.1], [0.8, 0.1], [0.8, 0.8], [0.1, 0.8]],
      severity_level: data.severity.toLowerCase(),
      dwell_time_threshold: 2,
      is_active: true,
    });

    return mapZoneToVirtualFence(created);
  },

  delete: async (id: string): Promise<boolean> => {
    await api.del(`/zones/${id}`);
    return true;
  },
};
