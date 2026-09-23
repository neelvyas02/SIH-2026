import { api } from "@/lib/apiClient";
import { useAlertStore } from "@/store/alertStore";
import type { Alert, AlertStatus, Severity, AlertType } from "@/types";

export interface AlertFilters {
  severity?: Severity;
  type?: string;
  cameraId?: string;
  status?: AlertStatus;
  search?: string;
}

export interface BackendAlertOut {
  id: string;
  event_id: string;
  camera_id: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  resolution_notes?: string | null;
  created_at: string;
  camera_name?: string | null;
  thumbnail_url?: string | null;
  acknowledged_by_name?: string | null;
  resolved_by_name?: string | null;
}

export function mapAlertResponse(a: BackendAlertOut): Alert {
  const sevUpper = (a.severity || "HIGH").toUpperCase() as Severity;
  const statusNorm: AlertStatus =
    a.status === "resolved" ? "closed" : (a.status as AlertStatus) || "new";

  return {
    id: a.id,
    severity: sevUpper,
    type: (a.title || "Virtual Fence Intrusion") as AlertType,
    cameraId: a.camera_name || a.camera_id,
    zoneId: a.camera_name ? `${a.camera_name} Zone` : "Perimeter Sector",
    bopId: a.camera_name?.split("-")[0]?.trim() || "BOP-04",
    timestamp: a.created_at,
    entityRef: a.event_id,
    description: a.description,
    status: statusNorm,
    assignee: a.acknowledged_by_name || a.resolved_by_name || undefined,
    detectionId: a.event_id,
  };
}

export const alertService = {
  /** Fetch alerts from real FastAPI GET /api/v1/alerts */
  getAll: async (filters?: AlertFilters): Promise<Alert[]> => {
    const params = new URLSearchParams();

    if (filters?.status) {
      const backendStatus = filters.status === "closed" ? "resolved" : filters.status;
      params.append("status", backendStatus);
    }
    if (filters?.severity) {
      params.append("severity", filters.severity.toLowerCase());
    }
    if (filters?.cameraId) {
      params.append("camera_id", filters.cameraId);
    }

    params.append("limit", "100");

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const rawAlerts = await api.get<BackendAlertOut[]>(`/alerts${queryString}`);
    let alerts = rawAlerts.map(mapAlertResponse);

    if (filters?.search) {
      const query = filters.search.toLowerCase();
      alerts = alerts.filter(
        (a) =>
          a.id.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.cameraId.toLowerCase().includes(query) ||
          a.type.toLowerCase().includes(query)
      );
    }

    // Sync live alerts into alert store
    useAlertStore.getState().setLiveAlerts(alerts);
    return alerts;
  },

  getById: async (id: string): Promise<Alert | null> => {
    try {
      const raw = await api.get<BackendAlertOut>(`/alerts/${id}`);
      return mapAlertResponse(raw);
    } catch {
      return null;
    }
  },

  /** Acknowledge alert via real backend POST /api/v1/alerts/{id}/acknowledge */
  acknowledge: async (id: string, notes?: string): Promise<Alert> => {
    const raw = await api.post<BackendAlertOut>(`/alerts/${id}/acknowledge`, {
      notes: notes || "Acknowledged in SOC Operations Matrix",
    });
    const mapped = mapAlertResponse(raw);
    useAlertStore.getState().updateAlertStatusInStore(id, "acknowledged");
    return mapped;
  },

  /** Resolve alert via real backend POST /api/v1/alerts/{id}/resolve */
  resolve: async (id: string, resolutionNotes: string = "Sector verified clear"): Promise<Alert> => {
    const raw = await api.post<BackendAlertOut>(`/alerts/${id}/resolve`, {
      resolution_notes: resolutionNotes,
    });
    const mapped = mapAlertResponse(raw);
    useAlertStore.getState().updateAlertStatusInStore(id, "closed");
    return mapped;
  },

  /** Polymorphic updateStatus to support existing Sentinel Watch UI calls */
  updateStatus: async (
    id: string,
    status: AlertStatus,
    assignee?: string
  ): Promise<Alert> => {
    if (status === "acknowledged") {
      return alertService.acknowledge(id, assignee ? `Assigned to ${assignee}` : undefined);
    } else if (status === "closed") {
      return alertService.resolve(id, assignee ? `Resolved by ${assignee}` : "Threat neutralized / resolved");
    } else {
      // Default to acknowledge
      return alertService.acknowledge(id);
    }
  },

  getActiveCount: async (): Promise<number> => {
    const active = await alertService.getAll({ status: "new" });
    return active.length;
  },
};
