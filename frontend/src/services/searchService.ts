import { cameras } from "@/data/cameras";
import { alerts } from "@/data/alerts";
import { incidents } from "@/data/incidents";
import { persons, vehicles } from "@/data/subjects";
import { mockDelay } from "@/lib/apiClient";
import type { SearchResultGroup } from "@/types";

export const searchService = {
  /**
   * Universal Command-Center Search.
   * Aggregates across Persons, Vehicles, Plates, Cameras, Incidents, and Alerts.
   */
  globalSearch: async (query: string): Promise<SearchResultGroup[]> => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const groups: SearchResultGroup[] = [];

    // 1. Incidents
    const matchedIncidents = incidents
      .filter((inc) => inc.id.toLowerCase().includes(q) || inc.title.toLowerCase().includes(q) || inc.summary.toLowerCase().includes(q))
      .map((inc) => ({
        kind: "incident" as const,
        refId: inc.id,
        title: `${inc.id} · ${inc.title}`,
        detail: `Severity: ${inc.severity} · Status: ${inc.status} · Cameras: ${inc.cameraIds.join(", ")}`,
        timestamp: inc.openedAt,
        route: `/incidents/${inc.id}`,
      }));
    if (matchedIncidents.length > 0) {
      groups.push({ group: "Incidents", items: matchedIncidents });
    }

    // 2. Vehicles & Number Plates
    const matchedVehicles = vehicles
      .filter((v) => v.id.toLowerCase().includes(q) || v.plate.toLowerCase().includes(q))
      .map((v) => ({
        kind: "vehicle" as const,
        refId: v.id,
        title: `Vehicle ${v.id} · Plate: ${v.plate}`,
        detail: `Type: ${v.vehicleClass.toUpperCase()} · Color: ${v.color} · Last seen: ${v.lastSeen.cameraId}`,
        timestamp: v.lastSeen.timestamp,
        route: "/tracking/vehicle",
      }));
    if (matchedVehicles.length > 0) {
      groups.push({ group: "Vehicles & Plates", items: matchedVehicles });
    }

    // 3. Persons
    const matchedPersons = persons
      .filter((p) => p.id.toLowerCase().includes(q) || p.label.toLowerCase().includes(q))
      .map((p) => ({
        kind: "person" as const,
        refId: p.id,
        title: `Person ${p.id} · ${p.label}`,
        detail: `First: ${p.firstSeen.cameraId} ➔ Current: ${p.lastSeen.cameraId} · Watchlist: ${p.watchlist ? "YES" : "NO"}`,
        timestamp: p.lastSeen.timestamp,
        route: "/tracking/person",
      }));
    if (matchedPersons.length > 0) {
      groups.push({ group: "Persons Tracked", items: matchedPersons });
    }

    // 4. Cameras
    const matchedCameras = cameras
      .filter((c) => c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q))
      .map((c) => ({
        kind: "camera_sighting" as const,
        refId: c.id,
        title: `${c.id} · ${c.name}`,
        detail: `${c.location} · Status: ${c.status.toUpperCase()} · Scene: ${c.scene}`,
        route: "/surveillance",
      }));
    if (matchedCameras.length > 0) {
      groups.push({ group: "Surveillance Cameras", items: matchedCameras });
    }

    // 5. Alerts
    const matchedAlerts = alerts
      .filter((a) => a.id.toLowerCase().includes(q) || a.type.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
      .map((a) => ({
        kind: "alert" as const,
        refId: a.id,
        title: `${a.id} · ${a.type}`,
        detail: `${a.description} · Camera: ${a.cameraId} · Severity: ${a.severity}`,
        timestamp: a.timestamp,
        route: "/alerts",
      }));
    if (matchedAlerts.length > 0) {
      groups.push({ group: "Alerts", items: matchedAlerts });
    }

    return mockDelay(groups, 100);
  },
};
