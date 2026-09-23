import { cameraService } from "@/services/cameraService";
import type { Camera, CameraHealth } from "@/types";

export interface CameraHealthItem {
  id: string;
  name: string;
  location: string;
  status: Camera["status"];
  health: CameraHealth;
}

export const cameraHealthService = {
  getAll: async (): Promise<CameraHealthItem[]> => {
    const cameras = await cameraService.getAll();
    return cameras.map((c) => ({
      id: c.id,
      name: c.name,
      location: c.location,
      status: c.status,
      health: c.health,
    }));
  },

  getSummary: async () => {
    const cameras = await cameraService.getAll();
    const total = cameras.length || 1;
    const online = cameras.filter((c) => c.status === "online").length;
    const offline = cameras.filter((c) => c.status === "offline").length;
    const degraded = cameras.filter((c) => c.status === "degraded").length;
    const blurCount = cameras.filter((c) => c.health.blur).length;
    const lowFpsCount = cameras.filter((c) => c.health.fps < 20).length;

    return {
      total,
      online,
      offline,
      degraded,
      blurCount,
      lowFpsCount,
      averageUptime: +(
        cameras.reduce((sum, c) => sum + c.health.uptime7d, 0) / total
      ).toFixed(1),
    };
  },
};
