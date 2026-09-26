import { api } from "@/lib/apiClient";

export interface AIModelMeta {
  filename: string;
  path: string;
  label: string;
  category: string;
  size_mb: number;
  recommended: boolean;
  classes: string[];
}

export interface AIEngineTelemetryStats {
  total_persons: number;
  total_weapons: number;
  total_explosives: number;
  total_suspicious: number;
  armed_suspects: number;
  threat_level: "NORMAL" | "ELEVATED_RISK" | "CRITICAL_THREAT";
  last_threat_time?: string | null;
}

export interface AIEngineDetection {
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, w, h]
  track_id?: number | null;
}

export interface AIEngineStatus {
  is_running: boolean;
  source: string;
  model_name: string;
  conf_thresh: number;
  iou_thresh: number;
  use_pose: boolean;
  enable_tracking: boolean;
  enable_iff: boolean;
  save_evidence: boolean;
  uptime_seconds: number;
  frame_count: number;
  fps: number;
  stats: AIEngineTelemetryStats;
  detections: AIEngineDetection[];
}

export interface AILogEntry {
  timestamp: string;
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
}

export interface StartEnginePayload {
  source: string;
  model_name: string;
  conf_thresh: number;
  iou_thresh?: number;
  use_pose: boolean;
  enable_tracking: boolean;
  enable_iff: boolean;
  save_evidence: boolean;
}

export const aiEngineService = {
  getStatus: async (): Promise<AIEngineStatus> => {
    try {
      return await api.get<AIEngineStatus>("/ai-engine/status");
    } catch {
      return {
        is_running: false,
        source: "0",
        model_name: "best.pt",
        conf_thresh: 0.25,
        iou_thresh: 0.45,
        use_pose: false,
        enable_tracking: true,
        enable_iff: true,
        save_evidence: true,
        uptime_seconds: 0,
        frame_count: 0,
        fps: 0,
        stats: {
          total_persons: 0,
          total_weapons: 0,
          total_explosives: 0,
          total_suspicious: 0,
          armed_suspects: 0,
          threat_level: "NORMAL",
        },
        detections: [],
      };
    }
  },

  getModels: async (): Promise<AIModelMeta[]> => {
    try {
      return await api.get<AIModelMeta[]>("/ai-engine/models");
    } catch {
      return [
        {
          filename: "best.pt",
          path: "models/best.pt",
          label: "Threat Sentinel (Weapons & Persons)",
          category: "Tactical Sentinel",
          size_mb: 6.2,
          recommended: true,
          classes: ["gun", "person", "weapon"],
        },
        {
          filename: "weapon_gun_knife_yolo11n.pt",
          path: "models/weapon_gun_knife_yolo11n.pt",
          label: "Weapon Sentinel (Guns & Knives YOLO11)",
          category: "Weapons Detection",
          size_mb: 5.5,
          recommended: false,
          classes: ["gun", "knife", "pistol", "rifle"],
        },
        {
          filename: "best_thermal.pt",
          path: "models/best_thermal.pt",
          label: "Thermal Tactical FLIR Sentinel",
          category: "Thermal & Night Vision",
          size_mb: 22.5,
          recommended: false,
          classes: ["thermal_person"],
        },
      ];
    }
  },

  start: async (payload: StartEnginePayload) => {
    return await api.post<{ status: string; message: string; config?: any }>("/ai-engine/start", payload);
  },

  stop: async () => {
    return await api.post<{ status: string; message: string }>("/ai-engine/stop");
  },

  getLogs: async (limit: number = 50): Promise<AILogEntry[]> => {
    try {
      const res = await api.get<{ logs: AILogEntry[] }>(`/ai-engine/logs?limit=${limit}`);
      return res.logs || [];
    } catch {
      return [];
    }
  },

  detectFrame: async (
    frameBlob: Blob,
    modelName?: string,
    confThresh: number = 0.25,
    usePose: boolean = false
  ) => {
    const formData = new FormData();
    formData.append("file", frameBlob, "webcam_frame.jpg");
    const query = new URLSearchParams();
    if (modelName) query.set("model_name", modelName);
    query.set("conf_thresh", confThresh.toString());
    query.set("use_pose", usePose ? "true" : "false");

    return await api.post<any>(`/ai-engine/detect-frame?${query.toString()}`, formData);
  },

  uploadMedia: async (
    file: File,
    modelName: string = "best.pt",
    confThresh: number = 0.25,
    usePose: boolean = false
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("model_name", modelName);
    formData.append("conf_thresh", confThresh.toString());
    formData.append("use_pose", usePose ? "true" : "false");

    return await api.post<any>("/ai-engine/upload-media", formData);
  },

  getStreamUrl: () => {
    return `/api/v1/ai-engine/stream?t=${Date.now()}`;
  },
};
