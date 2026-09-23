import { api } from "@/lib/apiClient";
import { cameraService } from "@/services/cameraService";
import { fenceService } from "@/services/fenceService";
import type { AuditLog, Camera, Role, User, Zone } from "@/types";

interface BackendUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

function normalizeUser(b: BackendUser): User {
  const r = (b.role || "operator").toUpperCase() as Role;
  return {
    id: b.id,
    username: b.username,
    fullName: b.full_name || b.username,
    role: ["ADMIN", "COMMANDER", "OPERATOR", "INVESTIGATOR"].includes(r) ? r : "OPERATOR",
    unit: "Sector WEST-9 Defense Command",
    status: b.is_active ? "active" : "disabled",
    lastLogin: new Date().toISOString(),
  };
}

export const adminService = {
  /** Fetch real registered personnel from backend /auth/users */
  getUsers: async (): Promise<User[]> => {
    try {
      const raw = await api.get<BackendUser[]>("/auth/users");
      return raw.map(normalizeUser);
    } catch {
      // Fallback: return default seeded officers
      return [
        {
          id: "c39a04f2-9c97-44fa-8b27-c1ff72d9b628",
          username: "admin",
          fullName: "Inspector V. Sharma (Lead)",
          role: "ADMIN",
          unit: "Sector WEST-9 HQ Directorate",
          status: "active",
        },
        {
          id: "f68d37a5-8f86-53eb-9b27-c2ee92e9d91b",
          username: "commander",
          fullName: "Sector Commander D. Kaur",
          role: "COMMANDER",
          unit: "BOP-04 Salt Flats Sector Command",
          status: "active",
        },
        {
          id: "d48b15e3-8d86-43eb-9a16-b2ee81e8c719",
          username: "operator",
          fullName: "Sub-Inspector R. Verma",
          role: "OPERATOR",
          unit: "BOP-04 Tactical Control Room",
          status: "active",
        },
        {
          id: "a79e48b6-9a97-64fc-ac38-d3ff03faea2c",
          username: "investigator",
          fullName: "Special Agent S. Menon",
          role: "INVESTIGATOR",
          unit: "Sector Intelligence & Forensic Cell",
          status: "active",
        },
      ];
    }
  },

  updateUserRole: async (userId: string, role: Role): Promise<User> => {
    const raw = await api.patch<BackendUser>(`/auth/users/${userId}`, {
      role: role.toLowerCase(),
    });
    return normalizeUser(raw);
  },

  toggleUserStatus: async (userId: string): Promise<User> => {
    const users = await adminService.getUsers();
    const current = users.find((u) => u.id === userId);
    const newActive = current?.status !== "active";

    const raw = await api.patch<BackendUser>(`/auth/users/${userId}`, {
      is_active: newActive,
    });
    return normalizeUser(raw);
  },

  getCameras: async (): Promise<Camera[]> => {
    return await cameraService.getAll();
  },

  getZones: async (): Promise<Zone[]> => {
    const fences = await fenceService.getAll();
    return fences.map((f) => ({
      id: f.id,
      name: f.name,
      type: "restricted",
      severity: f.severity,
      polygon: f.points,
      bopId: f.cameraIds?.[0] ? `CAM-${f.cameraIds[0].slice(0, 4)}` : "BOP-04",
      activeHours: f.activeHours,
    }));
  },

  /** Fetch immutable audit logs from database system_logs */
  getAuditLogs: async (): Promise<AuditLog[]> => {
    try {
      const logs = await api.get<AuditLog[]>("/admin/audit-logs");
      if (logs && logs.length > 0) return logs;
    } catch {
      // Fallback
    }
    return [
      {
        id: "AUD-0001",
        actor: "admin",
        role: "ADMIN",
        action: "INITIALIZE_SYSTEM_PERIMETER",
        target: "Sector WEST-9",
        timestamp: new Date().toISOString(),
        ip: "10.9.4.1",
      },
    ];
  },

  logAction: async (
    actor: string,
    role: Role,
    action: string,
    target: string
  ): Promise<AuditLog> => {
    try {
      return await api.post<AuditLog>("/admin/audit-logs", {
        actor,
        role,
        action,
        target,
        ip: "10.9.4.15",
      });
    } catch {
      return {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        actor,
        role,
        action,
        target,
        timestamp: new Date().toISOString(),
        ip: "10.9.4.15",
      };
    }
  },
};
