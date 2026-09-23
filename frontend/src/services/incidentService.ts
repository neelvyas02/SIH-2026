import { incidents } from "@/data/incidents";
import { mockDelay, clone } from "@/lib/apiClient";
import type { Incident, IncidentStatus, Severity } from "@/types";

let liveIncidents: Incident[] = clone(incidents);

export const incidentService = {
  getAll: async (status?: IncidentStatus): Promise<Incident[]> => {
    let result = clone(liveIncidents);
    if (status) {
      result = result.filter((inc) => inc.status === status);
    }
    return mockDelay(result, 120);
  },

  getById: async (id: string): Promise<Incident | null> => {
    const inc = liveIncidents.find((i) => i.id === id);
    return mockDelay(inc ? clone(inc) : null, 100);
  },

  updateStatus: async (id: string, status: IncidentStatus): Promise<Incident> => {
    const idx = liveIncidents.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error(`Incident ${id} not found`);
    liveIncidents[idx] = {
      ...liveIncidents[idx],
      status,
      updatedAt: new Date().toISOString(),
    };
    return mockDelay(clone(liveIncidents[idx]), 120);
  },

  getActiveCount: async (): Promise<number> => {
    const count = liveIncidents.filter((i) => i.status !== "closed").length;
    return mockDelay(count, 50);
  },
};
